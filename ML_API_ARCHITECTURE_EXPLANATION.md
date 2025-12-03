# ML Recommendation System - Architecture Analysis

**Date:** December 2, 2025  
**Purpose:** Explain how the ML prediction API works and the data flow

---

## 🔍 Question 1: Does `/api/ml/predict-candidates` Use the Trained Model?

### **Answer: YES, it uses the trained ML model**

**Location:** `/ml-service/ml-training-python/src/api/model_server.py`

**Line where ML model is used: Line 597**

```python
# Line 597 in model_server.py
predictions = ml_model.predict(X)
```

### **Detailed Flow:**

#### Step 1: Model Loading (Startup)
**Lines 39-68 in `model_server.py`:**

```python
# Line 39: Global model instance
ml_model = None

# Lines 44-68: Application startup (lifespan function)
async def lifespan(app: FastAPI):
    global ml_model, continuous_trainer
    
    # Initialize components
    ml_model = HybridRecommenderTrainer()  # Line 56
    
    # Try to load existing models
    try:
        ml_model.load_models()  # Line 60 - LOADS TRAINED MODEL
        logger.info("Existing models loaded successfully")
    except Exception as e:
        logger.warning(f"Could not load existing models: {e}")
```

**What happens:**
- ✅ System loads the **trained ML model** from disk
- ✅ Model includes: Random Forest classifier, feature scaler, label encoders
- ✅ Model was trained on historical task assignment data

---

#### Step 2: Prediction Process
**Lines 311-610 in `model_server.py`:**

```python
@app.post("/api/ml/predict-candidates")
async def predict_candidates(request: dict):
    global ml_model  # Line 350 - Access global trained model
    
    # ... data normalization and pre-filtering ...
    
    # Prepare features for ML model (Line 588)
    X = _prepare_ml_features(df_candidates, task_data)
    
    # Get predictions (Lines 590-603)
    if ml_model is None or not hasattr(ml_model, 'content_model') or ml_model.content_model is None:
        # Fallback if model not loaded
        logger.warning("Model not available, using fallback scoring")
        predictions = _fallback_scoring(df_candidates)
        model_version = "fallback"
    else:
        try:
            # 🎯 THIS IS WHERE THE TRAINED MODEL IS USED
            predictions = ml_model.predict(X)  # Line 597
            model_version = getattr(ml_model, 'model_version', '1.0')
            logger.info(f"ML predictions generated using model version: {model_version}")
        except Exception as e:
            logger.error(f"Prediction error: {e}, using fallback")
            predictions = _fallback_scoring(df_candidates)
            model_version = "fallback"
```

---

#### Step 3: What `ml_model.predict(X)` Does
**Location:** `/ml-service/ml-training-python/src/models/hybrid_recommender.py` Lines 1215-1385

```python
def predict(self, features: pd.DataFrame) -> np.ndarray:
    """
    Make predictions using the hybrid model with advanced scoring logic
    """
    
    if self.content_model is None:
        logger.warning("Content model not available, using rule-based scoring only")
        return self._rule_based_scoring(features)
    
    try:
        # 1. Preprocess features (same as training)
        processed_features = self._preprocess_prediction_features(features)
        
        # 2. Scale features using trained scaler
        X_scaled = self.feature_scaler.transform(processed_features)
        
        # 3. 🤖 GET PREDICTIONS FROM TRAINED RANDOM FOREST MODEL
        content_proba = self.content_model.predict_proba(X_scaled)[:, 1]
        
        # 4. Calculate collaborative filtering scores
        collaborative_scores = self._calculate_collaborative_scores(features)
        
        # 5. Combine predictions (60% content-based, 40% collaborative)
        content_weight = 0.6
        collab_weight = 0.4
        ml_scores = (content_weight * content_proba + collab_weight * collaborative_scores)
        
        # 6. Apply rule-based adjustments (penalties/boosts)
        adjusted_scores = self._apply_rule_based_adjustments(features, ml_scores)
        
        return adjusted_scores
        
    except Exception as e:
        logger.error(f"Prediction failed: {e}, falling back to rule-based scoring")
        return self._rule_based_scoring(features)
```

**Components:**
1. ✅ **Trained Random Forest Model** (`self.content_model.predict_proba()`)
2. ✅ **Trained Feature Scaler** (`self.feature_scaler.transform()`)
3. ✅ **Trained Label Encoders** (used in preprocessing)
4. ➕ **Collaborative Filtering** (based on historical performance)
5. ➕ **Rule-Based Adjustments** (penalty system)

---

### **Summary:**

