#!/bin/bash

# ============================================================
# Script Export All Databases
# Export data from MySQL, Neo4j, MongoDB, PostgreSQL
# ============================================================

set -e

BACKUP_DIR="$(pwd)/database-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🗄️  Starting database export..."
echo "📁 Backup directory: $BACKUP_DIR"
echo "⏰ Timestamp: $TIMESTAMP"
echo ""

# ============================================================
# 1. MYSQL - Export all databases
# ============================================================
echo "📦 1. Exporting MySQL databases..."

if docker ps | grep -q "mysql-oracle"; then
    echo "   → MySQL container is running"
    
    # Get list of databases
    DATABASES=$(docker exec mysql-oracle mysql -uroot -p123456 -e "SHOW DATABASES;" | grep -v -E "Database|information_schema|performance_schema|mysql|sys")
    
    for db in $DATABASES; do
        echo "   → Exporting database: $db"
        docker exec mysql-oracle mysqldump -uroot -p123456 \
            --single-transaction \
            --routines \
            --triggers \
            --events \
            $db > "$BACKUP_DIR/mysql/${db}_${TIMESTAMP}.sql"
        
        if [ $? -eq 0 ]; then
            echo "      ✅ Exported $db ($(du -h "$BACKUP_DIR/mysql/${db}_${TIMESTAMP}.sql" | cut -f1))"
        else
            echo "      ❌ Failed to export $db"
        fi
    done
    
    # Export all databases in one file
    echo "   → Exporting ALL databases to single file..."
    docker exec mysql-oracle mysqldump -uroot -p123456 \
        --all-databases \
        --single-transaction \
        --routines \
        --triggers \
        --events > "$BACKUP_DIR/mysql/all_databases_${TIMESTAMP}.sql"
    echo "      ✅ All databases exported ($(du -h "$BACKUP_DIR/mysql/all_databases_${TIMESTAMP}.sql" | cut -f1))"
    
else
    echo "   ⚠️  MySQL container 'mysql-oracle' is not running"
fi

echo ""

# ============================================================
# 2. NEO4J - Export graph data
# ============================================================
echo "📦 2. Exporting Neo4j graph database..."

if docker ps | grep -q "neo4j"; then
    echo "   → Neo4j container is running"
    
    # Stop Neo4j to export safely
    echo "   → Stopping Neo4j temporarily..."
    docker stop neo4j
    
    # Export using neo4j-admin dump
    echo "   → Creating database dump..."
    docker start neo4j
    sleep 5
    
    # Export using cypher-shell (export as Cypher statements)
    docker exec neo4j cypher-shell -u neo4j -p 12345678 \
        "CALL apoc.export.cypher.all('export_${TIMESTAMP}.cypher', {format: 'cypher-shell'})" \
        2>/dev/null || true
    
    # Alternative: Copy database files
    docker cp neo4j:/data "$BACKUP_DIR/neo4j/data_${TIMESTAMP}"
    
    if [ $? -eq 0 ]; then
        echo "      ✅ Neo4j data exported"
        echo "      📊 Size: $(du -sh "$BACKUP_DIR/neo4j/data_${TIMESTAMP}" | cut -f1)"
    else
        echo "      ❌ Failed to export Neo4j data"
    fi
    
else
    echo "   ⚠️  Neo4j container is not running"
fi

echo ""

# ============================================================
# 3. MONGODB - Export collections
# ============================================================
echo "📦 3. Exporting MongoDB databases..."

