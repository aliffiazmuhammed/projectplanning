import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { logger } from './config/logger.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { projectRoutes } from './routes/project.routes.js';
import { authRoutes } from './routes/auth.routes.js';

async function main(): Promise<void> {
  // Connect to MongoDB
  await connectDB(env.MONGODB_URI);

  const app = express();

  // Middleware
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow localhost and local dev origins or non-browser agent requests (undefined)
        if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(requestLogger);

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  // Start server
  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'API server started');
  });
}

main().catch((error) => {
  logger.fatal({ error }, 'Failed to start server');
  process.exit(1);
});
