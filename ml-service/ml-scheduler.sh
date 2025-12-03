#!/bin/bash

# ML Scheduler Management Script
# Easy commands to manage the ML training scheduler

case "$1" in
    start)
        echo "Starting ML Training Scheduler..."
        docker-compose up -d ml-training-scheduler
        echo "Scheduler started. Use './ml-scheduler.sh status' to check status."
        ;;

    stop)
        echo "Stopping ML Training Scheduler..."
        docker-compose stop ml-training-scheduler
        echo "Scheduler stopped."
        ;;

    restart)
        echo "Restarting ML Training Scheduler..."
        docker-compose restart ml-training-scheduler
        echo "Scheduler restarted."
        ;;

    status)
        echo "Checking ML Training Scheduler status..."
        ./monitor_scheduler.sh
        ;;

    logs)
        echo "Showing ML Training Scheduler logs (press Ctrl+C to exit)..."
        docker logs -f ml-training-scheduler
        ;;

    health)
        echo "Checking scheduler health..."
        HEALTH=$(docker inspect --format='{{.State.Health.Status}}' ml-training-scheduler 2>/dev/null || echo "not-running")
        STATUS=$(docker inspect --format='{{.State.Status}}' ml-training-scheduler 2>/dev/null || echo "not-found")
        echo "Container Status: $STATUS"
        echo "Health Status: $HEALTH"

        if [ "$STATUS" = "running" ]; then
            echo "✓ Scheduler container is running"
            if docker exec ml-training-scheduler ps aux | grep -q "train_models.py.*scheduler"; then
                echo "✓ Scheduler process is active"
            else
                echo "⚠ Scheduler process not found"
            fi
        else
            echo "✗ Scheduler container is not running"
        fi
        ;;

    train-now)
        echo "Triggering immediate training with real data..."
        docker exec ml-training-scheduler python train_models.py --real --config config/docker_config.yaml
        ;;

    train-synthetic)
        echo "Triggering training with synthetic data..."
        docker exec ml-training-scheduler python train_models.py --synthetic --config config/docker_config.yaml
        ;;

    history)
        echo "Showing training history..."
        docker exec -it ml-postgres psql -U ml_user -d ml_training_db -c "
        SELECT
            training_date::date as date,
            model_version,
            ROUND(accuracy::numeric, 3) as accuracy,
            ROUND(f1_score::numeric, 3) as f1_score,
            deployment_status as status
        FROM model_training_history
        ORDER BY training_date DESC
        LIMIT 10;
        " 2>/dev/null || echo "Training history not available"
        ;;

    db-status)
        echo "Checking database connections..."
        docker exec ml-training-scheduler python -c "
import sys
sys.path.append('src')
from data.data_collector import MultiDatabaseDataCollector
collector = MultiDatabaseDataCollector('config/docker_config.yaml')
status = collector.test_connections()
print('Database Connection Status:')
for db, connected in status.items():
    if isinstance(connected, dict):
        for sub_db, sub_status in connected.items():
            print(f'  {db} ({sub_db}): {'✓ Connected' if sub_status else '✗ Failed'}')
    else:
        print(f'  {db}: {'✓ Connected' if connected else '✗ Failed'}')
" 2>/dev/null || echo "Database status check failed"
        ;;

    rebuild)
        echo "Rebuilding ML Training Scheduler..."
        docker-compose build ml-training-scheduler
        docker-compose up -d ml-training-scheduler
        echo "Scheduler rebuilt and started."
        ;;

    clean)
        echo "Cleaning up ML Training Scheduler..."
        docker-compose stop ml-training-scheduler
        docker-compose rm -f ml-training-scheduler
        docker volume prune -f
        echo "Scheduler cleaned up. Use './ml-scheduler.sh start' to restart."
        ;;

    *)
        echo "ML Training Scheduler Management"
        echo "================================"
        echo ""
        echo "Usage: $0 {command}"
        echo ""
        echo "Commands:"
        echo "  start          - Start the ML training scheduler"
        echo "  stop           - Stop the scheduler"
        echo "  restart        - Restart the scheduler"
        echo "  status         - Show detailed scheduler status"
        echo "  logs           - Show live scheduler logs"
        echo "  health         - Quick health check"
        echo "  train-now      - Trigger immediate training with real data"
        echo "  train-synthetic - Trigger training with synthetic data"
        echo "  history        - Show training history"
        echo "  db-status      - Check database connections"
        echo "  rebuild        - Rebuild and restart scheduler"
        echo "  clean          - Clean up scheduler containers and volumes"
        echo ""
        echo "Examples:"
        echo "  $0 start       # Start automatic scheduler"
        echo "  $0 status      # Check if running properly"
        echo "  $0 train-now   # Force immediate training"
        echo "  $0 logs        # Monitor scheduler activity"
        ;;
esac
