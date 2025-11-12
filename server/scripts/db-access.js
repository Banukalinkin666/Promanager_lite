import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://spm-mongodb:27017/smart_property_manager';

// Connect to MongoDB
await mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 30000,
  connectTimeoutMS: 5000,
  maxPoolSize: 5,
  retryWrites: true,
  w: 'majority'
});

console.log('✅ Connected to MongoDB\n');

// Get command from arguments
const command = process.argv[2] || 'counts';

try {
  switch (command) {
    case 'counts':
      // Show counts for all collections
      const User = (await import('../src/models/User.js')).default;
      const Property = (await import('../src/models/Property.js')).default;
      const Payment = (await import('../src/models/Payment.js')).default;
      const Invoice = (await import('../src/models/Invoice.js')).default;
      const Lease = (await import('../src/models/Lease.js')).default;

      console.log('📊 Database Counts:');
      console.log('─'.repeat(50));
      console.log(`Users: ${await User.countDocuments({})}`);
      console.log(`  - Admins: ${await User.countDocuments({ role: 'ADMIN' })}`);
      console.log(`  - Owners: ${await User.countDocuments({ role: 'OWNER' })}`);
      console.log(`  - Tenants: ${await User.countDocuments({ role: 'TENANT' })}`);
      console.log(`Properties: ${await Property.countDocuments({})}`);
      console.log(`Payments: ${await Payment.countDocuments({})}`);
      console.log(`Invoices: ${await Invoice.countDocuments({})}`);
      console.log(`Leases: ${await Lease.countDocuments({})}`);
      break;

    case 'users':
      // List all users
      const UserModel = (await import('../src/models/User.js')).default;
      const users = await UserModel.find({}).select('email role firstName lastName status isActive').lean();
      console.log('👥 Users:');
      console.log('─'.repeat(50));
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName || ''} ${user.lastName || ''} (${user.email})`);
        console.log(`   Role: ${user.role} | Status: ${user.status || 'ACTIVE'} | Active: ${user.isActive}`);
      });
      break;

    case 'properties':
      // List all properties
      const PropertyModel = (await import('../src/models/Property.js')).default;
      const properties = await PropertyModel.find({}).select('title address city units').lean();
      console.log('🏢 Properties:');
      console.log('─'.repeat(50));
      properties.forEach((prop, index) => {
        console.log(`${index + 1}. ${prop.title}`);
        console.log(`   Address: ${prop.address || 'N/A'}`);
        console.log(`   Units: ${prop.units?.length || 0}`);
      });
      break;

    case 'clear-tenants':
      // Clear all tenant users
      const UserClear = (await import('../src/models/User.js')).default;
      const result = await UserClear.deleteMany({ role: 'TENANT' });
      console.log(`✅ Deleted ${result.deletedCount} tenant users`);
      break;

    case 'clear-all':
      // Clear all data except admins
      const UserAll = (await import('../src/models/User.js')).default;
      const PropertyAll = (await import('../src/models/Property.js')).default;
      const PaymentAll = (await import('../src/models/Payment.js')).default;
      const InvoiceAll = (await import('../src/models/Invoice.js')).default;
      const LeaseAll = (await import('../src/models/Lease.js')).default;

      const nonAdminResult = await UserAll.deleteMany({ role: { $ne: 'ADMIN' } });
      const propertyResult = await PropertyAll.deleteMany({});
      const paymentResult = await PaymentAll.deleteMany({});
      const invoiceResult = await InvoiceAll.deleteMany({});
      const leaseResult = await LeaseAll.deleteMany({});

      console.log('✅ Data cleared:');
      console.log(`  - Non-admin users: ${nonAdminResult.deletedCount}`);
      console.log(`  - Properties: ${propertyResult.deletedCount}`);
      console.log(`  - Payments: ${paymentResult.deletedCount}`);
      console.log(`  - Invoices: ${invoiceResult.deletedCount}`);
      console.log(`  - Leases: ${leaseResult.deletedCount}`);
      break;

    default:
      console.log('Available commands:');
      console.log('  node scripts/db-access.js counts        - Show database counts');
      console.log('  node scripts/db-access.js users         - List all users');
      console.log('  node scripts/db-access.js properties    - List all properties');
      console.log('  node scripts/db-access.js clear-tenants  - Clear all tenant users');
      console.log('  node scripts/db-access.js clear-all     - Clear all data except admins');
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} finally {
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
}


