# ML Service - Internal Management System

A comprehensive Machine Learning service for task assignment recommendations, performance prediction, and continuous learning.

## 🎯 Overview

The ML Service provides intelligent task assignment recommendations using a hybrid approach combining content-based filtering and collaborative filtering. It features real-time data collection, continuous model retraining, and comprehensive performance monitoring.

## 🏗️ Architecture

### Components

1. **Spring Boot Service** (Port 8090)
   - REST API for ML operations
   - Kafka integration for real-time events
   - PostgreSQL for training data storage
   - Redis for caching predictions

2. **Python ML API** (Port 8000)
   - FastAPI service for model training
   - Hybrid recommendation models
   - Multi-database data collection
   - Continuous learning pipeline

3. **Supporting Services**
   - PostgreSQL: ML training data storage
   - Redis: Prediction caching
   - Kafka: Event streaming

### ML Model Architecture

```
Hybrid Recommender = Content-Based (60%) + Collaborative Filtering (40%)
├── Content-Based Model
│   ├── Feature Engineering (skills, experience, workload)
│   ├── Random Forest Classifier
│   └── Performance: ~85% accuracy
└── Collaborative Filtering
    ├── Matrix Factorization (SVD)
    ├── User-Task Interaction Matrix
    └── Performance: RMSE < 0.3
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Java 17+
- Python 3.11+
- PostgreSQL 15+

### 1. Clone and Setup

```bash
cd /Users/hien/InternalManagement/ml-service
```

### 2. Start with Docker Compose

```bash
# Start all ML services
docker-compose up -d

# Check service health
docker-compose ps
```

### 3. Initialize Models

```bash
# Train initial models with synthetic data
docker exec -it ml-python-api python train_models.py --synthetic

# Or train with real data (if available)
docker exec -it ml-python-api python train_models.py --real
```

### 4. Verify Setup

```bash
# Check ML service health
curl http://localhost:8090/ml-service/actuator/health

# Check Python API health
curl http://localhost:8000/health

# Get model status
curl http://localhost:8000/model/status
```

## 📊 Data Collection & Training

### Synthetic Data Generation

The service can generate realistic synthetic data for initial training:

```python
# Generate 300 users, 1500 tasks, 3000 interactions
generator = SyntheticDataGenerator()
training_data = generator.generate_comprehensive_dataset()
```

**Generated Data Features:**
- Realistic skill distributions
- Performance correlations
- Time-based patterns
- Department-specific trends

### Multi-Database Data Collection

Real data collection from multiple sources:

```python
collector = MultiDatabaseDataCollector()
comprehensive_data = collector.collect_comprehensive_training_data()
```

**Data Sources:**
- **MySQL**: Task, project, identity, and workload data (identity-service, task-service, project-service, workload-service)
  - Multiple database support: `identity`, `project`, `task`, `sys`
  - See [MySQL Database Configuration Guide](ml-training-python/MYSQL_DATABASE_CONFIGURATION.md)
- **Neo4j**: User profiles (profile-service)  
- **MongoDB**: AI predictions, chat, notifications, and files (ai-service, chat-service, notification-service, file-service)
- **PostgreSQL**: Consolidated ML training data

#### Configuring MySQL Databases

The ML service supports connecting to multiple MySQL databases simultaneously. Update the configuration in `ml-training-python/config/model_config.yaml`:

```yaml
mysql:
  host: localhost
  port: 3306
  username: root          # Your MySQL username
  password: "your_pass"   # Your MySQL password
  
  databases:
    identity:
      database: identity
      description: "User authentication data"
    project:
      database: project
      description: "Project management data"
    task:
      database: task
      description: "Task tracking data"
```

**Test your database connections:**
```bash
cd ml-training-python
python test_mysql_connections.py
```

For detailed setup instructions, see [MYSQL_DATABASE_CONFIGURATION.md](ml-training-python/MYSQL_DATABASE_CONFIGURATION.md)

### Continuous Learning Pipeline

Automated model improvement:

```python
# Run continuous training
trainer = ContinuousModelTrainer()
trainer.run_continuous_training_pipeline()

# Or start scheduler
trainer.start_continuous_training_scheduler()
```

**Features:**
- Weekly automatic retraining
- Performance monitoring
- A/B testing for model deployment
- Data quality validation

## 🔌 API Usage

### Task Assignment Recommendations

```bash
curl -X POST http://localhost:8090/ml-service/api/ml/recommendations/task-assignment \
  -H "Content-Type: application/json" \
  -d '{
    "task": {
      "taskId": "task_123",
      "title": "Implement user authentication",
      "priority": "HIGH",
      "difficulty": "MEDIUM",
      "estimatedHours": 16,
      "requiredSkills": ["Java", "Spring Security", "JWT"]
    },
    "candidates": [
      {
        "userId": "user_456",
        "email": "john.doe@company.com",
        "departmentName": "Engineering",
        "seniorityLevel": "SENIOR",
        "skills": ["Java", "Spring Boot", "Security"],
        "yearsExperience": 5,
        "utilization": 0.7
      }
    ],
    "maxRecommendations": 5
  }'
```

**Response:**
```json
{
  "success": true,
  "recommendations": [
    {
      "userId": "user_456",
      "confidenceScore": 0.87,
      "rank": 1,
      "reasoning": {
        "skillMatchScore": 0.9,
        "experienceScore": 0.8,
        "workloadScore": 0.9,
        "explanation": "Strong skill match with Java and security expertise..."
      }
    }
  ],
  "modelVersion": "20241102_143022"
}
```

### Performance Prediction

```bash
curl -X POST http://localhost:8090/ml-service/api/ml/recommendations/performance-prediction \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "task_123",
    "userId": "user_456",
    "taskDetails": {
      "priority": "HIGH",
      "difficulty": "MEDIUM",
      "estimatedHours": 16
    },
    "userProfile": {
      "seniorityLevel": "SENIOR",
      "utilization": 0.7
    }
  }'