| Component | Uses Trained Model? | Where |
|-----------|-------------------|-------|
| **Main Prediction** | ✅ YES | Line 597 in `model_server.py` |
| **Random Forest** | ✅ YES | `content_model.predict_proba()` in `hybrid_recommender.py` |
| **Feature Scaling** | ✅ YES | `feature_scaler.transform()` |
| **Label Encoding** | ✅ YES | Used in `_preprocess_prediction_features()` |
| **Pre-Filtering** | ❌ NO | Rule-based logic (Lines 400-520) |
| **Collaborative Filtering** | ✅ PARTIAL | Uses historical metrics (performance, success rate) |
| **Business Rules** | ❌ NO | Applied in Java after ML prediction |

**Conclusion:** The API **DOES use the trained ML model**, but it's a **hybrid system** that combines:
- 60% Machine Learning (trained model)
- 40% Collaborative Filtering (historical metrics)
- Additional rule-based filters and penalties

---

## 🔍 Question 2: Why Doesn't `/task/{taskId}` Send Task Data to ML Service?

### **Answer: IT DOES! But in a Transformed Way**

### **Current Data Flow:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. CLIENT REQUEST                                                       │
│    POST /ai/recommendations/task/{taskId}                               │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. JAVA: AIRecommendationService.recommendCandidates()                 │
│    Location: AIRecommendationService.java                              │
│                                                                         │
│    Step 1: Get Task Profile from Database                              │
│    ────────────────────────────────────────────────────                │
│    TaskProfile task = dataIntegrationService.getTaskProfile(taskId)    │
│                                                                         │
│    Task Data Retrieved:                                                │
│    • priority (HIGH, URGENT, etc.)                                     │
│    • difficulty (EASY, MEDIUM, HARD)                                   │
│    • estimated_hours (e.g., 40.0)                                      │
│    • required_skills (Map<String, Double>)                             │
│    • type (FRONTEND_DEVELOPMENT, etc.)                                 │
│                                                                         │
│    Step 2: Get Candidate Profiles                                      │
│    ────────────────────────────────────────────                        │
│    List<UserProfile> candidates =                                      │
│        dataIntegrationService.getSmartCandidates(task)                 │
│                                                                         │
│    Step 3: Filter Candidates                                           │
│    ────────────────────────────────────────────                        │
│    candidates.stream()                                                 │
│        .filter(c -> quickFilter(c, task))  // Uses task data!         │
│        .collect(Collectors.toList())                                   │
│                                                                         │
│    Step 4: Feature Engineering (COMBINES TASK + CANDIDATE DATA)        │
│    ───────────────────────────────────────────────────────────────     │
│    List<CandidateFeatures> engineered =                                │
│        candidates.stream()                                             │
│            .map(c -> featureEngineering.engineerFeatures(              │
│                c,      // Candidate data                               │
│                task,   // 🎯 TASK DATA USED HERE!                      │
│                baseMatch                                               │
│            ))                                                           │
│                                                                         │
│    What's in CandidateFeatures:                                        │
│    • baseSkillMatchScore (calculated from task.requiredSkills)        │
│    • relatedSkillsScore (based on task.requiredSkills)                │
│    • learningPotentialScore (task difficulty considered)              │
│    • domainExperienceBonus (task type considered)                     │
│    • taskPriority (from task.priority) ✅                              │
│    • taskDifficulty (from task.difficulty) ✅                          │
│    • estimatedHours (from task.estimatedHours) ✅                      │
│    • requiredSkills (from task.requiredSkills) ✅                      │
│                                                                         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. JAVA: callMLService() - Line 456 in AIRecommendationService.java   │
│                                                                         │
│    Prepare Request Payload:                                            │
│    ───────────────────────────                                         │
│    Map<String, Object> taskData = new HashMap<>();                     │
│    taskData.put("task_id", task.getTaskId());                          │
│    taskData.put("priority", task.getPriority());           ✅          │
│    taskData.put("difficulty", task.getDifficulty());       ✅          │
│    taskData.put("estimated_hours", task.getEstimatedHours()); ✅       │
│    taskData.put("required_skills",                         ✅          │
│        new ArrayList<>(task.getRequiredSkills().keySet()));            │
│                                                                         │
│    MLPredictionRequest request = MLPredictionRequest.builder()         │
│        .taskId(task.getTaskId())                                       │
│        .taskData(taskData)                    // 🎯 TASK DATA SENT!    │
│        .candidates(candidatesWithFeatures)    // With task features!   │
│        .build();                                                        │
│                                                                         │
│    Send to ML Service:                                                 │
│    ──────────────────                                                  │
│    MLPredictionResponse response =                                     │
│        mlServiceClient.predictCandidates(request);                     │
│                                                                         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. PYTHON: /api/ml/predict-candidates - model_server.py                │
│                                                                         │
│    Receives Request:                                                   │
│    ───────────────                                                     │
│    {                                                                   │
│        "task_id": "xxx",                                               │
│        "task_data": {              // 🎯 TASK DATA RECEIVED            │
│            "priority": "URGENT",                                       │
│            "difficulty": "HARD",                                       │
│            "estimated_hours": 40,                                      │
│            "required_skills": ["node.js", "payment gateway"]           │
│        },                                                              │
│        "candidates": [                                                 │
│            {                                                           │
│                "userId": "...",                                        │
│                "baseSkillMatchScore": 0.41,  // Already calculated    │
│                "taskPriority": "URGENT",     // Task data embedded    │
│                "taskDifficulty": "HARD",     // Task data embedded    │
│                "estimatedHours": 40.0,       // Task data embedded    │
│                "requiredSkills": [...]       // Task data embedded    │
│            }                                                           │
│        ]                                                               │
│    }                                                                   │
│                                                                         │
│    How Task Data Is Used:                                             │
│    ─────────────────────────                                          │
│                                                                         │
│    1. Pre-Filtering (Lines 400-520):                                  │
│       task_priority = df_candidates['task_priority']  ✅              │
│       task_difficulty = df_candidates['task_difficulty']  ✅          │
│                                                                         │
│       if task_priority in ['HIGH', 'URGENT'] and                      │
│          task_difficulty == 'HARD':                                   │
│           min_performance = 0.40  # Stricter thresholds               │
│                                                                         │
│    2. Feature Preparation (Lines 1047-1158):                          │
│       df['priority'] = df['task_priority']  ✅                        │
│       df['difficulty'] = df['task_difficulty']  ✅                    │
│       df['priority_encoded'] = priority_map[df['priority']]           │
│       df['difficulty_encoded'] = difficulty_map[df['difficulty']]     │
│                                                                         │
│    3. ML Model Prediction (Line 597):                                 │
│       predictions = ml_model.predict(X)                               │
│       # X contains priority_encoded, difficulty_encoded, etc.         │
│                                                                         │
│    4. Rule-Based Adjustments (hybrid_recommender.py):                 │
│       if task is HARD and seniority < MID_LEVEL:                      │
│           penalty_multiplier *= 0.3  # Uses task difficulty           │
│                                                                         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. PYTHON: Return ML Predictions                                       │
│    {                                                                   │
│        "predictions": [                                                │
│            {                                                           │
│                "userId": "...",                                        │
│                "mlConfidenceScore": 0.7845,  // ML prediction         │
│                "featureImportance": {...},                            │
│                "explanation": "...",                                   │
│                "fallback": false                                       │
│            }                                                           │
│        ],                                                              │
│        "model_version": "1.0",                                         │
│        "processing_time_ms": 150                                       │
│    }                                                                   │
│                                                                         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 6. JAVA: Apply Business Rules & Return                                 │
│    Location: AIRecommendationService.applyBusinessRules()             │
│                                                                         │
│    Combines:                                                           │
│    • ML confidence score (from Python)                                │
│    • Business boosts (department alignment, availability, etc.)       │
│                                                                         │
│    Returns to Client:                                                  │
│    List<AssignmentRecommendation> with ranked candidates              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Task Data Usage Summary

