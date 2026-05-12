# CLAUDE.md — MaYu Backend

> This file is the single source of truth for Claude (the AI coding agent) when building the MaYu backend.
> Read this file completely before writing any code. Follow every instruction in order.

---

## 1. Who You Are & What You're Building

You are the backend engineer for **MaYu** — a production-grade, real-time live polling SaaS platform.

Your sole responsibility is the **backend**: REST API, authentication, database, WebSockets, Kafka, and tests.
The frontend is handled separately by Gemini. Do not scaffold, stub, or touch any frontend code.

**Your output must be production-quality.** This means:
- No `any` in TypeScript. Ever.
- No `console.log` — use the Winston logger at all times.
- No unhandled promise rejections.
- Every public function has a JSDoc comment.
- Every endpoint is tested (integration test via Supertest).
- Environment variables are validated at startup via Zod. The app must crash on boot if required vars are missing.

---

## 2. Tech Stack — Non-Negotiable

| Concern | Tool | Version |
|---------|------|---------|
| Runtime | Node.js | 20 LTS |
| Framework | Express | 5.x |
| Language | TypeScript | 5.x strict |
| ORM | Prisma | 5.x |
| Database | PostgreSQL | 16 |
| Cache / Sessions | Redis (ioredis) | 7.x |
| Auth | Custom JWT RS256 + Custom Google OIDC | No Passport. No Auth0. No third-party auth libs. |
| WebSockets | Socket.io | 4.x |
| Message Queue | KafkaJS | 2.x |
| Validation | Zod | 3.x |
| Testing | Vitest + Supertest | Latest |
| Logging | Winston | 3.x |
| Process Manager | PM2 | Latest |
| Email | Nodemailer | 6.x |

