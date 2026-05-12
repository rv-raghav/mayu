/**
 * Custom application error class with structured error codes.
 * @module utils/errors
 */

import { ErrorCodeValue } from '@/types';

/**
 * Structured application error.
 * All known errors thrown in the application should be instances of AppError.
 */
export class AppError extends Error {
  /** Machine-readable error code from ErrorCode enum. */
  public readonly code: ErrorCodeValue;
  /** HTTP status code to return to the client. */
  public readonly statusCode: number;
  /** Optional additional details (e.g., validation field errors). */
  public readonly details?: unknown;

  constructor(code: ErrorCodeValue, message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}
