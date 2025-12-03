# ML Service Database Schema Documentation

## Overview
This document provides a comprehensive reference for all database tables and attributes used in the ML training Python service. The ML service collects data from multiple heterogeneous databases (PostgreSQL, MySQL, MongoDB, Neo4j) and stores consolidated training data in PostgreSQL.

---

## Table of Contents
1. [PostgreSQL - ML Training Database](#postgresql---ml-training-database)
2. [MySQL - Task Service Database](#mysql---task-service-database)
3. [MySQL - Identity Service Database](#mysql---identity-service-database)
4. [MySQL - Project Service Database](#mysql---project-service-database)
5. [MySQL - Workload Service Database](#mysql---workload-service-database)
6. [MongoDB - AI Service Database](#mongodb---ai-service-database)
7. [Neo4j - Profile Service Database](#neo4j---profile-service-database)

---

## PostgreSQL - ML Training Database

### Database: `ml_training_db`
**Purpose**: Central repository for consolidated ML training data collected from all microservices.

### Table: `comprehensive_training_data`

**Description**: Main table storing comprehensive training data for ML model training. This table aggregates data from multiple sources and is used for training hybrid recommendation models.

**Indexes**:
- `idx_comprehensive_task_user` on (`task_id`, `user_id`)
- `idx_comprehensive_created_at` on (`created_at`)

#### Attributes

| Attribute | Data Type | Constraints | Meaning |
|-----------|-----------|-------------|---------|
| **id** | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier for each record |
| **task_id** | VARCHAR(255) | - | Unique identifier of the task from task-service |
| **user_id** | VARCHAR(255) | - | Unique identifier of the user/candidate |
| **task_title** | TEXT | - | Title/name of the task |
| **task_description** | TEXT | - | Detailed description of what the task involves |
| **priority** | VARCHAR(50) | - | Task priority level (URGENT, HIGH, MEDIUM, LOW) |
| **difficulty** | VARCHAR(50) | - | Task difficulty level (HARD, MEDIUM, EASY) |
| **estimated_hours** | FLOAT | - | Estimated hours to complete the task |
| **actual_hours** | FLOAT | - | Actual hours spent on task completion |
| **task_status** | VARCHAR(50) | - | Current status (TODO, IN_PROGRESS, COMPLETED, CANCELLED, DONE) |
| **task_type** | VARCHAR(100) | - | Type/category of task (e.g., DEVELOPMENT, TESTING, BUG_FIX) |
| **project_id** | VARCHAR(255) | - | Associated project identifier |
| **assigned_to** | VARCHAR(255) | - | User ID the task is currently assigned to |
| **assignee_id** | VARCHAR(255) | - | Alternative field for assignee identifier |
| **reporter_id** | VARCHAR(255) | - | User ID who created/reported the task |
| **progress_percentage** | FLOAT | - | Task completion percentage (0-100) |
| **due_date** | TIMESTAMP | - | Task deadline date and time |
| **started_at** | TIMESTAMP | - | When the task work was started |
| **updated_at** | TIMESTAMP | - | Last update timestamp |
| **email** | VARCHAR(255) | - | User's email address |
| **first_name** | VARCHAR(255) | - | User's first name |
| **last_name** | VARCHAR(255) | - | User's last name |
| **username** | VARCHAR(255) | - | User's unique username |
| **phone_number** | VARCHAR(255) | - | User's contact phone number |
| **performance_score** | FLOAT | - | User's overall performance score (0.0-1.0) |
| **department_id** | VARCHAR(255) | - | Department identifier the user belongs to |
| **position_id** | VARCHAR(255) | - | User's position/role identifier |
| **role_id** | VARCHAR(255) | - | User's role identifier in the system |
| **project_name** | VARCHAR(255) | - | Name of the associated project |
| **project_description** | TEXT | - | Description of the project |
| **project_status** | VARCHAR(50) | - | Current project status |
| **project_member_id** | VARCHAR(255) | - | Identifier for project membership |
| **project_role** | VARCHAR(100) | - | User's role within the project |
| **assignment_date** | TIMESTAMP | - | When the task was assigned |
| **completed_at** | TIMESTAMP | - | When the task was completed |
| **required_skills** | TEXT[] | PostgreSQL Array | List of skills required for the task |
| **user_skills** | TEXT[] | PostgreSQL Array | List of skills the user possesses |
| **user_skill_levels** | TEXT[] | PostgreSQL Array | Proficiency levels for user skills (BEGINNER, INTERMEDIATE, ADVANCED) |
| **department_name** | VARCHAR(255) | - | Name of the department |
| **seniority_level** | VARCHAR(50) | - | User's seniority (INTERN, JUNIOR, MID_LEVEL, SENIOR, LEAD, PRINCIPAL, DIRECTOR) |
| **years_experience** | FLOAT | - | Years of professional experience |
| **utilization** | FLOAT | - | Resource utilization percentage (0.0-1.0) |
| **capacity** | FLOAT | - | Available capacity for new work |
| **confidence_score** | FLOAT | - | ML model's confidence in the prediction (0.0-1.0) |
| **recommendation_type** | VARCHAR(100) | - | Type of recommendation (CONTENT_BASED, COLLABORATIVE, HYBRID) |
| **predicted_performance** | FLOAT | - | ML-predicted performance score (0.0-1.0) |
| **actual_performance** | FLOAT | - | Actual performance after task completion (0.0-1.0) |
| **created_at** | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| **data_source** | VARCHAR(100) | - | Source of the data (e.g., 'multi_db_collection', 'synthetic') |

**Key Features**:
- Uses PostgreSQL arrays for skill lists (TEXT[])
- Supports batch insertion with configurable batch size
- Includes both predicted and actual performance for model evaluation
- Stores metadata about data source and collection method

---

## MySQL - Task Service Database

### Database: `task_db`
**Purpose**: Manages tasks, assignments, and task-related information.

### Table: `tasks`

**Description**: Core table storing all task information in the system.

#### Attributes

| Attribute | Data Type | Constraints | Meaning |
|-----------|-----------|-------------|---------|
| **id** | VARCHAR(255) | PRIMARY KEY | Unique task identifier (UUID) |
| **title** | VARCHAR(255) | NOT NULL | Task title/name |
| **description** | TEXT | - | Detailed task description |
| **priority** | VARCHAR(50) | - | Priority level (URGENT, HIGH, MEDIUM, LOW) |
| **difficulty** | VARCHAR(50) | - | Difficulty level (HARD, MEDIUM, EASY) |
| **estimated_hours** | INT | - | Estimated hours for completion |
| **actual_hours** | INT | - | Actual hours spent (from time logs) |
| **status** | VARCHAR(50) | NOT NULL | Current status (TODO, IN_PROGRESS, COMPLETED, CANCELLED, DONE) |
| **type** | VARCHAR(100) | - | Task type/category |
| **project_id** | VARCHAR(255) | FK | Reference to project |
| **assigned_to** | VARCHAR(255) | - | User ID of assignee |
| **reporter_id** | VARCHAR(255) | - | User ID who created the task |
| **progress_percentage** | INT | DEFAULT 0 | Completion percentage (0-100) |
| **due_date** | TIMESTAMP | - | Task deadline |
| **started_at** | TIMESTAMP | - | Task start timestamp |
| **completed_at** | TIMESTAMP | - | Task completion timestamp |
| **created_at** | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| **updated_at** | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update timestamp |

### Table: `task_required_skills`

**Description**: Junction table linking tasks with required skills.

#### Attributes

| Attribute | Data Type | Constraints | Meaning |
|-----------|-----------|-------------|---------|
| **id** | BIGINT | PRIMARY KEY AUTO_INCREMENT | Unique identifier |
| **task_id** | VARCHAR(255) | FK, NOT NULL | Reference to tasks.id |
| **skill_name** | VARCHAR(255) | NOT NULL | Name of the required skill |
| **required_level** | DOUBLE | - | Minimum required proficiency (0.0-1.0 or skill level) |
| **is_mandatory** | BOOLEAN | DEFAULT TRUE | Whether the skill is mandatory or preferred |

**Note**: Skills are stored as comma-separated values when collected for ML training.

---

## MySQL - Identity Service Database

### Database: `identity_db`
**Purpose**: Manages user authentication, profiles, and organizational structure.

### Table: `users` (or `user`)

**Description**: Core user information and authentication data.

#### Attributes

| Attribute | Data Type | Constraints | Meaning |
|-----------|-----------|-------------|---------|
| **id** | VARCHAR(255) | PRIMARY KEY | Unique user identifier (UUID) |
| **email** | VARCHAR(255) | UNIQUE, NOT NULL | User's email address |
| **first_name** | VARCHAR(255) | - | User's first name |
| **last_name** | VARCHAR(255) | - | User's last name |
| **username** | VARCHAR(255) | UNIQUE, NOT NULL | Unique username |
| **password** | VARCHAR(255) | NOT NULL | Encrypted password hash |
| **phone_number** | VARCHAR(50) | - | Contact phone number |
| **performance_score** | DOUBLE | - | Overall performance metric (0.0-1.0) |
| **department_id** | VARCHAR(255) | FK | Reference to departments table |
| **position_id** | VARCHAR(255) | FK | Reference to position table |
| **role_id** | VARCHAR(255) | FK | Reference to roles table |
| **created_at** | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |
| **updated_at** | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update timestamp |

### Table: `departments`

**Description**: Organizational departments.

#### Attributes

| Attribute | Data Type | Constraints | Meaning |
|-----------|-----------|-------------|---------|
| **id** | VARCHAR(255) | PRIMARY KEY | Unique department identifier |
| **name** | VARCHAR(255) | NOT NULL | Department name |
| **description** | TEXT | - | Department description |
| **manager_id** | VARCHAR(255) | FK | Department manager user ID |
| **created_at** | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |

### Table: `position`

**Description**: Job positions and their skill requirements.

#### Attributes

| Attribute | Data Type | Constraints | Meaning |
|-----------|-----------|-------------|---------|
| **id** | VARCHAR(255) | PRIMARY KEY | Unique position identifier |
| **name** | VARCHAR(255) | NOT NULL | Position title |
| **seniority_level** | VARCHAR(50) | - | Seniority level (INTERN, JUNIOR, MID_LEVEL, SENIOR, LEAD, PRINCIPAL, DIRECTOR) |
| **description** | TEXT | - | Position description |
| **department_id** | VARCHAR(255) | FK | Associated department |
| **created_at** | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |

### Table: `position_required_skills`

**Description**: Skills required for each position.

#### Attributes

| Attribute | Data Type | Constraints | Meaning |
|-----------|-----------|-------------|---------|
| **id** | BIGINT | PRIMARY KEY AUTO_INCREMENT | Unique identifier |
| **position_id** | VARCHAR(255) | FK, NOT NULL | Reference to position.id |
| **skill_name** | VARCHAR(255) | NOT NULL | Name of the required skill |
| **required_level** | DOUBLE | - | Required proficiency level (0.0-1.0) |

**ML Processing Note**: 
- Skills are concatenated as `skill_name:required_level` pairs
- Required levels are converted to categorical levels (BEGINNER, INTERMEDIATE, ADVANCED):
  - ≥ 0.7: ADVANCED
  - ≥ 0.4: INTERMEDIATE
  - < 0.4: BEGINNER
- Years of experience are mapped from seniority level

---

## MySQL - Project Service Database

### Database: `project_db`
**Purpose**: Manages projects and team memberships.

### Table: `projects`

**Description**: Project information and metadata.

#### Attributes

| Attribute | Data Type | Constraints | Meaning |
|-----------|-----------|-------------|---------|
| **id** | VARCHAR(255) | PRIMARY KEY | Unique project identifier (UUID) |
| **name** | VARCHAR(255) | NOT NULL | Project name |
| **description** | TEXT | - | Project description |
| **status** | VARCHAR(50) | - | Project status (PLANNING, ACTIVE, ON_HOLD, COMPLETED, CANCELLED) |
| **start_date** | TIMESTAMP | - | Project start date |
| **end_date** | TIMESTAMP | - | Project end date or deadline |
| **created_at** | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| **updated_at** | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update timestamp |

### Table: `project_members`

**Description**: Junction table for project team members.

#### Attributes

| Attribute | Data Type | Constraints | Meaning |
|-----------|-----------|-------------|---------|
| **id** | BIGINT | PRIMARY KEY AUTO_INCREMENT | Unique identifier |
| **project_id** | VARCHAR(255) | FK, NOT NULL | Reference to projects.id |
| **user_id** | VARCHAR(255) | FK, NOT NULL | Reference to user ID |
| **role** | VARCHAR(100) | - | Member's role in project (PROJECT_MANAGER, TEAM_LEAD, DEVELOPER, etc.) |
| **joined_at** | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When user joined the project |

---

## MySQL - Workload Service Database

### Database: `workload_db` (may be in task_db or project_db)
**Purpose**: Tracks user workload and capacity management.

### Table: `user_workloads`

**Description**: Current workload and capacity information for users.

#### Attributes

| Attribute | Data Type | Constraints | Meaning |
|-----------|-----------|-------------|---------|
| **id** | BIGINT | PRIMARY KEY AUTO_INCREMENT | Unique identifier |
| **user_id** | VARCHAR(255) | UNIQUE, NOT NULL | Reference to user ID |
| **weekly_capacity_hours** | DOUBLE | - | Total available hours per week |
| **daily_capacity_hours** | DOUBLE | - | Available hours per day |
| **total_estimate_hours** | DOUBLE | - | Total estimated hours for assigned tasks |
| **total_actual_hours** | DOUBLE | - | Total actual hours spent on tasks |
| **availability_percentage** | DOUBLE | - | Percentage of time available (0.0-100.0) |
| **next_available_date** | TIMESTAMP | - | Next date when user has available capacity |
| **upcoming_week_hours** | DOUBLE | - | Committed hours for upcoming week |
| **last_updated** | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update timestamp |

**ML Calculations**:
- **utilization** = `total_actual_hours / weekly_capacity_hours`
- **capacity** = `weekly_capacity_hours - total_estimate_hours`

---

## MongoDB - AI Service Database

### Database: `ai_service`
**Purpose**: Stores AI predictions, recommendations, and analysis results.

### Collection: `ai_recommendations`

**Description**: AI-generated task assignment recommendations.

#### Document Structure

```javascript
{
  _id: ObjectId,
  taskId: String,           // Task identifier
  userId: String,           // Recommended user ID
  score: Number,            // Recommendation score (0.0-1.0)
  rank: Number,             // Rank among recommendations
  reasoning: String,        // AI-generated explanation
  matchedSkills: [String],  // Skills that match requirements
  missingSkills: [String],  // Required skills user lacks
  bonusSkills: [String],    // Additional skills user has
  recommendationType: String, // CONTENT_BASED, COLLABORATIVE, HYBRID
  createdAt: Date,          // Recommendation timestamp
  metadata: Object          // Additional contextual data
}
```

### Collection: `ai_predictions`

**Description**: ML model predictions and confidence scores.

#### Document Structure

```javascript
{
  _id: ObjectId,
  taskId: String,           // Task identifier
  userId: String,           // User identifier
  predictedPerformance: Number,  // Predicted score (0.0-1.0)
  confidenceScore: Number,  // Model confidence (0.0-1.0)
  modelVersion: String,     // ML model version used
  features: Object,         // Feature values used in prediction
  createdAt: Date,          // Prediction timestamp
  expiresAt: Date          // When prediction should be refreshed
}
```

### Collection: `chat_messages`

**Description**: Chat/collaboration messages (used for team collaboration features).

#### Document Structure

```javascript
{
  _id: ObjectId,
  type: String,             // Message type (task_discussion, team_chat, etc.)
  taskId: String,           // Related task ID (if applicable)
  senderId: String,         // User who sent the message
  receiverId: String,       // User who receives the message
  content: String,          // Message content
  timestamp: Date,          // Message timestamp
  metadata: Object          // Additional message data
}
```

---

## Neo4j - Profile Service Database

### Database: `neo4j`
**Purpose**: Graph-based user profile and skill relationship storage.

### Node: `user_profile`

**Description**: User profile information stored as graph nodes.

#### Properties

| Property | Data Type | Meaning |
|----------|-----------|---------|
| **id** | String | Internal Neo4j node ID |
| **userId** | String | External user ID reference |
| **avatar** | String | URL to user avatar image |
| **dob** | Date | Date of birth |
| **city** | String | User's city/location |
| **averageTaskCompletionRate** | Float | Average task completion rate (0.0-1.0) |
| **totalTasksCompleted** | Integer | Total number of completed tasks |
| **currentWorkLoadHours** | Float | Current workload in hours |
| **availabilityStatus** | String | Availability status (AVAILABLE, BUSY, UNAVAILABLE) |
| **createdAt** | DateTime | Profile creation timestamp |
| **updatedAt** | DateTime | Last update timestamp |

### Node: `user_skill`

**Description**: Individual skill nodes.

#### Properties

| Property | Data Type | Meaning |
|----------|-----------|---------|
| **skillName** | String | Name of the skill |
| **proficiencyLevel** | Float | Proficiency level (0.0-5.0 or similar scale) |
| **yearsOfExperience** | Float | Years of experience with this skill |

### Relationship: `HAS_SKILL`

**Description**: Connects user_profile to user_skill nodes.

```cypher
(:user_profile)-[:HAS_SKILL]->(:user_skill)
```

**ML Collection Note**:
- Skills are collected as arrays: `skills`, `skill_levels`, `skill_years`
- Performance score is calculated based on completion rate and task history

---

## Data Collection & Processing Flow

### 1. Multi-Database Collection
```python
MultiDatabaseDataCollector.collect_comprehensive_training_data()
```
- Connects to all 4 database types (PostgreSQL, MySQL, MongoDB, Neo4j)
- Collects data from last 12 months (configurable)
- Handles missing connections gracefully with fallbacks

### 2. Data Merging Strategy
```python
_merge_multi_db_data(neo4j_data, mongodb_data, mysql_data, postgres_data)
```
- Primary key: `(task_id, user_id)` combination
- Left joins to preserve all task-user combinations
- Missing values filled with sensible defaults

### 3. Data Storage
```python
_store_comprehensive_data(data)
```
- Batch size: 50 records per transaction
- Uses `IF NOT EXISTS` to preserve existing data
- Creates indexes automatically for performance

### 4. Array Handling for PostgreSQL
- Python lists converted to PostgreSQL array format: `'{item1, item2}'`
- Escapes special characters in array elements
- Handles empty arrays as `'{}'`

---

## Key Metrics & Constraints

### Performance Score Calculation
Performance is calculated based on multiple factors:
1. **Completion Status** (0.3 weight)
   - COMPLETED: +0.3
   - IN_PROGRESS: +0.1
   - CANCELLED: -0.2

2. **Time Accuracy** (0.3 weight)
   - Within 10% of estimate: +0.3
   - Within 30% of estimate: +0.2
   - Within 50% of estimate: +0.1
   - Over 50%: -0.1

3. **Priority Handling** (0.2 weight)
   - Completing HIGH/URGENT tasks: +0.2

4. **Final Score**: Clamped to [0.0, 1.0]

### Seniority to Experience Mapping
```python
{
    'INTERN': 0 years,
    'JUNIOR': 1 year,
    'MID_LEVEL': 3 years,
    'SENIOR': 6 years,
    'LEAD': 9 years,
    'PRINCIPAL': 12 years
}
```

### Priority Levels (Valid Values)
- URGENT (highest)
- HIGH
- MEDIUM
- LOW (lowest)

### Task Status Values
- TODO
- IN_PROGRESS
- COMPLETED
- CANCELLED
- DONE

### Skill Proficiency Levels
- BEGINNER (< 0.4)
- INTERMEDIATE (0.4 - 0.7)
- ADVANCED (≥ 0.7)

---

## Usage Examples

### Querying Training Data
```sql
-- Get all high-priority tasks with required skills
SELECT 
    task_id, 
    task_title, 
    priority,
    required_skills,
    user_id,
    user_skills
FROM comprehensive_training_data
WHERE priority = 'HIGH'
  AND cardinality(required_skills) > 0
ORDER BY created_at DESC
LIMIT 100;
```

### Analyzing User Performance
```sql
-- Average performance by seniority level
SELECT 
    seniority_level,
    COUNT(*) as task_count,
    AVG(performance_score) as avg_performance,
    AVG(actual_hours) as avg_hours
FROM comprehensive_training_data
WHERE performance_score IS NOT NULL
GROUP BY seniority_level
ORDER BY avg_performance DESC;
```

### Skill Gap Analysis
```sql
-- Find tasks with missing skill matches
SELECT 
    task_id,
    task_title,
    required_skills,
    user_skills,
    array_length(required_skills, 1) as required_count,
    array_length(user_skills, 1) as user_count
FROM comprehensive_training_data
WHERE array_length(required_skills, 1) > array_length(user_skills, 1)
LIMIT 50;
```

---

## Maintenance & Best Practices

### Data Collection Schedule
- **Continuous Training**: Every 24 hours (configurable)
- **Manual Training**: On-demand via `train_models.py`
- **Data Retention**: 12 months default (configurable)

### Data Quality Checks
1. Validate database connections before collection
2. Check for minimum record count (100 records)
3. Fallback to synthetic data if insufficient real data
4. Log all collection errors for debugging

### Performance Optimization
1. Use indexed columns for queries (`task_id`, `user_id`, `created_at`)
2. Batch inserts in groups of 50 records
3. Use connection pooling for database connections
4. Close cursors and connections properly

### Monitoring
- Track total record count
- Monitor unique tasks and users
- Check data freshness (created_at timestamps)
- Review error logs regularly

---

## Related Documentation
- [ML Training Guide](ML_TRAINING_COMPLETE_PACKAGE.md)
- [ML Evaluation Guide](ML_EVALUATION_COMPLETE_GUIDE.md)
- [PostgreSQL Data Summary](PostgreSQL_Data_Summary_Report.md)
- [Microservices Documentation](MICROSERVICES_DOCUMENTATION.md)

---

**Last Updated**: November 27, 2025  
**Version**: 1.0  
**Maintained By**: ML Service Team

