"""
FastAPI ML Service for Model Serving

This service provides REST API endpoints for:
- Model training
- Predictions
- Model management
"""

import logging
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Dict, Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from ..models.hybrid_recommender import HybridRecommenderTrainer
from ..models.continuous_learning import ContinuousModelTrainer
from ..data.data_collector import SyntheticDataGenerator, MultiDatabaseDataCollector

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for model instances
model_trainer = None
continuous_trainer = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown"""
    global model_trainer, continuous_trainer

    # Startup
    logger.info("Initializing ML API service...")

    try:
        model_trainer = HybridRecommenderTrainer()
        continuous_trainer = ContinuousModelTrainer()

        # Try to load existing models
        try:
            model_trainer.load_models()
            logger.info("Models loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load existing models: {e}")

        logger.info("ML API service initialized successfully")

    except Exception as e:
        logger.error(f"Failed to initialize ML API: {e}")
        raise

    yield  # Server is running

    # Shutdown
    logger.info("Shutting down ML API service...")

# Create FastAPI app
app = FastAPI(
    title="ML Training API",
    description="API for ML model training and serving",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class TrainingRequest(BaseModel):
    use_synthetic_data: bool = True
    force_retrain: bool = False
    months_back: int = 12

class TrainingResponse(BaseModel):
    success: bool
    message: str
    training_id: str
    model_version: Optional[str] = None

class PredictionRequest(BaseModel):
    features: Dict
    task_details: Dict
    user_profile: Dict

class PredictionResponse(BaseModel):
    success: bool
    confidence_score: float
    content_score: float
    collaborative_score: float
    explanation: str

class ModelStatus(BaseModel):
    available: bool
    model_version: Optional[str] = None
    last_training: Optional[datetime] = None
    performance_metrics: Dict = {}

class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    version: str

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        version="1.0.0"
    )

# Model status endpoint
@app.get("/model/status", response_model=ModelStatus)
async def get_model_status():
    """Get current model status"""
    try:
        if model_trainer is None:
            raise HTTPException(status_code=503, detail="Model trainer not initialized")
        
        # Check if models are loaded
        model_available = (
            hasattr(model_trainer, 'content_model') and model_trainer.content_model is not None and
            hasattr(model_trainer, 'feature_scaler') and model_trainer.feature_scaler is not None
        )
        
        status = ModelStatus(
            available=model_available,
            model_version=getattr(model_trainer, 'model_version', None),
            performance_metrics=getattr(model_trainer, 'training_metrics', {})
        )
        
        return status
        
    except Exception as e:
        logger.error(f"Error getting model status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Training endpoint
@app.post("/train", response_model=TrainingResponse)
async def train_model(request: TrainingRequest, background_tasks: BackgroundTasks):
    """Train ML models"""
    try:
        if model_trainer is None:
            raise HTTPException(status_code=503, detail="Model trainer not initialized")
        
        training_id = f"training_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        logger.info(f"Starting training with ID: {training_id}")
        
        # Run training in background
        background_tasks.add_task(
            run_training_task, 
            training_id, 
            request.use_synthetic_data, 
            request.force_retrain,
            request.months_back
        )
        
        return TrainingResponse(
            success=True,
            message="Training started successfully",
            training_id=training_id
        )
        
    except Exception as e:
        logger.error(f"Error starting training: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def run_training_task(training_id: str, use_synthetic: bool, 
                          force_retrain: bool, months_back: int):
    """Background task for model training"""
    try:
        logger.info(f"Running training task: {training_id}")
        
        # Collect training data
        if use_synthetic:
            generator = SyntheticDataGenerator()
            training_data = generator.generate_comprehensive_dataset()
            logger.info(f"Generated {len(training_data)} synthetic records")
        else:
            collector = MultiDatabaseDataCollector()
            training_data = collector.collect_comprehensive_training_data(months_back)
            logger.info(f"Collected {len(training_data)} real records")
        
        # Train models
        results = model_trainer.train_hybrid_model(training_data)
        
        logger.info(f"Training completed successfully for task: {training_id}")
        logger.info(f"F1 Score: {results['hybrid_metrics']['f1']:.3f}")
        
    except Exception as e:
        logger.error(f"Training task failed: {training_id}, Error: {e}")

# Prediction endpoint
@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """Make predictions using trained models"""
    try:
        if model_trainer is None or not hasattr(model_trainer, 'content_model') or model_trainer.content_model is None:
            raise HTTPException(status_code=503, detail="Models not available")
        
        # Prepare features from request
        import pandas as pd
        
        features_dict = {
            'skill_match_score': request.features.get('skill_match_score', 0.5),
            'experience_ratio': request.features.get('experience_ratio', 1.0),
            'priority_score': request.task_details.get('priority_score', 2),
            'difficulty_score': request.task_details.get('difficulty_score', 2),
            'estimated_hours': request.task_details.get('estimated_hours', 8),
            'utilization': request.user_profile.get('utilization', 0.8),
            'capacity': request.user_profile.get('capacity', 40),
            'seniority_score': request.user_profile.get('seniority_score', 3)
        }
        
        features_df = pd.DataFrame([features_dict])
        
        # Make prediction
        predictions = model_trainer.predict(features_df)
        confidence_score = float(predictions[0])
        
        # Generate explanation
        explanation = generate_prediction_explanation(
            confidence_score, features_dict
        )
        
        return PredictionResponse(
            success=True,
            confidence_score=confidence_score,
            content_score=confidence_score * 0.6,  # Simplified
            collaborative_score=0.5,  # Simplified
            explanation=explanation
        )
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def generate_prediction_explanation(confidence: float, features: Dict) -> str:
    """Generate human-readable explanation for prediction"""
    
    explanation_parts = []
    
    # Confidence level
    if confidence >= 0.8:
        explanation_parts.append("High confidence recommendation")
    elif confidence >= 0.6:
        explanation_parts.append("Moderate confidence recommendation")
    else:
        explanation_parts.append("Low confidence recommendation")
    
    # Key factors
    if features['skill_match_score'] >= 0.7:
        explanation_parts.append("Strong skill match")
    elif features['skill_match_score'] >= 0.4:
        explanation_parts.append("Moderate skill match")
    else:
        explanation_parts.append("Limited skill match")
    
    if features['experience_ratio'] >= 1.5:
        explanation_parts.append("High experience level")
    elif features['experience_ratio'] >= 1.0:
        explanation_parts.append("Adequate experience")
    else:
        explanation_parts.append("Limited experience")
    
    # Workload consideration
    if features['utilization'] <= 0.7:
        explanation_parts.append("Low current workload")
    elif features['utilization'] <= 0.9:
        explanation_parts.append("Moderate workload")
    else:
        explanation_parts.append("High workload")
    
    return ". ".join(explanation_parts) + "."

# Continuous training endpoints
@app.post("/continuous-training/start")
async def start_continuous_training():
    """Start continuous training pipeline"""
    try:
        if continuous_trainer is None:
            raise HTTPException(status_code=503, detail="Continuous trainer not initialized")
        
        # Run continuous training in background
        continuous_trainer.run_continuous_training_pipeline()
        
        return {"success": True, "message": "Continuous training pipeline started"}
        
    except Exception as e:
        logger.error(f"Error starting continuous training: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/training/history")
async def get_training_history():
    """Get training history"""
    try:
        if continuous_trainer is None:
            raise HTTPException(status_code=503, detail="Continuous trainer not initialized")
        
        history = continuous_trainer.get_model_performance_history(days_back=30)
        
        return {
            "success": True,
            "history": history.to_dict('records') if not history.empty else []
        }
        
    except Exception as e:
        logger.error(f"Error getting training history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Model management endpoints
@app.post("/model/reload")
async def reload_model():
    """Reload models from disk"""
    try:
        if model_trainer is None:
            raise HTTPException(status_code=503, detail="Model trainer not initialized")
        
        model_trainer.load_models()
        
        return {"success": True, "message": "Models reloaded successfully"}
        
    except Exception as e:
        logger.error(f"Error reloading models: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# NEW: Predict candidates endpoint for AI-service integration
@app.post("/api/ml/predict-candidates")
async def predict_candidates(request: dict):
    """
    Predict suitability scores for candidates with AI-engineered features

    Request body:
    {
        "task_id": "string",
        "task_data": {
            "priority": "URGENT",
            "difficulty": "HARD",
            "estimated_hours": 40,
            "required_skills": ["node.js", "payment gateway"]
        },
        "candidates": [
            {
                "user_id": "string",
                "base_skill_match_score": 0.41,
                "related_skills_score": 0.25,
                ...
            }
        ]
    }
    """
    try:
        from datetime import datetime
        import pandas as pd
        import numpy as np

        start_time = datetime.now()

        task_id = request.get('task_id')
        task_data = request.get('task_data', {})
        candidates = request.get('candidates', [])

        logger.info(f"Received prediction request for task {task_id} with {len(candidates)} candidates")

        if len(candidates) == 0:
            return {
                'predictions': [],
                'model_version': 'none',
                'processing_time_ms': 0
            }

        # Convert to DataFrame
        df_candidates = pd.DataFrame(candidates)

        # Validate required features
        required_features = [
            'base_skill_match_score',
            'related_skills_score',
            'learning_potential_score',
            'domain_experience_bonus',
            'seniority_level',
            'years_experience',
            'current_utilization',
            'available_capacity'
        ]

        missing_features = [f for f in required_features if f not in df_candidates.columns]

        if missing_features:
            logger.warning(f"Missing features: {missing_features}, using defaults")
            for feature in missing_features:
                df_candidates[feature] = 0.0

        # Prepare features for ML model
        X = prepare_ml_features(df_candidates, task_data)

        # Get predictions
        if model_trainer is None or not hasattr(model_trainer, 'content_model') or model_trainer.content_model is None:
            logger.warning("Model not available, using fallback scoring")
            predictions = fallback_scoring(df_candidates)
            model_version = "fallback"
        else:
            try:
                predictions = model_trainer.predict(X)
                model_version = getattr(model_trainer, 'model_version', '1.0')
            except Exception as e:
                logger.error(f"Prediction error: {e}, using fallback")
                predictions = fallback_scoring(df_candidates)
                model_version = "fallback"

        # Build response
        results = []
        for i, candidate in enumerate(candidates):
            confidence_score = float(predictions[i]) if i < len(predictions) else 0.5

            # Calculate feature importance for this prediction
            feature_importance = calculate_feature_importance(df_candidates.iloc[i])

            results.append({
                'user_id': candidate.get('user_id'),
                'ml_confidence_score': confidence_score,
                'feature_importance': feature_importance,
                'explanation': generate_candidate_explanation(candidate, confidence_score, feature_importance),
                'is_fallback': model_version == "fallback"
            })

        # Sort by confidence score
        results.sort(key=lambda x: x['ml_confidence_score'], reverse=True)

        processing_time = (datetime.now() - start_time).total_seconds() * 1000

        logger.info(f"Predictions completed in {processing_time:.2f}ms")

        return {
            'predictions': results,
            'model_version': model_version,
            'processing_time_ms': int(processing_time)
        }

    except Exception as e:
        logger.error(f"Error in predict_candidates: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


def prepare_ml_features(df_candidates: 'pd.DataFrame', task_data: dict) -> 'pd.DataFrame':
    """Prepare features for ML model from AI-engineered features"""
    import pandas as pd

    df = df_candidates.copy()

    # ✅ Map task features properly
    df['estimated_hours'] = task_data.get('estimated_hours', 40)
    task_priority = task_data.get('priority', 'MEDIUM')
    task_difficulty = task_data.get('difficulty', 'MEDIUM')

    # Add task-level categorical columns (needed for feature engineering)
    df['priority'] = task_priority
    df['difficulty'] = task_difficulty

    # Encode categorical for model
    priority_map = {'LOW': 0, 'MEDIUM': 1, 'HIGH': 2, 'URGENT': 3}
    df['priority_encoded'] = df['priority'].map(priority_map).fillna(1)

    difficulty_map = {'EASY': 0, 'MEDIUM': 1, 'HARD': 2}
    df['difficulty_encoded'] = df['difficulty'].map(difficulty_map).fillna(1)

    # ✅ Add missing user-level columns with proper defaults
    # These columns are expected by the feature engineering pipeline

    # User skills and required skills (empty lists for text vectorization)
    if 'user_skills' not in df.columns:
        df['user_skills'] = [[] for _ in range(len(df))]

    if 'required_skills' not in df.columns:
        # Get required skills from task_data if available
        required_skills = task_data.get('required_skills', [])
        df['required_skills'] = [required_skills for _ in range(len(df))]

    # Department name - important for label encoding
    if 'department_name' not in df.columns:
        df['department_name'] = 'Unknown'  # Will be replaced by default encoder

    # Utilization and capacity - important metrics
    if 'utilization' not in df.columns:
        # Use current_utilization if available, otherwise default
        df['utilization'] = df.get('current_utilization', 0.5)

    if 'capacity' not in df.columns:
        # Use available_capacity if available, otherwise default
        df['capacity'] = df.get('available_capacity', 40.0)

    # Assignment tracking columns (None if not assigned yet)
    if 'assignment_date' not in df.columns:
        df['assignment_date'] = None  # None means not assigned yet

    if 'actual_hours' not in df.columns:
        df['actual_hours'] = None  # None means task not completed yet

    # ✅ Time efficiency features (defaults for new predictions)
    if 'time_efficiency' not in df.columns:
        df['time_efficiency'] = 1.0  # Default = good efficiency

    if 'time_variance' not in df.columns:
        df['time_variance'] = 0.1  # Default = low variance

    # Calculate derived features (from AI-engineered features)
    df['total_ai_score'] = (
        df.get('base_skill_match_score', 0) +
        df.get('related_skills_score', 0) +
        df.get('learning_potential_score', 0) +
        df.get('domain_experience_bonus', 0) +
        df.get('tech_stack_cohesion_bonus', 0) +
        df.get('certification_bonus', 0)
    ) / 6

    df['capacity_utilization_ratio'] = (
        df.get('available_capacity', 40) / (df['estimated_hours'] + 1)
    ).clip(0, 2)

    df['experience_seniority_ratio'] = (
        df.get('years_experience', 0) / (df.get('seniority_level', 1) + 1)
    )

    df['workload_availability_score'] = 1 - df.get('current_utilization', 0.5)

    df['performance_adjusted_skill'] = (
        df.get('total_ai_score', 0) * df.get('performance_score', 0.75)
    )

    # ✅ Add TF-IDF features with default values (0)
    # These are text-based features from task descriptions
    # Since we don't have raw text in predict mode, use defaults
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
            df[tfidf_col] = 0.0  # Default = no text match

    # ✅ Feature columns must match the trained model exactly
    feature_columns = [
        # AI-engineered features (from FeatureEngineeringService)
        'base_skill_match_score', 'related_skills_score', 'learning_potential_score',
        'domain_experience_bonus', 'tech_stack_cohesion_bonus', 'certification_bonus',

        # Candidate attributes
        'seniority_level', 'years_experience', 'current_utilization',
        'available_capacity', 'average_actual_hours', 'performance_score',
        'task_success_rate',

        # Task attributes
        'priority_encoded', 'difficulty_encoded', 'estimated_hours',

        # Derived features
        'total_ai_score', 'capacity_utilization_ratio',
        'experience_seniority_ratio', 'workload_availability_score',
        'performance_adjusted_skill',

        # Time features
        'time_efficiency', 'time_variance',

        # TF-IDF features (text-based)
        *tfidf_features
    ]

    # Handle any remaining missing columns
    for col in feature_columns:
        if col not in df.columns:
            if 'score' in col or 'rate' in col:
                df[col] = 0.5  # Default score/rate
            else:
                df[col] = 0.0  # Default numeric

    # Log feature preparation summary
    logger.info(f"Prepared {len(feature_columns)} features for {len(df)} candidates")
    logger.info(f"Task context: priority={task_priority}, difficulty={task_difficulty}, hours={df['estimated_hours'].iloc[0]}")

    return df[feature_columns]


def fallback_scoring(df_candidates: 'pd.DataFrame') -> list:
    """Fallback scoring when ML model is unavailable"""
    scores = []
    for _, candidate in df_candidates.iterrows():
        score = (
            candidate.get('base_skill_match_score', 0) * 0.4 +
            candidate.get('related_skills_score', 0) * 0.3 +
            candidate.get('learning_potential_score', 0) * 0.2 +
            candidate.get('domain_experience_bonus', 0) * 0.1
        )
        scores.append(score)
    return scores


def calculate_feature_importance(candidate_row: 'pd.Series') -> dict:
    """Calculate feature importance for individual prediction"""
    importance = {}

    # Key features and their weights
    feature_weights = {
        'base_skill_match_score': 0.25,
        'related_skills_score': 0.20,
        'learning_potential_score': 0.15,
        'domain_experience_bonus': 0.12,
        'tech_stack_cohesion_bonus': 0.10,
        'performance_score': 0.08,
        'task_success_rate': 0.05,
        'workload_availability_score': 0.05
    }

    total = 0
    for feature, weight in feature_weights.items():
        value = candidate_row.get(feature, 0)
        contrib = weight * value
        importance[feature] = contrib
        total += contrib

    # Normalize
    if total > 0:
        importance = {k: v/total for k, v in importance.items()}

    # Return top 5
    sorted_importance = sorted(importance.items(), key=lambda x: x[1], reverse=True)[:5]
    return dict(sorted_importance)


def generate_candidate_explanation(candidate: dict, confidence_score: float, feature_importance: dict) -> str:
    """Generate human-readable explanation"""
    explanation_parts = []

    # Overall confidence
    confidence_pct = confidence_score * 100

    if confidence_pct >= 80:
        explanation_parts.append("Excellent match")
    elif confidence_pct >= 60:
        explanation_parts.append("Good match")
    elif confidence_pct >= 40:
        explanation_parts.append("Moderate match")
    else:
        explanation_parts.append("Low match")

    # Top contributing factors
    if feature_importance:
        top_factors = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:3]
        factors_text = ", ".join([format_feature_name(f[0]) for f in top_factors])
        explanation_parts.append(f"driven by {factors_text}")

    return " - ".join(explanation_parts)


def format_feature_name(feature: str) -> str:
    """Format feature name for human readability"""
    formatted = feature.replace('_', ' ').title()

    # Special cases
    replacements = {
        'Ai Score': 'AI Score',
        'Ml': 'ML',
        'Api': 'API'
    }

    for old, new in replacements.items():
        formatted = formatted.replace(old, new)

    return formatted


# Model health endpoint
@app.get("/api/ml/model-health")
async def model_health():
    """Check ML service health"""
    try:
        is_loaded = (
            model_trainer is not None and
            hasattr(model_trainer, 'content_model') and
            model_trainer.content_model is not None
        )

        health_status = {
            'status': 'healthy' if is_loaded else 'degraded',
            'model_loaded': is_loaded,
            'model_version': getattr(model_trainer, 'model_version', 'unknown') if model_trainer else 'unknown',
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


# Run the application
if __name__ == "__main__":
    uvicorn.run(
        "api.ml_api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )