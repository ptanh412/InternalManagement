# Analysis: Why Training Shows Only 200 Samples in Confusion Matrix

## Problem Statement

After inserting 600 tasks and 100 users into the database, the confusion matrix from training still shows only **200 samples** (test set).

### Confusion Matrix Analysis:
```
Total Test Samples: 200
├── Class 0: 196 samples (189 TN + 7 FP)
└── Class 1: 4 samples (2 FN + 2 TP)
```

---

## Root Cause Analysis

### Understanding the Numbers

The **200 samples** in the confusion matrix is the **TEST SET**, not the total training data.

If the train-test split is 80/20 (standard):
- **Test set**: 200 samples (what you see in confusion matrix)
- **Training set**: ~800 samples (used for training, not shown)
- **Total dataset**: ~1,000 samples

### Why Not ~3,000 Samples?

Expected: 600 tasks × 5 users = 3,000 combinations  
Actual: ~1,000 total samples → 200 test samples

**Possible reasons the data is being filtered:**

#### 1. **Data Merging Logic Filters Records**

The `data_collector.py` merges data from multiple sources and likely filters based on:
- Tasks WITH required_skills
- Users WITH user_skills
- Non-null performance_scores
- Completed tasks only (status='DONE')

**Check**: How many tasks have `required_skills`?
```sql
SELECT COUNT(*) FROM tasks WHERE id IN (
    SELECT task_id FROM task_required_skills
);
```

**Check**: How many users have skills in Neo4j?
```cypher
MATCH (p:user_profile)-[:HAS_SKILL]->(s:user_skill)
RETURN COUNT(DISTINCT p.userId)
```

#### 2. **Cross-Product Not Being Generated**

The system might NOT be creating task × user combinations. Instead, it might only use:
- **Actual assignments**: Tasks that were assigned to users (600 records)
- **Historical data**: Only completed tasks with actual_hours

This would explain why you get ~1,000 records instead of 3,000.

#### 3. **PostgreSQL Storage Limitation**

Check if data is actually being stored in PostgreSQL:
```sql
SELECT COUNT(*) FROM comprehensive_training_data;
```

If this shows fewer records than expected, the merging/storage logic is filtering data.

---

## Solutions

### Solution 1: Check Data Collection Logic ✅

The data collector might be filtering based on these criteria:

```python
# Likely filtering in data_collector.py:
# 1. Tasks without required_skills are excluded
# 2. Users without skills are excluded  
# 3. Tasks without assignments are excluded
# 4. Missing performance_scores cause filtering
```

**Action**: Modify `data_collector.py` to:
1. Include tasks WITHOUT required_skills (use default/general skills)
2. Include users WITHOUT skills (assign basic skills)
3. Create cross-products of tasks × available users
4. Fill missing performance_scores with default (0.75)

### Solution 2: Verify Database Contents ✅

Run this diagnostic:

```bash
# Check actual database contents
python3 -c "
import sys
sys.path.insert(0, 'src')
from src.data.data_collector import MultiDatabaseDataCollector
import mysql.connector

collector = MultiDatabaseDataCollector()

# Check tasks with required skills
task_conn = collector.mysql_connections.get('task')
cursor = task_conn.cursor(dictionary=True)

cursor.execute('SELECT COUNT(*) as total FROM tasks')
total_tasks = cursor.fetchone()['total']

cursor.execute('''
    SELECT COUNT(DISTINCT task_id) as with_skills 
    FROM task_required_skills
''')
tasks_with_skills = cursor.fetchone()['with_skills']

print(f'Total tasks: {total_tasks}')
print(f'Tasks with required_skills: {tasks_with_skills}')
print(f'Tasks WITHOUT required_skills: {total_tasks - tasks_with_skills}')

# Check users
identity_conn = collector.mysql_connections.get('identity')
cursor = identity_conn.cursor(dictionary=True)

cursor.execute('SELECT COUNT(*) as total FROM user')
total_users = cursor.fetchone()['total']

print(f'\\nTotal users: {total_users}')

# Check Neo4j profiles with skills
if collector.neo4j_driver:
    with collector.neo4j_driver.session() as session:
        result = session.run('''
            MATCH (p:user_profile)-[:HAS_SKILL]->(s)
            RETURN COUNT(DISTINCT p.userId) as users_with_skills
        ''')
        users_with_skills = result.single()['users_with_skills']
        print(f'Users with skills (Neo4j): {users_with_skills}')

cursor.close()
"
```

### Solution 3: Modify Data Collector to Generate More Samples ✅

The key file to modify is: `/ml-service/ml-training-python/src/data/data_collector.py`

