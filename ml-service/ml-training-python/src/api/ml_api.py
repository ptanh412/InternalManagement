"""
FastAPI ML Service for Model Serving

This service provides REST API endpoints for:
- Model training
- Predictions
- Model management
"""

import os
import sys
import logging
from datetime import datetime
from typing import List, Dict, Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

# Add src to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from models.hybrid_recommender import HybridRecommenderTrainer
from models.continuous_learning import ContinuousModelTrainer
from data.data_collector import SyntheticDataGenerator, MultiDatabaseDataCollector

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="ML Training API",
    description="API for ML model training and serving",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model instances
model_trainer = None
continuous_trainer = None

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

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize models on startup"""
    global model_trainer, continuous_trainer
    
    logger.info("Initializing ML API service...")
    
    try:
        model_trainer = HybridRecommenderTrainer()
        continuous_trainer = ContinuousModelTrainer()
        
        # Try to load existing models
        try:
            model_trainer.load_models()
            logger.info("Loaded existing models successfully")
        except Exception as e:
            logger.warning(f"No existing models found: {e}")
        
        logger.info("ML API service initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize ML API service: {e}")

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
            model_trainer.content_model is not None and
            model_trainer.feature_scaler is not None
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
        if model_trainer is None or model_trainer.content_model is None:
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

# Run the application
if __name__ == "__main__":
    uvicorn.run(
        "api.ml_api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )