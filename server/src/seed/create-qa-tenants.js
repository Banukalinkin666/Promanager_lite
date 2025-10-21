import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import '../config/db.js';

dotenv.config();

const tenants = [
  {
    firstName: 'Emma',
    lastName: 'Martinez',
    middleName: 'Marie',
    passportNo: 'AB234567',
    nic: '891234567V',
    nicExpirationDate: new Date('2030-12-31'),
    primaryEmail: 'emma.martinez342@gmail.com',
    phone: '0771234567',
    nationality: 'American',
    secondaryEmail: 'emma.m.backup@gmail.com',
    secondaryPhone: '0762345678',
    emergencyContact: {
      name: 'Robert Martinez',
      relationship: 'Parent',
      phone: '0773456789',
      email: 'robert.martinez@gmail.com'
    },
    address: {
      street: '523 Oak Avenue',
      city: 'Los Angeles',
      state: 'California',
      zipCode: '90001',
      country: 'United States'
    },
    employment: {
      company: 'Google',
      position: 'Software Engineer',
      monthlyIncome: 8500,
      employmentType: 'FULL_TIME'
    },
    notes: 'QA Test Tenant 2'
  },
  {
    firstName: 'James',
    lastName: 'Wilson',
    middleName: 'Lee',
    passportNo: 'CD456789',
    nic: '851234321V',
    nicExpirationDate: new Date('2029-06-15'),
    primaryEmail: 'james.wilson891@gmail.com',
    phone: '0764567890',
    nationality: 'British',
    emergencyContact: {
      name: 'Sarah Wilson',
      relationship: 'Spouse',
      phone: '0775678901',
      email: 'sarah.wilson@gmail.com'
    },
    address: {
      street: '782 Maple Street',
      city: 'Chicago',
      state: 'Illinois',
      zipCode: '60007',
      country: 'United States'
    },
    employment: {
      company: 'Microsoft',
      position: 'Project Manager',
      monthlyIncome: 9200,
      employmentType: 'FULL_TIME'
    },
    notes: 'QA Test Tenant 3'
  },
  {
    firstName: 'Sophia',
    lastName: 'Garcia',
    middleName: 'Ann',
    passportNo: 'EF789012',
    nic: '921234567V',
    nicExpirationDate: new Date('2031-03-20'),
    primaryEmail: 'sophia.garcia456@gmail.com',
    phone: '0776789012',
    nationality: 'Spanish',
    emergencyContact: {
      name: 'Michael Garcia',
      relationship: 'Sibling',
      phone: '0767890123',
      email: 'michael.garcia@gmail.com'
    },
    address: {
      street: '156 Pine Road',
      city: 'Houston',
      state: 'Texas',
      zipCode: '77002',
      country: 'United States'
    },
    employment: {
      company: 'Amazon',
      position: 'Data Analyst',
      monthlyIncome: 7800,
      employmentType: 'FULL_TIME'
    },
    notes: 'QA Test Tenant 4'
  },
  {
    firstName: 'William',
    lastName: 'Brown',
    middleName: 'Joseph',
    passportNo: 'GH234567',
    nic: '871234567V',
    nicExpirationDate: new Date('2028-11-10'),
    primaryEmail: 'william.brown234@gmail.com',
    phone: '0778901234',
    nationality: 'Canadian',
    emergencyContact: {
      name: 'Emma Brown',
      relationship: 'Parent',
      phone: '0769012345',
      email: 'emma.brown@gmail.com'
    },
    address: {
      street: '943 Cedar Boulevard',
      city: 'Phoenix',
      state: 'Arizona',
      zipCode: '85001',
      country: 'United States'
    },
    employment: {
      company: 'Apple',
      position: 'Marketing Manager',
      monthlyIncome: 10500,
      employmentType: 'FULL_TIME'
    },
    notes: 'QA Test Tenant 5'
  },
  {
    firstName: 'Olivia',
    lastName: 'Rodriguez',
    middleName: 'Elizabeth',
    passportNo: 'IJ567890',
    nic: '941234567V',
    nicExpirationDate: new Date('2032-08-25'),
    primaryEmail: 'olivia.rodriguez678@gmail.com',
    phone: '0770123456',
    nationality: 'Australian',
    emergencyContact: {
      name: 'James Rodriguez',
      relationship: 'Spouse',
      phone: '0761234567',
      email: 'james.rodriguez@gmail.com'
    },
    address: {
      street: '321 Main Street',
      city: 'Philadelphia',
      state: 'Pennsylvania',
      zipCode: '19019',
      country: 'United States'
    },
    employment: {
      company: 'Meta',
      position: 'Sales Representative',
      monthlyIncome: 6500,
      employmentType: 'FULL_TIME'
    },
    notes: 'QA Test Tenant 6'
  },
  {
    firstName: 'Michael',
    lastName: 'Johnson',
    middleName: 'Thomas',
    passportNo: 'KL890123',
    nic: '831234567V',
    nicExpirationDate: new Date('2027-04-30'),
    primaryEmail: 'michael.johnson234@gmail.com',
    phone: '0772345678',
    nationality: 'German',
    emergencyContact: {
      name: 'Sophia Johnson',
      relationship: 'Sibling',
      phone: '0763456789',
      email: 'sophia.johnson@gmail.com'
    },
    address: {
      street: '654 Oak Avenue',
      city: 'San Antonio',
      state: 'Texas',
      zipCode: '78201',
      country: 'United States'
    },
    employment: {
      company: 'Tesla',
      position: 'HR Specialist',
      monthlyIncome: 5800,
      employmentType: 'FULL_TIME'
    },
    notes: 'QA Test Tenant 7'
  },
  {
    firstName: 'Ava',
    lastName: 'Davis',
    middleName: 'Grace',
    passportNo: 'MN345678',
    nic: '901234567V',
    nicExpirationDate: new Date('2030-09-15'),
    primaryEmail: 'ava.davis901@gmail.com',
    phone: '0774567890',
    nationality: 'French',
    emergencyContact: {
      name: 'William Davis',
      relationship: 'Parent',
      phone: '0765678901',
      email: 'william.davis@gmail.com'
    },
    address: {
      street: '888 Maple Road',
      city: 'San Diego',
      state: 'California',
      zipCode: '92101',
      country: 'United States'
    },
    employment: {
      company: 'Netflix',
      position: 'Accountant',
      monthlyIncome: 7200,
      employmentType: 'FULL_TIME'
    },
    notes: 'QA Test Tenant 8'
  },
  {
    firstName: 'Robert',
    lastName: 'Miller',
    middleName: 'Alex',
    passportNo: 'OP678901',
    nic: '861234567V',
    nicExpirationDate: new Date('2029-02-28'),
    primaryEmail: 'robert.miller543@gmail.com',
    phone: '0776789012',
    nationality: 'Italian',
    emergencyContact: {
      name: 'Olivia Miller',
      relationship: 'Spouse',
      phone: '0767890123',
      email: 'olivia.miller@gmail.com'
    },
    address: {
      street: '234 Pine Street',
      city: 'Dallas',
      state: 'Texas',
      zipCode: '75201',
      country: 'United States'
    },
    employment: {
      company: 'Adobe',
      position: 'Designer',
      monthlyIncome: 8900,
      employmentType: 'FULL_TIME'
    },
    notes: 'QA Test Tenant 9'
  },
  {
    firstName: 'Isabella',
    lastName: 'Hernandez',
    middleName: 'Marie',
    passportNo: 'QR012345',
    nic: '931234567V',
    nicExpirationDate: new Date('2033-07-20'),
    primaryEmail: 'isabella.hernandez789@gmail.com',
    phone: '0778901234',
    nationality: 'Japanese',
    emergencyContact: {
      name: 'David Hernandez',
      relationship: 'Sibling',
      phone: '0769012345',
      email: 'david.hernandez@gmail.com'
    },
    address: {
      street: '567 Cedar Avenue',
      city: 'San Jose',
      state: 'California',
      zipCode: '95101',
      country: 'United States'
    },
    employment: {
      company: 'Oracle',
      position: 'Consultant',
      monthlyIncome: 11200,
      employmentType: 'FULL_TIME'
    },
    notes: 'QA Test Tenant 10'
  },
  {
    firstName: 'David',
    lastName: 'Smith',
    middleName: 'James',
    passportNo: 'ST456789',
    nic: '881234567V',
    nicExpirationDate: new Date('2028-12-05'),
    primaryEmail: 'david.smith321@gmail.com',
    phone: '0770123456',
    nationality: 'Korean',
    secondaryEmail: 'd.smith.backup@gmail.com',
    secondaryPhone: '0761234567',
    emergencyContact: {
      name: 'Emma Smith',
      relationship: 'Spouse',
      phone: '0772345678',
      email: 'emma.smith@gmail.com'
    },
    address: {
      street: '789 Main Boulevard',
      city: 'New York',
      state: 'New York',
      zipCode: '10001',
      country: 'United States'
    },
    employment: {
      company: 'Salesforce',
      position: 'Developer',
      monthlyIncome: 12500,
      employmentType: 'FULL_TIME'
    },
    notes: 'QA Test Tenant 11'
  }
];