**Do NOT use:**
- `passport`, `passport-*` — authentication is built from scratch
- `jsonwebtoken` alternatives — use `jsonwebtoken` only
- `mongoose` or any non-Prisma ORM
- `axios` on the server (use Node's native `fetch` for external HTTP calls)
- `express-session` — sessions are JWT + Redis only
- Any library that wraps Google OAuth — implement the OIDC flow manually

---

## 3. Project Structure

Create this exact directory layout. Do not deviate.

```
backend/
├── src/
│   ├── config/
│   │   ├── env.ts              # Zod env schema — app crashes if invalid
│   │   ├── database.ts         # Prisma client singleton
│   │   ├── redis.ts            # ioredis client singleton
│   │   └── kafka.ts            # KafkaJS producer + consumer factory
│   ├── middleware/
│   │   ├── auth.ts             # requireAuth — verifies Bearer JWT, attaches req.user
│   │   ├── optionalAuth.ts     # attachUser — attaches user if token present, no error if absent
│   │   ├── rateLimiter.ts      # Redis-backed rate limiter factory
│   │   ├── validate.ts         # Zod body/query/params validation middleware
│   │   ├── errorHandler.ts     # Global Express error handler (last middleware)
│   │   └── requestId.ts        # Attach unique X-Request-ID to every request
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.schema.ts       # Zod request schemas
│   │   │   ├── google.service.ts    # Custom Google PKCE OIDC — see Section 8
│   │   │   └── token.service.ts     # JWT issue/verify/rotate/revoke
│   │   ├── polls/
│   │   │   ├── polls.routes.ts
│   │   │   ├── polls.controller.ts
│   │   │   ├── polls.service.ts
│   │   │   └── polls.schema.ts
│   │   ├── responses/
│   │   │   ├── responses.routes.ts
│   │   │   ├── responses.controller.ts
│   │   │   ├── responses.service.ts
│   │   │   └── responses.schema.ts
│   │   └── analytics/
│   │       ├── analytics.routes.ts
│   │       ├── analytics.controller.ts
│   │       └── analytics.service.ts
│   ├── workers/
│   │   └── responseConsumer.ts      # Kafka consumer → batch DB writes
│   ├── sockets/
│   │   ├── socket.server.ts         # Socket.io init + Redis adapter
│   │   ├── poll.namespace.ts        # /polls namespace
│   │   └── analytics.namespace.ts  # /analytics namespace (JWT protected)
│   ├── utils/
│   │   ├── logger.ts                # Winston singleton
│   │   ├── slugify.ts               # title → url-safe slug + uniqueness suffix
│   │   ├── crypto.ts                # token generation helpers
│   │   ├── pagination.ts            # cursor/offset pagination helpers
│   │   └── analytics.ts            # pure functions: compute analytics from raw DB data
│   ├── types/
│   │   ├── express.d.ts             # declare req.user, req.requestId
│   │   └── index.ts                 # shared domain types
│   └── app.ts                       # Express app factory (no listen call here)
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── tests/
│   ├── unit/
│   │   ├── token.service.test.ts
│   │   ├── auth.service.test.ts
│   │   └── analytics.utils.test.ts
│   ├── integration/
│   │   ├── auth.test.ts
│   │   ├── polls.test.ts
│   │   ├── responses.test.ts
│   │   └── analytics.test.ts
│   └── helpers/
│       ├── testDb.ts                # DB cleanup between tests
│       ├── factories.ts             # createTestUser, createTestPoll, etc.
│       └── request.ts               # supertest app wrapper
├── keys/
│   ├── private.pem                  # RS256 private key (gitignored)
│   └── public.pem                   # RS256 public key (gitignored)
├── server.ts                        # HTTP server entry point — calls app.listen
├── .env
├── .env.example
├── .env.test                        # test environment overrides
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── docker-compose.yml
└── ecosystem.config.js              # PM2 config
```

---

## 4. Environment Variables

### 4.1 Validation (src/config/env.ts)

Use Zod to parse `process.env`. Export a typed `env` object. The entire app imports from here — never access `process.env` directly elsewhere.

```typescript
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  API_BASE_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),

  // JWT
  JWT_PRIVATE_KEY_PATH: z.string(),
  JWT_PUBLIC_KEY_PATH: z.string(),
  JWT_ACCESS_TOKEN_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_TOKEN_EXPIRY_DAYS: z.coerce.number().default(7),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // Google OAuth2
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string().url(),

  // Kafka
  KAFKA_BROKERS: z.string().transform(s => s.split(',')),
  KAFKA_CLIENT_ID: z.string().default('mayu-api'),
  KAFKA_CONSUMER_GROUP: z.string().default('mayu-response-writers'),
  KAFKA_ENABLED: z.coerce.boolean().default(false),

  // Email
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  EMAIL_FROM: z.string().default('MaYu <noreply@mayu.app>'),

  // Security
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
```

### 4.2 .env.example

```env
NODE_ENV=development
PORT=3001
API_BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173

JWT_PRIVATE_KEY_PATH=./keys/private.pem
JWT_PUBLIC_KEY_PATH=./keys/public.pem
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY_DAYS=7

DATABASE_URL=postgresql://mayu:password@localhost:5432/mayu_db

REDIS_URL=redis://localhost:6379

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback

KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=mayu-api
KAFKA_CONSUMER_GROUP=mayu-response-writers
KAFKA_ENABLED=false

SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass
EMAIL_FROM=MaYu <noreply@mayu.app>

BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

---

## 5. Database Schema (Prisma)

This is the canonical schema. Create it exactly as written. Run `prisma migrate dev --name init` after setup.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified Boolean   @default(false)
  displayName   String
  avatarUrl     String?
  passwordHash  String?
  googleId      String?   @unique
  role          Role      @default(USER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  polls         Poll[]
  responses     Response[]
  refreshTokens RefreshToken[]
}

enum Role { USER ADMIN }

model RefreshToken {
  id         String    @id @default(cuid())
  tokenHash  String    @unique      // SHA256 hash of the raw token
  familyId   String                 // all rotations share this ID
  userId     String
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt  DateTime
  revokedAt  DateTime?
  createdAt  DateTime  @default(now())
  userAgent  String?
  ipAddress  String?

  @@index([userId])
  @@index([familyId])
}

model EmailVerification {
  id        String    @id @default(cuid())
  email     String
  token     String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
  @@index([token])
}

model PasswordReset {
  id        String    @id @default(cuid())
  userId    String
  token     String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
  @@index([token])
}

model Poll {
  id           String     @id @default(cuid())
  slug         String     @unique
  creatorId    String
  creator      User       @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  title        String
  description  String?
  isAnonymous  Boolean    @default(true)
  requiresAuth Boolean    @default(false)
  status       PollStatus @default(DRAFT)
  expiresAt    DateTime?
  publishedAt  DateTime?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  questions    Question[]
  responses    Response[]

  @@index([creatorId])
  @@index([slug])
  @@index([status])
  @@index([expiresAt])
}

enum PollStatus { DRAFT ACTIVE EXPIRED PUBLISHED }

model Question {
  id          String   @id @default(cuid())
  pollId      String
  poll        Poll     @relation(fields: [pollId], references: [id], onDelete: Cascade)
  text        String
  isMandatory Boolean  @default(true)
  order       Int
  createdAt   DateTime @default(now())

  options     Option[]
  answers     Answer[]

  @@index([pollId])
  @@unique([pollId, order])
}

model Option {
  id         String   @id @default(cuid())
  questionId String
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  text       String
  order      Int

  answers    Answer[]

  @@index([questionId])
  @@unique([questionId, order])
}

model Response {
  id           String   @id @default(cuid())
  pollId       String
  poll         Poll     @relation(fields: [pollId], references: [id], onDelete: Cascade)
  respondentId String?
  respondent   User?    @relation(fields: [respondentId], references: [id], onDelete: SetNull)
  sessionToken String?
  submittedAt  DateTime @default(now())
  ipAddress    String?
  userAgent    String?

  answers      Answer[]

  @@index([pollId])
  @@index([respondentId])
  @@index([sessionToken])
  @@unique([pollId, respondentId])
  @@unique([pollId, sessionToken])
}

model Answer {
  id         String   @id @default(cuid())
  responseId String
  response   Response @relation(fields: [responseId], references: [id], onDelete: Cascade)
  questionId String
  question   Question @relation(fields: [questionId], references: [id])
  optionId   String
  option     Option   @relation(fields: [optionId], references: [id])

  @@index([responseId])
  @@index([questionId])
  @@index([optionId])
  @@unique([responseId, questionId])
}
```

---

## 6. API Endpoints

### Standard Response Envelope

Every response — success or error — uses this shape:

```typescript
// Success
{ "success": true, "data": <payload> }

// Paginated success
{ "success": true, "data": [...], "meta": { "page": 1, "limit": 20, "total": 142, "totalPages": 8 } }

// Error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "human readable", "details": [...] } }
```

### HTTP Status Codes

| Code | When |
|------|------|
| 200 | Success |
| 201 | Resource created |
| 202 | Accepted (async Kafka path) |
| 204 | Success, no body (DELETE) |
| 400 | Malformed request |
| 401 | Not authenticated |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 409 | Conflict (duplicate, already responded) |
| 410 | Gone (poll expired) |
| 422 | Validation error |
| 429 | Rate limited |
| 500 | Internal server error |

### Error Codes Enum

```typescript
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
```

### Full Endpoint List

#### Auth — `/auth`

| Method | Path | Middleware | Description |
|--------|------|-----------|-------------|
| POST | `/auth/register` | rateLimiter(5/15min) | Email/password register |
| POST | `/auth/login` | rateLimiter(5/15min) | Email/password login |
| POST | `/auth/refresh` | — | Rotate refresh token (reads cookie) |
| POST | `/auth/logout` | requireAuth | Revoke refresh token |
| GET | `/auth/google` | — | Redirect to Google consent |
| GET | `/auth/google/callback` | — | Handle Google callback |
| POST | `/auth/verify-email` | rateLimiter(3/hour) | Verify email token |
| POST | `/auth/resend-verification` | rateLimiter(3/hour) | Resend verification email |
| POST | `/auth/forgot-password` | rateLimiter(3/hour) | Send password reset email |
| POST | `/auth/reset-password` | — | Reset password with token |
| GET | `/auth/me` | requireAuth | Get current user |
| PATCH | `/auth/me` | requireAuth | Update display name / avatar |

#### Polls — `/polls`

| Method | Path | Middleware | Description |
|--------|------|-----------|-------------|
| POST | `/polls` | requireAuth | Create poll (with questions + options) |
| GET | `/polls` | requireAuth | List own polls (paginated) |
| GET | `/polls/:slug` | optionalAuth | Get poll by slug |
| PATCH | `/polls/:slug` | requireAuth + ownerGuard | Update poll |
| DELETE | `/polls/:slug` | requireAuth + ownerGuard | Delete poll |
| POST | `/polls/:slug/activate` | requireAuth + ownerGuard | Set ACTIVE |
| POST | `/polls/:slug/close` | requireAuth + ownerGuard | Set EXPIRED |
| POST | `/polls/:slug/publish` | requireAuth + ownerGuard | Set PUBLISHED |
| GET | `/polls/:slug/share` | requireAuth + ownerGuard | Get share link + QR data |

#### Responses — `/polls/:slug`

| Method | Path | Middleware | Description |
|--------|------|-----------|-------------|
| POST | `/polls/:slug/respond` | optionalAuth | Submit response |
| GET | `/polls/:slug/responses` | requireAuth + ownerGuard | List responses |

#### Analytics — `/polls/:slug`

| Method | Path | Middleware | Description |
|--------|------|-----------|-------------|
| GET | `/polls/:slug/analytics` | requireAuth + ownerGuard | Full analytics |
| GET | `/polls/:slug/results` | optionalAuth | Public results (PUBLISHED only) |

---

## 7. Authentication Implementation

### 7.1 Token Service (src/modules/auth/token.service.ts)

```typescript
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import { env } from '@/config/env';
import { redis } from '@/config/redis';
import { prisma } from '@/config/database';

const privateKey = fs.readFileSync(env.JWT_PRIVATE_KEY_PATH);
const publicKey = fs.readFileSync(env.JWT_PUBLIC_KEY_PATH);

interface TokenPayload {
  sub: string;      // userId
  email: string;
  role: string;
  jti: string;      // unique token ID for blacklisting
}

/**
 * Issue a short-lived RS256 JWT access token.
 */
export function issueAccessToken(user: { id: string; email: string; role: string }): string {
  const jti = crypto.randomUUID();
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, jti },
    privateKey,
    { algorithm: 'RS256', expiresIn: env.JWT_ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Verify and decode a JWT access token.
 * Returns null if invalid or blacklisted.
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
  meta: { ipAddress?: string; userAgent?: string }
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
 */
export async function rotateRefreshToken(
  rawToken: string,
  meta: { ipAddress?: string; userAgent?: string }
): Promise<{ accessToken: string; newRawRefreshToken: string } | null> {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });

  if (!stored) return null;

  // REUSE DETECTION: token was already revoked — compromise detected
  if (stored.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { familyId: stored.familyId },
      data: { revokedAt: new Date() },
    });
    return null; // caller throws SESSION_COMPROMISED
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
 * Revoke a single refresh token (logout).
 */
export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
```

### 7.2 Refresh Token Cookie

Always set and read refresh tokens using an `httpOnly; Secure; SameSite=Strict` cookie named `mayu_rt`.

```typescript
const COOKIE_NAME = 'mayu_rt';

export function setRefreshCookie(res: Response, token: string, expiryDays: number): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: expiryDays * 24 * 60 * 60 * 1000,
    path: '/auth',        // only sent to /auth routes
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: '/auth' });
}

export function getRefreshCookie(req: Request): string | undefined {
  return req.cookies?.[COOKIE_NAME];
}
```

### 7.3 Google OIDC — Custom Implementation (src/modules/auth/google.service.ts)

Implement this exactly. No library wrapping. No shortcuts.

```typescript
import crypto from 'crypto';
import { redis } from '@/config/redis';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

// JWKS cache in memory — refreshed every 24h
let jwksCache: { keys: any[]; fetchedAt: number } | null = null;

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
 * Step 2: Handle the callback, exchange code for tokens, verify id_token.
 * Returns the verified user info from Google.
 */
export async function handleGoogleCallback(
  code: string,
  state: string
): Promise<{ googleId: string; email: string; displayName: string; avatarUrl: string | null }> {
  // Validate state + retrieve code_verifier
  const codeVerifier = await redis.get(`oauth:state:${state}`);
  if (!codeVerifier) throw new Error('INVALID_STATE');
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
    logger.error('Google token exchange failed', { body });
    throw new Error('TOKEN_EXCHANGE_FAILED');
  }

  const tokens: { id_token: string; access_token: string } = await tokenRes.json();

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
async function getGoogleJwks(): Promise<any[]> {
  const ONE_DAY = 24 * 60 * 60 * 1000;
  if (jwksCache && Date.now() - jwksCache.fetchedAt < ONE_DAY) {
    return jwksCache.keys;
  }
  const res = await fetch(GOOGLE_JWKS_URL);
  const json: { keys: any[] } = await res.json();
  jwksCache = { keys: json.keys, fetchedAt: Date.now() };
  return json.keys;
}

/**
 * Verify a Google id_token:
 * - Check signature using matching JWKS key
 * - Verify iss, aud, exp claims
 */
async function verifyGoogleIdToken(idToken: string): Promise<{
  sub: string; email: string; name: string; picture?: string; email_verified: boolean;
}> {
  const [headerB64] = idToken.split('.');
  const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
  const keys = await getGoogleJwks();
  const matchingKey = keys.find(k => k.kid === header.kid);
  if (!matchingKey) throw new Error('NO_MATCHING_JWK');

  // Convert JWK to PEM using Node crypto
  const publicKey = crypto.createPublicKey({ key: matchingKey, format: 'jwk' });

  return new Promise((resolve, reject) => {
    const jwt = require('jsonwebtoken');
    jwt.verify(
      idToken,
      publicKey.export({ type: 'spki', format: 'pem' }),
      {
        algorithms: ['RS256'],
        audience: env.GOOGLE_CLIENT_ID,
        issuer: 'https://accounts.google.com',
      },
      (err: Error | null, decoded: any) => {
        if (err) return reject(new Error('INVALID_ID_TOKEN'));
        resolve(decoded);
      }
    );
  });
}
```

---

## 8. Middleware Patterns

### requireAuth (src/middleware/auth.ts)

```typescript
import { RequestHandler } from 'express';
import { verifyAccessToken } from '@/modules/auth/token.service';
import { AppError } from '@/utils/errors';
import { ErrorCode } from '@/types';

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(ErrorCode.AUTH_REQUIRED, 'Authentication required', 401));
  }
  const token = authHeader.slice(7);
  const payload = await verifyAccessToken(token);
  if (!payload) {
    return next(new AppError(ErrorCode.TOKEN_INVALID, 'Invalid or expired token', 401));
  }
  req.user = payload;
  next();
};
```

### ownerGuard — Poll Ownership Check

```typescript
// Used inline in polls controller, not as separate middleware
async function assertPollOwner(slug: string, userId: string): Promise<Poll> {
  const poll = await prisma.poll.findUnique({ where: { slug } });
  if (!poll) throw new AppError(ErrorCode.NOT_FOUND, 'Poll not found', 404);
  if (poll.creatorId !== userId) throw new AppError(ErrorCode.FORBIDDEN, 'Forbidden', 403);
  return poll;
}
```

### Zod Validation Middleware (src/middleware/validate.ts)

```typescript
import { RequestHandler } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '@/utils/errors';
import { ErrorCode } from '@/types';

type Target = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: Target = 'body'): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      return next(new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Validation failed',
        422,
        result.error.flatten().fieldErrors
      ));
    }
    req[target] = result.data;
    next();
  };
}
```

### Global Error Handler (src/middleware/errorHandler.ts)

```typescript
import { ErrorRequestHandler } from 'express';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { ErrorCode } from '@/types';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    logger.warn('AppError', { code: err.code, message: err.message, requestId: req.requestId });
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details ?? undefined },
    });
  }

  logger.error('Unhandled error', { error: err, requestId: req.requestId });
  return res.status(500).json({
    success: false,
    error: { code: ErrorCode.INTERNAL_ERROR, message: 'An unexpected error occurred' },
  });
};
```

---

## 9. Polls Service Rules

### Creating a Poll

- Validate: min 1 question, max 20 questions
- Validate: each question has min 2 options, max 10 options
- Generate unique slug: `slugify(title) + '-' + nanoid(6)`
- Create poll, questions, and options in a **single Prisma transaction**
- Return the full created poll with nested questions and options

### Expiry Enforcement

Run a cron-style check every 60 seconds (using `setInterval` in `server.ts` after boot):

```typescript
async function expirePolls(): Promise<void> {
  const result = await prisma.poll.updateMany({
    where: { status: 'ACTIVE', expiresAt: { lt: new Date() } },
    data: { status: 'EXPIRED' },
  });
  if (result.count > 0) {
    logger.info(`Expired ${result.count} poll(s)`);
    // emit poll:expired via socket for each (fetch slugs first, then emit)
  }
}
setInterval(expirePolls, 60_000);
```

Also check expiry inline in `POST /polls/:slug/respond` before accepting submission. Return 410 if expired.

---

## 10. Response Submission Flow

```
POST /polls/:slug/respond
  1. Resolve poll by slug — 404 if not found
  2. Check poll.status === 'ACTIVE' — 410 if EXPIRED, 403 if DRAFT
  3. Check poll.requiresAuth — 401 if unauthenticated and requiresAuth=true
  4. Determine respondent identifier:
       - If authenticated: use req.user.sub
       - If anonymous: use req.body.sessionToken (UUID provided by browser)
  5. Check deduplication (Redis SET NX):
       Key: `dedup:${pollId}:${respondentId|sessionToken}`
       TTL: 30 days
       If key already exists → 409 ALREADY_RESPONDED
  6. Validate answers:
       - All mandatory questions must have an answer
       - Each optionId must belong to the correct questionId
       - Each questionId must belong to this poll
  7. If KAFKA_ENABLED: produce to `mayu.response.submitted`, return 202
     Else: write to DB directly (transaction), invalidate Redis analytics cache, emit socket event, return 201
```

---

## 11. Analytics Service

### Computing Analytics

Never aggregate in-memory. Use Prisma groupBy or raw SQL.

```typescript
export async function computeAnalytics(pollId: string): Promise<PollAnalytics> {
  const [poll, responsesCount, answers] = await Promise.all([
    prisma.poll.findUnique({
      where: { id: pollId },
      include: { questions: { include: { options: true }, orderBy: { order: 'asc' } } },
    }),
    prisma.response.count({ where: { pollId } }),
    prisma.answer.groupBy({
      by: ['questionId', 'optionId'],
      where: { response: { pollId } },
      _count: { optionId: true },
    }),
  ]);
  // ... map to analytics shape
}
```

### Caching

```typescript
const ANALYTICS_CACHE_TTL = 30; // seconds

export async function getAnalytics(pollId: string): Promise<PollAnalytics> {
  const cacheKey = `poll:analytics:${pollId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const analytics = await computeAnalytics(pollId);
  await redis.setex(cacheKey, ANALYTICS_CACHE_TTL, JSON.stringify(analytics));
  return analytics;
}

export async function invalidateAnalyticsCache(pollId: string): Promise<void> {
  await redis.del(`poll:analytics:${pollId}`);
}
```

---

## 12. WebSocket Architecture

### Initialization (src/sockets/socket.server.ts)

```typescript
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { redis } from '@/config/redis';
import { registerPollNamespace } from './poll.namespace';
import { registerAnalyticsNamespace } from './analytics.namespace';

export function initSocketServer(httpServer: any): Server {
  const io = new Server(httpServer, {
    cors: { origin: env.FRONTEND_URL, credentials: true },
    transports: ['websocket', 'polling'],
  });

  // Redis adapter for multi-process pub/sub
  const pubClient = redis.duplicate();
  const subClient = redis.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  registerPollNamespace(io);
  registerAnalyticsNamespace(io);

  return io;
}
```

### Namespaces & Events

**`/polls` namespace** — public, no auth required:
- Client emits `join` with `{ slug }` → server joins socket to room `poll:${slug}`
- Server emits `poll:status` when poll status changes
- Server emits `poll:expired` when poll expires

**`/analytics` namespace** — requires valid JWT in `socket.handshake.auth.token`:
- Middleware verifies token, checks user owns the poll before joining room
- Client emits `join` with `{ pollId, token }` → joins `analytics:${pollId}`
- Server emits `analytics:update` with full analytics payload on new response
- Server emits `response:count` with `{ pollId, total }` on each new response

### Emitting from Controllers

Export a reference to the `io` instance and import it in services:

```typescript
// src/sockets/socket.server.ts — export io instance
export let io: Server;

// usage in response service after DB write:
import { io } from '@/sockets/socket.server';
io.of('/analytics').to(`analytics:${pollId}`).emit('analytics:update', analytics);
io.of('/analytics').to(`analytics:${pollId}`).emit('response:count', { pollId, total });
io.of('/polls').to(`poll:${slug}`).emit('poll:expired', { pollId });
```

---

## 13. Kafka Integration

### Topics

```
mayu.response.submitted    — partitions: 12
mayu.analytics.invalidate  — partitions: 4
mayu.poll.status.changed   — partitions: 4
```

### Producer (src/config/kafka.ts)

```typescript
import { Kafka } from 'kafkajs';
import { env } from './env';

export const kafka = new Kafka({
  clientId: env.KAFKA_CLIENT_ID,
  brokers: env.KAFKA_BROKERS,
  retry: { retries: 5, initialRetryTime: 300 },
});

export const producer = kafka.producer({
  allowAutoTopicCreation: false,
  idempotent: true,            // exactly-once semantics
  transactionTimeout: 30000,
});
```

### Consumer (src/workers/responseConsumer.ts)

```typescript
export async function startResponseConsumer(): Promise<void> {
  const consumer = kafka.consumer({ groupId: env.KAFKA_CONSUMER_GROUP });
  await consumer.subscribe({ topic: 'mayu.response.submitted', fromBeginning: false });

  await consumer.run({
    eachBatchAutoResolve: true,
    autoCommitInterval: 500,
    autoCommitThreshold: 100,
    eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
      for (const message of batch.messages) {
        const payload = JSON.parse(message.value!.toString());
        await writeResponseToDb(payload);
        await invalidateAnalyticsCache(payload.pollId);
        await emitSocketUpdate(payload.pollId, payload.slug);
        resolveOffset(message.offset);
        await heartbeat();
      }
    },
  });
}
```

### Graceful Fallback

Always wrap Kafka produce in try/catch. If Kafka is unavailable or `KAFKA_ENABLED=false`, write directly to DB.

```typescript
async function submitResponsePayload(payload: ResponsePayload) {
  if (env.KAFKA_ENABLED) {
    try {
      await producer.send({
        topic: 'mayu.response.submitted',
        messages: [{ key: payload.pollId, value: JSON.stringify(payload) }],
      });
      return 202;
    } catch (err) {
      logger.warn('Kafka unavailable, falling back to sync write', { error: err });
    }
  }
  await writeResponseToDb(payload);
  await invalidateAnalyticsCache(payload.pollId);
  await emitSocketUpdate(payload.pollId, payload.slug);
  return 201;
}
```

---

## 14. Testing Requirements

### Setup (vitest.config.ts)

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/helpers/setup.ts'],
    coverage: { reporter: ['text', 'lcov'], thresholds: { global: { lines: 80 } } },
  },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
```

