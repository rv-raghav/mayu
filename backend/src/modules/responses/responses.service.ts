/**
 * Responses business logic service.
 * Validates submissions, handles deduplication, writes to DB.
 * @module modules/responses/responses.service
 */

import { prisma } from '@/config/database';
import { redis } from '@/config/redis';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/errors';
import { ErrorCode } from '@/types';
import type { ResponsePayload } from '@/types';
import { env } from '@/config/env';
import { parsePagination, buildPaginationMeta } from '@/utils/pagination';
import type { SubmitResponseInput } from '@/modules/responses/responses.schema';

const DEDUP_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

/**
 * Submit a response to a poll.
 * Validates poll status, auth requirements, deduplication, and answer integrity.
 */
export async function submitResponse(
  slug: string,
  input: SubmitResponseInput,
  meta: {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
  },
): Promise<{ status: number; responseId?: string }> {
  // 1. Resolve poll by slug
  const poll = await prisma.poll.findUnique({
    where: { slug },
    include: {
      questions: {
        include: { options: true },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!poll) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Poll not found', 404);
  }

  // 2. Check poll status
  if (poll.status === 'EXPIRED' || (poll.expiresAt && poll.expiresAt < new Date())) {
    throw new AppError(ErrorCode.POLL_EXPIRED, 'This poll has expired', 410);
  }
  if (poll.status === 'DRAFT') {
    throw new AppError(ErrorCode.FORBIDDEN, 'This poll is not yet active', 403);
  }
  if (poll.status === 'PUBLISHED') {
    throw new AppError(ErrorCode.POLL_EXPIRED, 'This poll is no longer accepting responses', 410);
  }

  // 3. Check requiresAuth
  if (poll.requiresAuth && !meta.userId) {
    throw new AppError(ErrorCode.AUTH_REQUIRED, 'Authentication required to respond to this poll', 401);
  }

  // 4. Determine respondent identifier
  const respondentId = meta.userId ?? null;
  const sessionToken = input.sessionToken ?? null;

  if (!respondentId && !sessionToken) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Either authentication or a sessionToken is required',
      422,
    );
  }

  // 5. Deduplication check
  const dedupKey = respondentId
    ? `dedup:${poll.id}:${respondentId}`
    : `dedup:${poll.id}:${sessionToken}`;

  const alreadyResponded = await redis.set(dedupKey, '1', 'EX', DEDUP_TTL_SECONDS, 'NX');
  if (!alreadyResponded) {
    throw new AppError(ErrorCode.ALREADY_RESPONDED, 'You have already responded to this poll', 409);
  }

  // 6. Validate answers
  const questionMap = new Map(poll.questions.map((q) => [q.id, q]));

  for (const answer of input.answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) {
      // Rollback dedup key
      await redis.del(dedupKey);
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `Question ${answer.questionId} does not belong to this poll`,
        422,
      );
    }
    if (question.type === 'MULTIPLE_CHOICE') {
      if (!answer.optionId || !question.options.some((o) => o.id === answer.optionId)) {
        await redis.del(dedupKey);
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          `Option ${answer.optionId ?? ''} does not belong to question ${answer.questionId}`,
          422,
        );
      }
    }

    if (question.type === 'TEXT' && !answer.textValue) {
      await redis.del(dedupKey);
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Text questions require a text answer', 422);
    }

    if (question.type === 'RATING' && !answer.ratingValue) {
      await redis.del(dedupKey);
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Rating questions require a rating from 1 to 5', 422);
    }

    if (question.type === 'RANKING') {
      const validOptionIds = new Set(question.options.map((option) => option.id));
      const ranking = answer.rankingValue ?? [];
      const uniqueRanking = new Set(ranking);

      if (
        ranking.length !== question.options.length ||
        uniqueRanking.size !== ranking.length ||
        ranking.some((optionId) => !validOptionIds.has(optionId))
      ) {
        await redis.del(dedupKey);
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          `Ranking answer does not match options for question ${answer.questionId}`,
          422,
        );
      }
    }
  }

  // Check mandatory questions
  const answeredQuestionIds = new Set(input.answers.map((a) => a.questionId));
  for (const question of poll.questions) {
    if (question.isMandatory && !answeredQuestionIds.has(question.id)) {
      await redis.del(dedupKey);
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `Mandatory question "${question.text}" must be answered`,
        422,
      );
    }
  }

  // 7. Write to DB (sync path — Kafka async path handled elsewhere)
  const payload: ResponsePayload = {
    pollId: poll.id,
    slug: poll.slug,
    respondentId,
    sessionToken,
    ipAddress: meta.ipAddress ?? null,
    userAgent: meta.userAgent ?? null,
    answers: input.answers,
  };

  if (env.KAFKA_ENABLED) {
    try {
      const { produceResponse } = await import('@/config/kafka');
      await produceResponse(payload);
      return { status: 202 };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.warn('Kafka unavailable, falling back to sync write', { error: message });
    }
  }

  // Sync write path
  const responseId = await writeResponseToDb(payload);
  await invalidateAnalyticsCache(poll.id);

  return { status: 201, responseId };
}

/**
 * Write a response payload to the database in a transaction.
 */
export async function writeResponseToDb(payload: ResponsePayload): Promise<string> {
  const response = await prisma.response.create({
    data: {
      pollId: payload.pollId,
      respondentId: payload.respondentId,
      sessionToken: payload.sessionToken,
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
      answers: {
        create: payload.answers.map((a) => ({
          questionId: a.questionId,
          optionId: a.optionId ?? null,
          textValue: a.textValue ?? null,
          ratingValue: a.ratingValue ?? null,
          rankingValue: a.rankingValue ?? undefined,
        })),
      },
    },
  });

  logger.info('Response submitted', { responseId: response.id, pollId: payload.pollId });
  return response.id;
}

/**
 * Invalidate the Redis analytics cache for a poll.
 */
export async function invalidateAnalyticsCache(pollId: string): Promise<void> {
  await redis.del(`poll:analytics:${pollId}`);
}

/**
 * List responses for a poll (creator only, for non-anonymous polls).
 */
export async function listResponses(
  pollId: string,
  page?: number,
  limit?: number,
): Promise<{
  responses: unknown[];
  meta: ReturnType<typeof buildPaginationMeta>;
}> {
  const pagination = parsePagination(page, limit);

  const [responses, total] = await Promise.all([
    prisma.response.findMany({
      where: { pollId },
      orderBy: { submittedAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
      include: {
        answers: {
          include: {
            question: { select: { text: true } },
            option: { select: { text: true } },
          },
        },
        respondent: {
          select: { id: true, displayName: true, email: true },
        },
      },
    }),
    prisma.response.count({ where: { pollId } }),
  ]);

  return { responses, meta: buildPaginationMeta(total, pagination) };
}
