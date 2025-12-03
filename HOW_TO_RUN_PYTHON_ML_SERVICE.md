# 🚀 How to Run Python ML Service for Java Integration

## 📋 Overview

This guide explains how to start the Python ML service so that the Java ML-service can call it at `http://localhost:8000` to get real ML recommendations.

**Date**: November 15, 2025  
**Python Service Port**: 8000  
**Java ML-Service Port**: 8091  
**Status**: ✅ Ready to Use

---

## 🎯 Quick Start

### **Option 1: Using Startup Script** (RECOMMENDED ✅)

```bash
cd /Users/phamanh/InternalManagement/ml-service/ml-training-python
./start_python_ml_service.sh
```

This script will:
- ✅ Set up Python path correctly
- ✅ Check and install dependencies
- ✅ Create config if missing
- ✅ Start FastAPI server on port 8000

---

### **Option 2: Using uvicorn directly**

```bash
cd /Users/phamanh/InternalManagement/ml-service/ml-training-python

# Export Python path
export PYTHONPATH="${PYTHONPATH}:$(pwd)/src:$(pwd)"

# Start server
python3 -m uvicorn src.api.model_server:app --host 0.0.0.0 --port 8000 --reload
```

---

### **Option 3: Using Python directly**

```bash
cd /Users/phamanh/InternalManagement/ml-service/ml-training-python

# Set Python path and run
PYTHONPATH=.:src python3 src/api/model_server.py
```

---

## ✅ Verify Python Service is Running

### **1. Check Health Endpoint**

```bash
curl http://localhost:8000/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "last_training_date": "2025-11-15T10:30:00",
  "model_version": "v1.0.0",
  "performance_metrics": {
    "accuracy": 0.89,
    "f1": 0.87
  },
  "uptime_seconds": 120.5
}
```

---

### **2. Check Root Endpoint**

```bash
curl http://localhost:8000/
```

**Expected Response**:
```json
{
  "message": "ML Model Serving API",
  "version": "1.0.0",
  "status": "running",
  "uptime_seconds": 45.2
}
```

---

### **3. Test Recommendation Endpoint**

```bash
curl -X POST http://localhost:8000/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "task": {
      "task_id": "test-123",
      "title": "Build ML API",
      "priority": "HIGH",
      "difficulty": "HARD",
      "estimated_hours": 40,
      "required_skills": ["Python", "ML", "FastAPI"]
    },
    "candidates": [
      {
        "user_id": "user-456",
        "email": "alice@example.com",
        "skills": ["Python", "TensorFlow", "ML", "FastAPI"],
        "years_experience": 5.0,
        "seniority_level": "SENIOR",
        "utilization": 0.6
      }
    ],
    "max_recommendations": 5
  }'
```

**Expected Response**:
```json
[
  {
    "user_id": "user-456",
    "email": "alice@example.com",
    "confidence_score": 0.87,
    "content_score": 0.52,
    "collaborative_score": 0.35,
    "rank": 1,
    "reasoning": {
      "skill_match_score": 1.0,
      "experience_score": 0.5,
      "workload_score": 0.4,
      "explanation": "Excellent overall fit; strong skill match; adequate experience; moderate workload"
    }
  }
]
```

---

## 🔄 Complete Integration Flow

### **Flow Diagram**

```
┌─────────────┐
│   Client    │ POST /api/ai/recommendations/task/{taskId}
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│   AI-Service        │ (Java - Port 8089)
│   AIRecommendation  │
│   Service           │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  ML-Service (Java)  │ (Port 8091)
│  Recommendation     │
│  Service            │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ PythonMLClient      │ POST http://localhost:8000/recommend
│ Service             │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Python ML Service               │ (Port 8000) ✅
│ model_server.py                 │
├─────────────────────────────────┤
│ • FastAPI REST API              │
│ • hybrid_recommender.py         │
│ • Random Forest (200 trees)     │
│ • SVD Collaborative Filtering   │
│ • 52 engineered features        │
└─────────────────────────────────┘
       │
       ▼
    Response flows back through the stack
```

---

## 📝 Step-by-Step Setup

### **Step 1: Start Python ML Service**

```bash
# Terminal 1
cd /Users/phamanh/InternalManagement/ml-service/ml-training-python
./start_python_ml_service.sh
```

