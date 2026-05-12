/**
 * Helper to safely extract a single string from Express 5 route params.
 * Express 5 types `req.params[key]` as `string | string[] | undefined`.
 * @module utils/params
 */

/**
 * Extracts a single string value from req.params.
 * Returns the first element if the value is an array.
 */
export function getParam(params: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const value = params[key];
  if (Array.isArray(value)) return value[0];
  return value;
}
