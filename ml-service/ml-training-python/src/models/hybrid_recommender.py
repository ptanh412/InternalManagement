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

import pandas as pd
import numpy as np
import yaml
import joblib
import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import (
    train_test_split, GridSearchCV, cross_val_score, StratifiedKFold
)
from sklearn.preprocessing import StandardScaler, LabelEncoder, RobustScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, roc_auc_score
)
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from scipy.sparse import csr_matrix
import structlog

logger = structlog.get_logger(__name__)

class HybridRecommenderTrainer:
    """
    Advanced hybrid recommendation model trainer
    """
    
    def __init__(self, config_path: str = "config/model_config.yaml"):
        """Initialize trainer with configuration"""
        with open(config_path, 'r') as file:
            self.config = yaml.safe_load(file)
        
        self.model_config = self.config['model']
        self.training_config = self.config['training']
        
        # Model components
        self.content_model = None
        self.collaborative_model = None
        self.feature_scaler = StandardScaler()
        self.label_encoders = {}
        self.tfidf_vectorizer = TfidfVectorizer(max_features=1000)
        
        # Model metadata
        self.feature_columns = []
        self.feature_importance = {}
        self.training_metrics = {}
        
        logger.info("Hybrid recommender trainer initialized")
    
    def train_hybrid_model(self, training_data: pd.DataFrame) -> Dict[str, Any]:
        """
        Train complete hybrid recommendation model
        """
        logger.info(f"Starting hybrid model training with {len(training_data)} records")
        
        # Prepare training data
        processed_data = self._preprocess_data(training_data)
        X, y = self._prepare_features_and_targets(processed_data)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, 
            test_size=self.training_config['test_size'],
            random_state=self.training_config['random_state'],
            stratify=y
        )
        
        # Train content-based model
        content_metrics = self._train_content_based_model(X_train, X_test, y_train, y_test)
        
        # Train collaborative filtering model
        collab_metrics = self._train_collaborative_model(training_data)
        
        # Combine models and evaluate
        hybrid_metrics = self._evaluate_hybrid_model(
            X_test, y_test, training_data
        )
        
        # Save models
        self._save_models()
        
        # Compile training results
        training_results = {
            'content_based_metrics': content_metrics,
            'collaborative_metrics': collab_metrics,
            'hybrid_metrics': hybrid_metrics,
            'training_date': datetime.now(),
            'model_version': datetime.now().strftime("%Y%m%d_%H%M%S"),
            'training_samples': len(training_data)
        }
        
        self.training_metrics = training_results
        logger.info("Hybrid model training completed successfully")
        
        return training_results
    
    def _preprocess_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Comprehensive data preprocessing
        """
        logger.info("Preprocessing training data...")
        
        processed_data = data.copy()
        
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
        
        # Numerical columns - fill with median
        numerical_columns = [
            'estimated_hours', 'actual_hours', 'years_experience', 
            'utilization', 'capacity'
        ]
        
        for col in numerical_columns:
            if col in data.columns:
                data[col] = data[col].fillna(data[col].median())
        
        # Categorical columns - fill with mode
        categorical_columns = [
            'priority', 'difficulty', 'department_name', 'seniority_level'
        ]
        
        for col in categorical_columns:
            if col in data.columns:
                data[col] = data[col].fillna(data[col].mode()[0] if not data[col].mode().empty else 'UNKNOWN')
        
        # List columns - fill with empty lists
        list_columns = ['required_skills', 'user_skills', 'user_skill_levels']
        
        for col in list_columns:
            if col in data.columns:
                data[col] = data[col].apply(lambda x: x if isinstance(x, list) else [])
        
        return data
    
    def _engineer_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """Engineer advanced features for ML training"""
        
        # Skill-based features
        data['skill_match_count'] = data.apply(
            lambda row: len(set(row.get('user_skills', [])) & 
                           set(row.get('required_skills', []))), axis=1
        )
        
        data['total_user_skills'] = data['user_skills'].apply(
            lambda x: len(x) if isinstance(x, list) else 0
        )
        
        data['total_required_skills'] = data['required_skills'].apply(
            lambda x: len(x) if isinstance(x, list) else 0
        )
        
        data['skill_match_ratio'] = data['skill_match_count'] / np.maximum(
            data['total_required_skills'], 1
        )
        
        # Experience-based features
        data['experience_level'] = pd.cut(
            data['years_experience'], 
            bins=[-1, 2, 5, 10, float('inf')],
            labels=['Junior', 'Mid', 'Senior', 'Expert']
        )
        
        # Time-based features
        if 'assignment_date' in data.columns:
            data['assignment_date'] = pd.to_datetime(data['assignment_date'])
            data['assignment_day_of_week'] = data['assignment_date'].dt.dayofweek
            data['assignment_hour'] = data['assignment_date'].dt.hour
        
        # Performance-based features
        if 'actual_hours' in data.columns and 'estimated_hours' in data.columns:
            data['time_efficiency'] = data['estimated_hours'] / np.maximum(
                data['actual_hours'], 1
            )
            data['time_variance'] = np.abs(
                data['actual_hours'] - data['estimated_hours']
            )
        
        # Workload features
        if 'utilization' in data.columns and 'capacity' in data.columns:
            data['available_capacity'] = data['capacity'] * (1 - data['utilization'])
            data['workload_pressure'] = data['utilization']
        
        # Priority and difficulty interaction
        priority_weight = {'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4}
        difficulty_weight = {'EASY': 1, 'MEDIUM': 2, 'HARD': 3}
        
        data['priority_score'] = data['priority'].map(priority_weight).fillna(2)
        data['difficulty_score'] = data['difficulty'].map(difficulty_weight).fillna(2)
        data['complexity_score'] = data['priority_score'] * data['difficulty_score']
        
        # Seniority encoding
        seniority_weight = {
            'INTERN': 1, 'JUNIOR': 2, 'MID_LEVEL': 3,
            'SENIOR': 4, 'LEAD': 5, 'PRINCIPAL': 6
        }
        data['seniority_score'] = data['seniority_level'].map(seniority_weight).fillna(3)
        
        return data
    
    def _encode_categorical_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """Encode categorical features using label encoding"""
        
        categorical_features = [
            'priority', 'difficulty', 'department_name', 
            'seniority_level', 'experience_level'
        ]
        
        for feature in categorical_features:
            if feature in data.columns:
                if feature not in self.label_encoders:
                    self.label_encoders[feature] = LabelEncoder()
                    data[f'{feature}_encoded'] = self.label_encoders[feature].fit_transform(
                        data[feature].astype(str)
                    )
                else:
                    # Transform using existing encoder
                    data[f'{feature}_encoded'] = self.label_encoders[feature].transform(
                        data[feature].astype(str)
                    )
        
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
        
        # Define feature columns
        feature_columns = [
            'skill_match_count', 'total_user_skills', 'total_required_skills',
            'skill_match_ratio', 'years_experience', 'priority_score',
            'difficulty_score', 'complexity_score', 'seniority_score',
            'estimated_hours', 'utilization', 'capacity',
            'available_capacity', 'workload_pressure'
        ]
        
        # Add encoded categorical features
        encoded_features = [col for col in data.columns if col.endswith('_encoded')]
        feature_columns.extend(encoded_features)
        
        # Add TF-IDF features
        tfidf_features = [col for col in data.columns if col.startswith('tfidf_')]
        feature_columns.extend(tfidf_features)
        
        # Add time-based features if available
        time_features = [
            'assignment_day_of_week', 'assignment_hour',
            'time_efficiency', 'time_variance'
        ]
        for feature in time_features:
            if feature in data.columns:
                feature_columns.append(feature)
        
        # Filter existing columns
        feature_columns = [col for col in feature_columns if col in data.columns]
        self.feature_columns = feature_columns
        
        # Prepare features
        X = data[feature_columns].copy()
        
        # Fill any remaining missing values
        X = X.fillna(0)
        
        # Prepare target - binary classification based on performance
        if 'performance_score' in data.columns:
            y = (data['performance_score'] >= 0.7).astype(int)  # Good performance threshold
        else:
            # Fallback target based on task completion
            y = (data['task_status'] == 'COMPLETED').astype(int)
        
        logger.info(f"Prepared features: {X.shape}, Target distribution: {y.value_counts().to_dict()}")
        
        return X, y
    
    def _train_content_based_model(self, X_train: pd.DataFrame, X_test: pd.DataFrame,
                                 y_train: pd.Series, y_test: pd.Series) -> Dict[str, float]:
        """Train content-based recommendation model"""
        
        logger.info("Training content-based model...")
        
        # Scale features
        X_train_scaled = self.feature_scaler.fit_transform(X_train)
        X_test_scaled = self.feature_scaler.transform(X_test)
        
        # Hyperparameter tuning
        if self.training_config['hyperparameter_tuning']['enabled']:
            param_grid = {
                'n_estimators': [100, 200, 300],
                'max_depth': [10, 15, 20, None],
                'min_samples_split': [2, 5, 10],
                'min_samples_leaf': [1, 2, 4],
                'class_weight': ['balanced', None]
            }
            
            rf_base = RandomForestClassifier(
                random_state=self.training_config['random_state']
            )
            
            grid_search = GridSearchCV(
                rf_base, 
                param_grid,
                cv=self.training_config['cross_validation_folds'],
                scoring=self.training_config['hyperparameter_tuning']['scoring_metric'],
                n_jobs=-1
            )
            
            grid_search.fit(X_train_scaled, y_train)
            self.content_model = grid_search.best_estimator_
            
            logger.info(f"Best parameters: {grid_search.best_params_}")
        else:
            # Use default parameters
            self.content_model = RandomForestClassifier(
                n_estimators=200,
                max_depth=15,
                min_samples_split=5,
                class_weight='balanced',
                random_state=self.training_config['random_state']
            )
            
            self.content_model.fit(X_train_scaled, y_train)
        
        # Evaluate model
        y_pred = self.content_model.predict(X_test_scaled)
        y_pred_proba = self.content_model.predict_proba(X_test_scaled)[:, 1]
        
        # Calculate metrics
        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred, average='weighted'),
            'recall': recall_score(y_test, y_pred, average='weighted'),
            'f1': f1_score(y_test, y_pred, average='weighted'),
            'roc_auc': roc_auc_score(y_test, y_pred_proba)
        }
        
        # Feature importance
        self.feature_importance = dict(zip(
            self.feature_columns,
            self.content_model.feature_importances_
        ))
        
        # Cross-validation scores
        cv_scores = cross_val_score(
            self.content_model, X_train_scaled, y_train,
            cv=self.training_config['cross_validation_folds'],
            scoring='f1_weighted'
        )
        metrics['cv_f1_mean'] = cv_scores.mean()
        metrics['cv_f1_std'] = cv_scores.std()
        
        logger.info(f"Content-based model performance: {metrics}")
        
        return metrics
    
    def _train_collaborative_model(self, data: pd.DataFrame) -> Dict[str, float]:
        """Train collaborative filtering model using matrix factorization"""
        
        logger.info("Training collaborative filtering model...")
        
        # Create user-task interaction matrix
        if 'user_id' not in data.columns or 'task_id' not in data.columns:
            logger.warning("Missing user_id or task_id for collaborative filtering")
            return {'rmse': float('inf'), 'coverage': 0.0}
        
        users = data['user_id'].unique()
        tasks = data['task_id'].unique()
        
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
        
        # Apply SVD for matrix factorization
        n_components = min(50, min(len(users), len(tasks)) - 1)
        self.collaborative_model = TruncatedSVD(
            n_components=n_components,
            random_state=self.training_config['random_state']
        )
        
        user_factors = self.collaborative_model.fit_transform(interaction_matrix)
        
        # Calculate reconstruction error (RMSE)
        reconstructed = self.collaborative_model.inverse_transform(user_factors)
        
        # Calculate RMSE only on observed entries
        observed_mask = interaction_matrix.toarray() > 0
        if observed_mask.sum() > 0:
            mse = np.mean((interaction_matrix.toarray()[observed_mask] - 
                          reconstructed[observed_mask]) ** 2)
            rmse = np.sqrt(mse)
        else:
            rmse = float('inf')
        
        # Calculate coverage (percentage of user-task pairs we can predict)
        coverage = interaction_matrix.nnz / (len(users) * len(tasks))
        
        metrics = {
            'rmse': rmse,
            'coverage': coverage,
            'n_components': n_components,
            'explained_variance_ratio': self.collaborative_model.explained_variance_ratio_.sum()
        }
        
        logger.info(f"Collaborative filtering performance: {metrics}")
        
        return metrics
    
    def _evaluate_hybrid_model(self, X_test: pd.DataFrame, y_test: pd.Series,
                             full_data: pd.DataFrame) -> Dict[str, float]:
        """Evaluate the hybrid model combining content and collaborative filtering"""
        
        logger.info("Evaluating hybrid model...")
        
        # Get content-based predictions
        X_test_scaled = self.feature_scaler.transform(X_test)
        content_proba = self.content_model.predict_proba(X_test_scaled)[:, 1]
        
        # Simple collaborative score (can be enhanced with actual CF predictions)
        # For now, use a baseline collaborative score
        collaborative_scores = np.full(len(X_test), 0.5)
        
        # Combine predictions using configured weights
        content_weight = self.model_config['recommendation']['content_weight']
        collab_weight = self.model_config['recommendation']['collaborative_weight']
        
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
            'model_config': self.model_config
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
            
            logger.info("Models loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load models: {e}")
            raise
    
    def predict(self, features: pd.DataFrame) -> np.ndarray:
        """Make predictions using the hybrid model"""
        
        if self.content_model is None:
            raise ValueError("Models not trained or loaded")
        
        # Preprocess features
        processed_features = self._preprocess_prediction_features(features)
        
        # Scale features
        X_scaled = self.feature_scaler.transform(processed_features)
        
        # Get content-based predictions
        content_proba = self.content_model.predict_proba(X_scaled)[:, 1]
        
        # Simple collaborative scores (to be enhanced)
        collaborative_scores = np.full(len(features), 0.5)
        
        # Combine predictions
        content_weight = self.model_config['recommendation']['content_weight']
        collab_weight = self.model_config['recommendation']['collaborative_weight']
        
        hybrid_scores = (content_weight * content_proba + 
                        collab_weight * collaborative_scores)
        
        return hybrid_scores
    
    def _preprocess_prediction_features(self, features: pd.DataFrame) -> pd.DataFrame:
        """Preprocess features for prediction"""
        
        processed_features = features.copy()
        
        # Apply same preprocessing as training
        processed_features = self._handle_missing_values(processed_features)
        processed_features = self._engineer_features(processed_features)
        
        # Encode categorical features using existing encoders
        for feature, encoder in self.label_encoders.items():
            if feature in processed_features.columns:
                processed_features[f'{feature}_encoded'] = encoder.transform(
                    processed_features[feature].astype(str)
                )
        
        # Select only training features
        available_features = [col for col in self.feature_columns 
                            if col in processed_features.columns]
        missing_features = [col for col in self.feature_columns 
                          if col not in processed_features.columns]
        
        if missing_features:
            logger.warning(f"Missing features for prediction: {missing_features}")
            # Fill missing features with zeros
            for feature in missing_features:
                processed_features[feature] = 0
        
        return processed_features[self.feature_columns].fillna(0)


# Example usage and testing
if __name__ == "__main__":
    import os
    import sys
    sys.path.append('..')
    
    # Setup logging
    logging.basicConfig(level=logging.INFO)
    
    # Generate sample data for testing
    from data.data_collector import SyntheticDataGenerator
    
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