**Expected Output**:
```
==========================================
Starting Python ML Service
==========================================
Date: Fri Nov 15 13:45:00 +07 2025
Working Directory: /Users/phamanh/InternalManagement/ml-service/ml-training-python

Python version:
Python 3.11.5

✅ All dependencies installed

==========================================
Starting FastAPI server on http://localhost:8000
==========================================

API Endpoints:
  - GET  http://localhost:8000/          (API Info)
  - GET  http://localhost:8000/health    (Health Check)
  - POST http://localhost:8000/recommend (Get Recommendations)
  - POST http://localhost:8000/train     (Train Model)

Press Ctrl+C to stop the server
==========================================

INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Starting ML API server...
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

---

### **Step 2: Verify Python Service**

```bash
# Terminal 2
curl http://localhost:8000/health
```

**If you see health response → Python service is running!** ✅

---

### **Step 3: Start Java ML-Service**

```bash
# Terminal 3
cd /Users/phamanh/InternalManagement/ml-service
mvn spring-boot:run
```

**Expected Output**:
```
2025-11-15 13:46:00 - Starting MLServiceApplication
2025-11-15 13:46:02 - Started MLServiceApplication in 2.5 seconds
2025-11-15 13:46:02 - Tomcat started on port(s): 8091 (http)
2025-11-15 13:46:02 - Python ML Client initialized with URL: http://localhost:8000
```

---

### **Step 4: Test End-to-End Integration**

```bash
# Terminal 4 - Test through Java ML-Service
curl -X POST http://localhost:8091/ml-service/ml/recommendations/task-assignment \
  -H "Content-Type: application/json" \
  -d '{
    "task": {
      "taskId": "task-123",
      "title": "Build Feature",
      "priority": "HIGH",
      "difficulty": "HARD",
      "estimatedHours": 40.0,
      "requiredSkills": ["Java", "Spring", "PostgreSQL"]
    },
    "maxRecommendations": 5,
    "useAIRecommendations": true
  }'
```

---

## 📊 Expected Log Output

### **When Java Calls Python ML**

**Python ML Service Logs**:
```
INFO:     127.0.0.1:52134 - "POST /recommend HTTP/1.1" 200 OK
2025-11-15 13:47:15 [info] Getting recommendations for task task-123
2025-11-15 13:47:15 [info] Generated 5 recommendations
```

**Java ML-Service Logs**:
```
2025-11-15 13:47:15 - Generating ML recommendations for task: task-123
2025-11-15 13:47:15 - 🤖 Calling Python ML Service for predictions...
2025-11-15 13:47:15 - ==================================================
2025-11-15 13:47:15 - Calling Python ML Service
2025-11-15 13:47:15 - Endpoint: http://localhost:8000/recommend
2025-11-15 13:47:15 - Task: task-123 (Build Feature)
2025-11-15 13:47:15 - Candidates: 8
2025-11-15 13:47:15 - ✅ Python ML Service Response:
2025-11-15 13:47:15 -    Status: 200 OK
2025-11-15 13:47:15 -    Duration: 156ms
2025-11-15 13:47:15 -    Model Version: v1.0.0
2025-11-15 13:47:15 -    Model Confidence: 0.89
2025-11-15 13:47:15 - ✅ Successfully received 8 ML recommendations from Python
2025-11-15 13:47:15 - === PYTHON ML PREDICTIONS ===
2025-11-15 13:47:15 - PYTHON_ML[1] - UserID: user-456, Confidence: 0.87
2025-11-15 13:47:15 - PYTHON_ML[2] - UserID: user-789, Confidence: 0.74
...
```

---

## 🔧 Troubleshooting

### **Issue 1: Port 8000 already in use**

**Error**:
```
ERROR: [Errno 48] Address already in use
```

**Solution**:
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or use different port
python3 -m uvicorn src.api.model_server:app --port 8001
```

---

### **Issue 2: Module not found errors**

**Error**:
```
ModuleNotFoundError: No module named 'src'
```

**Solution**:
```bash
# Make sure you're in the correct directory
cd /Users/phamanh/InternalManagement/ml-service/ml-training-python

# Set PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:$(pwd)/src:$(pwd)"

# Or use the startup script
./start_python_ml_service.sh
```

---

### **Issue 3: ML model not loaded**

