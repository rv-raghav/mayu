/**
 * Unit tests for auth.service.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/config/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    emailVerification: {
      create: vi.fn().mockResolvedValue({ id: 'ev-1' }),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    passwordReset: {
      create: vi.fn().mockResolvedValue({ id: 'pr-1' }),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    refreshToken: {
      create: vi.fn().mockResolvedValue({ id: 'rt-1' }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    $transaction: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/config/redis', () => ({
  redis: {
    get: vi.fn().mockResolvedValue(null),
    setex: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
  },
}));

vi.mock('@/config/env', () => ({
  env: {
    JWT_PRIVATE_KEY_PATH: './keys/private.pem',
    JWT_PUBLIC_KEY_PATH: './keys/public.pem',
    JWT_ACCESS_TOKEN_EXPIRY: '15m',
    JWT_REFRESH_TOKEN_EXPIRY_DAYS: 7,
    NODE_ENV: 'test',
    BCRYPT_ROUNDS: 4,
    SMTP_HOST: 'localhost',
    SMTP_PORT: 587,
    SMTP_USER: 'test',
    SMTP_PASS: 'test',
    EMAIL_FROM: 'test@test.com',
    FRONTEND_URL: 'http://localhost:5173',
  },
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test' }),
    }),
  },
}));

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should throw DUPLICATE_EMAIL if user exists', async () => {
      const { prisma } = await import('@/config/database');
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'existing',
        email: 'exists@test.com',
      } as ReturnType<typeof prisma.user.findUnique> extends Promise<infer T> ? T : never);

      const { register } = await import('@/modules/auth/auth.service');

      await expect(
        register({ email: 'exists@test.com', password: 'TestPassword1!', displayName: 'Test' }),
      ).rejects.toThrow('An account with this email already exists');
    });

    it('should create user and verification token on success', async () => {
      const { prisma } = await import('@/config/database');
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.user.create).mockResolvedValueOnce({
        id: 'new-user',
        email: 'new@test.com',
        displayName: 'New',
        emailVerified: false,
      } as ReturnType<typeof prisma.user.create> extends Promise<infer T> ? T : never);

      const { register } = await import('@/modules/auth/auth.service');
      const result = await register({
        email: 'new@test.com',
        password: 'TestPassword1!',
        displayName: 'New',
      });

      expect(result.userId).toBe('new-user');
      expect(result.message).toContain('verify');
      expect(prisma.emailVerification.create).toHaveBeenCalled();
    });
  });
});
