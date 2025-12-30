#!/bin/bash

# ============================================================
# Script Import All Databases
# Import data to MySQL, Neo4j, MongoDB, PostgreSQL
# ============================================================

set -e

BACKUP_DIR="$(pwd)/database-backups"

echo "🗄️  Starting database import..."
echo "📁 Backup directory: $BACKUP_DIR"
echo ""

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Backup directory not found: $BACKUP_DIR"
    echo "   Please run export-all-databases.sh first"
    exit 1
fi

# ============================================================
# SELECT BACKUP TO IMPORT
# ============================================================
echo "📋 Available backups:"
echo ""

# List MySQL backups
echo "MySQL backups:"
ls -lh "$BACKUP_DIR/mysql/"*.sql 2>/dev/null | awk '{print "   " $9 " (" $5 ")"}'

echo ""
read -p "Enter the timestamp of backup to import (YYYYMMDD_HHMMSS): " TIMESTAMP

if [ -z "$TIMESTAMP" ]; then
    echo "❌ No timestamp provided"
    exit 1
fi

echo ""
echo "⚠️  WARNING: This will OVERWRITE existing data!"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Import cancelled."
    exit 0
fi

echo ""

# ============================================================
# 1. MYSQL - Import databases
# ============================================================
echo "📦 1. Importing MySQL databases..."

if docker ps | grep -q "mysql-oracle"; then
    # Import all databases
    if [ -f "$BACKUP_DIR/mysql/all_databases_${TIMESTAMP}.sql" ]; then
        echo "   → Importing all databases from backup..."
        docker exec -i mysql-oracle mysql -uroot -p123456 < "$BACKUP_DIR/mysql/all_databases_${TIMESTAMP}.sql"
        
        if [ $? -eq 0 ]; then
            echo "      ✅ All MySQL databases imported successfully"
        else
            echo "      ❌ Failed to import MySQL databases"
        fi
    else
        # Import individual databases
        for sql_file in "$BACKUP_DIR/mysql/"*_${TIMESTAMP}.sql; do
            if [ -f "$sql_file" ]; then
                db_name=$(basename "$sql_file" | sed "s/_${TIMESTAMP}.sql//")
                echo "   → Importing database: $db_name"
                
                # Create database if not exists
                docker exec mysql-oracle mysql -uroot -p123456 -e "CREATE DATABASE IF NOT EXISTS $db_name;"
                
                # Import
                docker exec -i mysql-oracle mysql -uroot -p123456 $db_name < "$sql_file"
                
                if [ $? -eq 0 ]; then
                    echo "      ✅ Imported $db_name"
                else
                    echo "      ❌ Failed to import $db_name"
                fi
            fi
        done
    fi
else
    echo "   ⚠️  MySQL container 'mysql-oracle' is not running"
    echo "   Start it with: docker start mysql-oracle"
fi

echo ""

# ============================================================
# 2. NEO4J - Import graph data
# ============================================================
echo "📦 2. Importing Neo4j graph database..."

if docker ps | grep -q "neo4j"; then
    if [ -d "$BACKUP_DIR/neo4j/data_${TIMESTAMP}" ]; then
        echo "   → Stopping Neo4j..."
        docker stop neo4j
        
        echo "   → Importing data..."
        docker cp "$BACKUP_DIR/neo4j/data_${TIMESTAMP}/." neo4j:/data/
        
        echo "   → Starting Neo4j..."
        docker start neo4j
        
        if [ $? -eq 0 ]; then
            echo "      ✅ Neo4j data imported successfully"
            echo "      ⏳ Waiting for Neo4j to start (15 seconds)..."
            sleep 15
        else
            echo "      ❌ Failed to import Neo4j data"
        fi
    else
        echo "   ⚠️  Neo4j backup not found for timestamp: $TIMESTAMP"
    fi
else
    echo "   ⚠️  Neo4j container is not running"
    echo "   Start it with: docker start neo4j"
fi

echo ""

# ============================================================
# 3. MONGODB - Import collections
# ============================================================
echo "📦 3. Importing MongoDB databases..."

