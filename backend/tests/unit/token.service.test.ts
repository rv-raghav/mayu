/**
 * Unit tests for token.service.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import fs from 'fs';

// We need to mock Redis and Prisma before importing the service
vi.mock('@/config/redis', () => ({
  redis: {
    get: vi.fn().mockResolvedValue(null),
    setex: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
  },
}));

vi.mock('@/config/database', () => ({
  prisma: {
    refreshToken: {
      create: vi.fn().mockResolvedValue({ id: 'rt-1' }),
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  },
}));

vi.mock('@/config/env', () => ({
  env: {
    JWT_PRIVATE_KEY_PATH: './keys/private.pem',
    JWT_PUBLIC_KEY_PATH: './keys/public.pem',
    JWT_ACCESS_TOKEN_EXPIRY: '15m',
    JWT_REFRESH_TOKEN_EXPIRY_DAYS: 7,
    NODE_ENV: 'test',
  },
}));

describe('token.service', () => {
  let issueAccessToken: typeof import('@/modules/auth/token.service').issueAccessToken;
  let verifyAccessToken: typeof import('@/modules/auth/token.service').verifyAccessToken;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Dynamic import to ensure mocks are in place
    const mod = await import('@/modules/auth/token.service');
    issueAccessToken = mod.issueAccessToken;
    verifyAccessToken = mod.verifyAccessToken;
  });

  describe('issueAccessToken', () => {
    it('should return a valid JWT string', () => {
      const token = issueAccessToken({ id: 'user-1', email: 'test@example.com', role: 'USER' });
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should contain correct claims', () => {
      const token = issueAccessToken({ id: 'user-1', email: 'test@example.com', role: 'USER' });
      const publicKey = fs.readFileSync('./keys/public.pem');
      const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as Record<string, unknown>;
      expect(decoded['sub']).toBe('user-1');
      expect(decoded['email']).toBe('test@example.com');
      expect(decoded['role']).toBe('USER');
      expect(decoded['jti']).toBeDefined();
    });

    it('should use RS256 algorithm', () => {
      const token = issueAccessToken({ id: 'user-1', email: 'test@example.com', role: 'USER' });
      const [headerB64] = token.split('.');
      const header = JSON.parse(Buffer.from(headerB64!, 'base64url').toString()) as { alg: string };
      expect(header.alg).toBe('RS256');
    });
  });

  describe('verifyAccessToken', () => {
    it('should return payload for a valid token', async () => {
      const token = issueAccessToken({ id: 'user-1', email: 'test@example.com', role: 'USER' });
      const payload = await verifyAccessToken(token);
      expect(payload).not.toBeNull();
      expect(payload!.sub).toBe('user-1');
      expect(payload!.email).toBe('test@example.com');
    });

    it('should return null for an invalid token', async () => {
      const payload = await verifyAccessToken('invalid.token.here');
      expect(payload).toBeNull();
    });

    it('should return null for an expired token', async () => {
      const privateKey = fs.readFileSync('./keys/private.pem');
      const token = jwt.sign(
        { sub: 'user-1', email: 'test@example.com', role: 'USER', jti: crypto.randomUUID() },
        privateKey,
        { algorithm: 'RS256', expiresIn: '0s' },
      );
      // Wait a tiny bit for expiry
      await new Promise((r) => setTimeout(r, 100));
      const payload = await verifyAccessToken(token);
      expect(payload).toBeNull();
    });

    it('should return null for a blacklisted token', async () => {
      const { redis } = await import('@/config/redis');
      vi.mocked(redis.get).mockResolvedValueOnce('1');

      const token = issueAccessToken({ id: 'user-1', email: 'test@example.com', role: 'USER' });
      const payload = await verifyAccessToken(token);
      expect(payload).toBeNull();
    });
  });
});
