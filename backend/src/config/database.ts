/**
 * Prisma client singleton.
 * @module config/database
 */

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

const pool = new Pool({ connectionString: env.DATABASE_URL });
const adapter = new PrismaPg(pool);

/** Singleton Prisma client instance for database access. */
export const prisma = new PrismaClient({
  adapter,
  log: [
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

prisma.$on('error', (e) => {
  logger.error('Prisma error', { message: e.message });
});

prisma.$on('warn', (e) => {
  logger.warn('Prisma warning', { message: e.message });
});
