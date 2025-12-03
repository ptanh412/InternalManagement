"""
Continuous Model Training and Learning Pipeline

This module implements continuous learning capabilities:
- Automated model retraining on new data
- Performance monitoring and validation
- A/B testing for model deployment
- Real-time data collection and processing
"""

import pandas as pd
import yaml
import joblib
import logging
import schedule
import time
from datetime import datetime, timedelta
from typing import Dict, Any
from sqlalchemy import create_engine, text

import structlog

from .hybrid_recommender import HybridRecommenderTrainer
from src.data.data_collector import MultiDatabaseDataCollector

logger = structlog.get_logger(__name__)

class ContinuousModelTrainer:
    """
    Continuous learning pipeline for ML models
    """
    
    def __init__(self, config_path: str = "config/model_config.yaml"):
        """Initialize continuous trainer"""
        try:
            with open(config_path, 'r') as file:
                self.config = yaml.safe_load(file)

            self.continuous_config = self.config['continuous_learning']
            self.training_config = self.config['training']

            # Initialize components
            self.data_collector = MultiDatabaseDataCollector(config_path)
            self.model_trainer = HybridRecommenderTrainer(config_path)

            # Performance tracking
            self.min_accuracy_improvement = self.continuous_config['min_accuracy_improvement']
            self.min_data_size = self.continuous_config['min_data_size']
            self.performance_degradation_threshold = self.continuous_config['performance_degradation_threshold']

            # Database connection for ML metrics
            postgres_config = self.config['database']['postgres']
            self.ml_engine = create_engine(
                f"postgresql://{postgres_config['username']}:{postgres_config['password']}"
                f"@{postgres_config['host']}:{postgres_config['port']}"
                f"/{postgres_config['database']}"
            )
        except (FileNotFoundError, KeyError) as e:
            logger.warning(f"Could not load config from {config_path}: {e}")
            logger.info("Using default configuration")
            self._setup_defaults()

    def _setup_defaults(self):
        """Setup default configuration when config file is not available"""
        self.config = {
            'continuous_learning': {
                'min_accuracy_improvement': 0.01,
                'min_data_size': 500,
                'performance_degradation_threshold': 0.05
            },
            'training': {
                'test_size': 0.2,
                'random_state': 42
            }
        }
        self.continuous_config = self.config['continuous_learning']
        self.training_config = self.config['training']

        # Initialize components with defaults
        self.data_collector = None  # Will be initialized when needed
        self.model_trainer = HybridRecommenderTrainer()

        # Performance tracking
        self.min_accuracy_improvement = self.continuous_config['min_accuracy_improvement']
        self.min_data_size = self.continuous_config['min_data_size']
        self.performance_degradation_threshold = self.continuous_config['performance_degradation_threshold']

        # No database connection in default mode
        self.ml_engine = None

        logger.info("Continuous model trainer initialized")
    
    def run_continuous_training_pipeline(self):
        """
        Main continuous training pipeline
        """
        logger.info("Starting continuous training pipeline...")
        
        try:
            # 1. Check if retraining is needed
            if not self._should_retrain():
                logger.info("Model retraining not needed at this time")
                return
            
            # 2. Collect latest training data
            training_data = self._collect_latest_training_data()
            
            if len(training_data) < self.min_data_size:
                logger.warning(f"Insufficient data for retraining: {len(training_data)} records")
                return
            
            # 3. Train new models
            new_models_results = self._train_updated_models(training_data)
            
            # 4. Evaluate model performance
            performance_metrics = self._evaluate_model_performance(
                new_models_results, training_data
            )
            
            # 5. Deploy if performance improved
            if self._should_deploy_models(performance_metrics):
                self._deploy_updated_models(new_models_results, performance_metrics)
                logger.info("Successfully deployed updated models")
            else:
                logger.info("New models did not meet performance criteria, keeping existing models")
                
        except Exception as e:
            logger.error(f"Continuous training pipeline failed: {e}")
            self._handle_pipeline_failure(e)
    
    def _should_retrain(self) -> bool:
        """
        Determine if model retraining is needed
        """
        logger.info("Checking if model retraining is needed...")
        
        # Check time since last training
        try:
            query = """
            SELECT MAX(training_date) as last_training 
            FROM model_training_history
            """
            result = pd.read_sql(query, self.ml_engine)
            
            if result.empty or result['last_training'].iloc[0] is None:
                logger.info("No previous training found, retraining needed")
                return True
            
            last_training = pd.to_datetime(result['last_training'].iloc[0])
            days_since_training = (datetime.now() - last_training).days
            
            # Retrain weekly or if we have significant new data
            if days_since_training >= 7:
                logger.info(f"Time-based retraining needed: {days_since_training} days since last training")
                return True
            
            # Check for significant new data
            new_data_query = """
            SELECT COUNT(*) as new_records
            FROM comprehensive_training_data 
            WHERE created_at > %s
            """
            new_data_result = pd.read_sql(
                new_data_query, self.ml_engine, params=[last_training]
            )
            
            new_records = new_data_result['new_records'].iloc[0] if not new_data_result.empty else 0
            
            if new_records >= 100:  # Retrain if 100+ new records
                logger.info(f"Data-based retraining needed: {new_records} new records")
                return True
            
            # Check for performance degradation
            if self._check_performance_degradation():
                logger.info("Performance degradation detected, retraining needed")
                return True
            
            logger.info("No retraining needed")
            return False
            
        except Exception as e:
            logger.error(f"Error checking retraining criteria: {e}")
            return True  # Default to retraining on error
    
    def _check_performance_degradation(self) -> bool:
        """
        Check if current model performance has degraded
        """
        try:
            # Get recent prediction accuracy from production logs
            query = """
            SELECT AVG(prediction_accuracy) as avg_accuracy
            FROM ml_prediction_logs 
            WHERE prediction_date >= NOW() - INTERVAL '7 days'
            AND prediction_accuracy IS NOT NULL
            """
            
            result = pd.read_sql(query, self.ml_engine)
            
            if result.empty or result['avg_accuracy'].iloc[0] is None:
                return False  # No recent accuracy data
            
            recent_accuracy = result['avg_accuracy'].iloc[0]
            
            # Get baseline accuracy from training history
            baseline_query = """
            SELECT accuracy FROM model_training_history 
            ORDER BY training_date DESC 
            LIMIT 1
            """
            
            baseline_result = pd.read_sql(baseline_query, self.ml_engine)
            
            if baseline_result.empty:
                return False  # No baseline to compare
            
            baseline_accuracy = baseline_result['accuracy'].iloc[0]
            
            # Check for significant degradation
            performance_drop = baseline_accuracy - recent_accuracy
            
            if performance_drop > self.performance_degradation_threshold:
                logger.warning(f"Performance degradation detected: {performance_drop:.3f}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error checking performance degradation: {e}")
            return False
    
    def _collect_latest_training_data(self) -> pd.DataFrame:
        """
        Collect latest training data from all sources
        """
        logger.info("Collecting latest training data...")
        
        # Collect comprehensive data from all databases
        comprehensive_data = self.data_collector.collect_comprehensive_training_data(
            months_back=6  # Last 6 months
        )
        
        logger.info(f"Collected {len(comprehensive_data)} training records")
        
        return comprehensive_data
    
    def _train_updated_models(self, training_data: pd.DataFrame) -> Dict[str, Any]:
        """
        Train updated ML models with latest data
        """
        logger.info(f"Training updated models with {len(training_data)} records...")
        
        # Train hybrid recommender model
        training_results = self.model_trainer.train_hybrid_model(training_data)
        
        # Add additional metadata
        training_results['training_records'] = len(training_data)
        training_results['data_collection_date'] = datetime.now()
        
        return training_results
    
    def _evaluate_model_performance(self, training_results: Dict[str, Any], 
                                  training_data: pd.DataFrame) -> Dict[str, Any]:
        """
        Evaluate new model performance against current baseline
        """
        logger.info("Evaluating new model performance...")
        
        new_metrics = training_results['hybrid_metrics']
        
        # Load current model performance for comparison
        try:
            current_metadata = joblib.load('models/model_metadata.pkl')
            current_metrics = current_metadata.get('training_metrics', {}).get('hybrid_metrics', {})
        except FileNotFoundError:
            current_metrics = {'accuracy': 0.0, 'f1': 0.0}
        
        # Calculate improvements
        performance_comparison = {
            'new_accuracy': new_metrics.get('accuracy', 0.0),
            'new_f1': new_metrics.get('f1', 0.0),
            'new_precision': new_metrics.get('precision', 0.0),
            'new_recall': new_metrics.get('recall', 0.0),
            'current_accuracy': current_metrics.get('accuracy', 0.0),
            'current_f1': current_metrics.get('f1', 0.0),
            'current_precision': current_metrics.get('precision', 0.0),
            'current_recall': current_metrics.get('recall', 0.0),
            'accuracy_improvement': new_metrics.get('accuracy', 0.0) - current_metrics.get('accuracy', 0.0),
            'f1_improvement': new_metrics.get('f1', 0.0) - current_metrics.get('f1', 0.0),
            'training_date': datetime.now(),
            'training_records': len(training_data),
            'model_version': training_results.get('model_version', 'unknown')
        }
        
        logger.info(f"Performance comparison: New F1={performance_comparison['new_f1']:.3f}, "
                   f"Current F1={performance_comparison['current_f1']:.3f}, "
                   f"Improvement={performance_comparison['f1_improvement']:.3f}")
        
        return performance_comparison
    
    def _should_deploy_models(self, performance_metrics: Dict[str, Any]) -> bool:
        """
        Determine if new models should be deployed based on performance
        """
        # Deploy if significant improvement or first training
        accuracy_improved = performance_metrics['accuracy_improvement'] >= self.min_accuracy_improvement
        f1_improved = performance_metrics['f1_improvement'] >= self.min_accuracy_improvement
        first_training = performance_metrics['current_accuracy'] == 0.0
        
        # Check for no degradation in other metrics
        no_significant_degradation = (
            performance_metrics['accuracy_improvement'] >= -0.02 and  # Allow small drops
            performance_metrics['f1_improvement'] >= -0.02
        )
        
        should_deploy = (accuracy_improved or f1_improved or first_training) and no_significant_degradation
        
        logger.info(f"Deployment decision: {should_deploy} "
                   f"(accuracy_improved={accuracy_improved}, f1_improved={f1_improved}, "
                   f"first_training={first_training}, no_degradation={no_significant_degradation})")
        
        return should_deploy
    
    def _deploy_updated_models(self, training_results: Dict[str, Any], 
                             performance_metrics: Dict[str, Any]):
        """
        Deploy updated models to production
        """
        logger.info("Deploying updated models to production...")
        
        # Models are already saved by the trainer
        # Update model metadata with performance metrics
        try:
            metadata = joblib.load('models/model_metadata.pkl')
            metadata.update({
                'deployment_date': datetime.now().isoformat(),
                'performance_metrics': performance_metrics,
                'training_results': training_results
            })
            joblib.dump(metadata, 'models/model_metadata.pkl')
        except FileNotFoundError:
            logger.warning("Model metadata not found, creating new metadata")
        
        # Record deployment in training history
        self._record_training_history(performance_metrics, training_results)
        
        # Notify other services of model update (could use Kafka here)
        self._notify_model_update(performance_metrics)
        
        logger.info("Model deployment completed successfully")
    
    def _record_training_history(self, performance_metrics: Dict[str, Any], 
                               training_results: Dict[str, Any]):
        """
        Record training history in database
        """
        try:
            # Create training history table if it doesn't exist
            create_table_query = """
            CREATE TABLE IF NOT EXISTS model_training_history (
                id SERIAL PRIMARY KEY,
                training_date TIMESTAMP,
                model_version VARCHAR(255),
                accuracy FLOAT,
                f1_score FLOAT,
                precision_score FLOAT,
                recall_score FLOAT,
                training_records INTEGER,
                accuracy_improvement FLOAT,
                f1_improvement FLOAT,
                deployment_status VARCHAR(50),
                training_duration_minutes FLOAT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
            
            with self.ml_engine.connect() as connection:
                connection.execute(text(create_table_query))
                connection.commit()
            
            # Insert training record
            history_record = pd.DataFrame([{
                'training_date': performance_metrics['training_date'],
                'model_version': performance_metrics['model_version'],
                'accuracy': performance_metrics['new_accuracy'],
                'f1_score': performance_metrics['new_f1'],
                'precision_score': performance_metrics['new_precision'],
                'recall_score': performance_metrics['new_recall'],
                'training_records': performance_metrics['training_records'],
                'accuracy_improvement': performance_metrics['accuracy_improvement'],
                'f1_improvement': performance_metrics['f1_improvement'],
                'deployment_status': 'DEPLOYED',
                'training_duration_minutes': 0  # Could calculate actual duration
            }])
            
            history_record.to_sql(
                'model_training_history', 
                self.ml_engine, 
                if_exists='append', 
                index=False
            )
            
            logger.info("Training history recorded successfully")
            
        except Exception as e:
            logger.error(f"Failed to record training history: {e}")
    
    def _notify_model_update(self, performance_metrics: Dict[str, Any]):
        """
        Notify other services about model update
        """
        # This could send Kafka messages, API calls, etc.
        # For now, just log the notification
        logger.info(f"Model update notification: Version {performance_metrics['model_version']} "
                   f"deployed with F1 score {performance_metrics['new_f1']:.3f}")
    
    def _handle_pipeline_failure(self, error: Exception):
        """
        Handle pipeline failures gracefully
        """
        logger.error(f"Continuous training pipeline failed: {error}")
        
        # Record failure in database
        try:
            failure_record = pd.DataFrame([{
                'training_date': datetime.now(),
                'model_version': 'FAILED',
                'accuracy': None,
                'f1_score': None,
                'precision_score': None,
                'recall_score': None,
                'training_records': None,
                'accuracy_improvement': None,
                'f1_improvement': None,
                'deployment_status': 'FAILED',
                'training_duration_minutes': None,
                'error_message': str(error)
            }])
            
            failure_record.to_sql(
                'model_training_history', 
                self.ml_engine, 
                if_exists='append', 
                index=False
            )
        except Exception as e:
            logger.error(f"Failed to record training failure: {e}")
    
    def start_continuous_training_scheduler(self):
        """
        Start the continuous training scheduler
        """
        logger.info("Starting continuous training scheduler...")
        
        # Schedule daily training checks at 2 AM
        schedule.every().day.at("02:00").do(self.run_continuous_training_pipeline)
        
        # Schedule weekly comprehensive retraining on Sundays at 3 AM
        schedule.every().sunday.at("03:00").do(
            lambda: self.run_continuous_training_pipeline()
        )
        
        logger.info("Continuous training scheduler started")
        
        # Keep scheduler running
        while True:
            try:
                schedule.run_pending()
                time.sleep(3600)  # Check every hour
            except KeyboardInterrupt:
                logger.info("Scheduler stopped by user")
                break
            except Exception as e:
                logger.error(f"Scheduler error: {e}")
                time.sleep(60)  # Wait a minute before retrying
    
    def start_scheduler(self):
        """
        Alias for start_continuous_training_scheduler for backward compatibility
        """
        return self.start_continuous_training_scheduler()

    def run_manual_training(self):
        """
        Run training manually (for testing or immediate needs)
        """
        logger.info("Running manual model training...")
        self.run_continuous_training_pipeline()
    
    def get_model_performance_history(self, days_back: int = 30) -> pd.DataFrame:
        """
        Get model performance history for monitoring
        """
        cutoff_date = datetime.now() - timedelta(days=days_back)
        
        query = """
        SELECT * FROM model_training_history 
        WHERE training_date >= %s
        ORDER BY training_date DESC
        """
        
        history = pd.read_sql(query, self.ml_engine, params=[cutoff_date])
        
        return history


class MLDataEventProcessor:
    """
    Process real-time ML events from Kafka
    """
    
    def __init__(self, config_path: str = "config/model_config.yaml"):
        """Initialize event processor"""
        with open(config_path, 'r') as file:
            self.config = yaml.safe_load(file)
        
        self.kafka_config = self.config['kafka']
        
        # Database connection
        postgres_config = self.config['database']['postgres']
        self.engine = create_engine(
            f"postgresql://{postgres_config['username']}:{postgres_config['password']}"
            f"@{postgres_config['host']}:{postgres_config['port']}"
            f"/{postgres_config['database']}"
        )
    
    def process_task_completion_event(self, event_data: Dict[str, Any]):
        """
        Process task completion events for ML training
        """
        logger.info(f"Processing task completion event: {event_data.get('task_id')}")
        
        try:
            # Extract relevant data
            training_record = {
                'task_id': event_data.get('task_id'),
                'user_id': event_data.get('assigned_user_id'),
                'completion_date': event_data.get('completion_date'),
                'actual_hours': event_data.get('actual_hours'),
                'estimated_hours': event_data.get('estimated_hours'),
                'quality_score': event_data.get('quality_score', 0.5),
                'event_type': 'task_completion',
                'created_at': datetime.now()
            }
            
            # Store in real-time events table
            pd.DataFrame([training_record]).to_sql(
                'ml_training_events',
                self.engine,
                if_exists='append',
                index=False
            )
            
            logger.info("Task completion event processed successfully")
            
        except Exception as e:
            logger.error(f"Failed to process task completion event: {e}")
    
    def process_assignment_event(self, event_data: Dict[str, Any]):
        """
        Process task assignment events for ML training
        """
        logger.info(f"Processing assignment event: {event_data.get('task_id')}")
        
        try:
            # Extract relevant data
            assignment_record = {
                'task_id': event_data.get('task_id'),
                'user_id': event_data.get('user_id'),
                'assignment_date': event_data.get('assignment_date'),
                'assignment_method': event_data.get('assignment_method', 'manual'),
                'prediction_confidence': event_data.get('prediction_confidence'),
                'event_type': 'task_assignment',
                'created_at': datetime.now()
            }
            
            # Store in real-time events table
            pd.DataFrame([assignment_record]).to_sql(
                'ml_training_events',
                self.engine,
                if_exists='append',
                index=False
            )
            
            logger.info("Assignment event processed successfully")
            
        except Exception as e:
            logger.error(f"Failed to process assignment event: {e}")


# Example usage and testing
if __name__ == "__main__":
    import sys
    
    # Setup logging
    logging.basicConfig(level=logging.INFO)
    
    if len(sys.argv) > 1 and sys.argv[1] == "schedule":
        # Run continuous training scheduler
        trainer = ContinuousModelTrainer()
        trainer.start_continuous_training_scheduler()
    else:
        # Run manual training
        trainer = ContinuousModelTrainer()
        trainer.run_manual_training()
        
        # Show performance history
        history = trainer.get_model_performance_history()
        if not history.empty:
            print("\n=== Recent Training History ===")
            print(history[['training_date', 'f1_score', 'accuracy', 'deployment_status']].head())
        else:
            print("No training history found")
    
    print("Continuous learning module ready for use!")