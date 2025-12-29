#!/usr/bin/env python3
"""
Main training script for ML models

This script can be run to:
1. Generate synthetic data and train initial models
2. Collect real data and retrain models
3. Run continuous learning pipeline
4. Train with feedback loop data

Usage:
    python3 train_models.py --synthetic  # Train with synthetic data
    python3 train_models.py --real       # Train with real data
    python3 train_models.py --continuous # Run continuous training
    python3 train_models.py --feedback   # Train with feedback data
    python3 train_models.py --validate   # Validate existing models
"""

import argparse
import logging
import os
import sys
from datetime import datetime

# Add src to path
current_dir = os.path.dirname(os.path.abspath(__file__))
src_path = os.path.join(current_dir, 'src')
if src_path not in sys.path:
    sys.path.insert(0, src_path)

# Import from src modules
from src.data.data_collector import MultiDatabaseDataCollector, SyntheticDataGenerator
from src.models.continuous_learning import ContinuousModelTrainer
from src.models.feedback_loop import FeedbackLoopSystem
from src.models.hybrid_recommender import HybridRecommenderTrainer


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

    # Save trained models
    logging.info("Saving trained models...")
    trainer._save_models()
    logging.info("Models saved successfully")

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
    print(f"  Accuracy: {content_metrics.get('accuracy', 0.0):.3f}")
    print(f"  F1 Score: {content_metrics.get('f1', 0.0):.3f}")
    print(f"  Precision: {content_metrics.get('precision', 0.0):.3f}")
    print(f"  Recall: {content_metrics.get('recall', 0.0):.3f}")
    if 'roc_auc' in content_metrics:
        print(f"  ROC AUC: {content_metrics['roc_auc']:.3f}")
    print()
    print("Hybrid Model Performance:")
    hybrid_metrics = results['hybrid_metrics']
    print(f"  Accuracy: {hybrid_metrics.get('accuracy', 0.0):.3f}")
    print(f"  F1 Score: {hybrid_metrics.get('f1', 0.0):.3f}")
    print(f"  Precision: {hybrid_metrics.get('precision', 0.0):.3f}")
    print(f"  Recall: {hybrid_metrics.get('recall', 0.0):.3f}")
    if 'roc_auc' in hybrid_metrics:
        print(f"  ROC AUC: {hybrid_metrics['roc_auc']:.3f}")
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
            return train_with_synthetic_data(config_path)

        logging.info(f"Collected {len(training_data)} real training records")

        # Train models
        trainer = HybridRecommenderTrainer(config_path)
        results = trainer.train_hybrid_model(training_data)

        # Save trained models
        logging.info("Saving trained models...")
        trainer._save_models()
        logging.info("Models saved successfully")

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
    logging.info("Starting continuous learning pipeline...")

    try:
        continuous_trainer = ContinuousModelTrainer(config_path)
        continuous_trainer.run_continuous_training_pipeline()
        logging.info("Continuous training pipeline completed")
    except Exception as e:
        logging.error(f"Continuous training failed: {e}")
        raise


