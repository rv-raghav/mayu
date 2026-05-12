/**
 * Test factory functions for creating test data.
 * @module tests/helpers/factories
 */

import bcrypt from 'bcrypt';
import { prisma } from '@/config/database';
import { issueAccessToken } from '@/modules/auth/token.service';
import { env } from '@/config/env';
import type { User, Poll, Question, Option } from '@prisma/client';

type PollWithQuestions = Poll & {
  questions: (Question & { options: Option[] })[];
};

interface CreateTestUserOptions {
  email?: string;
  displayName?: string;
  emailVerified?: boolean;
  password?: string;
  googleId?: string;
  role?: 'USER' | 'ADMIN';
}

/**
 * Create a test user with sensible defaults.
 */
export async function createTestUser(overrides: CreateTestUserOptions = {}): Promise<User> {
  const passwordHash = await bcrypt.hash(overrides.password ?? 'TestPassword1!', env.BCRYPT_ROUNDS);
  return prisma.user.create({
    data: {
      email: overrides.email ?? `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      displayName: overrides.displayName ?? 'Test User',
      emailVerified: overrides.emailVerified ?? true,
      passwordHash,
      googleId: overrides.googleId,
      role: overrides.role ?? 'USER',
    },
  });
}

/**
 * Generate an access token for the given user.
 */
export function generateAccessToken(userId: string, email = 'test@example.com', role = 'USER'): string {
  return issueAccessToken({ id: userId, email, role });
}

/**
 * Create a test poll with one question and two options.
 */
export async function createTestPoll(
  creatorId: string,
  overrides: Partial<{
    title: string;
    slug: string;
    status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'PUBLISHED';
    requiresAuth: boolean;
    isAnonymous: boolean;
    expiresAt: Date | null;
  }> = {},
): Promise<PollWithQuestions> {
  return prisma.poll.create({
    data: {
      title: overrides.title ?? 'Test Poll',
      slug: overrides.slug ?? `test-poll-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      creatorId,
      status: overrides.status ?? 'ACTIVE',
      requiresAuth: overrides.requiresAuth ?? false,
      isAnonymous: overrides.isAnonymous ?? true,
      expiresAt: overrides.expiresAt ?? null,
      questions: {
        create: [
          {
            text: 'Favourite colour?',
            order: 1,
            isMandatory: true,
            options: {
              create: [
                { text: 'Red', order: 1 },
                { text: 'Blue', order: 2 },
              ],
            },
          },
        ],
      },
    },
    include: {
      questions: {
        include: { options: { orderBy: { order: 'asc' } } },
        orderBy: { order: 'asc' },
      },
    },
  });
}
