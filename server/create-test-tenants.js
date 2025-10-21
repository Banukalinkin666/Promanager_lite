import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, 'server', '.env') });

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/property_manager';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// User Schema (same as your model)
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'OWNER', 'TENANT'], required: true },
    firstName: { type: String, required: function() { return this.role === 'TENANT'; } },
    lastName: { type: String, required: function() { return this.role === 'TENANT'; } },
    middleName: { type: String },
    passportNo: { type: String },
    nic: { type: String, required: function() { return this.role === 'TENANT'; } },
    nicExpirationDate: { type: Date },
    primaryEmail: { type: String, required: function() { return this.role === 'TENANT'; } },
    phone: { type: String, required: function() { return this.role === 'TENANT'; } },
    nationality: { type: String },
    secondaryEmail: { type: String },
    secondaryPhone: { type: String },
    emergencyContact: {
      name: { type: String },
      relationship: { type: String },
      phone: { type: String },
      email: { type: String }
    },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String }
    },
    employment: {
      company: { type: String },
      position: { type: String },
      monthlyIncome: { type: Number },
      employmentType: { type: String, enum: ['FULL_TIME', 'PART_TIME', 'SELF_EMPLOYED', 'STUDENT', 'UNEMPLOYED'] }
    },
    notes: { type: String },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'BLACKLISTED'], default: 'ACTIVE' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

UserSchema.statics.hashPassword = async function (password) {
  const bcrypt = await import('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const User = mongoose.model('User', UserSchema);

// Random data generators
const firstNames = ['John', 'Emma', 'Michael', 'Sophia', 'William', 'Olivia', 'James', 'Ava', 'Robert', 'Isabella', 'David'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez'];
const middleNames = ['Alex', 'Marie', 'Lee', 'James', 'Ann', 'Joseph', 'Elizabeth', 'Michael', 'Grace', 'Thomas'];
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
const states = ['California', 'Texas', 'Florida', 'New York', 'Pennsylvania', 'Illinois', 'Ohio', 'Georgia', 'North Carolina', 'Michigan'];
const countries = ['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Spain', 'Italy', 'Japan', 'South Korea'];
const nationalities = ['American', 'Canadian', 'British', 'Australian', 'German', 'French', 'Spanish', 'Italian', 'Japanese', 'Korean'];
const companies = ['Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'Tesla', 'Netflix', 'Adobe', 'Oracle', 'Salesforce'];
const positions = ['Software Engineer', 'Project Manager', 'Data Analyst', 'Marketing Manager', 'Sales Representative', 'HR Specialist', 'Accountant', 'Designer', 'Consultant', 'Developer'];
const employmentTypes = ['FULL_TIME', 'PART_TIME', 'SELF_EMPLOYED', 'FULL_TIME', 'FULL_TIME'];
const relationships = ['Spouse', 'Parent', 'Sibling', 'Friend', 'Colleague'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateNIC() {
  const year = randomInt(70, 99);
  const days = randomInt(1, 365).toString().padStart(3, '0');
  const serial = randomInt(1000, 9999);
  return `${year}${days}${serial}V`;
}

function generatePassport() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const prefix = letters[randomInt(0, 25)] + letters[randomInt(0, 25)];
  const number = randomInt(100000, 999999);
  return `${prefix}${number}`;
}

function generatePhone() {
  return `0${randomInt(70, 77)}${randomInt(1000000, 9999999)}`;
}

function generateEmail(firstName, lastName) {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 999)}@gmail.com`;
}

function generateZip() {
  return randomInt(10000, 99999).toString();
}

async function createTestTenants() {
  try {
    console.log('🔄 Creating 11 test tenants...\n');

    const tenants = [];

    for (let i = 1; i <= 11; i++) {
      const firstName = randomItem(firstNames);
      const lastName = randomItem(lastNames);
      const middleName = Math.random() > 0.3 ? randomItem(middleNames) : '';
      const email = generateEmail(firstName, lastName);
      const phone = generatePhone();
      const nic = generateNIC();
      const passport = Math.random() > 0.5 ? generatePassport() : '';
      const nationality = randomItem(nationalities);
      
      const street = `${randomInt(1, 999)} ${randomItem(['Main', 'Oak', 'Maple', 'Cedar', 'Pine'])} ${randomItem(['Street', 'Avenue', 'Road', 'Boulevard'])}`;
      const city = randomItem(cities);
      const state = randomItem(states);
      const zipCode = generateZip();
      const country = randomItem(countries);

      const company = randomItem(companies);
      const position = randomItem(positions);
      const monthlyIncome = randomInt(3000, 15000);
      const employmentType = randomItem(employmentTypes);

      const emergencyName = `${randomItem(firstNames)} ${randomItem(lastNames)}`;
      const emergencyRelationship = randomItem(relationships);
      const emergencyPhone = generatePhone();
      const emergencyEmail = generateEmail(emergencyName.split(' ')[0], emergencyName.split(' ')[1]);

      const nicExpDate = new Date();
      nicExpDate.setFullYear(nicExpDate.getFullYear() + randomInt(1, 10));

      const tenant = {
        name: `${firstName} ${lastName}`,
        email: email,
        passwordHash: await User.hashPassword('password123'),
        role: 'TENANT',
        firstName: firstName,
        lastName: lastName,
        middleName: middleName,
        passportNo: passport,
        nic: nic,
        nicExpirationDate: nicExpDate,
        primaryEmail: email,
        phone: phone,
        nationality: nationality,
        secondaryEmail: Math.random() > 0.5 ? generateEmail(firstName, lastName) : '',
        secondaryPhone: Math.random() > 0.5 ? generatePhone() : '',
        emergencyContact: {
          name: emergencyName,
          relationship: emergencyRelationship,
          phone: emergencyPhone,
          email: emergencyEmail
        },
        address: {
          street: street,
          city: city,
          state: state,
          zipCode: zipCode,
          country: country
        },
        employment: {
          company: company,
          position: position,
          monthlyIncome: monthlyIncome,
          employmentType: employmentType
        },
        notes: `Test tenant ${i} created for QA testing`,
        status: 'ACTIVE',
        isActive: true
      };

      const createdTenant = await User.create(tenant);
      tenants.push(createdTenant);

      console.log(`✅ Tenant ${i} created: ${firstName} ${lastName}`);
      console.log(`   Email: ${email}`);
      console.log(`   NIC: ${nic}`);
      console.log(`   Phone: ${phone}`);
      console.log(`   Company: ${company} - ${position}`);
      console.log(`   Income: $${monthlyIncome}`);
      console.log('');
    }

    console.log('🎉 All 11 test tenants created successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Total Tenants Created: ${tenants.length}`);
    console.log(`   All passwords: password123`);
    console.log('\n✅ QA Testing Data Ready!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test tenants:', error);
    process.exit(1);
  }
}

createTestTenants();

