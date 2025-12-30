# Database Backups - Ready to Import

Thư mục này chứa các file backup đầy đủ của tất cả databases trong hệ thống Internal Management. Bạn chỉ cần chạy các lệnh Docker đơn giản để import dữ liệu vào container mới.

## 📦 Nội dung Backup

| Database | File/Folder | Kích thước | Mô tả |
|----------|------------|-----------|-------|
| **MySQL** | `mysql/all_databases.sql` | 4.3 MB | Toàn bộ 4 databases: identity, project, task, workload |
| **Neo4j** | `neo4j/neo4j.dump` | 40 KB | Graph database dump (quan hệ users, projects, tasks) |
| **MongoDB** | `mongodb/mongodb-backup/` | 4.1 MB | 8 databases: ai_service, chat-service, file-service, notification-service, post-service, admin, config, local |
| **PostgreSQL** | `postgresql/ml_training_db.dump` | 41 MB | ML training database (models, training data, predictions) |

**Tổng dung lượng:** ~49.4 MB

## 🚀 Hướng dẫn Import nhanh

### 1️⃣ MySQL - Import tất cả databases

```bash
# Copy file vào container
docker cp mysql/all_databases.sql mysql-oracle:/tmp/

# Import vào MySQL
docker exec -i mysql-oracle mysql -uroot -p123456 < mysql/all_databases.sql

# Hoặc import trực tiếp (nhanh hơn)
docker exec -i mysql-oracle sh -c 'exec mysql -uroot -p123456' < mysql/all_databases.sql
```

**Kiểm tra:**
```bash
docker exec mysql-oracle mysql -uroot -p123456 -e "SHOW DATABASES;"
```

### 2️⃣ Neo4j - Import graph database

```bash
# Dừng Neo4j container
docker stop neo4j

# Copy dump file vào container
docker cp neo4j/neo4j.dump neo4j:/tmp/

# Load database từ dump
docker exec neo4j neo4j-admin database load --from-path=/tmp neo4j --overwrite-destination=true

# Khởi động lại
docker start neo4j
```

**Kiểm tra:**
Truy cập http://localhost:7474 (user: neo4j, pass: 12345678)

### 3️⃣ MongoDB - Import tất cả collections

```bash
# Copy toàn bộ thư mục backup vào container
docker cp mongodb/mongodb-backup mongodb:/tmp/

# Restore tất cả databases
docker exec mongodb mongorestore --drop /tmp/mongodb-backup

# Xóa file tạm trong container
docker exec mongodb rm -rf /tmp/mongodb-backup
```

**Kiểm tra:**
```bash
docker exec mongodb mongosh --eval "show dbs"
docker exec mongodb mongosh ai_service --eval "db.getCollectionNames()"
```

### 4️⃣ PostgreSQL - Import ML training database

```bash
# Copy dump file vào container
docker cp postgresql/ml_training_db.dump ml-postgres:/tmp/

# Restore database (custom format)
docker exec ml-postgres pg_restore -U ml_user -d ml_training_db -c -F c /tmp/ml_training_db.dump

# Xóa file tạm
docker exec ml-postgres rm /tmp/ml_training_db.dump
```

**Kiểm tra:**
```bash
docker exec ml-postgres psql -U ml_user -d ml_training_db -c "\dt"
```

## 🔄 Import tất cả databases (Script tự động)

Tạo file `import-all.sh` tại thư mục gốc của project:

```bash
#!/bin/bash

echo "🔄 Starting database import process..."

# MySQL
echo "📊 Importing MySQL..."
docker exec -i mysql-oracle sh -c 'exec mysql -uroot -p123456' < database-backups-ready-to-import/mysql/all_databases.sql
echo "✅ MySQL imported"

# Neo4j
echo "🔗 Importing Neo4j..."
docker stop neo4j
docker cp database-backups-ready-to-import/neo4j/neo4j.dump neo4j:/tmp/
docker exec neo4j neo4j-admin database load --from-path=/tmp neo4j --overwrite-destination=true
docker start neo4j
echo "✅ Neo4j imported"

# MongoDB
echo "🍃 Importing MongoDB..."
docker cp database-backups-ready-to-import/mongodb/mongodb-backup mongodb:/tmp/
docker exec mongodb mongorestore --drop /tmp/mongodb-backup
docker exec mongodb rm -rf /tmp/mongodb-backup
echo "✅ MongoDB imported"

# PostgreSQL
echo "🐘 Importing PostgreSQL..."
docker cp database-backups-ready-to-import/postgresql/ml_training_db.dump ml-postgres:/tmp/
docker exec ml-postgres pg_restore -U ml_user -d ml_training_db -c -F c /tmp/ml_training_db.dump
docker exec ml-postgres rm /tmp/ml_training_db.dump
echo "✅ PostgreSQL imported"

echo "🎉 All databases imported successfully!"
```

