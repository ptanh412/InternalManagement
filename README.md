

# 🚀 Internal Management System

Hệ thống quản lý nội bộ với kiến trúc Microservices, tích hợp AI/ML để gợi ý task, phân tích CV và quản lý dự án.

---

## 📋 Mục lục

1. [Tổng quan hệ thống](#-tổng-quan-hệ-thống)
2. [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
3. [Cài đặt Database](#-cài-đặt-database)
4. [Cài đặt Kafka](#-cài-đặt-kafka)
5. [Cấu hình Gemini AI](#-cấu-hình-gemini-ai)
6. [Chạy Microservices](#-chạy-microservices)
7. [Chạy ML Service](#-chạy-ml-service)
8. [Import dữ liệu](#-import-dữ-liệu)
9. [Tài khoản test](#-tài-khoản-test)
10. [Test chức năng AI](#-test-chức-năng-ai)
11. [Cleanup Code](#-cleanup-code)

---

## 🎯 Tổng quan hệ thống

### Kiến trúc Microservices

```
├── api-gateway          (Port 8888) - API Gateway
├── identity-service     (Port 8080) - Quản lý user, authentication
├── profile-service      (Port 8081) - Quản lý profile, skills (Neo4j)
├── project-service      (Port 8082) - Quản lý projects
├── task-service         (Port 8083) - Quản lý tasks
├── workload-service     (Port 8084) - Quản lý workload
├── ai-service           (Port 8085) - AI recommendations, CV analysis
├── ml-service           (Port 5000) - Machine Learning models
├── chat-service         (Port 8086) - Real-time chat
├── notification-service (Port 8087) - Notifications, email
├── post-service         (Port 8088) - Social posts
├── file-service         (Port 8089) - File management
└── website-service      (Port 3000) - React Frontend
```

### Databases

- **MySQL** - Identity, Project, Task, Workload, AI, Chat, Notification, Post, File
- **Neo4j** - Profile service (Graph database cho skills)
- **MongoDB** - ML training data
- **PostgreSQL** - ML service (Performance metrics)

---

## 💻 Yêu cầu hệ thống

### 1. Cài đặt công cụ cần thiết

```bash
# Java Development Kit 21
brew install openjdk@21

# Maven
brew install maven

# Node.js & npm
brew install node

# Python 3.11
brew install python@3.11

# Docker
brew install --cask docker

# DBeaver (Database Tool)
brew install --cask dbeaver-community
```

### 2. Kiểm tra version

```bash
java -version    # Java 21
mvn -version     # Maven 3.x
node -version    # Node 18+
npm -version     # npm 9+
python3 --version # Python 3.11
docker --version # Docker 24+
```

---

## 🗄️ Cài đặt Database

### 1. MySQL (Port 3306)

```bash
# Pull image
docker pull mysql:oracle

# Chạy container
docker run --name mysql-oracle \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -d mysql:oracle

# Kiểm tra
docker ps | grep mysql-oracle
```

**DBeaver Connection:**
```
Host: localhost
Port: 3306
Database: (để trống hoặc tên database cụ thể)
Username: root
Password: 123456
JDBC URL: jdbc:mysql://localhost:3306?allowPublicKeyRetrieval=true&useSSL=false
```

### 2. Neo4j (Ports 7474, 7687)

```bash
# Pull image
docker pull neo4j:ubi9

# Chạy container
docker run --name neo4j \
  --publish=7474:7474 \
  --publish=7687:7687 \
  -e NEO4J_AUTH=neo4j/12345678 \
  -d neo4j:ubi9

# Truy cập Web UI
# http://localhost:7474
# Username: neo4j
# Password: 12345678
```

**DBeaver Connection (Neo4j):**
```
Host: localhost
Port: 7687
Username: neo4j
Password: 12345678
```

### 3. MongoDB (Port 27017)

```bash
# Pull image
docker pull bitnami/mongodb:7.0.11

# Chạy container
docker run -d --name mongodb-7.0.11 \
  -p 27017:27017 \
  -e MONGODB_ROOT_USER=root \
  -e MONGODB_ROOT_PASSWORD=root \
  bitnami/mongodb:7.0.11

# Kiểm tra
docker exec -it mongodb-7.0.11 mongosh -u root -p root
```

**DBeaver Connection (MongoDB):**
```
Host: localhost
Port: 27017
Database: admin
Username: root
Password: root
```

### 4. PostgreSQL (Port 5432)

```bash
# Pull image
docker pull postgres:15

# Chạy container
docker run --name postgresql-ml \
  -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ml_service \
  -d postgres:15

# Kiểm tra
docker exec -it postgresql-ml psql -U postgres
```

**DBeaver Connection (PostgreSQL):**
```
Host: localhost
Port: 5432
Database: ml_service
Username: postgres
Password: postgres
```

---

## 📨 Cài đặt Kafka

Kafka được sử dụng cho event streaming giữa các microservices.

```bash
# Chạy Kafka và Zookeeper với Docker Compose
docker-compose up -d

# Kiểm tra
docker-compose ps

# Xem logs
docker-compose logs -f kafka
```

**File `docker-compose.yml` đã có sẵn trong project.**

Kafka sẽ chạy ở:
- Kafka: `localhost:9092`
- Zookeeper: `localhost:2181`

---

## 🤖 Cấu hình Gemini AI

### 1. Lấy API Key từ Google AI Studio

Truy cập: https://makersuite.google.com/app/apikey

1. Đăng nhập với Google Account
2. Tạo API Key mới
3. Copy API Key

### 2. Cấu hình trong ai-service

**File**: `ai-service/src/main/resources/application.yaml`

```yaml
gemini:
  api:
    key: YOUR_GEMINI_API_KEY_HERE  # Thay thế bằng API key của bạn
    url: https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
```

**Hoặc sử dụng Environment Variable:**

```bash
export GEMINI_API_KEY="your-api-key-here"
```

**Trong application.yaml:**

```yaml
gemini:
  api:
    key: ${GEMINI_API_KEY}
    url: https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
```

---

## 🚀 Chạy Microservices

### 1. Thứ tự khởi động services

**Bước 1: Infrastructure Services**
```bash
# Đảm bảo Kafka, MySQL, Neo4j, MongoDB, PostgreSQL đang chạy
docker ps
```

**Bước 2: Core Services**
```bash
# Identity Service (Port 8080)
cd identity-service
mvn spring-boot:run -Dmaven.test.skip=true

# Profile Service (Port 8081)
cd profile-service
mvn spring-boot:run -Dmaven.test.skip=true

# Project Service (Port 8082)
cd project-service
mvn spring-boot:run -Dmaven.test.skip=true

# Task Service (Port 8083)
cd task-service
mvn spring-boot:run -Dmaven.test.skip=true

# Workload Service (Port 8084)
cd workload-service
mvn spring-boot:run -Dmaven.test.skip=true
```

**Bước 3: AI & Support Services**
```bash
# AI Service (Port 8085)
cd ai-service
mvn spring-boot:run -Dmaven.test.skip=true

# Chat Service (Port 8086)
cd chat-service
mvn spring-boot:run -Dmaven.test.skip=true

# Notification Service (Port 8087)
cd notification-service
mvn spring-boot:run -Dmaven.test.skip=true

# Post Service (Port 8088)
cd post-service
mvn spring-boot:run -Dmaven.test.skip=true

# File Service (Port 8089)
cd file-service
mvn spring-boot:run -Dmaven.test.skip=true
```

**Bước 4: API Gateway**
```bash
# API Gateway (Port 8888)
cd api-gateway
mvn spring-boot:run -Dmaven.test.skip=true
```

**Bước 5: Frontend**
```bash
# Website Service (Port 3000)
cd website-service
npm install
npm start
```

### 2. Reset dữ liệu Admin (Nếu cần)

```bash
cd identity-service
mvn spring-boot:run \
  -Dspring-boot.run.profiles=admin-reset \
  -Dmaven.test.skip=true
```

### 3. Kiểm tra services đang chạy

```bash
# Check ports
lsof -i :8080  # Identity
lsof -i :8081  # Profile
lsof -i :8082  # Project
lsof -i :8083  # Task
lsof -i :8084  # Workload
lsof -i :8085  # AI
lsof -i :8086  # Chat
lsof -i :8087  # Notification
lsof -i :8088  # Post
lsof -i :8089  # File
lsof -i :8888  # Gateway
lsof -i :3000  # Frontend
lsof -i :5000  # ML Service
```

---

## 🧠 Chạy ML Service

ML Service sử dụng Python và TensorFlow/scikit-learn để training và predict.

### 1. Cài đặt dependencies

```bash
cd ml-service/ml-training-python

# Tạo virtual environment
python3 -m venv venv
source venv/bin/activate  # MacOS/Linux
# hoặc: venv\Scripts\activate  # Windows

# Cài đặt packages
pip install -r requirements.txt
```

### 2. Cấu hình Database connections

**File**: `ml-service/ml-training-python/config.yaml`

```yaml
databases:
  mysql:
    host: localhost
    port: 3306
    user: root
    password: "123456"
    
  mongodb:
    host: localhost
    port: 27017
    user: root
    password: root
    database: ml_training
    
  postgresql:
    host: localhost
    port: 5432
    user: postgres
    password: postgres
    database: ml_service
    
  neo4j:
    uri: bolt://localhost:7687
    user: neo4j
    password: "12345678"
```

### 3. Training Models (Lần đầu)

```bash
cd ml-service/ml-training-python

# Activate virtual environment
source venv/bin/activate

# Collect training data từ các databases
python src/data/data_collector.py

# Train models
python train_models.py

# Models sẽ được lưu vào thư mục models/
```

### 4. Chạy ML API Server

```bash
cd ml-service/ml-training-python

# Activate virtual environment
source venv/bin/activate

# Start API server
python src/api/model_server.py

# Server chạy ở http://localhost:5000
```

### 5. Kiểm tra ML Service

```bash
# Test health endpoint
curl http://localhost:5000/health

# Test prediction
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "task_id": "task456"
  }'
```

### 6. Continuous Learning (Optional)

ML Service hỗ trợ continuous learning để cải thiện model theo thời gian:

```bash
# Enable continuous learning
python src/models/continuous_learning.py
```

---

## 📦 Import dữ liệu

### 1. MySQL Databases

**Cách 1: Sử dụng script SQL**

```bash
# Tạo databases
docker exec -it mysql-oracle mysql -uroot -p123456 -e "
  CREATE DATABASE IF NOT EXISTS identity_service;
  CREATE DATABASE IF NOT EXISTS project_service;
  CREATE DATABASE IF NOT EXISTS task_service;
  CREATE DATABASE IF NOT EXISTS workload_service;
  CREATE DATABASE IF NOT EXISTS ai_service;
  CREATE DATABASE IF NOT EXISTS chat_service;
  CREATE DATABASE IF NOT EXISTS notification_service;
  CREATE DATABASE IF NOT EXISTS post_service;
  CREATE DATABASE IF NOT EXISTS file_service;
"

# Import từ SQL dump (nếu có)
docker exec -i mysql-oracle mysql -uroot -p123456 database_name < backup.sql
```

**Cách 2: Tự động tạo bởi Spring Boot**

Khi chạy mỗi service lần đầu, Spring Boot JPA sẽ tự động tạo tables.

### 2. Neo4j (Profile Service)

Neo4j sẽ tự động tạo nodes và relationships khi bạn:
1. Đăng nhập vào hệ thống
2. Cập nhật profile/skills

**Xem dữ liệu trong Neo4j Browser:**
```
http://localhost:7474

# Cypher queries
MATCH (n) RETURN n LIMIT 25;
MATCH (u:User)-[:HAS_SKILL]->(s:Skill) RETURN u, s;
```

### 3. MongoDB (ML Training Data)

**Export dữ liệu training (để share):**

```bash
# Export collection
docker exec mongodb-7.0.11 mongodump \
  --username=root \
  --password=root \
  --authenticationDatabase=admin \
  --db=ml_training \
  --out=/dump

# Copy ra host
docker cp mongodb-7.0.11:/dump ./mongodb-backup
```

**Import dữ liệu training:**

```bash
# Copy vào container
docker cp ./mongodb-backup mongodb-7.0.11:/dump

# Import
docker exec mongodb-7.0.11 mongorestore \
  --username=root \
  --password=root \
  --authenticationDatabase=admin \
  /dump
```

### 4. PostgreSQL (ML Service)

**Export PostgreSQL database:**

```bash
# Export
docker exec postgresql-ml pg_dump -U postgres ml_service > ml_service_backup.sql

# Hoặc export specific tables
docker exec postgresql-ml pg_dump -U postgres -t performance_metrics ml_service > metrics.sql
```

**Import PostgreSQL database:**

```bash
# Import toàn bộ database
docker exec -i postgresql-ml psql -U postgres ml_service < ml_service_backup.sql

# Hoặc import specific file
cat ml_service_backup.sql | docker exec -i postgresql-ml psql -U postgres ml_service
```

**Tạo tables cho ML Service (nếu chưa có):**

```sql
-- Connect vào PostgreSQL
docker exec -it postgresql-ml psql -U postgres ml_service

-- Tạo tables
CREATE TABLE IF NOT EXISTS model_performance (
    id SERIAL PRIMARY KEY,
    model_version VARCHAR(50),
    accuracy DECIMAL(5,4),
    precision_score DECIMAL(5,4),
    recall_score DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS training_history (
    id SERIAL PRIMARY KEY,
    training_date TIMESTAMP,
    samples_count INTEGER,
    model_version VARCHAR(50),
    status VARCHAR(20),
    metrics JSONB
);
```

---

## 👥 Tài khoản test

Hệ thống có sẵn 4 tài khoản với các role khác nhau:

### 1. Admin (Quản trị viên hệ thống)
```
Username: admin
Password: admin
Role: ADMIN
Quyền: Toàn bộ hệ thống, quản lý users, departments, roles
```

### 2. Project Manager (Quản lý dự án)
```
Username: victor
Password: 123456
Role: PROJECT_MANAGER
Quyền: Tạo dự án, phân công task, xem báo cáo, sử dụng AI recommendations
```

### 3. Team Lead (Trưởng nhóm)
```
Username: iris
Password: 123456
Role: TEAM_LEAD
Quyền: Quản lý team, review task, phê duyệt timesheet
```

### 4. Employee (Nhân viên)
```
Username: henry
Password: 123456
Role: EMPLOYEE
Quyền: Nhận task, submit báo cáo, tracking time
```

### Đăng nhập

```
Frontend URL: http://localhost:3000
API Gateway: http://localhost:8888

Login Page: http://localhost:3000/login
```

---

## 🤖 Test chức năng AI

### 1. Phân tích CV (CV Analysis)

#### Chuẩn bị file CV

**Format hỗ trợ**: PDF, DOCX, TXT

**Nội dung CV nên có:**
```
TÊN ỨNG VIÊN
==================

THÔNG TIN CÁ NHÂN:
- Email: candidate@example.com
- Điện thoại: 0123456789
- Địa chỉ: Hà Nội, Việt Nam

KINH NGHIỆM LÀM VIỆC:
- Senior Java Developer tại FPT Software (2020-2023)
  + Phát triển hệ thống microservices với Spring Boot
  + Sử dụng Docker, Kubernetes để deploy
  + Quản lý team 5 người
  
- Full-stack Developer tại Viettel (2018-2020)
  + Phát triển web với React và Node.js
  + Database: MySQL, MongoDB
  + CI/CD với Jenkins

KỸ NĂNG:
- Programming: Java, Python, JavaScript, TypeScript
- Frontend: React, Angular, Vue.js
- Backend: Spring Boot, Node.js, Express
- Database: MySQL, PostgreSQL, MongoDB, Redis
- DevOps: Docker, Kubernetes, Jenkins, GitLab CI
- Cloud: AWS, Azure
- Other: Git, Agile/Scrum, Microservices

HỌC VẤN:
- Đại học Bách Khoa Hà Nội (2014-2018)
  Chuyên ngành: Công nghệ phần mềm
  GPA: 3.5/4.0

CHỨNG CHỈ:
- AWS Certified Solutions Architect
- Oracle Certified Java Programmer
- Scrum Master Certification

NGÔN NGỮ:
- Tiếng Việt: Native
- Tiếng Anh: Advanced (IELTS 7.0)
```

#### Test CV Analysis

1. **Login với role PROJECT_MANAGER hoặc ADMIN**
   ```
   Username: victor
   Password: 123456
   ```

2. **Truy cập trang CV Analysis**
   ```
   Frontend: http://localhost:3000/admin/cv-analysis
   ```

3. **Upload CV file**
   - Click "Upload CV"
   - Chọn file CV (PDF/DOCX/TXT)
   - Nhập tên ứng viên và vị trí apply

4. **Xem kết quả phân tích**
   - Skills được extract
   - Experience level
   - Recommended position
   - Matching score với các dự án hiện có

#### API Endpoint (Test với Postman)

```bash
# Upload và analyze CV
curl -X POST http://localhost:8888/ai/api/cv-analysis/upload-and-analyze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/cv.pdf" \
  -F "candidateName=Nguyen Van A" \
  -F "appliedPosition=Senior Java Developer"
```

### 2. Gợi ý Task (AI Task Recommendations)

#### Chuẩn bị file Requirements

**Format hỗ trợ**: PDF, DOCX, TXT, MD

**Nội dung Requirements:**

```markdown
# DỰ ÁN: HỆ THỐNG E-COMMERCE

## MÔ TẢ DỰ ÁN
Xây dựng hệ thống thương mại điện tử với các tính năng:
- Quản lý sản phẩm
- Giỏ hàng và thanh toán
- Quản lý đơn hàng
- Hệ thống khuyến mãi
- Thống kê báo cáo

## YÊU CẦU CHỨC NĂNG

### 1. Module Quản lý Sản phẩm
**Mô tả**: Quản lý danh mục và sản phẩm
**Độ ưu tiên**: Cao
**Thời gian ước tính**: 2 tuần

**Chi tiết**:
- CRUD sản phẩm (tên, mô tả, giá, hình ảnh)
- Quản lý danh mục sản phẩm (categories)
- Quản lý kho (inventory management)
- Tìm kiếm và filter sản phẩm
- Import/Export sản phẩm từ Excel

**Kỹ năng yêu cầu**:
- Backend: Java Spring Boot, RESTful API
- Frontend: React, Material-UI
- Database: MySQL
- Skills: CRUD Operations, File Upload, Search/Filter

**Dependencies**: Không có

---

### 2. Module Giỏ hàng
**Mô tả**: Quản lý giỏ hàng của khách hàng
**Độ ưu tiên**: Cao
**Thời gian ước tính**: 1 tuần

**Chi tiết**:
- Thêm sản phẩm vào giỏ
- Cập nhật số lượng
- Xóa sản phẩm khỏi giỏ
- Tính tổng giá trị đơn hàng
- Lưu giỏ hàng cho user đã login

**Kỹ năng yêu cầu**:
- Backend: Java Spring Boot, Session Management
- Frontend: React, Redux
- Database: Redis (caching)
- Skills: State Management, Caching

**Dependencies**: Module Quản lý Sản phẩm

---

### 3. Module Thanh toán
**Mô tả**: Xử lý thanh toán đơn hàng
**Độ ưu tiên**: Cao
**Thời gian ước tính**: 2 tuần

**Chi tiết**:
- Tích hợp VNPay, MoMo
- Xử lý thanh toán COD
- Xác nhận thanh toán
- Gửi email thông báo
- Lưu lịch sử giao dịch

**Kỹ năng yêu cầu**:
- Backend: Java Spring Boot, Payment Gateway Integration
- Third-party APIs: VNPay, MoMo
- Database: MySQL (transaction logs)
- Skills: Payment Integration, Email Service

**Dependencies**: Module Giỏ hàng

---

### 4. Module Quản lý Đơn hàng
**Mô tả**: Quản lý đơn hàng và trạng thái
**Độ ưu tiên**: Trung bình
**Thời gian ước tính**: 1.5 tuần

**Chi tiết**:
- Xem danh sách đơn hàng
- Cập nhật trạng thái (pending, processing, shipped, delivered)
- Hủy đơn hàng
- In hóa đơn
- Tracking đơn hàng

**Kỹ năng yêu cầu**:
- Backend: Java Spring Boot
- Frontend: React, Chart.js
- Database: MySQL
- Skills: Order Management, PDF Generation, Notifications

**Dependencies**: Module Thanh toán

---

### 5. Module Khuyến mãi
**Mô tả**: Quản lý chương trình khuyến mãi
**Độ ưu tiên**: Thấp
**Thời gian ước tính**: 1 tuần

**Chi tiết**:
- Tạo mã giảm giá (discount codes)
- Áp dụng khuyến mãi theo %
- Khuyến mãi theo sản phẩm/danh mục
- Giới hạn số lượng sử dụng
- Thời gian có hiệu lực

**Kỹ năng yêu cầu**:
- Backend: Java Spring Boot
- Frontend: React
- Database: MySQL
- Skills: Promotion Logic, Validation

**Dependencies**: Module Quản lý Sản phẩm, Module Giỏ hàng

---

### 6. Module Báo cáo & Thống kê
**Mô tả**: Thống kê doanh thu và báo cáo
**Độ ưu tiên**: Trung bình
**Thời gian ước tính**: 1 tuần

**Chi tiết**:
- Dashboard tổng quan
- Báo cáo doanh thu theo ngày/tháng/năm
- Top sản phẩm bán chạy
- Thống kê khách hàng
- Export báo cáo Excel/PDF

**Kỹ năng yêu cầu**:
- Backend: Java Spring Boot, Data Analytics
- Frontend: React, Chart.js, Recharts
- Database: MySQL (aggregation queries)
- Skills: Data Visualization, Report Generation

**Dependencies**: Module Quản lý Đơn hàng

---

## YÊU CẦU KỸ THUẬT

### Backend
- Framework: Spring Boot 3.2.x
- Language: Java 21
- Database: MySQL 8.0
- Cache: Redis
- Message Queue: Kafka
- Authentication: JWT

### Frontend
- Framework: React 18
- UI Library: Material-UI, Tailwind CSS
- State Management: Redux Toolkit
- HTTP Client: Axios

### DevOps
- Containerization: Docker
- CI/CD: GitHub Actions
- Cloud: AWS (optional)

### Security
- HTTPS/TLS
- JWT Authentication
- Input Validation
- SQL Injection Prevention
- XSS Protection

## TIMELINE
- Tổng thời gian: 8-10 tuần
- Phase 1 (Week 1-4): Module 1, 2, 3
- Phase 2 (Week 5-7): Module 4, 5
- Phase 3 (Week 8-10): Module 6, Testing, Deployment
```

#### Test AI Task Recommendations

1. **Login với role PROJECT_MANAGER**
   ```
   Username: victor
   Password: 123456
   ```

2. **Tạo Project mới**
   - Vào menu "Projects Management"
   - Click "Create New Project"
   - Điền thông tin:
     ```
     Project Name: E-Commerce System
     Description: Hệ thống thương mại điện tử
     Start Date: 2025-01-01
     End Date: 2025-03-31
     ```

3. **Upload Requirements Document**
   - Trong project detail page
   - Click "Import Requirements"
   - Upload file requirements (PDF/DOCX/TXT/MD)

4. **Xem AI Task Recommendations**
   - AI sẽ tự động phân tích document
   - Gợi ý các tasks với:
     + Task name
     + Description
     + Priority
     + Estimated time
     + Required skills
     + Dependencies
     + Recommended assignees (dựa trên skills matching)

5. **Tạo Tasks từ recommendations**
   - Review các tasks được gợi ý
   - Click "Create Task" cho từng item
   - Chỉnh sửa nếu cần
   - Assign cho team members

#### API Endpoint (Test với Postman)

```bash
# Get AI recommendations cho một project
curl -X GET "http://localhost:8888/ai/api/recommendations/project/PROJECT_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Upload requirements và nhận recommendations
curl -X POST "http://localhost:8888/ai/api/recommendations/analyze-requirements" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/requirements.pdf" \
  -F "projectId=PROJECT_ID"

# Get task assignment recommendations
curl -X POST "http://localhost:8888/ai/api/recommendations/assign-task" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "task_id",
    "projectId": "project_id",
    "requiredSkills": ["Java", "Spring Boot", "React"],
    "priority": "HIGH"
  }'
```

### 3. ML-based Performance Prediction

#### Test ML predictions

```bash
# Predict task completion time
curl -X POST http://localhost:5000/predict/completion-time \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "task_complexity": "HIGH",
    "required_skills": ["Java", "Spring Boot"],
    "user_experience": 3.5,
    "current_workload": 5
  }'

# Predict performance score
curl -X POST http://localhost:5000/predict/performance \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "task_id": "task456",
    "historical_data": {...}
  }'
```

---

## 🧹 Cleanup Code

Hệ thống đã được tích hợp công cụ tự động cleanup unused code.

### Kiểm tra unused code

```bash
./cleanup-unused-code.sh
```

### Tự động cleanup (cẩn thận!)

```bash
./cleanup-unused-code-auto.sh
```

### Hướng dẫn chi tiết

Xem file `CLEANUP-GUIDE.md` để biết thêm chi tiết.

---

## 📚 API Documentation

### Swagger UI

Mỗi service có Swagger UI riêng:

```
Identity Service:     http://localhost:8080/swagger-ui.html
Profile Service:      http://localhost:8081/swagger-ui.html
Project Service:      http://localhost:8082/swagger-ui.html
Task Service:         http://localhost:8083/swagger-ui.html
Workload Service:     http://localhost:8084/swagger-ui.html
AI Service:           http://localhost:8085/swagger-ui.html
Chat Service:         http://localhost:8086/swagger-ui.html
Notification Service: http://localhost:8087/swagger-ui.html
Post Service:         http://localhost:8088/swagger-ui.html
File Service:         http://localhost:8089/swagger-ui.html
```

### Postman Collection

Import file `postman-collections/Internal-Management-API.postman_collection.json` vào Postman.

---

## 🐛 Troubleshooting

### Port đã được sử dụng

```bash
# Kiểm tra process đang dùng port
lsof -i :8080

# Kill process
kill -9 <PID>
```

### Database connection errors

```bash
# Kiểm tra containers
docker ps

# Restart container
docker restart mysql-oracle
docker restart neo4j
docker restart mongodb-7.0.11
docker restart postgresql-ml

# Xem logs
docker logs mysql-oracle
```

### ML Service errors

```bash
# Kiểm tra Python version
python3 --version  # Cần 3.11

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Clear cache
rm -rf models/*.pkl
rm -rf models/*.h5
```

### Frontend không connect được API

```bash
# Kiểm tra API Gateway
curl http://localhost:8888/actuator/health

# Kiểm tra CORS trong application.yaml của gateway
```

---

## 📖 Thêm tài liệu

- **CLEANUP-GUIDE.md** - Hướng dẫn sử dụng cleanup tools
- **CLEANUP-RESULT-REPORT.md** - Báo cáo cleanup gần nhất
- **ml-service/README.md** - Chi tiết về ML Service (nếu có)

---

## 👨‍💻 Liên hệ & Đóng góp

### Repository
```
GitHub: https://github.com/ptanh412/InternalManagement
```

### Report Issues
Nếu gặp vấn đề, vui lòng tạo issue trên GitHub.

---

## 📝 License

MIT License - Tự do sử dụng cho mục đích học tập và thương mại.

---

**Phiên bản**: 2.0.0  
**Cập nhật**: 29/12/2025  
**Tác giả**: Internal Management Team

