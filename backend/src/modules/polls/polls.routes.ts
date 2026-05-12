/**
 * Polls routes — mounts all poll CRUD and status transition endpoints.
 * @module modules/polls/polls.routes
 */

import { Router } from 'express';
import { requireAuth } from '@/middleware/auth';
import { optionalAuth } from '@/middleware/optionalAuth';
import { validate } from '@/middleware/validate';
import { createPollSchema, updatePollSchema, listPollsQuerySchema } from '@/modules/polls/polls.schema';
import {
  createPollHandler,
  listPollsHandler,
  getPollHandler,
  updatePollHandler,
  deletePollHandler,
  activatePollHandler,
  closePollHandler,
  publishPollHandler,
  sharePollHandler,
} from '@/modules/polls/polls.controller';

/** Polls router — mounted at /polls */
export const pollsRoutes = Router();

// Create and list (authenticated)
pollsRoutes.post('/', requireAuth, validate(createPollSchema), createPollHandler);
pollsRoutes.get('/', requireAuth, validate(listPollsQuerySchema, 'query'), listPollsHandler);

// Get by slug (public — optionalAuth for DRAFT visibility check)
pollsRoutes.get('/:slug', optionalAuth, getPollHandler);

// Update and delete (owner only)
pollsRoutes.patch('/:slug', requireAuth, validate(updatePollSchema), updatePollHandler);
pollsRoutes.delete('/:slug', requireAuth, deletePollHandler);

// Status transitions (owner only)
pollsRoutes.post('/:slug/activate', requireAuth, activatePollHandler);
pollsRoutes.post('/:slug/close', requireAuth, closePollHandler);
pollsRoutes.post('/:slug/publish', requireAuth, publishPollHandler);

// Share link (owner only)
pollsRoutes.get('/:slug/share', requireAuth, sharePollHandler);
