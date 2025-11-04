"""
FastAPI Model Serving API

This module provides REST API endpoints for ML model inference:
- Task assignment recommendations
- Performance predictions
- Model status and health checks
- Training triggers
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import pandas as pd
import numpy as np
import joblib
import yaml
import logging
from datetime import datetime
import uvicorn
import structlog

from models.hybrid_recommender import HybridRecommenderTrainer
from models.continuous_learning import ContinuousModelTrainer
from data.data_collector import SyntheticDataGenerator

logger = structlog.get_logger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="ML Model Serving API",
    description="Machine Learning API for Internal Management System",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instance
ml_model = None
continuous_trainer = None

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

@app.on_event("startup")
async def startup_event():
    """Initialize models on startup"""
    global ml_model, continuous_trainer
    
    logger.info("Starting ML API server...")
    
    try:
        # Load configuration
        with open("config/model_config.yaml", 'r') as file:
            config = yaml.safe_load(file)
        
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
        model_loaded = ml_model is not None and ml_model.content_model is not None
        
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
        
        if ml_model is None or ml_model.content_model is None:
            raise HTTPException(
                status_code=503, 
                detail="ML model not loaded. Please train model first."
            )
        
        # Prepare features for each candidate
        recommendations = []
        candidate_features = []
        
        for candidate in request.candidates:
            # Create feature vector for prediction
            features = _prepare_candidate_features(candidate, request.task)
            candidate_features.append(features)
        
        # Get predictions from model
        if candidate_features:
            features_df = pd.DataFrame(candidate_features)
            
            # Make predictions
            confidence_scores = ml_model.predict(features_df)
            
            # Create recommendations
            for i, (candidate, confidence) in enumerate(zip(request.candidates, confidence_scores)):
                
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
        
        # Sort by confidence score and assign ranks
        recommendations.sort(key=lambda x: x.confidence_score, reverse=True)
        for i, rec in enumerate(recommendations):
            rec.rank = i + 1
        
        # Limit to max_recommendations
        recommendations = recommendations[:request.max_recommendations]
        
        logger.info(f"Generated {len(recommendations)} recommendations")
        
        return recommendations
        
    except Exception as e:
        logger.error(f"Failed to generate recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train")
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
    
    # Calculate skill match
    skill_match_count = len(set(candidate.skills) & set(task.required_skills))
    skill_match_ratio = skill_match_count / max(len(task.required_skills), 1)
    
    # Map categorical values
    priority_score = {'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4}.get(task.priority, 2)
    difficulty_score = {'EASY': 1, 'MEDIUM': 2, 'HARD': 3}.get(task.difficulty, 2)
    seniority_score = {
        'INTERN': 1, 'JUNIOR': 2, 'MID_LEVEL': 3,
        'SENIOR': 4, 'LEAD': 5, 'PRINCIPAL': 6
    }.get(candidate.seniority_level, 3)
    
    return {
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
        'capacity': candidate.capacity,
        'available_capacity': candidate.capacity * (1 - candidate.utilization),
        'workload_pressure': candidate.utilization
    }

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
        
        if use_synthetic_data or ml_model.content_model is None:
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

if __name__ == "__main__":
    # Setup logging
    logging.basicConfig(level=logging.INFO)
    
    # Load configuration
    with open("config/model_config.yaml", 'r') as file:
        config = yaml.safe_load(file)
    
    api_config = config.get('api', {})
    
    # Run the API server
    uvicorn.run(
        app,
        host=api_config.get('host', '0.0.0.0'),
        port=api_config.get('port', 8000),
        reload=api_config.get('reload', False)
    )