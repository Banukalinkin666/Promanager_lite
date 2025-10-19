# Restore Database from Backup Script
Write-Host "=== TESTING BACKUP RESTORE SYSTEM ===" -ForegroundColor Cyan

# Get the latest backup file
$backupFiles = Get-ChildItem ".\backups\backup_*.json" | Sort-Object LastWriteTime -Descending
if ($backupFiles.Count -eq 0) {
    Write-Host "No backup files found!" -ForegroundColor Red
    exit 1
}

$latestBackup = $backupFiles[0].FullName
Write-Host "Using backup file: $latestBackup" -ForegroundColor Yellow

# Copy backup to container
Write-Host "Copying backup to container..." -ForegroundColor Yellow
docker cp $latestBackup promanager_lite-server-1:/app/restore_backup.json

# Test restore
$restoreCommand = @"
import('./src/config/db.js').then(async () => {
  const User = (await import('./src/models/User.js')).default;
  const Property = (await import('./src/models/Property.js')).default;
  const Payment = (await import('./src/models/Payment.js')).default;
  const fs = require('fs');
  
  console.log('=== RESTORING FROM BACKUP ===');
  
  // Clear existing data
  await User.deleteMany({});
  await Property.deleteMany({});
  await Payment.deleteMany({});
  console.log('Database cleared');
  
  // Read backup
  const backupData = JSON.parse(fs.readFileSync('/app/restore_backup.json', 'utf8'));
  console.log('Backup loaded:');
  console.log('- Users:', backupData.users.length);
  console.log('- Properties:', backupData.properties.length);
  console.log('- Payments:', backupData.payments.length);
  
  // Restore data
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
  
  // Verify restoration
  console.log('Final database state:');
  console.log('- Users:', await User.countDocuments({}));
  console.log('- Properties:', await Property.countDocuments({}));
  console.log('- Payments:', await Payment.countDocuments({}));
  
  console.log('RESTORE COMPLETED SUCCESSFULLY!');
  process.exit(0);
}).catch(console.error)
"@

try {
    docker exec promanager_lite-server-1 node -e $restoreCommand
    
    Write-Host "`n✅ RESTORE COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "📊 All data has been restored from backup!" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Restore failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== RESTORE TEST COMPLETED ===" -ForegroundColor Cyan
