#!/bin/bash

# ML Training Scheduler Startup Script
# This script ensures proper initialization and handles startup errors

set -e

echo "=========================================="
echo "ML Training Scheduler Startup"
echo "=========================================="
echo "Start time: $(date)"
echo "Working directory: $(pwd)"
echo "Python version: $(python --version)"
echo ""

# Check if config file exists
CONFIG_FILE="${ML_CONFIG_PATH:-config/docker_config.yaml}"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "ERROR: Configuration file not found: $CONFIG_FILE"
    echo "Available files in config directory:"
    ls -la config/ || echo "Config directory not found"
    exit 1
fi

echo "Using configuration file: $CONFIG_FILE"
echo ""

# Install any missing dependencies
echo "Checking Python dependencies..."
pip install --quiet --no-cache-dir schedule pandas scikit-learn PyYAML sqlalchemy psycopg2-binary pymongo neo4j pymysql structlog

# Test Python imports
echo "Testing Python imports..."
python -c "
import sys
sys.path.append('src')
try:
    import schedule
    import pandas as pd
    import yaml
    import sqlalchemy
    print('✓ All core dependencies imported successfully')
except ImportError as e:
    print(f'✗ Import error: {e}')
    sys.exit(1)
"

# Test database connections
echo ""
echo "Testing database connections..."
python -c "
import sys
sys.path.append('src')
try:
    from data.data_collector import MultiDatabaseDataCollector
    collector = MultiDatabaseDataCollector('$CONFIG_FILE')
    status = collector.test_connections()
    print('Database Connection Status:')
    for db, connected in status.items():
        if isinstance(connected, dict):
            for sub_db, sub_status in connected.items():
                print(f'  {db} ({sub_db}): {\"Connected\" if sub_status else \"Failed\"}')
        else:
            print(f'  {db}: {\"Connected\" if connected else \"Failed\"}')
except Exception as e:
    print(f'Database connection test failed: {e}')
    print('Continuing anyway - scheduler will handle connection issues')
"

echo ""
echo "=========================================="
echo "Starting ML Training Scheduler..."
echo "=========================================="
echo "Schedule: Daily at 2:00 AM, Weekly on Sunday at 3:00 AM"
echo "Configuration: $CONFIG_FILE"
echo "Logs will be written to: /var/log/ml-training/"
echo ""

# Create log directory
mkdir -p /var/log/ml-training

# Start the scheduler with proper error handling
exec python train_models.py --scheduler --config "$CONFIG_FILE" 2>&1 | tee /var/log/ml-training/scheduler.log
