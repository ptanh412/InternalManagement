"""
Multi-Database Data Collector for ML Training

This module collects training data from multiple databases:
- PostgreSQL: Main ML training data
- Neo4j: User profiles (profile-service)  
- MongoDB: AI predictions, chat, notifications, files (ai-service, chat-service, notification-service, file-service)
- MySQL: Task, project, identity, workload data (identity-service, task-service, project-service, workload-service)
"""

import pandas as pd
import numpy as np
import yaml
import logging
import os
from pathlib import Path
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
from neo4j import GraphDatabase
import pymongo
import mysql.connector
from typing import Dict, List, Optional, Tuple
import structlog

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
            
            # Create a connection for each MySQL database
            for db_name, db_info in mysql_config.get('databases', {}).items():
                try:
                    connection = mysql.connector.connect(
                        host=str(mysql_config['host']),
                        port=int(mysql_config['port']),
                        database=str(db_info['database']),
                        user=str(mysql_config['username']),
                        password=str(mysql_config['password'])
                    )
                    self.mysql_connections[db_name] = connection
                    logger.info(f"Connected to MySQL database: {db_name} ({db_info['database']})")
                except Exception as e:
                    logger.error(f"Failed to connect to MySQL database {db_name}: {e}")
            
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
        chat_df = pd.DataFrame(chat_data) if chat_data else pd.DataFrame()
        
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

                # Check if difficulty column exists
                has_difficulty = False
                has_completed_at = False
                try:
                    check_cursor = connection.cursor()
                    check_cursor.execute("DESCRIBE tasks")
                    columns = [col[0] for col in check_cursor.fetchall()]
                    has_difficulty = 'difficulty' in columns
                    has_completed_at = 'completed_at' in columns
                    check_cursor.close()
                except Exception:
                    pass

                # Build task query with required_skills and actual_hours from time logs
                difficulty_col = "t.difficulty," if has_difficulty else "'MEDIUM' as difficulty,"
                completed_at_col = "t.completed_at," if has_completed_at else "NULL as completed_at,"

                task_query = f"""
                SELECT 
                    t.id as task_id,
                    t.title as task_title,
                    t.description as task_description,
                    t.priority,
                    {difficulty_col}
                    t.estimated_hours,
                    t.actual_hours,
                    t.status as task_status,
                    t.created_at as task_created_date,
                    {completed_at_col}
                    t.due_date,
                    t.assigned_to,
                    t.progress_percentage,
                    t.type as task_type,
                    t.project_id,
                    t.reporter_id,
                    t.started_at,
                    t.updated_at,
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

                try:
                    task_cursor.execute(task_query, (cutoff_date,))
                    task_records = task_cursor.fetchall()
                    task_df = pd.DataFrame(task_records) if task_records else pd.DataFrame()

                    # Process required_skills from comma-separated string to list
                    if not task_df.empty and 'required_skills' in task_df.columns:
                        task_df['required_skills'] = task_df['required_skills'].apply(
                            lambda x: x.split(',') if x and x.strip() else []
                        )

                    # Keep completed_at as is - no renaming needed for consistency with source database

                    # If actual_hours is None or 0, try to use estimated_hours as fallback
                    if not task_df.empty and 'actual_hours' in task_df.columns:
                        # Fill None with estimated_hours where task is completed
                        if 'task_status' in task_df.columns and 'estimated_hours' in task_df.columns:
                            completed_mask = task_df['task_status'] == 'COMPLETED'
                            task_df.loc[completed_mask & task_df['actual_hours'].isna(), 'actual_hours'] = \
                                task_df.loc[completed_mask & task_df['actual_hours'].isna(), 'estimated_hours']

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

        # Note: workload data might be in task or project database
        # Check if workload table exists in any of the connected databases
        workload_table_found = False
        for db_name, connection in self.mysql_connections.items():
            try:
                # First check if table exists
                if not self._check_table_exists(connection, 'user_workloads'):
                    continue

                logger.info(f"Found user_workloads table in {db_name} database")
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

                    # Calculate utilization and capacity metrics for ML model
                    if not workload_df.empty:
                        # Calculate utilization (total hours / weekly capacity)
                        workload_df['utilization'] = (
                            workload_df['total_estimate_hours'] /
                            workload_df['weekly_capacity_hours']
                        ).fillna(0)

                        # Capacity is the weekly capacity hours
                        workload_df['capacity'] = workload_df['weekly_capacity_hours']

                        # Normalize availability percentage to 0-1 scale if needed
                        if 'availability_percentage' in workload_df.columns:
                            workload_df['availability'] = workload_df['availability_percentage'] / 100.0

                    logger.info(f"Collected {len(workload_df)} workload records from {db_name} database")
                    workload_cursor.close()
                    break  # Found workload data, no need to check other databases
                else:
                    logger.info(f"No workload records found in {db_name} database (table exists but empty)")
                workload_cursor.close()
            except Exception as e:
                # Table might not exist in this database, continue to next
                logger.debug(f"Could not query user_workloads in {db_name}: {e}")
                continue
        
        if not workload_table_found:
            logger.warning("user_workloads table not found in any MySQL database (task, identity, project)")
        elif workload_df.empty:
            logger.warning("user_workloads table exists but contains no data")

        # ========== Collect user_current_tasks for assigned_date ==========
        user_tasks_df = pd.DataFrame()
        user_tasks_found = False

        for db_name, connection in self.mysql_connections.items():
            try:
                if not self._check_table_exists(connection, 'user_current_tasks'):
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
                logger.info(f"Identity columns: {identity_df.columns.tolist()}")
                logger.info(f"Task columns before merge: {mysql_df.columns.tolist()}")

                mysql_df = mysql_df.merge(
                    identity_df,
                    left_on='assigned_to',  # Use correct column name from tasks
                    right_on='user_id',
                    how='left',
                    suffixes=('_task', '')  # Keep identity data without suffix
                )

                logger.info(f"Columns after identity merge: {mysql_df.columns.tolist()}")

            # Add workload data
            if not workload_df.empty:
                mysql_df = mysql_df.merge(
                    workload_df,
                    left_on='assigned_to',  # Use correct column name
                    right_on='user_id',
                    how='left',
                    suffixes=('', '_workload')
                )

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

        # Log final columns to verify we have all required fields
        if not mysql_df.empty:
            logger.info(f"Final MySQL columns: {mysql_df.columns.tolist()}")

            # Check for critical ML columns (optional columns excluded)
            # Note: actual_hours, completed_at, assigned_date are OPTIONAL
            # They only exist for completed/in-progress tasks, not for new predictions
            critical_cols = ['required_skills', 'user_skills', 'department_name',
                           'seniority_level', 'years_experience', 'difficulty']
            missing_cols = [col for col in critical_cols if col not in mysql_df.columns]
            if missing_cols:
                logger.warning(f"Missing critical ML columns: {missing_cols}")
            else:
                logger.info("✓ All critical ML columns present")

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
            comprehensive_df = mysql_df.copy()
            logger.info(f"Using MySQL data as base for merging - {len(comprehensive_df)} records")
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

        # Remove duplicates if merging with existing PostgreSQL data
        if not postgres_df.empty:
            # Keep only new records not in PostgreSQL
            existing_task_users = set(zip(postgres_df['task_id'], postgres_df['user_id']))
            new_mask = ~comprehensive_df[['task_id', 'user_id']].apply(
                lambda x: (x['task_id'], x['user_id']) in existing_task_users, axis=1
            )
            comprehensive_df = comprehensive_df[new_mask]
        
        # Prevent excessive data size from merge operations
        if len(comprehensive_df) > 1000:
            logger.warning(f"Comprehensive data size is very large ({len(comprehensive_df)} records). Limiting to 1000 records.")
            # Take a random sample to avoid bias
            comprehensive_df = comprehensive_df.sample(n=1000, random_state=42)

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
            if row.get('task_status') == 'COMPLETED':
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
                if row.get('task_status') == 'COMPLETED':
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
        statuses = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
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
            actual_hours = estimated_hours * np.random.uniform(0.8, 1.5) if status == 'COMPLETED' else None

            # Dates
            created_date = datetime.now() - timedelta(days=np.random.randint(1, 365))
            assignment_date = created_date + timedelta(hours=np.random.randint(1, 48))
            completed_at = assignment_date + timedelta(hours=actual_hours) if status == 'COMPLETED' and actual_hours else None

            # Performance score (0-1 scale)
            performance_score = np.random.uniform(0.4, 1.0)

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
                'data_source': 'synthetic'
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
