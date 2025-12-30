#!/bin/bash

# Import All Databases Script
# This script imports MySQL, Neo4j, MongoDB, and PostgreSQL databases from ready-to-import backup folder

set -e  # Exit on any error

BACKUP_DIR="database-backups-ready-to-import"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="import_log_${TIMESTAMP}.txt"

echo "🔄 Starting database import process..." | tee -a "$LOG_FILE"
echo "📅 Timestamp: $(date)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Check if backup folder exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Error: Backup folder '$BACKUP_DIR' not found!" | tee -a "$LOG_FILE"
    exit 1
fi

# Check if all containers are running
echo "🔍 Checking Docker containers..." | tee -a "$LOG_FILE"
CONTAINERS=("mysql-oracle" "neo4j" "mongodb" "ml-postgres")
for container in "${CONTAINERS[@]}"; do
    if ! docker ps | grep -q "$container"; then
        echo "⚠️  Warning: Container '$container' is not running!" | tee -a "$LOG_FILE"
        echo "   Start it with: docker start $container" | tee -a "$LOG_FILE"
    else
        echo "✅ Container '$container' is running" | tee -a "$LOG_FILE"
    fi
done
echo "" | tee -a "$LOG_FILE"

# Function to run command with error handling
run_command() {
    local description=$1
    shift
    echo "⏳ $description..." | tee -a "$LOG_FILE"
    if "$@" >> "$LOG_FILE" 2>&1; then
        echo "✅ $description completed" | tee -a "$LOG_FILE"
        return 0
    else
        echo "❌ Error: $description failed" | tee -a "$LOG_FILE"
        return 1
    fi
}

# 1. MySQL Import
echo "📊 MySQL Database Import" | tee -a "$LOG_FILE"
echo "=====================================" | tee -a "$LOG_FILE"
if [ -f "$BACKUP_DIR/mysql/all_databases.sql" ]; then
    FILE_SIZE=$(du -h "$BACKUP_DIR/mysql/all_databases.sql" | cut -f1)
    echo "📁 File: all_databases.sql (${FILE_SIZE})" | tee -a "$LOG_FILE"
    
    run_command "Importing MySQL databases" \
        docker exec -i mysql-oracle sh -c 'exec mysql -uroot -p123456' < "$BACKUP_DIR/mysql/all_databases.sql"
    
    echo "🔍 Verifying MySQL import..." | tee -a "$LOG_FILE"
    docker exec mysql-oracle mysql -uroot -p123456 -e "SHOW DATABASES;" >> "$LOG_FILE" 2>&1
else
    echo "⚠️  MySQL backup file not found" | tee -a "$LOG_FILE"
fi
echo "" | tee -a "$LOG_FILE"

# 2. Neo4j Import
echo "🔗 Neo4j Graph Database Import" | tee -a "$LOG_FILE"
echo "=====================================" | tee -a "$LOG_FILE"
if [ -f "$BACKUP_DIR/neo4j/neo4j.dump" ]; then
    FILE_SIZE=$(du -h "$BACKUP_DIR/neo4j/neo4j.dump" | cut -f1)
    echo "📁 File: neo4j.dump (${FILE_SIZE})" | tee -a "$LOG_FILE"
    
    echo "⏸  Stopping Neo4j container..." | tee -a "$LOG_FILE"
    docker stop neo4j >> "$LOG_FILE" 2>&1 || true
    sleep 3
    
    run_command "Copying Neo4j dump to container" \
        docker cp "$BACKUP_DIR/neo4j/neo4j.dump" neo4j:/tmp/
    
    run_command "Loading Neo4j database" \
        docker exec neo4j neo4j-admin database load --from-path=/tmp neo4j --overwrite-destination=true
    
    echo "▶️  Starting Neo4j container..." | tee -a "$LOG_FILE"
    docker start neo4j >> "$LOG_FILE" 2>&1
    
    echo "⏳ Waiting for Neo4j to be ready (15s)..." | tee -a "$LOG_FILE"
    sleep 15
    echo "✅ Neo4j is ready at http://localhost:7474" | tee -a "$LOG_FILE"
else
    echo "⚠️  Neo4j backup file not found" | tee -a "$LOG_FILE"
fi
echo "" | tee -a "$LOG_FILE"

