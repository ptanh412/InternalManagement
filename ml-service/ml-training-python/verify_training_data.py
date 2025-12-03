#!/usr/bin/env python3
"""
Training Data Verification Script

This script helps verify that training data from train_models.py --real
matches the actual data in Neo4j and MySQL databases.

Usage:
    python3 verify_training_data.py
    python3 verify_training_data.py --verbose
    python3 verify_training_data.py --export-csv
"""

import argparse
import sys
import os
from datetime import datetime
import pandas as pd
import yaml
from tabulate import tabulate

# Add src to path
current_dir = os.path.dirname(os.path.abspath(__file__))
src_path = os.path.join(current_dir, 'src')
if src_path not in sys.path:
    sys.path.insert(0, src_path)

from src.data.data_collector import MultiDatabaseDataCollector

class TrainingDataVerifier:
    """Verify training data against source databases"""

    def __init__(self, config_path='config/model_config.yaml'):
        self.config_path = config_path
        self.collector = MultiDatabaseDataCollector(config_path)

    def verify_connections(self):
        """Verify all database connections"""
        print("\n" + "="*80)
        print("DATABASE CONNECTION VERIFICATION")
        print("="*80)

        connection_status = self.collector.test_connections()

        results = []
        results.append(['PostgreSQL (ML Training)', '✓ Connected' if connection_status['postgres'] else '✗ Failed'])
        results.append(['Neo4j (Profile Service)', '✓ Connected' if connection_status['neo4j'] else '✗ Failed'])
        results.append(['MongoDB (AI/Chat/Notification)', '✓ Connected' if connection_status['mongodb'] else '✗ Failed'])

        for db_name, status in connection_status['mysql'].items():
            results.append([f'MySQL ({db_name})', '✓ Connected' if status else '✗ Failed'])

        print(tabulate(results, headers=['Database', 'Status'], tablefmt='grid'))

        all_connected = (connection_status['postgres'] and
                        connection_status['neo4j'] and
                        connection_status['mongodb'] and
                        all(connection_status['mysql'].values()))

        if not all_connected:
            print("\n⚠️  WARNING: Some database connections failed!")
            print("Training data may be incomplete or fallback to synthetic data.\n")
            return False
        else:
            print("\n✓ All database connections successful!\n")
            return True

    def count_records_by_source(self):
        """Count records in each data source"""
        print("\n" + "="*80)
        print("RECORD COUNTS BY DATA SOURCE")
        print("="*80)

        counts = []

        # Neo4j - User Profiles
        try:
            neo4j_data = self.collector._collect_neo4j_data(months_back=12)
            neo4j_count = len(neo4j_data)
            counts.append(['Neo4j', 'User Profiles', neo4j_count, '✓' if neo4j_count > 0 else '⚠️'])
        except Exception as e:
            counts.append(['Neo4j', 'User Profiles', 0, f'✗ Error: {str(e)[:30]}'])

        # MongoDB - AI Predictions/Recommendations
        try:
            mongodb_data = self.collector._collect_mongodb_data(months_back=12)
            mongodb_count = len(mongodb_data)
            counts.append(['MongoDB', 'AI Predictions/Chat', mongodb_count, '✓' if mongodb_count > 0 else '⚠️'])
        except Exception as e:
            counts.append(['MongoDB', 'AI Predictions/Chat', 0, f'✗ Error: {str(e)[:30]}'])

        # MySQL - Task/Project/Identity
        try:
            mysql_data = self.collector._collect_mysql_data(months_back=12)
            mysql_count = len(mysql_data)
            counts.append(['MySQL', 'Task/Project/Identity', mysql_count, '✓' if mysql_count > 0 else '⚠️'])
        except Exception as e:
            counts.append(['MySQL', 'Task/Project/Identity', 0, f'✗ Error: {str(e)[:30]}'])

        # PostgreSQL - ML Training Data
        try:
            postgres_data = self.collector._collect_postgres_ml_data(months_back=12)
            postgres_count = len(postgres_data)
            counts.append(['PostgreSQL', 'ML Training Records', postgres_count, '✓' if postgres_count > 0 else '⚠️'])
        except Exception as e:
            counts.append(['PostgreSQL', 'ML Training Records', 0, f'✗ Error: {str(e)[:30]}'])

        print(tabulate(counts, headers=['Source', 'Type', 'Record Count', 'Status'], tablefmt='grid'))

        total_records = sum([row[2] for row in counts if isinstance(row[2], int)])
        print(f"\nTotal records across all sources: {total_records}")

        if total_records < 100:
            print("\n⚠️  WARNING: Less than 100 total records found!")
            print("Training will likely use synthetic data as fallback.\n")

        return counts

    def verify_data_quality(self, verbose=False):
        """Verify data quality and completeness"""
        print("\n" + "="*80)
        print("DATA QUALITY VERIFICATION")
        print("="*80)

        issues = []

        # Check Neo4j data quality
        try:
            neo4j_data = self.collector._collect_neo4j_data(months_back=12)

            if not neo4j_data.empty:
                # Check for required fields
                required_fields = ['user_id_ref', 'skills', 'avg_completion_rate']
                missing_fields = [f for f in required_fields if f not in neo4j_data.columns]

                if missing_fields:
                    issues.append(f"Neo4j: Missing fields: {missing_fields}")

                # Check for null values
                null_counts = neo4j_data.isnull().sum()
                high_null_cols = null_counts[null_counts > len(neo4j_data) * 0.5].index.tolist()

                if high_null_cols:
                    issues.append(f"Neo4j: High null rate (>50%) in: {high_null_cols}")

                # Check for empty skills
                if 'skills' in neo4j_data.columns:
                    empty_skills = neo4j_data['skills'].apply(lambda x: len(x) == 0 if isinstance(x, list) else True).sum()
                    if empty_skills > 0:
                        issues.append(f"Neo4j: {empty_skills} users have no skills")

                if verbose:
                    print("\nNeo4j Data Sample:")
                    print(neo4j_data.head(3).to_string())
                    print(f"\nNeo4j Data Shape: {neo4j_data.shape}")
                    print(f"Columns: {list(neo4j_data.columns)}")
            else:
                issues.append("Neo4j: No data collected")

        except Exception as e:
            issues.append(f"Neo4j: Error - {str(e)}")

        # Check MySQL data quality
        try:
            mysql_data = self.collector._collect_mysql_data(months_back=12)

            if not mysql_data.empty:
                # Check for task-related fields
                task_fields = ['assignee_id', 'status', 'estimated_hours']
                missing_fields = [f for f in task_fields if f not in mysql_data.columns]

                if missing_fields:
                    issues.append(f"MySQL: Missing fields: {missing_fields}")

                if verbose:
                    print("\nMySQL Data Sample:")
                    print(mysql_data.head(3).to_string())
                    print(f"\nMySQL Data Shape: {mysql_data.shape}")
                    print(f"Columns: {list(mysql_data.columns)}")
            else:
                issues.append("MySQL: No data collected")

        except Exception as e:
            issues.append(f"MySQL: Error - {str(e)}")

        # Print results
        if issues:
            print("\n⚠️  Data Quality Issues Found:\n")
            for i, issue in enumerate(issues, 1):
                print(f"  {i}. {issue}")
        else:
            print("\n✓ No critical data quality issues found!")

        return issues

    def verify_training_data_match(self):
        """Verify that training data matches source databases"""
        print("\n" + "="*80)
        print("TRAINING DATA VS SOURCE DATA COMPARISON")
        print("="*80)

        # Collect comprehensive training data (same as train_models.py --real)
        print("\nCollecting comprehensive training data (this may take a moment)...")
        training_data = self.collector.collect_comprehensive_training_data(months_back=12)

        print(f"\nTraining Data Summary:")
        print(f"  Total records: {len(training_data)}")
        print(f"  Columns: {len(training_data.columns)}")
        print(f"  Column names: {list(training_data.columns)[:10]}...")  # Show first 10

        # Compare with individual sources
        comparison = []

        # Neo4j comparison
        try:
            neo4j_data = self.collector._collect_neo4j_data(months_back=12)
            neo4j_users = set(neo4j_data['user_id_ref'].unique()) if not neo4j_data.empty and 'user_id_ref' in neo4j_data.columns else set()
            training_users = set(training_data['user_id'].unique()) if not training_data.empty and 'user_id' in training_data.columns else set()

            match_count = len(neo4j_users.intersection(training_users))
            total_neo4j = len(neo4j_users)

            comparison.append([
                'Neo4j Users',
                total_neo4j,
                len(training_users),
                match_count,
                f"{(match_count/total_neo4j*100) if total_neo4j > 0 else 0:.1f}%"
            ])
        except Exception as e:
            comparison.append(['Neo4j Users', 'N/A', 'N/A', 'N/A', f'Error: {str(e)[:20]}'])

        print("\n")
        print(tabulate(comparison,
                      headers=['Data Source', 'Source Count', 'Training Count', 'Matches', 'Match %'],
                      tablefmt='grid'))

        # Check data types and schemas
        print("\n\nTraining Data Schema:")
        print(training_data.dtypes.to_string() if not training_data.empty else "No data")

        return training_data

    def export_comparison_report(self, output_dir='data_verification_reports'):
        """Export detailed comparison report to CSV files"""
        print(f"\n\nExporting verification reports to {output_dir}/...")

        os.makedirs(output_dir, exist_ok=True)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        # Collect all data
        try:
            neo4j_data = self.collector._collect_neo4j_data(months_back=12)
            neo4j_data.to_csv(f"{output_dir}/neo4j_data_{timestamp}.csv", index=False)
            print(f"  ✓ Neo4j data exported ({len(neo4j_data)} records)")
        except Exception as e:
            print(f"  ✗ Neo4j export failed: {e}")

        try:
            mysql_data = self.collector._collect_mysql_data(months_back=12)
            mysql_data.to_csv(f"{output_dir}/mysql_data_{timestamp}.csv", index=False)
            print(f"  ✓ MySQL data exported ({len(mysql_data)} records)")
        except Exception as e:
            print(f"  ✗ MySQL export failed: {e}")

        try:
            training_data = self.collector.collect_comprehensive_training_data(months_back=12)
            training_data.to_csv(f"{output_dir}/training_data_{timestamp}.csv", index=False)
            print(f"  ✓ Training data exported ({len(training_data)} records)")
        except Exception as e:
            print(f"  ✗ Training data export failed: {e}")

        print(f"\nReports saved to: {output_dir}/")

