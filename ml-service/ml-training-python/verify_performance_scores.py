"""
Performance Score Verification Script

This script compares performance scores between:
1. Identity Database (MySQL) - Source of truth
2. Training Data (PostgreSQL) - Used by ML model

Run this to identify discrepancies that might cause incorrect recommendations.
"""

import pandas as pd
import yaml
import logging
import os
from pathlib import Path
from sqlalchemy import create_engine
import mysql.connector
import structlog

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = structlog.get_logger(__name__)

def load_config():
    """Load database configuration"""
    current_file = Path(__file__).resolve()
    project_root = current_file.parent
    config_file = project_root / "config" / "model_config.yaml"

    with open(config_file, 'r') as file:
        return yaml.safe_load(file)

def connect_to_databases(config):
    """Setup database connections"""
    db_config = config['database']

    # PostgreSQL connection
    postgres_config = db_config['postgres']
    postgres_engine = create_engine(
        f"postgresql://{postgres_config['username']}:{postgres_config['password']}"
        f"@{postgres_config['host']}:{postgres_config['port']}"
        f"/{postgres_config['database']}"
    )

    # MySQL identity connection
    mysql_config = db_config['mysql']
    identity_db = mysql_config['databases']['identity']['database']
    mysql_connection = mysql.connector.connect(
        host=mysql_config['host'],
        port=mysql_config['port'],
        database=identity_db,
        user=mysql_config['username'],
        password=mysql_config['password']
    )

    return postgres_engine, mysql_connection

def get_identity_scores(mysql_connection):
    """Get performance scores from Identity Database"""
    cursor = mysql_connection.cursor(dictionary=True)

    # Check if table is 'users' or 'user'
    cursor.execute("SHOW TABLES LIKE 'users'")
    table_name = 'users' if cursor.fetchone() else 'user'

    query = f"""
    SELECT 
        id as user_id,
        CONCAT(first_name, ' ', last_name) as user_name,
        email,
        performance_score
    FROM {table_name}
    ORDER BY email
    """

    cursor.execute(query)
    records = cursor.fetchall()
    cursor.close()

    logger.info(f"✅ Retrieved {len(records)} users from Identity DB")

    identity_scores = {}
    for record in records:
        user_id = record['user_id']
        identity_scores[user_id] = {
            'user_id': user_id,
            'user_name': record['user_name'],
            'email': record['email'],
            'identity_score': record['performance_score']
        }

    return identity_scores

def get_training_scores(postgres_engine):
    """Get performance scores from Training Data"""
    try:
        query = """
        SELECT DISTINCT
            user_id,
            performance_score,
            created_at
        FROM comprehensive_training_data
        WHERE user_id IS NOT NULL 
          AND performance_score IS NOT NULL
        ORDER BY user_id, created_at DESC
        """

        training_df = pd.read_sql(query, postgres_engine)

        # Get most recent performance score for each user
        training_scores = training_df.groupby('user_id').first().reset_index()

        logger.info(f"✅ Retrieved {len(training_scores)} users from Training Data")

        return training_scores

    except Exception as e:
        logger.warning(f"Could not fetch training data: {e}")
        return pd.DataFrame()

