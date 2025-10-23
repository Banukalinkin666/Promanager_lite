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
  status: String,
  terminatedDate: Date,
  unit: mongoose.Schema.Types.ObjectId,
  leaseStartDate: Date,
  leaseEndDate: Date,
  agreementNumber: String
}, { strict: false });

const PropertySchema = new mongoose.Schema({
  units: [{
    _id: mongoose.Schema.Types.ObjectId,
    status: String,
    name: String
  }]
}, { strict: false });

const Lease = mongoose.model('Lease', LeaseSchema);
const Property = mongoose.model('Property', PropertySchema);

// Fix old terminated leases
const fixOldLeases = async () => {
  try {
    console.log('\n🔧 Starting to fix old terminated leases...\n');
    
    // Get all properties
    const properties = await Property.find({});
    console.log(`📦 Found ${properties.length} properties to check`);
    
    let fixedCount = 0;
    let totalChecked = 0;
    
    for (const property of properties) {
      for (const unit of property.units) {
        totalChecked++;
        
        // If unit is AVAILABLE (not occupied), find its active leases
        if (unit.status === 'AVAILABLE') {
          const activeLeases = await Lease.find({
            unit: unit._id,
            status: 'ACTIVE'
          });
          
          if (activeLeases.length > 0) {
            console.log(`\n📋 Unit "${unit.name || unit._id}" is AVAILABLE but has ${activeLeases.length} ACTIVE lease(s)`);
            
            for (const lease of activeLeases) {
              console.log(`  📄 Lease #${lease.agreementNumber}`);
              console.log(`     Period: ${new Date(lease.leaseStartDate).toLocaleDateString()} - ${new Date(lease.leaseEndDate).toLocaleDateString()}`);
              
              // Update lease status to TERMINATED with termination date
              await Lease.findByIdAndUpdate(lease._id, { 
                status: 'TERMINATED',
                terminatedDate: new Date() // Set to current date
              });
              
              console.log(`  ✅ Marked as TERMINATED with termination date set to today`);
              fixedCount++;
            }
          }
        }
      }
    }
    
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📊 Summary:`);
    console.log(`   Total units checked: ${totalChecked}`);
    console.log(`   Leases fixed: ${fixedCount}`);
    console.log(`${'='.repeat(50)}\n`);
    
    if (fixedCount > 0) {
      console.log('✅ All terminated leases have been updated!');
      console.log('🎉 Your lease history will now show correct status');
    } else {
      console.log('ℹ️  No leases needed to be fixed');
    }
    
  } catch (error) {
    console.error('❌ Error fixing leases:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed\n');
  }
};

// Run the fix
console.log('🚀 Starting Lease Fix Script...\n');
connectDB().then(() => {
  fixOldLeases().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
});

