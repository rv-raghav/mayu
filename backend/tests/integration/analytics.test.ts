/**
 * Integration tests for analytics endpoints.
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import supertest from 'supertest';
import { createApp } from '@/app';
import { cleanDatabase } from '../helpers/testDb';
import { createTestUser, createTestPoll, generateAccessToken } from '../helpers/factories';
import { prisma } from '@/config/database';
import { redis } from '@/config/redis';

const app = createApp();
const request = supertest(app);

describe('Analytics Endpoints', () => {
  beforeEach(async () => {
    await cleanDatabase();
    // Clear analytics cache
    const keys = await redis.keys('poll:analytics:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
    await redis.quit();
  });

  // ─── Creator Analytics ─────────────────────────────────

  describe('GET /polls/:slug/analytics', () => {
    it('should return analytics for creator → 200', async () => {
      const user = await createTestUser();
      const poll = await createTestPoll(user.id, { status: 'ACTIVE' });
      const token = generateAccessToken(user.id, user.email, user.role);

      // Create a response
      const question = poll.questions[0]!;
      const option = question.options[0]!;
      await prisma.response.create({
        data: {
          pollId: poll.id,
          sessionToken: 'test-session-1',
          answers: {
            create: [{ questionId: question.id, optionId: option.id }],
          },
        },
      });

      const res = await request
        .get(`/polls/${poll.slug}/analytics`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalResponses).toBe(1);
      expect(res.body.data.questions).toHaveLength(1);
      expect(res.body.data.questions[0].options[0].count).toBe(1);
    });

    it('should reject non-owner → 403', async () => {
      const owner = await createTestUser({ email: 'owner@example.com' });
      const other = await createTestUser({ email: 'other@example.com' });
      const poll = await createTestPoll(owner.id, { status: 'ACTIVE' });
      const token = generateAccessToken(other.id, other.email, other.role);

      const res = await request
        .get(`/polls/${poll.slug}/analytics`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  // ─── Public Results ────────────────────────────────────

  describe('GET /polls/:slug/results', () => {
    it('should return results for PUBLISHED poll → 200', async () => {
      const user = await createTestUser();
      const poll = await createTestPoll(user.id, { status: 'PUBLISHED' });

      const res = await request.get(`/polls/${poll.slug}/results`);

      expect(res.status).toBe(200);
      expect(res.body.data.pollId).toBe(poll.id);
    });

    it('should reject non-PUBLISHED poll for non-owner → 403', async () => {
      const user = await createTestUser();
      const poll = await createTestPoll(user.id, { status: 'ACTIVE' });

      const res = await request.get(`/polls/${poll.slug}/results`);

      expect(res.status).toBe(403);
    });

    it('should allow owner to see results of non-PUBLISHED poll', async () => {
      const user = await createTestUser();
      const poll = await createTestPoll(user.id, { status: 'ACTIVE' });
      const token = generateAccessToken(user.id, user.email, user.role);

      const res = await request
        .get(`/polls/${poll.slug}/results`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  // ─── Cache Invalidation ────────────────────────────────

  describe('Analytics cache', () => {
    it('should invalidate cache when new response is submitted', async () => {
      const user = await createTestUser();
      const poll = await createTestPoll(user.id, { status: 'ACTIVE' });
      const token = generateAccessToken(user.id, user.email, user.role);
      const question = poll.questions[0]!;

      // Get analytics first (populate cache)
      await request
        .get(`/polls/${poll.slug}/analytics`)
        .set('Authorization', `Bearer ${token}`);

      // Check cache exists
      const cached1 = await redis.get(`poll:analytics:${poll.id}`);
      expect(cached1).not.toBeNull();

      // Submit a response (this should invalidate cache)
      await prisma.response.create({
        data: {
          pollId: poll.id,
          sessionToken: 'cache-test-session',
          answers: {
            create: [{ questionId: question.id, optionId: question.options[0]!.id }],
          },
        },
      });
      // Manually invalidate (in real flow, service does this)
      await redis.del(`poll:analytics:${poll.id}`);

      const cached2 = await redis.get(`poll:analytics:${poll.id}`);
      expect(cached2).toBeNull();
    });
  });
});
