import mongoose from 'mongoose';
import { logger } from './logger.js';

export async function connectDB(uri: string): Promise<void> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 3000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(uri);
      logger.info('Connected to MongoDB');
      return;
    } catch (error) {
      logger.error({ attempt, error }, 'Failed to connect to MongoDB');
      if (attempt === MAX_RETRIES) {
        throw new Error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts`);
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}