### Database Helpers (tests/helpers/testDb.ts)

```typescript
import { prisma } from '@/config/database';

export async function cleanDatabase(): Promise<void> {
  // Delete in FK-safe order
  await prisma.$transaction([
    prisma.answer.deleteMany(),
    prisma.response.deleteMany(),
    prisma.option.deleteMany(),
    prisma.question.deleteMany(),
    prisma.poll.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.emailVerification.deleteMany(),
    prisma.passwordReset.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}
```

### Test Factories (tests/helpers/factories.ts)

```typescript
import bcrypt from 'bcrypt';
import { prisma } from '@/config/database';
import { issueAccessToken } from '@/modules/auth/token.service';
import { env } from '@/config/env';

export async function createTestUser(overrides: Partial<...> = {}) {
  const passwordHash = await bcrypt.hash('TestPassword1!', env.BCRYPT_ROUNDS);
  return prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      displayName: 'Test User',
      emailVerified: true,
      passwordHash,
      ...overrides,
    },
  });
}

export function generateAccessToken(userId: string, email = 'test@example.com', role = 'USER') {
  return issueAccessToken({ id: userId, email, role });
}

export async function createTestPoll(creatorId: string, overrides = {}) {
  return prisma.poll.create({
    data: {
      title: 'Test Poll',
      slug: `test-poll-${Date.now()}`,
      creatorId,
      status: 'ACTIVE',
      questions: {
        create: [{
          text: 'Favourite colour?',
          order: 1,
          isMandatory: true,
          options: { create: [{ text: 'Red', order: 1 }, { text: 'Blue', order: 2 }] },
        }],
      },
      ...overrides,
    },
    include: { questions: { include: { options: true } } },
  });
}
```

