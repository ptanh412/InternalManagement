"""
Multi-Database Data Collector for ML Training

This module collects training data from multiple databases:
- PostgreSQL: Main ML training data
- Neo4j: User profiles (profile-service)  
- MongoDB: AI predictions, chat, notifications, files (ai-service, chat-service, notification-service, file-service)
- MySQL: Task, project, identity, workload data (identity-service, task-service, project-service, workload-service)
"""

import logging
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict

import mysql.connector
import numpy as np
import pandas as pd
import pymongo
import structlog
import yaml
from neo4j import GraphDatabase
from sqlalchemy import create_engine, text

logger = structlog.get_logger(__name__)

class MultiDatabaseDataCollector:
    """
    Collects training data from multiple heterogeneous databases
    """
    
    def __init__(self, config_path: str = "config/model_config.yaml"):
        """Initialize database connections"""
        # If config_path is relative, make it relative to the project root
        if not os.path.isabs(config_path):
            # Get the directory where this file is located
            current_file = Path(__file__).resolve()
            # Navigate to project root (ml-training-python/)
            project_root = current_file.parent.parent.parent
            config_path = project_root / config_path

        with open(config_path, 'r') as file:
            self.config = yaml.safe_load(file)
        
        self.db_config = self.config['database']
        self._setup_connections()
        
    def _setup_connections(self):
        """Setup all database connections"""
        try:
            # PostgreSQL connection for ML training data
            postgres_config = self.db_config['postgres']
            self.postgres_engine = create_engine(
                f"postgresql://{str(postgres_config['username'])}:{str(postgres_config['password'])}"
                f"@{str(postgres_config['host'])}:{int(postgres_config['port'])}"
                f"/{str(postgres_config['database'])}"
            )
            
            # Neo4j connection for profile service
            neo4j_config = self.db_config['neo4j']
            try:
                self.neo4j_driver = GraphDatabase.driver(
                    neo4j_config['uri'],
                    auth=(str(neo4j_config['username']), str(neo4j_config['password']))
                )
                # Test the connection
                with self.neo4j_driver.session() as session:
                    session.run("RETURN 1")
                logger.info("Successfully connected to Neo4j database")
            except Exception as e:
                logger.error(f"Failed to connect to Neo4j database: {e}")
                self.neo4j_driver = None

            # MongoDB connection for AI, chat, notification, file services  
            mongodb_config = self.db_config['mongodb']
            self.mongo_client = pymongo.MongoClient(mongodb_config['uri'])
            self.mongo_db = self.mongo_client[mongodb_config['database']]
            
            # MySQL connections for multiple databases (identity, task, project, sys)
            mysql_config = self.db_config['mysql']
            self.mysql_connections = {}
            
            logger.info("=" * 80)
            logger.info("ESTABLISHING MYSQL DATABASE CONNECTIONS")
            logger.info("=" * 80)
            logger.info(f"MySQL config databases: {list(mysql_config.get('databases', {}).keys())}")

            # Create a connection for each MySQL database
            for db_name, db_info in mysql_config.get('databases', {}).items():
                try:
                    logger.info(f"Attempting to connect to '{db_name}' database ({db_info['database']})...")
                    connection = mysql.connector.connect(
                        host=str(mysql_config['host']),
                        port=int(mysql_config['port']),
                        database=str(db_info['database']),
                        user=str(mysql_config['username']),
                        password=str(mysql_config['password'])
                    )
                    self.mysql_connections[db_name] = connection
                    logger.info(f"  ✓ Connected to MySQL database: {db_name} ({db_info['database']})")
                except Exception as e:
                    logger.error(f"  ✗ Failed to connect to MySQL database {db_name}: {e}")

            logger.info(f"Total MySQL connections established: {len(self.mysql_connections)}")
            logger.info(f"Connected databases: {list(self.mysql_connections.keys())}")
            logger.info("=" * 80)

            # Keep backward compatibility - use first database as default connection
            if self.mysql_connections:
                self.mysql_connection = list(self.mysql_connections.values())[0]
            
            logger.info("Database connection setup completed")

        except Exception as e:
            logger.error(f"Failed to setup database connections: {e}")
            raise
    
    def test_connections(self) -> Dict[str, bool]:
        """
        Test all database connections and return status
        """
        connection_status = {
            'postgres': False,
            'neo4j': False,
            'mongodb': False,
            'mysql': {}
        }

        # Test PostgreSQL
        try:
            with self.postgres_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            connection_status['postgres'] = True
            logger.info("PostgreSQL connection: OK")
        except Exception as e:
            logger.error(f"PostgreSQL connection failed: {e}")

        # Test Neo4j
        if self.neo4j_driver:
            connection_status['neo4j'] = True
            logger.info("Neo4j connection: OK")
        else:
            logger.error("Neo4j connection: FAILED")

        # Test MongoDB
        try:
            self.mongo_client.admin.command('ping')
            connection_status['mongodb'] = True
            logger.info("MongoDB connection: OK")
        except Exception as e:
            logger.error(f"MongoDB connection failed: {e}")

        # Test MySQL connections
        for db_name, connection in self.mysql_connections.items():
            try:
                cursor = connection.cursor()
                cursor.execute("SELECT 1")
                cursor.fetchone()
                cursor.close()
                connection_status['mysql'][db_name] = True
                logger.info(f"MySQL ({db_name}) connection: OK")
            except Exception as e:
                connection_status['mysql'][db_name] = False
                logger.error(f"MySQL ({db_name}) connection failed: {e}")

        return connection_status

    def _check_table_exists(self, connection, table_name: str) -> bool:
        """Check if a table exists in the database"""
        try:
            cursor = connection.cursor()
            cursor.execute("SHOW TABLES LIKE %s", (table_name,))
            result = cursor.fetchone()
            cursor.close()
            return result is not None
        except Exception:
            return False

    def show_available_tables(self):
        """Show all available tables in each database for debugging"""
        logger.info("=== Available Database Tables ===")

        for db_name, connection in self.mysql_connections.items():
            try:
                cursor = connection.cursor()
                cursor.execute("SHOW TABLES")
                tables = [table[0] for table in cursor.fetchall()]
                cursor.close()
                logger.info(f"{db_name} database tables: {tables}")
            except Exception as e:
                logger.error(f"Failed to list tables in {db_name}: {e}")

    def collect_comprehensive_training_data(self, months_back: int = 12) -> pd.DataFrame:
        """
        Collect comprehensive training data from all services
        """
        logger.info(f"Starting comprehensive data collection for last {months_back} months")
        
        # Collect data from each database with individual error handling
        neo4j_data = pd.DataFrame()
        mongodb_data = pd.DataFrame()
        mysql_data = pd.DataFrame()
        postgres_data = pd.DataFrame()

        try:
            neo4j_data = self._collect_neo4j_data(months_back)
        except Exception as e:
            logger.error(f"Failed to collect Neo4j data: {e}")

        try:
            mongodb_data = self._collect_mongodb_data(months_back)
        except Exception as e:
            logger.error(f"Failed to collect MongoDB data: {e}")

        try:
            mysql_data = self._collect_mysql_data(months_back)
        except Exception as e:
            logger.error(f"Failed to collect MySQL data: {e}")

        try:
            postgres_data = self._collect_postgres_ml_data(months_back)
        except Exception as e:
            logger.error(f"Failed to collect PostgreSQL data: {e}")
            # Create some basic synthetic data if no real data available
            if neo4j_data.empty and mongodb_data.empty and mysql_data.empty:
                logger.info("No real data available, generating minimal synthetic dataset")
                # Use the SyntheticDataGenerator class defined in this same file
                generator = SyntheticDataGenerator()
                return generator.generate_comprehensive_dataset().head(100)

        # Merge all datasets
        comprehensive_data = self._merge_multi_db_data(
            neo4j_data, mongodb_data, mysql_data, postgres_data
        )
        
        # Add derived performance metrics from existing columns
        if not comprehensive_data.empty:
            comprehensive_data = self._add_derived_performance_metrics(comprehensive_data)
        
        # ===== ABSOLUTE FINAL SAFETY: ENSURE WORKLOAD COLUMNS =====
        logger.info("=" * 100)
        logger.info("ABSOLUTE FINAL WORKLOAD CHECK BEFORE STORING/RETURNING")
        logger.info("=" * 100)

        if not comprehensive_data.empty:
            # Check what columns exist
            has_util = 'utilization' in comprehensive_data.columns
            has_workload = 'workload_score' in comprehensive_data.columns
            has_avail = 'availability_score' in comprehensive_data.columns
            has_cap = 'capacity' in comprehensive_data.columns

            logger.info(f"Workload columns status:")
            logger.info(f"  - utilization: {'✓ EXISTS' if has_util else '✗ MISSING'}")
            logger.info(f"  - workload_score: {'✓ EXISTS' if has_workload else '✗ MISSING'}")
            logger.info(f"  - availability_score: {'✓ EXISTS' if has_avail else '✗ MISSING'}")
            logger.info(f"  - capacity: {'✓ EXISTS' if has_cap else '✗ MISSING'}")

            if not all([has_util, has_workload, has_avail, has_cap]):
                logger.error("❌ WORKLOAD COLUMNS STILL MISSING! Forcing calculation NOW...")

                # Check for raw data
                has_total = 'total_estimate_hours' in comprehensive_data.columns
                has_weekly = 'weekly_capacity_hours' in comprehensive_data.columns

                logger.info(f"Raw data availability:")
                logger.info(f"  - total_estimate_hours: {'✓' if has_total else '✗'}")
                logger.info(f"  - weekly_capacity_hours: {'✓' if has_weekly else '✗'}")

                if has_total and has_weekly:
                    logger.info("Calculating from raw data...")

                    # Force calculation
                    comprehensive_data['utilization_percentage'] = (
                        comprehensive_data['total_estimate_hours'] /
                        comprehensive_data['weekly_capacity_hours'].replace(0, 1) * 100.0
                    ).fillna(50.0)

                    comprehensive_data['workload_score'] = (
                        (100.0 - comprehensive_data['utilization_percentage']) / 100.0
                    ).clip(0.0, 1.0)

                    comprehensive_data['utilization'] = comprehensive_data['utilization_percentage'] / 100.0
                    comprehensive_data['capacity'] = comprehensive_data['weekly_capacity_hours'].fillna(40.0)

                    if 'availability_percentage' in comprehensive_data.columns:
                        comprehensive_data['availability_score'] = (
                            comprehensive_data['availability_percentage'] / 100.0
                        ).clip(0.0, 1.0)
                        comprehensive_data['availability'] = comprehensive_data['availability_score']
                    else:
                        comprehensive_data['availability_score'] = 0.5
                        comprehensive_data['availability'] = 0.5

                    logger.info("✅ FORCED CALCULATION COMPLETE:")
                    logger.info(f"  - utilization: mean={comprehensive_data['utilization'].mean():.3f}")
                    logger.info(f"  - workload_score: mean={comprehensive_data['workload_score'].mean():.3f}")
                    logger.info(f"  - availability_score: mean={comprehensive_data['availability_score'].mean():.3f}")
                else:
                    logger.error("❌ NO RAW DATA - Cannot calculate! Using defaults...")
                    comprehensive_data['utilization'] = 0.5
                    comprehensive_data['workload_score'] = 0.5
                    comprehensive_data['availability_score'] = 0.5
                    comprehensive_data['capacity'] = 40.0
            else:
                logger.info("✅ All workload columns present!")

        logger.info("=" * 100)

        # Store aggregated data in PostgreSQL for ML training
        self._store_comprehensive_data(comprehensive_data)
        
        logger.info(f"Collected {len(comprehensive_data)} comprehensive training records")
        
        return comprehensive_data
    
    def _collect_neo4j_data(self, months_back: int) -> pd.DataFrame:
        """
        Collect data from Neo4j (profile-service)
        """
        logger.info("Collecting data from Neo4j databases...")
        
        if self.neo4j_driver is None:
            logger.warning("Neo4j driver not available, returning empty DataFrame")
            return pd.DataFrame()

        cutoff_date = datetime.now() - timedelta(days=30 * months_back)
        
        cypher_query = """
        MATCH (u:user_profile)
        OPTIONAL MATCH (u)-[r:HAS_SKILL]->(s:user_skill)
        RETURN 
            u.id as user_id,
            u.userId as user_id_ref,
            u.avatar as avatar,
            u.dob as date_of_birth,
            u.city as city,
            u.averageTaskCompletionRate as avg_completion_rate,
            u.totalTasksCompleted as total_tasks,
            u.currentWorkLoadHours as current_workload,
            u.availabilityStatus as availability_status,
            u.createdAt as created_date,
            u.updatedAt as updated_date,
            collect(DISTINCT s.skillName) as skills,
            collect(DISTINCT s.proficiencyLevel) as skill_levels,
            collect(DISTINCT s.yearsOfExperience) as skill_years
        LIMIT 100
        """
        
        try:
            with self.neo4j_driver.session() as session:
                result = session.run(cypher_query)
                records = [record.data() for record in result]

            neo4j_df = pd.DataFrame(records)
        except Exception as e:
            logger.error(f"Failed to execute Neo4j query: {e}")
            return pd.DataFrame()

        logger.info(f"Collected {len(neo4j_df)} records from Neo4j")
        return neo4j_df
    
    def _collect_mongodb_data(self, months_back: int) -> pd.DataFrame:
        """
        Collect data from MongoDB (ai-service, chat-service, notification-service, file-service)
        """
        logger.info("Collecting data from MongoDB databases...")
        
        cutoff_date = datetime.now() - timedelta(days=30 * months_back)
        
        # Collect AI predictions and recommendations
        ai_recommendations_collection = self.mongo_db['ai_recommendations']
        ai_recommendations = list(ai_recommendations_collection.find({
            'createdAt': {'$gte': cutoff_date}
        }))
        
        # Collect AI predictions
        ai_predictions_collection = self.mongo_db['ai_predictions']
        ai_predictions = list(ai_predictions_collection.find({
            'createdAt': {'$gte': cutoff_date}
        }))
        
        # Collect chat interactions (for collaboration features)
        chat_collection = self.mongo_db['chat_messages']
        chat_data = list(chat_collection.find({
            'timestamp': {'$gte': cutoff_date},
            'type': 'task_discussion'
        }))
        
        # Convert to DataFrame
        ai_recs_df = pd.DataFrame(ai_recommendations) if ai_recommendations else pd.DataFrame()
        ai_preds_df = pd.DataFrame(ai_predictions) if ai_predictions else pd.DataFrame()
        pd.DataFrame(chat_data) if chat_data else pd.DataFrame()
        
        # Merge AI service data
        mongodb_df = pd.DataFrame()
        if not ai_recs_df.empty:
            mongodb_df = ai_recs_df
            if not ai_preds_df.empty:
                mongodb_df = mongodb_df.merge(
                    ai_preds_df, 
                    left_on=['taskId', 'userId'], 
                    right_on=['taskId', 'userId'], 
                    how='left',
                    suffixes=('_rec', '_pred')
                )
        
        logger.info(f"Collected {len(mongodb_df)} records from MongoDB")
        return mongodb_df
    
    def _collect_mysql_data(self, months_back: int) -> pd.DataFrame:
        """
        Collect data from MySQL databases (identity, task, project, workload services)
        """
        logger.info("Collecting data from MySQL databases...")
        
        cutoff_date = datetime.now() - timedelta(days=30 * months_back)
        
        # Initialize DataFrames for each service
        task_df = pd.DataFrame()
        project_df = pd.DataFrame()
        identity_df = pd.DataFrame()
        workload_df = pd.DataFrame()
        
        # Collect from task database
        if 'task' in self.mysql_connections:
            connection = self.mysql_connections['task']

            if self._check_table_exists(connection, 'tasks'):
                task_cursor = connection.cursor(dictionary=True)

                # Check if completed_at column exists
                has_completed_at = False
                try:
                    check_cursor = connection.cursor()
                    check_cursor.execute("DESCRIBE tasks")
                    columns = [col[0] for col in check_cursor.fetchall()]
                    has_completed_at = 'completed_at' in columns
                    check_cursor.close()
                except Exception:
                    pass

                # Build task query with required_skills and new extension tracking fields
                # Note: difficulty column removed as it doesn't exist in Task entity
                completed_at_col = "t.completed_at," if has_completed_at else "NULL as completed_at,"

                # Check for new extension tracking columns
                check_cursor = connection.cursor()
                check_cursor.execute("DESCRIBE tasks")
                all_columns = [col[0] for col in check_cursor.fetchall()]
                check_cursor.close()

                has_assigned_at = 'assigned_at' in all_columns
                has_original_estimated = 'original_estimated_hours' in all_columns
                has_original_due_date = 'original_due_date' in all_columns
                has_extension_count = 'extension_count' in all_columns
                has_total_extension_hours = 'total_extension_hours' in all_columns
                has_had_extension = 'had_extension' in all_columns
                has_last_extension_date = 'last_extension_date' in all_columns

                # Build column selections with fallbacks for backward compatibility
                assigned_at_col = "t.assigned_at," if has_assigned_at else "NULL as assigned_at,"
                original_est_col = "t.original_estimated_hours," if has_original_estimated else "t.estimated_hours as original_estimated_hours,"
                original_due_col = "t.original_due_date," if has_original_due_date else "t.due_date as original_due_date,"
                ext_count_col = "t.extension_count," if has_extension_count else "0 as extension_count,"
                total_ext_hrs_col = "t.total_extension_hours," if has_total_extension_hours else "0 as total_extension_hours,"
                had_ext_col = "t.had_extension," if has_had_extension else "FALSE as had_extension,"
                last_ext_date_col = "t.last_extension_date," if has_last_extension_date else "NULL as last_extension_date,"

                task_query = f"""
                SELECT 
                    t.id as task_id,
                    t.title as task_title,
                    t.description as task_description,
                    t.priority,
                    t.type as task_type,
                    
                    -- Original values (for comparison with extensions)
                    {original_est_col}
                    {original_due_col}
                    
                    -- Current values (may include extensions)
                    t.estimated_hours,
                    t.actual_hours,
                    t.due_date,
                    
                    -- Extension tracking (NEW)
                    {ext_count_col}
                    {total_ext_hrs_col}
                    {had_ext_col}
                    {last_ext_date_col}
                    
                    -- Timing fields
                    {assigned_at_col}
                    {completed_at_col}
                    t.started_at,
                    t.created_at as task_created_date,
                    t.updated_at,
                    
                    -- Other fields
                    t.status as task_status,
                    t.assigned_to,
                    t.progress_percentage,
                    t.project_id,
                    t.reporter_id,
                    
                    -- Skills
                    COALESCE(
                        (SELECT GROUP_CONCAT(trs.skill_name SEPARATOR ',')
                         FROM task_required_skills trs
                         WHERE trs.task_id = t.id),
                        ''
                    ) as required_skills
                FROM tasks t
                WHERE t.created_at >= %s
                LIMIT 1000
                """

                logger.info("=" * 80)
                logger.info("TASK QUERY COLUMN AVAILABILITY")
                logger.info("=" * 80)
                logger.info(f"  assigned_at: {'✓' if has_assigned_at else '✗ (using NULL)'}")
                logger.info(f"  original_estimated_hours: {'✓' if has_original_estimated else '✗ (using estimated_hours)'}")
                logger.info(f"  original_due_date: {'✓' if has_original_due_date else '✗ (using due_date)'}")
                logger.info(f"  extension_count: {'✓' if has_extension_count else '✗ (using 0)'}")
                logger.info(f"  total_extension_hours: {'✓' if has_total_extension_hours else '✗ (using 0)'}")
                logger.info(f"  had_extension: {'✓' if has_had_extension else '✗ (using FALSE)'}")
                logger.info(f"  last_extension_date: {'✓' if has_last_extension_date else '✗ (using NULL)'}")
                logger.info(f"  completed_at: {'✓' if has_completed_at else '✗ (using NULL)'}")
                logger.info("=" * 80)

                try:
                    task_cursor.execute(task_query, (cutoff_date,))
                    task_records = task_cursor.fetchall()
                    task_df = pd.DataFrame(task_records) if task_records else pd.DataFrame()

                    # Process required_skills from comma-separated string to list
                    if not task_df.empty and 'required_skills' in task_df.columns:
                        logger.info("=" * 80)
                        logger.info("PROCESSING REQUIRED_SKILLS FROM TASK DATA")
                        logger.info("=" * 80)

                        # Log sample before processing
                        sample_before = task_df['required_skills'].iloc[0] if len(task_df) > 0 else None
                        logger.info(f"Sample required_skills BEFORE processing: {sample_before}")
                        logger.info(f"Type: {type(sample_before)}")

                        task_df['required_skills'] = task_df['required_skills'].apply(
                            lambda x: x.split(',') if x and x.strip() else []
                        )

                        # Log sample after processing
                        sample_after = task_df['required_skills'].iloc[0] if len(task_df) > 0 else None
                        logger.info(f"Sample required_skills AFTER processing: {sample_after}")
                        logger.info(f"Type: {type(sample_after)}")

                        # Count non-empty skill lists
                        non_empty = task_df['required_skills'].apply(lambda x: len(x) > 0).sum()
                        logger.info(f"Tasks with required_skills: {non_empty}/{len(task_df)}")

                        if non_empty == 0:
                            logger.warning("⚠️  ALL tasks have EMPTY required_skills!")
                            logger.warning("   This will cause skill_match_score = 0 for everyone")

                        logger.info("=" * 80)

                    # Keep completed_at as is - no renaming needed for consistency with source database

                    # If actual_hours is None or 0, try to use estimated_hours as fallback
                    if not task_df.empty and 'actual_hours' in task_df.columns:
                        # Fill None with estimated_hours where task is completed
                        if 'task_status' in task_df.columns and 'estimated_hours' in task_df.columns:
                            completed_mask = task_df['task_status'] == 'COMPLETED'
                            task_df.loc[completed_mask & task_df['actual_hours'].isna(), 'actual_hours'] = \
                                task_df.loc[completed_mask & task_df['actual_hours'].isna(), 'estimated_hours']

                    # Calculate performance metrics from new fields
                    if not task_df.empty:
                        task_df = self._calculate_task_performance_metrics(task_df)
                    
                    # Derive difficulty from priority and estimated_hours since it doesn't exist in Task entity
                    if not task_df.empty:
                        task_df = self._derive_task_difficulty(task_df)

                    logger.info(f"Collected {len(task_df)} records from task database")
                except Exception as e:
                    logger.error(f"Error collecting from task database: {e}")
                finally:
                    task_cursor.close()
            else:
                logger.warning("Tasks table does not exist in task database")

        # Collect from project database
        if 'project' in self.mysql_connections:
            project_cursor = self.mysql_connections['project'].cursor(dictionary=True)
            
            project_query = """
            SELECT 
                p.id as project_id,
                p.name as project_name,
                p.description as project_description,
                p.status as project_status,
                p.created_at as project_created_date,
                p.end_date,
                pm.user_id as project_member_id,
                pm.role as project_role
            FROM projects p
            LEFT JOIN project_members pm ON p.id = pm.project_id
            WHERE p.created_at >= %s
            """
            
            try:
                project_cursor.execute(project_query, (cutoff_date,))
                project_records = project_cursor.fetchall()
                project_df = pd.DataFrame(project_records) if project_records else pd.DataFrame()
                logger.info(f"Collected {len(project_df)} records from project database")
            except Exception as e:
                logger.error(f"Error collecting from project database: {e}")
            finally:
                project_cursor.close()
        
        # Collect from identity database
        if 'identity' in self.mysql_connections:
            connection = self.mysql_connections['identity']

            # Check for the correct table name - could be 'users' or 'user'
            table_name = 'user'
            # if self._check_table_exists(connection, 'users'):
            #     table_name = 'users'
            # elif self._check_table_exists(connection, 'user'):
            #     table_name = 'user'

            if table_name:
                identity_cursor = connection.cursor(dictionary=True)

                # Check if departments and position tables exist
                has_departments = self._check_table_exists(connection, 'departments')
                has_position = self._check_table_exists(connection, 'position')

                # Build query with joins if tables exist
                dept_join = "LEFT JOIN departments d ON u.department_id = d.id" if has_departments else ""
                pos_join = "LEFT JOIN position p ON u.position_id = p.id" if has_position else ""
                dept_select = "d.name as department_name," if has_departments else "'Unknown' as department_name,"
                seniority_select = "p.seniority_level," if has_position else "'MID_LEVEL' as seniority_level,"

                identity_query = f"""
                SELECT 
                    u.id as user_id,
                    u.email,
                    u.first_name,
                    u.last_name,
                    u.username,
                    u.phone_number,
                    u.performance_score,
                    u.created_at,
                    u.updated_at,
                    u.department_id,
                    u.position_id,
                    u.role_id,
                    {dept_select}
                    {seniority_select}
                    COALESCE(
                        (SELECT GROUP_CONCAT(
                            CONCAT(prs.skill_name, ':', prs.required_level)
                            SEPARATOR ','
                        )
                        FROM position_required_skills prs
                        WHERE prs.position_id = u.position_id),
                        ''
                    ) as user_skills_data
                FROM {table_name} u
                {dept_join}
                {pos_join}
                WHERE u.created_at >= %s
                LIMIT 1000
                """

                try:
                    identity_cursor.execute(identity_query, (cutoff_date,))
                    identity_records = identity_cursor.fetchall()
                    identity_df = pd.DataFrame(identity_records) if identity_records else pd.DataFrame()

                    # ========== LOG RAW PERFORMANCE SCORES FROM DATABASE ==========
                    if not identity_df.empty and 'performance_score' in identity_df.columns:
                        logger.info("=" * 100)
                        logger.info("RAW PERFORMANCE SCORES FROM IDENTITY DATABASE")
                        logger.info("=" * 100)
                        logger.info(f"Total users collected: {len(identity_df)}")
                        logger.info("")

                        # Log each user's performance score
                        for idx, row in identity_df.iterrows():
                            user_id = row.get('user_id', 'N/A')
                            perf_score = row.get('performance_score', 'N/A')
                            email = row.get('email', 'N/A')
                            logger.info(f"User {user_id[:8]}... | Email: {email:30s} | Performance Score (RAW): {perf_score}")

                        logger.info("")
                        logger.info(f"Performance Score Statistics (RAW from DB):")
                        logger.info(f"  - Min:    {identity_df['performance_score'].min()}")
                        logger.info(f"  - Max:    {identity_df['performance_score'].max()}")
                        logger.info(f"  - Mean:   {identity_df['performance_score'].mean():.2f}")
                        logger.info(f"  - Median: {identity_df['performance_score'].median()}")
                        logger.info(f"  - Non-null count: {identity_df['performance_score'].notna().sum()} / {len(identity_df)}")
                        logger.info(f"  - Null count: {identity_df['performance_score'].isna().sum()}")
                        logger.info("=" * 100)
                        logger.info("")

                    # Process user_skills_data into user_skills and user_skill_levels
                    if not identity_df.empty and 'user_skills_data' in identity_df.columns:
                        def parse_user_skills(skills_str):
                            if not skills_str or pd.isna(skills_str):
                                return [], []

                            skills = []
                            levels = []

                            for skill_info in skills_str.split(','):
                                if ':' in skill_info:
                                    parts = skill_info.split(':')
                                    if len(parts) >= 2:
                                        skills.append(parts[0])
                                        try:
                                            # required_level is a Double (0.0 to 1.0 or similar)
                                            level_value = float(parts[1])
                                            # Convert to skill level category
                                            if level_value >= 0.7:
                                                levels.append('ADVANCED')
                                            elif level_value >= 0.4:
                                                levels.append('INTERMEDIATE')
                                            else:
                                                levels.append('BEGINNER')
                                        except:
                                            levels.append('INTERMEDIATE')

                            return skills, levels

                        identity_df[['user_skills', 'user_skill_levels']] = identity_df['user_skills_data'].apply(
                            lambda x: pd.Series(parse_user_skills(x))
                        )

                        # Calculate years_experience based on seniority level
                        seniority_years_map = {
                            'INTERN': 0,
                            'JUNIOR': 1,
                            'MID_LEVEL': 3,
                            'SENIOR': 6,
                            'LEAD': 9,
                            'PRINCIPAL': 12
                        }
                        identity_df['years_experience'] = identity_df['seniority_level'].map(
                            seniority_years_map
                        ).fillna(3)

                        # Drop intermediate column
                        identity_df = identity_df.drop('user_skills_data', axis=1)

                    # ========== NORMALIZE PERFORMANCE SCORE ==========
                    # MySQL stores performance_score on 0-100 scale
                    # ML model expects 0-1 scale, so we need to normalize
                    if not identity_df.empty and 'performance_score' in identity_df.columns:
                        # Check if scores are on 0-100 scale (any value > 1.0)
                        max_score = identity_df['performance_score'].max()
                        if pd.notna(max_score) and max_score > 1.0:
                            logger.info("=" * 100)
                            logger.info(f"🔄 Normalizing performance_score from 0-100 scale to 0-1 scale (max value: {max_score})")

                            # Store original values for comparison logging
                            original_scores = identity_df['performance_score'].copy()

                            # Normalize from 0-100 to 0-1
                            identity_df['performance_score'] = identity_df['performance_score'] / 100.0

                            logger.info(f"✅ After normalization - min: {identity_df['performance_score'].min():.4f}, max: {identity_df['performance_score'].max():.4f}")
                            logger.info("")
                            logger.info("Sample normalization (showing first 10 users):")
                            for idx, row in identity_df.head(10).iterrows():
                                user_id = row.get('user_id', 'N/A')
                                original = original_scores.loc[idx]
                                normalized = row.get('performance_score', 0)
                                logger.info(f"  User {user_id[:8]}... | Before: {original:6.2f} → After: {normalized:.4f}")
                            logger.info("=" * 100)
                        else:
                            logger.info(f"Performance scores already on 0-1 scale (max: {max_score})")

                    logger.info(f"Collected {len(identity_df)} records from identity database")
                except Exception as e:
                    logger.error(f"Error collecting from identity database: {e}")
                finally:
                    identity_cursor.close()
            else:
                logger.warning("No users table found in identity database")

        # Note: user_workloads table is in workload database
        # Check workload database first, then fall back to other databases
        logger.info("=" * 80)
        logger.info("SEARCHING FOR user_workloads TABLE")
        logger.info("=" * 80)

        workload_table_found = False
        
        # Priority order: workload > task > project > identity
        priority_dbs = ['workload', 'task', 'project', 'identity']
        databases_to_check = []
        
        # Log available MySQL connections
        logger.info(f"Available MySQL connections: {list(self.mysql_connections.keys())}")

        # Add databases in priority order if they exist
        for db_name in priority_dbs:
            if db_name in self.mysql_connections:
                databases_to_check.append((db_name, self.mysql_connections[db_name]))
                logger.info(f"  ✓ Will check '{db_name}' database")
            else:
                logger.warning(f"  ✗ '{db_name}' database connection not available")

        # Add any remaining databases not in priority list
        for db_name, connection in self.mysql_connections.items():
            if db_name not in priority_dbs:
                databases_to_check.append((db_name, connection))
                logger.info(f"  ✓ Will check '{db_name}' database (non-priority)")

        logger.info(f"Checking {len(databases_to_check)} databases in order: {[db[0] for db in databases_to_check]}")
        logger.info("=" * 80)

        for db_name, connection in databases_to_check:
            try:
                logger.info(f"Checking for user_workloads table in '{db_name}' database...")

                # First check if table exists
                table_exists = self._check_table_exists(connection, 'user_workloads')

                if not table_exists:
                    logger.info(f"  ✗ Table user_workloads NOT FOUND in '{db_name}' database")
                    continue

                logger.info(f"  ✓ Found user_workloads table in '{db_name}' database!")
                workload_table_found = True

                workload_cursor = connection.cursor(dictionary=True)
                # Query using correct column names from UserWorkload entity
                workload_query = """
                SELECT 
                    w.id as workload_id,
                    w.user_id as user_id,
                    w.weekly_capacity_hours,
                    w.daily_capacity_hours,
                    w.total_estimate_hours,
                    w.total_actual_hours,
                    w.availability_percentage,
                    w.next_available_date,
                    w.upcoming_week_hours,
                    w.last_updated as workload_updated_date
                FROM user_workloads w
                WHERE w.last_updated >= %s
                """

                workload_cursor.execute(workload_query, (cutoff_date,))
                workload_records = workload_cursor.fetchall()
                if workload_records:
                    workload_df = pd.DataFrame(workload_records)

                    logger.info(f"Raw workload_df has {len(workload_df)} records")
                    logger.info(f"Columns from database: {workload_df.columns.tolist()}")

                    # =====================================================
                    # STEP 1: CALCULATE WORKLOAD METRICS (DO THIS FIRST!)
                    # =====================================================
                    if not workload_df.empty:
                        logger.info("=" * 80)
                        logger.info("CALCULATING WORKLOAD METRICS FROM DATABASE COLUMNS")
                        logger.info("=" * 80)

                        # 1.1: Calculate utilization_percentage
                        workload_df['utilization_percentage'] = (
                                workload_df['total_estimate_hours'] /
                                workload_df['weekly_capacity_hours'].replace(0, 1) * 100.0
                        ).fillna(0)

                        logger.info(f"✓ Calculated utilization_percentage")
                        logger.info(f"  - total_estimate_hours: mean={workload_df['total_estimate_hours'].mean():.1f}h")
                        logger.info(f"  - weekly_capacity_hours: mean={workload_df['weekly_capacity_hours'].mean():.1f}h")
                        logger.info(f"  - utilization_percentage: mean={workload_df['utilization_percentage'].mean():.1f}%")

                        # 1.2: Calculate workload_score (inverse of utilization)
                        workload_df['workload_score'] = (
                                (100.0 - workload_df['utilization_percentage']) / 100.0
                        ).clip(lower=0.0, upper=1.0)

                        logger.info(f"✓ Calculated workload_score (inverse of utilization)")
                        logger.info(f"  - workload_score: mean={workload_df['workload_score'].mean():.3f}")

                        # 1.3: Calculate utilization ratio
                        workload_df['utilization'] = workload_df['utilization_percentage'] / 100.0
                        logger.info(f"✓ Calculated utilization ratio: mean={workload_df['utilization'].mean():.3f}")

                        # 1.4: Set capacity
                        workload_df['capacity'] = workload_df['weekly_capacity_hours']

                        # 1.5: Calculate availability_score
                        if 'availability_percentage' in workload_df.columns:
                            workload_df['availability_score'] = (
                                    workload_df['availability_percentage'] / 100.0
                            ).clip(0.0, 1.0)
                            workload_df['availability'] = workload_df['availability_score']

                            logger.info(f"✓ Calculated availability_score from availability_percentage")
                            logger.info(f"  - availability_percentage: mean={workload_df['availability_percentage'].mean():.1f}%")
                            logger.info(f"  - availability_score: mean={workload_df['availability_score'].mean():.3f}")
                        else:
                            logger.warning("⚠️  availability_percentage column not found")
                            workload_df['availability_score'] = 0.5
                            workload_df['availability'] = 0.5

                        # 1.6: Warn about overloaded users
                        overloaded_users = workload_df[workload_df['utilization_percentage'] > 100]
                        if len(overloaded_users) > 0:
                            logger.warning("")
                            logger.warning(f"⚠️  FOUND {len(overloaded_users)} OVERLOADED USERS:")
                            for idx, row in overloaded_users.head(10).iterrows():
                                user_id = row.get('user_id', 'Unknown')[:8]
                                util_pct = row.get('utilization_percentage', 0)
                                logger.warning(f"  - User {user_id}... : {util_pct:.1f}% utilization")

                        logger.info("=" * 80)

                        # =====================================================
                        # STEP 2: VERIFY COLUMNS EXIST (DO THIS AFTER CALCULATION!)
                        # =====================================================
                        logger.info("=" * 80)
                        logger.info("VERIFYING CALCULATED COLUMNS (AFTER CALCULATION)")
                        logger.info("=" * 80)

                        required_cols = ['utilization', 'workload_score', 'availability_score', 'capacity', 'availability']
                        all_present = True

                        for col in required_cols:
                            if col in workload_df.columns:
                                mean_val = workload_df[col].mean()
                                logger.info(f"  ✓ {col}: EXISTS - mean={mean_val:.3f}")
                            else:
                                logger.error(f"  ✗ {col}: MISSING after calculation!")
                                all_present = False

                        if all_present:
                            logger.info("✅ All required workload columns successfully calculated!")
                        else:
                            logger.error("❌ Some columns are still missing - check calculation logic!")

                        logger.info(f"Final columns: {workload_df.columns.tolist()}")
                        logger.info("=" * 80)

                        logger.info("=" * 80)
                        logger.info("WORKLOAD_DF COLUMNS AFTER CALCULATION")
                        logger.info("=" * 80)
                        logger.info(f"Columns: {workload_df.columns.tolist()}")
                        logger.info(f"Sample row:")
                        for col in ['weekly_capacity_hours', 'workload_score', 'utilization']:
                            if col in workload_df.columns:
                                logger.info(f"  {col}: {workload_df[col].iloc[0] if len(workload_df) > 0 else 'N/A'}")
                            else:
                                logger.error(f"  {col}: MISSING!")
                        logger.info("=" * 80)

                    else:
                        logger.warning("workload_df is empty, skipping calculations")
                        # Add empty columns
                        for col in ['utilization', 'workload_score', 'availability_score', 'capacity', 'availability']:
                            workload_df[col] = []

                    logger.info(f"Collected {len(workload_df)} workload records from {db_name}")
                    workload_cursor.close()
                    break  # Found workload data, exit loop
                else:
                    logger.info(f"No workload records found in {db_name} database")
                    workload_cursor.close()
            except Exception as e:
                # Table might not exist in this database, continue to next
                logger.debug(f"Could not query user_workloads in {db_name}: {e}")
                continue
        
        if not workload_table_found:
            logger.warning("user_workloads table not found in any MySQL database")
            logger.warning("Will add default workload columns later when merging")
        elif workload_df.empty:
            logger.warning("user_workloads table exists but contains no data")
            logger.warning("Will add default workload columns later when merging")

        # ========== Collect user_current_tasks for assigned_date ==========
        user_tasks_df = pd.DataFrame()
        user_tasks_found = False

        # Priority order: workload > task > project > identity
        for db_name, connection in databases_to_check:
            try:
                if not self._check_table_exists(connection, 'user_current_tasks'):
                    logger.debug(f"Table user_current_tasks not found in {db_name} database")
                    continue

                logger.info(f"Found user_current_tasks table in {db_name} database")
                user_tasks_found = True

                user_tasks_cursor = connection.cursor(dictionary=True)
                user_tasks_query = """
                SELECT 
                    uct.user_id,
                    uct.task_id,
                    uct.assigned_date,
                    uct.estimated_hours as task_estimated_hours,
                    uct.actual_hours_spent,
                    uct.remaining_hours,
                    uct.progress_percentage as task_progress,
                    uct.status as current_task_status
                FROM user_current_tasks uct
                WHERE uct.assigned_date >= %s
                """

                user_tasks_cursor.execute(user_tasks_query, (cutoff_date,))
                user_tasks_records = user_tasks_cursor.fetchall()
                user_tasks_cursor.close()

                if user_tasks_records:
                    user_tasks_df = pd.DataFrame(user_tasks_records)
                    # Rename assigned_date to assignment_date for ML model consistency
                    user_tasks_df = user_tasks_df.rename(columns={'assigned_date': 'assignment_date'})
                    logger.info(f"Collected {len(user_tasks_df)} user_current_tasks records with assignment_date")
                    break
                else:
                    logger.info(f"user_current_tasks table exists but is empty in {db_name}")
            except Exception as e:
                logger.debug(f"Could not query user_current_tasks in {db_name}: {e}")
                continue

        if not user_tasks_found:
            logger.warning("user_current_tasks table not found - assignment_date will use defaults")

        # Merge all MySQL service data
        mysql_df = pd.DataFrame()
        if not task_df.empty:
            mysql_df = task_df

            # Add identity data to get user_skills, department_name, seniority_level, years_experience
            if not identity_df.empty:
                # Debug log to check columns before merge
                logger.info("=" * 80)
                logger.info("MERGING IDENTITY DATA")
                logger.info("=" * 80)
                logger.info(f"Identity columns: {identity_df.columns.tolist()}")
                logger.info(f"Identity rows: {len(identity_df)}")
                logger.info(f"Task columns before merge: {mysql_df.columns.tolist()}")
                logger.info(f"Task rows: {len(mysql_df)}")

                # Check if user_skills column exists in identity_df
                if 'user_skills' in identity_df.columns:
                    non_empty_skills = identity_df['user_skills'].apply(lambda x: bool(x) if isinstance(x, list) else False).sum()
                    logger.info(f"Identity has user_skills: {non_empty_skills}/{len(identity_df)} users have skills")
                else:
                    logger.warning("⚠️  user_skills column NOT in identity_df!")

                mysql_df = mysql_df.merge(
                    identity_df,
                    left_on='assigned_to',  # Use correct column name from tasks
                    right_on='user_id',
                    how='left',
                    suffixes=('_task', '')  # Keep identity data without suffix
                )

                logger.info(f"Columns after identity merge: {mysql_df.columns.tolist()}")
                logger.info(f"Rows after merge: {len(mysql_df)}")

                # Verify critical columns made it through
                critical_identity_cols = ['user_skills', 'user_skill_levels', 'department_name', 'seniority_level', 'years_experience', 'performance_score']
                logger.info("\nCritical identity columns after merge:")
                for col in critical_identity_cols:
                    if col in mysql_df.columns:
                        if col in ['user_skills', 'user_skill_levels']:
                            non_empty = mysql_df[col].apply(lambda x: bool(x) if isinstance(x, list) else False).sum()
                            logger.info(f"  ✓ {col}: {non_empty}/{len(mysql_df)} non-empty")
                        else:
                            non_null = mysql_df[col].notna().sum()
                            logger.info(f"  ✓ {col}: {non_null}/{len(mysql_df)} non-null")
                    else:
                        logger.warning(f"  ✗ {col}: MISSING!")
                logger.info("=" * 80)

            # Add workload data
            if not workload_df.empty:
                logger.info("=" * 80)
                logger.info("MERGING WORKLOAD DATA INTO MYSQL DATASET")
                logger.info("=" * 80)
                logger.info(f"Workload columns to merge: {workload_df.columns.tolist()}")
                logger.info(f"Workload rows: {len(workload_df)}")

                # CRITICAL: Log workload columns BEFORE merge to confirm they exist
                workload_critical_cols = ['utilization', 'workload_score', 'availability_score', 'capacity']
                logger.info("Workload columns in workload_df BEFORE merge:")
                for col in workload_critical_cols:
                    if col in workload_df.columns:
                        logger.info(f"  ✓ {col}: EXISTS - mean={workload_df[col].mean():.3f}")
                    else:
                        logger.warning(f"  ✗ {col}: MISSING from workload_df!")

                # Determine which column to use for merge
                # After identity merge, we should have 'user_id' column
                merge_column = 'user_id' if 'user_id' in mysql_df.columns else 'assigned_to'
                logger.info(f"Using '{merge_column}' column for workload merge")

                # Log sample values to verify they'll match
                if len(mysql_df) > 0 and merge_column in mysql_df.columns:
                    sample_task_user = mysql_df[merge_column].iloc[0]
                    logger.info(f"Sample task {merge_column}: {sample_task_user}")
                if len(workload_df) > 0:
                    sample_workload_user = workload_df['user_id'].iloc[0]
                    logger.info(f"Sample workload user_id: {sample_workload_user}")

                before_merge_cols = set(mysql_df.columns)
                logger.info(f"mysql_df columns BEFORE merge ({len(before_merge_cols)}): {sorted(list(before_merge_cols))[:20]}...")
                
                # Check for potential column conflicts
                workload_cols_to_merge = workload_df.columns.tolist()
                conflicting_cols = [col for col in workload_cols_to_merge if col in before_merge_cols and col != 'user_id']
                if conflicting_cols:
                    logger.warning(f"⚠️  Columns exist in both dataframes (will get _workload suffix): {conflicting_cols}")
                
                mysql_df = mysql_df.merge(
                    workload_df,
                    left_on=merge_column,  # Use user_id if available, otherwise assigned_to
                    right_on='user_id',
                    how='left',
                    suffixes=('', '_workload')
                )
                
                after_merge_cols = set(mysql_df.columns)
                new_cols = after_merge_cols - before_merge_cols
                logger.info(f"New columns added by workload merge ({len(new_cols)}): {sorted(list(new_cols))}")
                
                # Check if critical columns got renamed with _workload suffix
                for critical_col in ['utilization', 'workload_score', 'availability_score', 'capacity']:
                    renamed_col = f"{critical_col}_workload"
                    if renamed_col in mysql_df.columns and critical_col not in mysql_df.columns:
                        logger.warning(f"⚠️  Column '{critical_col}' was renamed to '{renamed_col}' - renaming back!")
                        mysql_df[critical_col] = mysql_df[renamed_col]
                        mysql_df.drop(columns=[renamed_col], inplace=True)

                logger.info(f"Columns after workload merge: {mysql_df.columns.tolist()}")

                # Verify workload columns are present and ADD MISSING ONES
                workload_check_cols = ['utilization', 'workload_score', 'availability_score', 'capacity']
                logger.info("\nWorkload columns verification:")

                missing_cols = []
                for col in workload_check_cols:
                    if col in mysql_df.columns:
                        non_null = mysql_df[col].notna().sum()
                        logger.info(f"  ✓ {col}: {non_null}/{len(mysql_df)} non-null values - Mean: {mysql_df[col].mean():.3f}")
                    else:
                        missing_cols.append(col)
                        logger.warning(f"  ✗ {col}: MISSING after merge!")

                # If columns are missing, calculate/add them
                if missing_cols:
                    logger.warning(f"\n⚠️  Missing workload columns after merge: {missing_cols}")
                    logger.info("Attempting to calculate missing columns from available data...")

                    # Check if we have the raw columns to calculate
                    if 'total_estimate_hours' in mysql_df.columns and 'weekly_capacity_hours' in mysql_df.columns:
                        logger.info("✓ Found total_estimate_hours and weekly_capacity_hours, calculating workload metrics...")

                        # Calculate utilization_percentage
                        mysql_df['utilization_percentage'] = (
                            mysql_df['total_estimate_hours'] /
                            mysql_df['weekly_capacity_hours'].replace(0, 1) * 100.0
                        ).fillna(50.0)

                        # Calculate workload_score (inverse)
                        mysql_df['workload_score'] = (
                            (100.0 - mysql_df['utilization_percentage']) / 100.0
                        ).clip(0.0, 1.0)

                        # Calculate utilization ratio
                        mysql_df['utilization'] = mysql_df['utilization_percentage'] / 100.0

                        # Add capacity
                        mysql_df['capacity'] = mysql_df['weekly_capacity_hours']

                        logger.info("✓ Calculated workload metrics from raw columns")
                        logger.info(f"  - utilization: mean={mysql_df['utilization'].mean():.3f}")
                        logger.info(f"  - workload_score: mean={mysql_df['workload_score'].mean():.3f}")
                    else:
                        logger.warning("✗ Cannot calculate - missing total_estimate_hours or weekly_capacity_hours")
                        logger.info("Adding default values instead...")
                        if 'utilization' not in mysql_df.columns:
                            mysql_df['utilization'] = 0.5
                        if 'workload_score' not in mysql_df.columns:
                            mysql_df['workload_score'] = 0.5
                        if 'capacity' not in mysql_df.columns:
                            mysql_df['capacity'] = 40.0

                    # Handle availability columns
                    if 'availability_score' not in mysql_df.columns:
                        if 'availability_percentage' in mysql_df.columns:
                            mysql_df['availability_score'] = (mysql_df['availability_percentage'] / 100.0).clip(0.0, 1.0)
                            mysql_df['availability'] = mysql_df['availability_score']
                            logger.info("✓ Calculated availability_score from availability_percentage")
                        else:
                            mysql_df['availability_score'] = 0.5
                            mysql_df['availability'] = 0.5
                            logger.info("✓ Added default availability_score: 0.5")

                logger.info("=" * 80)
            else:
                logger.warning("=" * 80)
                logger.warning("⚠️  NO WORKLOAD DATA TO MERGE!")
                logger.warning("   workload_df is empty - will add default workload columns")
                logger.warning("=" * 80)

                # Add workload columns with default values so downstream code doesn't break
                logger.info("Adding default workload columns to mysql_df...")
                mysql_df['utilization'] = 0.5  # Default 50% utilization
                mysql_df['utilization_percentage'] = 50.0  # Default 50%
                mysql_df['workload_score'] = 0.5  # Default neutral score
                mysql_df['availability_score'] = 0.5  # Default neutral score
                mysql_df['availability'] = 0.5  # Default
                mysql_df['capacity'] = 40.0  # Default 40 hours/week
                mysql_df['weekly_capacity_hours'] = 40
                mysql_df['total_estimate_hours'] = 20

                logger.info("✓ Added default workload columns:")
                logger.info("  - utilization: 0.5 (50%)")
                logger.info("  - workload_score: 0.5 (neutral)")
                logger.info("  - availability_score: 0.5 (neutral)")
                logger.info("  - capacity: 40.0 hours/week")
                
                # Verify they were actually added
                logger.info("\nVerifying default columns were added:")
                for col in ['utilization', 'workload_score', 'availability_score', 'capacity', 'availability']:
                    if col in mysql_df.columns:
                        logger.info(f"  ✓ {col}: EXISTS in mysql_df")
                    else:
                        logger.error(f"  ✗ {col}: STILL MISSING! This is a bug!")
                
                logger.info("=" * 80)

            # Add user_current_tasks data for assignment_date
            if not user_tasks_df.empty:
                logger.info("Merging user_current_tasks for assignment_date...")
                mysql_df = mysql_df.merge(
                    user_tasks_df[['task_id', 'assignment_date', 'actual_hours_spent']],
                    left_on='task_id',
                    right_on='task_id',
                    how='left',
                    suffixes=('', '_uct')
                )
                logger.info(f"Columns after user_current_tasks merge: {mysql_df.columns.tolist()}")

                # If actual_hours is missing but actual_hours_spent exists, use it
                if 'actual_hours' not in mysql_df.columns and 'actual_hours_spent' in mysql_df.columns:
                    mysql_df['actual_hours'] = mysql_df['actual_hours_spent']
                    logger.info("✓ Used actual_hours_spent from user_current_tasks as actual_hours")
                elif 'actual_hours' in mysql_df.columns and 'actual_hours_spent' in mysql_df.columns:
                    # Fill missing actual_hours with actual_hours_spent
                    mysql_df['actual_hours'] = mysql_df['actual_hours'].fillna(mysql_df['actual_hours_spent'])
                    logger.info("✓ Filled missing actual_hours with actual_hours_spent")

            # Add project context
            if not project_df.empty:
                mysql_df = mysql_df.merge(
                    project_df,
                    left_on='project_id',  # Use project_id from tasks
                    right_on='project_id',  # Match with project_id from projects
                    how='left',
                    suffixes=('', '_project')
                )
        elif not project_df.empty:
            mysql_df = project_df  # Use project data if no task data
        elif not identity_df.empty:
            mysql_df = identity_df  # Use identity data if no task or project data

        logger.info(f"Collected {len(mysql_df)} records from MySQL")

        # ========== ENSURE WORKLOAD COLUMNS ALWAYS EXIST ==========
        if not mysql_df.empty:
            logger.info("=" * 100)
            logger.info("ENSURING WORKLOAD COLUMNS EXIST")
            logger.info("=" * 100)

            # Check which workload columns are missing
            required_workload_cols = ['utilization', 'workload_score', 'availability_score', 'capacity']
            missing = [col for col in required_workload_cols if col not in mysql_df.columns]

            if missing:
                logger.warning(f"Missing workload columns: {missing}")
                logger.info("Attempting to calculate/add them...")

                # Try to calculate from raw data if available
                if 'total_estimate_hours' in mysql_df.columns and 'weekly_capacity_hours' in mysql_df.columns:
                    logger.info("✓ Found raw workload data, calculating metrics...")

                    # Calculate utilization_percentage
                    if 'utilization_percentage' not in mysql_df.columns:
                        mysql_df['utilization_percentage'] = (
                            mysql_df['total_estimate_hours'] /
                            mysql_df['weekly_capacity_hours'].replace(0, 1) * 100.0
                        ).fillna(50.0)

                    # Calculate workload_score (inverse of utilization)
                    if 'workload_score' not in mysql_df.columns:
                        mysql_df['workload_score'] = (
                            (100.0 - mysql_df['utilization_percentage']) / 100.0
                        ).clip(0.0, 1.0)

                    # Calculate utilization ratio
                    if 'utilization' not in mysql_df.columns:
                        mysql_df['utilization'] = mysql_df['utilization_percentage'] / 100.0

                    # Add capacity
                    if 'capacity' not in mysql_df.columns:
                        mysql_df['capacity'] = mysql_df['weekly_capacity_hours'].fillna(40.0)

                    logger.info("✓ Calculated workload metrics:")
                    logger.info(f"  - utilization: mean={mysql_df['utilization'].mean():.3f}")
                    logger.info(f"  - workload_score: mean={mysql_df['workload_score'].mean():.3f}")

                else:
                    logger.warning("✗ Cannot calculate - missing raw columns")
                    logger.info("Adding default values...")

                    if 'utilization' not in mysql_df.columns:
                        mysql_df['utilization'] = 0.5
                    if 'workload_score' not in mysql_df.columns:
                        mysql_df['workload_score'] = 0.5
                    if 'capacity' not in mysql_df.columns:
                        mysql_df['capacity'] = 40.0

                # Handle availability
                if 'availability_score' not in mysql_df.columns:
                    if 'availability_percentage' in mysql_df.columns:
                        mysql_df['availability_score'] = (
                            mysql_df['availability_percentage'] / 100.0
                        ).clip(0.0, 1.0)
                        mysql_df['availability'] = mysql_df['availability_score']
                        logger.info("✓ Calculated availability_score from availability_percentage")
                    else:
                        mysql_df['availability_score'] = 0.5
                        mysql_df['availability'] = 0.5
                        logger.info("Added default availability_score: 0.5")
            else:
                logger.info("✓ All required workload columns already exist")

            logger.info("=" * 100)

        # ========== CRITICAL: ABSOLUTE FINAL WORKLOAD COLUMN CHECK ==========
        # This MUST happen before returning mysql_df to ensure columns exist
        if not mysql_df.empty:
            logger.info("=" * 100)
            logger.info("🔥 CRITICAL FINAL CHECK: ENSURING WORKLOAD COLUMNS EXIST BEFORE RETURN 🔥")
            logger.info("=" * 100)
            
            required_workload_cols = {
                'utilization': 0.5,
                'workload_score': 0.5,
                'availability_score': 0.5,
                'availability': 0.5,
                'capacity': 40.0,
                'utilization_percentage': 50.0
            }
            
            missing_cols = []
            for col, default_val in required_workload_cols.items():
                if col not in mysql_df.columns:
                    missing_cols.append(col)
                    logger.warning(f"  ✗ {col}: MISSING - Adding default value {default_val}")
                    mysql_df[col] = default_val
                else:
                    non_null = mysql_df[col].notna().sum()
                    mean_val = mysql_df[col].mean() if non_null > 0 else 0
                    logger.info(f"  ✓ {col}: EXISTS - {non_null}/{len(mysql_df)} non-null, mean={mean_val:.3f}")
            
            if missing_cols:
                logger.warning(f"⚠️  Added {len(missing_cols)} missing workload columns with defaults: {missing_cols}")
            else:
                logger.info("✅ All required workload columns present!")
            
            logger.info("=" * 100)

        # ========== COMPREHENSIVE FINAL DATA VERIFICATION ==========
        if not mysql_df.empty:
            logger.info("=" * 100)
            logger.info("FINAL MYSQL DATA VERIFICATION")
            logger.info("=" * 100)
            logger.info(f"Total rows collected: {len(mysql_df)}")
            logger.info(f"Total columns: {len(mysql_df.columns)}")
            logger.info("")

            # Group columns by category
            workload_cols = [c for c in mysql_df.columns if any(x in c.lower() for x in ['utilization', 'workload', 'capacity', 'availability'])]
            skill_cols = [c for c in mysql_df.columns if 'skill' in c.lower()]
            user_cols = [c for c in mysql_df.columns if any(x in c.lower() for x in ['department', 'seniority', 'experience', 'performance'])]
            task_cols = [c for c in mysql_df.columns if any(x in c.lower() for x in ['task', 'priority', 'difficulty', 'estimated'])]

            logger.info(f"Column Categories:")
            logger.info(f"  - Workload columns ({len(workload_cols)}): {workload_cols}")
            logger.info(f"  - Skill columns ({len(skill_cols)}): {skill_cols}")
            logger.info(f"  - User columns ({len(user_cols)}): {user_cols}")
            logger.info(f"  - Task columns ({len(task_cols)}): {task_cols}")
            logger.info("")

            # Verify critical columns have DATA (not just exist)
            logger.info("Critical Columns Data Verification:")

            # 1. Workload data
            if 'utilization' in mysql_df.columns:
                non_zero = (mysql_df['utilization'] != 0).sum()
                logger.info(f"  ✓ utilization: {non_zero}/{len(mysql_df)} non-zero - Mean: {mysql_df['utilization'].mean():.3f}")
            else:
                logger.error(f"  ✗ utilization: STILL MISSING AFTER FIXES! This is a BUG!")

            if 'workload_score' in mysql_df.columns:
                non_default = (mysql_df['workload_score'] != 0.5).sum()
                logger.info(f"  ✓ workload_score: {non_default}/{len(mysql_df)} non-default - Mean: {mysql_df['workload_score'].mean():.3f}")
            else:
                logger.warning(f"  ✗ workload_score: MISSING (will use defaults)")

            # 2. Skills data
            if 'required_skills' in mysql_df.columns:
                non_empty = mysql_df['required_skills'].apply(lambda x: bool(x) if isinstance(x, list) else (bool(x) if isinstance(x, str) and x.strip() else False)).sum()
                logger.info(f"  ✓ required_skills: {non_empty}/{len(mysql_df)} have skills")
                if non_empty == 0:
                    logger.warning(f"    ⚠️  ALL tasks have EMPTY required_skills - skill matching will be 0!")
            else:
                logger.warning(f"  ✗ required_skills: MISSING")

            if 'user_skills' in mysql_df.columns:
                non_empty = mysql_df['user_skills'].apply(lambda x: bool(x) if isinstance(x, list) else (bool(x) if isinstance(x, str) and x.strip() else False)).sum()
                logger.info(f"  ✓ user_skills: {non_empty}/{len(mysql_df)} have skills")
                if non_empty == 0:
                    logger.warning(f"    ⚠️  ALL users have EMPTY user_skills - skill matching will be 0!")
            else:
                logger.warning(f"  ✗ user_skills: MISSING")

            # 3. User profile data
            if 'department_name' in mysql_df.columns:
                non_null = mysql_df['department_name'].notna().sum()
                logger.info(f"  ✓ department_name: {non_null}/{len(mysql_df)} non-null")
            else:
                logger.warning(f"  ✗ department_name: MISSING")

            if 'seniority_level' in mysql_df.columns:
                non_null = mysql_df['seniority_level'].notna().sum()
                logger.info(f"  ✓ seniority_level: {non_null}/{len(mysql_df)} non-null")
            else:
                logger.warning(f"  ✗ seniority_level: MISSING")

            if 'performance_score' in mysql_df.columns:
                non_null = mysql_df['performance_score'].notna().sum()
                logger.info(f"  ✓ performance_score: {non_null}/{len(mysql_df)} non-null - Mean: {mysql_df['performance_score'].mean():.3f}")
            else:
                logger.warning(f"  ✗ performance_score: MISSING")

            logger.info("")
            logger.info("Summary:")
            all_critical_present = all(col in mysql_df.columns for col in ['required_skills', 'user_skills', 'department_name', 'seniority_level'])
            if all_critical_present:
                logger.info("  ✅ All critical columns are present")
            else:
                logger.warning("  ⚠️  Some critical columns are missing - check logs above")

            logger.info("=" * 100)

            # Log seniority_level details
            if 'seniority_level' in mysql_df.columns:
                null_count = mysql_df['seniority_level'].isnull().sum()
                total = len(mysql_df)
                if null_count > 0:
                    logger.warning(f"seniority_level has {null_count}/{total} ({null_count/total*100:.1f}%) NULL values")
                    logger.info(f"  This happens when users don't have a position assigned")
                    logger.info(f"  These will be filled with default 'MID_LEVEL' during preprocessing")
                else:
                    logger.info(f"✓ seniority_level: all {total} values present")

            # Log actual_hours details
            if 'actual_hours' in mysql_df.columns:
                null_count = mysql_df['actual_hours'].isnull().sum()
                total = len(mysql_df)
                if null_count > 0:
                    logger.warning(f"actual_hours has {null_count}/{total} ({null_count/total*100:.1f}%) NULL values")
                    logger.info(f"  This is normal for incomplete/in-progress tasks")
                    logger.info(f"  Will use estimated_hours as fallback or neutral performance features")
                else:
                    logger.info(f"✓ actual_hours: all {total} values present")

            # Log assignment_date details
            if 'assigned_date' in mysql_df.columns:
                null_count = mysql_df['assigned_date'].isnull().sum()
                total = len(mysql_df)
                if null_count > 0:
                    logger.warning(f"assignment_date has {null_count}/{total} ({null_count/total*100:.1f}%) NULL values")
                    logger.info(f"  This happens when user_current_tasks data is not available")
                    logger.info(f"  Will use default time-based features (Tuesday, 9 AM)")
                else:
                    logger.info(f"✓ assignment_date: all {total} values present")

        return mysql_df
    
    def _collect_postgres_ml_data(self, months_back: int) -> pd.DataFrame:
        """
        Collect existing ML training data from PostgreSQL
        """
        logger.info("Collecting existing ML training data from PostgreSQL...")
        
        try:
            cutoff_date = datetime.now() - timedelta(days=30 * months_back)

            query = """
            SELECT * FROM comprehensive_training_data 
            WHERE created_at >= %(cutoff_date)s
            ORDER BY created_at DESC
            """

            postgres_df = pd.read_sql(query, self.postgres_engine, params={'cutoff_date': cutoff_date})

            logger.info(f"Collected {len(postgres_df)} existing ML records from PostgreSQL")
            return postgres_df

        except Exception as e:
            logger.info(f"No existing ML training data found in PostgreSQL: {e}")
            return pd.DataFrame()

    def _calculate_task_performance_metrics(self, task_df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate performance metrics based on new task extension and timing fields

        This calculates:
        1. Actual duration from assignment to completion
        2. Lateness (comparing completion time vs due date)
        3. Estimation accuracy (comparing actual vs original estimate)
        4. Extension impact metrics
        """
        if task_df.empty:
            return task_df

        logger.info("=" * 80)
        logger.info("CALCULATING TASK PERFORMANCE METRICS")
        logger.info("=" * 80)

        # 1. Calculate actual duration from assignment to completion
        if 'assigned_at' in task_df.columns and 'completed_at' in task_df.columns:
            logger.info("Calculating actual_duration_hours from assigned_at to completed_at...")

            # Convert to datetime
            assigned = pd.to_datetime(task_df['assigned_at'], errors='coerce')
            completed = pd.to_datetime(task_df['completed_at'], errors='coerce')

            # Calculate duration in hours
            task_df['actual_duration_hours'] = (
                (completed - assigned).dt.total_seconds() / 3600
            ).fillna(0)

            # Count how many tasks have valid duration
            valid_duration = (task_df['actual_duration_hours'] > 0).sum()
            logger.info(f"  ✓ Calculated actual_duration_hours for {valid_duration}/{len(task_df)} tasks")

            if valid_duration > 0:
                logger.info(f"    Mean duration: {task_df[task_df['actual_duration_hours'] > 0]['actual_duration_hours'].mean():.2f} hours")
        else:
            logger.warning("  ✗ Cannot calculate actual_duration_hours - missing assigned_at or completed_at")
            task_df['actual_duration_hours'] = 0

        # 2. Calculate lateness (on-time vs late)
        if 'completed_at' in task_df.columns and 'due_date' in task_df.columns:
            logger.info("Calculating lateness metrics...")

            completed = pd.to_datetime(task_df['completed_at'], errors='coerce')
            due = pd.to_datetime(task_df['due_date'], errors='coerce')

            # Hours late (positive = late, negative = early)
            task_df['lateness_hours'] = (
                (completed - due).dt.total_seconds() / 3600
            ).fillna(0)

            # Binary late flag
            task_df['is_late'] = (task_df['lateness_hours'] > 0).astype(int)

            # Count late tasks
            late_tasks = task_df['is_late'].sum()
            completed_tasks = task_df['completed_at'].notna().sum()
            logger.info(f"  ✓ Late tasks: {late_tasks}/{completed_tasks} ({late_tasks/max(completed_tasks, 1)*100:.1f}%)")

            # Lateness penalty (for performance scoring)
            # Max 50% penalty for severely late tasks
            task_df['lateness_penalty'] = task_df['lateness_hours'].apply(
                lambda x: min(abs(x) * 0.01, 0.5) if x > 0 else 0
            )

            if late_tasks > 0:
                avg_lateness = task_df[task_df['is_late'] == 1]['lateness_hours'].mean()
                logger.info(f"    Average lateness: {avg_lateness:.2f} hours")
                logger.info(f"    Average penalty: {task_df[task_df['is_late'] == 1]['lateness_penalty'].mean():.3f}")
        else:
            logger.warning("  ✗ Cannot calculate lateness - missing completed_at or due_date")
            task_df['lateness_hours'] = 0
            task_df['is_late'] = 0
            task_df['lateness_penalty'] = 0.0

        # 3. Calculate estimation accuracy
        if 'original_estimated_hours' in task_df.columns and 'actual_hours' in task_df.columns:
            logger.info("Calculating estimation accuracy...")

            # Accuracy ratio (1.0 = perfect, <1 = overestimate, >1 = underestimate)
            task_df['estimation_accuracy'] = (
                task_df['original_estimated_hours'] /
                task_df['actual_hours'].replace(0, np.nan)
            ).clip(0, 2).fillna(1.0)  # Cap at 200%

            # Error in hours (negative = overestimate, positive = underestimate)
            task_df['estimation_error_hours'] = (
                task_df['actual_hours'] - task_df['original_estimated_hours']
            ).fillna(0)

            # Calculate stats for completed tasks
            completed_mask = task_df['actual_hours'] > 0
            if completed_mask.sum() > 0:
                avg_accuracy = task_df[completed_mask]['estimation_accuracy'].mean()
                avg_error = task_df[completed_mask]['estimation_error_hours'].mean()
                logger.info(f"  ✓ Average estimation accuracy: {avg_accuracy:.2f}")
                logger.info(f"    Average error: {avg_error:+.2f} hours")
        else:
            logger.warning("  ✗ Cannot calculate estimation accuracy - missing original_estimated_hours or actual_hours")
            task_df['estimation_accuracy'] = 1.0
            task_df['estimation_error_hours'] = 0

        # 4. Calculate extension impact
        if 'total_extension_hours' in task_df.columns and 'original_estimated_hours' in task_df.columns:
            logger.info("Calculating extension impact...")

            task_df['extension_percentage'] = (
                task_df['total_extension_hours'] /
                task_df['original_estimated_hours'].replace(0, np.nan) * 100
            ).fillna(0)

            tasks_with_extensions = (task_df['total_extension_hours'] > 0).sum()
            if tasks_with_extensions > 0:
                avg_extension = task_df[task_df['total_extension_hours'] > 0]['extension_percentage'].mean()
                logger.info(f"  ✓ Tasks with extensions: {tasks_with_extensions}/{len(task_df)}")
                logger.info(f"    Average extension: {avg_extension:.1f}% of original estimate")
        else:
            logger.warning("  ✗ Cannot calculate extension impact - missing extension fields")
            task_df['extension_percentage'] = 0

        # 5. Check if estimate changed significantly due to extensions
        if 'original_estimated_hours' in task_df.columns and 'estimated_hours' in task_df.columns:
            task_df['estimate_increased'] = (
                task_df['estimated_hours'] > task_df['original_estimated_hours']
            ).astype(int)

            increased_count = task_df['estimate_increased'].sum()
            if increased_count > 0:
                logger.info(f"  ✓ Tasks with increased estimates: {increased_count}/{len(task_df)}")
        else:
            task_df['estimate_increased'] = 0

        # 6. Calculate time efficiency and variance (time-based features)
        if 'actual_hours' in task_df.columns and 'estimated_hours' in task_df.columns:
            logger.info("Calculating time efficiency and variance...")
            
            # Time efficiency (1.0 = on time, <1 = faster than estimate, >1 = slower)
            task_df['time_efficiency'] = np.where(
                task_df['actual_hours'] > 0,
                task_df['estimated_hours'] / task_df['actual_hours'],
                1.0
            ).clip(0.5, 2.0)  # Clip to reasonable range [0.5, 2.0]
            
            # Time variance (absolute difference between actual and estimated)
            task_df['time_variance'] = np.abs(
                task_df['actual_hours'] - task_df['estimated_hours']
            ).fillna(0)
            
            # Log statistics
            valid_mask = task_df['actual_hours'] > 0
            if valid_mask.sum() > 0:
                avg_efficiency = task_df[valid_mask]['time_efficiency'].mean()
                avg_variance = task_df[valid_mask]['time_variance'].mean()
                logger.info(f"  ✓ Average time efficiency: {avg_efficiency:.2f}")
                logger.info(f"    Average time variance: {avg_variance:.2f} hours")
        else:
            logger.warning("  ✗ Cannot calculate time efficiency - missing actual_hours or estimated_hours")
            task_df['time_efficiency'] = 1.0
            task_df['time_variance'] = 0.0

        logger.info("=" * 80)
        logger.info("✅ Performance metrics calculation complete")
        logger.info("=" * 80)

        return task_df

    def _derive_task_difficulty(self, task_df: pd.DataFrame) -> pd.DataFrame:
        """
        Derive task difficulty from priority and estimated_hours since difficulty 
        column doesn't exist in Task entity.
        
        Difficulty mapping:
        - LOW: Low priority OR short tasks (<5 hours)
        - MEDIUM: Medium priority AND moderate duration (5-20 hours)
        - HIGH: High/Critical priority OR long tasks (>20 hours)
        """
        if task_df.empty:
            return task_df
        
        logger.info("=" * 80)
        logger.info("DERIVING TASK DIFFICULTY FROM PRIORITY + ESTIMATED_HOURS")
        logger.info("=" * 80)
        
        def calculate_difficulty(row):
            priority = row.get('priority', 'MEDIUM')
            estimated_hours = row.get('estimated_hours', 10)
            
            # Handle None/NaN values
            if pd.isna(estimated_hours):
                estimated_hours = 10
            if pd.isna(priority):
                priority = 'MEDIUM'
            
            # Difficulty logic
            if priority in ['CRITICAL', 'HIGH'] or estimated_hours > 20:
                return 'HIGH'
            elif priority == 'LOW' or estimated_hours < 5:
                return 'LOW'
            else:
                return 'MEDIUM'
        
        task_df['difficulty'] = task_df.apply(calculate_difficulty, axis=1)
        
        # Log distribution
        difficulty_counts = task_df['difficulty'].value_counts()
        logger.info("Difficulty distribution:")
        for diff, count in difficulty_counts.items():
            logger.info(f"  {diff}: {count} ({count/len(task_df)*100:.1f}%)")
        
        logger.info("=" * 80)
        
        return task_df

    def _add_derived_performance_metrics(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate derived performance metrics from existing columns.
        
        This adds metrics that don't exist directly in the database but can be 
        calculated from available data:
        - task_success_rate: From Neo4j's averageTaskCompletionRate
        - average_task_time: From user's task history
        """
        if df.empty:
            return df
        
        logger.info("=" * 80)
        logger.info("ADDING DERIVED PERFORMANCE METRICS")
        logger.info("=" * 80)
        
        # 1. Task success rate from Neo4j averageTaskCompletionRate
        if 'averageTaskCompletionRate' in df.columns:
            df['task_success_rate'] = df['averageTaskCompletionRate']
            avg_rate = df['task_success_rate'].mean()
            logger.info(f"  ✓ task_success_rate from averageTaskCompletionRate: {avg_rate:.3f}")
        elif 'avg_completion_rate' in df.columns:
            # Fallback to avg_completion_rate alias
            df['task_success_rate'] = df['avg_completion_rate']
            avg_rate = df['task_success_rate'].mean()
            logger.info(f"  ✓ task_success_rate from avg_completion_rate: {avg_rate:.3f}")
        else:
            df['task_success_rate'] = 0.8  # Default
            logger.warning("  ⚠ task_success_rate: Using default 0.8 (averageTaskCompletionRate not found)")
        
        # 2. Average task time from user history
        if 'totalTasksCompleted' in df.columns and 'total_actual_hours' in df.columns:
            df['average_task_time'] = np.where(
                df['totalTasksCompleted'] > 0,
                df['total_actual_hours'] / df['totalTasksCompleted'],
                25.0  # Default average
            )
            avg_time = df[df['totalTasksCompleted'] > 0]['average_task_time'].mean()
            logger.info(f"  ✓ average_task_time calculated from history: {avg_time:.2f} hours")
        else:
            df['average_task_time'] = 25.0  # Default
            logger.warning("  ⚠ average_task_time: Using default 25.0 hours")
        
        logger.info("=" * 80)
        
        return df

    def _merge_multi_db_data(self, neo4j_df: pd.DataFrame, mongodb_df: pd.DataFrame,
                           mysql_df: pd.DataFrame, postgres_df: pd.DataFrame) -> pd.DataFrame:
        """
        Merge data from all databases into comprehensive training dataset
        """
        logger.info("Merging multi-database data...")

        # Debug data sizes
        logger.info(f"Data sizes before merging - MySQL: {len(mysql_df)}, Neo4j: {len(neo4j_df)}, MongoDB: {len(mongodb_df)}, PostgreSQL: {len(postgres_df)}")

        # Use any available data as base, prioritizing MySQL over Neo4j since MySQL has actual data
        if not mysql_df.empty:
            logger.info("=" * 100)
            logger.info("USING MYSQL DATA AS BASE - VERIFYING WORKLOAD COLUMNS")
            logger.info("=" * 100)
            
            # CRITICAL: Log what's in mysql_df BEFORE copy
            logger.info(f"MySQL columns BEFORE copy ({len(mysql_df.columns)} total):")
            workload_check_before = ['utilization', 'workload_score', 'availability_score', 'capacity', 'availability']
            for col in workload_check_before:
                if col in mysql_df.columns:
                    logger.info(f"  ✓ {col}: EXISTS in mysql_df - mean={mysql_df[col].mean():.3f}")
                else:
                    logger.error(f"  ✗ {col}: MISSING from mysql_df (should have been added earlier!)")
            
            comprehensive_df = mysql_df.copy()
            logger.info(f"Using MySQL data as base for merging - {len(comprehensive_df)} records")

            # ===== CRITICAL: Ensure workload columns are preserved =====
            logger.info("\nChecking if workload columns were preserved AFTER copy...")
            workload_check = ['utilization', 'workload_score', 'availability_score', 'capacity']
            preserved = [col for col in workload_check if col in comprehensive_df.columns]
            missing = [col for col in workload_check if col not in comprehensive_df.columns]

            if preserved:
                logger.info(f"✓ Preserved workload columns: {preserved}")
                for col in preserved:
                    logger.info(f"   - {col}: mean={comprehensive_df[col].mean():.3f}")
            if missing:
                logger.error(f"✗ Missing workload columns after copy: {missing}")
                logger.error("This should NEVER happen if mysql_df was properly prepared!")
                logger.info("Attempting to add them now...")

                # Try to calculate from raw columns
                if 'total_estimate_hours' in comprehensive_df.columns and 'weekly_capacity_hours' in comprehensive_df.columns:
                    logger.info("Found raw data, calculating workload metrics...")

                    if 'utilization_percentage' not in comprehensive_df.columns:
                        comprehensive_df['utilization_percentage'] = (
                            comprehensive_df['total_estimate_hours'] /
                            comprehensive_df['weekly_capacity_hours'].replace(0, 1) * 100.0
                        ).fillna(50.0)

                    if 'workload_score' not in comprehensive_df.columns:
                        comprehensive_df['workload_score'] = (
                            (100.0 - comprehensive_df['utilization_percentage']) / 100.0
                        ).clip(0.0, 1.0)

                    if 'utilization' not in comprehensive_df.columns:
                        comprehensive_df['utilization'] = comprehensive_df['utilization_percentage'] / 100.0

                    if 'capacity' not in comprehensive_df.columns:
                        comprehensive_df['capacity'] = comprehensive_df['weekly_capacity_hours'].fillna(40.0)

                    if 'availability_score' not in comprehensive_df.columns:
                        if 'availability_percentage' in comprehensive_df.columns:
                            comprehensive_df['availability_score'] = (comprehensive_df['availability_percentage'] / 100.0).clip(0.0, 1.0)
                            comprehensive_df['availability'] = comprehensive_df['availability_score']
                        else:
                            comprehensive_df['availability_score'] = 0.5
                            comprehensive_df['availability'] = 0.5

                    logger.info("✓ Calculated missing workload columns")
                    logger.info(f"  - utilization: mean={comprehensive_df['utilization'].mean():.3f}")
                    logger.info(f"  - workload_score: mean={comprehensive_df['workload_score'].mean():.3f}")
                else:
                    logger.error("✗ Cannot calculate - missing total_estimate_hours or weekly_capacity_hours")
                    logger.error("Adding defaults to prevent training crash...")
                    if 'utilization' not in comprehensive_df.columns:
                        comprehensive_df['utilization'] = 0.5
                    if 'workload_score' not in comprehensive_df.columns:
                        comprehensive_df['workload_score'] = 0.5
                    if 'availability_score' not in comprehensive_df.columns:
                        comprehensive_df['availability_score'] = 0.5
                    if 'capacity' not in comprehensive_df.columns:
                        comprehensive_df['capacity'] = 40.0
        elif not neo4j_df.empty:
            comprehensive_df = neo4j_df.copy()
            logger.info(f"Using Neo4j data as base for merging - {len(comprehensive_df)} records")
        elif not mongodb_df.empty:
            comprehensive_df = mongodb_df.copy()
            logger.info(f"Using MongoDB data as base for merging - {len(comprehensive_df)} records")
        elif not postgres_df.empty:
            comprehensive_df = postgres_df.copy()
            logger.info(f"Using PostgreSQL data as base for merging - {len(comprehensive_df)} records")
        else:
            logger.warning("No real data available from any database")
            return pd.DataFrame()

        # Add MongoDB profile/workload data only if we started with a different base
        if not mongodb_df.empty and not mysql_df.empty and 'userId' in mongodb_df.columns:
            logger.info(f"Attempting to merge MongoDB data ({len(mongodb_df)} records)")
            merge_key_left = 'user_id' if 'user_id' in comprehensive_df.columns else 'assigned_to'
            if merge_key_left in comprehensive_df.columns:
                before_merge = len(comprehensive_df)
                comprehensive_df = comprehensive_df.merge(
                    mongodb_df,
                    left_on=merge_key_left,
                    right_on='userId',
                    how='left',
                    suffixes=('', '_mongo')
                )
                logger.info(f"MongoDB merge: {before_merge} -> {len(comprehensive_df)} records")

        # Skip merging MySQL with itself since it's already the base
        # This was causing the data explosion from 120 -> 6750 records
        logger.info("Skipping MySQL self-merge to prevent data duplication")

        # ===== FIXED: Don't filter out "duplicate" records from PostgreSQL =====
        # The old logic was filtering out 3,487 → 78 records because it considered
        # existing PostgreSQL data as duplicates. We want to use ALL MySQL data for training!
        #
        # OLD CODE (REMOVED):
        # if not postgres_df.empty:
        #     existing_task_users = set(zip(postgres_df['task_id'], postgres_df['user_id']))
        #     new_mask = ~comprehensive_df[['task_id', 'user_id']].apply(...)
        #     comprehensive_df = comprehensive_df[new_mask]  # This filtered 3,487 → 78!

        logger.info(f"✓ Using all {len(comprehensive_df)} MySQL records for training (no PostgreSQL filtering)")

        # Prevent excessive data size from merge operations (increased limit)
        if len(comprehensive_df) > 5000:
            logger.warning(f"Comprehensive data size is very large ({len(comprehensive_df)} records). Limiting to 5000 records.")
            # Take a random sample to avoid bias
            comprehensive_df = comprehensive_df.sample(n=5000, random_state=42)
        else:
            logger.info(f"Data size ({len(comprehensive_df)} records) is reasonable, using all data")

        # Add metadata columns
        comprehensive_df['created_at'] = datetime.now()
        comprehensive_df['data_source'] = 'multi_db_collection'

        # ========== PERFORMANCE SCORE HANDLING ==========
        # Performance score comes from MySQL identity database only
        # If not available, use default value
        if 'performance_score' not in comprehensive_df.columns:
            logger.warning("No performance_score from MySQL, using default value of 0.75")
            comprehensive_df['performance_score'] = 0.75
        else:
            # Fill any NULL values with default
            null_count = comprehensive_df['performance_score'].isna().sum()
            if null_count > 0:
                logger.info(f"Filling {null_count} NULL performance_scores with default 0.75")
                comprehensive_df['performance_score'] = comprehensive_df['performance_score'].fillna(0.75)
            logger.info(f"Using MySQL performance_score ({comprehensive_df['performance_score'].notna().sum()} records)")

        logger.info(f"Merged data resulting in {len(comprehensive_df)} comprehensive records")

        # ===== FINAL MANDATORY CHECK: Ensure workload columns MUST exist =====
        logger.info("=" * 100)
        logger.info("FINAL WORKLOAD COLUMN CHECK BEFORE RETURNING")
        logger.info("=" * 100)

        required_cols = ['utilization', 'workload_score', 'availability_score', 'capacity']
        missing_final = [col for col in required_cols if col not in comprehensive_df.columns]

        if missing_final:
            logger.error(f"⚠️  CRITICAL: Still missing workload columns: {missing_final}")
            logger.error("This should NEVER happen! Adding emergency defaults...")

            # Emergency defaults to prevent crash
            for col in missing_final:
                if col == 'utilization':
                    comprehensive_df['utilization'] = 0.5
                elif col == 'workload_score':
                    comprehensive_df['workload_score'] = 0.5
                elif col == 'availability_score':
                    comprehensive_df['availability_score'] = 0.5
                elif col == 'capacity':
                    comprehensive_df['capacity'] = 40.0

            logger.error("✓ Added emergency defaults - but you should investigate why columns are missing!")
        else:
            logger.info("✅ All required workload columns present")
            logger.info(f"  - utilization: mean={comprehensive_df['utilization'].mean():.3f}")
            logger.info(f"  - workload_score: mean={comprehensive_df['workload_score'].mean():.3f}")
            logger.info(f"  - availability_score: mean={comprehensive_df['availability_score'].mean():.3f}")
            logger.info(f"  - capacity: mean={comprehensive_df['capacity'].mean():.1f}")

        logger.info("=" * 100)

        return comprehensive_df
    
    def _calculate_performance_score(self, df: pd.DataFrame) -> pd.Series:
        """
        DEPRECATED: Calculate task-based performance score from task completion metrics.

        NOTE: This method is no longer used. Performance scores come directly from
        MySQL identity database (users.performance_score field).

        This method is kept for backward compatibility but should not be called.
        The authoritative performance_score is stored in MySQL identity database.
        """
        performance_scores = []
        
        for _, row in df.iterrows():
            score = 0.5  # Default neutral score
            
            # Time-based performance
            if pd.notna(row.get('actual_hours')) and pd.notna(row.get('estimated_hours')):
                actual_hours = row['actual_hours']
                estimated_hours = row['estimated_hours']
                
                if actual_hours <= estimated_hours * 1.1:  # Within 10% of estimate
                    score += 0.3
                elif actual_hours <= estimated_hours * 1.3:  # Within 30% of estimate
                    score += 0.2
                elif actual_hours <= estimated_hours * 1.5:  # Within 50% of estimate
                    score += 0.1
                else:  # Over 50% of estimate
                    score -= 0.1
            
            # Completion-based performance
            if row.get('task_status') == 'DONE':
                score += 0.3
            elif row.get('task_status') == 'IN_PROGRESS':
                score += 0.1
            elif row.get('task_status') == 'CANCELLED':
                score -= 0.2
            
            # Priority handling performance
            priority = row.get('priority', '').upper()
            # ✅ Use URGENT instead of CRITICAL to match actual system
            if priority == 'HIGH' or priority == 'URGENT':
                # Bonus for completing high priority tasks
                if row.get('task_status') == 'DONE':
                    score += 0.2
            
            # Ensure score is between 0 and 1
            performance_scores.append(max(0, min(1, score)))
        
        return pd.Series(performance_scores)

    def _store_comprehensive_data(self, data: pd.DataFrame):
        """
        Store comprehensive training data in PostgreSQL
        """
        if data.empty:
            logger.warning("No data to store in PostgreSQL")
            return
        
        logger.info(f"Storing {len(data)} records in PostgreSQL...")
        
        # Only drop table if force_recreate flag is set or schema has changed
        # For normal training runs, use CREATE IF NOT EXISTS to preserve existing data

        create_table_query = """
        CREATE TABLE IF NOT EXISTS comprehensive_training_data (
            id SERIAL PRIMARY KEY,
            task_id VARCHAR(255),
            user_id VARCHAR(255),
            task_title TEXT,
            task_description TEXT,
            priority VARCHAR(50),
            difficulty VARCHAR(50),
            estimated_hours FLOAT,
            actual_hours FLOAT,
            task_status VARCHAR(50),
            task_type VARCHAR(100),
            project_id VARCHAR(255),
            assigned_to VARCHAR(255),
            assignee_id VARCHAR(255),
            reporter_id VARCHAR(255),
            progress_percentage FLOAT,
            due_date TIMESTAMP,
            started_at TIMESTAMP,
            updated_at TIMESTAMP,
            email VARCHAR(255),
            first_name VARCHAR(255),
            last_name VARCHAR(255),
            username VARCHAR(255),
            phone_number VARCHAR(255),
            performance_score FLOAT,
            department_id VARCHAR(255),
            position_id VARCHAR(255),
            role_id VARCHAR(255),
            project_name VARCHAR(255),
            project_description TEXT,
            project_status VARCHAR(50),
            project_member_id VARCHAR(255),
            project_role VARCHAR(100),
            assignment_date TIMESTAMP,
            completed_at TIMESTAMP,
            required_skills TEXT[],
            user_skills TEXT[],
            user_skill_levels TEXT[],
            department_name VARCHAR(255),
            seniority_level VARCHAR(50),
            years_experience FLOAT,
            utilization FLOAT,
            capacity FLOAT,
            confidence_score FLOAT,
            recommendation_type VARCHAR(100),
            predicted_performance FLOAT,
            actual_performance FLOAT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            data_source VARCHAR(100)
        );
        
        CREATE INDEX IF NOT EXISTS idx_comprehensive_task_user 
        ON comprehensive_training_data(task_id, user_id);
        
        CREATE INDEX IF NOT EXISTS idx_comprehensive_created_at 
        ON comprehensive_training_data(created_at);
        """
        
        with self.postgres_engine.connect() as connection:
            # Create table if it doesn't exist (preserves existing data)
            connection.execute(text(create_table_query))
            connection.commit()
            logger.info("Ensured comprehensive_training_data table exists with correct schema")

        # Store essential columns including all ML-critical fields
        # Using completed_at to match the source database schema
        essential_columns = [
            'task_id', 'user_id', 'task_title', 'task_description', 'priority',
            'difficulty', 'estimated_hours', 'actual_hours', 'task_status',
            'task_type', 'project_id', 'assigned_to', 'progress_percentage',
            'performance_score', 'required_skills', 'user_skills',
            'user_skill_levels', 'department_name', 'seniority_level',
            'years_experience', 'completed_at', 'created_at', 'data_source'
        ]

        # Select only columns that exist in the data
        available_columns = [col for col in essential_columns if col in data.columns]
        essential_data = data[available_columns].copy()

        # Add missing essential columns with default values
        for col in ['task_id', 'user_id', 'created_at', 'data_source']:
            if col not in essential_data.columns:
                if col == 'created_at':
                    essential_data[col] = datetime.now()
                elif col == 'data_source':
                    essential_data[col] = 'multi_db_collection'
                else:
                    essential_data[col] = None

        # Ensure list columns exist and are properly formatted for PostgreSQL
        list_columns = ['required_skills', 'user_skills', 'user_skill_levels']
        for col in list_columns:
            if col not in essential_data.columns:
                essential_data[col] = '{}'
            else:
                import numpy as np
                def to_postgres_array(x):
                    # Handle None directly
                    if x is None:
                        return '{}'
                    # If it's a numpy array or pandas Series, convert to list
                    if isinstance(x, (np.ndarray, pd.Series)):
                        try:
                            x = x.tolist()
                        except Exception:
                            return '{}'
                    # If it's an iterable collection (list/tuple/set)
                    if isinstance(x, (list, tuple, set)):
                        if len(x) == 0:
                            return '{}'
                        escaped_items = [str(item).replace('"', '\\"') for item in x]
                        return '{' + ','.join(f'"{itm}"' for itm in escaped_items) + '}'
                    # For scalars, check NA safely
                    try:
                        if pd.isna(x):
                            return '{}'
                    except Exception:
                        pass
                    # Single scalar -> array with one element
                    escaped = str(x).replace('"', '\\"')
                    return '{"' + escaped + '"}'
                # Normalize any lingering numpy arrays inside column before apply
                essential_data[col] = essential_data[col].apply(to_postgres_array)

        # Final safety: convert object dtypes (that are not array strings already) to str
        for col in essential_data.columns:
            if essential_data[col].dtype == 'object' and col not in list_columns:
                essential_data[col] = essential_data[col].apply(lambda v: None if v is None or (isinstance(v, float) and pd.isna(v)) else str(v))

        # Store data in smaller batches to avoid parameter limits
        batch_size = 50  # Reduced batch size
        total_batches = (len(essential_data) + batch_size - 1) // batch_size

        logger.info(f"Storing data in {total_batches} batches of {batch_size} records each")

        # Debug: Check data types before storage
        logger.info(f"Data types before storage:\n{essential_data.dtypes}")

        # Verify no columns contain list objects
        for col in essential_data.columns:
            sample_value = essential_data[col].iloc[0] if len(essential_data) > 0 else None
            if isinstance(sample_value, (list, tuple, set)):
                logger.warning(f"Column '{col}' still contains list objects: {sample_value}")

        for i in range(0, len(essential_data), batch_size):
            batch_num = (i // batch_size) + 1
            batch = essential_data.iloc[i:i+batch_size]

            try:
                batch.to_sql(
                    'comprehensive_training_data',
                    self.postgres_engine,
                    if_exists='append',
                    index=False,
                    method='multi'
                )
                logger.info(f"Successfully stored batch {batch_num}/{total_batches} ({len(batch)} records)")
            except Exception as e:
                import traceback
                logger.error(f"Failed to store batch {batch_num}/{total_batches}: {e}")
                logger.error(f"Traceback: {traceback.format_exc()}")
                logger.error(f"Batch columns: {batch.columns.tolist()}")
                logger.error(f"Batch dtypes: {batch.dtypes.to_dict()}")
                # Log first row for debugging
                if len(batch) > 0:
                    first_row = batch.iloc[0].to_dict()
                    logger.error(f"First row sample: {first_row}")
                raise  # Re-raise to see full error in training script

        logger.info("Successfully stored comprehensive training data in PostgreSQL")
    
    def verify_performance_scores(self) -> pd.DataFrame:
        """
        Verify performance scores between identity database and training data.
        This helps identify discrepancies that might cause incorrect recommendations.

        Returns:
            DataFrame with columns: user_id, identity_db_score, training_data_score, difference, match_status
        """
        logger.info("=" * 100)
        logger.info("VERIFYING PERFORMANCE SCORES: Identity DB vs Training Data")
        logger.info("=" * 100)

        results = []

        # Step 1: Get performance scores from Identity Database (MySQL)
        identity_scores = {}
        if 'identity' in self.mysql_connections:
            connection = self.mysql_connections['identity']
            cursor = connection.cursor(dictionary=True)

            # Determine table name
            table_name = None
            if self._check_table_exists(connection, 'users'):
                table_name = 'users'
            elif self._check_table_exists(connection, 'user'):
                table_name = 'user'

            if table_name:
                query = f"""
                SELECT 
                    id as user_id,
                    CONCAT(first_name, ' ', last_name) as user_name,
                    email,
                    performance_score
                FROM {table_name}
                WHERE performance_score IS NOT NULL
                ORDER BY email
                """

                cursor.execute(query)
                records = cursor.fetchall()

                logger.info(f"✅ Retrieved {len(records)} users with performance_score from Identity DB")
                logger.info("")

                for record in records:
                    user_id = record['user_id']
                    identity_scores[user_id] = {
                        'user_id': user_id,
                        'user_name': record['user_name'],
                        'email': record['email'],
                        'identity_score': record['performance_score']
                    }

                cursor.close()
            else:
                logger.error("Could not find users table in identity database")
                return pd.DataFrame()
        else:
            logger.error("Identity database connection not available")
            return pd.DataFrame()

        # Step 2: Get performance scores from Training Data (PostgreSQL)
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

            training_df = pd.read_sql(query, self.postgres_engine)

            # Get most recent performance score for each user
            training_scores = training_df.groupby('user_id').first().reset_index()

            logger.info(f"✅ Retrieved {len(training_scores)} users with performance_score from Training Data")
            logger.info("")

        except Exception as e:
            logger.warning(f"Could not fetch training data: {e}")
            training_scores = pd.DataFrame()

        # Step 3: Compare scores
        logger.info("=" * 140)
        logger.info("PERFORMANCE SCORE COMPARISON")
        logger.info("=" * 140)
        logger.info(f"{'User ID':<38} {'User Name':<25} {'Identity DB':<15} {'Training Data':<15} {'Difference':<12} {'Status':<10}")
        logger.info("-" * 140)

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

            # Normalize identity score (from 0-100 to 0-1 for comparison)
            normalized_identity = identity_score / 100.0 if identity_score is not None else None

            # Calculate difference
            if normalized_identity is not None and training_score is not None:
                diff = abs(normalized_identity - training_score)
                if diff < 0.001:  # Essentially equal (accounting for floating point)
                    status = "✅ MATCH"
                    match_count += 1
                else:
                    status = "❌ MISMATCH"
                    mismatch_count += 1
            elif training_score is None:
                diff = None
                status = "⚠️  NO TRAIN"
                missing_in_training += 1
            else:
                diff = None
                status = "⚠️  NO ID"

            # Format scores for display
            id_score_str = f"{identity_score:.2f}" if identity_score is not None else "NULL"
            train_score_str = f"{training_score:.4f}" if training_score is not None else "NULL"
            diff_str = f"{diff:.4f}" if diff is not None else "N/A"

            logger.info(f"{user_id:<38} {user_name[:24]:<25} {id_score_str:<15} {train_score_str:<15} {diff_str:<12} {status:<10}")

            # Store result
            results.append({
                'user_id': user_id,
                'user_name': user_name,
                'email': email,
                'identity_db_score': identity_score,
                'identity_db_normalized': normalized_identity,
                'training_data_score': training_score,
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
            logger.info(f"   Identity DB Score (raw):       {problem_user['identity_db_score']}")
            logger.info(f"   Identity DB Score (normalized): {problem_user['identity_db_normalized']:.4f}")
            logger.info(f"   Training Data Score:           {problem_user['training_data_score']}")
            logger.info(f"   Status: {problem_user['status']}")
            logger.info("")
            logger.info(f"   ⚠️  Expected in logs: 0.8344 (83.44/100)")
            logger.info(f"   ❌ Actually showing: 0.2000")
            logger.info(f"   ➡️  This suggests the recommendation system is NOT using either database!")
            logger.info("")

        return pd.DataFrame(results)

    def close_connections(self):
        """Close all database connections"""
        try:
            if hasattr(self, 'neo4j_driver'):
                self.neo4j_driver.close()

            if hasattr(self, 'mongo_client'):
                self.mongo_client.close()

            # Close all MySQL connections
            if hasattr(self, 'mysql_connections'):
                for db_name, connection in self.mysql_connections.items():
                    try:
                        connection.close()
                        logger.info(f"Closed MySQL connection to {db_name}")
                    except Exception as e:
                        logger.error(f"Error closing MySQL connection to {db_name}: {e}")

            # Close legacy single connection if exists
            if hasattr(self, 'mysql_connection'):
                self.mysql_connection.close()

            if hasattr(self, 'postgres_engine'):
                self.postgres_engine.dispose()

            logger.info("Closed all database connections")
        except Exception as e:
            logger.error(f"Error closing database connections: {e}")


class SyntheticDataGenerator:
    """
    Generate synthetic training data for initial model training
    """

    def __init__(self, config_path: str = "config/model_config.yaml"):
        # If config_path is relative, make it relative to the project root
        if not os.path.isabs(config_path):
            # Get the directory where this file is located
            current_file = Path(__file__).resolve()
            # Navigate to project root (ml-training-python/)
            project_root = current_file.parent.parent.parent
            config_path = project_root / config_path

        with open(config_path, 'r') as file:
            self.config = yaml.safe_load(file)

        self.synthetic_config = self.config['data_collection']['synthetic_data']

    def generate_comprehensive_dataset(self) -> pd.DataFrame:
        """
        Generate a comprehensive synthetic dataset for training
        """
        logger.info("Generating comprehensive synthetic dataset...")

        num_records = self.synthetic_config.get('num_records', 1000)

        # Generate synthetic task-user interactions
        interactions = self._generate_task_user_interactions(num_records)

        df = pd.DataFrame(interactions)

        logger.info(f"Generated synthetic dataset with {len(df)} records")
        return df

    def _generate_task_user_interactions(self, num_records: int) -> list:
        """Generate synthetic task-user assignment interactions"""
        interactions_data = []

        # Sample skills and priorities
        skills = ['python', 'java', 'javascript', 'react', 'angular', 'vue', 'docker',
                 'kubernetes', 'aws', 'azure', 'machine learning', 'data science']
        priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
        difficulties = ['EASY', 'MEDIUM', 'HARD']
        statuses = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']
        task_types = ['Feature Development', 'Bug Fix', 'Code Review', 'Testing', 'Deployment']

        for i in range(num_records):
            # Generate random task and user IDs
            task_id = f"task_{np.random.randint(1, 2000)}"
            user_id = f"user_{np.random.randint(1, 300)}"

            # Random task attributes
            priority = np.random.choice(priorities)
            difficulty = np.random.choice(difficulties)
            status = np.random.choice(statuses)
            task_type = np.random.choice(task_types)

            # Random skills (1-3 skills per task)
            num_skills = np.random.randint(1, 4)
            required_skills = list(np.random.choice(skills, num_skills, replace=False))
            user_skills = list(np.random.choice(skills, np.random.randint(2, 6), replace=False))

            # Time estimates
            estimated_hours = np.random.uniform(1, 40)
            actual_hours = estimated_hours * np.random.uniform(0.8, 1.5) if status == 'DONE' else None

            # Dates
            created_date = datetime.now() - timedelta(days=np.random.randint(1, 365))
            assignment_date = created_date + timedelta(hours=np.random.randint(1, 48))
            completed_at = assignment_date + timedelta(hours=actual_hours) if status == 'DONE' and actual_hours else None

            # Performance score (0-1 scale)
            performance_score = np.random.uniform(0.4, 1.0)

            # ===== CRITICAL: Calculate workload and availability metrics =====
            # Simulate realistic workload distribution
            weekly_capacity_hours = np.random.uniform(30, 45)  # 30-45 hours/week capacity
            total_estimate_hours = np.random.uniform(5, 50)   # 5-50 hours of assigned work
            
            # Calculate utilization percentage: (total_estimate_hours / weekly_capacity_hours) * 100
            utilization_percentage = (total_estimate_hours / weekly_capacity_hours) * 100.0
            
            # Calculate workload_score: inverse of utilization (0% util = 1.0 score, 100% util = 0.0 score)
            workload_score = ((100.0 - utilization_percentage) / 100.0)
            workload_score = max(0.0, min(1.0, workload_score))  # Clip to 0-1 range
            
            # Calculate utilization ratio (for ML features)
            utilization = utilization_percentage / 100.0
            
            # Calculate availability percentage (independent factor: sick leave, PTO, meetings, etc.)
            availability_percentage = np.random.uniform(70, 100)  # 70-100% available
            availability_score = availability_percentage / 100.0
            availability = availability_score
            
            # Capacity is the weekly capacity hours
            capacity = weekly_capacity_hours

            interaction_data = {
                'task_id': task_id,
                'user_id': user_id,
                'task_title': f"{task_type} - Task {i}",
                'priority': priority,
                'difficulty': difficulty,
                'estimated_hours': estimated_hours,
                'actual_hours': actual_hours,
                'task_status': status,
                'task_type': task_type,
                'required_skills': required_skills,
                'user_skills': user_skills,
                'user_skill_levels': ['INTERMEDIATE'] * len(user_skills),
                'performance_score': performance_score,
                'years_experience': np.random.uniform(0.5, 15),
                'department_name': np.random.choice([
                    'Backend Development',
                    'Frontend Development',
                    'Mobile Development',
                    'Quality Assurance',
                    'DevOps',
                    'Engineering'
                ]),
                'seniority_level': np.random.choice(['JUNIOR', 'MID_LEVEL', 'SENIOR', 'LEAD']),
                'assignment_date': assignment_date,
                'completed_at': completed_at,
                'created_at': datetime.now(),
                'data_source': 'synthetic',
                # ===== WORKLOAD & AVAILABILITY COLUMNS =====
                'weekly_capacity_hours': weekly_capacity_hours,
                'total_estimate_hours': total_estimate_hours,
                'utilization_percentage': utilization_percentage,
                'utilization': utilization,
                'workload_score': workload_score,
                'availability_percentage': availability_percentage,
                'availability_score': availability_score,
                'availability': availability,
                'capacity': capacity
            }

            interactions_data.append(interaction_data)

        return interactions_data


# Example usage and testing
if __name__ == "__main__":
    # Setup logging
    logging.basicConfig(level=logging.INFO)

    # Get project root directory
    current_file = Path(__file__).resolve()
    project_root = current_file.parent.parent.parent
    config_file = project_root / "config" / "model_config.yaml"

    print(f"Project root: {project_root}")
    print(f"Looking for config at: {config_file}")

    # Test synthetic data generation
    try:
        generator = SyntheticDataGenerator()
        synthetic_data = generator.generate_comprehensive_dataset()

        print(f"\n✅ Generated {len(synthetic_data)} synthetic records")
        print("\nSample synthetic data:")
        print(synthetic_data.head())
    except Exception as e:
        print(f"❌ Error generating synthetic data: {e}")
        import traceback
        traceback.print_exc()

    # Test multi-database collection (if config is available)
    if config_file.exists():
        try:
            print(f"\n✅ Config file found, testing database connection...")
            collector = MultiDatabaseDataCollector()
            print("✅ Database connections established successfully!")

            # Optionally test data collection (commented out to avoid long runtime)
            # comprehensive_data = collector.collect_comprehensive_training_data(months_back=3)
            # print(f"Collected {len(comprehensive_data)} real records")

            collector.close_connections()
        except Exception as e:
            print(f"❌ Could not test real data collection: {e}")
            import traceback
            traceback.print_exc()
    else:
        print(f"\n⚠️  Config file not found at: {config_file}")
        print("Skipping database connection test")

    print("\n✅ Data collection module ready for use!")
