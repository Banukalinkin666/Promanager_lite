import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_property_manager';

mongoose.set('strictQuery', true);

const connectDB = async () => {
  const maxRetries = 3;
  let retries = 0;

  // Validate MONGO_URI format
  if (!mongoUri || mongoUri === 'mongodb://127.0.0.1:27017/smart_property_manager') {
    console.error('❌ MONGO_URI not set or using default local connection');
    console.error('Please set MONGO_URI environment variable in Render dashboard');
    process.exit(1);
  }

  console.log('🔗 Attempting to connect to MongoDB...');
  console.log('📊 Connection string format check:', mongoUri.includes('mongodb+srv://') ? '✅ SRV format' : '❌ Not SRV format');

  while (retries < maxRetries) {
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
        retryWrites: true,
        w: 'majority'
      });
      console.log('✅ MongoDB connected successfully');
      console.log('📊 Database:', mongoose.connection.db.databaseName);
      console.log('📊 Host:', mongoose.connection.host);
      return;
    } catch (err) {
      retries++;
      console.error(`❌ MongoDB connection attempt ${retries}/${maxRetries} failed:`, err.message);
      
      // Check if it's a DNS/hostname issue
      if (err.message.includes('ENOTFOUND') || err.message.includes('querySrv')) {
        console.error('🔍 DNS Resolution Error detected!');
        console.error('This usually means your MONGO_URI is incorrect or corrupted.');
        console.error('Please check your MongoDB connection string in the Render dashboard.');
        console.error('Current MONGO_URI (first 20 chars):', mongoUri.substring(0, 20) + '...');
        console.error('Full error:', err);
      }
      
      if (retries >= maxRetries) {
        console.error('💥 Failed to connect to MongoDB after', maxRetries, 'attempts');
        console.error('Please check your MONGO_URI environment variable in the Render dashboard');
        console.error('The connection string should look like: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>');
        console.error('Make sure the cluster is running and accessible');
        process.exit(1);
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = Math.min(2000 * Math.pow(2, retries), 15000);
      console.log(`⏳ Retrying in ${waitTime/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

connectDB();

export default mongoose;


