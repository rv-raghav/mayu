/**
 * Responses controller — handles response submission and listing.
 * @module modules/responses/responses.controller
 */

import { RequestHandler } from 'express';
import { AppError } from '@/utils/errors';
import { ErrorCode } from '@/types';
import { getParam } from '@/utils/params';
import * as responsesService from '@/modules/responses/responses.service';
import { assertPollOwner } from '@/modules/polls/polls.service';
import type { SubmitResponseInput, ListResponsesQuery } from '@/modules/responses/responses.schema';

/** POST /polls/:slug/respond */
export const submitResponseHandler: RequestHandler = async (req, res, next) => {
  try {
    const slug = getParam(req.params, 'slug');
    if (!slug) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Slug is required', 400);
    }

    const result = await responsesService.submitResponse(slug, req.body as SubmitResponseInput, {
      userId: req.user?.sub,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(result.status).json({
      success: true,
      data: {
        message: result.status === 202 ? 'Response accepted for processing' : 'Response submitted',
        ...(result.responseId && { responseId: result.responseId }),
      },
    });
  } catch (err) {
    next(err);
  }
};

/** GET /polls/:slug/responses */
export const listResponsesHandler: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.AUTH_REQUIRED, 'Authentication required', 401);
    }

    const slug = getParam(req.params, 'slug');
    if (!slug) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Slug is required', 400);
    }

    const poll = await assertPollOwner(slug, req.user.sub);
    const query = req.query as unknown as ListResponsesQuery;
    const result = await responsesService.listResponses(poll.id, query.page, query.limit);

    res.status(200).json({ success: true, data: result.responses, meta: result.meta });
  } catch (err) {
    next(err);
  }
};
