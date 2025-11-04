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
                f"postgresql://{postgres_config['username']}:{postgres_config['password']}"
                f"@{postgres_config['host']}:{postgres_config['port']}"
                f"/{postgres_config['database']}"
            )
            
            # Neo4j connection for profile service
            neo4j_config = self.db_config['neo4j']
            self.neo4j_driver = GraphDatabase.driver(
                neo4j_config['uri'],
                auth=(neo4j_config['username'], neo4j_config['password'])
            )
            
            # MongoDB connection for AI, chat, notification, file services  
            mongodb_config = self.db_config['mongodb']
            self.mongo_client = pymongo.MongoClient(mongodb_config['uri'])
            self.mongo_db = self.mongo_client[mongodb_config['database']]
            
            # MySQL connection for identity, task, project, workload services
            mysql_config = self.db_config['mysql']
            self.mysql_connection = mysql.connector.connect(
                host=mysql_config['host'],
                port=mysql_config['port'],
                database=mysql_config['database'],
                user=mysql_config['username'],
                password=mysql_config['password']
            )
            
            logger.info("Successfully connected to all databases")
            
        except Exception as e:
            logger.error(f"Failed to setup database connections: {e}")
            raise
    
    def collect_comprehensive_training_data(self, months_back: int = 12) -> pd.DataFrame:
        """
        Collect comprehensive training data from all services
        """
        logger.info(f"Starting comprehensive data collection for last {months_back} months")
        
        # Collect data from each database
        neo4j_data = self._collect_neo4j_data(months_back)
        mongodb_data = self._collect_mongodb_data(months_back)
        mysql_data = self._collect_mysql_data(months_back)
        postgres_data = self._collect_postgres_ml_data(months_back)
        
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
        
        cutoff_date = datetime.now() - timedelta(days=30 * months_back)
        
        cypher_query = """
        MATCH (u:User)
        WHERE u.createdDate >= $cutoff_date
        OPTIONAL MATCH (u)-[us:HAS_SKILL]->(s:Skill)
        OPTIONAL MATCH (u)-[:BELONGS_TO]->(d:Department)
        OPTIONAL MATCH (u)-[:HAS_ROLE]->(r:Role)
        RETURN 
            u.id as user_id,
            u.email as user_email,
            u.firstName as first_name,
            u.lastName as last_name,
            u.createdDate as created_date,
            u.lastLoginDate as last_login_date,
            u.yearsExperience as years_experience,
            u.seniorityLevel as seniority_level,
            d.name as department_name,
            r.name as role_name,
            collect(DISTINCT s.name) as skills,
            collect(DISTINCT us.proficiencyLevel) as skill_levels,
            collect(DISTINCT us.yearsUsed) as skill_years
        """
        
        with self.neo4j_driver.session() as session:
            result = session.run(cypher_query, cutoff_date=cutoff_date)
            records = [record.data() for record in result]
        
        neo4j_df = pd.DataFrame(records)
        
        if not neo4j_df.empty:
            # Calculate performance metrics
            neo4j_df['performance_score'] = self._calculate_performance_score(neo4j_df)
            
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
        Collect data from MySQL (identity-service, task-service, project-service, workload-service)
        """
        logger.info("Collecting data from MySQL databases...")
        
        mysql_cursor = self.mysql_connection.cursor(dictionary=True)
        
        cutoff_date = datetime.now() - timedelta(days=30 * months_back)
        
        # Collect task service data
        task_query = """
        SELECT 
            t.id as task_id,
            t.title as task_title,
            t.description as task_description,
            t.priority,
            t.difficulty,
            t.estimated_hours,
            t.actual_hours,
            t.status as task_status,
            t.created_at as task_created_date,
            t.completion_date,
            ta.user_id as assigned_user_id,
            ta.assigned_date,
            ta.is_accepted
        FROM tasks t
        LEFT JOIN task_assignments ta ON t.id = ta.task_id
        WHERE t.created_at >= %s
        """
        
        mysql_cursor.execute(task_query, (cutoff_date,))
        task_records = mysql_cursor.fetchall()
        
        # Collect project service data
        project_query = """
        SELECT 
            p.id as project_id,
            p.name as project_name,
            p.description as project_description,
            p.status as project_status,
            p.created_at as project_created_date,
            p.deadline,
            pm.user_id as project_member_id,
            pm.role as project_role
        FROM projects p
        LEFT JOIN project_members pm ON p.id = pm.project_id
        WHERE p.created_at >= %s
        """
        
        mysql_cursor.execute(project_query, (cutoff_date,))
        project_records = mysql_cursor.fetchall()
        
        # Collect identity service data
        identity_query = """
        SELECT 
            u.id as user_id,
            u.email,
            u.first_name,
            u.last_name,
            u.created_at,
            u.last_login_at,
            ur.role_name,
            ud.department_name,
            ud.seniority_level
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN user_departments ud ON u.id = ud.user_id
        WHERE u.created_at >= %s
        """
        
        mysql_cursor.execute(identity_query, (cutoff_date,))
        identity_records = mysql_cursor.fetchall()
        
        # Collect workload service data
        workload_query = """
        SELECT 
            w.id as workload_id,
            w.user_id,
            w.current_capacity,
            w.max_capacity,
            w.utilization_percentage,
            w.updated_at as workload_updated_date
        FROM user_workloads w
        WHERE w.updated_at >= %s
        """
        
        mysql_cursor.execute(workload_query, (cutoff_date,))
        workload_records = mysql_cursor.fetchall()
        
        mysql_cursor.close()
        
        # Convert to DataFrames
        task_df = pd.DataFrame(task_records) if task_records else pd.DataFrame()
        project_df = pd.DataFrame(project_records) if project_records else pd.DataFrame()
        identity_df = pd.DataFrame(identity_records) if identity_records else pd.DataFrame()
        workload_df = pd.DataFrame(workload_records) if workload_records else pd.DataFrame()
        
        # Merge all MySQL service data
        mysql_df = pd.DataFrame()
        if not task_df.empty:
            mysql_df = task_df
            
            # Add identity data
            if not identity_df.empty:
                mysql_df = mysql_df.merge(
                    identity_df,
                    left_on='assigned_user_id',
                    right_on='user_id',
                    how='left'
                )
            
            # Add workload data
            if not workload_df.empty:
                mysql_df = mysql_df.merge(
                    workload_df,
                    left_on='assigned_user_id',
                    right_on='user_id',
                    how='left',
                    suffixes=('', '_workload')
                )
                
            # Add project context
            if not project_df.empty:
                mysql_df = mysql_df.merge(
                    project_df,
                    left_on='assigned_user_id',
                    right_on='project_member_id',
                    how='left',
                    suffixes=('', '_project')
                )
        else:
            mysql_df = pd.DataFrame()
        
        logger.info(f"Collected {len(mysql_df)} records from MySQL")
        return mysql_df
    
    def _collect_postgres_ml_data(self, months_back: int) -> pd.DataFrame:
        """
        Collect existing ML training data from PostgreSQL
        """
        logger.info("Collecting existing ML training data from PostgreSQL...")
        
        cutoff_date = datetime.now() - timedelta(days=30 * months_back)
        
        query = """
        SELECT * FROM comprehensive_training_data 
        WHERE created_at >= %s
        ORDER BY created_at DESC
        """
        
        postgres_df = pd.read_sql(query, self.postgres_engine, params=[cutoff_date])
        
        logger.info(f"Collected {len(postgres_df)} existing ML records from PostgreSQL")
        return postgres_df
    
    def _merge_multi_db_data(self, neo4j_df: pd.DataFrame, mongodb_df: pd.DataFrame, 
                           mysql_df: pd.DataFrame, postgres_df: pd.DataFrame) -> pd.DataFrame:
        """
        Merge data from all databases into comprehensive training dataset
        """
        logger.info("Merging multi-database data...")
        
        # Start with Neo4j task/assignment data as base
        if neo4j_df.empty:
            logger.warning("No Neo4j data available for merging")
            return pd.DataFrame()
        
        comprehensive_df = neo4j_df.copy()
        
        # Add MongoDB profile/workload data
        if not mongodb_df.empty and 'user_id' in comprehensive_df.columns:
            comprehensive_df = comprehensive_df.merge(
                mongodb_df,
                left_on='user_id',
                right_on='userId',
                how='left',
                suffixes=('', '_mongo')
            )
        
        # Add MySQL AI/identity data  
        if not mysql_df.empty and 'user_id' in comprehensive_df.columns:
            comprehensive_df = comprehensive_df.merge(
                mysql_df,
                on='user_id',
                how='left',
                suffixes=('', '_mysql')
            )
        
        # Remove duplicates if merging with existing PostgreSQL data
        if not postgres_df.empty:
            # Keep only new records not in PostgreSQL
            existing_task_users = set(zip(postgres_df['task_id'], postgres_df['user_id']))
            new_mask = ~comprehensive_df[['task_id', 'user_id']].apply(
                lambda x: (x['task_id'], x['user_id']) in existing_task_users, axis=1
            )
            comprehensive_df = comprehensive_df[new_mask]
        
        # Add metadata columns
        comprehensive_df['created_at'] = datetime.now()
        comprehensive_df['data_source'] = 'multi_db_collection'
        
        logger.info(f"Merged data resulting in {len(comprehensive_df)} comprehensive records")
        
        return comprehensive_df
    
    def _calculate_performance_score(self, df: pd.DataFrame) -> pd.Series:
        """
        Calculate performance score based on task completion metrics
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
            if priority == 'HIGH' or priority == 'CRITICAL':
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
        
        # Create table if it doesn't exist
        create_table_query = """
        CREATE TABLE IF NOT EXISTS comprehensive_training_data (
            id SERIAL PRIMARY KEY,
            task_id VARCHAR(255),
            user_id VARCHAR(255),
            task_title TEXT,
            priority VARCHAR(50),
            difficulty VARCHAR(50),
            estimated_hours FLOAT,
            actual_hours FLOAT,
            performance_score FLOAT,
            assignment_date TIMESTAMP,
            completion_date TIMESTAMP,
            required_skills TEXT[],
            user_skill_levels TEXT[],
            department_name VARCHAR(255),
            seniority_level VARCHAR(50),
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
            connection.execute(text(create_table_query))
            connection.commit()
        
        # Store data
        data.to_sql(
            'comprehensive_training_data', 
            self.postgres_engine, 
            if_exists='append', 
            index=False,
            method='multi'
        )
        
        logger.info("Successfully stored comprehensive training data in PostgreSQL")
    
    def close_connections(self):
        """Close all database connections"""
        try:
            if hasattr(self, 'neo4j_driver'):
                self.neo4j_driver.close()
            
            if hasattr(self, 'mongo_client'):
                self.mongo_client.close()
            
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
        with open(config_path, 'r') as file:
            self.config = yaml.safe_load(file)
        
        self.synthetic_config = self.config['data_collection']['synthetic_data']
        
    def generate_comprehensive_dataset(self) -> pd.DataFrame:
        """
        Generate a comprehensive synthetic dataset for training
        """
        logger.info("Generating comprehensive synthetic dataset...")
        
        num_users = self.synthetic_config['num_users']
        num_tasks = self.synthetic_config['num_tasks']
        num_interactions = self.synthetic_config['num_interactions']
        
        # Generate users
        users_df = self._generate_users(num_users)
        
        # Generate tasks
        tasks_df = self._generate_tasks(num_tasks)
        
        # Generate user-task interactions
        interactions_df = self._generate_interactions(
            users_df, tasks_df, num_interactions
        )
        
        logger.info(f"Generated synthetic dataset with {len(interactions_df)} records")
        
        return interactions_df
    
    def _generate_users(self, num_users: int) -> pd.DataFrame:
        """Generate synthetic user data"""
        
        departments = ['Engineering', 'Product', 'Design', 'QA', 'DevOps', 'Data Science']
        seniority_levels = ['INTERN', 'JUNIOR', 'MID_LEVEL', 'SENIOR', 'LEAD', 'PRINCIPAL']
        skills = ['Python', 'Java', 'JavaScript', 'React', 'Node.js', 'SQL', 'Docker', 
                 'AWS', 'MongoDB', 'PostgreSQL', 'Machine Learning', 'UI/UX', 'Testing']
        
        users_data = []
        
        for i in range(num_users):
            # Generate user skills (3-8 skills per user)
            num_user_skills = np.random.randint(3, 9)
            user_skills = np.random.choice(skills, size=num_user_skills, replace=False)
            skill_levels = np.random.choice(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], 
                                         size=num_user_skills)
            
            user_data = {
                'user_id': f'user_{i+1}',
                'email': f'user{i+1}@company.com',
                'department_name': np.random.choice(departments),
                'seniority_level': np.random.choice(seniority_levels),
                'skills': list(user_skills),
                'skill_levels': list(skill_levels),
                'years_experience': np.random.randint(0, 15),
                'utilization': np.random.uniform(0.5, 1.0),
                'capacity': np.random.randint(20, 50),
            }
            
            users_data.append(user_data)
        
        return pd.DataFrame(users_data)
    
    def _generate_tasks(self, num_tasks: int) -> pd.DataFrame:
        """Generate synthetic task data"""
        
        priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
        difficulties = ['EASY', 'MEDIUM', 'HARD']
        statuses = ['COMPLETED', 'IN_PROGRESS', 'CANCELLED']
        task_types = ['Feature Development', 'Bug Fix', 'Testing', 'Documentation', 
                     'Code Review', 'Research', 'Deployment', 'Optimization']
        
        skills = ['Python', 'Java', 'JavaScript', 'React', 'Node.js', 'SQL', 'Docker', 
                 'AWS', 'MongoDB', 'PostgreSQL', 'Machine Learning', 'UI/UX', 'Testing']
        
        tasks_data = []
        
        for i in range(num_tasks):
            # Generate required skills (1-5 skills per task)
            num_required_skills = np.random.randint(1, 6)
            required_skills = np.random.choice(skills, size=num_required_skills, replace=False)
            
            estimated_hours = np.random.randint(2, 40)
            
            # Simulate actual hours with some variation
            if np.random.random() < 0.7:  # 70% of tasks completed reasonably
                actual_hours = estimated_hours * np.random.uniform(0.8, 1.3)
            else:  # 30% have significant deviation
                actual_hours = estimated_hours * np.random.uniform(1.4, 2.5)
            
            task_data = {
                'task_id': f'task_{i+1}',
                'task_title': f'{np.random.choice(task_types)} - Task {i+1}',
                'priority': np.random.choice(priorities),
                'difficulty': np.random.choice(difficulties),
                'estimated_hours': estimated_hours,
                'actual_hours': actual_hours if np.random.random() < 0.8 else None,
                'task_status': np.random.choice(statuses, p=[0.7, 0.2, 0.1]),
                'required_skills': list(required_skills),
                'created_date': datetime.now() - timedelta(
                    days=np.random.randint(1, 365)
                )
            }
            
            tasks_data.append(task_data)
        
        return pd.DataFrame(tasks_data)
    
    def _generate_interactions(self, users_df: pd.DataFrame, 
                             tasks_df: pd.DataFrame, num_interactions: int) -> pd.DataFrame:
        """Generate synthetic user-task interactions"""
        
        interactions_data = []
        
        for i in range(num_interactions):
            user = users_df.iloc[np.random.randint(len(users_df))]
            task = tasks_df.iloc[np.random.randint(len(tasks_df))]
            
            # Calculate skill match score
            user_skills = set(user['skills'])
            required_skills = set(task['required_skills'])
            skill_match = len(user_skills & required_skills) / len(required_skills) if required_skills else 0
            
            # Calculate performance based on skill match and other factors
            base_performance = skill_match * 0.5
            
            # Seniority bonus
            seniority_bonus = {
                'INTERN': 0.0, 'JUNIOR': 0.1, 'MID_LEVEL': 0.2,
                'SENIOR': 0.3, 'LEAD': 0.4, 'PRINCIPAL': 0.5
            }.get(user['seniority_level'], 0.2)
            
            # Difficulty adjustment
            difficulty_adjustment = {
                'EASY': 0.1, 'MEDIUM': 0.0, 'HARD': -0.1
            }.get(task['difficulty'], 0.0)
            
            performance_score = min(1.0, max(0.0, 
                base_performance + seniority_bonus + difficulty_adjustment + 
                np.random.normal(0, 0.1)  # Add some noise
            ))
            
            interaction_data = {
                'task_id': task['task_id'],
                'user_id': user['user_id'],
                'task_title': task['task_title'],
                'priority': task['priority'],
                'difficulty': task['difficulty'],
                'estimated_hours': task['estimated_hours'],
                'actual_hours': task['actual_hours'],
                'task_status': task['task_status'],
                'required_skills': task['required_skills'],
                'user_skills': user['skills'],
                'user_skill_levels': user['skill_levels'],
                'department_name': user['department_name'],
                'seniority_level': user['seniority_level'],
                'years_experience': user['years_experience'],
                'utilization': user['utilization'],
                'capacity': user['capacity'],
                'skill_match_score': skill_match,
                'performance_score': performance_score,
                'assignment_date': task['created_date'] + timedelta(
                    hours=np.random.randint(1, 48)
                ),
                'completion_date': task['created_date'] + timedelta(
                    days=np.random.randint(1, 30)
                ) if task['task_status'] == 'COMPLETED' else None,
                'created_at': datetime.now(),
                'data_source': 'synthetic'
            }
            
            interactions_data.append(interaction_data)
        
        return pd.DataFrame(interactions_data)


# Example usage and testing
if __name__ == "__main__":
    import os
    
    # Setup logging
    logging.basicConfig(level=logging.INFO)
    
    # Test synthetic data generation
    generator = SyntheticDataGenerator()
    synthetic_data = generator.generate_comprehensive_dataset()
    
    print(f"Generated {len(synthetic_data)} synthetic records")
    print("\nSample synthetic data:")
    print(synthetic_data.head())
    
    # Test multi-database collection (if config is available)
    if os.path.exists("config/model_config.yaml"):
        try:
            collector = MultiDatabaseDataCollector()
            # comprehensive_data = collector.collect_comprehensive_training_data(months_back=3)
            # print(f"Collected {len(comprehensive_data)} real records")
        except Exception as e:
            print(f"Could not test real data collection: {e}")
    
    print("\nData collection module ready for use!")