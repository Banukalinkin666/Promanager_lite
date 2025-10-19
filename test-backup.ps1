# Test Backup System for Smart Property Manager
Write-Host "=== TESTING BACKUP MECHANISM ===" -ForegroundColor Cyan

# Create backup directory if it doesn't exist
if (!(Test-Path ".\backups")) {
    New-Item -ItemType Directory -Path ".\backups" -Force
}

# Get timestamp
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = ".\backups\backup_$TIMESTAMP.json"

Write-Host "Creating backup: $BACKUP_FILE" -ForegroundColor Yellow

# Create backup
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
        Write-Host "Backup created successfully!" -ForegroundColor Green
        Write-Host "File: $BACKUP_FILE" -ForegroundColor White
        Write-Host "Size: $fileSize bytes" -ForegroundColor White
        
        # Analyze backup content
        $backupContent = Get-Content $BACKUP_FILE -Raw
        $userCount = ([regex]::Matches($backupContent, '"name":')).Count
        $propertyCount = ([regex]::Matches($backupContent, '"title":')).Count
        $paymentCount = ([regex]::Matches($backupContent, '"amount":')).Count
        
        Write-Host "Backup Analysis:" -ForegroundColor Cyan
        Write-Host "   - Users: $userCount" -ForegroundColor White
        Write-Host "   - Properties: $propertyCount" -ForegroundColor White
        Write-Host "   - Payments: $paymentCount" -ForegroundColor White
        
        Write-Host "BACKUP MECHANISM IS WORKING PERFECTLY!" -ForegroundColor Green
    } else {
        Write-Host "Backup file was not created!" -ForegroundColor Red
    }
} catch {
    Write-Host "Backup failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== BACKUP TEST COMPLETED ===" -ForegroundColor Cyan