def main():
    parser = argparse.ArgumentParser(description='Verify ML training data against databases')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Show detailed data samples')
    parser.add_argument('--export-csv', '-e', action='store_true',
                       help='Export comparison data to CSV files')
    parser.add_argument('--config', '-c', default='config/model_config.yaml',
                       help='Path to model configuration file')

    args = parser.parse_args()

    print("\n" + "="*80)
    print("ML TRAINING DATA VERIFICATION TOOL")
    print("="*80)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Config: {args.config}")
    print("="*80)

    try:
        verifier = TrainingDataVerifier(args.config)

        # Step 1: Verify connections
        connections_ok = verifier.verify_connections()

        # Step 2: Count records
        verifier.count_records_by_source()

        # Step 3: Verify data quality
        verifier.verify_data_quality(verbose=args.verbose)

        # Step 4: Compare training data with sources
        training_data = verifier.verify_training_data_match()

        # Step 5: Export if requested
        if args.export_csv:
            verifier.export_comparison_report()

        print("\n" + "="*80)
        print("VERIFICATION COMPLETE")
        print("="*80)

        if not connections_ok:
            print("\n⚠️  Some issues were found. Review the output above.")
            print("Training may use synthetic data as fallback.")
        else:
            print("\n✓ Verification successful!")
            print(f"Training data contains {len(training_data)} records from real databases.")

        print("\nNext steps:")
        print("  1. Run: python3 train_models.py --real")
        print("  2. Compare training results with verification data")
        print("  3. Use --export-csv to save detailed comparison reports")
        print("="*80 + "\n")

    except Exception as e:
        print(f"\n✗ Verification failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()

