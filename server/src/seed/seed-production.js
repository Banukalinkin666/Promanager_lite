import User from '../models/User.js';
import Property from '../models/Property.js';
import Payment from '../models/Payment.js';

export async function seedProduction() {
  // Clear existing data
  await User.deleteMany({});
  await Property.deleteMany({});
  await Payment.deleteMany({});

  // Create admin user
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@spm.test',
    passwordHash: await User.hashPassword('password123'),
    role: 'ADMIN',
  });

  // Create owner user
  const owner = await User.create({
    name: 'Owner One',
    email: 'owner@spm.test',
    passwordHash: await User.hashPassword('password123'),
    role: 'OWNER',
  });

  // Create tenant user
  const tenant = await User.create({
    name: 'John Tenant',
    email: 'tenant@spm.test',
    passwordHash: await User.hashPassword('password123'),
    role: 'TENANT',
    firstName: 'John',
    lastName: 'Tenant',
    nic: '1234567890123',
    primaryEmail: 'tenant@spm.test',
    phone: '+1234567890',
    nationality: 'American',
    status: 'ACTIVE'
  });

  // Create sample property
  const prop = await Property.create({
    owner: owner._id,
    title: 'Sunset Apartments',
    address: '123 Main St, Springfield, IL 62701',
    type: 'RESIDENTIAL',
    description: 'Cozy building with great light',
    country: 'United States',
    city: 'Springfield',
    state: 'Illinois',
    zipCode: '62701',
    propertyStructure: 'MULTI_UNIT',
    baseRent: 1200,
    electricityMeterNo: 'EL123456',
    waterMeterNo: 'WT789012',
    features: ['Air conditioning', 'Cable Ready', 'Internet', 'Parking'],
    units: [
      { 
        name: 'Unit 1A', 
        type: 'APARTMENT', 
        sizeSqFt: 650, 
        floor: 1,
        bedrooms: 2,
        bathrooms: 1,
        parking: 1,
        rentAmount: 1200, 
        status: 'OCCUPIED', 
        tenant: tenant._id,
        electricityMeterNo: 'EL123456-1A',
        waterMeterNo: 'WT789012-1A'
      },
      { 
        name: 'Unit 2B', 
        type: 'APARTMENT', 
        sizeSqFt: 700, 
        floor: 2,
        bedrooms: 2,
        bathrooms: 2,
        parking: 1,
        rentAmount: 1300, 
        status: 'AVAILABLE',
        electricityMeterNo: 'EL123456-2B',
        waterMeterNo: 'WT789012-2B'
      },
      { 
        name: 'Unit 3C', 
        type: 'APARTMENT', 
        sizeSqFt: 720, 
        floor: 3,
        bedrooms: 3,
        bathrooms: 2,
        parking: 2,
        rentAmount: 1350, 
        status: 'MAINTENANCE',
        electricityMeterNo: 'EL123456-3C',
        waterMeterNo: 'WT789012-3C'
      },
    ],
  });

  // Create sample payments
  const samplePayments = [
    {
      tenant: tenant._id,
      amount: 1200,
      method: 'CARD',
      status: 'SUCCEEDED',
      description: 'Rent payment for January 2024',
      paidDate: new Date('2024-01-15'),
      metadata: {
        propertyId: prop._id,
        unitId: prop.units[0]._id,
        month: 'January 2024',
        dueDate: '2024-01-01',
        type: 'rent_payment'
      }
    },
    {
      tenant: tenant._id,
      amount: 1200,
      method: 'CASH',
      status: 'PENDING',
      description: 'Rent payment for February 2024',
      metadata: {
        propertyId: prop._id,
        unitId: prop.units[0]._id,
        month: 'February 2024',
        dueDate: '2024-02-01',
        type: 'rent_payment'
      }
    },
    {
      tenant: tenant._id,
      amount: 1200,
      method: 'BANK',
      status: 'SUCCEEDED',
      description: 'Rent payment for March 2024',
      paidDate: new Date('2024-03-10'),
      metadata: {
        propertyId: prop._id,
        unitId: prop.units[0]._id,
        month: 'March 2024',
        dueDate: '2024-03-01',
        type: 'rent_payment'
      }
    },
    {
      tenant: tenant._id,
      amount: 1200,
      method: 'CARD',
      status: 'FAILED',
      description: 'Rent payment for April 2024',
      metadata: {
        propertyId: prop._id,
        unitId: prop.units[0]._id,
        month: 'April 2024',
        dueDate: '2024-04-01',
        type: 'rent_payment'
      }
    }
  ];

  await Payment.insertMany(samplePayments);

  console.log('Database seeded successfully:', { 
    admin: admin.email, 
    owner: owner.email, 
    tenant: tenant.email, 
    property: prop.title, 
    payments: samplePayments.length 
  });

  return {
    admin,
    owner,
    tenant,
    property: prop,
    payments: samplePayments.length
  };
}