**Error** (when calling /recommend):
```json
{
  "detail": "ML model not loaded. Please train model first."
}
```

**Solution**:
```bash
# Train the model first
curl -X POST http://localhost:8000/train \
  -H "Content-Type: application/json" \
  -d '{
    "use_synthetic_data": true,
    "force_retrain": true
  }'

# Wait for training to complete (check status)
curl http://localhost:8000/training/status

# Once status is "completed", try /recommend again
```

---

### **Issue 4: Java can't connect to Python**

**Java Error**:
```
❌ Failed to call Python ML service: Connection refused
```

**Check**:
```bash
# 1. Verify Python service is running
curl http://localhost:8000/health

# 2. Check if firewall is blocking
telnet localhost 8000

# 3. Check Java configuration
cat ml-service/src/main/resources/application.properties
# Should have: ml.python.url=http://localhost:8000
```

---

## 📁 File Structure

```
ml-service/ml-training-python/
├── start_python_ml_service.sh    ← START SCRIPT ✅
├── src/
│   ├── api/
│   │   └── model_server.py        ← MAIN API (Port 8000)
│   ├── models/
│   │   ├── hybrid_recommender.py  ← ML Model
│   │   └── continuous_learning.py
│   └── data/
│       └── data_collector.py
├── models/                         ← Trained models stored here
│   ├── content_model.pkl
│   ├── collaborative_model.pkl
│   └── model_metadata.pkl
└── config/
    └── model_config.yaml           ← Configuration
```

---

## 🎯 Quick Reference Commands

### **Start Python ML Service**
```bash
cd /Users/phamanh/InternalManagement/ml-service/ml-training-python
./start_python_ml_service.sh
```

### **Check Health**
```bash
curl http://localhost:8000/health
```

### **Train Model**
```bash
curl -X POST http://localhost:8000/train -H "Content-Type: application/json" -d '{"use_synthetic_data":true}'
```

### **Stop Service**
```
Press Ctrl+C in the terminal running the service
```

### **Check Running Services**
```bash
# Check Python ML Service (port 8000)
lsof -i :8000

# Check Java ML-Service (port 8091)
lsof -i :8091

# Check AI-Service (port 8089)
lsof -i :8089
```

---

## 📋 Checklist

Before making a recommendation request, ensure:

- [ ] ✅ Python ML Service running on port 8000
- [ ] ✅ `/health` endpoint returns "healthy"
- [ ] ✅ Model is loaded (model_loaded: true)
- [ ] ✅ Java ML-Service running on port 8091
- [ ] ✅ Java can reach Python (check logs for "Calling Python ML Service")
- [ ] ✅ AI-Service running on port 8089

---

## 🚀 Production Deployment

### **Using Docker** (Recommended for production)

The Python ML service can run in Docker:

```bash
# Already configured in docker-compose.yml
docker-compose up ml-service
```

**Port mapping**: `8091:8000` (container port 8000 → host port 8091)

**Note**: For development, it's easier to run Python directly using the script.

---

## 📈 Performance Monitoring

### **Monitor Python ML Service**

```bash
# Check response time
time curl http://localhost:8000/recommend -X POST -H "Content-Type: application/json" -d @test-request.json

# Monitor logs in real-time
tail -f logs/ml-service.log

# Check process status
ps aux | grep model_server
```

---

## ✅ Success Indicators

You'll know the integration is working when you see:

1. **Python Logs**:
   - `INFO: Uvicorn running on http://0.0.0.0:8000`
   - `POST /recommend HTTP/1.1" 200 OK`

2. **Java Logs**:
   - `Python ML Client initialized with URL: http://localhost:8000`
   - `✅ Python ML Service Response: 200 OK`
   - `✅ Successfully received X ML recommendations from Python`

3. **Test Response**:
   - Contains `confidence_score`, `content_score`, `collaborative_score`
   - Has `model_version` in response
   - Recommendations are ranked

---

**Status**: ✅ **Ready to Use**  
**Last Updated**: November 15, 2025  
**Python Service**: Port 8000  
**Java Integration**: Complete

---

## 🎉 You're All Set!

Just run:
```bash
./start_python_ml_service.sh
```

And your Java ML-service will be able to call Python ML at `http://localhost:8000/recommend` for real ML predictions! 🚀

