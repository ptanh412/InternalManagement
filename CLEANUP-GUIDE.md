# ============================================================
# Hướng dẫn sử dụng công cụ dọn dẹp code không sử dụng
# ============================================================

## 📚 Tổng quan

Project này đã được cài đặt các công cụ tự động để:
- ✅ Phát hiện và xóa imports không sử dụng
- ✅ Phát hiện và xóa biến, hàm, class không sử dụng
- ✅ Phát hiện dependencies không cần thiết
- ✅ Format và tối ưu code

## 🛠️ Công cụ cho từng loại Service

### 1️⃣ Java Services (Spring Boot)
**Công cụ**: Maven Dependency Plugin + Spotless

**Kiểm tra:**
```bash
cd identity-service  # hoặc service khác
mvn dependency:analyze
mvn spotless:check
```

**Tự động sửa:**
```bash
mvn spotless:apply
```

### 2️⃣ Python Service (ML Service)
**Công cụ**: autoflake + vulture + isort

**Cài đặt:**
```bash
cd ml-service/ml-training-python
pip install autoflake vulture isort flake8
```

**Kiểm tra:**
```bash
# Kiểm tra unused imports
autoflake --check --remove-all-unused-imports --recursive .

# Kiểm tra unused code
vulture . --min-confidence 80

# Kiểm tra format
flake8 .
```

**Tự động sửa:**
```bash
# Xóa unused imports và variables
autoflake --remove-all-unused-imports --remove-unused-variables --in-place --recursive .

# Sắp xếp imports
isort . --profile black
```

### 3️⃣ React/JavaScript Service
**Công cụ**: ESLint + depcheck

**Cài đặt:**
```bash
cd website-service
npm install --save-dev depcheck eslint-plugin-unused-imports
```

**Kiểm tra:**
```bash
# Kiểm tra unused code
npm run lint:unused

# Kiểm tra unused dependencies
npm run check:deps
```

**Tự động sửa:**
```bash
# Auto-fix unused imports/variables
npm run lint:fix

# Cleanup tất cả
npm run cleanup
```

## 🚀 Scripts tổng hợp

### Kiểm tra toàn bộ project:
```bash
./cleanup-unused-code.sh
```

### Tự động dọn dẹp (⚠️ Cẩn thận!):
```bash
./cleanup-unused-code-auto.sh
```

**Lưu ý**: Luôn commit code trước khi chạy auto cleanup!

## 📋 Quy trình khuyến nghị

1. **Commit code hiện tại**
   ```bash
   git add .
   git commit -m "chore: checkpoint before cleanup"
   ```

2. **Chạy kiểm tra**
   ```bash
   ./cleanup-unused-code.sh
   ```

3. **Xem xét kết quả và quyết định**
   - Nếu OK → Chạy auto cleanup
   - Nếu có vấn đề → Sửa thủ công

4. **Chạy auto cleanup (optional)**
   ```bash
   ./cleanup-unused-code-auto.sh
   ```

5. **Kiểm tra thay đổi**
   ```bash
   git diff
   ```

6. **Test ứng dụng**
   ```bash
   # Test từng service
   # Đảm bảo không có lỗi
   ```

7. **Commit nếu OK**
   ```bash
   git add .
   git commit -m "chore: remove unused code and dependencies"
   ```

## ⚙️ Tích hợp vào CI/CD

Thêm vào `.github/workflows/code-quality.yml`:

```yaml
name: Code Quality Check

on: [push, pull_request]

jobs:
  check-unused-code:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      # Java Services
      - name: Check Java unused dependencies
        run: |
          for service in identity-service api-gateway; do
            cd $service
            mvn dependency:analyze
            cd ..
          done
      
      # Python Service
      - name: Check Python unused code
        run: |
          cd ml-service/ml-training-python
          pip install vulture autoflake
          autoflake --check --remove-all-unused-imports --recursive .
          vulture . --min-confidence 80
      
      # React Service
      - name: Check JavaScript unused code
        run: |
          cd website-service
          npm install
          npm run lint:unused
          npm run check:deps
```

## 🎯 Best Practices

1. **Chạy cleanup định kỳ** (mỗi tuần hoặc trước mỗi release)
2. **Luôn review thay đổi** trước khi commit
3. **Test kỹ** sau khi cleanup
4. **Sử dụng .gitignore** để không commit files config local
5. **Cấu hình IDE** để tự động highlight unused code

## 🔧 Cấu hình IDE

### VS Code
Cài extensions:
- ESLint
- SonarLint
- Unused Imports Remover

### IntelliJ IDEA
- Enable "Optimize imports on the fly"
- Enable "Remove unused imports"
- Configure Spotless plugin

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra log output của scripts
2. Chạy từng bước thủ công để debug
3. Xem cấu hình trong các file `.eslintrc.js`, `.flake8`, `.vulture.toml`

---

**Tạo bởi**: Cleanup Automation Script
**Ngày**: 29/12/2025
