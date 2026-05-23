import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { healthCheck } from './db/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import interestRoutes from './routes/interests.js';
import statsRoutes from './routes/stats.js';
import testimonialRoutes from './routes/testimonials.js';
import contactRoutes from './routes/contact.js';
import metaRoutes from './routes/meta.js';
import biodataRoutes from './routes/biodata.js';
import { securityHeaders } from './middleware/security.js';
import { asyncHandler } from './utils/asyncHandler.js';

export function createApp() {
  const app = express();

  if (config.trustProxy) {
    app.set('trust proxy', 1);
  }

  app.use(securityHeaders);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (config.corsOrigin.includes(origin)) return callback(null, true);
        if (!config.isProduction) return callback(null, true);
        return callback(null, false);
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '2mb' }));

  app.get(
    '/api/health',
    asyncHandler(async (_req, res) => {
      try {
        await healthCheck();
        res.json({
          success: true,
          status: 'healthy',
          service: 'Sakal Maratha Matrimonial API',
          version: '1.0.0',
          database: 'postgresql',
          env: config.nodeEnv,
          timestamp: new Date().toISOString(),
        });
      } catch {
        res.status(503).json({
          success: false,
          status: 'unhealthy',
          message: 'Database not available',
          timestamp: new Date().toISOString(),
        });
      }
    })
  );

  app.use('/api/meta', metaRoutes);
  app.use('/api/biodata', biodataRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/profiles', profileRoutes);
  app.use('/api/interests', interestRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/testimonials', testimonialRoutes);
  app.use('/api/contact', contactRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
