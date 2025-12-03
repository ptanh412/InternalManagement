#!/bin/bash
# Quick verification runner for ML training data

echo "=========================================="
echo "ML Training Data Verification Tool"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "train_models.py" ]; then
    echo -e "${RED}Error: Must be run from ml-training-python directory${NC}"
    echo "cd /Users/phamanh/InternalManagement/ml-service/ml-training-python"
    exit 1
fi

# Check Python dependencies
echo "Checking dependencies..."
python3 -c "import pandas, pymongo, neo4j, mysql.connector, sqlalchemy, yaml, tabulate" 2>/dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Warning: Some dependencies missing${NC}"
    echo "Installing dependencies..."
    pip install pandas pymongo neo4j mysql-connector-python sqlalchemy pyyaml tabulate structlog
fi

echo ""
echo "Select verification mode:"
echo "  1) Quick Check (fast, database overview)"
echo "  2) Full Verification (detailed analysis)"
echo "  3) Full Verification + Export CSV"
echo "  4) Run Training with Real Data"
echo "  5) Exit"
echo ""
read -p "Enter choice [1-5]: " choice

case $choice in
    1)
        echo -e "\n${GREEN}Running Quick Check...${NC}\n"
        python3 check_data_sources.py
        ;;
    2)
        echo -e "\n${GREEN}Running Full Verification...${NC}\n"
        python3 verify_training_data.py --verbose
        ;;
    3)
        echo -e "\n${GREEN}Running Full Verification with CSV Export...${NC}\n"
        python3 verify_training_data.py --verbose --export-csv
        echo -e "\n${GREEN}CSV files saved to: data_verification_reports/${NC}"
        ;;
    4)
        echo -e "\n${YELLOW}First running verification...${NC}\n"
        python3 verify_training_data.py
        echo ""
        read -p "Continue with training? (y/n): " confirm
        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
            echo -e "\n${GREEN}Running Training with Real Data...${NC}\n"
            python3 train_models.py --real
        else
            echo "Training cancelled."
        fi
        ;;
    5)
        echo "Exiting."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "Verification complete!"
echo "=========================================="

