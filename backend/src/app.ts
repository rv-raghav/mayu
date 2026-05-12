/**
 * Express application factory.
 * Creates and configures the Express app with all global middleware.
 * Does NOT call app.listen — that is done in server.ts.
 * @module app
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from '@/config/env';
import { requestId } from '@/middleware/requestId';
import { errorHandler } from '@/middleware/errorHandler';
import { authRoutes } from '@/modules/auth/auth.routes';
import { pollsRoutes } from '@/modules/polls/polls.routes';
import { responsesRoutes } from '@/modules/responses/responses.routes';
import { analyticsRoutes } from '@/modules/analytics/analytics.routes';

/**
 * Creates and returns a fully configured Express application.
 */
export function createApp(): express.Express {
  const app = express();

  // ─── Global Middleware ─────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(requestId);

  // ─── Health Check ──────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
  });

  // ─── API Routes ────────────────────────────────────────
  app.use('/auth', authRoutes);
  app.use('/polls', pollsRoutes);
  app.use('/polls', responsesRoutes);
  app.use('/polls', analyticsRoutes);

  // ─── Global Error Handler (must be last) ───────────────
  app.use(errorHandler);

  return app;
}
