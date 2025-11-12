import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

async function createSuperAdmin() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_property_manager';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ email: 'bsoftkandy@gmail.com' });
    if (existingSuperAdmin) {
      if (existingSuperAdmin.role === 'SUPER_ADMIN') {
        console.log('✅ Super admin already exists');
        // Update password to ensure it's correct
        existingSuperAdmin.passwordHash = await User.hashPassword('Webmaet99@Smtk');
        await existingSuperAdmin.save();
        console.log('✅ Super admin password updated');
        await mongoose.disconnect();
        return;
      } else {
        // Update existing user to super admin
        existingSuperAdmin.role = 'SUPER_ADMIN';
        existingSuperAdmin.passwordHash = await User.hashPassword('Webmaet99@Smtk');
        existingSuperAdmin.name = 'Super Admin';
        existingSuperAdmin.isActive = true;
        await existingSuperAdmin.save();
        console.log('✅ Existing user upgraded to super admin');
        await mongoose.disconnect();
        return;
      }
    }

    // Create super admin
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'bsoftkandy@gmail.com',
      passwordHash: await User.hashPassword('Webmaet99@Smtk'),
      role: 'SUPER_ADMIN',
      isActive: true,
      status: 'ACTIVE'
    });

    console.log('✅ Super admin created successfully!');
    console.log('📧 Email:', superAdmin.email);
    console.log('🔑 Role:', superAdmin.role);
    console.log('🆔 ID:', superAdmin._id);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  }
}

createSuperAdmin();

