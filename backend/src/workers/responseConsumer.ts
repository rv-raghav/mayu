/**
 * Kafka consumer for response submissions.
 * Reads from `mayu.response.submitted`, writes to DB, invalidates cache, emits socket events.
 * @module workers/responseConsumer
 */

import { kafka } from '@/config/kafka';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';
import { writeResponseToDb, invalidateAnalyticsCache } from '@/modules/responses/responses.service';
import { getAnalytics } from '@/modules/analytics/analytics.service';
import { io } from '@/sockets/socket.server';
import { prisma } from '@/config/database';
import type { ResponsePayload } from '@/types';

/**
 * Start the Kafka consumer that processes response submissions.
 */
export async function startResponseConsumer(): Promise<void> {
  const consumer = kafka.consumer({ groupId: env.KAFKA_CONSUMER_GROUP });
  await consumer.connect();
  await consumer.subscribe({ topic: 'mayu.response.submitted', fromBeginning: false });

  await consumer.run({
    eachBatchAutoResolve: true,
    autoCommitInterval: 500,
    autoCommitThreshold: 100,
    eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
      for (const message of batch.messages) {
        if (!message.value) continue;

        try {
          const payload: ResponsePayload = JSON.parse(message.value.toString());

          // Write to database
          await writeResponseToDb(payload);

          // Invalidate analytics cache
          await invalidateAnalyticsCache(payload.pollId);

          // Emit socket events
          await emitSocketUpdate(payload.pollId, payload.slug);

          resolveOffset(message.offset);
          await heartbeat();
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          logger.error('Failed to process response from Kafka', {
            error: errorMessage,
            offset: message.offset,
          });
        }
      }
    },
  });

  logger.info('Kafka response consumer started');
}

/**
 * Emit analytics update and response count via Socket.io after a new response.
 */
async function emitSocketUpdate(pollId: string, slug: string): Promise<void> {
  try {
    const [analytics, total] = await Promise.all([
      getAnalytics(pollId),
      prisma.response.count({ where: { pollId } }),
    ]);

    if (io) {
      io.of('/analytics').to(`analytics:${pollId}`).emit('analytics:update', analytics);
      io.of('/analytics').to(`analytics:${pollId}`).emit('response:count', { pollId, total });
      io.of('/polls').to(`poll:${slug}`).emit('poll:status', { pollId, status: 'ACTIVE' });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Failed to emit socket update', { error: errorMessage, pollId });
  }
}
