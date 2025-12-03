#!/bin/bash

# ML Training Scheduler Monitoring Script
# Use this to monitor the scheduler status

echo "========================================"
echo "ML Training Scheduler Status Monitor"
echo "========================================"
echo "Timestamp: $(date)"
echo ""

# Check if container is running
if docker ps --filter name=ml-training-scheduler --filter status=running | grep -q ml-training-scheduler; then
    echo "✓ ML Training Scheduler container is running"

    # Check recent logs
    echo ""
    echo "Recent scheduler activity (last 20 lines):"
    echo "----------------------------------------"
    docker logs --tail 20 ml-training-scheduler

    echo ""
    echo "----------------------------------------"

    # Check container health
    HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' ml-training-scheduler 2>/dev/null || echo "no-healthcheck")
    echo "Container health status: $HEALTH_STATUS"

    # Check if scheduler is actually running
    if docker exec ml-training-scheduler ps aux | grep -q "train_models.py.*scheduler"; then
        echo "✓ Scheduler process is active"
    else
        echo "⚠ Scheduler process not found - container may be starting up"
    fi

    echo ""
    echo "Training history (if available):"
    echo "-------------------------------"
    docker exec ml-training-scheduler python -c "
import sys
sys.path.append('src')
try:
    from models.continuous_learning import ContinuousModelTrainer
    trainer = ContinuousModelTrainer('config/docker_config.yaml')
    history = trainer.get_model_performance_history(7)  # Last 7 days
    if not history.empty:
        print(history[['training_date', 'model_version', 'accuracy', 'deployment_status']].tail())
    else:
        print('No training history found')
except Exception as e:
    print(f'Unable to retrieve training history: {e}')
" 2>/dev/null || echo "Training history not accessible"

else
    echo "✗ ML Training Scheduler container is not running"
    echo ""
    echo "Container status:"
    docker ps -a --filter name=ml-training-scheduler

    echo ""
    echo "Recent container logs:"
    echo "---------------------"
    docker logs --tail 30 ml-training-scheduler 2>/dev/null || echo "No logs available"
fi

echo ""
echo "========================================"

# Usage instructions
echo "Commands:"
echo "  Start scheduler:    docker-compose up -d ml-training-scheduler"
echo "  Stop scheduler:     docker-compose stop ml-training-scheduler"
echo "  View logs:          docker logs -f ml-training-scheduler"
echo "  Restart scheduler:  docker-compose restart ml-training-scheduler"
