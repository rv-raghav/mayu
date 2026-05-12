/**
 * Responses routes — mounts response submission and listing endpoints.
 * @module modules/responses/responses.routes
 */

import { Router } from 'express';
import { requireAuth } from '@/middleware/auth';
import { optionalAuth } from '@/middleware/optionalAuth';
import { validate } from '@/middleware/validate';
import { submitResponseSchema, listResponsesQuerySchema } from '@/modules/responses/responses.schema';
import { submitResponseHandler, listResponsesHandler } from '@/modules/responses/responses.controller';

/** Responses router — mounted at /polls (shares prefix with polls routes). */
export const responsesRoutes = Router();

// Submit response (optionalAuth — may or may not be authenticated)
responsesRoutes.post('/:slug/respond', optionalAuth, validate(submitResponseSchema), submitResponseHandler);

// List responses (creator/owner only)
responsesRoutes.get(
  '/:slug/responses',
  requireAuth,
  validate(listResponsesQuerySchema, 'query'),
  listResponsesHandler,
);
