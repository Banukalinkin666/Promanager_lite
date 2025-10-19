#!/bin/bash

# Safe Rebuild Script for Smart Property Manager
# This script creates a backup before rebuilding containers

echo "🛡️  Starting safe rebuild process..."

# Step 1: Create backup
echo "📊 Creating backup before rebuild..."
./backup-database.sh

if [ $? -ne 0 ]; then
    echo "❌ Backup failed! Aborting rebuild to prevent data loss."
    exit 1
fi

# Step 2: Rebuild containers
echo "🔨 Rebuilding containers..."
docker compose up -d --build

if [ $? -eq 0 ]; then
    echo "✅ Rebuild completed successfully!"
    echo "📊 Current database state:"
    docker exec promanager_lite-server-1 node -e "
    import('./src/config/db.js').then(async () => {
      const User = (await import('./src/models/User.js')).default;
      const Property = (await import('./src/models/Property.js')).default;
      const Payment = (await import('./src/models/Payment.js')).default;
      
      console.log('Users:', await User.countDocuments({}));
      console.log('Properties:', await Property.countDocuments({}));
      console.log('Payments:', await Payment.countDocuments({}));
      process.exit(0);
    }).catch(console.error)"
else
    echo "❌ Rebuild failed!"
    exit 1
fi

echo "🎉 Safe rebuild completed!"
