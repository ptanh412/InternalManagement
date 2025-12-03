#!/bin/bash

# Startup script for Python ML Service
# This script starts the FastAPI model server on port 8000

echo "=========================================="
echo "Starting Python ML Service"
echo "=========================================="
echo "Date: $(date)"
echo "Working Directory: $(pwd)"
echo ""

# Set Python path to include src directory
export PYTHONPATH="${PYTHONPATH}:$(pwd)/src:$(pwd)"

# Check Python version
echo "Python version:"
python3 --version
echo ""

# Check if required dependencies are installed
echo "Checking dependencies..."
python3 -c "import fastapi, uvicorn, pandas, scikit-learn, yaml" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ All dependencies installed"
else
    echo "⚠️  Some dependencies missing. Installing..."
    pip3 install fastapi uvicorn pandas scikit-learn pyyaml structlog joblib --quiet
fi
echo ""

# Check if models directory exists
if [ ! -d "models" ]; then
    echo "Creating models directory..."
    mkdir -p models
fi

# Check if config exists
if [ ! -f "config/model_config.yaml" ]; then
    echo "⚠️  Warning: config/model_config.yaml not found"
    echo "Creating default config..."
    mkdir -p config
    cat > config/model_config.yaml << 'EOF'
api:
  host: "0.0.0.0"
  port: 8000
  reload: false

model:
  recommendation:
    algorithm: "hybrid"
    content_weight: 0.6
    collaborative_weight: 0.4

database:
  postgres:
    host: localhost
    port: 5432
EOF
fi

echo "=========================================="
echo "Starting FastAPI server on http://localhost:8000"
echo "=========================================="
echo ""
echo "API Endpoints:"
echo "  - GET  http://localhost:8000/          (API Info)"
echo "  - GET  http://localhost:8000/health    (Health Check)"
echo "  - POST http://localhost:8000/recommend (Get Recommendations)"
echo "  - POST http://localhost:8000/train     (Train Model)"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=========================================="
echo ""

# Start the server
cd "$(dirname "$0")"
python3 -m uvicorn src.api.model_server:app --host 0.0.0.0 --port 8000 --reload

# Alternative if above doesn't work:
# PYTHONPATH=. python3 src/api/model_server.py

