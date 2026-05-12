/**
 * Global Express error handler — must be the last middleware registered.
 * @module middleware/errorHandler
 */

import { ErrorRequestHandler } from 'express';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { ErrorCode } from '@/types';

/** Global error handler. Sends structured JSON error responses. */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    logger.warn('AppError', {
      code: err.code,
      message: err.message,
      requestId: req.requestId,
    });
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details ?? undefined,
      },
    });
    return;
  }

  const errorMessage = err instanceof Error ? err.message : 'Unknown error';
  logger.error('Unhandled error', {
    error: errorMessage,
    requestId: req.requestId,
  });
  res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
    },
  });
};
