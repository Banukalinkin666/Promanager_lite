import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import './config/db.js';

import authRoutes from './routes/auth.js';
import propertyRoutes from './routes/properties.js';
import tenantRoutes from './routes/tenants.js';
import paymentRoutes from './routes/payments.js';
import invoiceRoutes from './routes/invoices.js';
import moveInRoutes from './routes/moveIn.js';
import reportRoutes from './routes/reports.js';
import { startInvoiceCron } from './jobs/invoiceCron.js';

dotenv.config();

const app = express();

// Stripe webhook raw body must be before JSON parser
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(cors({ 
  origin: [
    process.env.CORS_ORIGIN || process.env.CLIENT_URL,
    'https://spm-frontend-gvcu.onrender.com',
    'https://spm-frontend.onrender.com',
    'http://localhost:3000',
    'http://localhost:5173'
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ 
    ok: true, 
    service: 'Smart Property Manager API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Simple ping endpoint
app.get('/ping', (_req, res) => {
  res.json({ pong: true, timestamp: new Date().toISOString() });
});

// Seeding endpoint for production
app.get('/api/seed', async (_req, res) => {
  try {
    const { seedProduction } = await import('./seed/seed-production.js');
    await seedProduction();
    res.json({ message: 'Database seeded successfully' });
  } catch (error) {
    console.error('Seeding error:', error);
    res.status(500).json({ message: 'Seeding failed', error: error.message });
  }
});

// Fix image paths endpoint
app.get('/api/fix-image-paths', async (_req, res) => {
  try {
    const Property = (await import('./models/Property.js')).default;
    const path = await import('path');
    
    const properties = await Property.find({});
    let fixedCount = 0;
    const results = [];

    for (const property of properties) {
      if (!property.photos || property.photos.length === 0) continue;

      let needsUpdate = false;
      const fixedPhotos = property.photos.map(photo => {
        // Skip if already valid
        if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
        if (photo.startsWith('/uploads/properties/')) return photo;

        // Fix absolute server paths
        if (photo.includes('/opt/render/') || photo.includes('uploads/properties/')) {
          needsUpdate = true;
          const filename = path.default.basename(photo);
          return `/uploads/properties/${filename}`;
        }

        return photo;
      });

      if (needsUpdate) {
        property.photos = fixedPhotos;
        await property.save();
        fixedCount++;
        results.push({ 
          property: property.title, 
          oldPhotos: property.photos, 
          newPhotos: fixedPhotos 
        });
      }
    }

    res.json({ 
      message: `Fixed ${fixedCount} properties`,
      total: properties.length,
      fixed: fixedCount,
      results 
    });
  } catch (error) {
    console.error('Fix image paths error:', error);
    res.status(500).json({ message: 'Failed to fix image paths', error: error.message });
  }
});

// Debug endpoint to check users
app.get('/api/debug/users', async (_req, res) => {
  try {
    const User = (await import('./models/User.js')).default;
    const users = await User.find({}, 'email role name').lean();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a simple test user
app.get('/api/create-test-user', async (_req, res) => {
  try {
    const User = (await import('./models/User.js')).default;
    
    // Clear existing users
    await User.deleteMany({});
    
    // Create a simple test admin user
    const testUser = await User.create({
      name: 'Test Admin',
      email: 'admin@test.com',
      passwordHash: await User.hashPassword('password123'),
      role: 'ADMIN',
    });
    
    res.json({ 
      message: 'Test user created successfully',
      user: {
        email: testUser.email,
        role: testUser.role,
        name: testUser.name
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all data for fresh start
app.get('/api/clear-all-data', async (_req, res) => {
  try {
    const User = (await import('./models/User.js')).default;
    const Property = (await import('./models/Property.js')).default;
    const Payment = (await import('./models/Payment.js')).default;
    const Invoice = (await import('./models/Invoice.js')).default;
    const Lease = (await import('./models/Lease.js')).default;
    
    // Clear all collections
    await User.deleteMany({});
    await Property.deleteMany({});
    await Payment.deleteMany({});
    await Invoice.deleteMany({});
    await Lease.deleteMany({});
    
    // Create a fresh admin user
    const adminUser = await User.create({
      name: 'Admin',
      email: 'admin@spm.test',
      passwordHash: await User.hashPassword('password123'),
      role: 'ADMIN',
    });
    
    res.json({ 
      message: 'All data cleared successfully. Fresh system ready!',
      adminUser: {
        email: adminUser.email,
        role: adminUser.role,
        name: adminUser.name
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Count all users by role
app.get('/api/count-users', async (_req, res) => {
  try {
    const User = (await import('./models/User.js')).default;
    
    const allUsers = await User.find({}).select('email role firstName lastName');
    const counts = {
      total: allUsers.length,
      admins: allUsers.filter(u => u.role === 'ADMIN').length,
      tenants: allUsers.filter(u => u.role === 'TENANT').length,
      owners: allUsers.filter(u => u.role === 'OWNER').length,
      users: allUsers.map(u => ({
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
        email: u.email,
        role: u.role
      }))
    };
    
    res.json(counts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove all tenants (keep only admin)
app.get('/api/remove-all-tenants', async (_req, res) => {
  try {
    const User = (await import('./models/User.js')).default;
    
    // Delete all tenants
    const result = await User.deleteMany({ role: 'TENANT' });
    
    // Count remaining users
    const remainingUsers = await User.find({}).select('email role firstName lastName');
    
    res.json({
      message: `Successfully removed ${result.deletedCount} tenant(s)`,
      deletedCount: result.deletedCount,
      remainingUsers: {
        total: remainingUsers.length,
        admins: remainingUsers.filter(u => u.role === 'ADMIN').length,
        tenants: remainingUsers.filter(u => u.role === 'TENANT').length,
        owners: remainingUsers.filter(u => u.role === 'OWNER').length
      },
      users: remainingUsers.map(u => ({
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
        email: u.email,
        role: u.role
      }))
    });
  } catch (error) {
    console.error('Error removing tenants:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create QA test tenants
app.get('/api/create-qa-tenants', async (_req, res) => {
  try {
    const User = (await import('./models/User.js')).default;
    
    const tenants = [
      {
        firstName: 'Emma', lastName: 'Martinez', middleName: 'Marie', passportNo: 'AB234567',
        nic: '891234567V', nicExpirationDate: new Date('2030-12-31'),
        primaryEmail: 'emma.martinez342@gmail.com', phone: '0771234567', nationality: 'American',
        secondaryEmail: 'emma.m.backup@gmail.com', secondaryPhone: '0762345678',
        emergencyContact: { name: 'Robert Martinez', relationship: 'Parent', phone: '0773456789', email: 'robert.martinez@gmail.com' },
        address: { street: '523 Oak Avenue', city: 'Los Angeles', state: 'California', zipCode: '90001', country: 'United States' },
        employment: { company: 'Google', position: 'Software Engineer', monthlyIncome: 8500, employmentType: 'FULL_TIME' },
        notes: 'QA Test Tenant 2'
      },
      {
        firstName: 'James', lastName: 'Wilson', middleName: 'Lee', passportNo: 'CD456789',
        nic: '851234321V', nicExpirationDate: new Date('2029-06-15'),
        primaryEmail: 'james.wilson891@gmail.com', phone: '0764567890', nationality: 'British',
        emergencyContact: { name: 'Sarah Wilson', relationship: 'Spouse', phone: '0775678901', email: 'sarah.wilson@gmail.com' },
        address: { street: '782 Maple Street', city: 'Chicago', state: 'Illinois', zipCode: '60007', country: 'United States' },
        employment: { company: 'Microsoft', position: 'Project Manager', monthlyIncome: 9200, employmentType: 'FULL_TIME' },
        notes: 'QA Test Tenant 3'
      },
      {
        firstName: 'Sophia', lastName: 'Garcia', middleName: 'Ann', passportNo: 'EF789012',
        nic: '921234567V', nicExpirationDate: new Date('2031-03-20'),
        primaryEmail: 'sophia.garcia456@gmail.com', phone: '0776789012', nationality: 'Spanish',
        emergencyContact: { name: 'Michael Garcia', relationship: 'Sibling', phone: '0767890123', email: 'michael.garcia@gmail.com' },
        address: { street: '156 Pine Road', city: 'Houston', state: 'Texas', zipCode: '77002', country: 'United States' },
        employment: { company: 'Amazon', position: 'Data Analyst', monthlyIncome: 7800, employmentType: 'FULL_TIME' },
        notes: 'QA Test Tenant 4'
      },
      {
        firstName: 'William', lastName: 'Brown', middleName: 'Joseph', passportNo: 'GH234567',
        nic: '871234567V', nicExpirationDate: new Date('2028-11-10'),
        primaryEmail: 'william.brown234@gmail.com', phone: '0778901234', nationality: 'Canadian',
        emergencyContact: { name: 'Emma Brown', relationship: 'Parent', phone: '0769012345', email: 'emma.brown@gmail.com' },
        address: { street: '943 Cedar Boulevard', city: 'Phoenix', state: 'Arizona', zipCode: '85001', country: 'United States' },
        employment: { company: 'Apple', position: 'Marketing Manager', monthlyIncome: 10500, employmentType: 'FULL_TIME' },
        notes: 'QA Test Tenant 5'
      },
      {
        firstName: 'Olivia', lastName: 'Rodriguez', middleName: 'Elizabeth', passportNo: 'IJ567890',
        nic: '941234567V', nicExpirationDate: new Date('2032-08-25'),
        primaryEmail: 'olivia.rodriguez678@gmail.com', phone: '0770123456', nationality: 'Australian',
        emergencyContact: { name: 'James Rodriguez', relationship: 'Spouse', phone: '0761234567', email: 'james.rodriguez@gmail.com' },
        address: { street: '321 Main Street', city: 'Philadelphia', state: 'Pennsylvania', zipCode: '19019', country: 'United States' },
        employment: { company: 'Meta', position: 'Sales Representative', monthlyIncome: 6500, employmentType: 'FULL_TIME' },
        notes: 'QA Test Tenant 6'
      },
      {
        firstName: 'Michael', lastName: 'Johnson', middleName: 'Thomas', passportNo: 'KL890123',
        nic: '831234567V', nicExpirationDate: new Date('2027-04-30'),
        primaryEmail: 'michael.johnson234@gmail.com', phone: '0772345678', nationality: 'German',
        emergencyContact: { name: 'Sophia Johnson', relationship: 'Sibling', phone: '0763456789', email: 'sophia.johnson@gmail.com' },
        address: { street: '654 Oak Avenue', city: 'San Antonio', state: 'Texas', zipCode: '78201', country: 'United States' },
        employment: { company: 'Tesla', position: 'HR Specialist', monthlyIncome: 5800, employmentType: 'FULL_TIME' },
        notes: 'QA Test Tenant 7'
      },
      {
        firstName: 'Ava', lastName: 'Davis', middleName: 'Grace', passportNo: 'MN345678',
        nic: '901234567V', nicExpirationDate: new Date('2030-09-15'),
        primaryEmail: 'ava.davis901@gmail.com', phone: '0774567890', nationality: 'French',
        emergencyContact: { name: 'William Davis', relationship: 'Parent', phone: '0765678901', email: 'william.davis@gmail.com' },
        address: { street: '888 Maple Road', city: 'San Diego', state: 'California', zipCode: '92101', country: 'United States' },
        employment: { company: 'Netflix', position: 'Accountant', monthlyIncome: 7200, employmentType: 'FULL_TIME' },
        notes: 'QA Test Tenant 8'
      },
      {
        firstName: 'Robert', lastName: 'Miller', middleName: 'Alex', passportNo: 'OP678901',
        nic: '861234567V', nicExpirationDate: new Date('2029-02-28'),
        primaryEmail: 'robert.miller543@gmail.com', phone: '0776789012', nationality: 'Italian',
        emergencyContact: { name: 'Olivia Miller', relationship: 'Spouse', phone: '0767890123', email: 'olivia.miller@gmail.com' },
        address: { street: '234 Pine Street', city: 'Dallas', state: 'Texas', zipCode: '75201', country: 'United States' },
        employment: { company: 'Adobe', position: 'Designer', monthlyIncome: 8900, employmentType: 'FULL_TIME' },
        notes: 'QA Test Tenant 9'
      },
      {
        firstName: 'Isabella', lastName: 'Hernandez', middleName: 'Marie', passportNo: 'QR012345',
        nic: '931234567V', nicExpirationDate: new Date('2033-07-20'),
        primaryEmail: 'isabella.hernandez789@gmail.com', phone: '0778901234', nationality: 'Japanese',
        emergencyContact: { name: 'David Hernandez', relationship: 'Sibling', phone: '0769012345', email: 'david.hernandez@gmail.com' },
        address: { street: '567 Cedar Avenue', city: 'San Jose', state: 'California', zipCode: '95101', country: 'United States' },
        employment: { company: 'Oracle', position: 'Consultant', monthlyIncome: 11200, employmentType: 'FULL_TIME' },
        notes: 'QA Test Tenant 10'
      },
      {
        firstName: 'David', lastName: 'Smith', middleName: 'James', passportNo: 'ST456789',
        nic: '881234567V', nicExpirationDate: new Date('2028-12-05'),
        primaryEmail: 'david.smith321@gmail.com', phone: '0770123456', nationality: 'Korean',
        secondaryEmail: 'd.smith.backup@gmail.com', secondaryPhone: '0761234567',
        emergencyContact: { name: 'Emma Smith', relationship: 'Spouse', phone: '0772345678', email: 'emma.smith@gmail.com' },
        address: { street: '789 Main Boulevard', city: 'New York', state: 'New York', zipCode: '10001', country: 'United States' },
        employment: { company: 'Salesforce', position: 'Developer', monthlyIncome: 12500, employmentType: 'FULL_TIME' },
        notes: 'QA Test Tenant 11'
      }
    ];

    const createdTenants = [];
    
    for (const tenantData of tenants) {
      const tenant = await User.create({
        name: `${tenantData.firstName} ${tenantData.lastName}`,
        email: tenantData.primaryEmail,
        passwordHash: await User.hashPassword('Welcome@123'),
        role: 'TENANT',
        ...tenantData,
        status: 'ACTIVE',
        isActive: true
      });
      createdTenants.push(tenant);
    }

    res.json({
      message: '10 QA test tenants created successfully!',
      count: createdTenants.length,
      tenants: createdTenants.map(t => ({
        name: `${t.firstName} ${t.lastName}`,
        email: t.primaryEmail,
        nic: t.nic,
        phone: t.phone
      }))
    });
  } catch (error) {
    console.error('QA tenants creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/move-in', moveInRoutes);
app.use('/api/reports', reportRoutes);

// Fallback route for unmatched API requests
app.use('/api/*', (req, res) => {
  console.log(`❌ API route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'API endpoint not found', 
    method: req.method, 
    url: req.originalUrl,
    availableEndpoints: [
      '/api/health',
      '/api/properties/test',
      '/api/properties/debug-payments-simple'
    ]
  });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

// Start cron jobs (if enabled)
startInvoiceCron();

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('✅ Server started successfully - PDF generator fixed');
  console.log('🔧 Debug endpoints available:');
  console.log('  - /api/health');
  console.log('  - /api/properties/test');
  console.log('  - /api/properties/debug-payments-simple');
}).on('error', (err) => {
  console.error('❌ Server startup error:', err);
  process.exit(1);
});


