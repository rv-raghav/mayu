/**
 * Polls controller — thin handlers that delegate to service.
 * @module modules/polls/polls.controller
 */

import { RequestHandler } from 'express';
import { env } from '@/config/env';
import { AppError } from '@/utils/errors';
import { ErrorCode } from '@/types';
import { getParam } from '@/utils/params';
import * as pollsService from '@/modules/polls/polls.service';
import type { CreatePollInput, UpdatePollInput, ListPollsQuery } from '@/modules/polls/polls.schema';

/** POST /polls */
export const createPollHandler: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.AUTH_REQUIRED, 'Authentication required', 401);
    }
    const poll = await pollsService.createPoll(req.user.sub, req.body as CreatePollInput);
    res.status(201).json({ success: true, data: poll });
  } catch (err) {
    next(err);
  }
};

/** GET /polls */
export const listPollsHandler: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.AUTH_REQUIRED, 'Authentication required', 401);
    }
    const query = req.query as unknown as ListPollsQuery;
    const result = await pollsService.listPolls(req.user.sub, query.page, query.limit);
    res.status(200).json({ success: true, data: result.polls, meta: result.meta });
  } catch (err) {
    next(err);
  }
};

/** GET /polls/:slug */
export const getPollHandler: RequestHandler = async (req, res, next) => {
  try {
    const slug = getParam(req.params, 'slug');
    if (!slug) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Slug is required', 400);
    }
    const poll = await pollsService.getPollBySlug(slug, req.user?.sub);
    res.status(200).json({ success: true, data: poll });
  } catch (err) {
    next(err);
  }
};

/** PATCH /polls/:slug */
export const updatePollHandler: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.AUTH_REQUIRED, 'Authentication required', 401);
    }
    const slug = getParam(req.params, 'slug');
    if (!slug) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Slug is required', 400);
    }
    const poll = await pollsService.updatePoll(slug, req.user.sub, req.body as UpdatePollInput);
    res.status(200).json({ success: true, data: poll });
  } catch (err) {
    next(err);
  }
};

/** DELETE /polls/:slug */
export const deletePollHandler: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.AUTH_REQUIRED, 'Authentication required', 401);
    }
    const slug = getParam(req.params, 'slug');
    if (!slug) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Slug is required', 400);
    }
    await pollsService.deletePoll(slug, req.user.sub);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

/** POST /polls/:slug/activate */
export const activatePollHandler: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.AUTH_REQUIRED, 'Authentication required', 401);
    }
    const slug = getParam(req.params, 'slug');
    if (!slug) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Slug is required', 400);
    }
    const poll = await pollsService.activatePoll(slug, req.user.sub);
    res.status(200).json({ success: true, data: poll });
  } catch (err) {
    next(err);
  }
};

/** POST /polls/:slug/close */
export const closePollHandler: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.AUTH_REQUIRED, 'Authentication required', 401);
    }
    const slug = getParam(req.params, 'slug');
    if (!slug) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Slug is required', 400);
    }
    const poll = await pollsService.closePoll(slug, req.user.sub);
    res.status(200).json({ success: true, data: poll });
  } catch (err) {
    next(err);
  }
};

/** POST /polls/:slug/publish */
export const publishPollHandler: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.AUTH_REQUIRED, 'Authentication required', 401);
    }
    const slug = getParam(req.params, 'slug');
    if (!slug) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Slug is required', 400);
    }
    const poll = await pollsService.publishPoll(slug, req.user.sub);
    res.status(200).json({ success: true, data: poll });
  } catch (err) {
    next(err);
  }
};

/** GET /polls/:slug/share */
export const sharePollHandler: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.AUTH_REQUIRED, 'Authentication required', 401);
    }
    const slug = getParam(req.params, 'slug');
    if (!slug) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Slug is required', 400);
    }
    const data = await pollsService.getShareData(slug, req.user.sub, env.FRONTEND_URL);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