### Minimum Required Test Cases

Write ALL of these before considering testing done:

**Auth:**
- [ ] Register → 201 + user created + email not verified
- [ ] Register duplicate email → 409
- [ ] Login before email verified → 403
- [ ] Login correct → 200 + accessToken + httpOnly cookie set
- [ ] Login wrong password → 401
- [ ] 6th login in 15min → 429
- [ ] Refresh with valid cookie → 200 + new tokens + old revoked
- [ ] Refresh with revoked token → 401 + entire family revoked
- [ ] Logout → cookie cleared + token revoked
- [ ] Google callback invalid state → 400

**Polls:**
- [ ] Create poll (authenticated) → 201 + slug set
- [ ] Create poll unauthenticated → 401
- [ ] Create poll missing questions → 422
- [ ] Get active poll (no auth) → 200
- [ ] Get DRAFT poll (no auth) → 404 (treat draft as not found for public)
- [ ] Activate poll (owner) → 200
- [ ] Activate poll (non-owner) → 403
- [ ] Publish poll with 0 responses → 400

**Responses:**
- [ ] Submit to ACTIVE poll → 201
- [ ] Submit to EXPIRED poll → 410
- [ ] Submit to ACTIVE + requiresAuth, no token → 401
- [ ] Submit without answering mandatory question → 422
- [ ] Submit twice (authenticated user) → 409
- [ ] Submit twice (same sessionToken) → 409
- [ ] Submit with wrong optionId for question → 422

