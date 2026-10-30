import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

mongoose.set('strictQuery', true);

export async function connectDB(uri = env.MONGODB_URI) {
  mongoose.connection.on('error', (err) =>
    logger.error('MongoDB connection error', { message: err.message })
  );
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

  await mongoose.connect(uri, {
    autoIndex: env.MONGO_AUTO_INDEX,
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10,
  });
  logger.info('MongoDB connected');
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  }
}

export const isDbConnected = () => mongoose.connection.readyState === 1;
