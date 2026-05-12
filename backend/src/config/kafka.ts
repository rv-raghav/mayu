/**
 * Kafka producer/consumer configuration and helpers.
 * @module config/kafka
 */

import { Kafka, Producer } from 'kafkajs';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';
import type { ResponsePayload } from '@/types';

/** KafkaJS client instance. */
export const kafka = new Kafka({
  clientId: env.KAFKA_CLIENT_ID,
  brokers: env.KAFKA_BROKERS,
  retry: { retries: 5, initialRetryTime: 300 },
});

/** KafkaJS producer instance with idempotent writes. */
export const producer: Producer = kafka.producer({
  allowAutoTopicCreation: false,
  idempotent: true,
  transactionTimeout: 30000,
});

let producerConnected = false;

/**
 * Connect the Kafka producer (called on startup when KAFKA_ENABLED).
 */
export async function connectProducer(): Promise<void> {
  if (producerConnected) return;
  await producer.connect();
  producerConnected = true;
  logger.info('Kafka producer connected');
}

/**
 * Disconnect the Kafka producer (called on graceful shutdown).
 */
export async function disconnectProducer(): Promise<void> {
  if (!producerConnected) return;
  await producer.disconnect();
  producerConnected = false;
  logger.info('Kafka producer disconnected');
}

/**
 * Produce a response submission event to Kafka.
 */
export async function produceResponse(payload: ResponsePayload): Promise<void> {
  if (!producerConnected) {
    await connectProducer();
  }

  await producer.send({
    topic: 'mayu.response.submitted',
    messages: [
      {
        key: payload.pollId,
        value: JSON.stringify(payload),
      },
    ],
  });

  logger.debug('Response produced to Kafka', { pollId: payload.pollId });
}

/**
 * Create Kafka topics on startup (if they don't exist).
 */
export async function createTopics(): Promise<void> {
  const admin = kafka.admin();
  await admin.connect();

  const topics = [
    { topic: 'mayu.response.submitted', numPartitions: 12, replicationFactor: 1 },
    { topic: 'mayu.analytics.invalidate', numPartitions: 4, replicationFactor: 1 },
    { topic: 'mayu.poll.status.changed', numPartitions: 4, replicationFactor: 1 },
  ];

  await admin.createTopics({ topics });
  await admin.disconnect();

  logger.info('Kafka topics created/verified');
}
