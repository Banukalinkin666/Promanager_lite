import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Define schemas
const LeaseSchema = new mongoose.Schema({
  agreementNumber: String,
  tenant: mongoose.Schema.Types.ObjectId,
  unit: mongoose.Schema.Types.ObjectId,
  property: mongoose.Schema.Types.ObjectId
}, { strict: false });

const PropertySchema = new mongoose.Schema({
  title: String,
  units: [{
    _id: mongoose.Schema.Types.ObjectId,
    name: String
  }]
}, { strict: false });

const PaymentSchema = new mongoose.Schema({
  metadata: {
    unitId: mongoose.Schema.Types.ObjectId
  }
}, { strict: false });

const Lease = mongoose.model('Lease', LeaseSchema);
const Property = mongoose.model('Property', PropertySchema);
const Payment = mongoose.model('Payment', PaymentSchema);

// Delete leases for unit 100
const deleteUnit100Leases = async () => {
  try {
    console.log('\n🗑️  Starting to delete Unit 100 lease history...\n');
    
    // Find the property
    const property = await Property.findOne({ title: 'Green Valley Estates' });
    
    if (!property) {
      console.log('❌ Property "Green Valley Estates" not found');
      return;
    }
    
    console.log(`✅ Found property: ${property.title}`);
    
    // Find unit 100
    const unit100 = property.units.find(u => u.name === '100');
    
    if (!unit100) {
      console.log('❌ Unit 100 not found in this property');
      return;
    }
    
    console.log(`✅ Found Unit 100 (ID: ${unit100._id})`);
    
    // Find leases for this unit
    const leases = await Lease.find({ unit: unit100._id });
    
    if (leases.length === 0) {
      console.log('ℹ️  No leases found for Unit 100');
      return;
    }
    
    console.log(`\n📋 Found ${leases.length} lease(s) for Unit 100:`);
    leases.forEach(lease => {
      console.log(`   - Agreement #${lease.agreementNumber}`);
    });
    
    // Delete payments for this unit
    console.log('\n🔄 Deleting payments for Unit 100...');
    const paymentDeleteResult = await Payment.deleteMany({ 
      'metadata.unitId': unit100._id 
    });
    console.log(`✅ Deleted ${paymentDeleteResult.deletedCount} payment(s)`);
    
    // Delete the leases
    console.log('\n🔄 Deleting leases...');
    const leaseDeleteResult = await Lease.deleteMany({ unit: unit100._id });
    console.log(`✅ Deleted ${leaseDeleteResult.deletedCount} lease(s)`);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Successfully deleted all lease history for Unit 100!');
    console.log('🎉 You can now start fresh with the new system');
    console.log('='.repeat(50) + '\n');
    
  } catch (error) {
    console.error('❌ Error deleting leases:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed\n');
  }
};

// Run the deletion
console.log('🚀 Starting Unit 100 Lease Deletion Script...\n');
connectDB().then(() => {
  deleteUnit100Leases().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
});

