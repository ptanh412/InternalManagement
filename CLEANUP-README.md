# 🧹 Công cụ Dọn dẹp Code Tự động

## ⚡ Sử dụng nhanh

### Kiểm tra toàn bộ project:
```bash
./cleanup-unused-code.sh
```

### Tự động xóa code không dùng (⚠️ Cẩn thận!):
```bash
./cleanup-unused-code-auto.sh
```

## 📦 Đã cài đặt

✅ **Java Services**: Maven Dependency Analyzer + Spotless  
✅ **Python Service**: autoflake + vulture + isort  
✅ **React Service**: ESLint + depcheck  

## 📚 Hướng dẫn chi tiết

Xem file [CLEANUP-GUIDE.md](./CLEANUP-GUIDE.md)

## 🎯 Scripts NPM cho Website Service

```bash
cd website-service

# Kiểm tra unused variables
npm run lint:unused

# Kiểm tra unused dependencies  
npm run check:deps

# Auto-fix unused code
npm run lint:fix
```

## 🐍 Lệnh cho Python Service

```bash
cd ml-service/ml-training-python

# Kiểm tra
autoflake --check --remove-all-unused-imports --recursive .
vulture . --min-confidence 80

# Tự động sửa
autoflake --remove-all-unused-imports --remove-unused-variables --in-place --recursive .
isort . --profile black
```

## ☕ Lệnh cho Java Services

```bash
cd identity-service  # hoặc service khác

# Kiểm tra unused dependencies
mvn dependency:analyze

# Format code
mvn spotless:apply
```

---

**⚠️ LƯU Ý**: Luôn commit code trước khi chạy auto cleanup!
