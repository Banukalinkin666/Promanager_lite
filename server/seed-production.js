import './src/config/db.js';
import User from './src/models/User.js';
import Property from './src/models/Property.js';
import Payment from './src/models/Payment.js';

async function seedProduction() {
  try {
    console.log('🌱 Starting production database seeding...');
    
    // Clear existing data
    await User.deleteMany({});
    await Property.deleteMany({});
    await Payment.deleteMany({});
    console.log('✅ Cleared existing data');
    
    // Create admin user
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@spm.test',
      passwordHash: await User.hashPassword('password123'),
      role: 'ADMIN',
      firstName: 'System',
      lastName: 'Administrator',
      nic: 'ADMIN001',
      primaryEmail: 'admin@spm.test',
      phone: '+1234567890',
      nationality: 'System',
      status: 'ACTIVE'
    });
    console.log('✅ Created admin user');
    
    // Create owner user
    const owner = await User.create({
      name: 'Property Owner',
      email: 'owner@spm.test',
      passwordHash: await User.hashPassword('password123'),
      role: 'OWNER',
      firstName: 'Property',
      lastName: 'Owner',
      nic: 'OWNER001',
      primaryEmail: 'owner@spm.test',
      phone: '+1234567891',
      nationality: 'System',
      status: 'ACTIVE'
    });
    console.log('✅ Created owner user');
    
    // Create sample properties
    const properties = [
      {
        owner: owner._id,
        title: 'Sunset Apartments',
        address: '123 Main St, Springfield, IL 62701',
        type: 'RESIDENTIAL',
        description: 'Modern apartment complex with excellent amenities',
        country: 'United States',
        city: 'Springfield',
        state: 'Illinois',
        zipCode: '62701',
        propertyStructure: 'MULTI_UNIT',
        baseRent: 1200,
        electricityMeterNo: 'ELEC-SA-001',
        waterMeterNo: 'WATER-SA-001',
        features: ['Air conditioning', 'Balcony', 'Parking', 'Security', 'Gym'],
        units: [
          {
            name: '1A',
            type: 'APARTMENT',
            size: 850,
            floor: 1,
            bedrooms: 2,
            bathrooms: 1,
            parking: 1,
            rentAmount: 1200,
            electricityMeterNo: 'ELEC-1A',
            waterMeterNo: 'WATER-1A',
            status: 'AVAILABLE'
          },
          {
            name: '2B',
            type: 'APARTMENT',
            size: 950,
            floor: 2,
            bedrooms: 2,
            bathrooms: 1,
            parking: 1,
            rentAmount: 1300,
            electricityMeterNo: 'ELEC-2B',
            waterMeterNo: 'WATER-2B',
            status: 'AVAILABLE'
          },
          {
            name: '3C',
            type: 'APARTMENT',
            size: 1100,
            floor: 3,
            bedrooms: 3,
            bathrooms: 2,
            parking: 2,
            rentAmount: 1500,
            electricityMeterNo: 'ELEC-3C',
            waterMeterNo: 'WATER-3C',
            status: 'AVAILABLE'
          }
        ]
      },
      {
        owner: owner._id,
        title: 'Downtown Plaza',
        address: '456 Business Ave, Downtown, NY 10001',
        type: 'COMMERCIAL',
        description: 'Premium commercial building in downtown area',
        country: 'United States',
        city: 'New York',
        state: 'New York',
        zipCode: '10001',
        propertyStructure: 'MULTI_UNIT',
        baseRent: 2500,
        electricityMeterNo: 'ELEC-DT-001',
        waterMeterNo: 'WATER-DT-001',
        features: ['Air conditioning', 'Elevator', 'Parking', 'Security', 'Reception'],
        units: [
          {
            name: '101',
            type: 'OFFICE',
            size: 1200,
            floor: 1,
            bedrooms: 0,
            bathrooms: 1,
            parking: 2,
            rentAmount: 2500,
            electricityMeterNo: 'ELEC-101',
            waterMeterNo: 'WATER-101',
            status: 'AVAILABLE'
          },
          {
            name: '201',
            type: 'OFFICE',
            size: 1500,
            floor: 2,
            bedrooms: 0,
            bathrooms: 2,
            parking: 3,
            rentAmount: 3000,
            electricityMeterNo: 'ELEC-201',
            waterMeterNo: 'WATER-201',
            status: 'AVAILABLE'
          }
        ]
      }
    ];
    
    for (const propertyData of properties) {
      await Property.create(propertyData);
    }
    console.log('✅ Created sample properties');
    
    // Create sample tenants
    const tenants = [
      {
        name: 'John Smith',
        email: 'john.smith@email.com',
        passwordHash: await User.hashPassword('password123'),
        role: 'TENANT',
        firstName: 'John',
        lastName: 'Smith',
        nic: 'JS123456789',
        primaryEmail: 'john.smith@email.com',
        phone: '+1234567890',
        nationality: 'American',
        status: 'ACTIVE'
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        passwordHash: await User.hashPassword('password123'),
        role: 'TENANT',
        firstName: 'Sarah',
        lastName: 'Johnson',
        nic: 'SJ987654321',
        primaryEmail: 'sarah.johnson@email.com',
        phone: '+1234567891',
        nationality: 'Canadian',
        status: 'ACTIVE'
      }
    ];
    
    for (const tenantData of tenants) {
      await User.create(tenantData);
    }
    console.log('✅ Created sample tenants');
    
    // Final counts
    const userCount = await User.countDocuments({});
    const propertyCount = await Property.countDocuments({});
    const paymentCount = await Payment.countDocuments({});
    
    console.log('🎉 Production database seeded successfully!');
    console.log(`📊 Final counts:`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Properties: ${propertyCount}`);
    console.log(`   - Payments: ${paymentCount}`);
    
    console.log('\n🔑 Default Login Credentials:');
    console.log('   Admin: admin@spm.test / password123');
    console.log('   Owner: owner@spm.test / password123');
    console.log('   Tenant: john.smith@email.com / password123');
    
  } catch (error) {
    console.error('❌ Error seeding production database:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seedProduction();
