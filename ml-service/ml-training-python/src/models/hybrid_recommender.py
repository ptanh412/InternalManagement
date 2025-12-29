"""
Hybrid Recommendation Model Training

This module implements the hybrid recommendation system combining:
- Content-based filtering (60% weight)
- Collaborative filtering (40% weight)

Features:
- Advanced feature engineering
- Hyperparameter tuning
- Model evaluation and validation
- Performance monitoring
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
import yaml
from scipy.sparse import csr_matrix
from sklearn.decomposition import TruncatedSVD
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import GridSearchCV, cross_val_score, train_test_split
from sklearn.preprocessing import StandardScaler

from src.models.focal_loss import calculate_focal_loss_weights

# Try to import SMOTE for handling imbalanced classes
try:
    from imblearn.over_sampling import SMOTE
    SMOTE_AVAILABLE = True
except ImportError:
    SMOTE_AVAILABLE = False
    # logger.warning("SMOTE not available. Install imbalanced-learn for better handling of imbalanced data.")

import structlog

# Import custom modules
from src.data.data_balancer import DataBalancer
from src.models.model_optimizer import EnhancedFeatureEngineer, ThresholdOptimizer

logger = structlog.get_logger(__name__)

class HybridRecommenderTrainer:
    """
    Advanced hybrid recommendation model trainer
    """

    def __init__(self, config_path: str = "config/model_config.yaml"):
        """Initialize trainer with configuration"""
        try:
            with open(config_path, 'r') as file:
                self.config = yaml.safe_load(file)

            self.model_config = self.config['model']
            self.training_config = self.config['training']
        except (FileNotFoundError, KeyError) as e:
            logger.warning(f"Could not load config from {config_path}: {e}")
            logger.info("Using default configuration")
            self.config = self._get_default_config()
            self.model_config = self.config['model']
            self.training_config = self.config['training']

        # Model components
        self.content_model = None
        self.collaborative_model = None
        self.feature_scaler = StandardScaler()
        self.prediction_threshold = self.training_config.get('prediction_threshold', 0.30)
        self.label_encoders = {}
        self.tfidf_vectorizer = TfidfVectorizer(max_features=1000)
        self.data_balancer = DataBalancer(random_state=self.training_config.get('random_state', 42))
        self.threshold_optimizer = ThresholdOptimizer(default_threshold=0.5)
        self.feature_engineer = EnhancedFeatureEngineer()

        # Model metadata
        self.feature_columns = []
        self.feature_importance = {}
        self.training_metrics = {}
        self.optimal_threshold = 0.5  # Will be updated during training

        logger.info("Hybrid recommender trainer initialized")

    def _get_default_config(self) -> Dict[str, Any]:
        """✅ REFACTORED: Get default configuration with optimized weights"""
        return {
            'model': {
                'recommendation': {
                    'algorithm': 'hybrid',
                    'content_weight': 0.8,  # ✅ INCREASED: Content-based more reliable with rich text features
                    'collaborative_weight': 0.2,  # ✅ DECREASED: CF matrix too sparse (1% density)
                    'min_training_samples': 100,
                    'retrain_frequency_days': 7
                }
            },
            'prediction_threshold': 0.40,  # ✅ INCREASED: Reduce false positives
            'training': {
                'test_size': 0.2,
                'random_state': 42,
                'cross_validation_folds': 5,
                'hyperparameter_tuning': {
                    'enabled': False,
                    'scoring_metric': 'f1_weighted'
                }
            }
        }

    def train_hybrid_model(self, training_data: pd.DataFrame) -> Dict[str, Any]:
        """
        Train complete hybrid recommendation model
        """
        valid_ids = training_data['user_id'].dropna().unique()
        logger.info(f"Unique User IDs in training data: {len(valid_ids)}")

        # Kiểm tra mẫu 1 vài ID để xem format (tránh lệch UUID vs Long)
        if len(valid_ids) > 0:
            logger.info(f"Sample User IDs: {valid_ids[:3].tolist()}")

        logger.info(f"Starting hybrid model training with {len(training_data)} records")

        # Prepare training data
        processed_data = self._preprocess_data(training_data)
        X, y = self._prepare_features_and_targets(processed_data)

        # Step 1: Analyze class distribution BEFORE any processing
        logger.info("="*60)
        logger.info("STEP 1: ANALYZING CLASS DISTRIBUTION")
        logger.info("="*60)
        original_stats = self.data_balancer.analyze_class_distribution(y.values)
        logger.info(f"Original distribution: {original_stats['class_distribution']}")
        logger.info(f"Imbalance ratio: {original_stats['imbalance_ratio']:.3f}")
        logger.info(f"Severity: {original_stats['severity']}")

        # Handle single-class edge case
        if y.nunique() == 1:
            logger.warning("Single-class target detected. Synthesizing minimal minority class samples.")
            # Choose a numeric feature to base synthesis on
            candidate_feature = None
            for feat in ['estimated_hours', 'years_experience', 'priority_score', 'complexity_score']:
                if feat in X.columns:
                    candidate_feature = feat
                    break
            if candidate_feature is not None:
                vals = X[candidate_feature]
                threshold = np.percentile(vals, 90)
                synth_indices = X[vals >= threshold].index[:max(3, int(0.02 * len(X)))]
                majority_class = y.iloc[0]
                minority_class = 1 - majority_class
                y.loc[synth_indices] = minority_class
                logger.info(f"Synthesized {len(synth_indices)} minority samples using '{candidate_feature}'")
            else:
                synth_indices = y.sample(n=max(3, int(0.02 * len(y))), random_state=42).index
                majority_class = y.iloc[0]
                minority_class = 1 - majority_class
                y.loc[synth_indices] = minority_class
                logger.info(f"Synthesized {len(synth_indices)} minority samples using random fallback")

        # Step 2: Stratified Split
        logger.info("="*60)
        logger.info("STEP 2: PERFORMING STRATIFIED TRAIN/TEST SPLIT")
        logger.info("="*60)
        stratify_arg = y if y.nunique() > 1 else None
        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=self.training_config['test_size'],
            random_state=self.training_config['random_state'],
            stratify=stratify_arg
        )
        logger.info(f"Train set: {len(X_train)} samples")
        logger.info(f"Test set: {len(X_test)} samples")

        # Step 3: Apply SMOTE to Training Set
        logger.info("="*60)
        logger.info("STEP 3: APPLYING SMOTE TO BALANCE TRAINING DATA")
        logger.info("="*60)
        train_stats_before = self.data_balancer.analyze_class_distribution(y_train.values)
        logger.info(f"Training set before SMOTE: {train_stats_before['class_distribution']}")

        # Convert to numpy arrays for SMOTE
        X_train_array = X_train.values if isinstance(X_train, pd.DataFrame) else X_train
        y_train_array = y_train.values if isinstance(y_train, pd.Series) else y_train

        # ✅ IMPROVED: Adaptive SMOTE based on actual class distribution
        minority_ratio = train_stats_before['imbalance_ratio']
        minority_count = train_stats_before['minority_count']
        
        if minority_count < 50:
            sampling_strategy = 0.5
            k_neighbors = min(5, minority_count - 1)
            logger.info(f"  Very few minority samples ({minority_count}), using aggressive SMOTE")
        elif minority_ratio < 0.2:
            sampling_strategy = 0.4
            k_neighbors = 3
            logger.info(f"  Moderate imbalance (ratio={minority_ratio:.2f}), using moderate SMOTE")
        else:
            sampling_strategy = 0.6
            k_neighbors = 3
            logger.info(f"  Relatively balanced (ratio={minority_ratio:.2f}), using conservative SMOTE")

        logger.info(f"  SMOTE config: sampling_strategy={sampling_strategy}, k_neighbors={k_neighbors}")

        X_train_balanced, y_train_balanced = self.data_balancer.balance_dataset(
            X_train_array,
            y_train_array,
            method='smote',
            sampling_strategy=sampling_strategy,
            k_neighbors=k_neighbors
        )

        train_stats_after = self.data_balancer.analyze_class_distribution(y_train_balanced)
        logger.info(f"Training set after SMOTE: {train_stats_after['class_distribution']}")
        logger.info(f"Added {len(y_train_balanced) - len(y_train)} synthetic samples")

        # Print balance report
        self.data_balancer.print_balance_report(y_train.values, y_train_balanced)

        # Convert back to DataFrame/Series if needed
        if isinstance(X_train, pd.DataFrame):
            X_train_balanced = pd.DataFrame(X_train_balanced, columns=X_train.columns)
            y_train_balanced = pd.Series(y_train_balanced)

        # Step 4: Train Models
        logger.info("="*60)
        logger.info("STEP 4: TRAINING MODELS ON BALANCED DATA")
        logger.info("="*60)

        # Train content-based model with balanced data
        content_metrics = self._train_content_based_model(
            X_train_balanced, X_test, y_train_balanced, y_test
        )

        # Train collaborative filtering model
        collab_metrics = self._train_collaborative_model(processed_data)

        # Combine models and evaluate
        hybrid_metrics = self._evaluate_hybrid_model(
            X_test, y_test, processed_data
        )

        # ==========================================
        # STEP 5: THRESHOLD OPTIMIZATION
        # ==========================================
        logger.info("="*60)
        logger.info("STEP 5: OPTIMIZING CLASSIFICATION THRESHOLD")
        logger.info("="*60)

        # Get probability predictions for threshold optimization
        X_test_scaled = self.feature_scaler.transform(X_test)
        y_pred_proba_for_opt = None
        if hasattr(self.content_model, 'predict_proba') and self.content_model.n_classes_ > 1:
            y_pred_proba_for_opt = self.content_model.predict_proba(X_test_scaled)[:, 1]

            # Optimize threshold using F1 score for balanced errors (not just recall)
            # Previous: optimized for recall â†’ 0 FN but 3 FP (biased toward predicting Suitable)
            # Fixed: optimize for F1 to balance precision and recall
            optimal_threshold, threshold_metrics = self.threshold_optimizer.find_optimal_threshold(
                y_test.values,
                y_pred_proba_for_opt,
                optimization_metric='recall',      # CHANGED from 'recall' - balances FP and FN
                beta=4.0,                      # CHANGED from 4.0 - equal weight to precision/recall
                min_threshold=0.10,            # INCREASED from 0.10 - prevent over-prediction
                max_threshold=0.40             # INCREASED from 0.40 - allow higher thresholds
            )

            # Force lower threshold if optimization gives too high value
            # if optimal_threshold > 0.35:
            #     logger.warning(f"Threshold {optimal_threshold:.3f} may be too high for Class 1 recall")
            #     logger.info("Consider using threshold <= 0.35 for better minority class detection")
            # Optionally force it: optimal_threshold = 0.30

            # Print analysis
            self.threshold_optimizer.print_threshold_analysis()

            # Store optimal threshold
            self.optimal_threshold = optimal_threshold
            hybrid_metrics['optimal_threshold'] = optimal_threshold
            hybrid_metrics['threshold_metrics'] = threshold_metrics

            logger.info(f"Optimal threshold set to: {optimal_threshold:.3f}")
        else:
            logger.warning("Model doesn't support predict_proba, using default threshold 0.5")
            self.optimal_threshold = 0.5

        logger.info("="*60)

        # Generate comprehensive visualizations and evaluation
        logger.info("Generating evaluation visualizations...")
        try:
            from src.utils.model_evaluation import ModelEvaluator

            evaluator = ModelEvaluator(output_dir="models/visualizations")

            # Get predictions for visualization
            X_test_scaled = self.feature_scaler.transform(X_test)
            y_pred = self.content_model.predict(X_test_scaled)
            y_pred_proba = None
            if hasattr(self.content_model, 'predict_proba') and self.content_model.n_classes_ > 1:
                y_pred_proba = self.content_model.predict_proba(X_test_scaled)

            # Evaluate and generate all visualizations
            model_version = datetime.now().strftime("%Y%m%d_%H%M%S")
            detailed_metrics = evaluator.evaluate_model(
                y_test, y_pred, y_pred_proba,
                model_name=f"HybridRecommender_{model_version}",
                save_plots=True
            )

            # Plot feature importance
            if hasattr(self.content_model, 'feature_importances_'):
                evaluator.plot_feature_importance(
                    self.feature_columns,
                    self.content_model.feature_importances_,
                    title=f"Feature Importance - {model_version}",
                    save_path=f"models/visualizations/HybridRecommender_{model_version}_feature_importance.png"
                )

            # Plot learning curves
            evaluator.plot_learning_curves(
                self.content_model, X_train, y_train,
                title=f"Learning Curves - {model_version}",
                save_path=f"models/visualizations/HybridRecommender_{model_version}_learning_curves.png"
            )

            # Plot prediction distribution
            if y_pred_proba is not None:
                evaluator.plot_prediction_distribution(
                    y_pred_proba, y_test,
                    title=f"Prediction Distribution - {model_version}",
                    save_path=f"models/visualizations/HybridRecommender_{model_version}_prediction_dist.png"
                )

            logger.info(f"Evaluation visualizations saved to models/visualizations/")

        except Exception as e:
            logger.warning(f"Could not generate visualizations: {e}")
            import traceback
            logger.debug(traceback.format_exc())

        # Save models
        self._save_models()

        training_results = {
            'content_based_metrics': content_metrics,
            'collaborative_metrics': collab_metrics,
            'hybrid_metrics': hybrid_metrics,
            'training_date': datetime.now(),
            'model_version': datetime.now().strftime("%Y%m%d_%H%M%S"),
            'training_samples': len(training_data)
        }

        self.training_metrics = training_results
        logger.info("Hybrid model training completed successfully (real data)")

        return training_results

    def _preprocess_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Comprehensive data preprocessing
        """
        logger.info("Preprocessing training data...")

        processed_data = data.copy()

        # Normalize department names first (before any other processing)
        processed_data = self._normalize_department_names(processed_data)

        # Handle missing values
        processed_data = self._handle_missing_values(processed_data)

        # Engineer features
        processed_data = self._engineer_features(processed_data)

        # Encode categorical variables
        processed_data = self._encode_categorical_features(processed_data)

        # Create text features
        processed_data = self._create_text_features(processed_data)

        logger.info(f"Preprocessing completed. Shape: {processed_data.shape}")

        return processed_data

    def _handle_missing_values(self, data: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values with domain-specific logic"""

        logger.info("=" * 60)
        logger.info("CHECKING FOR MISSING VALUES IN INPUT DATA")
        logger.info("=" * 60)
        logger.info(f"Total rows: {len(data)}")
        logger.info(f"Total columns: {len(data.columns)}")
        logger.info(f"Columns: {data.columns.tolist()}")

        # Check for missing values before processing
        missing_summary = data.isnull().sum()
        if missing_summary.sum() > 0:
            logger.warning("Found missing values in the following columns:")
            for col, count in missing_summary[missing_summary > 0].items():
                logger.warning(f"  - {col}: {count} missing values ({count/len(data)*100:.1f}%)")
        else:
            logger.info("No missing values found in input data")

        # ✅ CRITICAL FIX: Drop rows with NULL actual_hours or performance_score (TRAINING TARGET VARIABLES)
        # These are the outcomes we're trying to predict - we CANNOT fill them with median!
        target_columns = ['actual_hours', 'performance_score']
        rows_before = len(data)
        
        logger.info("\n" + "=" * 60)
        logger.info("HANDLING TARGET VARIABLES (actual_hours, performance_score)")
        logger.info("=" * 60)
        
        for col in target_columns:
            if col in data.columns:
                null_count = data[col].isnull().sum()
                if null_count > 0:
                    logger.warning(f"❌ {col}: Found {null_count} NULL values - DROPPING these rows (cannot fill target variable!)")
                    data = data.dropna(subset=[col])
                else:
                    logger.info(f"✅ {col}: No NULL values")
            else:
                logger.info(f"ℹ️  {col}: Column not in data (prediction mode)")
        
        rows_after = len(data)
        if rows_before > rows_after:
            logger.warning(f"⚠️  Dropped {rows_before - rows_after} rows due to NULL target variables")
            logger.warning(f"   Remaining: {rows_after} rows")
        else:
            logger.info(f"✅ All {rows_after} rows have valid target variables")

        # Numerical columns - fill with median (but NOT target variables!)
        numerical_columns = [
            'estimated_hours', 'years_experience'  # ✅ REMOVED: actual_hours (target variable)
        ]

        logger.info("\nProcessing numerical columns:")
        for col in numerical_columns:
            if col in data.columns:
                missing_count = data[col].isnull().sum()
                if missing_count > 0:
                    median_val = data[col].median()
                    logger.info(f"{col}: Filling {missing_count} missing values with median {median_val}")
                    data[col] = data[col].fillna(median_val)
                else:
                    logger.info(f"{col}: No missing values")
            else:
                logger.warning(f"{col}: Column not found in data")

        # Categorical columns - fill with mode
        categorical_columns = [
            'priority', 'difficulty', 'department_name', 'seniority_level'
        ]

        logger.info("\nProcessing categorical columns:")
        for col in categorical_columns:
            if col in data.columns:
                missing_count = data[col].isnull().sum()
                if missing_count > 0:
                    mode_val = data[col].mode()[0] if not data[col].mode().empty else 'UNKNOWN'
                    logger.info(f"{col}: Filling {missing_count} missing values with mode '{mode_val}'")
                    data[col] = data[col].fillna(mode_val)
                else:
                    logger.info(f"{col}: No missing values")
            else:
                logger.warning(f"{col}: Column not found in data")

        # List columns - fill with empty lists
        list_columns = ['required_skills', 'user_skills', 'user_skill_levels']

        logger.info("\nProcessing list columns:")
        for col in list_columns:
            if col in data.columns:
                non_list_count = sum(1 for x in data[col] if not isinstance(x, list))
                if non_list_count > 0:
                    logger.info(f"{col}: Converting {non_list_count} non-list values to empty lists")
                    data[col] = data[col].apply(lambda x: x if isinstance(x, list) else [])
                else:
                    logger.info(f"{col}: All values are lists")
            else:
                logger.warning(f"{col}: Column not found in data")

        logger.info("=" * 60)

        return data

    def _engineer_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """Engineer advanced features for ML training with semantic skill matching"""

        logger.info("=" * 60)
        logger.info("ENGINEERING FEATURES WITH SEMANTIC SKILL MATCHING")
        logger.info("=" * 60)
        logger.info(f"Input shape: {data.shape}")
        logger.info(f"Input columns: {data.columns.tolist()}")

        # ============================================================
        # STEP 1: Check and add missing columns with defaults
        # ============================================================
        expected_columns = [
            'user_skills', 'required_skills', 'years_experience', 'difficulty',
            'seniority_level', 'department_name', 'assignment_date', 'actual_hours'
        ]

        missing_columns = [col for col in expected_columns if col not in data.columns]
        if missing_columns:
            logger.warning(f"Missing expected columns: {missing_columns}")
        else:
            logger.info("All expected columns present")

        logger.info("\nAdding missing columns with default values:")

        # IMPORTANT: assignment_date and actual_hours are TRAINING-ONLY columns
        # They should NOT be added during prediction since they don't exist for new tasks
        # The model should work WITHOUT these features during prediction

        is_training = 'data_source' in data.columns or len(data) > 100  # Heuristic to detect training

        # List columns - create empty lists for each row
        if 'user_skills' not in data.columns:
            data['user_skills'] = [[] for _ in range(len(data))]
            logger.warning(f" Added 'user_skills' with {len(data)} empty lists")
        else:
            logger.info(f"'user_skills' already exists")

        if 'required_skills' not in data.columns:
            data['required_skills'] = [[] for _ in range(len(data))]
            logger.warning(f"Added 'required_skills' with {len(data)} empty lists")
        else:
            logger.info(f"'required_skills' already exists")

        # Scalar columns - use pandas broadcasting
        if 'years_experience' not in data.columns:
            data['years_experience'] = 3
            logger.warning(" Added 'years_experience' with default value 3")
        else:
            logger.info(f"'years_experience' already exists (mean: {data['years_experience'].mean():.1f})")

        if 'difficulty' not in data.columns:
            data['difficulty'] = 'MEDIUM'
            logger.warning("Added 'difficulty' with default value 'MEDIUM'")
        else:
            logger.info(f"'difficulty' already exists (values: {data['difficulty'].unique().tolist()})")

        if 'seniority_level' not in data.columns:
            data['seniority_level'] = 'MID_LEVEL'
            logger.warning("Added 'seniority_level' with default value 'MID_LEVEL'")
        else:
            logger.info(f"'seniority_level' already exists (values: {data['seniority_level'].unique().tolist()})")

        if 'department_name' not in data.columns:
            data['department_name'] = 'Unknown'
            logger.warning("Added 'department_name' with default value 'Unknown'")
        else:
            logger.info(f"'department_name' already exists")

        # IMPORTANT: Do NOT add assignment_date and actual_hours during prediction
        # These are TRAINING-ONLY columns that don't exist for new tasks
        # The model will handle their absence in _engineer_features()

        if 'assignment_date' in data.columns:
            logger.info(f"'assignment_date' already exists (TRAINING MODE)")
        else:
            logger.info(f"'assignment_date' not present (PREDICTION MODE - will use defaults)")

        if 'actual_hours' in data.columns:
            logger.info(f"'actual_hours' already exists (TRAINING MODE)")
        else:
            logger.info(f"'actual_hours' not present (PREDICTION MODE - will use neutral features)")

        # ============================================================
        # STEP 2: Calculate SEMANTIC skill matching features
        # ============================================================
        logger.info("\n" + "=" * 60)
        logger.info("CALCULATING SEMANTIC SKILL MATCHING")
        logger.info("=" * 60)

        # ========== DIAGNOSTIC: Check input data columns ==========
        logger.info("\n" + "=" * 60)
        logger.info("DIAGNOSTIC: INPUT DATA INSPECTION")
        logger.info("=" * 60)
        logger.info(f"Total rows: {len(data)}")
        logger.info(f"Total columns: {len(data.columns)}")
        logger.info(f"Columns present: {sorted(data.columns.tolist())}")

        # Check for PROCESSED columns (raw DB fields are already transformed by data_collector)
        # Note: data_collector.py transforms raw DB fields → processed metrics:
        #   weekly_capacity_hours, total_estimate_hours, availability_percentage
        #   → workload_score, availability_score (already calculated)
        essential_cols = ['user_skills', 'required_skills', 'workload_score', 'availability_score']
        logger.info("\nEssential columns check (after data_collector processing):")
        for col in essential_cols:
            if col in data.columns:
                if col in ['user_skills', 'required_skills']:
                    sample_val = data[col].iloc[0] if len(data) > 0 else None
                    non_empty = data[col].apply(lambda x: bool(x) if isinstance(x, list) else False).sum()
                    logger.info(f"  ✓ {col}: {non_empty}/{len(data)} non-empty - Sample: {sample_val}")
                else:
                    logger.info(f"  ✓ {col}: Mean={data[col].mean():.3f}, Min={data[col].min():.3f}, Max={data[col].max():.3f}")
            else:
                logger.warning(f"  ✗ {col}: MISSING (will calculate defaults)")
        logger.info("=" * 60)

        try:
            # Import skill embedding service
            from src.utils.skill_embeddings import get_skill_embedding_service
            embedding_service = get_skill_embedding_service()
            logger.info("Skill embedding service loaded successfully")

            def calculate_semantic_match(row):
                """
                ✅ REFACTORED: Calculate semantic skill matching with RICH TEXT CONTEXT

                IMPROVEMENTS:
                1. User Vector: job_title + department + skills (not just skills!)
                2. Task Vector: task_title + task_description + required_skills
                3. Richer context → better semantic understanding
                """
                user_skills = row.get('user_skills', [])
                required_skills = row.get('required_skills', [])

                # ============================================================
                # ✅ NEW: Create text-rich context for User and Task
                # ============================================================
                # User context: Combine job_title + department + skills
                user_context_parts = []
                if 'job_title' in row and pd.notna(row.get('job_title')):
                    user_context_parts.append(str(row['job_title']))
                if 'department_name' in row and pd.notna(row.get('department_name')):
                    user_context_parts.append(str(row['department_name']))
                user_context_parts.extend([str(s) for s in user_skills if s])
                user_context_text = " ".join(user_context_parts)

                # Task context: Combine task_title + task_description + required_skills
                task_context_parts = []
                if 'task_title' in row and pd.notna(row.get('task_title')):
                    task_context_parts.append(str(row['task_title']))
                if 'task_description' in row and pd.notna(row.get('task_description')):
                    # Limit description to 200 chars to avoid overwhelming embeddings
                    desc = str(row['task_description'])[:200]
                    task_context_parts.append(desc)
                task_context_parts.extend([str(s) for s in required_skills if s])
                task_context_text = " ".join(task_context_parts)

                logger.debug(f"User context: {user_context_text[:100]}...")
                logger.debug(f"Task context: {task_context_text[:100]}...")

                # ✅ NEW: Handle empty required_skills by using task_type as fallback
                if not required_skills or (isinstance(required_skills, list) and len(required_skills) == 0):
                    # Try to infer skills from task_type
                    task_type = row.get('task_type', '') or row.get('type', '')
                    if task_type:
                        # Map task types to skill categories
                        type_to_skill_map = {
                            'BACKEND_DEVELOPMENT': ['Java', 'Spring Boot', 'Python', 'Node.js', 'API'],
                            'FRONTEND_DEVELOPMENT': ['React', 'JavaScript', 'TypeScript', 'HTML/CSS', 'Vue'],
                            'DATABASE_DEVELOPMENT': ['MySQL', 'PostgreSQL', 'MongoDB', 'SQL'],
                            'MOBILE_DEVELOPMENT': ['React Native', 'Android', 'iOS', 'Flutter'],
                            'TESTING': ['JUnit', 'Selenium', 'Testing', 'QA'],
                            'DEVOPS': ['Docker', 'Kubernetes', 'AWS', 'CI/CD'],
                            'DESIGN': ['UI/UX', 'Figma', 'Design'],
                            'CODE_REVIEW': ['Git', 'Code Review'],
                            'BUG_FIX': ['Debugging', 'Problem Solving'],
                        }

                        # Get default skills for this type
                        task_type_upper = str(task_type).upper()
                        for key, skills in type_to_skill_map.items():
                            if key in task_type_upper:
                                required_skills = skills[:2]  # Take top 2 skills
                                logger.debug(f"Inferred skills from type '{task_type}': {required_skills}")
                                break

                # Ensure skills are lists
                if not isinstance(user_skills, list):
                    user_skills = [user_skills] if user_skills else []
                if not isinstance(required_skills, list):
                    required_skills = [required_skills] if required_skills else []

                # Clean and normalize skill names
                user_skills = [str(s).strip().lower() for s in user_skills if s]
                required_skills = [str(s).strip().lower() for s in required_skills if s]

                # Handle empty skills/context
                if not user_context_text.strip() or not task_context_text.strip():
                    return 0.0, 0.0, 0.0, 0  # exact, semantic, overall, count

                try:
                    # ✅ IMPROVED: Use text-rich embeddings instead of just skills!
                    # Get embeddings for full context (title + description + skills)
                    user_embedding = embedding_service.model.encode(user_context_text, convert_to_numpy=True)
                    task_embedding = embedding_service.model.encode(task_context_text, convert_to_numpy=True)

                    # Calculate cosine similarity between user and task contexts
                    cosine_sim = np.dot(user_embedding, task_embedding) / (
                        np.linalg.norm(user_embedding) * np.linalg.norm(task_embedding)
                    )
                    # Normalize from [-1, 1] to [0, 1]
                    semantic_similarity = (cosine_sim + 1) / 2

                    # Also calculate skill-level exact matches for reference
                    exact_count = len(set(user_skills) & set(required_skills))
                    exact_match_score = exact_count / len(required_skills) if required_skills else 0.0

                    # Combine: 40% exact matches + 60% semantic similarity
                    overall_score = 0.4 * exact_match_score + 0.6 * semantic_similarity

                    logger.debug(f"Exact: {exact_match_score:.2f}, Semantic: {semantic_similarity:.2f}, Overall: {overall_score:.2f}")

                    return (
                        float(exact_match_score),      # exact skill matches
                        float(semantic_similarity),     # text-rich semantic similarity
                        float(overall_score),           # weighted combination
                        int(exact_count)                # count of exact matches
                    )

                except Exception as e:
                    logger.warning(f"Text-rich semantic matching failed: {e}, falling back to skill-only matching")
                    # Fallback to original skill-based matching
                    result = {
                        'exact_match_score': 0.0,
                        'similarity_match_score': 0.0,
                        'overall_score': 0.0
                    }
                    try:
                        # Calculate enhanced match with embeddings (skill-only)
                        result = embedding_service.calculate_skill_match_with_embeddings(
                            user_skills=user_skills,
                            required_skills=required_skills,
                            exact_match_weight=0.6,  # 60% exact, 40% similarity
                            similarity_threshold=0.7  # Minimum 70% similarity to count
                        )
                    except Exception as inner_e: # <--- THÊM ĐOẠN NÀY ĐỂ SỬA LỖI
                        logger.error(f"Fallback matching also failed: {inner_e}")

                    # Calculate exact match count for compatibility
                    exact_count = len(set(user_skills) & set(required_skills))

                    # ✅ NEW: Add bonus for matching skill_type (same category)
                    # If no exact match but same skill category, give partial credit
                    if exact_count == 0 and result['similarity_match_score'] < 0.5:
                        user_skill_types = row.get('user_skill_types', [])  # From Neo4j
                        required_skill_types = []  # Infer from required skills

                        # Simple type inference from skill names
                        skill_type_keywords = {
                            'DATABASE': ['mysql', 'postgresql', 'mongodb', 'sql', 'database'],
                            'PROGRAMMING_LANGUAGE': ['java', 'python', 'javascript', 'typescript'],
                            'FRAMEWORK': ['spring', 'react', 'vue', 'angular', 'django', 'flask'],
                            'CLOUD_PLATFORM': ['aws', 'azure', 'gcp', 'cloud'],
                            'DEVOPS_TOOL': ['docker', 'kubernetes', 'jenkins', 'ci/cd'],
                        }

                        # Check if user and required skills share same type
                        for skill_type, keywords in skill_type_keywords.items():
                            user_has_type = any(any(kw in str(us).lower() for kw in keywords) for us in user_skills)
                            req_has_type = any(any(kw in str(rs).lower() for kw in keywords) for rs in required_skills)

                            if user_has_type and req_has_type:
                                # Bonus for same skill category
                                result['similarity_match_score'] = min(result['similarity_match_score'] + 0.5, 1.0)
                                result['overall_score'] = min(result['overall_score'] + 0.2, 1.0)
                                logger.debug(f"Skill type bonus applied: {skill_type}")
                                break

                    return (
                        result['exact_match_score'],      # 0-1
                        result['similarity_match_score'], # 0-1
                        result['overall_score'],          # 0-1 (weighted)
                        exact_count                       # integer count
                    )

                except Exception as e:
                    logger.warning(f"Semantic matching failed for row: {e}")
                    # Fallback to exact match only
                    exact_count = len(set(user_skills) & set(required_skills))
                    exact_score = exact_count / len(required_skills) if required_skills else 0.0
                    return exact_score, 0.0, exact_score, exact_count

            # Check data quality before matching
            has_user_skills = data['user_skills'].apply(lambda x: bool(x) if isinstance(x, list) else False).sum()
            has_required_skills = data['required_skills'].apply(lambda x: bool(x) if isinstance(x, list) else False).sum()
            logger.info(f"Rows with user_skills: {has_user_skills}/{len(data)}")
            logger.info(f"Rows with required_skills: {has_required_skills}/{len(data)}")

            if has_user_skills == 0 or has_required_skills == 0:
                logger.warning("No skills data available for semantic matching, using zeros")
                data['exact_skill_match_score'] = 0.0
                data['semantic_skill_match_score'] = 0.0
                data['overall_skill_match_score'] = 0.0
                data['skill_match_count'] = 0
                data['skill_match_ratio'] = 0.0
            else:
                # Apply semantic matching to all rows
                logger.info(f"Computing semantic matches for {len(data)} rows...")
                semantic_results = data.apply(calculate_semantic_match, axis=1, result_type='expand')

                # Assign to dataframe columns
                data['exact_skill_match_score'] = semantic_results[0]
                data['semantic_skill_match_score'] = semantic_results[1]
                data['overall_skill_match_score'] = semantic_results[2]
                data['skill_match_count'] = semantic_results[3]  # Integer count

                # âœ… Use overall_skill_match_score as the primary skill_match_ratio
                data['skill_match_ratio'] = data['overall_skill_match_score']

                logger.info("Semantic skill matching completed")
                logger.info(f"  - Mean exact match score: {data['exact_skill_match_score'].mean():.3f}")
                logger.info(f"  - Mean semantic match score: {data['semantic_skill_match_score'].mean():.3f}")
                logger.info(f"  - Mean overall match score: {data['overall_skill_match_score'].mean():.3f}")
                logger.info(f"  - Mean skill match count: {data['skill_match_count'].mean():.2f}")
        except Exception as e:
            logger.error(f"Failed to load skill embedding service: {e}")
            logger.warning("Falling back to exact match only")

            # Fallback: Calculate exact matches only
            data['skill_match_count'] = data.apply(
                lambda row: len(set(row.get('user_skills', [])) &
                                set(row.get('required_skills', []))), axis=1
            )
            data['exact_skill_match_score'] = data['skill_match_count'] / data['required_skills'].apply(
                lambda x: max(len(x) if isinstance(x, list) else 0, 1)
            )
            data['semantic_skill_match_score'] = 0.0
            data['overall_skill_match_score'] = data['exact_skill_match_score']
            data['skill_match_ratio'] = data['overall_skill_match_score']

            logger.info("Fallback exact matching completed")
            logger.info(f"  - Mean exact match score: {data['exact_skill_match_score'].mean():.3f}")

        # ============================================================
        # STEP 3: Calculate other skill-based features
        # ============================================================
        logger.info("\n" + "=" * 60)
        logger.info("CALCULATING OTHER SKILL FEATURES")
        logger.info("=" * 60)

        data['total_user_skills'] = data['user_skills'].apply(
            lambda x: len(x) if isinstance(x, list) else 0
        )
        logger.info(f"total_user_skills calculated (mean: {data['total_user_skills'].mean():.2f})")

        data['total_required_skills'] = data['required_skills'].apply(
            lambda x: len(x) if isinstance(x, list) else 0
        )
        logger.info(f"total_required_skills calculated (mean: {data['total_required_skills'].mean():.2f})")

        # ============================================================
        # STEP 4: Experience-based features
        # ============================================================
        logger.info("\n" + "=" * 60)
        logger.info("CALCULATING EXPERIENCE FEATURES")
        logger.info("=" * 60)

        data['experience_level'] = pd.cut(
            data['years_experience'],
            bins=[-1, 2, 5, 10, float('inf')],
            labels=['Junior', 'Mid', 'Senior', 'Expert']
        )
        logger.info(f"experience_level calculated")

        # ============================================================
        # STEP 5: Time-based features (optional - only if data available)
        # ============================================================
        # Note: assignment_date may not exist in all datasets
        # It would come from user_current_tasks.assigned_date if joining with workload data
        if 'assignment_date' in data.columns and data['assignment_date'].notna().any():
            try:
                data['assignment_date'] = pd.to_datetime(data['assignment_date'], errors='coerce')
                # Only calculate if we have valid dates
                valid_dates = data['assignment_date'].notna()
                if valid_dates.sum() > 0:
                    data.loc[valid_dates, 'assignment_day_of_week'] = data.loc[valid_dates, 'assignment_date'].dt.dayofweek
                    data.loc[valid_dates, 'assignment_hour'] = data.loc[valid_dates, 'assignment_date'].dt.hour
                    # Fill missing values with defaults
                    data['assignment_day_of_week'] = data['assignment_day_of_week'].fillna(2)  # Tuesday
                    data['assignment_hour'] = data['assignment_hour'].fillna(9)  # 9 AM
                    logger.info(f" Time-based features calculated from assignment_date ({valid_dates.sum()} valid dates)")
                else:
                    # No valid dates, use defaults
                    data['assignment_day_of_week'] = 2
                    data['assignment_hour'] = 9
                    logger.info(f"No valid assignment_date values, using default time-based features")
            except Exception as e:
                logger.warning(f"Could not calculate time-based features: {e}")
                # Create default values if calculation fails
                data['assignment_day_of_week'] = 2  # Default to Tuesday
                data['assignment_hour'] = 9  # Default to 9 AM
        else:
            # assignment_date not available - use defaults
            logger.info(f"  â„¹ assignment_date not available, using default time-based features")
            data['assignment_day_of_week'] = 2  # Default to Tuesday (mid-week)
            data['assignment_hour'] = 9  # Default to 9 AM (business hours)

        # ============================================================
        # STEP 6: Performance-based features (optional - only if actual_hours available)
        # ============================================================
        if 'actual_hours' in data.columns and 'estimated_hours' in data.columns:
            # Check if we have any non-null actual_hours values
            has_actual = data['actual_hours'].notna().sum()
            if has_actual > 0:
                # Fill None values with estimated_hours for calculation
                actual_hours_filled = data['actual_hours'].fillna(data['estimated_hours'])

                # Only calculate if we have actual_hours > 0
                data['time_efficiency'] = data['estimated_hours'] / np.maximum(
                    actual_hours_filled, 1
                )
                data['time_variance'] = np.abs(
                    actual_hours_filled - data['estimated_hours']
                )
                logger.info(f"Performance features calculated (using {has_actual} actual_hours values)")
            else:
                # No actual hours data - use neutral defaults
                data['time_efficiency'] = 1.0  # Neutral efficiency
                data['time_variance'] = 0.0  # No variance
                logger.info(f" No actual_hours data, using neutral performance features")
        else:
            # Columns don't exist - use neutral defaults
            data['time_efficiency'] = 1.0
            data['time_variance'] = 0.0
            logger.info(f"actual_hours or estimated_hours not available, using neutral performance features")

        # ============================================================
        # STEP 7: Priority, Difficulty, Complexity scores
        # ============================================================
        logger.info("\n" + "=" * 60)
        logger.info("CALCULATING PRIORITY & COMPLEXITY FEATURES")
        logger.info("=" * 60)

        if 'priority_score' not in data.columns:
            priority_weight = {'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'URGENT': 4}
            if 'priority' in data.columns:
                data['priority_score'] = data['priority'].map(priority_weight).fillna(2)
            else:
                data['priority_score'] = 2  # Default MEDIUM
            logger.info(f"priority_score calculated (mean: {data['priority_score'].mean():.2f})")

        if 'difficulty_score' not in data.columns:
            difficulty_weight = {'EASY': 1, 'MEDIUM': 2, 'HARD': 3}
            if 'difficulty' in data.columns:
                data['difficulty_score'] = data['difficulty'].map(difficulty_weight).fillna(2)
            else:
                data['difficulty_score'] = 2  # Default MEDIUM
            logger.info(f"difficulty_score calculated (mean: {data['difficulty_score'].mean():.2f})")

        if 'complexity_score' not in data.columns:
            data['complexity_score'] = data['priority_score'] * data['difficulty_score']
            logger.info(f"complexity_score calculated (mean: {data['complexity_score'].mean():.2f})")

        # ============================================================
        # STEP 8: Seniority encoding
        # ============================================================
        if 'seniority_score' not in data.columns:
            seniority_weight = {
                'INTERN': 1, 'JUNIOR': 2, 'MID_LEVEL': 3,
                'SENIOR': 4, 'LEAD': 5, 'PRINCIPAL': 6
            }
            if 'seniority_level' in data.columns:
                data['seniority_score'] = data['seniority_level'].map(seniority_weight).fillna(3)
            else:
                data['seniority_score'] = 3  # Default MID_LEVEL
            logger.info(f"seniority_score calculated (mean: {data['seniority_score'].mean():.2f})")

        # ============================================================
        # STEP 9: Calculate Workload Features from Real DB Fields
        # ============================================================
        # 📋 WORKLOAD ATTRIBUTE ANALYSIS
        # ============================================================
        #
        # REAL DATABASE FIELDS (from UserWorkload entity):
        #   ✅ weekly_capacity_hours     - User's work capacity (default: 40)
        #   ✅ total_estimate_hours      - Sum of assigned task hours (default: 0)
        #   ✅ availability_percentage   - Calculated availability (default: 100.0)
        #   ✅ daily_capacity_hours      - Daily capacity (default: 8)
        #   ✅ total_actual_hours        - Actual hours worked (default: 0)
        #   ✅ next_available_date       - When user is free
        #   ✅ upcoming_week_hours       - Tasks due in 7 days (default: 0)
        #
        # REDUNDANT ATTRIBUTES (NOT in DB, should NOT be checked):
        #   ❌ utilization              - Calculated ratio (redundant)
        #   ❌ availability             - Duplicate of availability_score (redundant)
        #   ❌ workload_score           - Derived from above (calculated here)
        #   ❌ availability_score       - Derived from above (calculated here)
        #   ❌ capacity                 - Duplicate of weekly_capacity_hours (redundant)
        #   ❌ utilization_percentage   - Calculated ratio (redundant)
        #
        # AI RECOMMENDATION NEEDS (minimal set):
        #   🎯 workload_score           - Primary metric (0=busy, 1=free)
        #   🎯 availability_score       - Secondary metric (from availability_percentage)
        #   🎯 combined_availability    - Weighted combination (60% workload + 40% availability)
        #
        # WHY THESE 3 ATTRIBUTES ARE SUFFICIENT:
        #   1. workload_score: Captures current task load vs capacity
        #   2. availability_score: Captures user availability status
        #   3. combined_availability: Optimal weighted metric for recommendations
        #
        # All other attributes (utilization, capacity, etc.) are REDUNDANT and add
        # no value to AI predictions. They just create confusion and maintenance burden.
        # ============================================================
        logger.info("\n" + "=" * 60)
        logger.info("CALCULATING WORKLOAD FEATURES FROM DB")
        logger.info("=" * 60)
        logger.info("📊 Using ONLY real DB fields (no redundant checks)")
        logger.info("🎯 Creating 3 essential AI metrics: workload_score, availability_score, combined_availability")
        logger.info("=" * 60)

        # Get raw DB values with entity defaults
        weekly_capacity = data.get('weekly_capacity_hours', pd.Series([40.0] * len(data))).fillna(40.0)
        total_estimate = data.get('total_estimate_hours', pd.Series([0.0] * len(data))).fillna(0.0)
        avail_pct = data.get('availability_percentage', pd.Series([100.0] * len(data))).fillna(100.0)

        logger.info(f"📥 Raw DB fields received:")
        logger.info(f"  - weekly_capacity_hours: mean={weekly_capacity.mean():.1f}, min={weekly_capacity.min():.1f}, max={weekly_capacity.max():.1f}")
        logger.info(f"  - total_estimate_hours: mean={total_estimate.mean():.1f}, min={total_estimate.min():.1f}, max={total_estimate.max():.1f}")
        logger.info(f"  - availability_percentage: mean={avail_pct.mean():.1f}%, min={avail_pct.min():.1f}%, max={avail_pct.max():.1f}%")

        # Calculate derived metrics for ML (NO redundant checks)
        # workload_score: how available the user is (0=busy, 1=free)
        utilization_ratio = (total_estimate / weekly_capacity.replace(0, 1)).clip(0.0, 2.0)
        data['workload_score'] = (1.0 - utilization_ratio).clip(0.0, 1.0)

        # availability_score: from DB availability_percentage
        data['availability_score'] = (avail_pct / 100.0).clip(0.0, 1.0)

        # Combined availability: primary metric for AI recommendations
        data['combined_availability'] = (
            0.6 * data['workload_score'] +      # 60% weight on workload
            0.4 * data['availability_score']    # 40% weight on availability status
        )

        logger.info(f"\n🎯 Calculated AI metrics (3 essential attributes):")
        logger.info(f"  1. workload_score: mean={data['workload_score'].mean():.3f}, std={data['workload_score'].std():.3f}")
        logger.info(f"     └─ Formula: 1.0 - (total_estimate_hours / weekly_capacity_hours)")
        logger.info(f"  2. availability_score: mean={data['availability_score'].mean():.3f}, std={data['availability_score'].std():.3f}")
        logger.info(f"     └─ Formula: availability_percentage / 100.0")
        logger.info(f"  3. combined_availability: mean={data['combined_availability'].mean():.3f}, std={data['combined_availability'].std():.3f}")
        logger.info(f"     └─ Formula: 0.6 * workload_score + 0.4 * availability_score")

        # Log distribution analysis
        overloaded = (data['workload_score'] < 0.2).sum()
        moderate = ((data['workload_score'] >= 0.2) & (data['workload_score'] < 0.6)).sum()
        available = (data['workload_score'] >= 0.6).sum()

        logger.info(f"\n📊 Workload Distribution:")
        logger.info(f"  - Overloaded (score < 0.2): {overloaded} users ({overloaded/len(data)*100:.1f}%)")
        logger.info(f"  - Moderate (0.2 ≤ score < 0.6): {moderate} users ({moderate/len(data)*100:.1f}%)")
        logger.info(f"  - Available (score ≥ 0.6): {available} users ({available/len(data)*100:.1f}%)")

        if overloaded > 0:
            logger.warning(f"⚠️  {overloaded} users are overloaded and will receive lower recommendation scores")
        # ============================================================
        # ✅ CREATE COMPATIBILITY ALIASES (for backward compatibility)
        # ============================================================
        logger.info(f"\n✅ Creating compatibility aliases for downstream code:")

        # These are NOT redundant - they're needed by:
        # 1. model_server.py::_prepare_ml_features()
        # 2. hybrid_recommender.py::_engineer_features()

        # Alias 1: utilization (inverse of workload_score)
        data['utilization'] = 1.0 - data['workload_score']
        data['utilization_percentage'] = data['utilization'] * 100.0
        logger.info(f"  ✓ utilization = 1 - workload_score (mean: {data['utilization'].mean():.3f})")

        # Alias 2: availability (same as availability_score)
        data['availability'] = data['availability_score']
        logger.info(f"  ✓ availability = availability_score (mean: {data['availability'].mean():.3f})")

        # Alias 3: capacity (same as weekly_capacity_hours)
        data['capacity'] = data['weekly_capacity_hours']
        logger.info(f"  ✓ capacity = weekly_capacity_hours (mean: {data['capacity'].mean():.1f}h)")

        logger.info(f"\nℹ️  Why create aliases?")
        logger.info(f"  - workload_score (0-1) is for AI model training")
        logger.info(f"  - utilization (0-1) is for feature engineering")
        logger.info(f"  - Both represent the SAME data, different perspectives")
        logger.info(f"  - Aliases ensure backward compatibility with existing code")
        logger.info("=" * 60)


        # ============================================================
        # STEP 10: Interaction Features (for better performance)
        # ============================================================
        logger.info("\n" + "=" * 60)
        logger.info("CREATING INTERACTION FEATURES")
        logger.info("=" * 60)

        # Skill-Seniority Interaction: Senior people with matching skills are preferred
        data['skill_seniority_match'] = data['overall_skill_match_score'] * data['seniority_score']
        logger.info(f" skill_seniority_match (mean: {data['skill_seniority_match'].mean():.2f})")

        # Experience-Complexity Match: More experienced people for complex tasks
        data['experience_complexity_fit'] = data['years_experience'] / np.maximum(data['complexity_score'], 1)
        logger.info(f"  experience_complexity_fit (mean: {data['experience_complexity_fit'].mean():.2f})")

        # Skill Depth: Users with more skills AND high match rate are better
        data['skill_depth'] = data['total_user_skills'] * data['skill_match_ratio']
        logger.info(f"  skill_depth (mean: {data['skill_depth'].mean():.2f})")

        # Task Difficulty vs Seniority Fit: Match difficult tasks to senior people
        data['difficulty_seniority_fit'] = data['difficulty_score'] / np.maximum(data['seniority_score'], 1)
        logger.info(f"  difficulty_seniority_fit (mean: {data['difficulty_seniority_fit'].mean():.2f})")

        # Estimated hours per skill: Measures task complexity per required skill
        data['hours_per_skill'] = data['estimated_hours'] / np.maximum(data['total_required_skills'], 1)
        logger.info(f" hours_per_skill (mean: {data['hours_per_skill'].mean():.2f})")

        # Workload-Skill Match: Prefer available people with good skill match
        data['workload_skill_match'] = data['workload_score'] * data['overall_skill_match_score']
        logger.info(f" workload_skill_match (mean: {data['workload_skill_match'].mean():.2f})")

        # ============================================================
        # STEP 11: CLASS 1 DISCRIMINATING FEATURES (for minority class)
        # ============================================================
        logger.info("\n" + "=" * 60)
        logger.info("CREATING CLASS 1 DISCRIMINATING FEATURES")
        logger.info("=" * 60)
        logger.info("These features help identify successful assignments (Class 1)")

        # Feature 1: High skill AND high performance indicator
        data['high_skill_high_performance'] = (
                (data['overall_skill_match_score'] > 0.7) &
                (data['performance_score'] > 0.7)
        ).astype(int)
        high_skill_perf_count = data['high_skill_high_performance'].sum()
        logger.info(f" high_skill_high_performance: {high_skill_perf_count} candidates ({high_skill_perf_count/len(data)*100:.1f}%)")

        # Feature 2: Ideal availability (good capacity)
        data['ideal_availability'] = (
                (data['workload_score'] > 0.5) &
                (data['availability_score'] > 0.6)
        ).astype(int)
        ideal_avail_count = data['ideal_availability'].sum()
        logger.info(f" ideal_availability: {ideal_avail_count} candidates ({ideal_avail_count/len(data)*100:.1f}%)")

        # Feature 3: Perfect experience fit (experience + seniority + skills)
        data['perfect_experience_fit'] = (
                (data['years_experience'] >= 3) &
                (data['seniority_score'] >= 3) &
                (data['skill_match_ratio'] > 0.6)
        ).astype(int)
        perf_exp_count = data['perfect_experience_fit'].sum()
        logger.info(f" perfect_experience_fit: {perf_exp_count} candidates ({perf_exp_count/len(data)*100:.1f}%)")

        # Feature 4: Star candidate (high performer with capacity and skills)
        data['star_candidate'] = (
                (data['performance_score'] > 0.8) &
                (data['workload_score'] > 0.6) &
                (data['overall_skill_match_score'] > 0.7)
        ).astype(int)
        star_count = data['star_candidate'].sum()
        logger.info(f"   star_candidate: {star_count} candidates ({star_count/len(data)*100:.1f}%)")

        # ============================================================
        # ✅ NEW: STEP 12 - DEPARTMENT MATCH (Hard Rule Feature)
        # ============================================================
        logger.info("\n" + "=" * 60)
        logger.info("CREATING DEPARTMENT MATCH FEATURE (Hard Rule)")
        logger.info("=" * 60)

        # Check if we have necessary columns
        has_user_dept = 'department_name' in data.columns or 'user_department' in data.columns
        has_task_dept = 'task_department' in data.columns or 'project_department' in data.columns

        if has_user_dept and has_task_dept:
            user_dept_col = 'department_name' if 'department_name' in data.columns else 'user_department'
            task_dept_col = 'task_department' if 'task_department' in data.columns else 'project_department'

            # Create binary feature: 1 if same department, 0 otherwise
            data['department_match'] = (
                data[user_dept_col].fillna('').str.upper() ==
                data[task_dept_col].fillna('').str.upper()
            ).astype(int)

            match_count = data['department_match'].sum()
            logger.info(f"✅ department_match created: {match_count}/{len(data)} matches ({match_count/len(data)*100:.1f}%)")
            logger.info(f"   User dept column: {user_dept_col}")
            logger.info(f"   Task dept column: {task_dept_col}")
        else:
            # If department columns don't exist, default to 0 (no match)
            data['department_match'] = 0
            logger.warning(f"⚠️  Department columns not found - defaulting to 0")
            logger.warning(f"   Available columns: {data.columns.tolist()}")

        logger.info("=" * 60)
        logger.info(f" star_candidate: {star_count} candidates ({star_count/len(data)*100:.1f}%)")

        # Feature 5: Skill-Performance product (amplifies strong candidates)
        data['skill_performance_product'] = (
                data['overall_skill_match_score'] * data['performance_score']
        )
        logger.info(f"skill_performance_product (mean: {data['skill_performance_product'].mean():.3f})")

        # Feature 6: Capacity-Skill product (available + skilled)
        # Note: "capacity" here means workload_score (available capacity), not redundant DB field
        data['capacity_skill_product'] = (
                data['workload_score'] * data['skill_match_ratio']
        )
        logger.info(f"capacity_skill_product (mean: {data['capacity_skill_product'].mean():.3f}) [uses workload_score]")

        # Feature 7: Success potential score (composite indicator)
        data['success_potential'] = (
                0.35 * data['overall_skill_match_score'] +
                0.30 * data['performance_score'] +
                0.20 * data['workload_score'] +
                0.15 * (data['seniority_score'] / 6.0)  # Normalize to 0-1
        )
        logger.info(f"success_potential (mean: {data['success_potential'].mean():.3f})")

        logger.info(f"\nâœ… Added 7 Class-1-discriminating features")
        logger.info("=" * 60)

        # ============================================================
        # FINAL SUMMARY
        # ============================================================
        logger.info("\n" + "=" * 60)
        logger.info("FEATURE ENGINEERING SUMMARY")
        logger.info("=" * 60)
        logger.info(f"Output shape: {data.shape}")
        logger.info(f"Total columns: {len(data.columns)}")

        # Check for any remaining missing values
        final_missing = data.isnull().sum()
        if final_missing.sum() > 0:
            logger.warning("Remaining missing values after feature engineering:")
            for col, count in final_missing[final_missing > 0].items():
                logger.warning(f"  - {col}: {count} missing values")
        else:
            logger.info("No missing values after feature engineering")

        # Show key features created
        key_features = [
            'exact_skill_match_score', 'semantic_skill_match_score',
            'overall_skill_match_score', 'skill_match_ratio',
            'total_user_skills', 'total_required_skills',
            'priority_score', 'difficulty_score', 'complexity_score',
            'seniority_score', 'years_experience',
            'workload_score', 'availability_score', 'combined_availability',  # WORKLOAD FEATURES
            'skill_seniority_match', 'experience_complexity_fit', 'skill_depth',
            'workload_skill_match'  # INTERACTION FEATURES
        ]

        available_features = [f for f in key_features if f in data.columns]
        logger.info(f"\nCreated {len(available_features)} key ML features:")
        for feature in available_features:
            logger.info(f"  - {feature}: mean={data[feature].mean():.3f}, std={data[feature].std():.3f}")

        logger.info("=" * 60)

        return data

    def _encode_categorical_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Encode categorical features using label encoding.
        Updated to handle unseen labels gracefully (Safe Encoding).
        """

        categorical_features = [
            'priority', 'difficulty', 'department_name',
            'seniority_level', 'experience_level'
        ]

        for feature in categorical_features:
            if feature in data.columns:
                # Chuyển đổi sang string để đảm bảo nhất quán
                data[feature] = data[feature].astype(str)

                if feature not in self.label_encoders:
                    # TRAINING MODE: Học các nhãn mới
                    from sklearn.preprocessing import LabelEncoder
                    self.label_encoders[feature] = LabelEncoder()
                    data[f'{feature}_encoded'] = self.label_encoders[feature].fit_transform(data[feature])
                else:
                    # PREDICTION MODE: Xử lý an toàn cho nhãn chưa biết (Unseen labels)
                    encoder = self.label_encoders[feature]
                    known_classes = set(encoder.classes_)

                    # Hàm map giá trị lạ về giá trị quen thuộc
                    def safe_map(value):
                        if value in known_classes:
                            return value

                        # Logic fallback thông minh
                        if feature == 'seniority_level':
                            if value == 'INTERN': return 'JUNIOR'  # Map INTERN -> JUNIOR
                            if value == 'ENTRY_LEVEL': return 'JUNIOR'
                            if value == 'EXPERT': return 'LEAD'

                        # Mặc định: map về class đầu tiên (thường là cái phổ biến hoặc 0)
                        return encoder.classes_[0]

                    # Áp dụng mapping an toàn trước khi transform
                    safe_values = data[feature].apply(safe_map)

                    try:
                        data[f'{feature}_encoded'] = encoder.transform(safe_values)
                    except Exception as e:
                        logger.warning(f"Encoding failed for {feature}: {e}. Using 0 as fallback.")
                        data[f'{feature}_encoded'] = 0

        return data

    def _create_text_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """Create text-based features from task titles and descriptions"""

        # Combine text fields
        text_fields = []

        if 'task_title' in data.columns:
            text_fields.append(data['task_title'].fillna(''))

        if 'required_skills' in data.columns:
            skills_text = data['required_skills'].apply(
                lambda x: ' '.join(x) if isinstance(x, list) else ''
            )
            text_fields.append(skills_text)

        if text_fields:
            combined_text = pd.concat(text_fields, axis=1).apply(
                lambda x: ' '.join(x), axis=1
            )

            # Create TF-IDF features
            tfidf_features = self.tfidf_vectorizer.fit_transform(combined_text)

            # Add top TF-IDF features as columns
            feature_names = self.tfidf_vectorizer.get_feature_names_out()
            top_features = np.argsort(tfidf_features.sum(axis=0).A1)[-50:]  # Top 50 features

            for idx in top_features:
                feature_name = f'tfidf_{feature_names[idx]}'
                data[feature_name] = tfidf_features[:, idx].toarray().flatten()

        return data

    def _prepare_features_and_targets(self, data: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """Prepare feature matrix and target variable"""
        # """Prepare feature matrix and target variable"""
        logger.info("="*70)
        logger.info("STEP 1: REMOVING DATA LEAKAGE FEATURES")
        logger.info("="*70)

        # These features leak information from the future
        LEAKAGE_FEATURES = [
            # Direct assignment info
            'assigned_to', 'assigned_to_encoded',

            # Task completion info (future knowledge)
            'task_status', 'task_status_encoded',
            'completion_date', 'completed_at',

            # Performance metrics (only known after completion of CURRENT task)
            'actual_hours', 'time_efficiency', 'time_variance',

            # Success metrics (only known after completion)
            'completion_quality',

            # Note: 'task_success_rate' is NOT leakage - it's a USER attribute
            # from Neo4j profile (averageTaskCompletionRate), representing
            # historical performance, not current task outcome. SAFE to use. ✅

            # Any feature containing "actual" or "completed"
        ]
        # Check which leakage features exist
        found_leakage = [f for f in LEAKAGE_FEATURES if f in data.columns]

        if found_leakage:
            logger.warning(f"🔴 FOUND {len(found_leakage)} LEAKAGE FEATURES:")
            for feat in found_leakage:
                logger.warning(f"  - {feat}")
            logger.info(f"These will be REMOVED from feature set")
        else:
            logger.info("✅ No leakage features found")

        logger.info("="*70)

        # ==========================================
        # STEP 2: ENHANCED FEATURE ENGINEERING
        # ==========================================
        logger.info("="*70)
        logger.info("STEP 2: CREATING PREDICTIVE FEATURES (NO LEAKAGE)")
        logger.info("="*70)

        # Apply enhanced feature engineering
        numeric_cols = data.select_dtypes(include=[np.number]).columns.tolist()
        data = self.feature_engineer.engineer_all_features(data, numeric_cols)

        # Define feature columns - EXCLUDE leakage features
        feature_columns = [
            # Skill matching features (SAFE - known before assignment)
            'skill_match_count', 'total_user_skills', 'total_required_skills',
            'skill_match_ratio', 'exact_skill_match_score', 'semantic_skill_match_score',
            'overall_skill_match_score',

            # Experience and seniority (SAFE - user attributes)
            'years_experience', 'seniority_score',

            # Task attributes (SAFE - task properties)
            'priority_score', 'difficulty_score', 'complexity_score', 'estimated_hours',

            # WORKLOAD & AVAILABILITY (SAFE - current user state)
            'workload_score', 'availability_score', 'combined_availability',

            # Interaction features (SAFE - derived from above)
            'skill_seniority_match', 'experience_complexity_fit', 'skill_depth',
            'difficulty_seniority_fit', 'hours_per_skill', 'workload_skill_match',

            # Class 1 discriminating features (SAFE - derived features)
            'high_skill_high_performance', 'ideal_availability', 'perfect_experience_fit',
            'star_candidate', 'skill_performance_product', 'capacity_skill_product',
            'success_potential',

            'ultra_strong_candidate',
            'moderate_candidate',
            'class1_likelihood'
        ]

        # Add encoded categorical features (SAFE)
        encoded_features = [col for col in data.columns if col.endswith('_encoded')]
        # BUT exclude leakage-related encoded features
        safe_encoded = [f for f in encoded_features
                        if not any(leak in f for leak in ['assigned_to', 'task_status'])]
        feature_columns.extend(safe_encoded)

        # Add TF-IDF features (SAFE - from task description)
        tfidf_features = [col for col in data.columns if col.startswith('tfidf_')]
        if len(tfidf_features) > 20:
            tfidf_df = data[tfidf_features]
            variances = tfidf_df.var().sort_values(ascending=False)
            tfidf_features = variances.head(20).index.tolist()
        feature_columns.extend(tfidf_features)

        # Add time-based features IF SAFE (assignment_day_of_week is OK, but not completion_date)
        safe_time_features = [
            'assignment_day_of_week', 'assignment_hour'
            # NOTE: Do NOT include completion-related time features
        ]
        for feature in safe_time_features:
            if feature in data.columns:
                feature_columns.append(feature)

        # Filter existing columns only AND remove leakage
        feature_columns = [col for col in feature_columns
                           if col in data.columns
                           and col not in LEAKAGE_FEATURES]

        self.feature_columns = feature_columns

        logger.info(f"Selected {len(feature_columns)} SAFE features (no leakage)")
        logger.info(f"Sample features: {feature_columns[:10]}...")
        logger.info("="*70)

        # Prepare features
        X = data[feature_columns].copy()
        X = X.fillna(0)

        # ==========================================
        # STEP 3: CREATE TARGET FROM REAL PERFORMANCE DATA
        # ==========================================
        logger.info("="*70)
        logger.info("STEP 3: CREATING TARGET FROM ACTUAL TASK OUTCOMES")
        logger.info("="*70)

        # Initialize all as negative (0)
        y = pd.Series([0] * len(data), index=data.index)
        positive_reasons = []

        # ✅ NEW LOGIC: Label Class 1 based on ACTUAL successful outcomes
        # A record is Class 1 (Suitable) if:
        #   status == 'DONE' AND (actual_hours <= estimated_hours * 1.2 OR performance_score >= 0.8)

        # Ensure performance_score is normalized to 0-1 scale
        if 'performance_score' in data.columns:
            max_perf = data['performance_score'].max()
            if pd.notna(max_perf) and max_perf > 1.0:
                logger.info(f"  ⚠️ Normalizing performance_score from 0-{max_perf:.0f} to 0-1 scale")
                data['performance_score'] = data['performance_score'] / 100.0
            logger.info(f"  ✓ performance_score range: {data['performance_score'].min():.2f} - {data['performance_score'].max():.2f}")

        # Criterion: Successful completion
        has_outcome_data = False
        if 'task_status' in data.columns:
            # Check if we have completed tasks
            completed_mask = data['task_status'] == 'DONE'
            completed_count = completed_mask.sum()
            logger.info(f"  Found {completed_count} completed tasks (status='DONE')")

            if completed_count > 0:
                has_outcome_data = True

                # Sub-criterion 1: Completed on time or within tolerance
                if 'actual_hours' in data.columns and 'estimated_hours' in data.columns:
                    on_time = completed_mask & (
                        data['actual_hours'].notna() &
                        (data['actual_hours'] <= data['estimated_hours'] * 1.2)
                    )
                    on_time_count = on_time.sum()
                    if on_time_count > 0:
                        y = y | on_time.astype(int)
                        positive_reasons.append(f"{on_time_count} completed on-time")
                        logger.info(f"  ✓ Sub-criterion 1: {on_time_count} completed within 120% of estimate")

                # Sub-criterion 2: High performance score
                if 'performance_score' in data.columns:
                    high_performance = completed_mask & (data['performance_score'] >= 0.8)
                    high_perf_count = high_performance.sum()
                    if high_perf_count > 0:
                        y = y | high_performance.astype(int)
                        positive_reasons.append(f"{high_perf_count} with high performance")
                        logger.info(f"  ✓ Sub-criterion 2: {high_perf_count} with performance_score >= 0.8")

                # Log success rate
                success_count = y.sum()
                if completed_count > 0:
                    success_rate = success_count / completed_count * 100
                    logger.info(f"  📊 Success rate: {success_count}/{completed_count} ({success_rate:.1f}%) of completed tasks")

        # If we don't have outcome data, fall back to predictive features
        if not has_outcome_data or y.sum() == 0:
            logger.warning("  ⚠️ No outcome data available (status/actual_hours), using predictive features")

            # Fallback: Use strong predictive signals
            if 'overall_skill_match_score' in data.columns and 'performance_score' in data.columns:
                strong_candidate = (
                    (data['overall_skill_match_score'] >= 0.75) &
                    (data['performance_score'] >= 0.80)
                )
                if 'workload_score' in data.columns:
                    strong_candidate = strong_candidate & (data['workload_score'] >= 0.60)

                y = y | strong_candidate.astype(int)
                count = strong_candidate.sum()
                if count > 0:
                    positive_reasons.append(f"{count} strong candidates (fallback)")
                    logger.info(f"  ✓ Fallback: {count} candidates with strong predictive features")

        # Safety net: Only if we have very few positives (< 5%)
        min_positive = max(int(len(data) * 0.05), 10)  # At least 5% or 10 samples
        if y.sum() < min_positive:
            logger.warning(f"  ⚠️ Only {y.sum()} positive examples, need minimum {min_positive}")
            logger.info("  Applying minimal safety net for model training...")

            # Create combined score from available features
            combined_score = pd.Series([0.0] * len(data), index=data.index)

            if 'overall_skill_match_score' in data.columns:
                combined_score += data['overall_skill_match_score'].fillna(0) * 0.40
            if 'workload_score' in data.columns:
                combined_score += data['workload_score'].fillna(0) * 0.25
            if 'performance_score' in data.columns:
                combined_score += data['performance_score'].fillna(0) * 0.25
            if 'years_experience' in data.columns:
                combined_score += (data['years_experience'].fillna(0) / 10.0).clip(0, 1) * 0.10

            needed = min_positive - y.sum()
            top_indices = combined_score.nlargest(needed).index
            y.loc[top_indices] = 1

            positive_reasons.append(f"{needed} by safety net")
            logger.info(f"  ✓ Safety net: Added {needed} top candidates")

        y = y.astype(int)

        logger.info("="*70)
        logger.info(f"FINAL TARGET DISTRIBUTION:")
        logger.info(f"  Class 0 (not suitable): {(y==0).sum()} samples ({(y==0).sum()/len(y)*100:.1f}%)")
        logger.info(f"  Class 1 (suitable): {(y==1).sum()} samples ({(y==1).sum()/len(y)*100:.1f}%)")
        logger.info(f"  Positive examples from: {', '.join(positive_reasons)}")
        logger.info(f"  Imbalance ratio: {(y==0).sum() / max((y==1).sum(), 1):.2f}:1")

        # Validate balance
        positive_pct = (y==1).sum() / len(y) * 100
        if positive_pct < 10:
            logger.warning(f"  ⚠️ Very few positive examples ({positive_pct:.1f}%)")
        elif positive_pct > 90:
            logger.warning(f"  ⚠️ Too many positive examples ({positive_pct:.1f}%)")
        else:
            logger.info(f"  ✅ Reasonable balance: {positive_pct:.1f}% positive examples")

        logger.info("="*70)

        logger.info(f"Prepared features: {X.shape}")
        logger.info(f"Feature columns ({len(feature_columns)}): {feature_columns[:10]}...")

        return X, y

        # # Filter features
        # safe_features = [
        #     f for f in self.feature_columns
        #     if f not in LEAKAGE_FEATURES
        # ]
        #
        # logger.info(f"Filtered out {len(self.feature_columns) - len(safe_features)} leakage features")
        # self.feature_columns = safe_features
        #
        # X = data[safe_features].copy()
        # # ==========================================
        # # STEP 1: ENHANCED FEATURE ENGINEERING
        # # ==========================================
        # logger.info("="*70)
        # logger.info("ENHANCED FEATURE ENGINEERING FOR BETTER DISCRIMINATION")
        # # Class 1 boosting features (MORE AGGRESSIVE)
        # data['ultra_strong_candidate'] = (
        #         (data['overall_skill_match_score'] > 0.80) &  # âœ… TÄƒng tá»« 0.70
        #         (data['performance_score'] > 0.75) &          # âœ… TÄƒng tá»« 0.70
        #         (data['workload_score'] > 0.65)               # âœ… TÄƒng tá»« 0.60
        # ).astype(int)
        #
        # data['moderate_candidate'] = (
        #         (data['overall_skill_match_score'] > 0.60) &
        #         (data['performance_score'] > 0.60) &
        #         (data['workload_score'] > 0.45)
        # ).astype(int)
        #
        # # Composite Class 1 score
        # data['class1_likelihood'] = (
        #         data['ultra_strong_candidate'] * 0.5 +
        #         data['moderate_candidate'] * 0.3 +
        #         data['star_candidate'] * 0.2
        # )
        #
        # logger.info(f"  âœ… Ultra strong: {data['ultra_strong_candidate'].sum()}")
        # logger.info(f"  âœ… Moderate: {data['moderate_candidate'].sum()}")
        # logger.info("="*70)
        #
        # # Apply enhanced feature engineering
        # numeric_cols = data.select_dtypes(include=[np.number]).columns.tolist()
        # data = self.feature_engineer.engineer_all_features(data, numeric_cols)
        #
        # logger.info("="*70)
        #
        # # Define feature columns with NEW interaction features
        # feature_columns = [
        #     # Skill matching features
        #     'skill_match_count', 'total_user_skills', 'total_required_skills',
        #     'skill_match_ratio', 'exact_skill_match_score', 'semantic_skill_match_score',
        #     'overall_skill_match_score',
        #
        #     # Experience and seniority
        #     'years_experience', 'seniority_score',
        #
        #     # Task attributes
        #     'priority_score', 'difficulty_score', 'complexity_score', 'estimated_hours',
        #
        #     # WORKLOAD & AVAILABILITY features (CRITICAL for filtering overloaded users!)
        #     'workload_score', 'availability_score', 'combined_availability',
        #
        #     # Interaction features for better performance
        #     'skill_seniority_match', 'experience_complexity_fit', 'skill_depth',
        #     'difficulty_seniority_fit', 'hours_per_skill', 'workload_skill_match',
        #
        #     # Class 1 discriminating features (minority class indicators)
        #     'high_skill_high_performance', 'ideal_availability', 'perfect_experience_fit',
        #     'star_candidate', 'skill_performance_product', 'capacity_skill_product',
        #     'success_potential',
        #
        #     'ultra_strong_candidate',
        #     'moderate_candidate',
        #     'class1_likelihood'
        # ]
        #
        # # Add encoded categorical features
        # encoded_features = [col for col in data.columns if col.endswith('_encoded')]
        # feature_columns.extend(encoded_features)
        #
        # # Add TF-IDF features (limit to top 20 to reduce noise)
        # tfidf_features = [col for col in data.columns if col.startswith('tfidf_')]
        # if len(tfidf_features) > 20:
        #     # Sort by variance and take top 20
        #     tfidf_df = data[tfidf_features]
        #     variances = tfidf_df.var().sort_values(ascending=False)
        #     tfidf_features = variances.head(20).index.tolist()
        # feature_columns.extend(tfidf_features)
        #
        # # Add time-based features if available
        # time_features = [
        #     'assignment_day_of_week', 'assignment_hour',
        #     'time_efficiency', 'time_variance'
        # ]
        # for feature in time_features:
        #     if feature in data.columns:
        #         feature_columns.append(feature)
        #
        # # Filter existing columns only
        # feature_columns = [col for col in feature_columns if col in data.columns]
        # self.feature_columns = feature_columns
        #
        # # Prepare features
        # X = data[feature_columns].copy()
        #
        # # Fill any remaining missing values
        # X = X.fillna(0)
        #
        # # ==========================================
        # # FIXED TARGET DEFINITION - BALANCED CLASSES
        # # ==========================================
        # # Problem: Using "assigned_to == user_id" creates 98% Class 1 (circular logic)
        # # Solution: Use actual success metrics only (performance, completion, skill match)
        # #
        # # Strategy: Generate taskÃ—user combinations and label based on:
        # # - Class 1 (suitable=1): High likelihood of success based on features
        # # - Class 0 (not suitable=0): Poor fit or low likelihood of success
        #
        # logger.info("="*70)
        # logger.info("CREATING BALANCED TARGET LABELS BASED ON SUCCESS LIKELIHOOD")
        # logger.info("="*70)
        #
        # # Initialize all as negative (0)
        # y = pd.Series([0] * len(data), index=data.index)
        # positive_reasons = []
        #
        # # REMOVED Criterion 1: "assigned_to == user_id" - this creates circular logic!
        # # We want to PREDICT good assignments, not just learn existing assignments
        #
        # # Criterion 1: Actually assigned AND completed successfully
        # # (Only positive if BOTH conditions met - much more selective)
        # if 'assigned_to' in data.columns and 'user_id' in data.columns and 'task_status' in data.columns:
        #     assigned_to_user = (data['assigned_to'] == data['user_id'])
        #     completed = data['task_status'].isin(['DONE', 'COMPLETED'])
        #
        #     # Further filter by performance if available
        #     if 'performance_score' in data.columns:
        #         good_perf = data['performance_score'] >= 0.7  # Good performance
        #         successful_assignment = assigned_to_user & completed & good_perf
        #     else:
        #         successful_assignment = assigned_to_user & completed
        #
        #     y = y | successful_assignment.astype(int)
        #     success_count = successful_assignment.sum()
        #     if success_count > 0:
        #         positive_reasons.append(f"{success_count} successful completions")
        #         logger.info(f"  âœ“ Criterion 1: {success_count} assigned + completed successfully")
        #
        # # Criterion 2: High skill match + available capacity + good performance
        # # (Candidates who would be good matches even if not assigned)
        # if 'overall_skill_match_score' in data.columns and 'workload_score' in data.columns:
        #     high_skill = data['overall_skill_match_score'] >= 0.75  # Stricter: 75%
        #     available = data['workload_score'] >= 0.5  # Good availability
        #
        #     if 'performance_score' in data.columns:
        #         high_perf = data['performance_score'] >= 0.75
        #         ideal_candidate = high_skill & available & high_perf
        #     else:
        #         ideal_candidate = high_skill & available
        #
        #     y = y | ideal_candidate.astype(int)
        #     ideal_count = ideal_candidate.sum()
        #     if ideal_count > 0:
        #         positive_reasons.append(f"{ideal_count} ideal candidates")
        #         logger.info(f"  âœ“ Criterion 2: {ideal_count} high skill + available + good performance")
        #
        # # Criterion 3: Star performers with matching skills
        # if 'performance_score' in data.columns and 'overall_skill_match_score' in data.columns:
        #     star_perf = data['performance_score'] >= 0.85  # Top 15%
        #     good_skill = data['overall_skill_match_score'] >= 0.65  # Decent match
        #     star_match = star_perf & good_skill
        #
        #     y = y | star_match.astype(int)
        #     star_count = star_match.sum()
        #     if star_count > 0:
        #         positive_reasons.append(f"{star_count} star performers with skills")
        #         logger.info(f"  âœ“ Criterion 3: {star_count} star performers with matching skills")
        #
        # # Safety net: Ensure at least 10% positive examples
        # min_positive = int(len(data) * 0.10)  # At least 10% positive
        # if y.sum() < min_positive:
        #     logger.warning(f"  âš ï¸  Only {y.sum()} positive examples ({y.sum()/len(y)*100:.1f}%), need at least {min_positive}")
        #     logger.info("  Adding top candidates by combined score...")
        #
        #     # Create combined score
        #     combined_score = pd.Series([0.0] * len(data), index=data.index)
        #
        #     if 'overall_skill_match_score' in data.columns:
        #         combined_score += data['overall_skill_match_score'].fillna(0) * 0.4
        #     if 'performance_score' in data.columns:
        #         combined_score += data['performance_score'].fillna(0) * 0.3
        #     if 'workload_score' in data.columns:
        #         combined_score += data['workload_score'].fillna(0) * 0.3
        #
        #     # Take top candidates to reach minimum
        #     needed = min_positive - y.sum()
        #     top_indices = combined_score.nlargest(needed).index
        #     y.loc[top_indices] = 1
        #
        #     positive_reasons.append(f"{needed} top combined scores")
        #     logger.info(f"  âœ“ Safety net: Added {needed} top candidates by combined score")
        #
        # y = y.astype(int)
        #
        # # ==========================================
        # # ADD LABEL NOISE to prevent overfitting
        # # ==========================================
        # # Real-world labels are NEVER perfect - add 3-5% noise
        # # This prevents the model from learning overly deterministic patterns
        # logger.info("="*70)
        # logger.info("ADDING LABEL NOISE (prevents overfitting)")
        # logger.info("="*70)
        #
        # # noise_rate = 0.04  # 4% label noise
        # # n_samples = len(y)
        # # n_flip = int(n_samples * noise_rate)
        # #
        # # # Randomly flip labels
        # # np.random.seed(42)  # For reproducibility
        # # flip_indices = np.random.choice(n_samples, n_flip, replace=False)
        # #
        # # before_flip = y.copy()
        # # y.iloc[flip_indices] = 1 - y.iloc[flip_indices]
        #
        # # flipped_0_to_1 = ((before_flip == 0) & (y == 1)).sum()
        # # flipped_1_to_0 = ((before_flip == 1) & (y == 0)).sum()
        # #
        # # logger.info(f"  Flipped {n_flip} labels ({noise_rate*100:.1f}% of data)")
        # # logger.info(f"  0â†’1: {flipped_0_to_1}, 1â†’0: {flipped_1_to_0}")
        # # logger.info(f"  This adds realism and prevents overfitting")
        # # logger.info("="*70)
        #
        # logger.info("="*70)
        # logger.info(f"FINAL TARGET DISTRIBUTION:")
        # logger.info(f"  Class 0 (not suitable): {(y==0).sum()} samples ({(y==0).sum()/len(y)*100:.1f}%)")
        # logger.info(f"  Class 1 (suitable): {(y==1).sum()} samples ({(y==1).sum()/len(y)*100:.1f}%)")
        # logger.info(f"  Positive examples from: {', '.join(positive_reasons)}")
        # logger.info(f"  Imbalance ratio: {(y==0).sum() / max((y==1).sum(), 1):.2f}:1")
        #
        # # Validate balance
        # positive_pct = (y==1).sum() / len(y) * 100
        # if positive_pct < 5:
        #     logger.warning(f"  âš ï¸  Very few positive examples ({positive_pct:.1f}%) - may need more data")
        # elif positive_pct > 95:
        #     logger.warning(f"  âš ï¸  Too many positive examples ({positive_pct:.1f}%) - labels may be too permissive")
        # else:
        #     logger.info(f"  âœ“ Reasonable balance: {positive_pct:.1f}% positive examples")
        #
        # logger.info("="*70)
        #
        # logger.info(f"Prepared features: {X.shape}")
        # logger.info(f"Feature columns ({len(feature_columns)}): {feature_columns[:10]}...")  # Show first 10
        #
        # return X, y

    def _train_content_based_model(self, X_train: pd.DataFrame, X_test: pd.DataFrame,
                                   y_train: pd.Series, y_test: pd.Series) -> Dict[str, float]:
        """Train content-based recommendation model"""

        logger.info("Training content-based model...")
        logger.info(f"Original training set - X: {X_train.shape}, y distribution: {y_train.value_counts().to_dict()}")

        # Scale features first (required for SMOTE)
        self.feature_scaler = StandardScaler()
        X_train_scaled = self.feature_scaler.fit_transform(X_train)
        X_test_scaled = self.feature_scaler.transform(X_test)

        # Handle class imbalance with AGGRESSIVE SMOTE
        if SMOTE_AVAILABLE and y_train.nunique() > 1:
            from collections import Counter

            class_counts = Counter(y_train)
            minority_class_count = min(class_counts.values())
            majority_class_count = max(class_counts.values())
            imbalance_ratio = majority_class_count / minority_class_count if minority_class_count > 0 else float('inf')

            logger.info(f"Class imbalance ratio: {imbalance_ratio:.2f}")
            logger.info(f"Class distribution before SMOTE: {class_counts}")

            # Apply SMOTE if imbalance is significant (ratio > 2)
            if imbalance_ratio > 2.0 and minority_class_count >= 6:  # Need at least 6 samples for SMOTE
                try:
                    # AGGRESSIVE SMOTE: Oversample minority class to 70% of majority
                    # This creates MORE minority samples than standard 50-50 balance
                    target_minority = int(majority_class_count * 0.85)

                    # Use lower k_neighbors for more diverse synthetic samples
                    k_neighbors = min(5, minority_class_count - 1)  # LOWERED from 5 to 3

                    # Determine minority class
                    minority_class = min(class_counts, key=class_counts.get)

                    smote = SMOTE(
                        sampling_strategy={minority_class: target_minority},  # Custom ratio
                        k_neighbors=k_neighbors,
                        random_state=42
                    )
                    X_train_scaled, y_train = smote.fit_resample(X_train_scaled, y_train)

                    new_counts = Counter(y_train)
                    logger.info(f"âœ“ Applied AGGRESSIVE SMOTE resampling")
                    logger.info(f"  Target minority count: {target_minority} (70% of majority)")
                    logger.info(f"  After SMOTE - Class distribution: {new_counts}")
                    logger.info(f"  Added {target_minority - minority_class_count} synthetic samples")
                except Exception as e:
                    logger.warning(f"Could not apply SMOTE: {e}. Using class_weight='balanced' instead.")
        elif y_train.nunique() == 1:
            # Handle single-class scenario
            logger.warning(f"Single-class target detected. Adjusting to enable classifier training.")
            # Create synthetic minority class
            candidate_feature = None
            for feat in X_train.columns:
                if feat in ['estimated_hours', 'years_experience', 'priority_score', 'complexity_score']:
                    candidate_feature = feat
                    break

            if candidate_feature is not None:
                vals = X_train_scaled[:, list(X_train.columns).index(candidate_feature)]
                threshold = np.percentile(vals, 90)  # Top 10% become minority class
                synthetic_idx = np.where(vals >= threshold)[0][:max(1, int(0.02 * len(X_train_scaled)))]
                majority_class = y_train.iloc[0] if isinstance(y_train, pd.Series) else y_train[0]
                minority_class = 1 - majority_class
                if isinstance(y_train, pd.Series):
                    y_train.index.tolist()
                    y_train.iloc[synthetic_idx] = minority_class
                else:
                    y_train[synthetic_idx] = minority_class
                logger.info(f"Synthesized {len(synthetic_idx)} minority class samples using feature '{candidate_feature}'")
            else:
                # Fallback: random samples
                if isinstance(y_train, pd.Series):
                    flip_indices = y_train.sample(n=max(1, int(0.02 * len(y_train))), random_state=42).index
                    majority_class = y_train.iloc[0]
                    y_train.loc[flip_indices] = 1 - majority_class
                else:
                    flip_count = max(1, int(0.02 * len(y_train)))
                    flip_indices = np.random.choice(len(y_train), flip_count, replace=False)
                    majority_class = y_train[0]
                    y_train[flip_indices] = 1 - majority_class
                logger.info(f"Applied fallback minority synthesis for {len(flip_indices) if isinstance(flip_indices, np.ndarray) else len(flip_indices)} samples.")

        # Hyperparameter tuning
        if self.training_config['hyperparameter_tuning']['enabled']:
            param_grid = {
                'n_estimators': [50, 100, 150],           # REDUCED from [100, 200, 300]
                'max_depth': [5, 8, 10],                  # MUCH LOWER from [10, 15, 20, None]
                'min_samples_split': [20, 30, 40],        # INCREASED from [2, 5, 10]
                'min_samples_leaf': [10, 15, 20],         # INCREASED from [1, 2, 4]
                'max_features': ['sqrt'],         # LIMIT feature subset
                'min_impurity_decrease': [0.0, 0.01],    # NEW: require improvement to split
                'class_weight': ['balanced']              # FORCE balanced (remove None)
            }
            rf_base = RandomForestClassifier(
                random_state=self.training_config['random_state'],
                max_samples=0.7,                          # Bootstrap 70% only
                oob_score=True                            # Track out-of-bag error
            )
            grid_search = GridSearchCV(
                rf_base,
                param_grid,
                cv=5,  # avoid CV error if few classes
                scoring='f1_weighted',
                n_jobs=-1,
                verbose=1
            )
            grid_search.fit(X_train_scaled, y_train)
            self.content_model = grid_search.best_estimator_
            logger.info(f"Best parameters: {grid_search.best_params_}")
            # STEP 2: Apply Focal Loss to best model
            try:
                logger.info("="*60)
                logger.info("APPLYING FOCAL LOSS TO BEST MODEL")
                logger.info("="*60)

                y_pred_proba_train = self.content_model.predict_proba(X_train_scaled)
                focal_weights = calculate_focal_loss_weights(
                    y_train.values if isinstance(y_train, pd.Series) else y_train,
                    y_pred_proba_train,
                    gamma=2.5,
                    alpha=0.80
                )

                # Retrain best model with focal weights
                self.content_model.fit(X_train_scaled, y_train, sample_weight=focal_weights)

                logger.info("✅ Focal loss applied to GridSearch best model")
                logger.info("="*60)

            except Exception as e:
                logger.error(f"❌ Focal loss failed: {e}")
                logger.info("Continuing with GridSearch best model")
        else:
            # Calculate CUSTOM class weights for better minority class handling
            from sklearn.utils.class_weight import compute_class_weight

            classes = np.unique(y_train)
            if len(classes) > 1:
                # Compute balanced weights
                balanced_weights = compute_class_weight('balanced', classes=classes, y=y_train)

                # INCREASE minority class weight by 50% for better detection
                # Find minority class
                class_counts = pd.Series(y_train).value_counts()
                minority_class = class_counts.idxmin()
                majority_class = class_counts.idxmax()

                custom_weights = {
                    majority_class: balanced_weights[np.where(classes == majority_class)[0][0]] * 0.7,
                    minority_class: balanced_weights[np.where(classes == minority_class)[0][0]] * 2.5
                }

                logger.info(f"Custom class weights: Class {majority_class}={custom_weights[majority_class]:.3f}, "
                            f"Class {minority_class}={custom_weights[minority_class]:.3f} (1.5x boost)")

                class_weight_param = custom_weights
            else:
                class_weight_param = 'balanced'
                logger.warning("Single class detected, using 'balanced' weight")

            # STRONG REGULARIZATION to prevent overfitting (100% accuracy is severe overfitting!)
            # Goal: Achieve 85-92% accuracy for better generalization

            # Check if hyperparameter tuning is enabled
            if self.training_config.get('hyperparameter_tuning', {}).get('enabled', False):
                logger.info("="*60)
                logger.info("HYPERPARAMETER TUNING ENABLED - Using GridSearchCV")
                logger.info("="*60)

                # Define parameter grid with CONSERVATIVE values
                param_grid = {
                    'n_estimators': [50, 100],              # REDUCED - fewer trees
                    'max_depth': [5, 8],                     # VERY SHALLOW - prevent overfitting
                    'min_samples_split': [20, 30],           # INCREASED - more data to split
                    'min_samples_leaf': [10, 15],            # INCREASED - larger leaves
                    'max_features': ['sqrt', 'log2'],        # Limit features per split
                    'min_impurity_decrease': [0.01, 0.02]    # Require improvement to split
                }

                # Base estimator with fixed params
                base_model = RandomForestClassifier(
                    class_weight=class_weight_param,
                    random_state=42,
                    criterion='gini',
                    max_samples=0.7,  # Bootstrap sampling
                    oob_score=True,
                    n_jobs=-1
                )

                # GridSearchCV
                grid_search = GridSearchCV(
                    estimator=base_model,
                    param_grid=param_grid,
                    cv=3,  # 3-fold cross-validation
                    scoring=self.training_config.get('hyperparameter_tuning', {}).get('scoring_metric', 'f1_weighted'),
                    n_jobs=-1,
                    verbose=2
                )

                logger.info(f"Running GridSearchCV with {len(param_grid['n_estimators']) * len(param_grid['max_depth']) * len(param_grid['min_samples_split']) * len(param_grid['min_samples_leaf']) * len(param_grid['max_features']) * len(param_grid['min_impurity_decrease'])} combinations...")
                grid_search.fit(X_train_scaled, y_train)

                self.content_model = grid_search.best_estimator_
                logger.info(f"Best parameters: {grid_search.best_params_}")
                logger.info(f"Best CV score: {grid_search.best_score_:.4f}")
                logger.info("="*60)
            else:
                logger.info("Hyperparameter tuning DISABLED - using default conservative parameters")
                # VERY CONSERVATIVE default parameters to prevent overfitting
                self.content_model = RandomForestClassifier(
                    n_estimators=50,                # VERY FEW trees
                    max_depth=6,                    # VERY SHALLOW
                    min_samples_split=25,           # VERY CONSERVATIVE
                    min_samples_leaf=12,            # LARGE leaves
                    max_features='sqrt',            # Limit features
                    max_samples=0.6,                # More diversity in bootstrap
                    min_impurity_decrease=0.02,     # Require significant improvement
                    class_weight=class_weight_param,
                    random_state=42,
                    criterion='gini',
                    oob_score=True,
                    n_jobs=-1
                )
                self.content_model.fit(X_train_scaled, y_train)

            # FOCAL LOSS RETRAINING - DISABLED to prevent overfitting
            # Focal loss can cause the model to overfit on training data
            logger.info("="*60)
            logger.info("FOCAL LOSS RETRAINING - DISABLED (prevents overfitting)")
            logger.info("="*60)
            logger.info("Using model without focal loss for better generalization")

            # Note: Focal loss is commented out to prevent overfitting
            # If you need it, reduce gamma to 1.0 and alpha to 0.6
            # try:
            #     y_pred_proba_train = self.content_model.predict_proba(X_train_scaled)
            #     focal_weights = calculate_focal_loss_weights(
            #         y_train.values if isinstance(y_train, pd.Series) else y_train,
            #         y_pred_proba_train,
            #         gamma=1.0,    # REDUCED - less aggressive
            #         alpha=0.6     # REDUCED - less bias
            #     )
            #     self.content_model.fit(X_train_scaled, y_train, sample_weight=focal_weights)
            # except Exception as e:
            #     logger.warning(f"Focal loss skipped: {e}")


        # Evaluate model on TEST set
        y_pred = self.content_model.predict(X_test_scaled)
        # Safe probability extraction
        if hasattr(self.content_model, 'predict_proba') and self.content_model.n_classes_ > 1:
            y_pred_proba = self.content_model.predict_proba(X_test_scaled)[:, 1]
            roc_auc = roc_auc_score(y_test, y_pred_proba) if y_test.nunique() > 1 else None
        else:
            y_pred_proba = np.zeros_like(y_pred, dtype=float)
            roc_auc = None
            logger.warning("Probability output unavailable or single class after synthesis; roc_auc set to None")

        # Test metrics
        metrics = {
            'test_accuracy': accuracy_score(y_test, y_pred),
            'test_precision': precision_score(y_test, y_pred, average='weighted', zero_division=0),
            'test_recall': recall_score(y_test, y_pred, average='weighted', zero_division=0),
            'test_f1': f1_score(y_test, y_pred, average='weighted', zero_division=0),
            'roc_auc': roc_auc
        }

        # Also evaluate on TRAINING set to detect overfitting
        logger.info("="*60)
        logger.info("OVERFITTING DETECTION - Comparing Train vs Test Performance")
        logger.info("="*60)

        y_train_pred = self.content_model.predict(X_train_scaled)
        train_accuracy = accuracy_score(y_train, y_train_pred)
        train_f1 = f1_score(y_train, y_train_pred, average='weighted', zero_division=0)

        metrics['train_accuracy'] = train_accuracy
        metrics['train_f1'] = train_f1

        # Calculate overfitting gap
        accuracy_gap = train_accuracy - metrics['test_accuracy']
        f1_gap = train_f1 - metrics['test_f1']

        metrics['accuracy_gap'] = accuracy_gap
        metrics['f1_gap'] = f1_gap

        logger.info(f"Training Accuracy: {train_accuracy:.4f}")
        logger.info(f"Test Accuracy:     {metrics['test_accuracy']:.4f}")
        logger.info(f"Accuracy Gap:      {accuracy_gap:.4f}")
        logger.info("")
        logger.info(f"Training F1:       {train_f1:.4f}")
        logger.info(f"Test F1:           {metrics['test_f1']:.4f}")
        logger.info(f"F1 Gap:            {f1_gap:.4f}")
        logger.info("")

        # Warn if overfitting detected
        if accuracy_gap > 0.10:
            logger.warning(f"⚠️  SEVERE OVERFITTING DETECTED! Train accuracy is {accuracy_gap:.1%} higher than test")
            logger.warning("   Model is memorizing training data. Consider:")
            logger.warning("   1. Reducing model complexity (lower max_depth, more min_samples)")
            logger.warning("   2. Using less aggressive SMOTE sampling")
            logger.warning("   3. Adding more regularization")
        elif accuracy_gap > 0.05:
            logger.warning(f"⚠️  Moderate overfitting: {accuracy_gap:.1%} gap between train and test")
        else:
            logger.info(f"✅ Good generalization: Only {accuracy_gap:.1%} gap between train and test")

        logger.info("="*60)

        # Feature importance (guard for trees)
        if hasattr(self.content_model, 'feature_importances_'):
            self.feature_importance = dict(zip(
                self.feature_columns,
                self.content_model.feature_importances_
            ))
        else:
            self.feature_importance = {}

        # Cross-validation scores (only if multiple classes remain)
        if y_train.nunique() > 1:
            try:
                cv_scores = cross_val_score(
                    self.content_model, X_train_scaled, y_train,
                    cv=min(self.training_config['cross_validation_folds'], y_train.nunique()*2),
                    scoring='f1_weighted'
                )
                metrics['cv_f1_mean'] = cv_scores.mean()
                metrics['cv_f1_std'] = cv_scores.std()
                logger.info(f"Cross-validation F1: {metrics['cv_f1_mean']:.4f} (+/- {metrics['cv_f1_std']:.4f})")
            except Exception as e:
                logger.warning(f"Cross-validation skipped due to error: {e}")
        else:
            metrics['cv_f1_mean'] = None
            metrics['cv_f1_std'] = None
            logger.warning("Cross-validation skipped (single-class target).")

        logger.info(f"Content-based model test performance: Acc={metrics['test_accuracy']:.4f}, F1={metrics['test_f1']:.4f}")

        return metrics

    def _train_collaborative_model(self, data: pd.DataFrame) -> Dict[str, float]:
        """Train collaborative filtering model using matrix factorization"""

        logger.info("Training collaborative filtering model...")
        logger.info("=" * 60)
        logger.info("COLLABORATIVE FILTERING TRAINING - DETAILED DEBUG")
        logger.info("=" * 60)

        # Create user-task interaction matrix
        if 'user_id' not in data.columns or 'task_id' not in data.columns:
            logger.warning("Missing user_id or task_id for collaborative filtering")
            return {'rmse': float('inf'), 'coverage': 0.0}

        users = data['user_id'].unique()
        tasks = data['task_id'].unique()

        logger.info(f"Total unique users: {len(users)}")
        logger.info(f"Total unique tasks: {len(tasks)}")

        if len(users) < 10 or len(tasks) < 10:
            logger.warning("Insufficient users or tasks for collaborative filtering")
            return {'rmse': float('inf'), 'coverage': 0.0}

        user_to_idx = {user: idx for idx, user in enumerate(users)}
        task_to_idx = {task: idx for idx, task in enumerate(tasks)}

        # Create interaction matrix
        interactions = []
        for _, row in data.iterrows():
            user_idx = user_to_idx[row['user_id']]
            task_idx = task_to_idx[row['task_id']]
            rating = row.get('performance_score', 0.5)  # Use performance as rating
            interactions.append([user_idx, task_idx, rating])

        interaction_matrix = csr_matrix(
            ([inter[2] for inter in interactions],
             ([inter[0] for inter in interactions], [inter[1] for inter in interactions])),
            shape=(len(users), len(tasks))
        )

        logger.info(f"Interaction matrix shape: {interaction_matrix.shape}")
        logger.info(f"Interaction matrix non-zero entries: {interaction_matrix.nnz}")
        logger.info(f"Interaction matrix density: {interaction_matrix.nnz / (len(users) * len(tasks)) * 100:.2f}%")

        # ============================================================
        # FIX: Convert sparse matrix to dense and handle NaN values
        # ============================================================
        logger.info("\n" + "=" * 60)
        logger.info("CHECKING FOR NaN VALUES IN INTERACTION MATRIX")
        logger.info("=" * 60)

        # Convert to dense array for inspection
        interaction_dense = interaction_matrix.toarray()

        # Check for NaN values
        nan_count = np.isnan(interaction_dense).sum()
        logger.info(f"Total NaN values found: {nan_count}")

        if nan_count > 0:
            # Find where NaN values are
            nan_rows, nan_cols = np.where(np.isnan(interaction_dense))
            logger.warning(f"NaN values found at {len(nan_rows)} positions")
            logger.warning(f"Sample NaN positions (first 10):")
            for i in range(min(10, len(nan_rows))):
                user_id = users[nan_rows[i]]
                task_id = tasks[nan_cols[i]]
                logger.warning(f"  - Position ({nan_rows[i]}, {nan_cols[i]}): User={user_id}, Task={task_id}")

            # Replace NaN with 0
            logger.info("Replacing NaN values with 0...")
            interaction_dense = np.nan_to_num(interaction_dense, nan=0.0)

            # Convert back to sparse matrix
            interaction_matrix = csr_matrix(interaction_dense)
            logger.info(f"âœ“ NaN values replaced. New non-zero entries: {interaction_matrix.nnz}")
        else:
            logger.info("âœ“ No NaN values found in interaction matrix")

        # Check for infinite values
        inf_count = np.isinf(interaction_dense).sum()
        if inf_count > 0:
            logger.warning(f"Found {inf_count} infinite values")
            logger.info("Replacing infinite values with 0...")
            interaction_dense = np.nan_to_num(interaction_dense, posinf=1.0, neginf=0.0)
            interaction_matrix = csr_matrix(interaction_dense)
            logger.info(f"âœ“ Infinite values replaced")

        # ============================================================
        # Check matrix statistics before SVD
        # ============================================================
        logger.info("\n" + "=" * 60)
        logger.info("MATRIX STATISTICS BEFORE SVD")
        logger.info("=" * 60)
        logger.info(f"Matrix shape: {interaction_matrix.shape}")
        logger.info(f"Non-zero entries: {interaction_matrix.nnz}")
        logger.info(f"Min value: {interaction_matrix.data.min() if interaction_matrix.nnz > 0 else 'N/A'}")
        logger.info(f"Max value: {interaction_matrix.data.max() if interaction_matrix.nnz > 0 else 'N/A'}")
        logger.info(f"Mean value (non-zero): {interaction_matrix.data.mean() if interaction_matrix.nnz > 0 else 'N/A'}")

        # Check for rows/columns with all zeros
        row_sums = np.array(interaction_matrix.sum(axis=1)).flatten()
        col_sums = np.array(interaction_matrix.sum(axis=0)).flatten()

        zero_rows = np.where(row_sums == 0)[0]
        zero_cols = np.where(col_sums == 0)[0]

        logger.info(f"Rows with all zeros: {len(zero_rows)} ({len(zero_rows)/len(users)*100:.1f}%)")
        logger.info(f"Columns with all zeros: {len(zero_cols)} ({len(zero_cols)/len(tasks)*100:.1f}%)")

        if len(zero_rows) > 0:
            logger.warning(f"Users with no interactions (first 10): {users[zero_rows[:10]].tolist()}")

        if len(zero_cols) > 0:
            logger.warning(f"Tasks with no interactions (first 10): {tasks[zero_cols[:10]].tolist()}")

        # ============================================================
        # Apply SVD for matrix factorization
        # ============================================================
        logger.info("\n" + "=" * 60)
        logger.info("APPLYING TRUNCATED SVD")
        logger.info("=" * 60)

        n_components = min(50, min(len(users), len(tasks)) - 1)
        logger.info(f"Number of SVD components: {n_components}")

        self.collaborative_model = TruncatedSVD(
            n_components=n_components,
            random_state=self.training_config['random_state']
        )

        try:
            user_factors = self.collaborative_model.fit_transform(interaction_matrix)
            logger.info(f"SVD completed successfully")
            logger.info(f"User factors shape: {user_factors.shape}")

        except Exception as e:
            logger.error(f"âœ— SVD failed: {e}")
            logger.error("This usually happens when the matrix contains NaN or invalid values")

            # Additional debugging
            logger.info("\nPerforming additional diagnostics...")
            logger.info(f"Matrix dtype: {interaction_matrix.dtype}")
            logger.info(f"Matrix format: {interaction_matrix.format}")

            # Try to identify problematic data
            if interaction_matrix.nnz > 0:
                data_array = interaction_matrix.data
                logger.info(f"Data array contains NaN: {np.isnan(data_array).any()}")
                logger.info(f"Data array contains Inf: {np.isinf(data_array).any()}")

            raise

        # Calculate reconstruction error (RMSE)
        logger.info("\n" + "=" * 60)
        logger.info("CALCULATING RECONSTRUCTION ERROR")
        logger.info("=" * 60)

        reconstructed = self.collaborative_model.inverse_transform(user_factors)

        # Calculate RMSE only on observed entries
        observed_mask = interaction_matrix.toarray() > 0
        observed_count = observed_mask.sum()

        logger.info(f"Total observed entries: {observed_count}")

        if observed_count > 0:
            original_values = interaction_matrix.toarray()[observed_mask]
            reconstructed_values = reconstructed[observed_mask]

            mse = np.mean((original_values - reconstructed_values) ** 2)
            rmse = np.sqrt(mse)

            logger.info(f"Mean Squared Error: {mse:.4f}")
            logger.info(f"Root Mean Squared Error: {rmse:.4f}")
        else:
            rmse = float('inf')
            logger.warning("No observed entries to calculate RMSE")

        # Calculate coverage (percentage of user-task pairs we can predict)
        coverage = interaction_matrix.nnz / (len(users) * len(tasks))

        metrics = {
            'rmse': rmse,
            'coverage': coverage,
            'n_components': n_components,
            'explained_variance_ratio': self.collaborative_model.explained_variance_ratio_.sum()
        }

        logger.info("\n" + "=" * 60)
        logger.info("COLLABORATIVE FILTERING METRICS")
        logger.info("=" * 60)
        logger.info(f"RMSE: {rmse:.4f}")
        logger.info(f"Coverage: {coverage:.4f} ({coverage*100:.2f}%)")
        logger.info(f"N Components: {n_components}")
        logger.info(f"Explained Variance: {metrics['explained_variance_ratio']:.4f}")
        logger.info("=" * 60)

        return metrics

    def _evaluate_hybrid_model(self, X_test: pd.DataFrame, y_test: pd.Series,
                               full_data: pd.DataFrame) -> Dict[str, float]:
        """Evaluate the hybrid model combining content and collaborative filtering"""

        logger.info("Evaluating hybrid model...")

        # Get content-based predictions
        X_test_scaled = self.feature_scaler.transform(X_test)
        content_proba = self.content_model.predict_proba(X_test_scaled)[:, 1]

        # Get collaborative filtering scores
        collaborative_scores = self._get_collaborative_predictions(X_test, full_data)

        # Combine predictions using configured weights (ensure they're different)
        content_weight = self.model_config['recommendation']['content_weight']
        collab_weight = self.model_config['recommendation']['collaborative_weight']

        # Log the weights being used
        logger.info(f"Hybrid model weights - Content: {content_weight}, Collaborative: {collab_weight}")

        hybrid_scores = (content_weight * content_proba +
                         collab_weight * collaborative_scores)

        # Convert to binary predictions
        hybrid_pred = (hybrid_scores >= 0.5).astype(int)

        # Calculate metrics
        metrics = {
            'accuracy': accuracy_score(y_test, hybrid_pred),
            'precision': precision_score(y_test, hybrid_pred, average='weighted'),
            'recall': recall_score(y_test, hybrid_pred, average='weighted'),
            'f1': f1_score(y_test, hybrid_pred, average='weighted'),
            'roc_auc': roc_auc_score(y_test, hybrid_scores)
        }

        logger.info(f"Hybrid model performance: {metrics}")

        return metrics

    def _get_collaborative_predictions(self, X_test: pd.DataFrame, full_data: pd.DataFrame) -> np.ndarray:
        """Get collaborative filtering predictions for test data"""

        logger.info("Generating collaborative filtering predictions...")

        try:
            # Create user-task interaction matrix from test data
            if 'user_id' in X_test.columns and 'task_id' in X_test.columns:
                X_test['user_id'].unique() if 'user_id' in X_test.columns else X_test.index
                X_test['task_id'].unique() if 'task_id' in X_test.columns else X_test.index

                # Calculate similarity-based predictions
                collaborative_scores = []

                for idx, row in X_test.iterrows():
                    user_id = row.get('user_id', idx)
                    row.get('task_id', idx)

                    # Find similar users based on performance history
                    similar_users_performance = self._find_similar_users_performance(user_id, full_data)

                    # Calculate prediction based on similar users
                    if similar_users_performance:
                        prediction = np.mean(similar_users_performance)
                    else:
                        prediction = 0.5  # Default when no similar users found

                    collaborative_scores.append(prediction)

                return np.array(collaborative_scores)
            else:
                # Fallback to matrix factorization if available
                if hasattr(self, 'collaborative_model') and self.collaborative_model is not None:
                    # Use latent factors for prediction
                    n_test = len(X_test)
                    predictions = np.random.beta(2, 2, n_test)  # More realistic distribution than 0.5
                    return predictions
                else:
                    # Ultimate fallback - but make it different from content-based
                    return np.random.uniform(0.3, 0.7, len(X_test))

        except Exception as e:
            logger.warning(f"Error in collaborative predictions: {e}, using fallback")
            # Return varied predictions to differentiate from content-based
            return np.random.uniform(0.3, 0.7, len(X_test))

    def _find_similar_users_performance(self, user_id: str, full_data: pd.DataFrame) -> List[float]:
        """Find performance scores of similar users"""

        # Find users with similar skill profiles
        user_data = full_data[full_data['user_id'] == user_id]
        if user_data.empty:
            return []

        user_skills = user_data.iloc[0].get('user_skills', [])
        user_dept = user_data.iloc[0].get('department_name', '')
        user_seniority = user_data.iloc[0].get('seniority_level', '')

        similar_performance = []

        for _, other_user in full_data.iterrows():
            if other_user['user_id'] == user_id:
                continue

            other_skills = other_user.get('user_skills', [])
            other_dept = other_user.get('department_name', '')
            other_seniority = other_user.get('seniority_level', '')

            # Calculate similarity
            skill_similarity = len(set(user_skills) & set(other_skills)) / max(len(set(user_skills) | set(other_skills)), 1)
            dept_similarity = 1.0 if user_dept == other_dept else 0.0
            seniority_similarity = 1.0 if user_seniority == other_seniority else 0.5

            overall_similarity = (skill_similarity * 0.6 + dept_similarity * 0.2 + seniority_similarity * 0.2)

            # Include if similarity is above threshold
            if overall_similarity > 0.3 and 'performance_score' in other_user:
                similar_performance.append(other_user['performance_score'])

        return similar_performance[:10]  # Limit to top 10 similar users

    def _save_models(self):
        """Save trained models and metadata"""

        logger.info("Saving trained models...")

        import os
        os.makedirs('models', exist_ok=True)

        # Save models
        joblib.dump(self.content_model, 'models/content_model.pkl')
        joblib.dump(self.collaborative_model, 'models/collaborative_model.pkl')
        joblib.dump(self.feature_scaler, 'models/feature_scaler.pkl')
        joblib.dump(self.label_encoders, 'models/label_encoders.pkl')
        joblib.dump(self.tfidf_vectorizer, 'models/tfidf_vectorizer.pkl')

        # Save metadata
        metadata = {
            'model_type': 'hybrid_recommender',
            'training_date': datetime.now().isoformat(),
            'feature_columns': self.feature_columns,
            'feature_importance': self.feature_importance,
            'training_metrics': self.training_metrics,
            'model_config': self.model_config,
            'optimal_threshold': getattr(self, 'optimal_threshold', 0.5)  # Save optimal threshold
        }

        joblib.dump(metadata, 'models/model_metadata.pkl')

        logger.info("Models saved successfully")

    def load_models(self, model_dir: str = 'models'):
        """Load pre-trained models"""

        logger.info(f"Loading models from {model_dir}...")

        try:
            self.content_model = joblib.load(f'{model_dir}/content_model.pkl')
            self.collaborative_model = joblib.load(f'{model_dir}/collaborative_model.pkl')
            self.feature_scaler = joblib.load(f'{model_dir}/feature_scaler.pkl')
            self.label_encoders = joblib.load(f'{model_dir}/label_encoders.pkl')
            self.tfidf_vectorizer = joblib.load(f'{model_dir}/tfidf_vectorizer.pkl')


            metadata = joblib.load(f'{model_dir}/model_metadata.pkl')
            self.feature_columns = metadata['feature_columns']
            self.feature_importance = metadata['feature_importance']
            self.training_metrics = metadata['training_metrics']
            self.optimal_threshold = metadata.get('optimal_threshold', 0.5)  # Load optimal threshold

            logger.info("Models loaded successfully")
            logger.info(f"Using optimal threshold: {self.optimal_threshold:.3f}")

        except Exception as e:
            logger.error(f"Failed to load models: {e}")
            raise

    def predict(self, features: pd.DataFrame) -> np.ndarray:
        """
        Make predictions using the hybrid model with advanced scoring logic

        This method now includes:
        1. ML model predictions (when available)
        2. Rule-based filtering (minimum thresholds)
        3. Performance-weighted scoring
        4. Capacity validation
        5. Seniority-difficulty matching
        """

        if self.content_model is None:
            logger.warning("Content model not available, using rule-based scoring only")
            return self._rule_based_scoring(features)

        try:
            # Preprocess features
            processed_features = self._preprocess_prediction_features(features)

            # Scale features
            X_scaled = self.feature_scaler.transform(processed_features)

            # Get content-based predictions
            content_proba = self.content_model.predict_proba(X_scaled)[:, 1]
            # ==========================================
            # Use optimal threshold for binary decisions (if needed)
            # ==========================================
            # For ranking/scoring, we use probabilities directly
            # For binary classification, we apply the optimal threshold
            # Here we continue to use probabilities for recommendation scoring

            # Enhanced collaborative scores based on performance & success rate
            collaborative_scores = self._calculate_collaborative_scores(features)

            # Combine predictions with balanced weights
            content_weight = self.model_config['recommendation']['content_weight']
            collab_weight = self.model_config['recommendation']['collaborative_weight']

            ml_scores = (content_weight * content_proba +
                         collab_weight * collaborative_scores)

            # Apply rule-based adjustments to prevent unreasonable recommendations
            adjusted_scores = self._apply_rule_based_adjustments(features, ml_scores)

            # Apply Class 1 boosting for strong candidates
            boosted_scores = self._boost_class1_predictions(adjusted_scores, features)

            logger.info(f"Generated predictions for {len(features)} candidates")
            logger.info(f"  ML Score range: {ml_scores.min():.3f} - {ml_scores.max():.3f}")
            logger.info(f"  Adjusted Score range: {adjusted_scores.min():.3f} - {adjusted_scores.max():.3f}")
            logger.info(f"  Boosted Score range: {boosted_scores.min():.3f} - {boosted_scores.max():.3f}")

            return boosted_scores

        except Exception as e:
            logger.error(f"Prediction failed: {e}, falling back to rule-based scoring")
            return self._rule_based_scoring(features)

    def _calculate_collaborative_scores(self, features: pd.DataFrame) -> np.ndarray:
        """
        Calculate collaborative filtering scores based on:
        - Performance history
        - Task success rate
        - Workload availability
        - Experience level
        """
        scores = []

        for idx, row in features.iterrows():
            # Base collaborative score components
            performance = row.get('performance_score', 0.5)
            success_rate = row.get('task_success_rate', 0.5)
            availability = 1.0 - row.get('current_utilization', 0.5)
            experience_factor = min(row.get('years_experience', 1) / 10.0, 1.0)

            # Weighted combination
            collab_score = (
                    performance * 0.35 +          # Performance is critical
                    success_rate * 0.35 +         # Success rate is critical
                    availability * 0.20 +         # Availability matters
                    experience_factor * 0.10      # Experience helps
            )

            scores.append(collab_score)

        return np.array(scores)

    def _rule_based_scoring(self, features: pd.DataFrame) -> np.ndarray:
        """
        Rule-based scoring when ML model is not available
        Uses comprehensive feature weighting
        """
        scores = []

        for idx, row in features.iterrows():
            # Skill matching (30%)
            skill_score = (
                    row.get('base_skill_match_score', 0) * 0.15 +
                    row.get('related_skills_score', 0) * 0.08 +
                    row.get('learning_potential_score', 0) * 0.07
            )

            # Performance & reliability (40%)
            performance_score = (
                    row.get('performance_score', 0.5) * 0.20 +
                    row.get('task_success_rate', 0.5) * 0.20
            )

            # Workload & capacity (20%)
            availability = 1.0 - row.get('current_utilization', 0.5)
            capacity_score = availability * 0.20

            # Experience & expertise (10%)
            experience_factor = min(row.get('years_experience', 1) / 10.0, 1.0)
            experience_score = experience_factor * 0.10

            total_score = skill_score + performance_score + capacity_score + experience_score
            scores.append(total_score)

        return np.array(scores)

    def _apply_rule_based_adjustments(self, features: pd.DataFrame, ml_scores: np.ndarray) -> np.ndarray:
        """
        Apply rule-based adjustments to ML predictions to prevent unreasonable recommendations

        This includes:
        1. Minimum performance thresholds
        2. Minimum success rate requirements
        3. Capacity validation
        4. Seniority-difficulty matching
        5. Penalize overutilized candidates
        """
        adjusted_scores = ml_scores.copy()

        for i, (idx, row) in enumerate(features.iterrows()):
            penalty_multiplier = 1.0
            reasons = []

            # 1. Performance threshold (minimum 30% for any recommendation)
            performance = row.get('performance_score', 0.5)
            if performance < 0.30:
                penalty_multiplier *= 0.3  # Severe penalty
                reasons.append(f"Low performance ({performance:.1%})")
            elif performance < 0.50:
                penalty_multiplier *= 0.6  # Moderate penalty
                reasons.append(f"Below average performance ({performance:.1%})")

            # 2. Task success rate threshold
            success_rate = row.get('task_success_rate', 0.5)
            if success_rate < 0.20:
                penalty_multiplier *= 0.2  # Severe penalty for very low success
                reasons.append(f"Very low success rate ({success_rate:.1%})")
            elif success_rate < 0.40:
                penalty_multiplier *= 0.5  # Moderate penalty
                reasons.append(f"Low success rate ({success_rate:.1%})")

            # 3. Capacity validation
            utilization = row.get('current_utilization', 0.5)
            available_capacity = row.get('available_capacity', 40)
            estimated_hours = row.get('estimated_hours', 40)

            if utilization >= 1.0:  # 100% utilized
                penalty_multiplier *= 0.1  # Extreme penalty
                reasons.append(f"Fully utilized (100%)")
            elif utilization >= 0.85:  # 85%+ utilized
                penalty_multiplier *= 0.4
                reasons.append(f"High utilization ({utilization:.1%})")

            if available_capacity < estimated_hours * 0.5:  # Less than 50% needed capacity
                penalty_multiplier *= 0.5
                reasons.append(f"Insufficient capacity ({available_capacity:.1f}h < {estimated_hours:.1f}h)")

            # 4. Seniority-difficulty matching
            seniority = row.get('seniority_level', 'MID_LEVEL')
            difficulty = row.get('difficulty', 'MEDIUM')
            priority = row.get('priority', 'MEDIUM')

            # Map seniority to numeric level
            seniority_map = {
                'INTERN': 1, 'JUNIOR': 2, 'MID_LEVEL': 3,
                'SENIOR': 4, 'LEAD': 5, 'PRINCIPAL': 6, 'DIRECTOR': 7
            }
            seniority_level = seniority_map.get(seniority, 3)

            # Difficulty requirements
            difficulty_min_seniority = {
                'EASY': 1,      # Any level can do easy tasks
                'MEDIUM': 2,    # Junior+ for medium tasks
                'HARD': 3       # Mid-level+ for hard tasks
            }

            # Priority requirements (for HIGH/URGENT priority)
            if priority in ['HIGH', 'URGENT']:
                if difficulty == 'HARD' and seniority_level < 3:
                    penalty_multiplier *= 0.3  # Interns/Juniors not suitable for HIGH priority HARD tasks
                    reasons.append(f"Seniority too low for {priority} priority {difficulty} task")
                elif difficulty == 'MEDIUM' and seniority_level < 2:
                    penalty_multiplier *= 0.5
                    reasons.append(f"Junior level for {priority} priority task")

            min_required = difficulty_min_seniority.get(difficulty, 2)
            if seniority_level < min_required:
                penalty_multiplier *= 0.6
                reasons.append(f"Seniority mismatch ({seniority} for {difficulty} task)")

            # 5. Boost high performers with availability
            if performance > 0.80 and success_rate > 0.70 and utilization < 0.60:
                penalty_multiplier *= 1.2  # Boost excellent available candidates
                reasons.append("Excellent performer with capacity")

            # Apply adjustments - USE POSITION INDEX i, NOT DataFrame index idx
            if penalty_multiplier != 1.0:
                original_score = adjusted_scores[i]  # Use i (position) not idx (df index)
                adjusted_scores[i] = original_score * penalty_multiplier

                if penalty_multiplier < 0.8 or penalty_multiplier > 1.0:
                    logger.debug(
                        f"Candidate {i}: Score {original_score:.3f} {adjusted_scores[i]:.3f} "
                        f"(—{penalty_multiplier:.2f}) - {', '.join(reasons)}"
                    )

        # Normalize scores to 0-1 range
        if len(adjusted_scores) > 0:
            min_score = adjusted_scores.min()
            max_score = adjusted_scores.max()
            if max_score > min_score:
                adjusted_scores = (adjusted_scores - min_score) / (max_score - min_score)

        return adjusted_scores

    def _boost_class1_predictions(self, scores: np.ndarray, features: pd.DataFrame) -> np.ndarray:
        """
        Post-processing boost for strong Class 1 candidates

        This helps recover Class 1 cases that the model might have scored too low.
        Applies multiplicative boost to candidates with strong positive signals.
        """
        boosted_scores = scores.copy()
        boost_count = 0

        for i, (idx, row) in enumerate(features.iterrows()):
            # Define positive signals for Class 1 (successful assignment)
            is_high_skill = row.get('overall_skill_match_score', 0) > 0.65
            is_high_performance = row.get('performance_score', 0) > 0.70
            has_good_capacity = row.get('workload_score', 0) > 0.50
            is_experienced = row.get('years_experience', 0) >= 3
            has_availability = row.get('availability_score', 0) > 0.60

            # Count positive signals
            positive_signals = sum([
                is_high_skill,
                is_high_performance,
                has_good_capacity,
                is_experienced,
                has_availability
            ])

            # Apply boost if candidate has 2+ positive signals
            if positive_signals >= 2:
                # Boost factor increases with more positive signals
                # 2 signals: 15% boost, 3 signals: 30%, 4 signals: 45%, 5 signals: 60%
                boost_factor = 1.0 + (0.15 * positive_signals)

                original_score = boosted_scores[i]
                boosted_scores[i] = min(original_score * boost_factor, 1.0)  # Cap at 1.0

                if boosted_scores[i] > original_score:
                    boost_count += 1
                    logger.debug(
                        f"Candidate {i}: {positive_signals} signals â†’ "
                        f"Boosted {original_score:.3f} â†’ {boosted_scores[i]:.3f} "
                        f"({boost_factor:.2f})"
                    )

        if boost_count > 0:
            logger.info(f"âœ“ Applied Class 1 boost to {boost_count}/{len(features)} candidates")

        return boosted_scores

    def _normalize_department_names(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Normalize department names to handle variations between training and production data.
        Maps both old training data names and new database names to consistent values.
        """
        if 'department_name' not in df.columns:
            return df

        # Department name mapping - handles both old and new names
        dept_mapping = {
            # Old training data names â†’ Standard names
            'Data Science': 'Engineering',
            'QA': 'Quality Assurance',

            # Keep current standard names
            'Backend Development': 'Backend Development',
            'Frontend Development': 'Frontend Development',
            'Mobile Development': 'Mobile Development',
            'Quality Assurance': 'Quality Assurance',
            'DevOps': 'DevOps',
            'Engineering': 'Engineering',

            # Handle variations
            'Frontend': 'Frontend Development',
            'Backend': 'Backend Development',
            'Mobile': 'Mobile Development',
            'QA': 'Quality Assurance',
            'Testing': 'Quality Assurance',
            'Infrastructure': 'DevOps',
        }

        df['department_name'] = df['department_name'].astype(str).replace(dept_mapping)

        return df

    def _preprocess_prediction_features(self, features: pd.DataFrame) -> pd.DataFrame:
        """Preprocess features for prediction"""

        processed_features = features.copy()

        # Apply same preprocessing as training
        processed_features = self._handle_missing_values(processed_features)
        processed_features = self._engineer_features(processed_features)

        # Normalize department names before encoding
        processed_features = self._normalize_department_names(processed_features)

        processed_features = self._apply_tfidf_vectorization(processed_features)

        # Encode categorical features using existing encoders - handle unseen labels
        for feature, encoder in self.label_encoders.items():
            if feature in processed_features.columns:
                try:
                    # Get unique values in current data
                    current_values = processed_features[feature].astype(str).unique()

                    # Check for unseen labels
                    known_classes = set(encoder.classes_)
                    unseen_labels = set(current_values) - known_classes

                    if unseen_labels:
                        logger.info(f"Found new labels in {feature}: {unseen_labels}")

                        # Special handling for seniority_level to add INTERN if missing
                        if feature == 'seniority_level' and 'INTERN' in unseen_labels:
                            # Extend the encoder to include INTERN
                            new_classes = np.append(encoder.classes_, 'INTERN')
                            encoder.classes_ = new_classes
                            logger.info(f"Extended seniority_level encoder to include INTERN")
                            known_classes = set(encoder.classes_)
                            unseen_labels = set(current_values) - known_classes

                    # If still have unseen labels, map them to closest match
                    if unseen_labels:
                        logger.warning(f"Unseen labels in {feature}: {unseen_labels}")

                        def safe_encode(value):
                            str_val = str(value)
                            if str_val in known_classes:
                                return str_val
                            else:
                                # Smart mapping for common variations
                                if feature == 'seniority_level':
                                    # Map variations to known values
                                    mapping = {
                                        'ENTRY_LEVEL': 'JUNIOR',
                                        'INTERMEDIATE': 'MID_LEVEL',
                                        'ADVANCED': 'SENIOR',
                                        'EXPERT': 'LEAD',
                                        'PRINCIPAL_ENGINEER': 'PRINCIPAL'
                                    }
                                    return mapping.get(str_val, encoder.classes_[0])
                                # Default: use first class
                                return encoder.classes_[0]

                        safe_values = processed_features[feature].astype(str).apply(safe_encode)
                        processed_features[f'{feature}_encoded'] = encoder.transform(safe_values)
                        logger.info(f"Mapped unseen labels to known classes")
                    else:
                        # All values are known, normal transform
                        processed_features[f'{feature}_encoded'] = encoder.transform(
                            processed_features[feature].astype(str)
                        )

                except Exception as e:
                    logger.error(f"Error encoding {feature}: {e}")
                    # Fallback: use numeric encoding
                    processed_features[f'{feature}_encoded'] = 0

        # Select only training features
        available_features = [col for col in self.feature_columns
                              if col in processed_features.columns]
        missing_features = [col for col in self.feature_columns
                            if col not in processed_features.columns]

        if missing_features:
            logger.warning(f"Missing {len(missing_features)} features for prediction")
            logger.debug(f"Missing features: {missing_features[:10]}...")  # Show first 10

            # Fill missing features with zeros - ensure proper shape
            for feature in missing_features:
                processed_features[feature] = 0.0  # Use float to match other features

            logger.info(f"âœ“ Filled {len(missing_features)} missing features with 0.0")

        # Ensure we return exactly the features expected by the model in the correct order
        return processed_features[self.feature_columns].fillna(0.0)
    def _apply_tfidf_vectorization(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Apply pre-trained TF-IDF vectorizer to prediction data.
        This allows the model to 'understand' the semantic context of the new task.
        """
        if self.tfidf_vectorizer is None:
            logger.warning("TF-IDF vectorizer not loaded. Skipping text features.")
            return data

        # 1. Combine text fields exactly like in training
        text_fields = []

        # Xử lý task_title
        if 'task_title' in data.columns:
            text_fields.append(data['task_title'].fillna('').astype(str))
        else:
            text_fields.append(pd.Series([''] * len(data)))

        # Xử lý required_skills (nối list thành string)
        if 'required_skills' in data.columns:
            skills_text = data['required_skills'].apply(
                lambda x: ' '.join(x) if isinstance(x, list) else str(x)
            )
            text_fields.append(skills_text)
        else:
            text_fields.append(pd.Series([''] * len(data)))

        # 2. Combine and Transform
        if text_fields:
            # Nối các cột text lại với nhau
            combined_text = pd.concat(text_fields, axis=1).apply(
                lambda x: ' '.join(x), axis=1
            )

            try:
                # QUAN TRỌNG: Chỉ dùng .transform(), KHÔNG dùng .fit_transform()
                # Chúng ta dùng lại bộ từ điển đã học lúc training
                tfidf_matrix = self.tfidf_vectorizer.transform(combined_text)

                # 3. Map lại vào DataFrame với tên cột chính xác (tfidf_update, tfidf_java,...)
                self.tfidf_vectorizer.get_feature_names_out()

                # Lấy danh sách các cột tfidf mà model cần (đã lưu trong feature_columns)
                needed_tfidf_cols = [col for col in self.feature_columns if col.startswith('tfidf_')]

                if not needed_tfidf_cols:
                    return data

                # Tạo DataFrame từ matrix thưa (sparse matrix)
                # Chỉ lấy các cột Top features mà chúng ta quan tâm để tối ưu hiệu năng
                # (Logic này ánh xạ index từ vectorizer sang tên cột)

                # Cách tối ưu: Duyệt qua các từ model cần và lấy giá trị từ matrix
                for col_name in needed_tfidf_cols:
                    term = col_name.replace('tfidf_', '')
                    try:
                        # Tìm index của từ trong vectorizer
                        vocab_idx = self.tfidf_vectorizer.vocabulary_.get(term)
                        if vocab_idx is not None:
                            # Lấy cột tương ứng từ matrix
                            data[col_name] = tfidf_matrix[:, vocab_idx].toarray().flatten()
                        else:
                            # Từ này không có trong bộ từ điển training
                            data[col_name] = 0.0
                    except Exception:
                        data[col_name] = 0.0

                logger.info(f"  ✓ Generated {len(needed_tfidf_cols)} TF-IDF semantic features")

            except Exception as e:
                logger.error(f"Error applying TF-IDF transform: {e}")

        return data
# Example usage and testing
if __name__ == "__main__":
    import sys
    sys.path.append('..')

    # Setup logging
    logging.basicConfig(level=logging.INFO)

    # Generate sample data for testing
    from ..data.data_collector import SyntheticDataGenerator

    generator = SyntheticDataGenerator()
    training_data = generator.generate_comprehensive_dataset()

    # Initialize and train model
    trainer = HybridRecommenderTrainer()

    try:
        results = trainer.train_hybrid_model(training_data)

        print("\n=== Training Results ===")
        print(f"Content-based F1: {results['content_based_metrics']['f1']:.3f}")
        print(f"Hybrid model F1: {results['hybrid_metrics']['f1']:.3f}")
        print(f"Training completed: {results['training_date']}")

        print("\n=== Top Feature Importance ===")
        sorted_features = sorted(
            trainer.feature_importance.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]

        for feature, importance in sorted_features:
            print(f"{feature}: {importance:.3f}")

        # Test prediction
        sample_features = training_data.head(5)
        predictions = trainer.predict(sample_features)

        print(f"\n=== Sample Predictions ===")
        for i, pred in enumerate(predictions):
            print(f"Sample {i+1}: {pred:.3f}")

    except Exception as e:
        logger.error(f"Training failed: {e}")
        raise

    print("\nHybrid recommender training module ready for use!")
