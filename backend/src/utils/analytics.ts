/**
 * Pure analytics computation functions.
 * Operates on raw DB data — no side effects.
 * @module utils/analytics
 */

import type { PollAnalytics, QuestionAnalytics, OptionAnalytics } from '@/types';

interface RawPoll {
  id: string;
  title: string;
  status: string;
  expiresAt: Date | null;
  questions: Array<{
    id: string;
    text: string;
    type: 'MULTIPLE_CHOICE' | 'RATING' | 'TEXT' | 'RANKING';
    isMandatory: boolean;
    options: Array<{
      id: string;
      text: string;
    }>;
  }>;
}

interface GroupByResult {
  questionId: string;
  optionId: string | null;
  _count: {
    optionId: number;
  };
}

interface RawAnswer {
  questionId: string;
  textValue: string | null;
  ratingValue: number | null;
  rankingValue: unknown;
}

/**
 * Compute full analytics from raw poll data, total response count, and grouped answers.
 */
export function computeAnalyticsFromRaw(
  poll: RawPoll,
  totalResponses: number,
  groupedAnswers: GroupByResult[],
  rawAnswers: RawAnswer[] = [],
): PollAnalytics {
  // Build a lookup: { questionId: { optionId: count } }
  const answerCounts = new Map<string, Map<string, number>>();
  for (const row of groupedAnswers) {
    if (!answerCounts.has(row.questionId)) {
      answerCounts.set(row.questionId, new Map());
    }
    if (row.optionId) {
      answerCounts.get(row.questionId)!.set(row.optionId, row._count.optionId);
    }
  }

  const questions: QuestionAnalytics[] = poll.questions.map((q) => {
    const optionCounts = answerCounts.get(q.id) ?? new Map<string, number>();
    let totalAnswered = 0;

    const options: OptionAnalytics[] = q.options.map((o) => {
      const count = optionCounts.get(o.id) ?? 0;
      totalAnswered += count;
      return {
        id: o.id,
        text: o.text,
        count,
        percentage: 0, // calculated below
      };
    });

    // Calculate percentages
    for (const opt of options) {
      opt.percentage = totalAnswered > 0
        ? Math.round((opt.count / totalAnswered) * 1000) / 10
        : 0;
    }

    if (q.type !== 'MULTIPLE_CHOICE') {
      totalAnswered = rawAnswers.filter((answer) => answer.questionId === q.id).length;
    }

    const skippedCount = totalResponses - totalAnswered;

    return {
      id: q.id,
      text: q.text,
      type: q.type,
      isMandatory: q.isMandatory,
      totalAnswered,
      skippedCount: Math.max(0, skippedCount),
      options,
      ...buildTypedAnalytics(q.id, q.type, rawAnswers),
    };
  });

  // Completion rate: percentage of respondents who answered all mandatory questions
  const mandatoryQuestions = poll.questions.filter((q) => q.isMandatory);
  let completionRate = 100;
  if (mandatoryQuestions.length > 0 && totalResponses > 0) {
    const fullyCompleted = mandatoryQuestions.every((q) => {
      const qAnalytics = questions.find((qa) => qa.id === q.id);
      return qAnalytics && qAnalytics.totalAnswered >= totalResponses;
    });
    completionRate = fullyCompleted ? 100 : Math.round(
      (questions
        .filter((q) => q.isMandatory)
        .reduce((sum, q) => sum + q.totalAnswered, 0) /
        (mandatoryQuestions.length * totalResponses)) * 1000,
    ) / 10;
  }

  return {
    pollId: poll.id,
    title: poll.title,
    status: poll.status,
    totalResponses,
    expiresAt: poll.expiresAt?.toISOString() ?? null,
    questions,
    participation: {
      completionRate,
    },
  };
}

function buildTypedAnalytics(
  questionId: string,
  type: RawPoll['questions'][number]['type'],
  rawAnswers: RawAnswer[],
): Pick<QuestionAnalytics, 'textAnswers' | 'ratingAverage' | 'ratingDistribution'> {
  const questionAnswers = rawAnswers.filter((answer) => answer.questionId === questionId);

  if (type === 'TEXT') {
    return {
      textAnswers: questionAnswers
        .map((answer) => answer.textValue)
        .filter((value): value is string => Boolean(value)),
    };
  }

  if (type === 'RATING') {
    const ratings = questionAnswers
      .map((answer) => answer.ratingValue)
      .filter((value): value is number => typeof value === 'number');
    const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: ratings.filter((value) => value === rating).length,
    }));

    return {
      ratingAverage:
        ratings.length > 0
          ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10
          : null,
      ratingDistribution,
    };
  }

  return {};
}
