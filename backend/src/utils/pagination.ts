/**
 * Pagination helper utilities.
 * @module utils/pagination
 */

/** Pagination parameters parsed from query strings. */
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

/** Pagination metadata returned in API responses. */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Parses and normalizes pagination query parameters.
 * @param page - Requested page (1-indexed, default 1).
 * @param limit - Items per page (default 20, max 100).
 */
export function parsePagination(page?: number, limit?: number): PaginationParams {
  const safePage = Math.max(1, page ?? 1);
  const safeLimit = Math.min(100, Math.max(1, limit ?? 20));
  const skip = (safePage - 1) * safeLimit;
  return { page: safePage, limit: safeLimit, skip };
}

/**
 * Computes pagination metadata from total count and params.
 */
export function buildPaginationMeta(total: number, params: PaginationParams): PaginationMeta {
  return {
    page: params.page,
    limit: params.limit,
    total,
    totalPages: Math.ceil(total / params.limit),
  };
}
