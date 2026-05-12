/**
 * Socket.io server initialization with Redis adapter.
 * @module sockets/socket.server
 */

import { Server as SocketServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { env } from '@/config/env';
import { redis } from '@/config/redis';
import { logger } from '@/utils/logger';
import { registerPollNamespace } from '@/sockets/poll.namespace';
import { registerAnalyticsNamespace } from '@/sockets/analytics.namespace';

/** Exported Socket.io server instance for emitting events from services. */
export let io: SocketServer;

/**
 * Initialize the Socket.io server with Redis adapter, namespaces, and auth guards.
 */
export function initSocketServer(httpServer: unknown): SocketServer {
  io = new SocketServer(httpServer as ConstructorParameters<typeof SocketServer>[0], {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Redis adapter for horizontal scaling (multi-process pub/sub)
  const pubClient = redis.duplicate();
  const subClient = redis.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  registerPollNamespace(io);
  registerAnalyticsNamespace(io);

  logger.info('Socket.io server initialized');

  return io;
}