### **Task Data IS Sent to ML Service in 3 Forms:**

| Form | Where | How Used |
|------|-------|----------|
| **1. In `task_data` field** | Lines 457-464 in AIRecommendationService.java | Used for logging and context |
| **2. Embedded in each candidate** | Lines 370-390 in model_server.py | Used for pre-filtering thresholds |
| **3. As encoded features** | Lines 1070-1078 in model_server.py | Used in ML model prediction |

### **How Task Data Influences Predictions:**

```python
# 1. Pre-Filtering (model_server.py Lines 420-450)
if task_priority in ['HIGH', 'URGENT'] and task_difficulty == 'HARD':
    min_performance = 0.40      # Task data determines thresholds
    min_seniority = 'MID_LEVEL'  # Task difficulty affects seniority requirement

# 2. Feature Engineering (model_server.py Lines 1070-1078)
df['priority_encoded'] = priority_map[task_priority]      # Encoded for ML
df['difficulty_encoded'] = difficulty_map[task_difficulty] # Encoded for ML

# 3. ML Model Input (hybrid_recommender.py)
X_scaled = feature_scaler.transform(processed_features)
# Includes: priority_encoded, difficulty_encoded, estimated_hours
predictions = content_model.predict_proba(X_scaled)

# 4. Rule-Based Penalties (hybrid_recommender.py Lines 1320-1335)
if priority in ['HIGH', 'URGENT'] and difficulty == 'HARD':
    if seniority_level < 3:  # Task data affects penalties
        penalty_multiplier *= 0.3
```

---

## 🎯 Why This Architecture?