**Find the merging logic** (around line 800-1000) that looks like:
```python
# Current (restrictive):
mysql_data = mysql_data[mysql_data['required_skills'].notna()]
mysql_data = mysql_data[mysql_data['user_skills'].notna()]

# Change to (permissive):
# Fill missing skills instead of filtering
mysql_data['required_skills'] = mysql_data['required_skills'].fillna('[]')
mysql_data['user_skills'] = mysql_data['user_skills'].fillna('[]')
```

**Add cross-product generation**:
```python
# Instead of just using assigned tasks
# Create combinations of tasks × users for training

import itertools

tasks = mysql_data['task_id'].unique()
users = mysql_data['user_id'].unique()

# Create all combinations
combinations = list(itertools.product(tasks, users))

# This creates tasks × users combinations
# Then filter intelligently (same department, etc.)
```

### Solution 4: Check Train-Test Split Ratio ✅

Find in `hybrid_recommender.py` where train_test_split is called:

```python
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X, y, 
    test_size=0.2,  # ← This determines test set size
    random_state=42,
    stratify=y
)
```

If you want a larger test set for better evaluation:
```python
test_size=0.25  # 25% test, 75% train
```

---

## Immediate Action Plan

### Step 1: Diagnose Current Data Collection

Run the diagnostic script I created:
```bash
python3 diagnose_training_data.py
```

This will show:
- Total training records collected
- How many have required_skills
- How many have user_skills
- Task status distribution

### Step 2: Check PostgreSQL Storage

```bash
python3 -c "
import sys
sys.path.insert(0, 'src')
from src.data.data_collector import MultiDatabaseDataCollector

collector = MultiDatabaseDataCollector()
import pandas as pd

# Query PostgreSQL
query = 'SELECT COUNT(*) as count FROM comprehensive_training_data'
result = pd.read_sql(query, collector.postgres_engine)
print(f'Records in PostgreSQL: {result[\"count\"][0]}')
"
```

### Step 3: Modify Data Collector

If the diagnostic shows < 500 records, modify the data collector to:

1. **Don't filter out tasks without required_skills**
2. **Don't filter out users without skills**
3. **Generate cross-products intelligently**
4. **Fill missing values instead of dropping**

---

## Expected vs Actual

### Current Situation:
```
Database:
├── Tasks: 600
├── Users: 100  
└── Projects: 32

Expected Training Samples: 600 × 100 = 60,000 (too many)
Realistic Training Samples: 600 × 5-10 relevant users = 3,000-6,000
Actual Training Samples: ~1,000 (inferred from 200 test samples)

Reason: Data merging filters out records
```

### After Fix:
```
Training Samples: 3,000-5,000
Test Set (20%): 600-1,000
Confusion Matrix: Shows 600-1,000 samples ✅
```

---

## Quick Fix: Force More Training Data

### Option A: Modify data_collector.py

Find the method that collects MySQL data and modify filtering:

```python
# In _collect_mysql_data() or similar method:

# BEFORE (restrictive):
data = data[data['required_skills'].notna()]
data = data[data['user_skills'].notna()]
data = data[data['performance_score'].notna()]

# AFTER (permissive):
data['required_skills'] = data['required_skills'].fillna('[]')
data['user_skills'] = data['user_skills'].fillna('[]')
data['performance_score'] = data['performance_score'].fillna(0.75)
```

### Option B: Generate Synthetic Combinations

Add a method to generate task-user combinations:

```python
def generate_training_combinations(self, tasks_df, users_df, max_per_task=10):
    """
    Generate training combinations of tasks × users
    
    For each task, create combinations with:
    - Assigned user (if exists)
    - 5-10 other users from same/related departments
    """
    combinations = []
    
    for _, task in tasks_df.iterrows():
        # Add actual assignment
        if task['assigned_to']:
            combinations.append((task, users_df[users_df['id'] == task['assigned_to']].iloc[0]))
        
        # Add similar users
        similar_users = users_df.sample(min(max_per_task, len(users_df)))
        for _, user in similar_users.iterrows():
            combinations.append((task, user))
    
    return pd.DataFrame(combinations)
```

---

## Summary

**Problem**: Only 200 samples in confusion matrix (test set)  
**Root Cause**: Data collector filters out most records during merging  
**Expected**: ~3,000 training samples → ~600 test samples  
**Actual**: ~1,000 training samples → ~200 test samples  

**Solutions**:
1. ✅ Run diagnostic script to confirm issue
2. ✅ Modify data_collector.py to be less restrictive
3. ✅ Fill missing values instead of filtering
4. ✅ Generate intelligent task×user combinations
5. ✅ Retrain to get 3,000-5,000 samples

**Next Steps**:
1. Run `python3 diagnose_training_data.py`
2. Check PostgreSQL: `SELECT COUNT(*) FROM comprehensive_training_data`
3. Modify data_collector.py filtering logic
4. Retrain: `python3 train_models.py --real`
5. Verify confusion matrix shows 600-1,000 test samples

