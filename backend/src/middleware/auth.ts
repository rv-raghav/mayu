/**
 * Authentication middleware: requireAuth and optionalAuth.
 * @module middleware/auth
 */

import { RequestHandler } from 'express';
import { verifyAccessToken } from '@/modules/auth/token.service';
import { AppError } from '@/utils/errors';
import { ErrorCode } from '@/types';

/**
 * Requires a valid Bearer JWT token in the Authorization header.
 * Attaches the decoded payload to req.user.
 * Returns 401 if missing or invalid.
 */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(ErrorCode.AUTH_REQUIRED, 'Authentication required', 401));
  }
  const token = authHeader.slice(7);
  const payload = await verifyAccessToken(token);
  if (!payload) {
    return next(new AppError(ErrorCode.TOKEN_INVALID, 'Invalid or expired token', 401));
  }
  req.user = payload;
  next();
};

/**
 * Optional authentication middleware.
 * Attaches user to req.user if a valid token is present, but does not error if absent.
 */
export const optionalAuth: RequestHandler = async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = await verifyAccessToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
};
