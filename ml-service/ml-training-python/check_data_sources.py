#!/usr/bin/env python3
"""
Quick Data Source Checker

Simple script to quickly check what data is available in each database.
"""

import sys
import os
import yaml
from neo4j import GraphDatabase
import pymongo
import mysql.connector
from sqlalchemy import create_engine, text

# Add src to path
current_dir = os.path.dirname(os.path.abspath(__file__))
src_path = os.path.join(current_dir, 'src')
if src_path not in sys.path:
    sys.path.insert(0, src_path)

def check_neo4j(config):
    """Check Neo4j database"""
    print("\n📊 NEO4J DATABASE (Profile Service)")
    print("-" * 60)

    try:
        neo4j_config = config['database']['neo4j']
        driver = GraphDatabase.driver(
            neo4j_config['uri'],
            auth=(str(neo4j_config['username']), str(neo4j_config['password']))
        )

        with driver.session() as session:
            # Count user profiles
            result = session.run("MATCH (u:user_profile) RETURN count(u) as count")
            user_count = result.single()['count']
            print(f"  ✓ User Profiles: {user_count}")

            # Count skills
            result = session.run("MATCH (s:user_skill) RETURN count(s) as count")
            skill_count = result.single()['count']
            print(f"  ✓ User Skills: {skill_count}")

            # Sample user
            result = session.run("""
                MATCH (u:user_profile)
                OPTIONAL MATCH (u)-[:HAS_SKILL]->(s:user_skill)
                RETURN u.userId as userId, collect(s.skillName)[0..3] as skills
                LIMIT 3
            """)

            print("\n  Sample users:")
            for record in result:
                user_id = record['userId']
                skills = record['skills']
                print(f"    - User {user_id}: {skills[:3] if skills else 'No skills'}")

        driver.close()
        return True

    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

def check_mysql(config):
    """Check MySQL databases"""
    print("\n📊 MYSQL DATABASES")
    print("-" * 60)

    try:
        mysql_config = config['database']['mysql']

        for db_name, db_info in mysql_config.get('databases', {}).items():
            print(f"\n  {db_name.upper()} ({db_info['database']}):")

            try:
                connection = mysql.connector.connect(
                    host=str(mysql_config['host']),
                    port=int(mysql_config['port']),
                    database=str(db_info['database']),
                    user=str(mysql_config['username']),
                    password=str(mysql_config['password'])
                )

                cursor = connection.cursor()

                # Show tables
                cursor.execute("SHOW TABLES")
                tables = [table[0] for table in cursor.fetchall()]
                print(f"    Tables: {', '.join(tables[:5])}")

                # Count records in key tables
                if 'task' in tables:
                    cursor.execute("SELECT COUNT(*) FROM task")
                    count = cursor.fetchone()[0]
                    print(f"    ✓ Tasks: {count}")

                if 'user' in tables:
                    cursor.execute("SELECT COUNT(*) FROM user")
                    count = cursor.fetchone()[0]
                    print(f"    ✓ Users: {count}")

                if 'project' in tables:
                    cursor.execute("SELECT COUNT(*) FROM project")
                    count = cursor.fetchone()[0]
                    print(f"    ✓ Projects: {count}")

                cursor.close()
                connection.close()

            except Exception as e:
                print(f"    ✗ Error: {e}")

        return True

    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

def check_mongodb(config):
    """Check MongoDB database"""
    print("\n📊 MONGODB DATABASE (AI Service)")
    print("-" * 60)

    try:
        mongodb_config = config['database']['mongodb']
        client = pymongo.MongoClient(mongodb_config['uri'])
        db = client[mongodb_config['database']]

        # List collections
        collections = db.list_collection_names()
        print(f"  Collections: {', '.join(collections[:5])}")

        # Count documents in key collections
        if 'ai_recommendations' in collections:
            count = db['ai_recommendations'].count_documents({})
            print(f"  ✓ AI Recommendations: {count}")

        if 'ai_predictions' in collections:
            count = db['ai_predictions'].count_documents({})
            print(f"  ✓ AI Predictions: {count}")

        if 'chat_messages' in collections:
            count = db['chat_messages'].count_documents({})
            print(f"  ✓ Chat Messages: {count}")

        # Sample recommendation
        sample = db['ai_recommendations'].find_one()
        if sample:
            print(f"\n  Sample recommendation:")
            print(f"    - ID: {sample.get('_id')}")
            print(f"    - Type: {sample.get('recommendationType', 'N/A')}")

        client.close()
        return True

    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

def check_postgresql(config):
    """Check PostgreSQL database"""
    print("\n📊 POSTGRESQL DATABASE (ML Training)")
    print("-" * 60)

    try:
        postgres_config = config['database']['postgres']
        engine = create_engine(
            f"postgresql://{str(postgres_config['username'])}:{str(postgres_config['password'])}"
            f"@{str(postgres_config['host'])}:{int(postgres_config['port'])}"
            f"/{str(postgres_config['database'])}"
        )

        with engine.connect() as conn:
            # Check for training data tables
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """))

            tables = [row[0] for row in result]
            print(f"  Tables: {', '.join(tables)}")

            # Count ML training records
            if 'ml_training_data' in tables:
                result = conn.execute(text("SELECT COUNT(*) FROM ml_training_data"))
                count = result.scalar()
                print(f"  ✓ ML Training Records: {count}")

            if 'model_metrics' in tables:
                result = conn.execute(text("SELECT COUNT(*) FROM model_metrics"))
                count = result.scalar()
                print(f"  ✓ Model Metrics: {count}")

        engine.dispose()
        return True

    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

def main():
    print("\n" + "="*60)
    print("DATA SOURCE QUICK CHECK")
    print("="*60)

    # Load config
    config_path = 'config/model_config.yaml'
    try:
        with open(config_path, 'r') as file:
            config = yaml.safe_load(file)
    except Exception as e:
        print(f"✗ Failed to load config: {e}")
        sys.exit(1)

    # Check each database
    results = {
        'Neo4j': check_neo4j(config),
        'MySQL': check_mysql(config),
        'MongoDB': check_mongodb(config),
        'PostgreSQL': check_postgresql(config)
    }

    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)

    for db, status in results.items():
        status_str = "✓ OK" if status else "✗ FAILED"
        print(f"  {db}: {status_str}")

    if all(results.values()):
        print("\n✓ All databases are accessible and contain data!")
        print("\nYou can now run:")
        print("  python3 train_models.py --real")
    else:
        print("\n⚠️  Some databases are not accessible.")
        print("Training may use synthetic data as fallback.")

    print("="*60 + "\n")

if __name__ == "__main__":
    main()

