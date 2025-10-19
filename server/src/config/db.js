import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_property_manager';

mongoose.set('strictQuery', true);

mongoose
  .connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('Mongo connection error:', err.message);
    process.exit(1);
  });

export default mongoose;


