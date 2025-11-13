#!/bin/bash
# NaviDocs Database Backup Script

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DB_FILE="./navidocs.db"
UPLOAD_DIR="./uploads"

mkdir -p $BACKUP_DIR

echo "🔐 Starting backup..."

# Backup database
sqlite3 $DB_FILE ".backup '$BACKUP_DIR/navidocs-db-$TIMESTAMP.db'"

# Backup uploads folder
tar -czf "$BACKUP_DIR/navidocs-uploads-$TIMESTAMP.tar.gz" $UPLOAD_DIR

echo "✅ Backup complete:"
echo "  - Database: $BACKUP_DIR/navidocs-db-$TIMESTAMP.db"
echo "  - Uploads: $BACKUP_DIR/navidocs-uploads-$TIMESTAMP.tar.gz"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "navidocs-db-*.db" -mtime +7 -delete
find $BACKUP_DIR -name "navidocs-uploads-*.tar.gz" -mtime +7 -delete

echo "🗑️  Old backups cleaned up (kept last 7 days)"
