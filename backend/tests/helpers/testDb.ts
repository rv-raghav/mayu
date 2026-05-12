/**
 * Test database helpers — cleanup between tests.
 * @module tests/helpers/testDb
 */

import { prisma } from '@/config/database';

/**
 * Delete all data from all tables in FK-safe order.
 * Call in beforeEach or afterEach to ensure test isolation.
 */
export async function cleanDatabase(): Promise<void> {
  await prisma.$transaction([
    prisma.answer.deleteMany(),
    prisma.response.deleteMany(),
    prisma.option.deleteMany(),
    prisma.question.deleteMany(),
    prisma.poll.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.emailVerification.deleteMany(),
    prisma.passwordReset.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}
