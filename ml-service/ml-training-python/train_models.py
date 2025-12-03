#!/usr/bin/env python3
"""
Main training script for ML models

This script can be run to:
1. Generate synthetic data and train initial models
2. Collect real data and retrain models
3. Run continuous learning pipeline

Usage:
    python train_models.py --synthetic  # Train with synthetic data
    python train_models.py --real       # Train with real data
    python train_models.py --continuous # Run continuous training
"""

import argparse
import sys
import os
import logging
from datetime import datetime

# Add src to path
current_dir = os.path.dirname(os.path.abspath(__file__))
src_path = os.path.join(current_dir, 'src')
if src_path not in sys.path:
    sys.path.insert(0, src_path)

# Import from src modules
from src.data.data_collector import SyntheticDataGenerator, MultiDatabaseDataCollector
from src.models.hybrid_recommender import HybridRecommenderTrainer
from src.models.continuous_learning import ContinuousModelTrainer

def setup_logging(level=logging.INFO):
    """Setup logging configuration"""
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler(f'training_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')
        ]
    )

def train_with_synthetic_data(config_path='config/model_config.yaml'):
    """Train models using synthetic data"""
    logging.info("Starting training with synthetic data...")
    logging.info(f"Using configuration: {config_path}")

    # Generate synthetic data
    generator = SyntheticDataGenerator()
    training_data = generator.generate_comprehensive_dataset()
    
    logging.info(f"Generated {len(training_data)} synthetic training records")
    
    # Train models
    trainer = HybridRecommenderTrainer(config_path)
    results = trainer.train_hybrid_model(training_data)
    
    # Print results
    print("\n" + "="*60)
    print("SYNTHETIC DATA TRAINING RESULTS")
    print("="*60)
    print(f"Training Date: {results['training_date']}")
    print(f"Model Version: {results['model_version']}")
    print(f"Training Samples: {results['training_samples']}")
    print()
    print("Content-Based Model Performance:")
    content_metrics = results['content_based_metrics']
    print(f"  Accuracy: {content_metrics['accuracy']:.3f}")
    print(f"  F1 Score: {content_metrics['f1']:.3f}")
    print(f"  Precision: {content_metrics['precision']:.3f}")
    print(f"  Recall: {content_metrics['recall']:.3f}")
    print()
    print("Hybrid Model Performance:")
    hybrid_metrics = results['hybrid_metrics']
    print(f"  Accuracy: {hybrid_metrics['accuracy']:.3f}")
    print(f"  F1 Score: {hybrid_metrics['f1']:.3f}")
    print(f"  Precision: {hybrid_metrics['precision']:.3f}")
    print(f"  Recall: {hybrid_metrics['recall']:.3f}")
    print()
    
    if 'collaborative_metrics' in results:
        collab_metrics = results['collaborative_metrics']
        print("Collaborative Filtering Performance:")
        print(f"  RMSE: {collab_metrics['rmse']:.3f}")
        print(f"  Coverage: {collab_metrics['coverage']:.3f}")
    
    print("="*60)
    
    logging.info("Synthetic data training completed successfully")
    return results

def train_with_real_data(config_path='config/model_config.yaml'):
    """Train models using real data from databases"""
    logging.info("Starting training with real data...")
    logging.info(f"Using configuration: {config_path}")

    try:
        # Collect real data
        collector = MultiDatabaseDataCollector(config_path)

        # Test database connections first
        connection_status = collector.test_connections()
        print("\nDatabase Connection Status:")
        print(f"PostgreSQL: {'✓' if connection_status['postgres'] else '✗'}")
        print(f"Neo4j: {'✓' if connection_status['neo4j'] else '✗'}")
        print(f"MongoDB: {'✓' if connection_status['mongodb'] else '✗'}")
        for db_name, status in connection_status['mysql'].items():
            print(f"MySQL ({db_name}): {'✓' if status else '✗'}")
        print()

        # Show available tables for debugging
        collector.show_available_tables()
        print()

        training_data = collector.collect_comprehensive_training_data()
        
        if len(training_data) < 100:
            logging.warning(f"Insufficient real data ({len(training_data)} records). Using synthetic data as fallback.")
            return train_with_synthetic_data()
        
        logging.info(f"Collected {len(training_data)} real training records")
        
        # Train models
        trainer = HybridRecommenderTrainer(config_path)
        results = trainer.train_hybrid_model(training_data)
        
        # Print results (similar to synthetic data results)
        print("\n" + "="*60)
        print("REAL DATA TRAINING RESULTS")
        print("="*60)
        print(f"Training Date: {results['training_date']}")
        print(f"Model Version: {results['model_version']}")
        print(f"Training Samples: {results['training_samples']}")
        print()
        print("Hybrid Model Performance:")
        hybrid_metrics = results['hybrid_metrics']
        print(f"  Accuracy: {hybrid_metrics['accuracy']:.3f}")
        print(f"  F1 Score: {hybrid_metrics['f1']:.3f}")
        print(f"  ROC AUC: {hybrid_metrics.get('roc_auc', 'N/A')}")
        print("="*60)
        
        logging.info("Real data training completed successfully")
        return results
        
    except Exception as e:
        import traceback
        logging.error(f"Real data training failed: {e}")
        logging.error(f"Full traceback:\n{traceback.format_exc()}")
        logging.info("Falling back to synthetic data training")
        return train_with_synthetic_data(config_path)

