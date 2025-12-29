#!/bin/bash

# ============================================================
# Script TỰ ĐỘNG XÓA code không sử dụng (BE CAREFUL!)
# ============================================================

set -e

echo "⚠️  CẢNH BÁO: Script này sẽ TỰ ĐỘNG XÓA code không sử dụng!"
echo "Vui lòng commit code hiện tại trước khi chạy."
echo ""
read -p "Bạn có chắc chắn muốn tiếp tục? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Đã hủy."
    exit 0
fi

echo ""
echo "🧹 Bắt đầu dọn dẹp tự động..."
echo ""

# Màu sắc
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================
# 1. PYTHON SERVICE - Tự động xóa imports không dùng
# ============================================================
echo "${BLUE}========================================${NC}"
echo "${BLUE}1. Dọn dẹp Python Service${NC}"
echo "${BLUE}========================================${NC}"

if [ -d "ml-service/ml-training-python" ]; then
    echo ""
    echo "${YELLOW}🐍 Cleaning ml-service/ml-training-python...${NC}"
    cd ml-service/ml-training-python
    
    # Cài đặt công cụ nếu chưa có
    pip install -q autoflake isort 2>/dev/null || true
    
    # Xóa imports không sử dụng
    echo "  → Removing unused imports..."
    find . -name "*.py" -type f ! -path "*/venv/*" ! -path "*/.venv/*" ! -path "*/env/*" -exec autoflake --remove-all-unused-imports --remove-unused-variables --in-place {} \; 2>/dev/null
    
    # Sắp xếp imports
    echo "  → Organizing imports..."
    isort . --profile black --skip venv --skip .venv --skip env 2>/dev/null || true
    
    echo "  ${GREEN}✅ Python cleanup completed${NC}"
    cd ../..
fi

# ============================================================
# 2. REACT/JAVASCRIPT SERVICE
# ============================================================
echo ""
echo "${BLUE}========================================${NC}"
echo "${BLUE}2. Dọn dẹp React/JavaScript Service${NC}"
echo "${BLUE}========================================${NC}"

if [ -d "website-service" ]; then
    echo ""
    echo "${YELLOW}⚛️  Cleaning website-service...${NC}"
    cd website-service
    
    # Xóa unused imports với ESLint auto-fix
    echo "  → Removing unused imports and variables..."
    npx eslint src/ --fix --rule 'no-unused-vars: error' 2>/dev/null || true
    
    # Xóa dependencies không sử dụng (chỉ từ package.json)
    echo "  → Checking for unused dependencies..."
    echo "  ℹ️  Cần xem xét thủ công file package.json để xóa dependencies không dùng"
    
    echo "  ${GREEN}✅ JavaScript cleanup completed${NC}"
    cd ..
fi

# ============================================================
# 3. JAVA SERVICES - Loại bỏ imports không dùng
# ============================================================
echo ""
echo "${BLUE}========================================${NC}"
echo "${BLUE}3. Dọn dẹp Java Services${NC}"
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
        echo "${YELLOW}☕ Cleaning $service...${NC}"
        cd "$service"
        
        # Format code và xóa unused imports với Spotless
        echo "  → Formatting code and removing unused imports..."
        mvn spotless:apply -q 2>/dev/null || echo "  ⚠️  Spotless not configured, skipping..."
        
        echo "  ${GREEN}✅ Java cleanup completed${NC}"
        cd ..
    fi
done

# ============================================================
# KẾT QUẢ
# ============================================================
echo ""
echo "${GREEN}========================================${NC}"
echo "${GREEN}🎉 Dọn dẹp hoàn tất!${NC}"
echo "${GREEN}========================================${NC}"
echo ""
echo "📝 Các thay đổi đã được thực hiện:"
echo "   - Python: Đã xóa unused imports và variables"
echo "   - JavaScript: Đã xóa unused imports và variables"
echo "   - Java: Đã format code và xóa unused imports"
echo ""
echo "🔍 Kiểm tra thay đổi với: git diff"
echo "💾 Commit nếu hài lòng: git add . && git commit -m 'chore: remove unused code'"
echo ""
