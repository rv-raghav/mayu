/**
 * Analytics service — computes and caches poll analytics.
 * @module modules/analytics/analytics.service
 */

import { prisma } from '@/config/database';
import { redis } from '@/config/redis';
import { AppError } from '@/utils/errors';
import { ErrorCode } from '@/types';
import type { PollAnalytics } from '@/types';
import { computeAnalyticsFromRaw } from '@/utils/analytics';

const ANALYTICS_CACHE_TTL = 30; // seconds

/**
 * Compute analytics for a poll using Prisma groupBy.
 */
export async function computeAnalytics(pollId: string): Promise<PollAnalytics> {
  const [poll, responsesCount, groupedAnswers, rawAnswers] = await Promise.all([
    prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        questions: {
          include: { options: { orderBy: { order: 'asc' } } },
          orderBy: { order: 'asc' },
        },
      },
    }),
    prisma.response.count({ where: { pollId } }),
    prisma.answer.groupBy({
      by: ['questionId', 'optionId'],
      where: { response: { pollId } },
      _count: { optionId: true },
    }),
    prisma.answer.findMany({
      where: { response: { pollId } },
      select: {
        questionId: true,
        textValue: true,
        ratingValue: true,
        rankingValue: true,
      },
    }),
  ]);

  if (!poll) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Poll not found', 404);
  }

  return computeAnalyticsFromRaw(poll, responsesCount, groupedAnswers, rawAnswers);
}

/**
 * Get analytics for a poll, using Redis cache (30s TTL).
 */
export async function getAnalytics(pollId: string): Promise<PollAnalytics> {
  const cacheKey = `poll:analytics:${pollId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached) as PollAnalytics;
  }

  const analytics = await computeAnalytics(pollId);
  await redis.setex(cacheKey, ANALYTICS_CACHE_TTL, JSON.stringify(analytics));
  return analytics;
}

/**
 * Invalidate the analytics cache for a poll.
 */
export async function invalidateAnalyticsCache(pollId: string): Promise<void> {
  await redis.del(`poll:analytics:${pollId}`);
}

/**
 * Get public results for a published poll.
 */
export async function getPublicResults(
  slug: string,
  userId?: string,
): Promise<PollAnalytics> {
  const poll = await prisma.poll.findUnique({ where: { slug } });

  if (!poll) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Poll not found', 404);
  }

  // Only PUBLISHED polls can have public results (unless you're the owner)
  if (poll.status !== 'PUBLISHED' && poll.creatorId !== userId) {
    throw new AppError(ErrorCode.FORBIDDEN, 'Results are not yet published', 403);
  }

  return getAnalytics(poll.id);
}