def run_continuous_training(config_path='config/model_config.yaml'):
    """Run continuous learning pipeline"""
    logging.info("Starting continuous training pipeline...")
    logging.info(f"Using configuration: {config_path}")

    try:
        trainer = ContinuousModelTrainer(config_path)
        trainer.run_continuous_training_pipeline()
        
        print("\n" + "="*60)
        print("CONTINUOUS TRAINING COMPLETED")
        print("="*60)
        print("Check logs for detailed results")
        print("="*60)
        
        logging.info("Continuous training pipeline completed")
        
    except Exception as e:
        logging.error(f"Continuous training failed: {e}")
        raise

def start_continuous_scheduler(config_path='config/model_config.yaml'):
    """Start continuous training scheduler"""
    logging.info("Starting continuous training scheduler...")
    logging.info(f"Using configuration: {config_path}")

    try:
        trainer = ContinuousModelTrainer(config_path)
        trainer.start_scheduler()
        print("\n" + "="*60)
        print("CONTINUOUS TRAINING SCHEDULER STARTED")
        print("="*60)
        print("Press Ctrl+C to stop the scheduler")
        print("Training will run automatically based on schedule")
        print("="*60)
        
        trainer.start_continuous_training_scheduler()
        
    except KeyboardInterrupt:
        logging.info("Continuous training scheduler stopped by user")
        print("\nScheduler stopped.")
    except Exception as e:
        logging.error(f"Continuous training scheduler failed: {e}")
        raise

def validate_models():
    """Validate trained models"""
    logging.info("Validating trained models...")
    
    try:
        trainer = HybridRecommenderTrainer()
        trainer.load_models()
        
        # Generate test data
        generator = SyntheticDataGenerator()
        test_data = generator.generate_comprehensive_dataset()
        test_sample = test_data.head(10)
        
        # Make predictions
        predictions = trainer.predict(test_sample)
        
        print("\n" + "="*60)
        print("MODEL VALIDATION RESULTS")
        print("="*60)
        print("Sample predictions on test data:")
        for i, (_, row) in enumerate(test_sample.iterrows()):
            print(f"Sample {i+1}:")
            print(f"  Task: {row.get('task_title', 'Unknown')}")
            print(f"  User Skills: {row.get('user_skills', [])[:3]}...")  # Show first 3 skills
            print(f"  Prediction: {predictions[i]:.3f}")
            print(f"  Actual Performance: {row.get('performance_score', 'N/A')}")
            print()
        print("="*60)
        
        logging.info("Model validation completed")
        
    except Exception as e:
        logging.error(f"Model validation failed: {e}")
        print(f"Model validation failed: {e}")

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='ML Model Training Script')
    
    # Training mode arguments
    mode_group = parser.add_mutually_exclusive_group(required=True)
    mode_group.add_argument('--synthetic', action='store_true',
                           help='Train with synthetic data')
    mode_group.add_argument('--real', action='store_true',
                           help='Train with real data from databases')
    mode_group.add_argument('--continuous', action='store_true',
                           help='Run continuous training pipeline once')
    mode_group.add_argument('--scheduler', action='store_true',
                           help='Start continuous training scheduler')
    mode_group.add_argument('--validate', action='store_true',
                           help='Validate existing models')
    
    # Optional arguments
    parser.add_argument('--debug', action='store_true',
                       help='Enable debug logging')
    parser.add_argument('--config', type=str, default='config/model_config.yaml',
                       help='Path to configuration file')
    
    args = parser.parse_args()
    
    # Setup logging
    log_level = logging.DEBUG if args.debug else logging.INFO
    setup_logging(log_level)
    
    # Verify configuration file exists
    if not os.path.exists(args.config):
        logging.error(f"Configuration file not found: {args.config}")
        sys.exit(1)
    
    try:
        # Execute based on mode
        if args.synthetic:
            results = train_with_synthetic_data(args.config)
        elif args.real:
            results = train_with_real_data(args.config)
        elif args.continuous:
            run_continuous_training(args.config)
        elif args.scheduler:
            start_continuous_scheduler(args.config)
        elif args.validate:
            validate_models()
        
        logging.info("Training script completed successfully")
        
    except Exception as e:
        logging.error(f"Training script failed: {e}")
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()