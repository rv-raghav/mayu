/**
 * Integration tests for poll endpoints.
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

describe('Polls Endpoints', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
    await redis.quit();
  });

  // ─── Create Poll ───────────────────────────────────────

  describe('POST /polls', () => {
    it('should create a poll → 201 + slug set', async () => {
      const user = await createTestUser();
      const token = generateAccessToken(user.id, user.email, user.role);

      const res = await request
        .post('/polls')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'My Test Poll',
          questions: [
            {
              text: 'What is your favourite?',
              options: [{ text: 'A' }, { text: 'B' }],
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBeDefined();
      expect(res.body.data.title).toBe('My Test Poll');
      expect(res.body.data.questions).toHaveLength(1);
      expect(res.body.data.questions[0].options).toHaveLength(2);
    });

    it('should reject unauthenticated → 401', async () => {
      const res = await request.post('/polls').send({
        title: 'No auth',
        questions: [{ text: 'Q?', options: [{ text: 'A' }, { text: 'B' }] }],
      });

      expect(res.status).toBe(401);
    });

    it('should reject missing questions → 422', async () => {
      const user = await createTestUser();
      const token = generateAccessToken(user.id, user.email, user.role);

      const res = await request
        .post('/polls')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Empty', questions: [] });

      expect(res.status).toBe(422);
    });
  });

  // ─── Get Poll ──────────────────────────────────────────

  describe('GET /polls/:slug', () => {
    it('should get active poll without auth → 200', async () => {
      const user = await createTestUser();
      const poll = await createTestPoll(user.id, { status: 'ACTIVE' });

      const res = await request.get(`/polls/${poll.slug}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Test Poll');
    });

    it('should return 404 for DRAFT poll when unauthenticated', async () => {
      const user = await createTestUser();
      const poll = await createTestPoll(user.id, { status: 'DRAFT' });

      const res = await request.get(`/polls/${poll.slug}`);

      expect(res.status).toBe(404);
    });
  });

  // ─── Status Transitions ────────────────────────────────

  describe('POST /polls/:slug/activate', () => {
    it('should activate a DRAFT poll → 200', async () => {
      const user = await createTestUser();
      const poll = await createTestPoll(user.id, { status: 'DRAFT' });
      const token = generateAccessToken(user.id, user.email, user.role);

      const res = await request
        .post(`/polls/${poll.slug}/activate`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ACTIVE');
    });

    it('should reject non-owner → 403', async () => {
      const owner = await createTestUser({ email: 'owner@example.com' });
      const other = await createTestUser({ email: 'other@example.com' });
      const poll = await createTestPoll(owner.id, { status: 'DRAFT' });
      const token = generateAccessToken(other.id, other.email, other.role);

      const res = await request
        .post(`/polls/${poll.slug}/activate`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /polls/:slug/publish', () => {
    it('should reject publishing with 0 responses → 400', async () => {
      const user = await createTestUser();
      const poll = await createTestPoll(user.id, { status: 'ACTIVE' });
      const token = generateAccessToken(user.id, user.email, user.role);

      const res = await request
        .post(`/polls/${poll.slug}/publish`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });

  // ─── Delete Poll ───────────────────────────────────────

  describe('DELETE /polls/:slug', () => {
    it('should delete own poll → 204', async () => {
      const user = await createTestUser();
      const poll = await createTestPoll(user.id);
      const token = generateAccessToken(user.id, user.email, user.role);

      const res = await request
        .delete(`/polls/${poll.slug}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);
    });
  });
});
