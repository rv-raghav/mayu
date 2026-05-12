/**
 * HTTP server entry point.
 * Starts the Express app, Socket.io, optional Kafka consumer, and poll expiry cron.
 * @module server
 */

import http from 'http';
import { env } from '@/config/env';
import { createApp } from '@/app';
import { logger } from '@/utils/logger';
import { prisma } from '@/config/database';
import { redis } from '@/config/redis';
import { initSocketServer } from '@/sockets/socket.server';
import { expirePolls } from '@/modules/polls/polls.service';

const app = createApp();
const server = http.createServer(app);

// ─── Socket.io ───────────────────────────────────────────
initSocketServer(server);

// ─── Poll Expiry Cron ────────────────────────────────────
let expiryInterval: ReturnType<typeof setInterval> | undefined;

// ─── Kafka Consumer (conditional) ────────────────────────
async function startKafkaIfEnabled(): Promise<void> {
  if (env.KAFKA_ENABLED) {
    const { startResponseConsumer } = await import('@/workers/responseConsumer');
    await startResponseConsumer();
    logger.info('Kafka response consumer started');
  }
}

// ─── Start Server ────────────────────────────────────────
server.listen(env.PORT, () => {
  logger.info(`MaYu API server listening on port ${String(env.PORT)}`, {
    env: env.NODE_ENV,
  });

  // Start poll expiry check every 60s
  expiryInterval = setInterval(() => {
    expirePolls().catch((err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Poll expiry cron failed', { error: message });
    });
  }, 60_000);

  // Start Kafka consumer if enabled
  startKafkaIfEnabled().catch((err: unknown) => {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Failed to start Kafka consumer', { error: message });
  });
});

// ─── Graceful Shutdown ───────────────────────────────────
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully…`);

  if (expiryInterval) {
    clearInterval(expiryInterval);
  }

  server.close(() => {
    logger.info('HTTP server closed');
  });

  await prisma.$disconnect();
  logger.info('Prisma disconnected');

  await redis.quit();
  logger.info('Redis disconnected');

  process.exit(0);
}

process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
process.on('SIGINT', () => { void shutdown('SIGINT'); });

process.on('unhandledRejection', (reason) => {
  const message = reason instanceof Error ? reason.message : 'Unknown reason';
  logger.error('Unhandled rejection', { error: message });
});
