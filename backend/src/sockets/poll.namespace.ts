/**
 * /polls namespace — public, no authentication required.
 * Clients join poll rooms by slug to receive status updates.
 * @module sockets/poll.namespace
 */

import { Server as SocketServer } from 'socket.io';
import { logger } from '@/utils/logger';

/**
 * Register the /polls namespace for public poll status events.
 */
export function registerPollNamespace(io: SocketServer): void {
  const pollsNs = io.of('/polls');

  pollsNs.on('connection', (socket) => {
    logger.debug('Client connected to /polls namespace', { socketId: socket.id });

    socket.on('join', (data: { slug?: string }) => {
      if (data.slug) {
        void socket.join(`poll:${data.slug}`);
        logger.debug('Client joined poll room', { socketId: socket.id, slug: data.slug });
      }
    });

    socket.on('disconnect', () => {
      logger.debug('Client disconnected from /polls namespace', { socketId: socket.id });
    });
  });
}
