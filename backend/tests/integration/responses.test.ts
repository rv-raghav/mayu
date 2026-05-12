/**
 * Integration tests for response endpoints.
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

describe('Responses Endpoints', () => {
  beforeEach(async () => {
    await cleanDatabase();
    // Clear dedup keys
    const keys = await redis.keys('dedup:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
    await redis.quit();
  });

  // ─── Submit Response ───────────────────────────────────

  describe('POST /polls/:slug/respond', () => {
    it('should submit to ACTIVE poll → 201', async () => {
      const user = await createTestUser();
      const poll = await createTestPoll(user.id, { status: 'ACTIVE' });
      const question = poll.questions[0]!;
      const option = question.options[0]!;

      const res = await request
        .post(`/polls/${poll.slug}/respond`)
        .send({
          sessionToken: '550e8400-e29b-41d4-a716-446655440000',
          answers: [{ questionId: question.id, optionId: option.id }],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should reject submission to EXPIRED poll → 410', async () => {
      const user = await createTestUser();
      const poll = await createTestPoll(user.id, {
        status: 'EXPIRED',
      });
      const question = poll.questions[0]!;
      const option = question.options[0]!;

      const res = await request
        .post(`/polls/${poll.slug}/respond`)
        .send({
          sessionToken: '550e8400-e29b-41d4-a716-446655440001',
          answers: [{ questionId: question.id, optionId: option.id }],
        });

      expect(res.status).toBe(410);
    });

    it('should reject unauthenticated submission to requiresAuth poll → 401', async () => {
      const user = await createTestUser();
      const poll = await createTestPoll(user.id, {
        status: 'ACTIVE',
        requiresAuth: true,
      });
      const question = poll.questions[0]!;
      const option = question.options[0]!;

      const res = await request
        .post(`/polls/${poll.slug}/respond`)
        .send({
          sessionToken: '550e8400-e29b-41d4-a716-446655440002',
          answers: [{ questionId: question.id, optionId: option.id }],
        });

      expect(res.status).toBe(401);
    });

    it('should reject missing mandatory question answer → 422', async () => {
      const user = await createTestUser();
      const poll = await createTestPoll(user.id, { status: 'ACTIVE' });

      // Submit without answering any questions
      const res = await request
        .post(`/polls/${poll.slug}/respond`)
        .send({
          sessionToken: '550e8400-e29b-41d4-a716-446655440003',
          answers: [],
        });

      expect(res.status).toBe(422);
    });

    it('should reject duplicate submission (same sessionToken) → 409', async () => {
      const user = await createTestUser();
      const poll = await createTestPoll(user.id, { status: 'ACTIVE' });
      const question = poll.questions[0]!;
      const option = question.options[0]!;
      const sessionToken = '550e8400-e29b-41d4-a716-446655440004';

      // First submission
      await request
        .post(`/polls/${poll.slug}/respond`)
        .send({
          sessionToken,
          answers: [{ questionId: question.id, optionId: option.id }],
        });

      // Second submission
      const res = await request
        .post(`/polls/${poll.slug}/respond`)
        .send({
          sessionToken,
          answers: [{ questionId: question.id, optionId: option.id }],
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('ALREADY_RESPONDED');
    });

    it('should reject duplicate submission (same authenticated user) → 409', async () => {
      const creator = await createTestUser({ email: 'creator@example.com' });
      const respondent = await createTestUser({ email: 'respondent@example.com' });
      const poll = await createTestPoll(creator.id, { status: 'ACTIVE' });
      const question = poll.questions[0]!;
      const option = question.options[0]!;
      const token = generateAccessToken(respondent.id, respondent.email, respondent.role);

      // First submission
      await request
        .post(`/polls/${poll.slug}/respond`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          answers: [{ questionId: question.id, optionId: option.id }],
        });

      // Second submission
      const res = await request
        .post(`/polls/${poll.slug}/respond`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          answers: [{ questionId: question.id, optionId: option.id }],
        });

      expect(res.status).toBe(409);
    });

    it('should reject wrong optionId for question → 422', async () => {
      const user = await createTestUser();
      const poll = await createTestPoll(user.id, { status: 'ACTIVE' });
      const question = poll.questions[0]!;

      const res = await request
        .post(`/polls/${poll.slug}/respond`)
        .send({
          sessionToken: '550e8400-e29b-41d4-a716-446655440005',
          answers: [{ questionId: question.id, optionId: 'nonexistent-option' }],
        });

      expect(res.status).toBe(422);
    });
  });
});
