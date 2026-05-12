/**
 * Polls business logic service.
 * CRUD operations, status transitions, expiry cron.
 * @module modules/polls/polls.service
 */

import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/errors';
import { ErrorCode } from '@/types';
import { generateSlug } from '@/utils/slugify';
import { parsePagination, buildPaginationMeta } from '@/utils/pagination';
import type { CreatePollInput, UpdatePollInput } from '@/modules/polls/polls.schema';
import type { Poll, Question, Option } from '@prisma/client';

type PollWithQuestions = Poll & {
  questions: (Question & { options: Option[] })[];
};

/**
 * Asserts that the user is the owner of the poll.
 * Returns the poll if ownership check passes.
 */
export async function assertPollOwner(slug: string, userId: string): Promise<Poll> {
  const poll = await prisma.poll.findUnique({ where: { slug } });
  if (!poll) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Poll not found', 404);
  }
  if (poll.creatorId !== userId) {
    throw new AppError(ErrorCode.FORBIDDEN, 'Forbidden', 403);
  }
  return poll;
}

/**
 * Create a new poll with nested questions and options in a single transaction.
 */
export async function createPoll(
  creatorId: string,
  input: CreatePollInput,
): Promise<PollWithQuestions> {
  const slug = generateSlug(input.title);

  const poll = await prisma.poll.create({
    data: {
      slug,
      creatorId,
      title: input.title,
      description: input.description ?? null,
      isAnonymous: input.isAnonymous,
      requiresAuth: input.requiresAuth,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      questions: {
        create: input.questions.map((q, qIdx) => ({
          text: q.text,
          type: q.type,
          isMandatory: q.isMandatory,
          order: qIdx + 1,
          options: {
            create: q.options.map((o, oIdx) => ({
              text: o.text,
              order: oIdx + 1,
            })),
          },
        })),
      },
    },
    include: {
      questions: {
        include: { options: { orderBy: { order: 'asc' } } },
        orderBy: { order: 'asc' },
      },
    },
  });

  logger.info('Poll created', { pollId: poll.id, slug: poll.slug });
  return poll;
}

/**
 * List the creator's own polls with pagination.
 */
export async function listPolls(
  creatorId: string,
  page?: number,
  limit?: number,
): Promise<{
  polls: Poll[];
  meta: ReturnType<typeof buildPaginationMeta>;
}> {
  const pagination = parsePagination(page, limit);

  const [polls, total] = await Promise.all([
    prisma.poll.findMany({
      where: { creatorId },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
      include: {
        _count: { select: { responses: true } },
      },
    }),
    prisma.poll.count({ where: { creatorId } }),
  ]);

  return { polls, meta: buildPaginationMeta(total, pagination) };
}

/**
 * Get a poll by slug.
 * If the user is not the owner, DRAFT polls are returned as 404.
 */
export async function getPollBySlug(
  slug: string,
  userId?: string,
): Promise<PollWithQuestions> {
  const poll = await prisma.poll.findUnique({
    where: { slug },
    include: {
      questions: {
        include: { options: { orderBy: { order: 'asc' } } },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!poll) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Poll not found', 404);
  }

  // DRAFT polls are not visible to non-owners
  if (poll.status === 'DRAFT' && poll.creatorId !== userId) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Poll not found', 404);
  }

  return poll;
}

/**
 * Update a poll's settings (title, description, etc.).
 * Only works for DRAFT polls.
 */
export async function updatePoll(
  slug: string,
  userId: string,
  input: UpdatePollInput,
): Promise<Poll> {
  const poll = await assertPollOwner(slug, userId);

  if (poll.status !== 'DRAFT') {
    throw new AppError(ErrorCode.FORBIDDEN, 'Can only update polls in DRAFT status', 403);
  }

  const updated = await prisma.poll.update({
    where: { id: poll.id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.isAnonymous !== undefined && { isAnonymous: input.isAnonymous }),
      ...(input.requiresAuth !== undefined && { requiresAuth: input.requiresAuth }),
      ...(input.expiresAt !== undefined && {
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      }),
    },
  });

  return updated;
}

/**
 * Delete a poll and all related data (cascades via Prisma schema).
 */
export async function deletePoll(slug: string, userId: string): Promise<void> {
  const poll = await assertPollOwner(slug, userId);
  await prisma.poll.delete({ where: { id: poll.id } });
  logger.info('Poll deleted', { pollId: poll.id, slug });
}

/**
 * Activate a poll — transitions from DRAFT to ACTIVE.
 */
export async function activatePoll(slug: string, userId: string): Promise<Poll> {
  const poll = await assertPollOwner(slug, userId);

  if (poll.status !== 'DRAFT') {
    throw new AppError(ErrorCode.FORBIDDEN, 'Only DRAFT polls can be activated', 403);
  }

  const updated = await prisma.poll.update({
    where: { id: poll.id },
    data: { status: 'ACTIVE' },
  });

  logger.info('Poll activated', { pollId: poll.id, slug });
  return updated;
}

/**
 * Close a poll — transitions from ACTIVE to EXPIRED.
 */
export async function closePoll(slug: string, userId: string): Promise<Poll> {
  const poll = await assertPollOwner(slug, userId);

  if (poll.status !== 'ACTIVE') {
    throw new AppError(ErrorCode.FORBIDDEN, 'Only ACTIVE polls can be closed', 403);
  }

  const updated = await prisma.poll.update({
    where: { id: poll.id },
    data: { status: 'EXPIRED' },
  });

  logger.info('Poll closed', { pollId: poll.id, slug });
  return updated;
}

/**
 * Publish poll results — transitions from ACTIVE or EXPIRED to PUBLISHED.
 * Requires at least 1 response.
 */
export async function publishPoll(slug: string, userId: string): Promise<Poll> {
  const poll = await assertPollOwner(slug, userId);

  if (poll.status !== 'ACTIVE' && poll.status !== 'EXPIRED') {
    throw new AppError(ErrorCode.FORBIDDEN, 'Only ACTIVE or EXPIRED polls can be published', 403);
  }

  const responseCount = await prisma.response.count({ where: { pollId: poll.id } });
  if (responseCount === 0) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, 'Cannot publish a poll with 0 responses', 400);
  }

  const updated = await prisma.poll.update({
    where: { id: poll.id },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
  });

  logger.info('Poll published', { pollId: poll.id, slug });
  return updated;
}

/**
 * Get share link and QR data for a poll.
 */
export async function getShareData(
  slug: string,
  userId: string,
  baseUrl: string,
): Promise<{ url: string; slug: string }> {
  await assertPollOwner(slug, userId);

  const frontendUrl = baseUrl.replace('/api', '');
  const url = `${frontendUrl}/p/${slug}`;

  return { url, slug };
}

/**
 * Expire all active polls that are past their expiresAt.
 * Called by the cron job in server.ts.
 */
export async function expirePolls(): Promise<void> {
  const result = await prisma.poll.updateMany({
    where: {
      status: 'ACTIVE',
      expiresAt: { lt: new Date() },
    },
    data: { status: 'EXPIRED' },
  });

  if (result.count > 0) {
    logger.info(`Expired ${String(result.count)} poll(s)`);
  }
}