**Analytics:**
- [ ] Creator can get analytics → 200 with correct counts
- [ ] Non-owner cannot get analytics → 403
- [ ] Anyone can get results of PUBLISHED poll → 200
- [ ] Non-PUBLISHED poll results → 403
- [ ] Analytics cache invalidated on new response

---

## 15. Code Quality Rules

1. **No `any`** — use `unknown` and type guards if the shape is truly unknown.
2. **No raw `try/catch` swallowing errors** — either rethrow as `AppError` or log + rethrow.
3. **Async/await everywhere** — no `.then()` chains.
4. **All controllers are thin** — business logic belongs in services.
5. **Services are pure functions over DB + cache** — no direct response manipulation.
6. **Every Prisma query uses explicit `select` or `include`** — never return full models with passwordHash to routes.
7. **Never log passwords, tokens, or PII** — scrub sensitive fields before logging.
8. **Use `Promise.all`** when firing independent async calls — never await serially if parallel is possible.
9. **All public exports have JSDoc comments.**
10. **Run `tsc --noEmit` before marking any task done** — zero TypeScript errors.

---

## 16. Build & Run Commands

Add these to `package.json`:

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "start:pm2": "pm2 start ecosystem.config.js",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "db:generate": "prisma generate",
    "keys:generate": "node -e \"const c=require('crypto');const {privateKey,publicKey}=c.generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});require('fs').mkdirSync('./keys',{recursive:true});require('fs').writeFileSync('./keys/private.pem',privateKey);require('fs').writeFileSync('./keys/public.pem',publicKey);console.log('Keys generated')\"",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src --ext .ts",
    "typecheck": "tsc --noEmit"
  }
}
```

### PM2 Config (ecosystem.config.js)

```javascript
module.exports = {
  apps: [{
    name: 'mayu-api',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: { NODE_ENV: 'production' },
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    merge_logs: true,
    max_restarts: 10,
    restart_delay: 2000,
  }],
};
```

---

## 17. Task Execution Order

Execute backend tasks in this exact order. Mark each `[x]` when complete and verified (TypeScript compiles, tests pass).

```
PHASE 1 — Foundation
[ ] B-01  Init TypeScript project, tsconfig (strict, paths alias @/)
[ ] B-02  Install all dependencies (see Section 2)
[ ] B-03  src/config/env.ts — Zod env validation, crashes on invalid
[ ] B-04  src/utils/logger.ts — Winston, JSON format, level from env
[ ] B-05  src/middleware/requestId.ts — attach UUID to every request
[ ] B-06  src/utils/errors.ts — AppError class
[ ] B-07  src/middleware/errorHandler.ts — global error handler
[ ] B-08  src/app.ts — Express factory with all global middleware
[ ] B-09  src/server.ts — HTTP server entry, listen, graceful shutdown
[ ] B-10  docker-compose.yml — postgres, redis, kafka, zookeeper
[ ] B-11  prisma/schema.prisma — full schema as per Section 5
[ ] B-12  prisma migrate dev --name init
[ ] B-13  src/config/database.ts — Prisma singleton
[ ] B-14  src/config/redis.ts — ioredis singleton
[ ] B-15  npm run keys:generate — generate RS256 key pair

