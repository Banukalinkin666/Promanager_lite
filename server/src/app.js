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
    'https://spm-frontend.onrender.com'
  ].filter(Boolean),
  credentials: true 
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'Smart Property Manager API' });
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

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/move-in', moveInRoutes);
app.use('/api/reports', reportRoutes);

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
});


