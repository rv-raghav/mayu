/**
 * Integration tests for auth endpoints.
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import supertest from 'supertest';
import { createApp } from '@/app';
import { cleanDatabase } from '../helpers/testDb';
import { createTestUser, generateAccessToken } from '../helpers/factories';
import { prisma } from '@/config/database';
import { redis } from '@/config/redis';

const app = createApp();
const request = supertest(app);

describe('Auth Endpoints', () => {
  beforeEach(async () => {
    await cleanDatabase();
    // Clear rate limit keys
    const keys = await redis.keys('rate:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
    await redis.quit();
  });

  // ─── Register ──────────────────────────────────────────

  describe('POST /auth/register', () => {
    it('should register a new user → 201', async () => {
      const res = await request.post('/auth/register').send({
        email: 'newuser@example.com',
        password: 'TestPassword1!',
        displayName: 'New User',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBeDefined();
      expect(res.body.data.message).toContain('sign in');

      // User should exist in DB
      const user = await prisma.user.findUnique({ where: { email: 'newuser@example.com' } });
      expect(user).not.toBeNull();
      expect(user!.emailVerified).toBe(true);
    });

    it('should reject duplicate email → 409', async () => {
      await createTestUser({ email: 'dupe@example.com' });

      const res = await request.post('/auth/register').send({
        email: 'dupe@example.com',
        password: 'TestPassword1!',
        displayName: 'Dupe',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DUPLICATE_EMAIL');
    });

    it('should reject weak password → 422', async () => {
      const res = await request.post('/auth/register').send({
        email: 'weak@example.com',
        password: 'weak',
        displayName: 'Weak',
      });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ─── Login ─────────────────────────────────────────────

  describe('POST /auth/login', () => {
    it('should reject login before email verified → 403', async () => {
      await createTestUser({ email: 'unverified@example.com', emailVerified: false });

      const res = await request.post('/auth/login').send({
        email: 'unverified@example.com',
        password: 'TestPassword1!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe('unverified@example.com');
    });

    it('should login with correct credentials → 200 + tokens', async () => {
      await createTestUser({ email: 'valid@example.com', emailVerified: true });

      const res = await request.post('/auth/login').send({
        email: 'valid@example.com',
        password: 'TestPassword1!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe('valid@example.com');
      // Check httpOnly cookie set
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : String(cookies);
      expect(cookieStr).toContain('mayu_rt');
      expect(cookieStr).toContain('HttpOnly');
    });

    it('should reject wrong password → 401', async () => {
      await createTestUser({ email: 'wrong@example.com', emailVerified: true });

      const res = await request.post('/auth/login').send({
        email: 'wrong@example.com',
        password: 'WrongPassword1!',
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should rate limit after 6 attempts → 429', async () => {
      await createTestUser({ email: 'ratelimit@example.com', emailVerified: true });

      for (let i = 0; i < 5; i++) {
        await request.post('/auth/login').send({
          email: 'ratelimit@example.com',
          password: 'WrongPassword1!',
        });
      }

      const res = await request.post('/auth/login').send({
        email: 'ratelimit@example.com',
        password: 'WrongPassword1!',
      });

      expect(res.status).toBe(429);
      expect(res.body.error.code).toBe('RATE_LIMITED');
    });
  });

  // ─── Refresh ───────────────────────────────────────────

  describe('POST /auth/refresh', () => {
    it('should refresh with valid cookie → 200 + new tokens', async () => {
      const user = await createTestUser({ email: 'refresh@example.com', emailVerified: true });

      // Login to get the cookie
      const loginRes = await request.post('/auth/login').send({
        email: 'refresh@example.com',
        password: 'TestPassword1!',
      });

      const cookies = loginRes.headers['set-cookie'];
      const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : String(cookies ?? '');

      const res = await request
        .post('/auth/refresh')
        .set('Cookie', cookieStr);

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should return 401 without cookie', async () => {
      const res = await request.post('/auth/refresh');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_REQUIRED');
    });
  });

  // ─── Logout ────────────────────────────────────────────

  describe('POST /auth/logout', () => {
    it('should logout and clear cookie', async () => {
      const user = await createTestUser({ email: 'logout@example.com', emailVerified: true });
      const token = generateAccessToken(user.id, user.email, user.role);

      const loginRes = await request.post('/auth/login').send({
        email: 'logout@example.com',
        password: 'TestPassword1!',
      });

      const cookies = loginRes.headers['set-cookie'];
      const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : String(cookies ?? '');

      const res = await request
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .set('Cookie', cookieStr);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain('Logged out');
    });
  });

  // ─── Get Profile ───────────────────────────────────────

  describe('GET /auth/me', () => {
    it('should return profile for authenticated user', async () => {
      const user = await createTestUser({ email: 'me@example.com', emailVerified: true });
      const token = generateAccessToken(user.id, user.email, user.role);

      const res = await request
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('me@example.com');
      expect(res.body.data.displayName).toBe('Test User');
    });

    it('should return 401 without token', async () => {
      const res = await request.get('/auth/me');
      expect(res.status).toBe(401);
    });
  });

  // ─── Email Verification ────────────────────────────────

  describe('POST /auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      const user = await createTestUser({ email: 'verify@example.com', emailVerified: false });

      // Create verification token directly
      const verificationToken = 'test-verify-token-123';
      await prisma.emailVerification.create({
        data: {
          email: user.email,
          token: verificationToken,
          expiresAt: new Date(Date.now() + 86400000),
        },
      });

      const res = await request.post('/auth/verify-email').send({
        token: verificationToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain('verified');

      // Check user is now verified
      const updated = await prisma.user.findUnique({ where: { email: 'verify@example.com' } });
      expect(updated!.emailVerified).toBe(true);
    });

    it('should reject invalid token', async () => {
      const res = await request.post('/auth/verify-email').send({
        token: 'invalid-token',
      });

      expect(res.status).toBe(400);
    });
  });
});
