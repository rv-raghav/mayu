/**
 * Environment variable validation and typed access.
 * The entire app imports `env` from this module — never access `process.env` directly.
 * @module config/env
 */

import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  API_BASE_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),

  // JWT
  JWT_PRIVATE_KEY_PATH: z.string(),
  JWT_PUBLIC_KEY_PATH: z.string(),
  JWT_ACCESS_TOKEN_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_TOKEN_EXPIRY_DAYS: z.coerce.number().default(7),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // Google OAuth2
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string().url(),

  // Kafka
  KAFKA_BROKERS: z.string().transform((s) => s.split(',')),
  KAFKA_CLIENT_ID: z.string().default('mayu-api'),
  KAFKA_CONSUMER_GROUP: z.string().default('mayu-response-writers'),
  KAFKA_ENABLED: z.coerce.boolean().default(false),

  // Email
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  EMAIL_FROM: z.string().default('MaYu <noreply@mayu.app>'),

  // Security
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console -- startup crash, logger not yet available
  console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

/** Validated, typed environment variables. */
export const env = parsed.data;