PHASE 2 — Authentication
[ ] B-16  src/modules/auth/token.service.ts — full implementation (Section 7.1)
[ ] B-17  src/middleware/auth.ts — requireAuth + optionalAuth
[ ] B-18  src/modules/auth/auth.schema.ts — Zod schemas for all auth endpoints
[ ] B-19  src/modules/auth/auth.service.ts — register, login, verify email, forgot/reset password
[ ] B-20  src/modules/auth/google.service.ts — full custom OIDC implementation (Section 7.3)
[ ] B-21  src/modules/auth/auth.controller.ts — all endpoints
[ ] B-22  src/modules/auth/auth.routes.ts — mount routes, apply middleware
[ ] B-23  src/middleware/rateLimiter.ts — Redis-backed rate limiter factory
[ ] B-24  Unit tests: token.service.test.ts
[ ] B-25  Integration tests: auth.test.ts (all cases from Section 14)

PHASE 3 — Polls
[ ] B-26  src/utils/slugify.ts
[ ] B-27  src/modules/polls/polls.schema.ts
[ ] B-28  src/modules/polls/polls.service.ts — CRUD + status transitions + expiry cron
[ ] B-29  src/modules/polls/polls.controller.ts
[ ] B-30  src/modules/polls/polls.routes.ts
[ ] B-31  Integration tests: polls.test.ts

