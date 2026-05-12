/**
 * Redis-backed rate limiter factory.
 * @module middleware/rateLimiter
 */

import { RequestHandler } from 'express';
import { redis } from '@/config/redis';
import { AppError } from '@/utils/errors';
import { ErrorCode } from '@/types';
import { logger } from '@/utils/logger';

interface RateLimiterOptions {
  /** Maximum number of requests allowed in the window. */
  max: number;
  /** Window duration in milliseconds. */
  windowMs: number;
  /** Optional prefix for the Redis key (defaults to 'rate'). */
  prefix?: string;
}

/**
 * Creates a Redis-backed rate limiter middleware.
 * Tracks requests per IP per endpoint using Redis INCR + PEXPIRE.
 */
export function rateLimiter(options: RateLimiterOptions): RequestHandler {
  const { max, windowMs, prefix = 'rate' } = options;

  return async (req, res, next) => {
    const ip = req.ip ?? 'unknown';
    const key = `${prefix}:${ip}:${req.path}`;

    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.pexpire(key, windowMs);
      }

      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - current)));

      if (current > max) {
        logger.warn('Rate limit hit', { ip, endpoint: req.path });
        return next(
          new AppError(ErrorCode.RATE_LIMITED, 'Too many requests, please try again later', 429),
        );
      }

      next();
    } catch (err) {
      // If Redis is down, allow the request through
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Rate limiter Redis error, allowing request', { error: message });
      next();
    }
  };
}
