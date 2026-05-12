/**
 * Zod request validation middleware factory.
 * @module middleware/validate
 */

import { RequestHandler } from 'express';
import { z } from 'zod';
import { AppError } from '@/utils/errors';
import { ErrorCode } from '@/types';

type Target = 'body' | 'query' | 'params';

/**
 * Creates middleware that validates `req[target]` against a Zod schema.
 * On success, replaces `req[target]` with the parsed (coerced) value.
 * On failure, throws a 422 AppError with field-level details.
 */
export function validate(schema: z.ZodType, target: Target = 'body'): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      return next(
        new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Validation failed',
          422,
          result.error.format(),
        ),
      );
    }
    // Replace with parsed data (coerced types, stripped unknown keys)
    // In Express 5, req.query and req.params are getters and cannot be reassigned.
    // We mutate the existing object instead.
    const targetObj = req[target] as any;
    if (target === 'body') {
      req.body = result.data;
    } else {
      Object.keys(targetObj).forEach((key) => delete targetObj[key]);
      Object.assign(targetObj, result.data);
    }
    next();
  };
}
