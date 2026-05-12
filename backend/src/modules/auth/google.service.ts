/**
 * Custom Google OIDC service — PKCE flow, JWKS verification.
 * No third-party OAuth libraries. Manual implementation.
 * @module modules/auth/google.service
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { redis } from '@/config/redis';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

interface GoogleJwk {
  kid: string;
  kty: string;
  alg: string;
  n: string;
  e: string;
  use: string;
}

interface JwksCache {
  keys: GoogleJwk[];
  fetchedAt: number;
}

interface GoogleIdTokenPayload {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
}

// JWKS cache in memory — refreshed every 24h
let jwksCache: JwksCache | null = null;

/**
 * Step 1: Generate the Google OAuth2 authorization URL.
 * Uses PKCE S256 for security. Stores state + verifier in Redis (TTL 10min).
 */
export async function getGoogleAuthUrl(): Promise<string> {
  const state = crypto.randomBytes(32).toString('base64url');
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  // Store for callback verification
  await redis.setex(`oauth:state:${state}`, 600, codeVerifier);

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Step 2: Handle the callback — exchange code for tokens, verify id_token.
 * Returns the verified user info from Google.
 */
export async function handleGoogleCallback(
  code: string,
  state: string,
): Promise<{
  googleId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}> {
  // Validate state + retrieve code_verifier
  const codeVerifier = await redis.get(`oauth:state:${state}`);
  if (!codeVerifier) {
    throw new Error('INVALID_STATE');
  }
  await redis.del(`oauth:state:${state}`);

  // Exchange code for tokens
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    logger.error('Google token exchange failed', { status: tokenRes.status, body });
    throw new Error('TOKEN_EXCHANGE_FAILED');
  }

  const tokens = (await tokenRes.json()) as { id_token: string; access_token: string };

  // Verify id_token signature using Google's JWKS
  const payload = await verifyGoogleIdToken(tokens.id_token);

  return {
    googleId: payload.sub,
    email: payload.email,
    displayName: payload.name,
    avatarUrl: payload.picture ?? null,
  };
}

/**
 * Fetch and cache Google's JWKS public keys (24h cache).
 */
async function getGoogleJwks(): Promise<GoogleJwk[]> {
  const ONE_DAY = 24 * 60 * 60 * 1000;
  if (jwksCache && Date.now() - jwksCache.fetchedAt < ONE_DAY) {
    return jwksCache.keys;
  }
  const res = await fetch(GOOGLE_JWKS_URL);
  const json = (await res.json()) as { keys: GoogleJwk[] };
  jwksCache = { keys: json.keys, fetchedAt: Date.now() };
  return json.keys;
}

/**
 * Verify a Google id_token:
 * - Check signature using matching JWKS key
 * - Verify iss, aud, exp claims
 */
async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdTokenPayload> {
  const [headerB64] = idToken.split('.');
  if (!headerB64) {
    throw new Error('INVALID_ID_TOKEN');
  }
  const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString()) as { kid: string };
  const keys = await getGoogleJwks();
  const matchingKey = keys.find((k) => k.kid === header.kid);
  if (!matchingKey) {
    throw new Error('NO_MATCHING_JWK');
  }

  // Convert JWK to PEM using Node crypto
  const publicKey = crypto.createPublicKey({ key: matchingKey, format: 'jwk' } as any);

  return new Promise<GoogleIdTokenPayload>((resolve, reject) => {
    jwt.verify(
      idToken,
      publicKey.export({ type: 'spki', format: 'pem' }),
      {
        algorithms: ['RS256'],
        audience: env.GOOGLE_CLIENT_ID,
        issuer: 'https://accounts.google.com',
      },
      (err, decoded) => {
        if (err) return reject(new Error('INVALID_ID_TOKEN'));
        resolve(decoded as GoogleIdTokenPayload);
      },
    );
  });
}
