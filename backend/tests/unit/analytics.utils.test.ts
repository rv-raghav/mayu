/**
 * Unit tests for analytics utility functions.
 */

import { describe, it, expect } from 'vitest';
import { computeAnalyticsFromRaw } from '@/utils/analytics';

describe('computeAnalyticsFromRaw', () => {
  const mockPoll = {
    id: 'poll-1',
    title: 'Test Poll',
    status: 'ACTIVE',
    expiresAt: new Date('2026-12-31T00:00:00Z'),
    questions: [
      {
        id: 'q-1',
        text: 'Favourite colour?',
        isMandatory: true,
        options: [
          { id: 'o-1', text: 'Red' },
          { id: 'o-2', text: 'Blue' },
          { id: 'o-3', text: 'Green' },
        ],
      },
    ],
  };

  it('should compute correct percentages from grouped answers', () => {
    const groupedAnswers = [
      { questionId: 'q-1', optionId: 'o-1', _count: { optionId: 50 } },
      { questionId: 'q-1', optionId: 'o-2', _count: { optionId: 30 } },
      { questionId: 'q-1', optionId: 'o-3', _count: { optionId: 20 } },
    ];

    const result = computeAnalyticsFromRaw(mockPoll, 100, groupedAnswers);

    expect(result.totalResponses).toBe(100);
    expect(result.pollId).toBe('poll-1');
    expect(result.questions).toHaveLength(1);

    const question = result.questions[0]!;
    expect(question.totalAnswered).toBe(100);
    expect(question.skippedCount).toBe(0);

    expect(question.options[0]!.count).toBe(50);
    expect(question.options[0]!.percentage).toBe(50);
    expect(question.options[1]!.count).toBe(30);
    expect(question.options[1]!.percentage).toBe(30);
    expect(question.options[2]!.count).toBe(20);
    expect(question.options[2]!.percentage).toBe(20);
  });

  it('should handle zero responses', () => {
    const result = computeAnalyticsFromRaw(mockPoll, 0, []);

    expect(result.totalResponses).toBe(0);
    expect(result.questions[0]!.totalAnswered).toBe(0);
    expect(result.questions[0]!.options[0]!.percentage).toBe(0);
  });

  it('should compute skipped count correctly', () => {
    const groupedAnswers = [
      { questionId: 'q-1', optionId: 'o-1', _count: { optionId: 40 } },
      { questionId: 'q-1', optionId: 'o-2', _count: { optionId: 30 } },
    ];

    const result = computeAnalyticsFromRaw(mockPoll, 100, groupedAnswers);
    expect(result.questions[0]!.totalAnswered).toBe(70);
    expect(result.questions[0]!.skippedCount).toBe(30);
  });

  it('should return null expiresAt when poll has no expiry', () => {
    const noExpiryPoll = { ...mockPoll, expiresAt: null };
    const result = computeAnalyticsFromRaw(noExpiryPoll, 0, []);
    expect(result.expiresAt).toBeNull();
  });
});