PHASE 4 — Responses
[ ] B-32  src/modules/responses/responses.schema.ts
[ ] B-33  src/modules/responses/responses.service.ts — validation, dedup, sync write path
[ ] B-34  src/modules/responses/responses.controller.ts
[ ] B-35  src/modules/responses/responses.routes.ts
[ ] B-36  Integration tests: responses.test.ts

PHASE 5 — Analytics
[ ] B-37  src/utils/analytics.ts — pure compute functions
[ ] B-38  src/modules/analytics/analytics.service.ts — compute + Redis cache
[ ] B-39  src/modules/analytics/analytics.controller.ts
[ ] B-40  src/modules/analytics/analytics.routes.ts
[ ] B-41  Integration tests: analytics.test.ts

PHASE 6 — WebSockets
[ ] B-42  src/sockets/socket.server.ts — init + Redis adapter
[ ] B-43  src/sockets/poll.namespace.ts
[ ] B-44  src/sockets/analytics.namespace.ts — JWT auth guard
[ ] B-45  Wire socket emission into responses.service.ts and polls.service.ts

PHASE 7 — Kafka
[ ] B-46  src/config/kafka.ts — producer + consumer factory
[ ] B-47  Kafka topic creation on startup
[ ] B-48  Async produce path in responses.service.ts + graceful fallback
[ ] B-49  src/workers/responseConsumer.ts — batch consumer
[ ] B-50  Start consumer in server.ts when KAFKA_ENABLED=true

