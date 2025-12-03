# ML Training Scheduler - Docker Setup

## Overview
The ML Training Scheduler automatically syncs with databases and trains models based on data changes, eliminating the need to manually run `python train_models.py --scheduler`.

## Automatic Training Triggers

The scheduler automatically triggers model retraining when:

1. **Time-based**: 7+ days since last training
2. **Data-based**: 100+ new training records in database
3. **Performance-based**: Model accuracy drops below threshold
4. **Scheduled**: Daily checks at 2:00 AM, Weekly retraining on Sundays at 3:00 AM

## Quick Start

### 1. Start the ML Scheduler Service

```bash
# Navigate to ML service directory
cd /Users/phamanh/InternalManagement/ml-service

# Start the scheduler (along with other ML services)
docker-compose up -d ml-training-scheduler

# Or start all ML services including scheduler
docker-compose up -d
```

### 2. Monitor Scheduler Status

```bash
# Check if scheduler is running
./monitor_scheduler.sh

# View live scheduler logs
docker logs -f ml-training-scheduler

# Check container health
docker ps --filter name=ml-training-scheduler
```

### 3. Manual Training (if needed)

```bash
# Trigger immediate training
docker exec ml-training-scheduler python train_models.py --real --config config/docker_config.yaml

# Check training status
docker exec ml-training-scheduler python -c "
from models.continuous_learning import ContinuousModelTrainer
trainer = ContinuousModelTrainer('config/docker_config.yaml')
print(trainer.get_model_performance_history(7))
"
```

## Configuration

The scheduler uses `ml-training-python/config/docker_config.yaml` which contains:

- Database connections (PostgreSQL, MySQL, Neo4j, MongoDB)
- Training parameters
- Continuous learning settings
- Kafka event streaming configuration

## Database Connections

The scheduler automatically connects to:

- **PostgreSQL** (ml-postgres): ML training data storage
- **MySQL** (host.docker.internal): Identity, project, task services
- **Neo4j** (host.docker.internal): Relationship data
- **MongoDB** (host.docker.internal): AI service logs

## Monitoring & Logs

### View Scheduler Logs
```bash
# Real-time logs
docker logs -f ml-training-scheduler

# Last 100 lines
docker logs --tail 100 ml-training-scheduler

# Logs with timestamps
docker logs -t ml-training-scheduler
```

### Check Training History
```bash
# Connect to ML postgres to see training history
docker exec -it ml-postgres psql -U ml_user -d ml_training_db -c "
SELECT training_date, model_version, accuracy, f1_score, deployment_status 
FROM model_training_history 
ORDER BY training_date DESC 
LIMIT 10;"
```

### Health Check
The scheduler has built-in health checks that run every 60 seconds:
```bash
docker inspect ml-training-scheduler --format='{{.State.Health.Status}}'
```

## Troubleshooting

### Scheduler Not Starting
```bash
# Check container logs for errors
docker logs ml-training-scheduler

# Restart the service
docker-compose restart ml-training-scheduler

# Rebuild if needed
docker-compose build ml-training-scheduler
docker-compose up -d ml-training-scheduler
```

### Database Connection Issues
```bash
# Test database connections
docker exec ml-training-scheduler python -c "
import sys
sys.path.append('src')
from data.data_collector import MultiDatabaseDataCollector
collector = MultiDatabaseDataCollector('config/docker_config.yaml')
print(collector.test_connections())
"
```

### Training Failures
```bash
# Check training logs
docker exec ml-training-scheduler ls -la /var/log/ml-training/

# Manual training test
docker exec ml-training-scheduler python train_models.py --synthetic --config config/docker_config.yaml
```

## Key Benefits

✅ **Automatic**: No manual intervention needed
✅ **Continuous**: Monitors data changes in real-time
✅ **Resilient**: Automatic restarts and error handling
✅ **Monitored**: Built-in health checks and logging
✅ **Scalable**: Can handle multiple database sources
✅ **Configurable**: Easy to adjust training schedules and thresholds

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 ML Scheduler                    │
│  ┌─────────────┐  ┌──────────────────────────┐  │
│  │  Scheduler  │  │    Data Collector        │  │
│  │   (Cron)    │  │  - PostgreSQL            │  │
│  │             │  │  - MySQL (Identity/Task) │  │
│  │  Daily 2AM  │  │  - Neo4j (Relationships) │  │
│  │ Weekly Sun  │  │  - MongoDB (AI logs)     │  │
│  └─────────────┘  └──────────────────────────┘  │
│         │                    │                  │
│         ▼                    ▼                  │
│  ┌─────────────┐  ┌──────────────────────────┐  │
│  │   Trainer   │  │    Model Deployment      │  │
│  │ (Python ML) │  │  - Version Management    │  │
│  │             │  │  - Performance Tracking  │  │
│  │ - Hybrid    │  │  - A/B Testing          │  │
│  │ - Content   │  │  - Rollback Support     │  │
│  │ - Collab    │  │                          │  │
│  └─────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

The ML Training Scheduler is now fully automated and will handle all model training and deployment without manual intervention!
