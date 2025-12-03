#!/usr/bin/env python3
"""
Evaluate Actual Trained Models

This script evaluates the actual trained models from the system
and generates comprehensive visualizations with real data.

Usage:
    # Evaluate with actual trained models (using synthetic test data)
    python evaluate_actual_models.py

    # Evaluate with real data from databases (requires DB connection)
    python evaluate_actual_models.py --use-real-data

    # Run demo mode if no models exist
    python evaluate_actual_models.py --mode demo
"""

import sys
import os

# Add src to path
current_dir = os.path.dirname(os.path.abspath(__file__))
src_path = os.path.join(current_dir, 'src')
if src_path not in sys.path:
    sys.path.insert(0, src_path)

from src.utils.model_evaluation import evaluate_trained_models, evaluate_demo_models
from datetime import datetime
import argparse


def main():
    """Main function"""
    parser = argparse.ArgumentParser(
        description='Evaluate actual trained ML models from the system',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Evaluate actual trained models
  python evaluate_actual_models.py
  
  # Evaluate with real data from databases
  python evaluate_actual_models.py --use-real-data
  
  # Run demo mode
  python evaluate_actual_models.py --mode demo
  
  # Specify custom models directory
  python evaluate_actual_models.py --models-dir /path/to/models
        """
    )

    parser.add_argument(
        '--mode',
        choices=['real', 'demo'],
        default='real',
        help='Evaluation mode: "real" for actual trained models, "demo" for synthetic data (default: real)'
    )

    parser.add_argument(
        '--models-dir',
        default='models',
        help='Directory containing trained models (default: models)'
    )

    parser.add_argument(
        '--use-real-data',
        action='store_true',
        help='Use real data from databases for evaluation (requires DB connections)'
    )

    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose output'
    )

    args = parser.parse_args()

    # Print banner
    print("\n" + "╔" + "=" * 68 + "╗")
    print("║" + " " * 10 + "ACTUAL MODEL EVALUATION - REAL SYSTEM DATA" + " " * 16 + "║")
    print("╚" + "=" * 68 + "╝")
    print()
    print(f"Mode: {args.mode.upper()}")
    print(f"Models Directory: {args.models_dir}")
    print(f"Use Real Data: {'Yes' if args.use_real_data else 'No (using synthetic data)'}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    try:
        if args.mode == 'real':
            print("🔍 Evaluating actual trained models from the system...")
            print()

            metrics = evaluate_trained_models(
                models_dir=args.models_dir,
                use_real_data=args.use_real_data
            )
        else:
            print("🎲 Running in demo mode with synthetic data...")
            print()

            metrics = evaluate_demo_models()

        # Print summary
        print("\n" + "=" * 70)
        print("EVALUATION SUMMARY")
        print("=" * 70)
        print()
        print("Key Metrics:")
        print(f"  ✓ Accuracy:   {metrics.get('accuracy', 0):.4f} ({metrics.get('accuracy', 0)*100:.2f}%)")
        print(f"  ✓ Precision:  {metrics.get('precision', 0):.4f} ({metrics.get('precision', 0)*100:.2f}%)")
        print(f"  ✓ Recall:     {metrics.get('recall', 0):.4f} ({metrics.get('recall', 0)*100:.2f}%)")
        print(f"  ✓ F1 Score:   {metrics.get('f1_score', 0):.4f} ({metrics.get('f1_score', 0)*100:.2f}%)")

        if metrics.get('roc_auc'):
            print(f"  ✓ ROC AUC:    {metrics.get('roc_auc', 0):.4f} ({metrics.get('roc_auc', 0)*100:.2f}%)")

        print()

        # Performance assessment
        f1 = metrics.get('f1_score', 0)
        if f1 >= 0.85:
            assessment = "🌟 EXCELLENT"
        elif f1 >= 0.75:
            assessment = "✅ GOOD"
        elif f1 >= 0.65:
            assessment = "⚠️  FAIR"
        else:
            assessment = "❌ NEEDS IMPROVEMENT"

        print(f"Overall Performance: {assessment}")
        print()

        # Recommendations
        print("=" * 70)
        print("RECOMMENDATIONS")
        print("=" * 70)
        print()

        if f1 >= 0.85:
            print("✓ Model performance is excellent!")
            print("✓ Ready for production deployment")
        elif f1 >= 0.75:
            print("✓ Model performance is good")
            print("→ Consider fine-tuning hyperparameters for improvement")
        elif f1 >= 0.65:
            print("⚠️  Model performance is fair")
            print("→ Consider:")
            print("   • Collecting more training data")
            print("   • Feature engineering")
            print("   • Hyperparameter optimization")
        else:
            print("❌ Model needs improvement")
            print("→ Recommended actions:")
            print("   • Review data quality")
            print("   • Add more features")
            print("   • Try different algorithms")
            print("   • Increase training data")

        print()
        print("=" * 70)
        print()
        print("🎉 Evaluation completed successfully!")
        print()
        print("📊 Generated Visualizations (11 types):")
        print("   1. Confusion Matrix (Error Matrix)")
        print("   2. ROC Curve")
        print("   3. Precision-Recall Curve")
        print("   4. Performance Metrics Chart")
        print("   5. Calibration Curve")
        print("   6. Threshold Analysis")
        print("   7. Error Analysis (6 sub-plots)")
        print("   8. Feature Importance (if available)")
        print("   9. Learning Curves")
        print("   10. Prediction Distribution")
        print("   11. Metrics JSON (exportable)")
        print()
        print("📂 Location: models/visualizations/")
        print()
        print("To view visualizations:")
        print("  cd models/visualizations")
        print("  open *.png")
        print()

        return 0

    except KeyboardInterrupt:
        print("\n\n⚠️  Evaluation interrupted by user.")
        return 1

    except Exception as e:
        print(f"\n\n❌ Error during evaluation: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)

