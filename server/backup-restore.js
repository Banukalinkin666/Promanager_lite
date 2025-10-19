import './src/config/db.js';
import User from './src/models/User.js';
import Property from './src/models/Property.js';
import Payment from './src/models/Payment.js';
import fs from 'fs';
import path from 'path';

class DatabaseManager {
  constructor() {
    this.backupDir = '/app/backups';
    this.ensureBackupDir();
  }

  ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(this.backupDir, `backup-${timestamp}.json`);
      
      console.log('🔄 Creating database backup...');
      
      const backup = {
        timestamp: new Date().toISOString(),
        users: await User.find({}),
        properties: await Property.find({}),
        payments: await Payment.find({})
      };
      
      fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
      console.log(`✅ Backup created: ${backupFile}`);
      console.log(`📊 Backup contains:`);
      console.log(`   - Users: ${backup.users.length}`);
      console.log(`   - Properties: ${backup.properties.length}`);
      console.log(`   - Payments: ${backup.payments.length}`);
      
      return backupFile;
    } catch (error) {
      console.error('❌ Error creating backup:', error);
      throw error;
    }
  }

  async restoreFromBackup(backupFile) {
    try {
      console.log(`🔄 Restoring from backup: ${backupFile}`);
      
      const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
      
      // Clear existing data
      await User.deleteMany({});
      await Property.deleteMany({});
      await Payment.deleteMany({});
      
      // Restore data
      if (backupData.users && backupData.users.length > 0) {
        await User.insertMany(backupData.users);
        console.log(`✅ Restored ${backupData.users.length} users`);
      }
      
      if (backupData.properties && backupData.properties.length > 0) {
        await Property.insertMany(backupData.properties);
        console.log(`✅ Restored ${backupData.properties.length} properties`);
      }
      
      if (backupData.payments && backupData.payments.length > 0) {
        await Payment.insertMany(backupData.payments);
        console.log(`✅ Restored ${backupData.payments.length} payments`);
      }
      
      console.log('✅ Database restore completed!');
    } catch (error) {
      console.error('❌ Error restoring from backup:', error);
      throw error;
    }
  }

  async listBackups() {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
        .sort()
        .reverse();
      
      console.log('📁 Available backups:');
      files.forEach((file, index) => {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        console.log(`   ${index + 1}. ${file} (${stats.size} bytes, ${stats.mtime.toISOString()})`);
      });
      
      return files;
    } catch (error) {
      console.error('❌ Error listing backups:', error);
      return [];
    }
  }

  async createSampleData() {
    try {
      console.log('🔄 Creating comprehensive sample data...');
      
      // Create additional tenants
      const tenants = [
        {
          name: 'Michael Brown',
          email: 'michael.brown@email.com',
          passwordHash: await User.hashPassword('password123'),
          role: 'TENANT',
          firstName: 'Michael',
          lastName: 'Brown',
          nic: '1112223334445',
          primaryEmail: 'michael.brown@email.com',
          phone: '+1234567894',
          nationality: 'Canadian',
          status: 'ACTIVE'
        },
        {
          name: 'Lisa Anderson',
          email: 'lisa.anderson@email.com',
          passwordHash: await User.hashPassword('password123'),
          role: 'TENANT',
          firstName: 'Lisa',
          lastName: 'Anderson',
          nic: '5556667778889',
          primaryEmail: 'lisa.anderson@email.com',
          phone: '+1234567895',
          nationality: 'Australian',
          status: 'ACTIVE'
        }
      ];

      for (const tenantData of tenants) {
        const existingTenant = await User.findOne({ email: tenantData.email });
        if (!existingTenant) {
          await User.create(tenantData);
          console.log(`✅ Created tenant: ${tenantData.name}`);
        }
      }

      // Create additional properties with units
      const properties = [
        {
          owner: (await User.findOne({ role: 'OWNER' }))._id,
          title: 'Downtown Plaza',
          address: '456 Business Ave, Downtown, NY 10001',
          type: 'COMMERCIAL',
          description: 'Modern commercial building in downtown area',
          country: 'United States',
          city: 'New York',
          state: 'New York',
          zipCode: '10001',
          propertyStructure: 'MULTI_UNIT',
          baseRent: 2500,
          electricityMeterNo: 'ELEC-DT-001',
          waterMeterNo: 'WATER-DT-001',
          features: ['Air conditioning', 'Elevator', 'Parking', 'Security'],
          units: [
            {
              name: '101',
              type: 'OFFICE',
              size: 1200,
              floor: 1,
              bedrooms: 0,
              bathrooms: 1,
              parking: 2,
              electricityMeterNo: 'ELEC-101',
              waterMeterNo: 'WATER-101',
              status: 'VACANT'
            },
            {
              name: '201',
              type: 'OFFICE',
              size: 1500,
              floor: 2,
              bedrooms: 0,
              bathrooms: 2,
              parking: 3,
              electricityMeterNo: 'ELEC-201',
              waterMeterNo: 'WATER-201',
              status: 'VACANT'
            }
          ]
        },
        {
          owner: (await User.findOne({ role: 'OWNER' }))._id,
          title: 'Garden Apartments',
          address: '789 Residential St, Suburb, CA 90210',
          type: 'RESIDENTIAL',
          description: 'Family-friendly apartment complex',
          country: 'United States',
          city: 'Los Angeles',
          state: 'California',
          zipCode: '90210',
          propertyStructure: 'MULTI_UNIT',
          baseRent: 1800,
          electricityMeterNo: 'ELEC-GA-001',
          waterMeterNo: 'WATER-GA-001',
          features: ['Garden', 'Playground', 'Swimming Pool', 'Gym'],
          units: [
            {
              name: 'A1',
              type: 'APARTMENT',
              size: 900,
              floor: 1,
              bedrooms: 2,
              bathrooms: 1,
              parking: 1,
              electricityMeterNo: 'ELEC-A1',
              waterMeterNo: 'WATER-A1',
              status: 'VACANT'
            },
            {
              name: 'A2',
              type: 'APARTMENT',
              size: 1100,
              floor: 1,
              bedrooms: 3,
              bathrooms: 2,
              parking: 2,
              electricityMeterNo: 'ELEC-A2',
              waterMeterNo: 'WATER-A2',
              status: 'VACANT'
            },
            {
              name: 'B1',
              type: 'APARTMENT',
              size: 950,
              floor: 2,
              bedrooms: 2,
              bathrooms: 1,
              parking: 1,
              electricityMeterNo: 'ELEC-B1',
              waterMeterNo: 'WATER-B1',
              status: 'VACANT'
            }
          ]
        }
      ];

      for (const propertyData of properties) {
        const existingProperty = await Property.findOne({ title: propertyData.title });
        if (!existingProperty) {
          await Property.create(propertyData);
          console.log(`✅ Created property: ${propertyData.title}`);
        }
      }

      console.log('✅ Sample data creation completed!');
    } catch (error) {
      console.error('❌ Error creating sample data:', error);
      throw error;
    }
  }
}

// CLI interface
const command = process.argv[2];
const dbManager = new DatabaseManager();

async function main() {
  try {
    switch (command) {
      case 'backup':
        await dbManager.createBackup();
        break;
      case 'list':
        await dbManager.listBackups();
        break;
      case 'restore':
        const backupFile = process.argv[3];
        if (!backupFile) {
          console.error('❌ Please specify backup file to restore from');
          process.exit(1);
        }
        await dbManager.restoreFromBackup(backupFile);
        break;
      case 'sample':
        await dbManager.createSampleData();
        break;
      default:
        console.log('Usage: node backup-restore.js [backup|list|restore|sample]');
        console.log('  backup  - Create a new backup');
        console.log('  list    - List available backups');
        console.log('  restore <file> - Restore from backup file');
        console.log('  sample  - Create sample data');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