if docker ps | grep -q "mongodb"; then
    if [ -d "$BACKUP_DIR/mongodb/dump_${TIMESTAMP}" ]; then
        echo "   → Copying dump to container..."
        docker cp "$BACKUP_DIR/mongodb/dump_${TIMESTAMP}" mongodb:/dump_restore
        
        echo "   → Restoring MongoDB data..."
        docker exec mongodb mongorestore \
            --username=root \
            --password=root \
            --authenticationDatabase=admin \
            --drop \
            /dump_restore
        
        if [ $? -eq 0 ]; then
            echo "      ✅ MongoDB data imported successfully"
        else
            echo "      ❌ Failed to import MongoDB data"
        fi
        
        # Clean up
        docker exec mongodb rm -rf /dump_restore
    else
        echo "   ⚠️  MongoDB backup not found for timestamp: $TIMESTAMP"
    fi
    
    # Import JSON if exists
    if [ -f "$BACKUP_DIR/mongodb/training_data_${TIMESTAMP}.json" ]; then
        echo "   → Importing training_data collection..."
        docker cp "$BACKUP_DIR/mongodb/training_data_${TIMESTAMP}.json" mongodb:/training_data.json
        
        docker exec mongodb mongoimport \
            --username=root \
            --password=root \
            --authenticationDatabase=admin \
            --db=ml_training \
            --collection=training_data \
            --file=/training_data.json
        
        docker exec mongodb rm -f /training_data.json
        echo "      ✅ training_data collection imported"
    fi
else
    echo "   ⚠️  MongoDB container 'mongodb' is not running"
    echo "   Start it with: docker start mongodb"
fi

echo ""

# ============================================================
# 4. POSTGRESQL - Import databases
# ============================================================
echo "📦 4. Importing PostgreSQL databases..."

if docker ps | grep -q "ml-postgres"; then
    if [ -f "$BACKUP_DIR/postgresql/all_databases_${TIMESTAMP}.sql" ]; then
        echo "   → Importing all databases..."
        docker exec -i ml-postgres psql -U postgres < "$BACKUP_DIR/postgresql/all_databases_${TIMESTAMP}.sql"
        
        if [ $? -eq 0 ]; then
            echo "      ✅ All PostgreSQL databases imported"
        else
            echo "      ❌ Failed to import PostgreSQL databases"
        fi
    elif [ -f "$BACKUP_DIR/postgresql/ml_service_${TIMESTAMP}.sql" ]; then
        echo "   → Importing ml_service database..."
        
        # Drop and recreate database
        docker exec ml-postgres psql -U postgres -c "DROP DATABASE IF EXISTS ml_service;"
        docker exec ml-postgres psql -U postgres -c "CREATE DATABASE ml_service;"
        
        # Import
        docker exec -i ml-postgres psql -U postgres ml_service < "$BACKUP_DIR/postgresql/ml_service_${TIMESTAMP}.sql"
        
        if [ $? -eq 0 ]; then
            echo "      ✅ ml_service database imported"
        else
            echo "      ❌ Failed to import ml_service"
        fi
    else
        echo "   ⚠️  PostgreSQL backup not found for timestamp: $TIMESTAMP"
    fi
else
    echo "   ⚠️  PostgreSQL container 'ml-postgres' is not running"
    echo "   Start it with: docker start ml-postgres"
fi

echo ""

# ============================================================
# SUMMARY
# ============================================================
echo "═══════════════════════════════════════════════════════"
echo "✅ Import completed!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "📊 Verify your data:"
echo ""
echo "MySQL:"
echo "   docker exec -it mysql-oracle mysql -uroot -p123456 -e 'SHOW DATABASES;'"
echo ""
echo "Neo4j:"
echo "   Open http://localhost:7474"
echo ""
echo "MongoDB:"
echo "   docker exec -it mongodb mongosh -u root -p root"
echo ""
echo "PostgreSQL:"
echo "   docker exec -it ml-postgres psql -U postgres -l"
echo ""
