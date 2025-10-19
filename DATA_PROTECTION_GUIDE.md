# 🛡️ Data Protection Guide for Smart Property Manager

## ⚠️ IMPORTANT: Data Loss Prevention

This guide explains how to prevent data loss and safely manage your Smart Property Manager database.

## 📊 Current Database State

- **Users**: 10 (1 Admin, 1 Owner, 8 Tenants)
- **Properties**: 3 (Sunset Apartments, Downtown Plaza, Garden Apartments)
- **Total Units**: 8 units across all properties
- **Payments**: 4 existing payment records

## 🔄 Backup & Restore System

### Automatic Backup Scripts

#### 1. `backup-database.sh` - Create Database Backup
```bash
./backup-database.sh
```
- Creates timestamped backup in `./backups/` directory
- Exports all users, properties, and payments
- Shows backup statistics

#### 2. `restore-database.sh` - Restore from Backup
```bash
./restore-database.sh <backup_file>
```
- Restores database from specified backup file
- Clears existing data before restore
- Lists available backups if no file specified

#### 3. `safe-rebuild.sh` - Safe Container Rebuild
```bash
./safe-rebuild.sh
```
- Creates automatic backup before rebuild
- Rebuilds containers safely
- Shows final database state

## 🚨 Data Loss Prevention Rules

### ❌ NEVER DO THESE WITHOUT BACKUP:
1. **`docker compose down`** - Stops containers but preserves data
2. **`docker compose up -d --build`** - Rebuilds containers (use `safe-rebuild.sh` instead)
3. **`docker system prune`** - Can delete volumes
4. **Manual database operations** without backup

### ✅ SAFE OPERATIONS:
1. **`./safe-rebuild.sh`** - Safe rebuild with automatic backup
2. **`./backup-database.sh`** - Create manual backup before any changes
3. **`docker compose up -d`** - Start containers (no rebuild)
4. **`docker compose restart`** - Restart services

## 📁 Backup Management

### Backup Location
- **Directory**: `./backups/`
- **Format**: `backup_YYYYMMDD_HHMMSS.json`
- **Content**: Complete database export (users, properties, payments)

### Backup Schedule
- **Before any rebuild**: Automatic via `safe-rebuild.sh`
- **Before major changes**: Manual via `backup-database.sh`
- **Weekly**: Recommended for production systems

## 🔧 Database Volume Protection

### Docker Volume Configuration
```yaml
volumes:
  mongo_data:  # This ensures data persistence
```

### Volume Backup (Advanced)
```bash
# Backup MongoDB volume
docker run --rm -v promanager_lite_mongo_data:/data -v $(pwd):/backup alpine tar czf /backup/mongo_backup.tar.gz /data

# Restore MongoDB volume
docker run --rm -v promanager_lite_mongo_data:/data -v $(pwd):/backup alpine tar xzf /backup/mongo_backup.tar.gz -C /
```

## 🚀 Quick Commands

### Safe Operations
```bash
# Safe rebuild (with backup)
./safe-rebuild.sh

# Create backup
./backup-database.sh

# Restore from backup
./restore-database.sh ./backups/backup_20241019_143000.json

# List available backups
ls -la ./backups/
```

### Emergency Recovery
```bash
# If data is lost, restore from latest backup
./restore-database.sh ./backups/backup_$(ls -t ./backups/ | head -1)
```

## 📋 Current System Data

### Properties & Units:
1. **Sunset Apartments** (Springfield, IL)
   - Unit 1A: APARTMENT - OCCUPIED - $1200
   - Unit 2B: APARTMENT - AVAILABLE - $1300
   - Unit 3C: APARTMENT - MAINTENANCE - $1350

2. **Downtown Plaza** (New York, NY)
   - Unit 101: OFFICE - AVAILABLE - $2500
   - Unit 201: OFFICE - AVAILABLE - $3000

3. **Garden Apartments** (Los Angeles, CA)
   - Unit A1: APARTMENT - AVAILABLE - $1800
   - Unit A2: APARTMENT - AVAILABLE - $2200
   - Unit B1: APARTMENT - AVAILABLE - $1900

### Users:
- **Admin**: admin@spm.test
- **Owner**: owner@spm.test
- **Tenants**: 8 tenants with full details

## ⚡ Best Practices

1. **Always backup before rebuilds**
2. **Use `safe-rebuild.sh` for container updates**
3. **Keep multiple backup versions**
4. **Test restore process regularly**
5. **Monitor disk space for backups**

## 🆘 Emergency Contacts

If you experience data loss:
1. Check `./backups/` directory for available backups
2. Use `./restore-database.sh` with latest backup
3. Contact system administrator if backups are unavailable

---

**Remember**: Data loss is preventable with proper backup procedures! 🛡️
