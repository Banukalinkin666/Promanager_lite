import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_property_manager';

mongoose.set('strictQuery', true);

const connectDB = async () => {
  const maxRetries = 2;
  let retries = 0;

  // Validate MONGO_URI format
  if (!mongoUri || mongoUri === 'mongodb://127.0.0.1:27017/smart_property_manager') {
    console.error('❌ MONGO_URI not set or using default local connection');
    console.error('Please set MONGO_URI environment variable in Render dashboard');
    console.error('🔄 Server will continue without database connection for debugging');
    return; // Don't exit, let server start
  }

  console.log('🔗 Attempting to connect to MongoDB...');
  console.log('📊 Connection string format check:', mongoUri.includes('mongodb+srv://') ? '✅ SRV format' : '❌ Not SRV format');

  while (retries < maxRetries) {
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 30000,
        connectTimeoutMS: 5000,
        maxPoolSize: 5,
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
      }
      
      if (retries >= maxRetries) {
        console.error('💥 Failed to connect to MongoDB after', maxRetries, 'attempts');
        console.error('🔄 Server will continue without database connection for debugging');
        console.error('Please check your MONGO_URI environment variable in the Render dashboard');
        console.error('The connection string should look like: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>');
        return; // Don't exit, let server start
      }
      
      // Wait before retrying
      const waitTime = 3000;
      console.log(`⏳ Retrying in ${waitTime/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

connectDB();

export default mongoose;