**Chạy script:**
```bash
chmod +x import-all.sh
./import-all.sh
```

## 📋 Thông tin Databases

### MySQL (Port 3306)
- **User:** root
- **Password:** 123456
- **Databases:**
  - `identity` - User authentication, roles, permissions
  - `project` - Projects management, team assignments
  - `task` - Tasks, deadlines, task extensions
  - `workload` - User workload tracking, capacity planning

### Neo4j (Ports 7474, 7687)
- **User:** neo4j
- **Password:** 12345678
- **Data:** User relationships, project graphs, task dependencies

### MongoDB (Port 27017)
- **No authentication configured**
- **Databases:**
  - `ai_service` - CV analysis, AI job matching
  - `chat-service` - Real-time chat, conversations
  - `file-service` - File uploads, storage metadata
  - `notification-service` - User notifications (4029 notifications)
  - `post-service` - Posts, comments, reactions

### PostgreSQL (Port 5433→5432)
- **User:** ml_user
- **Password:** ml_password
- **Database:** `ml_training_db` - Machine learning models, training data

## 🔍 Kiểm tra sau khi Import

```bash
# MySQL - Check tables count
docker exec mysql-oracle mysql -uroot -p123456 -e "
SELECT table_schema, COUNT(*) as tables 
FROM information_schema.tables 
WHERE table_schema IN ('identity','project','task','workload') 
GROUP BY table_schema;"

# Neo4j - Check nodes count
docker exec neo4j cypher-shell -u neo4j -p 12345678 "MATCH (n) RETURN count(n);"

# MongoDB - Check collections count
docker exec mongodb mongosh --eval "
  ['ai_service','chat-service','file-service','notification-service','post-service'].forEach(db => {
    const collections = db.getSiblingDB(db).getCollectionNames().length;
    print(db + ': ' + collections + ' collections');
  })
"

# PostgreSQL - Check tables count
docker exec ml-postgres psql -U ml_user -d ml_training_db -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
```

## ⚠️ Lưu ý quan trọng

1. **Backup hiện tại trước khi import** (nếu có dữ liệu quan trọng):
   ```bash
   # Chạy script export-all-databases.sh trước
   ./export-all-databases.sh
   ```

2. **Containers phải đang chạy:**
   ```bash
   docker ps | grep -E "mysql-oracle|neo4j|mongodb|ml-postgres"
   ```

3. **Neo4j import yêu cầu dừng container** - Dữ liệu sẽ bị ghi đè
4. **MongoDB restore với `--drop` flag** - Collections cũ sẽ bị xóa
5. **PostgreSQL `pg_restore` với `-c` flag** - Tables cũ sẽ bị xóa trước

## 📝 Test Accounts

Sau khi import MySQL database, bạn có thể login với:

| Username | Password | Role |
|----------|----------|------|
| admin | admin | ADMIN |
| victor | 123456 | USER |
| iris | 123456 | MANAGER |
| henry | 123456 | USER |

## 🆘 Troubleshooting

**Lỗi: "Access denied for user"**
```bash
# MySQL - Reset password
docker exec mysql-oracle mysql -uroot -p123456 -e "ALTER USER 'root'@'%' IDENTIFIED BY '123456';"
```

**Lỗi: "Database already exists"**
```bash
# Drop database trước khi import
docker exec mysql-oracle mysql -uroot -p123456 -e "DROP DATABASE IF EXISTS identity;"
```

**Neo4j: "Database is locked"**
```bash
# Đảm bảo container đã dừng hoàn toàn
docker stop neo4j
sleep 5
docker exec neo4j neo4j-admin database load ...
```

**PostgreSQL: "Database is being accessed"**
```bash
# Terminate connections
docker exec ml-postgres psql -U ml_user -d postgres -c "
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname='ml_training_db';"
```

## 📅 Thông tin Backup

- **Ngày tạo:** 30/12/2025
- **Source:** Internal Management System
- **Docker Version:** 24.0+
- **Database Versions:**
  - MySQL: 8.0
  - Neo4j: Latest
  - MongoDB: 7.0.11
  - PostgreSQL: 15

---

**💡 Tip:** Sau khi import xong, chạy các microservices và truy cập:
- Frontend: http://localhost:3000
- API Gateway: http://localhost:8888
- Neo4j Browser: http://localhost:7474