def compare_scores(identity_scores, training_scores):
    """Compare performance scores and generate report"""
    logger.info("")
    logger.info("=" * 140)
    logger.info("PERFORMANCE SCORE COMPARISON")
    logger.info("=" * 140)
    logger.info(f"{'User ID':<38} {'User Name':<25} {'Identity DB':<15} {'Training Data':<15} {'Difference':<12} {'Status':<10}")
    logger.info("-" * 140)

    results = []
    all_user_ids = set(identity_scores.keys())
    if not training_scores.empty:
        all_user_ids.update(training_scores['user_id'].tolist())

    mismatch_count = 0
    match_count = 0
    missing_in_training = 0

    for user_id in sorted(all_user_ids):
        identity_data = identity_scores.get(user_id, {})
        identity_score = identity_data.get('identity_score', None)
        user_name = identity_data.get('user_name', 'Unknown')
        email = identity_data.get('email', 'Unknown')

        # Get training score
        training_record = training_scores[training_scores['user_id'] == user_id] if not training_scores.empty else pd.DataFrame()
        training_score = training_record['performance_score'].iloc[0] if not training_record.empty else None

        # Calculate difference (comparing raw values on 0-100 scale)
        # Training data stores scores on 0-100 scale, same as identity DB
        if identity_score is not None and training_score is not None:
            diff = abs(identity_score - training_score)
            if diff < 0.01:  # Essentially equal (allowing for floating point precision)
                status = "✅ MATCH"
                match_count += 1
            else:
                status = "❌ MISMATCH"
                mismatch_count += 1
        elif training_score is None and identity_score is None:
            # Both NULL
            diff = None
            status = "⚠️  NO SCORE"
            missing_in_training += 1
        elif training_score is None:
            # User not in training data
            diff = None
            status = "⚠️  NO TRAIN"
            missing_in_training += 1
        else:
            # Identity score is NULL
            diff = None
            status = "⚠️  NO ID"

        # Normalize for display purposes
        normalized_identity = identity_score / 100.0 if identity_score is not None else None
        normalized_training = training_score / 100.0 if training_score is not None else None

        # Format scores for display (show both raw and normalized)
        id_score_str = f"{identity_score:.2f}" if identity_score is not None else "NULL"
        train_score_str = f"{training_score:.2f}" if training_score is not None else "NULL"
        diff_str = f"{diff:.2f}" if diff is not None else "N/A"

        logger.info(f"{user_id:<38} {user_name[:24]:<25} {id_score_str:<15} {train_score_str:<15} {diff_str:<12} {status:<10}")

        # Store result
        results.append({
            'user_id': user_id,
            'user_name': user_name,
            'email': email,
            'identity_db_score': identity_score,
            'identity_db_normalized': normalized_identity,
            'training_data_score': training_score,
            'training_data_normalized': normalized_training,
            'difference': diff,
            'status': status
        })

    logger.info("-" * 140)
    logger.info(f"SUMMARY:")
    logger.info(f"  ✅ Matching scores:          {match_count}")
    logger.info(f"  ❌ Mismatched scores:        {mismatch_count}")
    logger.info(f"  ⚠️  Missing in training data: {missing_in_training}")
    logger.info(f"  📊 Total users checked:      {len(all_user_ids)}")
    logger.info("=" * 140)
    logger.info("")

    # Highlight specific user from the issue
    problem_user_id = "17275eec-ea96-47af-92f6-3195e3299c17"
    problem_user = next((r for r in results if r['user_id'] == problem_user_id), None)

    if problem_user:
        logger.info("🔍 SPECIFIC USER INVESTIGATION (from issue):")
        logger.info(f"   User ID: {problem_user_id}")
        logger.info(f"   Name: {problem_user['user_name']}")
        logger.info(f"   Email: {problem_user['email']}")
        logger.info(f"   Identity DB Score (raw):        {problem_user['identity_db_score']}")
        logger.info(f"   Identity DB Score (normalized): {problem_user['identity_db_normalized']:.4f}")
        logger.info(f"   Training Data Score (raw):      {problem_user['training_data_score']}")
        logger.info(f"   Training Data Score (normalized): {problem_user.get('training_data_normalized', 0):.4f}")
        logger.info(f"   Status: {problem_user['status']}")
        logger.info("")
        logger.info(f"   ⚠️  Expected in recommendation logs: 0.8344 (83.44/100)")
        logger.info(f"   ❌ Actually showing in logs:         0.2000")
        logger.info("")

        if problem_user['training_data_score'] is None:
            logger.info(f"   ➡️  User NOT found in training data!")
            logger.info(f"   ➡️  Recommendations are using fallback/default values")
            logger.info(f"   ➡️  Need to collect training data for this user")
        elif problem_user['status'] == "❌ MISMATCH":
            logger.info(f"   ➡️  Training data has DIFFERENT performance score!")
            logger.info(f"   ➡️  Difference: {problem_user['difference']:.2f} points")
            logger.info(f"   ➡️  Need to update training data from identity DB")
        else:
            logger.info(f"   ✅ Training data matches identity DB perfectly!")
            logger.info(f"   ➡️  The 0.2000 value is NOT coming from training data")
            logger.info(f"   ➡️  Check recommendation service logic - it may be using fallback scoring")
            logger.info(f"   ➡️  Or the profile-service is not returning performance_score correctly")
        logger.info("")

    return pd.DataFrame(results)

def main():
    """Main execution function"""
    print("=" * 100)
    print("PERFORMANCE SCORE VERIFICATION TOOL")
    print("=" * 100)
    print()

    # Load config
    print("📁 Loading configuration...")
    config = load_config()

    # Connect to databases
    print("🔌 Connecting to databases...")
    postgres_engine, mysql_connection = connect_to_databases(config)
    print("✅ Database connections established")
    print()

    # Get scores from both databases
    print("📊 Fetching performance scores from databases...")
    identity_scores = get_identity_scores(mysql_connection)
    training_scores = get_training_scores(postgres_engine)
    print()

    # Compare and generate report
    print("🔍 Comparing performance scores...")
    results_df = compare_scores(identity_scores, training_scores)

    # Save results to CSV
    output_file = Path(__file__).parent / "performance_score_verification.csv"
    results_df.to_csv(output_file, index=False)
    print(f"💾 Results saved to: {output_file}")
    print()

    # Close connections
    mysql_connection.close()
    postgres_engine.dispose()
    print("✅ Verification complete!")
    print()

    # Show actionable recommendations
    mismatches = results_df[results_df['status'] == '❌ MISMATCH']
    missing = results_df[results_df['status'] == '⚠️  NO TRAIN']

    if len(mismatches) > 0 or len(missing) > 0:
        print("=" * 100)
        print("⚠️  ACTION REQUIRED")
        print("=" * 100)

        if len(missing) > 0:
            print(f"\n1️⃣  {len(missing)} users are missing from training data")
            print("   → Run data collection to include these users:")
            print("      cd /path/to/ml-service/ml-training-python")
            print("      python3 -m src.training.train_hybrid_model")

        if len(mismatches) > 0:
            print(f"\n2️⃣  {len(mismatches)} users have mismatched scores in training data")
            print("   → Retrain the model with updated performance scores:")
            print("      cd /path/to/ml-service/ml-training-python")
            print("      python3 -m src.training.train_hybrid_model")

        print("\n" + "=" * 100)

if __name__ == "__main__":
    main()