### **Advantages:**

1. **✅ Feature Engineering in Java**
   - Java has direct database access
   - Can calculate semantic skill matching efficiently
   - Reduces Python service dependencies

2. **✅ ML Prediction in Python**
   - Python has trained ML models
   - Better for numerical computations
   - Easier to update models

3. **✅ Task Data Embedded in Candidates**
   - Each candidate carries task context
   - Allows batch processing
   - Simplifies ML service API

4. **✅ Hybrid Approach**
   - Combines ML predictions with business rules
   - More flexible than pure ML
   - Easier to debug and explain

### **Trade-offs:**

| Aspect | Current Approach | Alternative |
|--------|------------------|-------------|
| **Task Data** | Embedded in each candidate | Separate task + candidates |
| **Pro** | Self-contained, easy to process | Clearer separation of concerns |
| **Con** | Data duplication | More complex API contract |
| **Pro** | Works well for batch predictions | Easier to validate |
| **Con** | Harder to see at first glance | Would require code changes |

---

## 🔄 Complete Request/Response Example

### **Request to Java API:**
```http
POST /ai/recommendations/task/850e8400-e29b-41d4-a716-446655440013
```

### **Java Processing:**
```java
// 1. Get task from database
TaskProfile task = getTaskProfile("850e8400-...");
// task.priority = "URGENT"
// task.difficulty = "HARD"
// task.requiredSkills = {"node.js": 4, "payment gateway": 3}

// 2. Get candidates
List<UserProfile> candidates = getSmartCandidates(task);

// 3. Engineer features (combines task + candidate data)
List<CandidateFeatures> features = candidates.stream()
    .map(c -> engineerFeatures(c, task, calculateBaseMatch(task, c)))
    .collect(Collectors.toList());
```

### **Request to Python API:**
```json
POST /api/ml/predict-candidates
{
    "task_id": "850e8400-...",
    "task_data": {
        "priority": "URGENT",
        "difficulty": "HARD",
        "estimated_hours": 40,
        "required_skills": ["node.js", "payment gateway"]
    },
    "candidates": [
        {
            "userId": "user-1",
            "baseSkillMatchScore": 0.60,
            "taskPriority": "URGENT",
            "taskDifficulty": "HARD",
            "estimatedHours": 40.0,
            "performanceScore": 0.90,
            "seniorityLevel": "SENIOR"
        }
    ]
}
```

### **Python ML Processing:**
```python
# 1. Pre-filter using task data
if task_priority == 'URGENT' and task_difficulty == 'HARD':
    if candidate.performance < 0.40:
        exclude(candidate)

# 2. Prepare features with task data
X['priority_encoded'] = encode(task_priority)
X['difficulty_encoded'] = encode(task_difficulty)

# 3. ML prediction
ml_scores = ml_model.predict(X)  # Uses trained model

# 4. Adjust based on task + candidate
if task_difficulty == 'HARD' and candidate.seniority == 'INTERN':
    ml_scores *= 0.3  # Penalty
```

### **Response from Python:**
```json
{
    "predictions": [
        {
            "userId": "user-1",
            "mlConfidenceScore": 0.7845,
            "featureImportance": {
                "performance_score": 0.285,
                "base_skill_match_score": 0.231
            },
            "fallback": false
        }
    ],
    "model_version": "1.0"
}
```

### **Final Response from Java:**
```json
{
    "result": [
        {
            "rank": 1,
            "userId": "user-1",
            "userName": "HP Anh",
            "overallScore": 0.82,
            "mlConfidenceScore": 0.7845,
            "explanation": "Excellent match - driven by Performance Score, Base Skill Match",
            "boostReasons": ["Department Alignment", "High Availability"]
        }
    ]
}
```

---

## 📝 Summary

### **Question 1: Does the ML API use trained models?**
**✅ YES**
- Line 597 in `model_server.py`: `predictions = ml_model.predict(X)`
- Uses Random Forest classifier trained on historical data
- Combines with collaborative filtering and rule-based adjustments

### **Question 2: Is task data sent to ML service?**
**✅ YES**
- Sent in `task_data` field (Lines 457-464 in AIRecommendationService.java)
- Embedded in each candidate's features
- Used for:
  - Pre-filtering thresholds
  - ML model features (priority_encoded, difficulty_encoded)
  - Rule-based penalties

### **Why This Architecture?**
- ✅ Separates concerns: Feature engineering (Java) vs ML prediction (Python)
- ✅ Reduces coupling: Python service doesn't need database access
- ✅ Flexibility: Easy to update ML models without Java changes
- ✅ Performance: Batch processing with embedded task context

---

**Last Updated:** December 2, 2025  
**System Version:** ML Model v1.0, Hybrid Recommendation System

