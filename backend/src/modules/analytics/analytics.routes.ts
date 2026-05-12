/**
 * Analytics routes — mounts analytics and public results endpoints.
 * @module modules/analytics/analytics.routes
 */

import { Router } from 'express';
import { requireAuth } from '@/middleware/auth';
import { optionalAuth } from '@/middleware/optionalAuth';
import { getAnalyticsHandler, getResultsHandler } from '@/modules/analytics/analytics.controller';

/** Analytics router — mounted at /polls (shares prefix). */
export const analyticsRoutes = Router();

// Creator analytics (owner only)
analyticsRoutes.get('/:slug/analytics', requireAuth, getAnalyticsHandler);

// Public results (PUBLISHED polls only — optionalAuth for owner override)
analyticsRoutes.get('/:slug/results', optionalAuth, getResultsHandler);