async function createQATenants() {
  try {
    console.log('🚀 Starting QA Tenant Creation...\n');
    console.log(`📋 Creating ${tenants.length} test tenants\n`);

    const createdTenants = [];

    for (let i = 0; i < tenants.length; i++) {
      const tenant = tenants[i];
      
      // Create tenant user object
      const tenantData = {
        name: `${tenant.firstName} ${tenant.lastName}`,
        email: tenant.primaryEmail,
        passwordHash: await User.hashPassword('Welcome@123'),
        role: 'TENANT',
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        middleName: tenant.middleName,
        passportNo: tenant.passportNo,
        nic: tenant.nic,
        nicExpirationDate: tenant.nicExpirationDate,
        primaryEmail: tenant.primaryEmail,
        phone: tenant.phone,
        nationality: tenant.nationality,
        secondaryEmail: tenant.secondaryEmail || '',
        secondaryPhone: tenant.secondaryPhone || '',
        emergencyContact: tenant.emergencyContact,
        address: tenant.address,
        employment: tenant.employment,
        notes: tenant.notes,
        status: 'ACTIVE',
        isActive: true
      };

      const createdTenant = await User.create(tenantData);
      createdTenants.push(createdTenant);

      console.log(`✅ Tenant ${i + 2} created: ${tenant.firstName} ${tenant.lastName}`);
      console.log(`   Email: ${tenant.primaryEmail}`);
      console.log(`   NIC: ${tenant.nic}`);
      console.log(`   Phone: ${tenant.phone}`);
      console.log(`   Company: ${tenant.employment.company} - ${tenant.employment.position}`);
      console.log(`   Income: $${tenant.employment.monthlyIncome}`);
      console.log('');
    }

    console.log('🎉 All 10 QA test tenants created successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Total Tenants Created: ${createdTenants.length}`);
    console.log(`   All passwords: Welcome@123`);
    console.log('\n✅ QA Testing Data Ready!');
    console.log('\n🧪 You can now test:');
    console.log('   - View all tenants in the list');
    console.log('   - Search and filter tenants');
    console.log('   - View tenant details');
    console.log('   - Edit tenant information');
    console.log('   - Delete tenants');
    console.log('   - Change tenant status');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating QA tenants:', error);
    process.exit(1);
  }
}

createQATenants();

