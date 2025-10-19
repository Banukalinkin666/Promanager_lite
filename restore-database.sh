#!/bin/bash

# Database Restore Script for Smart Property Manager
# This script restores data from a backup file

if [ -z "$1" ]; then
    echo "❌ Please specify backup file to restore from"
    echo "Usage: ./restore-database.sh <backup_file>"
    echo "Available backups:"
    ls -la ./backups/backup_*.json 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "🔄 Restoring database from: $BACKUP_FILE"

# Restore using Docker
docker exec promanager_lite-server-1 node -e "
import('./src/config/db.js').then(async () => {
  const User = (await import('./src/models/User.js')).default;
  const Property = (await import('./src/models/Property.js')).default;
  const Payment = (await import('./src/models/Payment.js')).default;
  
  const backupData = JSON.parse(require('fs').readFileSync('$BACKUP_FILE', 'utf8'));
  
  console.log('Clearing existing data...');
  await User.deleteMany({});
  await Property.deleteMany({});
  await Payment.deleteMany({});
  
  console.log('Restoring data...');
  if (backupData.users && backupData.users.length > 0) {
    await User.insertMany(backupData.users);
    console.log('Restored', backupData.users.length, 'users');
  }
  
  if (backupData.properties && backupData.properties.length > 0) {
    await Property.insertMany(backupData.properties);
    console.log('Restored', backupData.properties.length, 'properties');
  }
  
  if (backupData.payments && backupData.payments.length > 0) {
    await Payment.insertMany(backupData.payments);
    console.log('Restored', backupData.payments.length, 'payments');
  }
  
  console.log('✅ Database restore completed!');
  process.exit(0);
}).catch(console.error)"

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully!"
else
    echo "❌ Restore failed!"
    exit 1
fi
