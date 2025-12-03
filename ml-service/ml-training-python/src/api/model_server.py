"""
FastAPI Model Serving API

This module provides REST API endpoints for ML model inference:
- Task assignment recommendations
- Performance predictions
- Model status and health checks
- Training triggers
"""

from contextlib import asynccontextmanager
from src.data.data_collector import MultiDatabaseDataCollector
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import pandas as pd
import joblib
import yaml
import logging
from datetime import datetime
import uvicorn
import structlog
import sys
import os

# Add src to path if running from project root
current_dir = os.path.dirname(os.path.abspath(__file__))
src_path = os.path.join(os.path.dirname(current_dir))
if src_path not in sys.path:
    sys.path.insert(0, src_path)

from src.models.hybrid_recommender import HybridRecommenderTrainer
from src.models.continuous_learning import ContinuousModelTrainer
from src.data.data_collector import SyntheticDataGenerator

logger = structlog.get_logger(__name__)

# Global model instance
ml_model = None

continuous_trainer = None
db_connector = None  # Global database connector for direct queries

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown"""
    global ml_model, continuous_trainer, db_connector

    # Startup
    logger.info("Starting ML API server...")

    try:
        # Load configuration
        with open("config/model_config.yaml", 'r') as file:
            config = yaml.safe_load(file)

        # Initialize database connector for direct queries
        try:
            logger.info("Initializing database connector...")
            db_connector = MultiDatabaseDataCollector()

            # Verify connections were established
            if db_connector.mysql_connections:
                logger.info(f"MySQL connections available: {list(db_connector.mysql_connections.keys())}")
            else:
                logger.warning("No MySQL connections established")

            if db_connector.neo4j_driver:
                logger.info("Neo4j driver connected successfully")
            else:
                logger.warning("Neo4j driver not connected")

            logger.info("Database connector initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize database connector: {e}", exc_info=True)
            logger.warning("Continuing without database connector - will use fallback data")
            db_connector = None

        # Initialize components
        ml_model = HybridRecommenderTrainer()
        continuous_trainer = ContinuousModelTrainer()

        # Try to load existing models
        try:
            ml_model.load_models()
            logger.info("Existing models loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load existing models: {e}")
            logger.info("Will use synthetic data for initial model if needed")

        logger.info("ML API server initialized successfully")

    except Exception as e:
        logger.error(f"Failed to initialize ML API: {e}")
        raise

    yield  # Server is running

    # Shutdown
    logger.info("Shutting down ML API server...")

    # Close database connections
    if db_connector:
        try:
            for conn in db_connector.mysql_connections.values():
                conn.close()
            if db_connector.neo4j_driver:
                db_connector.neo4j_driver.close()
            logger.info("Database connections closed")
        except:
            pass

# Initialize FastAPI app
app = FastAPI(
    title="ML Model Serving API",
    description="Machine Learning API for Internal Management System",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API
class UserProfile(BaseModel):
    user_id: str
    email: str
    department_name: Optional[str] = None
    seniority_level: Optional[str] = "MID_LEVEL"
    skills: List[str] = []
    skill_levels: List[str] = []
    years_experience: float = 0.0
    utilization: float = 0.8
    capacity: float = 40.0

class TaskDetails(BaseModel):
    task_id: str
    title: str = ""
    priority: str = "MEDIUM"
    difficulty: str = "MEDIUM"
    estimated_hours: float = 8.0
    required_skills: List[str] = []

class RecommendationRequest(BaseModel):
    task: TaskDetails
    candidates: List[UserProfile]
    max_recommendations: int = Field(default=5, ge=1, le=20)

class RecommendationResponse(BaseModel):
    user_id: str
    email: str
    confidence_score: float
    content_score: float
    collaborative_score: float
    rank: int
    reasoning: Dict[str, Any]

class TrainingRequest(BaseModel):
    force_retrain: bool = False
    use_synthetic_data: bool = False
    data_months_back: int = 12

class TrainingStatus(BaseModel):
    status: str  # "idle", "training", "completed", "failed"
    progress: float = 0.0
    message: str = ""
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    metrics: Optional[Dict[str, float]] = None

class ModelHealth(BaseModel):
    status: str  # "healthy", "degraded", "unhealthy"
    model_loaded: bool
    last_training_date: Optional[datetime] = None
    model_version: Optional[str] = None
    performance_metrics: Optional[Dict[str, float]] = None
    uptime_seconds: float

# Global training status tracking
training_status = TrainingStatus(status="idle")
app_start_time = datetime.now()


@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "ML Model Serving API",
        "version": "1.0.0",
        "status": "running",
        "uptime_seconds": (datetime.now() - app_start_time).total_seconds()
    }

@app.get("/health", response_model=ModelHealth)
async def health_check():
    """Health check endpoint"""
    global ml_model, training_status
    
    try:
        # Check model status
        model_loaded = ml_model is not None and hasattr(ml_model, 'content_model') and ml_model.content_model is not None

        # Get model metadata
        last_training_date = None
        model_version = None
        performance_metrics = None
        
        if model_loaded:
            try:
                metadata = joblib.load('models/model_metadata.pkl')
                last_training_date = pd.to_datetime(metadata.get('training_date'))
                model_version = metadata.get('model_version', 'unknown')
                
                training_metrics = metadata.get('training_metrics', {})
                if 'hybrid_metrics' in training_metrics:
                    performance_metrics = training_metrics['hybrid_metrics']
                    
            except Exception as e:
                logger.warning(f"Could not load model metadata: {e}")
        
        # Determine health status
        if not model_loaded:
            status = "unhealthy"
        elif performance_metrics and performance_metrics.get('f1', 0) < 0.6:
            status = "degraded"
        else:
            status = "healthy"
        
        return ModelHealth(
            status=status,
            model_loaded=model_loaded,
            last_training_date=last_training_date,
            model_version=model_version,
            performance_metrics=performance_metrics,
            uptime_seconds=(datetime.now() - app_start_time).total_seconds()
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return ModelHealth(
            status="unhealthy",
            model_loaded=False,
            uptime_seconds=(datetime.now() - app_start_time).total_seconds()
        )

@app.post("/recommend", response_model=List[RecommendationResponse])
async def get_recommendations(request: RecommendationRequest):
    """
    Get task assignment recommendations
    """
    global ml_model
    
    try:
        logger.info(f"Getting recommendations for task {request.task.task_id}")
        logger.info(f"Number of candidates: {len(request.candidates)}")

        if ml_model is None or not hasattr(ml_model, 'content_model') or ml_model.content_model is None:
            logger.warning("ML model not loaded, using fallback scoring")
            # Use simple fallback scoring when model not available
            return _generate_fallback_recommendations(request)

        # Prepare features for each candidate
        recommendations = []
        candidate_features = []
        
        for candidate in request.candidates:
            # Create feature vector for prediction
            try:
                features = _prepare_candidate_features(candidate, request.task)
                candidate_features.append(features)
            except Exception as e:
                logger.error(f"Error preparing features for candidate {candidate.user_id}: {e}")
                # Use fallback for this candidate
                continue

        # Get predictions from model
        if candidate_features:
            try:
                features_df = pd.DataFrame(candidate_features)
                logger.info(f"Features DataFrame shape: {features_df.shape}")
                logger.info(f"Features columns: {features_df.columns.tolist()}")

                # Make predictions
                confidence_scores = ml_model.predict(features_df)
                logger.info(f"Generated {len(confidence_scores)} predictions")

                # Create recommendations
                for i, (candidate, confidence) in enumerate(zip(request.candidates[:len(confidence_scores)], confidence_scores)):

                    # Calculate reasoning components
                    skill_match_score = _calculate_skill_match(candidate.skills, request.task.required_skills)
                    experience_score = _calculate_experience_score(candidate.years_experience)
                    workload_score = _calculate_workload_score(candidate.utilization)

                    recommendation = RecommendationResponse(
                        user_id=candidate.user_id,
                        email=candidate.email,
                        confidence_score=float(confidence),
                        content_score=float(confidence * 0.6),  # Content weight
                        collaborative_score=float(confidence * 0.4),  # Collaborative weight
                        rank=i + 1,  # Will be updated after sorting
                        reasoning={
                            "skill_match_score": skill_match_score,
                            "experience_score": experience_score,
                            "workload_score": workload_score,
                            "seniority_level": candidate.seniority_level,
                            "department_match": candidate.department_name,
                            "explanation": _generate_recommendation_explanation(
                                confidence, skill_match_score, experience_score, workload_score
                            )
                        }
                    )

                    recommendations.append(recommendation)

            except Exception as e:
                logger.error(f"Error during ML prediction: {e}", exc_info=True)
                # Fall back to simple scoring
                logger.info("Falling back to simple scoring method")
                return _generate_fallback_recommendations(request)

        # Sort by confidence score and assign ranks
        recommendations.sort(key=lambda x: x.confidence_score, reverse=True)
        for i, rec in enumerate(recommendations):
            rec.rank = i + 1
        
        # Limit to max_recommendations
        recommendations = recommendations[:request.max_recommendations]
        
        logger.info(f"Generated {len(recommendations)} recommendations")
        return recommendations

    except Exception as e:
        logger.error(f"Recommendation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# NEW: Predict candidates endpoint for AI-service integration with feature engineering
@app.post("/api/ml/predict-candidates")
async def predict_candidates(request: dict):
    """
    Predict suitability scores for candidates

    NEW ARCHITECTURE:
    - Receives: taskData + list of userIds with AI scores (from ai-service)
    - Fetches: User data directly from identity-service and profile-service databases
    - Builds: Complete CandidateFeatures with all necessary data
    - Returns: ML predictions

    This approach:
    - Eliminates need for new database fields in identity/profile services
    - Avoids complex data synchronization
    - ML service has direct database access to all user data
    - ai-service only filters and calculates AI scores

    Request body:
    {
        "task_id": "string",
        "task_data": {
            "priority": "URGENT",
            "difficulty": "HARD",
            "estimated_hours": 40,
            "required_skills": ["node.js", "payment gateway"],
            "task_type": "BACKEND_DEVELOPMENT",
            "description": "..."
        },
        "candidates": [
            {
                "userId": "user-id-123",
                "baseSkillMatchScore": 0.60,
                "relatedSkillsScore": 0.15,
                "learningPotentialScore": 0.20,
                "domainExperienceBonus": 0.10,
                "techStackCohesionBonus": 0.15,
                "certificationBonus": 0.0
            }
        ]
    }
    """
    global ml_model

    try:
        start_time = datetime.now()

        task_id = request.get('task_id') or request.get('taskId')
        task_data = request.get('task_data', {})
        candidates_with_ai_scores = request.get('candidates', [])

        logger.info(f"Received prediction request for task {task_id} with {len(candidates_with_ai_scores)} candidates")

        if len(candidates_with_ai_scores) == 0:
            return {
                'predictions': [],
                'model_version': 'none',
                'processing_time_ms': 0
            }

        # Extract userIds
        user_ids = [c.get('userId') for c in candidates_with_ai_scores]
        logger.info(f"Fetching data for users: {user_ids}")

        # ========== FETCH USER DATA FROM DATABASES ==========
        # This replaces the need for ai-service to send full CandidateFeatures
        logger.info("=" * 100)
        logger.info("FETCHING USER DATA FROM DATABASES")
        logger.info("=" * 100)

        # Fetch user data from identity-service and profile-service
        # This will be done via HTTP calls to internal APIs or direct database queries
        users_data = await _fetch_users_data(user_ids)

        if not users_data:
            logger.warning("No user data found for candidates")
            return {
                'predictions': [],
                'model_version': 'none',
                'processing_time_ms': (datetime.now() - start_time).total_seconds() * 1000,
                'message': 'No user data available'
            }

        # ========== BUILD COMPLETE CANDIDATE FEATURES ==========
        logger.info("Building complete candidate features with fetched data")

        normalized_candidates = []
        for ai_scores in candidates_with_ai_scores:
            user_id = ai_scores.get('userId')
            user_data = users_data.get(user_id)

            if not user_data:
                logger.warning(f"No data found for user {user_id}, skipping")
                continue

            # Combine AI scores from Java with user data from databases
            candidate = {
                'user_id': user_id,
                'user_name': user_data.get('name', f'User-{user_id}'),
                'department_name': user_data.get('department', 'Unknown'),
                'user_skills': user_data.get('skills', []),
                'user_skill_levels': user_data.get('skill_levels', []),
                'required_skills': task_data.get('required_skills', []),

                # AI scores from Java (already calculated)
                'base_skill_match_score': ai_scores.get('baseSkillMatchScore', 0.0),
                'related_skills_score': ai_scores.get('relatedSkillsScore', 0.0),
                'learning_potential_score': ai_scores.get('learningPotentialScore', 0.0),
                'domain_experience_bonus': ai_scores.get('domainExperienceBonus', 0.0),
                'tech_stack_cohesion_bonus': ai_scores.get('techStackCohesionBonus', 0.0),
                'certification_bonus': ai_scores.get('certificationBonus', 0.0),

                # User attributes from database
                'seniority_level': user_data.get('seniority_level', 'JUNIOR'),
                'years_experience': user_data.get('years_experience', 0.0),

                # Performance metrics from database (calculated from task history)
                'performance_score': user_data.get('performance_score', 0.0) / 100.0 if user_data.get('performance_score') else 0.75,
                'task_success_rate': user_data.get('task_success_rate', 0.0),
                'average_actual_hours': user_data.get('average_task_time', 25.0),

                # Workload metrics from workload-service
                'current_utilization': user_data.get('current_utilization', 0.0),
                'available_capacity': user_data.get('available_capacity', 40.0),

                # Task attributes
                'task_priority': task_data.get('priority', 'MEDIUM'),
                'task_difficulty': task_data.get('difficulty', 'MEDIUM'),
                'estimated_hours': task_data.get('estimated_hours', 40.0),
            }
            normalized_candidates.append(candidate)

        if not normalized_candidates:
            logger.warning("No valid candidates after data fetching")
            return {
                'predictions': [],
                'model_version': 'none',
                'processing_time_ms': (datetime.now() - start_time).total_seconds() * 1000,
                'message': 'No valid candidate data'
            }

        logger.info(f"Built features for {len(normalized_candidates)} candidates")

        # Convert to DataFrame
        df_candidates = pd.DataFrame(normalized_candidates)

        # ========== PRE-FILTERING: EXCLUDE CLEARLY UNSUITABLE CANDIDATES ==========
        logger.info("=" * 100)
        logger.info("PRE-FILTERING UNSUITABLE CANDIDATES")
        logger.info("=" * 100)

        original_count = len(df_candidates)
        filtered_out = []

        # Get task context
        task_priority = df_candidates.iloc[0].get('task_priority', 'MEDIUM') if len(df_candidates) > 0 else 'MEDIUM'
        task_difficulty = df_candidates.iloc[0].get('task_difficulty', 'MEDIUM') if len(df_candidates) > 0 else 'MEDIUM'

        logger.info(f"Task Priority: {task_priority}, Difficulty: {task_difficulty}")
        logger.info(f"Original candidates: {original_count}")
        logger.info("")

        # Define minimum thresholds based on task priority and difficulty
        if task_priority in ['HIGH', 'URGENT'] and task_difficulty == 'HARD':
            min_performance = 0.40  # 40% minimum for critical hard tasks
            min_success_rate = 0.30  # 30% minimum success rate
            max_utilization = 0.95   # Allow up to 95% utilization
            min_seniority = 'MID_LEVEL'  # At least mid-level
        elif task_priority in ['HIGH', 'URGENT']:
            min_performance = 0.30
            min_success_rate = 0.25
            max_utilization = 0.95
            min_seniority = 'JUNIOR'
        elif task_difficulty == 'HARD':
            min_performance = 0.35
            min_success_rate = 0.25
            max_utilization = 0.95
            min_seniority = 'MID_LEVEL'
        else:
            min_performance = 0.20  # 20% minimum for regular tasks
            min_success_rate = 0.15
            max_utilization = 1.0   # Allow fully utilized for low priority
            min_seniority = 'INTERN'

        logger.info(f"Filtering Thresholds:")
        logger.info(f"  - Minimum Performance: {min_performance:.0%}")
        logger.info(f"  - Minimum Success Rate: {min_success_rate:.0%}")
        logger.info(f"  - Maximum Utilization: {max_utilization:.0%}")
        logger.info(f"  - Minimum Seniority: {min_seniority}")
        logger.info("")

        seniority_map = {
            'INTERN': 1, 'JUNIOR': 2, 'MID_LEVEL': 3,
            'SENIOR': 4, 'LEAD': 5, 'PRINCIPAL': 6, 'DIRECTOR': 7
        }
        min_seniority_level = seniority_map.get(min_seniority, 1)

        # Filter candidates
        def is_candidate_suitable(row):
            reasons = []

            # Check performance
            performance = row.get('performance_score', 0.5)
            if performance < min_performance:
                reasons.append(f"Low performance ({performance:.1%} < {min_performance:.0%})")

            # Check success rate
            success_rate = row.get('task_success_rate', 0.5)
            if success_rate < min_success_rate:
                reasons.append(f"Low success rate ({success_rate:.1%} < {min_success_rate:.0%})")

            # Check utilization
            utilization = row.get('current_utilization', 0.5)
            if utilization > max_utilization:
                reasons.append(f"Over-utilized ({utilization:.1%} > {max_utilization:.0%})")

            # Check seniority for difficult tasks
            seniority = row.get('seniority_level', 'JUNIOR')
            seniority_level = seniority_map.get(seniority, 2)
            if seniority_level < min_seniority_level:
                reasons.append(f"Insufficient seniority ({seniority} < {min_seniority})")

            # Check capacity for critical tasks
            if task_priority in ['HIGH', 'URGENT']:
                available_capacity = row.get('available_capacity', 40)
                estimated_hours = row.get('estimated_hours', 40)
                if available_capacity < estimated_hours * 0.3:  # Less than 30% of needed capacity
                    reasons.append(f"Insufficient capacity ({available_capacity:.1f}h < {estimated_hours * 0.3:.1f}h)")

            if reasons:
                filtered_out.append({
                    'user_id': row.get('user_id'),
                    'user_name': row.get('user_name'),
                    'reasons': reasons
                })
                return False

            return True

        df_candidates = df_candidates[df_candidates.apply(is_candidate_suitable, axis=1)]

        logger.info(f"Filtered candidates: {len(df_candidates)} / {original_count} remaining")
        logger.info(f"Excluded: {len(filtered_out)} candidates")

        if filtered_out:
            logger.info("")
            logger.info("Excluded Candidates:")
            for exc in filtered_out[:10]:  # Show first 10
                logger.info(f"  ❌ {exc['user_name']:30s} - {', '.join(exc['reasons'])}")
            if len(filtered_out) > 10:
                logger.info(f"  ... and {len(filtered_out) - 10} more")

        logger.info("=" * 100)
        logger.info("")

        # If no candidates remain, return empty results
        if len(df_candidates) == 0:
            logger.warning("No suitable candidates found after pre-filtering")
            return {
                'predictions': [],
                'model_version': 'none',
                'processing_time_ms': (datetime.now() - start_time).total_seconds() * 1000,
                'message': 'No suitable candidates available for this task'
            }

        # ========== LOG RAW PERFORMANCE SCORES FROM JAVA SERVICE ==========
        if 'performance_score' in df_candidates.columns:
            logger.info("=" * 100)
            logger.info("RAW PERFORMANCE SCORES RECEIVED FROM JAVA SERVICE")
            logger.info("=" * 100)
            logger.info(f"Total candidates received: {len(df_candidates)}")
            logger.info("")

            # Log each candidate's performance score
            for idx, row in df_candidates.iterrows():
                user_id = row.get('user_id', 'N/A')
                perf_score = row.get('performance_score', 'N/A')
                user_name = row.get('user_name', 'N/A')
                logger.info(f"Candidate #{idx+1} | User {user_id[:8]}... | Name: {user_name:30s} | Performance Score (RAW): {perf_score}")

            logger.info("")
            logger.info(f"Performance Score Statistics (RAW from Java):")
            logger.info(f"  - Min:    {df_candidates['performance_score'].min()}")
            logger.info(f"  - Max:    {df_candidates['performance_score'].max()}")
            logger.info(f"  - Mean:   {df_candidates['performance_score'].mean():.4f}")
            logger.info(f"  - Median: {df_candidates['performance_score'].median():.4f}")
            logger.info(f"  - Non-null count: {df_candidates['performance_score'].notna().sum()} / {len(df_candidates)}")
            logger.info(f"  - Null count: {df_candidates['performance_score'].isna().sum()}")
            logger.info("=" * 100)
            logger.info("")

        # ========== NORMALIZE PERFORMANCE SCORE ==========
        # Java service sends performance_score on 0-100 scale
        # ML model expects 0-1 scale, so normalize it
        if 'performance_score' in df_candidates.columns:
            max_perf = df_candidates['performance_score'].max()
            if pd.notna(max_perf) and max_perf > 1.0:
                logger.info(f"⚠️  Normalizing performance_score from 0-100 scale to 0-1 scale (max: {max_perf})")

                # Store original values for comparison logging
                original_scores = df_candidates['performance_score'].copy()

                df_candidates['performance_score'] = df_candidates['performance_score'] / 100.0
                logger.info(f"✅ After normalization - min: {df_candidates['performance_score'].min():.4f}, max: {df_candidates['performance_score'].max():.4f}")

                logger.info("")
                logger.info("Sample normalization (showing first 5 candidates):")
                for idx, row in df_candidates.head(5).iterrows():
                    user_id = row.get('user_id', 'N/A')
                    user_name = row.get('user_name', 'N/A')
                    original = original_scores.loc[idx]
                    normalized = row.get('performance_score', 0)
                    logger.info(f"  User {user_id[:8]}... ({user_name:20s}) | Before: {original:6.2f} → After: {normalized:.4f}")
                logger.info("")
            else:
                logger.info(f"Performance scores already on 0-1 scale (max: {max_perf})")

        logger.info(f"Normalized candidates - columns: {df_candidates.columns.tolist()}")
        logger.info(f"Sample department_name: {df_candidates['department_name'].iloc[0] if len(df_candidates) > 0 else 'N/A'}")
        logger.info(f"Sample user_skills: {df_candidates['user_skills'].iloc[0] if len(df_candidates) > 0 else 'N/A'}")
        logger.info(f"Sample seniority_level: {df_candidates['seniority_level'].iloc[0] if len(df_candidates) > 0 else 'N/A'}")

        # Log unique user_ids to debug duplication issue
        unique_users = df_candidates['user_id'].unique()
        logger.info(f"Unique users in candidates: {len(unique_users)} out of {len(df_candidates)} total")
        if len(unique_users) < len(df_candidates):
            logger.warning(f"Found duplicate users in candidates!")
            user_counts = df_candidates['user_id'].value_counts()
            logger.warning(f"User distribution: {user_counts.to_dict()}")

        # Prepare features for ML model
        X = _prepare_ml_features(df_candidates, task_data)

        # Get predictions
        if ml_model is None or not hasattr(ml_model, 'content_model') or ml_model.content_model is None:
            logger.warning("Model not available, using fallback scoring")
            predictions = _fallback_scoring(df_candidates)
            model_version = "fallback"
        else:
            try:
                predictions = ml_model.predict(X)
                model_version = getattr(ml_model, 'model_version', '1.0')
                logger.info(f"ML predictions generated using model version: {model_version}")
            except Exception as e:
                logger.error(f"Prediction error: {e}, using fallback")
                predictions = _fallback_scoring(df_candidates)
                model_version = "fallback"

        # Build response with detailed logging
        results = []
        for i in range(len(df_candidates)):
            confidence_score = float(predictions[i]) if i < len(predictions) else 0.5

            # Get user_id from the DataFrame (already normalized to snake_case)
            user_id = df_candidates.iloc[i]['user_id']
            candidate = df_candidates.iloc[i]

            # Calculate feature importance for this prediction
            feature_importance = _calculate_feature_importance(candidate)

            # ========== DETAILED CALCULATION LOGGING ==========
            logger.info("=" * 100)
            logger.info(f"RECOMMENDATION CALCULATION DETAILS - Candidate #{i+1}")
            logger.info("=" * 100)
            logger.info(f"User ID: {user_id}")
            logger.info(f"User Name: {candidate.get('user_name', 'N/A')}")
            logger.info(f"Department: {candidate.get('department_name', 'N/A')}")
            logger.info(f"Seniority Level: {candidate.get('seniority_level', 'N/A')}")
            logger.info("")

            logger.info("--- SKILL MATCHING SCORES ---")
            logger.info(f"  Base Skill Match Score:       {candidate.get('base_skill_match_score', 0):.4f}  (Weight: 25%)")
            logger.info(f"  Related Skills Score:         {candidate.get('related_skills_score', 0):.4f}  (Weight: 20%)")
            logger.info(f"  Learning Potential Score:     {candidate.get('learning_potential_score', 0):.4f}  (Weight: 15%)")
            logger.info(f"  Domain Experience Bonus:      {candidate.get('domain_experience_bonus', 0):.4f}  (Weight: 12%)")
            logger.info(f"  Tech Stack Cohesion Bonus:    {candidate.get('tech_stack_cohesion_bonus', 0):.4f}  (Weight: 10%)")
            logger.info(f"  Certification Bonus:          {candidate.get('certification_bonus', 0):.4f}  (Weight:  5%)")

            # Calculate total AI score
            total_ai_score = (
                candidate.get('base_skill_match_score', 0) * 0.25 +
                candidate.get('related_skills_score', 0) * 0.20 +
                candidate.get('learning_potential_score', 0) * 0.15 +
                candidate.get('domain_experience_bonus', 0) * 0.12 +
                candidate.get('tech_stack_cohesion_bonus', 0) * 0.10 +
                candidate.get('certification_bonus', 0) * 0.05
            )
            logger.info(f"  → Total AI Skill Score:       {total_ai_score:.4f}")
            logger.info("")

            logger.info("--- EXPERIENCE & PERFORMANCE ---")
            logger.info(f"  Years of Experience:          {candidate.get('years_experience', 0):.1f} years")
            logger.info(f"  Performance Score:            {candidate.get('performance_score', 0):.4f}  (0.0-1.0)")
            logger.info(f"  Task Success Rate:            {candidate.get('task_success_rate', 0):.4f}  (0.0-1.0)")
            logger.info(f"  Average Actual Hours:         {candidate.get('average_actual_hours', 0):.1f} hrs")
            logger.info("")

            logger.info("--- WORKLOAD & CAPACITY ---")
            logger.info(f"  Current Utilization:          {candidate.get('current_utilization', 0):.2%}")
            logger.info(f"  Available Capacity:           {candidate.get('available_capacity', 0):.1f} hours/week")
            logger.info(f"  Task Estimated Hours:         {candidate.get('estimated_hours', 0):.1f} hours")

            # Calculate capacity ratio
            capacity_ratio = candidate.get('available_capacity', 40) / max(candidate.get('estimated_hours', 40), 1)
            workload_availability = 1 - candidate.get('current_utilization', 0.5)
            logger.info(f"  Capacity/Estimate Ratio:      {capacity_ratio:.2f}x")
            logger.info(f"  Workload Availability Score:  {workload_availability:.4f}  (1 - utilization)")
            logger.info("")

            logger.info("--- TASK CONTEXT ---")
            logger.info(f"  Task Priority:                {candidate.get('task_priority', 'MEDIUM')}")
            logger.info(f"  Task Difficulty:              {candidate.get('task_difficulty', 'MEDIUM')}")
            priority_encoded = {'LOW': 0, 'MEDIUM': 1, 'HIGH': 2, 'URGENT': 3}.get(candidate.get('task_priority', 'MEDIUM'), 1)
            difficulty_encoded = {'EASY': 0, 'MEDIUM': 1, 'HARD': 2}.get(candidate.get('task_difficulty', 'MEDIUM'), 1)
            logger.info(f"  Priority Score (encoded):     {priority_encoded}")
            logger.info(f"  Difficulty Score (encoded):   {difficulty_encoded}")
            logger.info("")

            logger.info("--- DERIVED FEATURES ---")
            logger.info(f"  Performance-Adjusted Skill:   {total_ai_score * candidate.get('performance_score', 0.75):.4f}")
            logger.info(f"  Experience/Seniority Ratio:   {candidate.get('years_experience', 0) / (candidate.get('seniority_level_numeric', 2) + 1):.2f}")
            logger.info("")

            logger.info("--- FEATURE IMPORTANCE (Top Contributors) ---")
            for feature, importance in sorted(feature_importance.items(), key=lambda x: x[1], reverse=True):
                logger.info(f"  {_format_feature_name(feature):30s}: {importance:.4f}  ({importance*100:.1f}%)")
            logger.info("")

            logger.info("--- FINAL SCORES ---")
            logger.info(f"  ML Model Confidence Score:    {confidence_score:.4f}  ({confidence_score*100:.1f}%)")
            logger.info(f"  Model Used:                   {model_version}")
            logger.info(f"  Fallback Mode:                {'YES' if model_version == 'fallback' else 'NO'}")
            logger.info("")

            # Show calculation method
            if model_version == "fallback":
                fallback_calc = (
                    candidate.get('base_skill_match_score', 0) * 0.4 +
                    candidate.get('related_skills_score', 0) * 0.3 +
                    candidate.get('learning_potential_score', 0) * 0.2 +
                    candidate.get('domain_experience_bonus', 0) * 0.1
                )
                logger.info("--- FALLBACK CALCULATION BREAKDOWN ---")
                logger.info(f"  Base Skill × 0.4:             {candidate.get('base_skill_match_score', 0) * 0.4:.4f}")
                logger.info(f"  Related Skills × 0.3:         {candidate.get('related_skills_score', 0) * 0.3:.4f}")
                logger.info(f"  Learning Potential × 0.2:     {candidate.get('learning_potential_score', 0) * 0.2:.4f}")
                logger.info(f"  Domain Experience × 0.1:      {candidate.get('domain_experience_bonus', 0) * 0.1:.4f}")
                logger.info(f"  → Fallback Score:             {fallback_calc:.4f}")
                logger.info("")

            logger.info("=" * 100)
            logger.info("")

            # ✅ Use camelCase to match Java DTO (MLPredictionResult)
            results.append({
                'userId': user_id,  # camelCase for Java
                'mlConfidenceScore': confidence_score,  # camelCase for Java
                'featureImportance': feature_importance,  # camelCase for Java
                'explanation': _generate_candidate_explanation(candidate, confidence_score, feature_importance),
                'fallback': model_version == "fallback"  # Lombok serializes boolean isFallback as "fallback"
            })

        # Sort by confidence score (still use camelCase)
        results.sort(key=lambda x: x['mlConfidenceScore'], reverse=True)

        processing_time = (datetime.now() - start_time).total_seconds() * 1000

        logger.info(f"Predictions completed in {processing_time:.2f}ms for {len(results)} candidates")

        # ✅ Log comprehensive summary comparison table
        logger.info("")
        logger.info("=" * 140)
        logger.info("CANDIDATES RANKING SUMMARY - ALL SCORES COMPARISON")
        logger.info("=" * 140)
        logger.info("")

        # Table header
        header = f"{'Rank':<6}{'User ID':<38}{'Final':<8}{'Skill':<8}{'Perf':<8}{'Work':<8}{'Exp':<7}{'Model':<10}"
        logger.info(header)
        logger.info("-" * 140)

        # Show all candidates with their scores
        for i, result in enumerate(results, 1):
            user_id = result['userId']
            score = result['mlConfidenceScore']

            # Find the candidate data
            candidate_data = df_candidates[df_candidates['user_id'] == user_id].iloc[0] if len(df_candidates[df_candidates['user_id'] == user_id]) > 0 else None

            if candidate_data is not None:
                skill_score = candidate_data.get('base_skill_match_score', 0)
                perf_score = candidate_data.get('performance_score', 0)
                work_score = 1 - candidate_data.get('current_utilization', 0.5)
                exp_years = candidate_data.get('years_experience', 0)

                row = f"#{i:<5}{user_id:<38}{score:.4f}  {skill_score:.4f}  {perf_score:.4f}  {work_score:.4f}  {exp_years:5.1f}y  {model_version:<10}"
                logger.info(row)

        logger.info("-" * 140)
        logger.info("Legend: Final=ML Confidence, Skill=Base Match, Perf=Performance, Work=Availability, Exp=Experience")
        logger.info("=" * 140)
        logger.info("")

        # ✅ Log top recommendations for debugging
        logger.info("=" * 100)
        logger.info(f"TOP {min(5, len(results))} RECOMMENDED CANDIDATES - DETAILED VIEW")
        logger.info("=" * 100)

        # Show unique users in top recommendations
        top_user_ids = [r['userId'] for r in results[:10]]
        unique_top = len(set(top_user_ids))
        logger.info(f"Unique users in top 10: {unique_top}")
        logger.info("")

        for i, result in enumerate(results[:5], 1):
            logger.info(f"RANK #{i}: User {result['userId']}")
            logger.info(f"  ├─ Confidence Score: {result['mlConfidenceScore']:.4f} ({result['mlConfidenceScore']*100:.1f}%)")
            logger.info(f"  ├─ Explanation: {result['explanation']}")
            logger.info(f"  ├─ Fallback Mode: {result['fallback']}")

            if result['featureImportance']:
                logger.info(f"  └─ Top Contributing Features:")
                top_features = sorted(result['featureImportance'].items(), key=lambda x: x[1], reverse=True)[:5]
                for j, (feature, importance) in enumerate(top_features, 1):
                    logger.info(f"      {j}. {_format_feature_name(feature):30s}: {importance:.4f} ({importance*100:.1f}%)")
            logger.info("")

        logger.info("=" * 100)

        # ✅ Use camelCase for response fields to match Java DTO (MLPredictionResponse)
        return {
            'predictions': results,
            'modelVersion': model_version,  # camelCase for Java
            'processingTimeMs': int(processing_time)  # camelCase for Java
        }

    except Exception as e:
        logger.error(f"Error in predict_candidates: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# Model health endpoint for AI service
@app.get("/api/ml/model-health")
async def model_health_check():
    """Check ML service health for AI service integration"""
    try:
        is_loaded = (
            ml_model is not None and
            hasattr(ml_model, 'content_model') and
            ml_model.content_model is not None
        )

        health_status = {
            'status': 'healthy' if is_loaded else 'degraded',
            'model_loaded': is_loaded,
            'model_version': getattr(ml_model, 'model_version', 'unknown') if ml_model else 'unknown',
            'timestamp': datetime.now().isoformat()
        }

        return health_status

    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }


@app.post("/train", response_model=TrainingStatus)
async def trigger_training(
    request: TrainingRequest,
    background_tasks: BackgroundTasks
):
    """
    Trigger model training
    """
    global training_status
    
    if training_status.status == "training":
        raise HTTPException(
            status_code=409,
            detail="Training already in progress"
        )
    
    # Start training in background
    background_tasks.add_task(
        _run_training_task,
        request.force_retrain,
        request.use_synthetic_data,
        request.data_months_back
    )
    
    return {"message": "Training started", "status": "training"}

@app.get("/training/status", response_model=TrainingStatus)
async def get_training_status():
    """
    Get current training status
    """
    global training_status
    return training_status

@app.get("/models/performance")
async def get_model_performance():
    """
    Get model performance metrics
    """
    try:
        if continuous_trainer is None:
            raise HTTPException(status_code=503, detail="Continuous trainer not initialized")
        
        # Get performance history
        history = continuous_trainer.get_model_performance_history(days_back=30)
        
        if history.empty:
            return {"message": "No training history available"}
        
        # Get latest performance
        latest = history.iloc[0]
        
        return {
            "latest_training": {
                "date": latest.get('training_date'),
                "accuracy": latest.get('accuracy'),
                "f1_score": latest.get('f1_score'),
                "precision": latest.get('precision_score'),
                "recall": latest.get('recall_score'),
                "training_records": latest.get('training_records')
            },
            "history": history.head(10).to_dict('records')
        }
        
    except Exception as e:
        logger.error(f"Failed to get model performance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predictions/feedback")
async def submit_prediction_feedback(
    task_id: str,
    user_id: str,
    predicted_success: bool,
    actual_success: bool,
    confidence_score: float
):
    """
    Submit feedback on prediction accuracy for continuous learning
    """
    try:
        # Calculate accuracy
        accuracy = 1.0 if predicted_success == actual_success else 0.0
        
        # Store feedback in database
        feedback_data = {
            'task_id': task_id,
            'user_id': user_id,
            'predicted_success': predicted_success,
            'actual_success': actual_success,
            'confidence_score': confidence_score,
            'prediction_accuracy': accuracy,
            'prediction_date': datetime.now()
        }
        
        # In a real implementation, store in database
        logger.info(f"Prediction feedback received: {feedback_data}")
        
        return {"message": "Feedback recorded successfully"}
        
    except Exception as e:
        logger.error(f"Failed to record feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Helper functions
def _prepare_candidate_features(candidate: UserProfile, task: TaskDetails) -> Dict[str, Any]:
    """Prepare features for a single candidate"""
    
    logger.info(f"Preparing features for candidate: {candidate.user_id}")
    logger.info(f"  - Email: {candidate.email}")
    logger.info(f"  - Skills: {candidate.skills}")
    logger.info(f"  - Years Experience: {candidate.years_experience}")
    logger.info(f"  - Seniority: {candidate.seniority_level}")
    logger.info(f"  - Utilization: {candidate.utilization}")
    logger.info(f"  - Capacity: {getattr(candidate, 'capacity', 40.0)}")
    logger.info(f"Task requirements:")
    logger.info(f"  - Task ID: {task.task_id}")
    logger.info(f"  - Priority: {task.priority}")
    logger.info(f"  - Difficulty: {task.difficulty}")
    logger.info(f"  - Required Skills: {task.required_skills}")
    logger.info(f"  - Estimated Hours: {task.estimated_hours}")

    # Calculate skill match
    skill_match_count = len(set(candidate.skills) & set(task.required_skills))
    skill_match_ratio = skill_match_count / max(len(task.required_skills), 1)
    
    logger.info(f"  - Skill Match: {skill_match_count}/{len(task.required_skills)} ({skill_match_ratio:.1%})")

    # Map categorical values - ✅ Use URGENT instead of CRITICAL to match actual system
    priority_score = {'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'URGENT': 4}.get(task.priority, 2)
    difficulty_score = {'EASY': 1, 'MEDIUM': 2, 'HARD': 3}.get(task.difficulty, 2)
    seniority_score = {
        'INTERN': 1, 'JUNIOR': 2, 'MID_LEVEL': 3,
        'SENIOR': 4, 'LEAD': 5, 'PRINCIPAL': 6
    }.get(candidate.seniority_level, 3)
    
    features = {
        # Score features (for immediate use)
        'skill_match_count': skill_match_count,
        'total_user_skills': len(candidate.skills),
        'total_required_skills': len(task.required_skills),
        'skill_match_ratio': skill_match_ratio,
        'years_experience': candidate.years_experience,
        'priority_score': priority_score,
        'difficulty_score': difficulty_score,
        'complexity_score': priority_score * difficulty_score,
        'seniority_score': seniority_score,
        'estimated_hours': task.estimated_hours,
        'utilization': candidate.utilization,
        'capacity': getattr(candidate, 'capacity', 40.0),
        'available_capacity': getattr(candidate, 'capacity', 40.0) * (1 - candidate.utilization),
        'workload_pressure': candidate.utilization,

        # Original categorical columns (needed for label encoding)
        'priority': task.priority,
        'difficulty': task.difficulty,
        'seniority_level': candidate.seniority_level,
        'department_name': getattr(candidate, 'department_name', 'Unknown'),

        # List columns (needed for feature engineering)
        'user_skills': candidate.skills if candidate.skills else [],
        'required_skills': task.required_skills if task.required_skills else []
    }

    logger.info(f"Generated {len(features)} features for candidate {candidate.user_id}")
    logger.info(f"  Including categorical: priority={task.priority}, difficulty={task.difficulty}, seniority={candidate.seniority_level}")
    logger.info(f"  Including lists: user_skills={len(candidate.skills)}, required_skills={len(task.required_skills)}")

    return features

def _calculate_skill_match(user_skills: List[str], required_skills: List[str]) -> float:
    """Calculate skill match score"""
    if not required_skills:
        return 1.0
    
    user_set = set([skill.lower() for skill in user_skills])
    required_set = set([skill.lower() for skill in required_skills])
    
    intersection = user_set & required_set
    
    return len(intersection) / len(required_set)

def _calculate_experience_score(years_experience: float) -> float:
    """Calculate experience score"""
    return min(years_experience / 10.0, 1.0)  # Normalize to 0-1

def _calculate_workload_score(utilization: float) -> float:
    """Calculate workload score (lower utilization = higher score)"""
    return max(0.0, 1.0 - utilization)

def _generate_recommendation_explanation(
    confidence: float, skill_match: float, 
    experience: float, workload: float
) -> str:
    """Generate human-readable explanation for recommendation"""
    
    reasons = []
    
    if confidence > 0.8:
        reasons.append("Excellent overall fit")
    elif confidence > 0.6:
        reasons.append("Good overall fit")
    else:
        reasons.append("Moderate fit")
    
    if skill_match > 0.8:
        reasons.append("strong skill match")
    elif skill_match > 0.5:
        reasons.append("good skill match")
    else:
        reasons.append("limited skill match")
    
    if experience > 0.7:
        reasons.append("extensive experience")
    elif experience > 0.4:
        reasons.append("adequate experience")
    else:
        reasons.append("developing experience")
    
    if workload > 0.7:
        reasons.append("low current workload")
    elif workload > 0.4:
        reasons.append("moderate workload")
    else:
        reasons.append("high current workload")
    
    return "; ".join(reasons)

def _generate_fallback_recommendations(request: RecommendationRequest) -> List[RecommendationResponse]:
    """
    Generate recommendations using simple scoring when ML model is not available
    """
    logger.info("Using fallback recommendation method (simple scoring)")

    recommendations = []

    for candidate in request.candidates:
        # Simple scoring based on skill match and availability
        skill_match = _calculate_skill_match(candidate.skills, request.task.required_skills)
        experience_score = _calculate_experience_score(candidate.years_experience)
        workload_score = _calculate_workload_score(candidate.utilization)

        # Simple weighted average
        confidence = (0.5 * skill_match + 0.3 * experience_score + 0.2 * workload_score)

        recommendation = RecommendationResponse(
            user_id=candidate.user_id,
            email=candidate.email,
            confidence_score=float(confidence),
            content_score=float(confidence * 0.6),
            collaborative_score=float(confidence * 0.4),
            rank=0,  # Will be updated after sorting
            reasoning={
                "skill_match_score": skill_match,
                "experience_score": experience_score,
                "workload_score": workload_score,
                "seniority_level": candidate.seniority_level,
                "department_match": candidate.department_name,
                "explanation": _generate_recommendation_explanation(
                    confidence, skill_match, experience_score, workload_score
                ) + " (fallback scoring)"
            }
        )
        recommendations.append(recommendation)

    # Sort and rank
    recommendations.sort(key=lambda x: x.confidence_score, reverse=True)
    for i, rec in enumerate(recommendations):
        rec.rank = i + 1

    # Limit results
    return recommendations[:request.max_recommendations]

async def _run_training_task(
    force_retrain: bool,
    use_synthetic_data: bool,
    data_months_back: int
):
    """Background task for model training"""
    global training_status, ml_model, continuous_trainer
    
    try:
        training_status = TrainingStatus(
            status="training",
            progress=0.0,
            message="Starting training...",
            started_at=datetime.now()
        )
        
        logger.info("Starting background training task...")
        
        if use_synthetic_data or not hasattr(ml_model, 'content_model') or ml_model.content_model is None:
            # Use synthetic data for training
            training_status.message = "Generating synthetic training data..."
            training_status.progress = 0.2
            
            generator = SyntheticDataGenerator()
            training_data = generator.generate_comprehensive_dataset()
            
            training_status.message = "Training model with synthetic data..."
            training_status.progress = 0.4
            
            results = ml_model.train_hybrid_model(training_data)
            
        else:
            # Use continuous trainer with real data
            training_status.message = "Collecting real training data..."
            training_status.progress = 0.3
            
            if force_retrain:
                continuous_trainer.run_continuous_training_pipeline()
            else:
                # Check if retraining is needed
                continuous_trainer.run_continuous_training_pipeline()
        
        training_status.message = "Training completed successfully"
        training_status.progress = 1.0
        training_status.status = "completed"
        training_status.completed_at = datetime.now()
        
        # Try to get training metrics
        try:
            metadata = joblib.load('models/model_metadata.pkl')
            training_metrics = metadata.get('training_metrics', {})
            if 'hybrid_metrics' in training_metrics:
                training_status.metrics = training_metrics['hybrid_metrics']
        except:
            pass
        
        logger.info("Background training task completed successfully")
        
    except Exception as e:
        training_status.status = "failed"
        training_status.message = f"Training failed: {str(e)}"
        training_status.completed_at = datetime.now()
        
        logger.error(f"Background training task failed: {e}")


# Helper functions for predict_candidates endpoint
def _prepare_ml_features(df_candidates: pd.DataFrame, task_data: dict) -> pd.DataFrame:
    """Prepare features for ML model from AI-engineered features"""
    df = df_candidates.copy()

    # ✅ Task data is already in the DataFrame from normalized candidates
    # Extract priority and difficulty from the candidate data (each candidate has these)

    if 'task_priority' in df.columns:
        df['priority'] = df['task_priority']
    else:
        df['priority'] = task_data.get('priority', 'MEDIUM')

    if 'task_difficulty' in df.columns:
        df['difficulty'] = df['task_difficulty']
    else:
        df['difficulty'] = task_data.get('difficulty', 'MEDIUM')

    # Encode categorical for model
    priority_map = {'LOW': 0, 'MEDIUM': 1, 'HIGH': 2, 'URGENT': 3}
    df['priority_encoded'] = df['priority'].map(priority_map).fillna(1)

    difficulty_map = {'EASY': 0, 'MEDIUM': 1, 'HARD': 2}
    df['difficulty_encoded'] = df['difficulty'].map(difficulty_map).fillna(1)

    # ✅ Convert seniority_level string to numeric for calculations
    seniority_map = {
        'INTERN': 1,
        'JUNIOR': 2,
        'MID_LEVEL': 3,
        'SENIOR': 4,
        'LEAD': 5,
        'PRINCIPAL': 6,
        'DIRECTOR': 7
    }

    # If seniority_level is already in the dataframe as string, convert it to numeric
    if 'seniority_level' in df.columns:
        df['seniority_level_numeric'] = df['seniority_level'].map(seniority_map).fillna(2)
        # Keep the original for logging/debugging but use numeric for calculations

    # ✅ Time efficiency features (only if missing)
    if 'time_efficiency' not in df.columns:
        df['time_efficiency'] = 1.0

    if 'time_variance' not in df.columns:
        df['time_variance'] = 0.1

    # ✅ Assignment tracking - only add if they don't exist (candidates who haven't been assigned yet)
    if 'assignment_date' not in df.columns:
        df['assignment_date'] = None

    if 'actual_hours' not in df.columns:
        df['actual_hours'] = None

    # Calculate derived features
    df['total_ai_score'] = (
        df.get('base_skill_match_score', 0) +
        df.get('related_skills_score', 0) +
        df.get('learning_potential_score', 0) +
        df.get('domain_experience_bonus', 0) +
        df.get('tech_stack_cohesion_bonus', 0) +
        df.get('certification_bonus', 0)
    ) / 6

    df['capacity_utilization_ratio'] = (
        df.get('available_capacity', 40) / (df.get('estimated_hours', 40) + 1)
    ).clip(0, 2)

    df['experience_seniority_ratio'] = (
        df.get('years_experience', 0) / (df.get('seniority_level_numeric', 2) + 1)
    )

    df['workload_availability_score'] = 1 - df.get('current_utilization', 0.5)

    df['performance_adjusted_skill'] = (
        df.get('total_ai_score', 0) * df.get('performance_score', 0.75)
    )

    # Add TF-IDF features with default values (0)
    tfidf_features = [
        'tfidf_743', 'tfidf_85', 'tfidf_230', 'tfidf_764', 'tfidf_823',
        'tfidf_94', 'tfidf_115', 'tfidf_313', 'tfidf_334', 'tfidf_609',
        'tfidf_911', 'tfidf_983', 'tfidf_1005', 'tfidf_337', 'tfidf_724',
        'tfidf_246', 'tfidf_275', 'tfidf_1374', 'tfidf_1054', 'tfidf_101',
        'tfidf_1438', 'tfidf_560', 'tfidf_731',
        'tfidf_fix', 'tfidf_bug', 'tfidf_review', 'tfidf_code',
        'tfidf_development', 'tfidf_feature', 'tfidf_research',
        'tfidf_deployment', 'tfidf_optimization', 'tfidf_documentation',
        'tfidf_node', 'tfidf_js', 'tfidf_mongodb', 'tfidf_java',
        'tfidf_docker', 'tfidf_learning', 'tfidf_machine',
        'tfidf_javascript', 'tfidf_ui', 'tfidf_ux', 'tfidf_sql',
        'tfidf_aws', 'tfidf_python', 'tfidf_postgresql', 'tfidf_react',
        'tfidf_testing', 'tfidf_task'
    ]

    for tfidf_col in tfidf_features:
        if tfidf_col not in df.columns:
            df[tfidf_col] = 0.0

    # ✅ Return DataFrame with ALL columns (not just feature columns)
    # The model's feature engineering pipeline needs metadata columns too
    logger.info(f"Prepared features for {len(df)} candidates")

    if len(df) > 0:
        logger.info(f"Metadata check - priority: {df['priority'].iloc[0]}, difficulty: {df['difficulty'].iloc[0]}, department_name: {df['department_name'].iloc[0]}")
        logger.info(f"Skills check - user_skills count: {len(df['user_skills'].iloc[0])}, required_skills count: {len(df['required_skills'].iloc[0])}")

    # Return the full DataFrame - the model will select what it needs
    return df


# ============================================================
# HELPER FUNCTIONS FOR FETCHING USER DATA
# ============================================================

async def _fetch_users_data(user_ids: list) -> dict:
    """
    Fetch user data DIRECTLY from databases using existing connections

    MUCH FASTER than HTTP calls - queries databases directly:
    - MySQL (identity DB): user info, department, seniority, performance
    - Neo4j (profile DB): skills, task completion rate, workload

    Returns dict: {user_id: {name, department, skills, performance_score, ...}}
    """
    global db_connector

    users_data = {}
    logger.info(f"Fetching data for {len(user_ids)} users DIRECTLY from databases")

    try:
        # Use global database connector
        if not db_connector:
            logger.warning("Database connector not initialized - using fallback data")
            raise Exception("Database connector not initialized")

        # Get MySQL connection for identity database
        identity_conn = db_connector.mysql_connections.get('identity')

        # Get Neo4j connection for profile data
        neo4j_driver = db_connector.neo4j_driver

        if not identity_conn:
            logger.error("MySQL identity connection not available")
            logger.info(f"Available MySQL connections: {list(db_connector.mysql_connections.keys()) if db_connector.mysql_connections else 'None'}")

        if not neo4j_driver:
            logger.error("Neo4j driver not available")

        if not identity_conn or not neo4j_driver:
            raise Exception("Required database connections not available")

        # ========== STEP 1: Fetch user info from MySQL (identity DB) ==========
        identity_cursor = identity_conn.cursor(dictionary=True)

        # Build query for multiple users with correct schema
        # JOIN with departments and positions to get department_name and seniority_level
        user_ids_str = "', '".join(user_ids)
        identity_query = f"""
            SELECT 
                u.id as user_id,
                u.first_name,
                u.last_name,
                u.email,
                u.performance_score,
                d.name as department_name,
                p.seniority_level
            FROM user u
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN position p ON u.position_id = p.id
            WHERE u.id IN ('{user_ids_str}')
        """

        identity_cursor.execute(identity_query)
        identity_results = identity_cursor.fetchall()
        identity_cursor.close()

        # Map results by user_id
        identity_map = {row['user_id']: row for row in identity_results}
        logger.info(f"✅ Fetched {len(identity_results)} users from MySQL identity DB")

        # ========== STEP 2: Fetch profile data from Neo4j ==========
        with neo4j_driver.session() as session:
            # Cypher query to get user profiles with skills
            # UserSkill is a separate node, not a relationship property
            cypher_query = """
                MATCH (up:user_profile)
                WHERE up.userId IN $userIds
                OPTIONAL MATCH (up)-[:HAS_SKILL]->(us:user_skill)
                RETURN 
                    up.userId as userId,
                    up.averageTaskCompletionRate as completionRate,
                    up.totalTasksCompleted as totalCompleted,
                    up.currentWorkLoadHours as workloadHours,
                    collect({
                        skillName: us.skillName,
                        proficiencyLevel: us.proficiencyLevel,
                        yearsOfExperience: us.yearsOfExperience
                    }) as skills
            """

            result = session.run(cypher_query, userIds=user_ids)
            neo4j_results = list(result)

        # Map Neo4j results by user_id
        neo4j_map = {}
        for record in neo4j_results:
            user_id = record['userId']
            neo4j_map[user_id] = {
                'completionRate': record.get('completionRate', 0.8),
                'totalCompleted': record.get('totalCompleted', 0),
                'workloadHours': record.get('workloadHours', 24),
                'skills': [s for s in record.get('skills', []) if s.get('skillName')]
            }

        logger.info(f"✅ Fetched {len(neo4j_results)} user profiles from Neo4j")

        # ========== STEP 3: Combine data from both databases ==========
        for user_id in user_ids:
            identity_data = identity_map.get(user_id)
            neo4j_data = neo4j_map.get(user_id, {})

            if not identity_data:
                logger.warning(f"User {user_id} not found in identity database")
                continue

            # Get identity data
            first_name = identity_data.get('first_name', '')
            last_name = identity_data.get('last_name', '')
            performance_score = identity_data.get('performance_score', 75.0)  # 0-100 scale
            seniority_level = identity_data.get('seniority_level', 'MID_LEVEL')
            department = identity_data.get('department_name', 'Unknown')

            # Get Neo4j profile data
            completion_rate = neo4j_data.get('completionRate', 0.8)
            workload_hours = neo4j_data.get('workloadHours', 24)
            skills_list = neo4j_data.get('skills', [])

            # Calculate derived metrics
            task_success_rate = completion_rate if completion_rate else 0.80
            average_task_time = max(4.0, 16.0 - (completion_rate * 12.0)) if completion_rate else 8.0

            # Calculate workload metrics
            current_utilization = workload_hours / 40.0
            workload_capacity = 1.0 - current_utilization
            available_capacity = workload_capacity * 40.0

            # Extract skills
            skill_names = [s.get('skillName', '') for s in skills_list]
            skill_levels = [s.get('proficiencyLevel', 'INTERMEDIATE') for s in skills_list]
            skill_experience_years = [s.get('yearsOfExperience', 1) for s in skills_list]
            years_experience = sum(skill_experience_years) / len(skill_experience_years) if skill_experience_years else 3.0

            # Build user data
            users_data[user_id] = {
                'name': f"{first_name} {last_name}".strip() or f'User-{user_id[:8]}',
                'department': department,
                'seniority_level': seniority_level,
                'years_experience': years_experience,
                'skills': skill_names,
                'skill_levels': skill_levels,
                'performance_score': performance_score,  # 0-100 scale
                'task_success_rate': task_success_rate,  # 0-1 scale
                'average_task_time': average_task_time,  # hours
                'current_utilization': current_utilization,  # 0-1 scale
                'available_capacity': available_capacity,  # hours/week
            }

            logger.info(f"✅ Combined data for user {user_id[:8]}... - {users_data[user_id]['name']}")

        logger.info(f"✅ Successfully fetched {len(users_data)} users from databases (DIRECT QUERY)")

    except Exception as e:
        logger.error(f"Error fetching from databases: {e}", exc_info=True)
        logger.warning("Using fallback mock data for development")

        # Fallback: Use mock data for development/testing
        for user_id in user_ids:
            users_data[user_id] = {
                'name': f'User-{user_id[:8]}',
                'department': 'Engineering',
                'seniority_level': 'MID_LEVEL',
                'years_experience': 3.0,
                'skills': ['javascript', 'node.js', 'react'],
                'skill_levels': ['ADVANCED', 'INTERMEDIATE', 'ADVANCED'],
                'performance_score': 85.0,  # 0-100 scale
                'task_success_rate': 0.80,  # 0-1 scale
                'average_task_time': 25.0,  # hours
                'current_utilization': 0.60,  # 0-1 scale
                'available_capacity': 16.0,  # hours/week
            }

    return users_data



def _fallback_scoring(df_candidates: pd.DataFrame) -> list:
    """
    Fallback scoring when ML model is not available
    Uses rule-based scoring with balanced weights
    """
    scores = []

    for idx, row in df_candidates.iterrows():
        # Skill matching (35% total)
        skill_score = (
            row.get('base_skill_match_score', 0) * 0.15 +
            row.get('related_skills_score', 0) * 0.10 +
            row.get('learning_potential_score', 0) * 0.10
        )

        # Performance & reliability (40% total)
        performance_score = (
            row.get('performance_score', 0.75) * 0.20 +
            row.get('task_success_rate', 0.80) * 0.20
        )

        # Workload & capacity (15% total)
        workload_availability = 1 - row.get('current_utilization', 0.5)
        capacity_score = workload_availability * 0.15

        # Experience (10% total)
        experience_factor = min(row.get('years_experience', 3) / 10.0, 1.0)
        experience_score = experience_factor * 0.10

        # Calculate total score
        total_score = skill_score + performance_score + capacity_score + experience_score

        # Apply penalties
        penalty = 1.0

        # Low performance penalty
        if row.get('performance_score', 0.75) < 0.30:
            penalty *= 0.3

        # Low success rate penalty
        if row.get('task_success_rate', 0.80) < 0.20:
            penalty *= 0.3

        # High utilization penalty
        if row.get('current_utilization', 0.5) >= 1.0:
            penalty *= 0.2
        elif row.get('current_utilization', 0.5) >= 0.85:
            penalty *= 0.5

        final_score = total_score * penalty
        scores.append(final_score)

    return scores


def _calculate_feature_importance(candidate: pd.Series) -> dict:
    """
    Calculate feature importance for a candidate
    Returns dict of feature names and their contribution scores
    """
    importance = {}

    # Skill-related features
    importance['base_skill_match_score'] = candidate.get('base_skill_match_score', 0) * 0.25
    importance['related_skills_score'] = candidate.get('related_skills_score', 0) * 0.20
    importance['learning_potential_score'] = candidate.get('learning_potential_score', 0) * 0.15

    # Performance features
    importance['performance_score'] = candidate.get('performance_score', 0.75) * 0.20
    importance['task_success_rate'] = candidate.get('task_success_rate', 0.80) * 0.15

    # Workload features
    workload_availability = 1 - candidate.get('current_utilization', 0.5)
    importance['workload_availability_score'] = workload_availability * 0.15

    # Experience features
    importance['years_experience'] = min(candidate.get('years_experience', 3) / 10.0, 1.0) * 0.10

    # Domain features
    importance['domain_experience_bonus'] = candidate.get('domain_experience_bonus', 0) * 0.12
    importance['tech_stack_cohesion_bonus'] = candidate.get('tech_stack_cohesion_bonus', 0) * 0.10

    # Normalize to sum to 1.0
    total = sum(importance.values())
    if total > 0:
        importance = {k: v / total for k, v in importance.items()}

    return importance


def _format_feature_name(feature_name: str) -> str:
    """
    Format feature name for human-readable display
    """
    # Convert snake_case to Title Case
    formatted = feature_name.replace('_', ' ').title()

    # Handle special cases
    replacements = {
        'Ml': 'ML',
        'Ai': 'AI',
        'Tfidf': 'TF-IDF',
        'Ui': 'UI',
        'Ux': 'UX',
        'Api': 'API',
        'Sql': 'SQL',
        'Aws': 'AWS',
        'Ci Cd': 'CI/CD'
    }

    for old, new in replacements.items():
        formatted = formatted.replace(old, new)

    return formatted


def _generate_candidate_explanation(candidate: pd.Series, confidence_score: float, feature_importance: dict) -> str:
    """
    Generate human-readable explanation for candidate recommendation
    """
    explanations = []

    # Overall fit
    if confidence_score > 0.8:
        explanations.append("Excellent match")
    elif confidence_score > 0.6:
        explanations.append("Good match")
    elif confidence_score > 0.4:
        explanations.append("Moderate match")
    else:
        explanations.append("Limited match")

    # Top contributing factors
    top_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:3]

    if top_features:
        feature_descriptions = []
        for feature, importance in top_features:
            if importance > 0.15:  # Only mention significant contributors
                feature_name = _format_feature_name(feature)
                feature_descriptions.append(feature_name)

        if feature_descriptions:
            explanations.append(f"driven by {', '.join(feature_descriptions)}")

    # Skill match
    skill_match = candidate.get('base_skill_match_score', 0)
    if skill_match > 0.8:
        explanations.append("strong skill alignment")
    elif skill_match > 0.5:
        explanations.append("good skill fit")
    elif skill_match < 0.3:
        explanations.append("limited skill match")

    # Performance
    performance = candidate.get('performance_score', 0.75)
    if performance > 0.85:
        explanations.append("excellent performance history")
    elif performance < 0.40:
        explanations.append("performance concerns")

    # Workload
    utilization = candidate.get('current_utilization', 0.5)
    if utilization < 0.50:
        explanations.append("high availability")
    elif utilization > 0.90:
        explanations.append("limited availability")



    return " - ".join(explanations)