if docker ps | grep -q "mongodb"; then
    echo "   → MongoDB container is running"
    
    # Export all databases
    echo "   → Creating MongoDB dump..."
    docker exec mongodb mongodump \
        --username=root \
        --password=root \
        --authenticationDatabase=admin \
        --out=/dump_${TIMESTAMP}
    
    # Copy dump to host
    docker cp mongodb:/dump_${TIMESTAMP} "$BACKUP_DIR/mongodb/dump_${TIMESTAMP}"
    
    if [ $? -eq 0 ]; then
        echo "      ✅ MongoDB data exported"
        echo "      📊 Size: $(du -sh "$BACKUP_DIR/mongodb/dump_${TIMESTAMP}" | cut -f1)"
    else
        echo "      ❌ Failed to export MongoDB data"
    fi
    
    # Clean up container dump
    docker exec mongodb rm -rf /dump_${TIMESTAMP}
    
    # Export specific database to JSON (if exists)
    echo "   → Exporting ml_training database to JSON..."
    docker exec mongodb mongoexport \
        --username=root \
        --password=root \
        --authenticationDatabase=admin \
        --db=ml_training \
        --collection=training_data \
        --out=/training_data_${TIMESTAMP}.json 2>/dev/null || echo "      ⚠️  ml_training database not found"
    
    # Copy JSON export
    docker cp mongodb:/training_data_${TIMESTAMP}.json "$BACKUP_DIR/mongodb/" 2>/dev/null || true
    docker exec mongodb rm -f /training_data_${TIMESTAMP}.json 2>/dev/null || true
    
else
    echo "   ⚠️  MongoDB container 'mongodb' is not running"
fi

echo ""

# ============================================================
# 4. POSTGRESQL - Export databases
# ============================================================
echo "📦 4. Exporting PostgreSQL databases..."

if docker ps | grep -q "ml-postgres"; then
    echo "   → PostgreSQL container is running"
    
    # Export ml_service database
    echo "   → Exporting ml_service database..."
    docker exec ml-postgres pg_dump -U postgres ml_service > "$BACKUP_DIR/postgresql/ml_service_${TIMESTAMP}.sql"
    
    if [ $? -eq 0 ]; then
        echo "      ✅ ml_service exported ($(du -h "$BACKUP_DIR/postgresql/ml_service_${TIMESTAMP}.sql" | cut -f1))"
    else
        echo "      ❌ Failed to export ml_service"
    fi
    
    # Export all databases
    echo "   → Exporting all PostgreSQL databases..."
    docker exec ml-postgres pg_dumpall -U postgres > "$BACKUP_DIR/postgresql/all_databases_${TIMESTAMP}.sql"
    
    if [ $? -eq 0 ]; then
        echo "      ✅ All databases exported ($(du -h "$BACKUP_DIR/postgresql/all_databases_${TIMESTAMP}.sql" | cut -f1))"
    else
        echo "      ❌ Failed to export all databases"
    fi
    
else
    echo "   ⚠️  PostgreSQL container 'ml-postgres' is not running"
fi

echo ""

# ============================================================
# 5. CREATE COMPRESSED ARCHIVE
# ============================================================
echo "📦 5. Creating compressed archive..."

cd "$BACKUP_DIR"
tar -czf "backup_all_databases_${TIMESTAMP}.tar.gz" \
    mysql/ neo4j/ mongodb/ postgresql/ 2>/dev/null

if [ $? -eq 0 ]; then
    ARCHIVE_SIZE=$(du -h "backup_all_databases_${TIMESTAMP}.tar.gz" | cut -f1)
    echo "   ✅ Archive created: backup_all_databases_${TIMESTAMP}.tar.gz ($ARCHIVE_SIZE)"
else
    echo "   ⚠️  Failed to create archive"
fi

echo ""

# ============================================================
# SUMMARY
# ============================================================
echo "═══════════════════════════════════════════════════════"
echo "✅ Export completed!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "📁 Backup location:"
echo "   $BACKUP_DIR"
echo ""
echo "📊 Backup summary:"
echo "   MySQL:      $(ls -1 $BACKUP_DIR/mysql/*.sql 2>/dev/null | wc -l) files"
echo "   Neo4j:      $(ls -1d $BACKUP_DIR/neo4j/* 2>/dev/null | wc -l) items"
echo "   MongoDB:    $(ls -1d $BACKUP_DIR/mongodb/* 2>/dev/null | wc -l) items"
echo "   PostgreSQL: $(ls -1 $BACKUP_DIR/postgresql/*.sql 2>/dev/null | wc -l) files"
echo ""
echo "📦 Total backup size:"
du -sh "$BACKUP_DIR" 2>/dev/null || echo "   N/A"
echo ""
echo "💡 To import these backups, use: ./import-all-databases.sh"
echo ""
