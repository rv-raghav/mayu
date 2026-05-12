/**
 * JWT and refresh token management service.
 * Issues, verifies, rotates, and revokes tokens.
 * @module modules/auth/token.service
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import { env } from '@/config/env';
import { redis } from '@/config/redis';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import type { TokenPayload } from '@/types';
import type { Response, Request } from 'express';

const privateKey = fs.readFileSync(env.JWT_PRIVATE_KEY_PATH);
const publicKey = fs.readFileSync(env.JWT_PUBLIC_KEY_PATH);

const COOKIE_NAME = 'mayu_rt';

/**
 * Issue a short-lived RS256 JWT access token.
 */
export function issueAccessToken(user: { id: string; email: string; role: string }): string {
  const jti = crypto.randomUUID();
  const options: jwt.SignOptions = {
    algorithm: 'RS256',
    expiresIn: env.JWT_ACCESS_TOKEN_EXPIRY as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, jti },
    privateKey,
    options,
  );
}

/**
 * Verify and decode a JWT access token.
 * Returns null if invalid, expired, or blacklisted.
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as TokenPayload;
    // Check blacklist
    const blacklisted = await redis.get(`auth:blacklist:${payload.jti}`);
    if (blacklisted) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Generate a cryptographically random refresh token.
 * Stores the SHA256 hash in the database.
 * Returns the raw token (sent to client as httpOnly cookie).
 */
export async function issueRefreshToken(
  userId: string,
  familyId: string | null,
  meta: { ipAddress?: string; userAgent?: string },
): Promise<string> {
  const rawToken = crypto.randomBytes(64).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_TOKEN_EXPIRY_DAYS * 86400 * 1000);

  await prisma.refreshToken.create({
    data: {
      tokenHash,
      familyId: familyId ?? crypto.randomUUID(),
      userId,
      expiresAt,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    },
  });

  return rawToken;
}

/**
 * Rotate a refresh token.
 * Detects reuse attacks: if the token is already revoked, revoke the entire family.
 * Returns null on any failure (caller should handle appropriately).
 */
export async function rotateRefreshToken(
  rawToken: string,
  meta: { ipAddress?: string; userAgent?: string },
): Promise<{ accessToken: string; newRawRefreshToken: string; familyRevoked?: boolean } | null> {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!stored) return null;

  // REUSE DETECTION: token was already revoked — compromise detected
  if (stored.revokedAt) {
    logger.warn('Refresh token reuse detected — revoking entire family', {
      familyId: stored.familyId,
      userId: stored.userId,
    });
    await prisma.refreshToken.updateMany({
      where: { familyId: stored.familyId },
      data: { revokedAt: new Date() },
    });
    return { accessToken: '', newRawRefreshToken: '', familyRevoked: true };
  }

  if (stored.expiresAt < new Date()) return null;

  // Revoke old token
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  // Issue new tokens
  const accessToken = issueAccessToken(stored.user);
  const newRawRefreshToken = await issueRefreshToken(stored.userId, stored.familyId, meta);

  return { accessToken, newRawRefreshToken };
}

/**
 * Revoke a single refresh token (for logout).
 */
export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Set the refresh token as an httpOnly secure cookie.
 */
export function setRefreshCookie(res: Response, token: string, expiryDays: number): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: expiryDays * 24 * 60 * 60 * 1000,
    path: '/auth',
  });
}

/**
 * Clear the refresh token cookie.
 */
export function clearRefreshCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: '/auth' });
}

/**
 * Read the refresh token from the cookie.
 */
export function getRefreshCookie(req: Request): string | undefined {
  return (req.cookies as Record<string, string | undefined>)?.[COOKIE_NAME];
}