PHASE 8 — Final Checks
[ ] B-51  npm run typecheck — zero errors
[ ] B-52  npm run test:coverage — all thresholds met
[ ] B-53  Verify all endpoints match Section 6 exactly
[ ] B-54  Review all logs — no sensitive data (passwords, tokens) logged
[ ] B-55  Test cold start: fresh DB migration → seed → all tests green
```

---

## 18. Redis Key Reference

```
auth:blacklist:{jti}               → "1"            TTL: until token expiry
oauth:state:{state}                → codeVerifier   TTL: 600s
dedup:{pollId}:{respondentIdentifier} → "1"         TTL: 30d
poll:analytics:{pollId}            → JSON string    TTL: 30s
rate:{ip}:{endpoint}               → count          TTL: windowMs
```

---

## 19. Logging Conventions

```typescript
// ✅ Correct
logger.info('User registered', { userId: user.id, requestId: req.requestId });
logger.warn('Rate limit hit', { ip: req.ip, endpoint: req.path });
logger.error('DB write failed', { error: err.message, pollId });

// ❌ Never
logger.info('Login', { password: req.body.password });     // log PII
logger.info('Token issued', { token: accessToken });        // log credentials
console.log('something');                                    // never use console
```

---

*CLAUDE.md v1.0 — MaYu Backend — May 2026*
*This file is the canonical instruction set. Re-read it at the start of each coding session.*