# 3. MongoDB Import
echo "🍃 MongoDB Database Import" | tee -a "$LOG_FILE"
echo "=====================================" | tee -a "$LOG_FILE"
if [ -d "$BACKUP_DIR/mongodb/mongodb-backup" ]; then
    FOLDER_SIZE=$(du -sh "$BACKUP_DIR/mongodb/mongodb-backup" | cut -f1)
    echo "📁 Folder: mongodb-backup (${FOLDER_SIZE})" | tee -a "$LOG_FILE"
    
    run_command "Copying MongoDB backup to container" \
        docker cp "$BACKUP_DIR/mongodb/mongodb-backup" mongodb:/tmp/
    
    run_command "Restoring MongoDB databases" \
        docker exec mongodb mongorestore --drop /tmp/mongodb-backup
    
    run_command "Cleaning up temporary files" \
        docker exec mongodb rm -rf /tmp/mongodb-backup
    
    echo "🔍 Verifying MongoDB import..." | tee -a "$LOG_FILE"
    docker exec mongodb mongosh --eval "show dbs" --quiet >> "$LOG_FILE" 2>&1
else
    echo "⚠️  MongoDB backup folder not found" | tee -a "$LOG_FILE"
fi
echo "" | tee -a "$LOG_FILE"

# 4. PostgreSQL Import
echo "🐘 PostgreSQL Database Import" | tee -a "$LOG_FILE"
echo "=====================================" | tee -a "$LOG_FILE"
if [ -f "$BACKUP_DIR/postgresql/ml_training_db.dump" ]; then
    FILE_SIZE=$(du -h "$BACKUP_DIR/postgresql/ml_training_db.dump" | cut -f1)
    echo "📁 File: ml_training_db.dump (${FILE_SIZE})" | tee -a "$LOG_FILE"
    
    run_command "Copying PostgreSQL dump to container" \
        docker cp "$BACKUP_DIR/postgresql/ml_training_db.dump" ml-postgres:/tmp/
    
    # Terminate existing connections
    echo "🔌 Terminating existing connections..." | tee -a "$LOG_FILE"
    docker exec ml-postgres psql -U ml_user -d postgres -c \
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='ml_training_db' AND pid <> pg_backend_pid();" \
        >> "$LOG_FILE" 2>&1 || true
    
    run_command "Restoring PostgreSQL database" \
        docker exec ml-postgres pg_restore -U ml_user -d ml_training_db -c -F c /tmp/ml_training_db.dump
    
    run_command "Cleaning up temporary files" \
        docker exec ml-postgres rm /tmp/ml_training_db.dump
    
    echo "🔍 Verifying PostgreSQL import..." | tee -a "$LOG_FILE"
    docker exec ml-postgres psql -U ml_user -d ml_training_db -c "\dt" >> "$LOG_FILE" 2>&1
else
    echo "⚠️  PostgreSQL backup file not found" | tee -a "$LOG_FILE"
fi
echo "" | tee -a "$LOG_FILE"

# Summary
echo "=====================================" | tee -a "$LOG_FILE"
echo "🎉 Database Import Summary" | tee -a "$LOG_FILE"
echo "=====================================" | tee -a "$LOG_FILE"
echo "✅ MySQL:      4 databases (identity, project, task, workload)" | tee -a "$LOG_FILE"
echo "✅ Neo4j:      Graph database (nodes, relationships)" | tee -a "$LOG_FILE"
echo "✅ MongoDB:    8 databases (ai_service, chat-service, file-service, etc.)" | tee -a "$LOG_FILE"
echo "✅ PostgreSQL: ml_training_db (ML models, training data)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "📋 Next Steps:" | tee -a "$LOG_FILE"
echo "   1. Start all microservices" | tee -a "$LOG_FILE"
echo "   2. Access Frontend: http://localhost:3000" | tee -a "$LOG_FILE"
echo "   3. Test with accounts: admin/admin, victor/123456" | tee -a "$LOG_FILE"
echo "   4. Check Neo4j Browser: http://localhost:7474" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "📝 Full log saved to: $LOG_FILE" | tee -a "$LOG_FILE"
echo "✨ Import process completed at $(date)" | tee -a "$LOG_FILE"
