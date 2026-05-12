/**
 * Zod request schemas for poll endpoints.
 * @module modules/polls/polls.schema
 */

import { z } from 'zod';

const optionSchema = z.object({
  text: z.string().min(1, 'Option text is required').max(500),
});

const questionTypeSchema = z.enum(['MULTIPLE_CHOICE', 'RATING', 'TEXT', 'RANKING']);

const questionSchema = z.object({
  text: z.string().min(1, 'Question text is required').max(1000),
  type: questionTypeSchema.default('MULTIPLE_CHOICE'),
  isMandatory: z.boolean().default(true),
  options: z.array(optionSchema).max(10, 'Maximum 10 options per question').default([]),
}).superRefine((question, ctx) => {
  if ((question.type === 'MULTIPLE_CHOICE' || question.type === 'RANKING') && question.options.length < 2) {
    ctx.addIssue({
      code: 'custom',
      path: ['options'],
      message: 'Multiple choice and ranking questions need at least 2 options',
    });
  }
});

/** POST /polls — Create poll body schema. */
export const createPollSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().nullable(),
  isAnonymous: z.boolean().default(true),
  requiresAuth: z.boolean().default(false),
  expiresAt: z.string().datetime().optional().nullable(),
  questions: z
    .array(questionSchema)
    .min(1, 'At least 1 question is required')
    .max(20, 'Maximum 20 questions per poll'),
});

/** PATCH /polls/:slug — Update poll body schema. */
export const updatePollSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  isAnonymous: z.boolean().optional(),
  requiresAuth: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

/** Pagination query schema for GET /polls. */
export const listPollsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

/** Slug param schema. */
export const slugParamSchema = z.object({
  slug: z.string().min(1),
});

export type CreatePollInput = z.infer<typeof createPollSchema>;
export type UpdatePollInput = z.infer<typeof updatePollSchema>;
export type ListPollsQuery = z.infer<typeof listPollsQuerySchema>;
