/**
 * ioredis client singleton.
 * @module config/redis
 */

import Redis from 'ioredis';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

/** Singleton Redis client instance. */
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: false,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 5000);
    return delay;
  },
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err) => {
  logger.error('Redis connection error', { error: err.message });
});
