/**
 * Shared domain types for the MaYu backend.
 * @module types
 */

/** Standard API error codes used across all endpoints. */
export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  SESSION_COMPROMISED: 'SESSION_COMPROMISED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  POLL_EXPIRED: 'POLL_EXPIRED',
  ALREADY_RESPONDED: 'ALREADY_RESPONDED',
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

/** Union of all error code string values. */
export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

/** JWT access token payload structure. */
export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  jti: string;
}

/** Standard success API response. */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/** Paginated API response with metadata. */
export interface ApiPaginatedResponse<T> {
  success: true;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Standard error API response. */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCodeValue;
    message: string;
    details?: unknown;
  };
}

/** Analytics shape for a single question option. */
export interface OptionAnalytics {
  id: string;
  text: string;
  count: number;
  percentage: number;
}

/** Analytics shape for a single question. */
export interface QuestionAnalytics {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'RATING' | 'TEXT' | 'RANKING';
  isMandatory: boolean;
  totalAnswered: number;
  skippedCount: number;
  options: OptionAnalytics[];
  textAnswers?: string[];
  ratingAverage?: number | null;
  ratingDistribution?: Array<{ rating: number; count: number }>;
}

/** Full analytics payload for a poll. */
export interface PollAnalytics {
  pollId: string;
  title: string;
  status: string;
  totalResponses: number;
  expiresAt: string | null;
  questions: QuestionAnalytics[];
  participation: {
    completionRate: number;
  };
}

/** Response submission payload (for Kafka or direct write). */
export interface ResponsePayload {
  pollId: string;
  slug: string;
  respondentId: string | null;
  sessionToken: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  answers: Array<{
    questionId: string;
    optionId?: string;
    textValue?: string;
    ratingValue?: number;
    rankingValue?: string[];
  }>;
}
