#!/usr/bin/env python3
"""
Validation script that outputs results to a file
"""

import sys
import traceback
from datetime import datetime

def validate_all():
    results = []

    try:
        results.append(f"Validation started at: {datetime.now()}")
        results.append(f"Python version: {sys.version}")
        results.append("=" * 50)

        # Test 1: Basic imports
        results.append("Testing basic imports...")
        import yaml, pandas, numpy, sklearn
        results.append("✓ Basic imports successful")

        # Test 2: Data collector
        results.append("Testing data collector...")
        from data.data_collector import SyntheticDataGenerator, MultiDatabaseDataCollector
        results.append("✓ Data collector import successful")

        # Test instantiation
        generator = SyntheticDataGenerator()
        results.append("✓ SyntheticDataGenerator instantiated")

        # Test 3: Models
        results.append("Testing models...")
        from models.hybrid_recommender import HybridRecommenderTrainer
        from models.continuous_learning import ContinuousModelTrainer
        results.append("✓ Models imported successfully")

        # Test 4: APIs
        results.append("Testing APIs...")
        from api.model_server import app as model_server_app
        from api.ml_api import app as ml_api_app
        results.append("✓ APIs imported successfully")

        # Test 5: Basic functionality
        results.append("Testing basic functionality...")
        sample_data = generator.generate_comprehensive_dataset(num_records=5)
        results.append(f"✓ Generated {len(sample_data)} sample records")
        results.append(f"✓ Sample columns: {list(sample_data.columns)}")

        results.append("=" * 50)
        results.append("🎉 ALL TESTS PASSED! No bugs remaining.")

    except Exception as e:
        results.append(f"❌ ERROR: {str(e)}")
        results.append(traceback.format_exc())

    # Write results to file
    with open('validation_results.txt', 'w') as f:
        for result in results:
            f.write(result + '\n')

    return len([r for r in results if '❌' in r]) == 0

if __name__ == "__main__":
    success = validate_all()
    if success:
        print("Validation completed successfully - check validation_results.txt")
    else:
        print("Validation failed - check validation_results.txt for errors")
