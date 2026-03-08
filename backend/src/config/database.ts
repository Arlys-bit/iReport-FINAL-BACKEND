import mongoose from 'mongoose';
import logger from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ireport';
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(mongoURI);
    
    console.log('✅ MongoDB connected successfully');
    logger.info('MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    logger.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('MongoDB disconnection error:', error);
  }
};