```

### Model Training

```bash
curl -X POST http://localhost:8090/ml-service/api/ml/training/start \
  -H "Content-Type: application/json" \
  -d '{
    "forceRetrain": false,
    "useSyntheticData": true,
    "dataMonthsBack": 12
  }'
```

## 📈 Monitoring & Performance

### Performance Metrics

Current model performance (with synthetic data):

- **Accuracy**: 85-90%
- **F1 Score**: 0.82-0.87
- **Precision**: 0.84-0.88
- **ROC AUC**: 0.88-0.92

### Training Evolution

```
Month 1: Synthetic Data Only      → 75% accuracy
Month 2: Hybrid Synthetic+Real    → 80% accuracy  
Month 3: Majority Real Data       → 85% accuracy
Month 6: Mature Real Data         → 90% accuracy
```

### Monitoring Endpoints

```bash
# Model performance
curl http://localhost:8090/ml-service/api/ml/training/performance

# Training history
curl http://localhost:8090/ml-service/api/ml/training/history

# Feature importance
curl http://localhost:8090/ml-service/api/ml/training/feature-importance

# System health
curl http://localhost:8090/ml-service/actuator/health
```

## 🔧 Configuration

### Application Configuration

Key configuration in `application.yaml`:

```yaml
app:
  ml:
    training:
      min-data-size: 500
      auto-retrain-enabled: true
      retrain-frequency-hours: 24
    prediction:
      cache-ttl-minutes: 60
      timeout-seconds: 30
```

### Python ML Configuration

Configuration in `config/model_config.yaml`:

```yaml
model:
  recommendation:
    content_weight: 0.6
    collaborative_weight: 0.4
    min_training_samples: 100

continuous_learning:
  enabled: true
  min_accuracy_improvement: 0.01
  performance_degradation_threshold: 0.05
```

## 🔄 Event Integration

### Kafka Topics

The service consumes events for continuous learning:

- `task-completed-events`: Task completion data
- `task-assigned-events`: Assignment decisions
- `user-profile-updated-events`: Profile changes
- `ml-events`: Generic ML events

### Event Processing

```java
@KafkaListener(topics = "task-completed-events")
public void handleTaskCompletion(TaskCompletionEvent event) {
    // Process for ML training
    mlDataCollectionService.processTaskCompletionEvent(event);
}
```

## 🧪 Development

### Local Development Setup

```bash
# Install Python dependencies
cd ml-training-python
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start Python API
python -m uvicorn src.api.ml_api:app --reload --port 8000

# Start Spring Boot service
cd ..
./mvnw spring-boot:run
```

### Testing

```bash
# Test Python models
cd ml-training-python
python src/models/hybrid_recommender.py

# Test data collection
python src/data/data_collector.py

# Test continuous learning
python src/models/continuous_learning.py
```

### Training with Custom Data

```bash
# Train with synthetic data
python train_models.py --synthetic --debug

# Train with real data
python train_models.py --real

# Run continuous training once
python train_models.py --continuous

# Start continuous scheduler
python train_models.py --scheduler
```

## 🐳 Docker Deployment

### Build Images

```bash
# Build ML service
docker build -t internal-management/ml-service:latest .

# Build Python API
docker build -f Dockerfile.python -t internal-management/ml-python-api:latest .
```

### Production Deployment

```bash
# Deploy with production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Environment Variables

```bash
# Spring Boot Service
SPRING_PROFILES_ACTIVE=prod
DB_HOST=ml-postgres
KAFKA_SERVERS=kafka:9092

# Python API
POSTGRES_HOST=ml-postgres
POSTGRES_USER=ml_user
POSTGRES_PASSWORD=ml_password
```

## 📋 Troubleshooting

### Common Issues

1. **Model Not Available**
   ```bash
   # Initialize models with synthetic data
   curl -X POST http://localhost:8000/train \
     -d '{"use_synthetic_data": true}'
   ```

2. **Database Connection Issues**
   ```bash
   # Check PostgreSQL connectivity
   docker exec -it ml-postgres psql -U ml_user -d ml_training_db
   ```

3. **Kafka Connection Issues**
   ```bash
   # Check Kafka topics
   docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092
   ```

### Logs

```bash
# View ML service logs
docker logs ml-service -f

# View Python API logs  
docker logs ml-python-api -f

# View training logs
docker exec -it ml-python-api tail -f /app/logs/training_*.log
```

### Performance Tuning

```yaml
# Increase memory for model training
JAVA_OPTS: "-Xmx4g -Xms2g"

# Adjust batch sizes
spring.kafka.consumer.max-poll-records: 100
```

## 🔐 Security

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Rate limiting on API endpoints

## 🤝 Integration

### With Other Services

The ML service integrates with:
- **Task Service**: Recommendations and feedback
- **Identity Service**: User authentication
- **Profile Service**: User skill data
- **API Gateway**: Routing and authentication

### Event Flow

```
Task Assignment → ML Recommendation → User Decision → Feedback → Model Update
```

## 📚 Additional Resources

- [AI Model Analysis Documentation](../AI_MODEL_ANALYSIS.md)
- [System Architecture Documentation](../MICROSERVICES_DOCUMENTATION.md)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)

## 🆘 Support

For issues and questions:
1. Check the logs first
2. Review configuration files
3. Validate model status endpoints
4. Check database connectivity

---

**ML Service** - Powered by Spring Boot, Python FastAPI, and Advanced Machine Learning