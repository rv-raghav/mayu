/**
 * Cryptographic token generation helpers.
 * @module utils/crypto
 */

import crypto from 'crypto';

/**
 * Generates a cryptographically random hex string.
 * @param bytes - Number of random bytes (default 32).
 */
export function generateRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Creates a SHA-256 hash of the given input.
 */
export function hashSha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}
