#!/bin/bash

# ============================================================
# Script tự động loại bỏ code không sử dụng trong tất cả microservices
# ============================================================

set -e

echo "🚀 Bắt đầu kiểm tra và dọn dẹp code không sử dụng..."
echo ""

# Màu sắc cho output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================
# 1. JAVA MICROSERVICES
# ============================================================
echo "${BLUE}========================================${NC}"
echo "${BLUE}1. Kiểm tra Java Microservices${NC}"
echo "${BLUE}========================================${NC}"

JAVA_SERVICES=(
    "identity-service"
    "api-gateway"
    "chat-service"
    "file-service"
    "notification-service"
    "post-service"
    "profile-service"
    "project-service"
    "task-service"
    "workload-service"
)

for service in "${JAVA_SERVICES[@]}"; do
    if [ -d "$service" ] && [ -f "$service/pom.xml" ]; then
        echo ""
        echo "${YELLOW}📦 Analyzing $service...${NC}"
        cd "$service"
        
        # Kiểm tra dependencies không sử dụng
        echo "  → Checking unused dependencies..."
        mvn dependency:analyze -q 2>&1 | grep -A 20 "Unused declared dependencies found" || echo "  ✅ No unused dependencies"
        
        # Kiểm tra code không sử dụng với Maven
        echo "  → Checking unused code..."
        mvn clean compile -q -DskipTests 2>&1 | grep -i "warning" | grep -i "never used" || echo "  ✅ No obvious unused code"
        
        cd ..
    fi
done

# ============================================================
# 2. PYTHON SERVICE (ML-SERVICE)
# ============================================================
echo ""
echo "${BLUE}========================================${NC}"
echo "${BLUE}2. Kiểm tra Python Service${NC}"
echo "${BLUE}========================================${NC}"

if [ -d "ml-service/ml-training-python" ]; then
    echo ""
    echo "${YELLOW}🐍 Analyzing ml-service/ml-training-python...${NC}"
    cd ml-service/ml-training-python
    
    # Kiểm tra xem các công cụ đã được cài đặt chưa
    if ! command -v vulture &> /dev/null; then
        echo "  → Installing Python cleanup tools..."
        pip install -q autoflake vulture
    fi
    
    # Tìm imports không sử dụng
    echo "  → Checking unused imports..."
    autoflake --check --remove-all-unused-imports --recursive . 2>/dev/null | head -20 || echo "  ✅ No unused imports found"
    
    # Tìm code không sử dụng
    echo "  → Checking unused code (functions, classes, variables)..."
    vulture . --min-confidence 80 2>/dev/null | head -30 || echo "  ✅ No unused code found"
    
    cd ../..
fi

# ============================================================
# 3. REACT/JAVASCRIPT SERVICE (WEBSITE-SERVICE)
# ============================================================
echo ""
echo "${BLUE}========================================${NC}"
echo "${BLUE}3. Kiểm tra React/JavaScript Service${NC}"
echo "${BLUE}========================================${NC}"

if [ -d "website-service" ]; then
    echo ""
    echo "${YELLOW}⚛️  Analyzing website-service...${NC}"
    cd website-service
    
    # Kiểm tra xem các công cụ đã được cài đặt chưa
    if [ ! -d "node_modules" ]; then
        echo "  → Installing dependencies..."
        npm install --silent
    fi
    
    # Kiểm tra dependencies không sử dụng
    echo "  → Checking unused dependencies..."
    if ! command -v depcheck &> /dev/null; then
        echo "  → Installing depcheck..."
        npm install -g depcheck --silent
    fi
    depcheck --ignores="autoprefixer,postcss,tailwindcss,@testing-library/*" 2>/dev/null | head -40 || echo "  ✅ No unused dependencies"
    
    # Chạy ESLint để tìm code không sử dụng
    echo "  → Checking unused code with ESLint..."
    npx eslint src/ --rule 'no-unused-vars: warn' --format compact 2>/dev/null | head -30 || echo "  ✅ No unused variables"
    
    cd ..
fi

# ============================================================
# KẾT QUẢ
# ============================================================
echo ""
echo "${GREEN}========================================${NC}"
echo "${GREEN}✅ Hoàn thành kiểm tra!${NC}"
echo "${GREEN}========================================${NC}"
echo ""
echo "📋 Để tự động xóa code không sử dụng, chạy:"
echo "   ${YELLOW}./cleanup-unused-code-auto.sh${NC}"
echo ""