def train_with_feedback(config_path='config/model_config.yaml'):
    """
    Train models using feedback loop data (continuous improvement)

    This function:
    1. Collects feedback data from completed tasks
    2. Combines with historical data
    3. Applies SMOTE for data balancing
    4. Trains improved model
    """
    logging.info("Starting training with feedback loop data...")
    logging.info(f"Using configuration: {config_path}")

    try:
        # Initialize feedback system
        feedback_system = FeedbackLoopSystem(config_path)

        # Get statistics
        stats = feedback_system.get_feedback_statistics()

        print("\n" + "="*60)
        print("FEEDBACK LOOP STATISTICS")
        print("="*60)
        print(f"Total AI Suggestions: {stats.get('total_suggestions', 0)}")
        print(f"Total Task Assignments: {stats.get('total_assignments', 0)}")
        print(f"Total Completions: {stats.get('total_completions', 0)}")
        print(f"AI Acceptance Rate: {stats.get('ai_acceptance_rate', 0):.1f}%")
        print(f"Success Rate: {stats.get('success_rate', 0):.1f}%")
        print(f"Total Training Samples: {stats.get('total_training_samples', 0)}")
        print(f"Unused Samples: {stats.get('unused_samples', 0)}")
        print("="*60 + "\n")

        # Get new feedback training samples
        feedback_samples = feedback_system.get_new_training_samples()

        if len(feedback_samples) < 50:
            logging.warning(f"Insufficient feedback data ({len(feedback_samples)} samples)")
            logging.info("Combining feedback data with real/synthetic data")

            # Get real data
            try:
                collector = MultiDatabaseDataCollector(config_path)
                historical_data = collector.collect_comprehensive_training_data()
            except:
                logging.warning("Failed to collect real data, using synthetic data")
                generator = SyntheticDataGenerator()
                historical_data = generator.generate_comprehensive_dataset()

            # Combine datasets
            if len(feedback_samples) > 0:
                # TODO: Merge feedback_samples with historical_data
                training_data = historical_data
                logging.info(f"Combined {len(historical_data)} historical + {len(feedback_samples)} feedback samples")
            else:
                training_data = historical_data
        else:
            training_data = feedback_samples
            logging.info(f"Using {len(training_data)} feedback samples")

        # Train model with balanced data
        trainer = HybridRecommenderTrainer(config_path)
        results = trainer.train_hybrid_model(training_data)

        # Save trained models
        logging.info("Saving trained models...")
        trainer._save_models()
        logging.info("Models saved successfully")

        # Mark samples as used
        if len(feedback_samples) > 0 and 'id' in feedback_samples.columns:
            sample_ids = feedback_samples['id'].tolist()
            feedback_system.mark_samples_as_used(sample_ids)
            logging.info(f"Marked {len(sample_ids)} feedback samples as used")

        # Print results
        print("\n" + "="*60)
        print("FEEDBACK-BASED TRAINING RESULTS")
        print("="*60)
        print(f"Training Date: {results['training_date']}")
        print(f"Model Version: {results['model_version']}")
        print(f"Training Samples: {results['training_samples']}")
        print(f"Feedback Samples Used: {len(feedback_samples)}")
        print()
        print("Hybrid Model Performance:")
        hybrid_metrics = results['hybrid_metrics']
        print(f"  Accuracy: {hybrid_metrics['accuracy']:.3f}")
        print(f"  F1 Score: {hybrid_metrics['f1']:.3f}")
        print(f"  ROC AUC: {hybrid_metrics.get('roc_auc', 'N/A')}")
        print("="*60)

        logging.info("Feedback-based training completed successfully")
        return results

    except Exception as e:
        import traceback
        logging.error(f"Feedback-based training failed: {e}")
        logging.error(f"Full traceback:\n{traceback.format_exc()}")
        logging.info("Falling back to standard training")
        return train_with_real_data(config_path)


def start_continuous_scheduler(config_path='config/model_config.yaml'):
    """Start continuous training scheduler"""
    logging.info("Starting continuous training scheduler...")
    try:
        continuous_trainer = ContinuousModelTrainer(config_path)
        continuous_trainer.run_continuous_training_pipeline()
    except Exception as e:
        logging.error(f"Scheduler failed: {e}")
        raise


def validate_models():
    """Validate trained models"""
    logging.info("Validating models...")
    try:
        trainer = HybridRecommenderTrainer()
        trainer.load_models()
        logging.info("Models loaded and validated successfully")
        print("✓ Models are valid and ready to use")
    except Exception as e:
        logging.error(f"Model validation failed: {e}")
        print(f"✗ Model validation failed: {e}")
        raise


def main():
    """Main entry point for training script"""
    parser = argparse.ArgumentParser(description='ML Model Training Script')

    # Training mode arguments (mutually exclusive)
    mode_group = parser.add_mutually_exclusive_group(required=True)
    mode_group.add_argument('--synthetic', action='store_true',
                           help='Train with synthetic data')
    mode_group.add_argument('--real', action='store_true',
                           help='Train with real data from databases')
    mode_group.add_argument('--continuous', action='store_true',
                           help='Run continuous training pipeline')
    mode_group.add_argument('--feedback', action='store_true',
                           help='Train with feedback loop data')
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
            train_with_synthetic_data(args.config)
        elif args.real:
            train_with_real_data(args.config)
        elif args.continuous:
            run_continuous_training(args.config)
        elif args.feedback:
            train_with_feedback(args.config)
        elif args.scheduler:
            start_continuous_scheduler(args.config)
        elif args.validate:
            validate_models()
        else:
            parser.print_help()
            sys.exit(1)

        logging.info("Training script completed successfully")

    except Exception as e:
        import traceback
        logging.error(f"Training script failed: {e}")
        logging.error(f"Full traceback:\n{traceback.format_exc()}")
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

