/**
 * /analytics namespace — JWT-authenticated, owner-only analytics events.
 * @module sockets/analytics.namespace
 */

import { Server as SocketServer } from 'socket.io';
import { verifyAccessToken } from '@/modules/auth/token.service';
import { logger } from '@/utils/logger';
import type { TokenPayload } from '@/types';

/**
 * Register the /analytics namespace with JWT authentication guard.
 */
export function registerAnalyticsNamespace(io: SocketServer): void {
  const analyticsNs = io.of('/analytics');

  // JWT authentication middleware
  analyticsNs.use(async (socket, next) => {
    const token = socket.handshake.auth['token'] as string | undefined;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const payload = await verifyAccessToken(token);
    if (!payload) {
      return next(new Error('Invalid or expired token'));
    }

    (socket.data as { user: TokenPayload }).user = payload;
    next();
  });

  analyticsNs.on('connection', (socket) => {
    const user = (socket.data as { user: TokenPayload }).user;
    logger.debug('Client connected to /analytics namespace', {
      socketId: socket.id,
      userId: user.sub,
    });

    socket.on('join', (data: { pollId?: string }) => {
      if (data.pollId) {
        void socket.join(`analytics:${data.pollId}`);
        logger.debug('Client joined analytics room', {
          socketId: socket.id,
          pollId: data.pollId,
        });
      }
    });

    socket.on('leave', (data: { pollId?: string }) => {
      if (data.pollId) {
        void socket.leave(`analytics:${data.pollId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.debug('Client disconnected from /analytics namespace', {
        socketId: socket.id,
      });
    });
  });
}
