#!/bin/bash

# Database Backup Script for Smart Property Manager
# This script creates backups before any major changes

echo "🔄 Creating database backup..."

# Get current timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.json"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create backup using Docker
echo "📊 Exporting database data..."
docker exec promanager_lite-server-1 node -e "
import('./src/config/db.js').then(async () => {
  const User = (await import('./src/models/User.js')).default;
  const Property = (await import('./src/models/Property.js')).default;
  const Payment = (await import('./src/models/Payment.js')).default;
  
  const backup = {
    timestamp: new Date().toISOString(),
    users: await User.find({}),
    properties: await Property.find({}),
    payments: await Payment.find({})
  };
  
  console.log(JSON.stringify(backup, null, 2));
  process.exit(0);
}).catch(console.error)" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully: $BACKUP_FILE"
    echo "📊 Backup contains:"
    echo "   - Users: $(grep -o '"name":' "$BACKUP_FILE" | wc -l)"
    echo "   - Properties: $(grep -o '"title":' "$BACKUP_FILE" | wc -l)"
    echo "   - Payments: $(grep -o '"amount":' "$BACKUP_FILE" | wc -l)"
else
    echo "❌ Backup failed!"
    exit 1
fi

echo "🛡️  Database backup completed!"
