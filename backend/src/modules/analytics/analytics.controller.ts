/**
 * Analytics controller — handles analytics and public results endpoints.
 * @module modules/analytics/analytics.controller
 */

import { RequestHandler } from 'express';
import { AppError } from '@/utils/errors';
import { ErrorCode } from '@/types';
import { getParam } from '@/utils/params';
import { assertPollOwner } from '@/modules/polls/polls.service';
import * as analyticsService from '@/modules/analytics/analytics.service';

/** GET /polls/:slug/analytics */
export const getAnalyticsHandler: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.AUTH_REQUIRED, 'Authentication required', 401);
    }
    const slug = getParam(req.params, 'slug');
    if (!slug) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Slug is required', 400);
    }

    const poll = await assertPollOwner(slug, req.user.sub);
    const analytics = await analyticsService.getAnalytics(poll.id);

    res.status(200).json({ success: true, data: analytics });
  } catch (err) {
    next(err);
  }
};

/** GET /polls/:slug/results */
export const getResultsHandler: RequestHandler = async (req, res, next) => {
  try {
    const slug = getParam(req.params, 'slug');
    if (!slug) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Slug is required', 400);
    }

    const results = await analyticsService.getPublicResults(slug, req.user?.sub);
    res.status(200).json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};
