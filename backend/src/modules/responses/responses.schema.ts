/**
 * Zod request schemas for response endpoints.
 * @module modules/responses/responses.schema
 */

import { z } from 'zod';

const answerSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  optionId: z.string().min(1, 'Option ID is required').optional(),
  textValue: z.string().trim().min(1).max(5000).optional(),
  ratingValue: z.number().int().min(1).max(5).optional(),
  rankingValue: z.array(z.string().min(1)).min(2).max(10).optional(),
});

/** POST /polls/:slug/respond body schema. */
export const submitResponseSchema = z.object({
  sessionToken: z.string().uuid().optional().nullable(),
  answers: z.array(answerSchema).min(1, 'At least one answer is required'),
});

/** GET /polls/:slug/responses query schema. */
export const listResponsesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
export type ListResponsesQuery = z.infer<typeof listResponsesQuerySchema>;
