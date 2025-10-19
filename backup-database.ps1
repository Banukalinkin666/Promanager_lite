# Database Backup Script for Smart Property Manager (PowerShell)
# This script creates backups before any major changes

Write-Host "🔄 Creating database backup..." -ForegroundColor Cyan

# Get current timestamp
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_DIR = ".\backups"
$BACKUP_FILE = "$BACKUP_DIR\backup_$TIMESTAMP.json"

# Create backup directory if it doesn't exist
if (!(Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR -Force
}

# Create backup using Docker
Write-Host "📊 Exporting database data..." -ForegroundColor Yellow

$backupCommand = @"
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
}).catch(console.error)
"@

try {
    docker exec promanager_lite-server-1 node -e $backupCommand | Out-File -FilePath $BACKUP_FILE -Encoding UTF8
    
    if (Test-Path $BACKUP_FILE) {
        $fileSize = (Get-Item $BACKUP_FILE).Length
        Write-Host "✅ Backup created successfully: $BACKUP_FILE" -ForegroundColor Green
        Write-Host "📊 Backup contains:" -ForegroundColor Cyan
        
        # Count records in backup
        $backupContent = Get-Content $BACKUP_FILE -Raw
        $userCount = ([regex]::Matches($backupContent, '"name":')).Count
        $propertyCount = ([regex]::Matches($backupContent, '"title":')).Count
        $paymentCount = ([regex]::Matches($backupContent, '"amount":')).Count
        
        Write-Host "   - Users: $userCount" -ForegroundColor White
        Write-Host "   - Properties: $propertyCount" -ForegroundColor White
        Write-Host "   - Payments: $paymentCount" -ForegroundColor White
        Write-Host "   - File Size: $fileSize bytes" -ForegroundColor White
    } else {
        Write-Host "❌ Backup file was not created!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Backup failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "🛡️  Database backup completed!" -ForegroundColor Green
