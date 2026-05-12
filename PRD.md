# PulseBoard — Product Requirements Document
### *Live Polls. Real Feedback. Instant Insight.*

**Project Codename:** `MaYu` *(Makoto Yu — Japanese: "truth pulse")*
**Full Product Name:** **MaYu — Live Poll Intelligence**
**Version:** 1.0 — Hackathon Edition
**Date:** May 2026
**Prepared by:** Engineering Lead

---

## Table of Contents

1. [Project Overview & Naming](#1-project-overview--naming)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [System Architecture Diagram](#3-system-architecture-diagram)
4. [Database Schema Design](#4-database-schema-design)
5. [Backend PRD — Claude Tasks](#5-backend-prd--claude-tasks)
6. [Frontend PRD — Gemini Tasks](#6-frontend-prd--gemini-tasks)
7. [WebSocket & Real-Time Events](#7-websocket--real-time-events)
8. [Kafka Integration Strategy](#8-kafka-integration-strategy)
9. [Authentication Flows](#9-authentication-flows)
10. [Testing Requirements](#10-testing-requirements)
11. [API Reference Catalog](#11-api-reference-catalog)
12. [Environment & Deployment Config](#12-environment--deployment-config)
13. [IDE Task Breakdown](#13-ide-task-breakdown)

---

## 1. Project Overview & Naming

### 1.1 Recommended Project Name

> ## **MaYu**
> *Japanese: 眞由 — "True Reason" or "Truth Pulse"*

**Why MaYu:**
- Japanese-themed, fits the UI aesthetic brief perfectly
- Short, pronounceable, memorable globally
- "Ma" (間) in Japanese philosophy means "the pause between" — the moment before truth surfaces, which is exactly what a live poll captures
- "Yu" (由) means "reason" or "origin"
- Domain-friendly: `mayu.app`, `getmayu.com`, `mayu.io`

**Tagline:** *"From question to clarity — in real time."*

**Alternate options:**
| Name | Meaning | Notes |
|------|---------|-------|
| **Hibiki** | 響 — Resonance/Echo | Polls resonating with audiences |
| **Nami** | 波 — Wave | Wave of responses |
| **Satori** | 悟り — Sudden insight | Analytics insight |
| **MaYu** ⭐ | 眞由 — True pulse | **Recommended** |

---

### 1.2 Vision

MaYu is a production-grade, full-stack SaaS platform for creating live polls, collecting audience feedback, and viewing real-time analytics. Poll creators get deep insights; respondents get a frictionless, elegant experience. Everything updates live via WebSockets.

### 1.3 Core User Roles

| Role | Description |
|------|-------------|
| **Creator** | Authenticated user who creates polls, manages settings, views analytics |
| **Respondent** | Anyone with a poll link — authenticated or anonymous depending on poll settings |
| **Public Viewer** | Anyone who visits a published (results-released) poll link |

---

## 2. Tech Stack & Architecture

### 2.1 Backend (Claude's Responsibility)

| Layer | Technology | Notes |
|-------|-----------|-------|
| Runtime | Node.js 20 LTS | LTS for stability |
| Framework | Express.js 5.x | With async error handling built in |
| Language | TypeScript 5.x | Strict mode, full types |
| Database | PostgreSQL 16 | Primary data store |
| ORM | Prisma 5.x | Schema-first, type-safe queries |
| Cache | Redis 7 | Sessions, rate limiting, pub/sub bridge |
| Auth | Custom JWT + Google OAuth2/OIDC | No Passport.js or Auth0 |
| WebSockets | Socket.io 4.x | Namespaced, room-based |
| Message Queue | Apache Kafka | For high-scale response ingestion |
| Email | Nodemailer + SMTP | Verification, notifications |
| File Storage | AWS S3 / Cloudflare R2 | Poll assets (optional) |
| API Docs | Swagger / OpenAPI 3.1 | Auto-generated from JSDoc |
| Testing | Vitest + Supertest | Unit + Integration |
| Logging | Winston + Pino | Structured JSON logs |
| Validation | Zod | Runtime schema validation |
| Rate Limiting | Redis-backed express-rate-limit | Per-IP and per-user |
| Process Manager | PM2 | Clustering + graceful restart |

### 2.2 Frontend (Gemini's Responsibility)

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | React 18 + Vite | Fast HMR, optimized builds |
| Language | TypeScript 5.x | Strict mode |
| State | Zustand + React Query (TanStack) | Local + server state |
| Routing | React Router v6 | Protected + public routes |
| Styling | Tailwind CSS 3.x | JIT, custom design tokens |
| Animations | Framer Motion | Japanese-aesthetic motion design |
| Forms | React Hook Form + Zod | Client-side validation |
| WebSocket Client | Socket.io-client | Real-time updates |
| Icons | Lucide React | Minimal, clean icons |
| Charts | Recharts | Analytics dashboard |
| UI Theme | Custom — Japanese Minimalist | Wabi-sabi aesthetic |
| Testing | Vitest + React Testing Library | Component tests |

### 2.3 Infrastructure

```
┌─────────────────────────────────────┐
│           Cloudflare CDN            │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         NGINX Reverse Proxy         │
│   (SSL termination, rate limiting)  │
└──────┬──────────────────┬───────────┘
       │                  │
┌──────▼──────┐    ┌──────▼──────────┐
│  React SPA  │    │  Express API    │
│  (Static)   │    │  (Node.js)      │
└─────────────┘    └──────┬──────────┘
                          │
              ┌───────────┼────────────┐
              │           │            │
       ┌──────▼──┐  ┌─────▼──┐  ┌────▼────┐
       │PostgreSQL│  │ Redis  │  │  Kafka  │
       │ (Primary)│  │ Cache  │  │ Cluster │
       └──────────┘  └────────┘  └─────────┘
```

---

## 3. System Architecture Diagram

### 3.1 Request Flow

```
Browser → Cloudflare → NGINX
       → /api/*    → Express (Node.js cluster via PM2)
                   → Prisma → PostgreSQL
                   → ioredis → Redis
                   → KafkaJS → Kafka → Consumer Workers
       → /socket.io → Socket.io Server
                    → Redis Adapter (multi-node pub/sub)
       → /*        → React SPA (static files)
```

### 3.2 Auth Flow Overview

```
Email/Password:
  POST /auth/register → hash password → create user → send verify email
  GET  /auth/verify-email?token= → verify → activate account
  POST /auth/login → verify → issue accessToken (15m) + refreshToken (7d, httpOnly cookie)

Google OAuth2 (Custom OIDC, no Passport):
  GET  /auth/google → redirect to Google OAuth2 consent URL
  GET  /auth/google/callback → exchange code → fetch userinfo → upsert user → issue tokens

Token Refresh:
  POST /auth/refresh → read refreshToken cookie → rotate → issue new accessToken
  POST /auth/logout  → invalidate refreshToken in Redis blacklist
```

---

## 4. Database Schema Design

### 4.1 Prisma Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Users ───────────────────────────────────────────────

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  emailVerified   Boolean   @default(false)
  displayName     String
  avatarUrl       String?
  passwordHash    String?   // null for OAuth-only users
  googleId        String?   @unique
  role            Role      @default(USER)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  polls           Poll[]
  responses       Response[]
  sessions        RefreshToken[]
}

enum Role {
  USER
  ADMIN
}

model RefreshToken {
  id          String   @id @default(cuid())
  token       String   @unique
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt   DateTime
  revokedAt   DateTime?
  createdAt   DateTime @default(now())
  userAgent   String?
  ipAddress   String?

  @@index([userId])
  @@index([token])
}

model EmailVerification {
  id          String   @id @default(cuid())
  email       String
  token       String   @unique
  expiresAt   DateTime
  usedAt      DateTime?
  createdAt   DateTime @default(now())
}

model PasswordReset {
  id          String   @id @default(cuid())
  userId      String
  token       String   @unique
  expiresAt   DateTime
  usedAt      DateTime?
  createdAt   DateTime @default(now())
}

// ─── Polls ────────────────────────────────────────────────

model Poll {
  id              String      @id @default(cuid())
  slug            String      @unique   // URL-friendly identifier
  creatorId       String
  creator         User        @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  title           String
  description     String?
  isAnonymous     Boolean     @default(true)
  requiresAuth    Boolean     @default(false)
  status          PollStatus  @default(DRAFT)
  expiresAt       DateTime?
  publishedAt     DateTime?   // when results were published
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  questions       Question[]
  responses       Response[]

  @@index([creatorId])
  @@index([slug])
  @@index([status])
  @@index([expiresAt])
}

enum PollStatus {
  DRAFT
  ACTIVE
  EXPIRED
  PUBLISHED   // results visible to public
}

model Question {
  id              String    @id @default(cuid())
  pollId          String
  poll            Poll      @relation(fields: [pollId], references: [id], onDelete: Cascade)
  text            String
  isMandatory     Boolean   @default(true)
  order           Int       // display order
  createdAt       DateTime  @default(now())

  options         Option[]
  answers         Answer[]

  @@index([pollId])
  @@unique([pollId, order])
}

model Option {
  id          String    @id @default(cuid())
  questionId  String
  question    Question  @relation(fields: [questionId], references: [id], onDelete: Cascade)
  text        String
  order       Int

  answers     Answer[]

  @@index([questionId])
  @@unique([questionId, order])
}

// ─── Responses ────────────────────────────────────────────

model Response {
  id              String    @id @default(cuid())
  pollId          String
  poll            Poll      @relation(fields: [pollId], references: [id], onDelete: Cascade)
  respondentId    String?   // null if anonymous
  respondent      User?     @relation(fields: [respondentId], references: [id], onDelete: SetNull)
  sessionToken    String?   // fingerprint for dedup on anonymous polls
  submittedAt     DateTime  @default(now())
  ipAddress       String?
  userAgent       String?

  answers         Answer[]

  @@index([pollId])
  @@index([respondentId])
  @@index([sessionToken])
  @@unique([pollId, respondentId])    // one response per authenticated user per poll
  @@unique([pollId, sessionToken])    // one response per session per anonymous poll
}

model Answer {
  id          String    @id @default(cuid())
  responseId  String
  response    Response  @relation(fields: [responseId], references: [id], onDelete: Cascade)
  questionId  String
  question    Question  @relation(fields: [questionId], references: [id], onDelete: Cascade)
  optionId    String
  option      Option    @relation(fields: [optionId], references: [id], onDelete: Cascade)

  @@index([responseId])
  @@index([questionId])
  @@index([optionId])
  @@unique([responseId, questionId])  // one answer per question per response
}
```

### 4.2 Redis Key Conventions

```
auth:refresh:{token}          → userId (TTL: 7d)
auth:blacklist:{jti}          → "1" (TTL: until expiry)
poll:analytics:{pollId}       → JSON snapshot (TTL: 30s, refresh on write)
rate:ip:{ip}:{endpoint}       → counter (TTL: 1m)
rate:user:{userId}:{endpoint} → counter (TTL: 1m)
session:anon:{fingerprint}    → pollId list
```

---

## 5. Backend PRD — Claude Tasks

### 5.1 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── env.ts              # Zod-validated env vars
│   │   ├── database.ts         # Prisma client singleton
│   │   ├── redis.ts            # ioredis client
│   │   └── kafka.ts            # KafkaJS producer/consumer
│   ├── middleware/
│   │   ├── auth.ts             # JWT verification, attach req.user
│   │   ├── optionalAuth.ts     # Attach user if token present
│   │   ├── rateLimiter.ts      # Redis-backed rate limiting
│   │   ├── validate.ts         # Zod body/query validation
│   │   ├── errorHandler.ts     # Global error handler
│   │   └── requestId.ts        # X-Request-ID header
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.schema.ts      # Zod schemas
│   │   │   ├── google.service.ts   # Custom Google OIDC
│   │   │   └── token.service.ts    # JWT + refresh token logic
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
│   │   └── responseConsumer.ts     # Kafka consumer → DB writer
│   ├── sockets/
│   │   ├── socket.server.ts        # Socket.io initialization
│   │   ├── poll.namespace.ts       # /polls namespace handlers
│   │   └── analytics.namespace.ts  # /analytics namespace handlers
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── slugify.ts
│   │   ├── crypto.ts
│   │   ├── pagination.ts
│   │   └── analytics.ts            # Compute analytics from DB
│   ├── types/
│   │   ├── express.d.ts            # Extend req.user
│   │   └── index.ts
│   └── app.ts                      # Express app setup (no listen)
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── tests/
│   ├── unit/
│   │   ├── auth.service.test.ts
│   │   ├── token.service.test.ts
│   │   └── analytics.service.test.ts
│   ├── integration/
│   │   ├── auth.routes.test.ts
│   │   ├── polls.routes.test.ts
│   │   ├── responses.routes.test.ts
│   │   └── analytics.routes.test.ts
│   └── helpers/
│       ├── testDb.ts
│       └── factories.ts
├── server.ts                       # HTTP server + PM2 entry
├── package.json
├── tsconfig.json
├── .env.example
└── docker-compose.yml
```

### 5.2 Module-by-Module Requirements

#### AUTH MODULE

**Endpoints:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | Public | Email/password registration |
| POST | `/auth/login` | Public | Email/password login |
| POST | `/auth/refresh` | Cookie | Rotate refresh token |
| POST | `/auth/logout` | Cookie | Revoke refresh token |
| GET | `/auth/google` | Public | Initiate Google OAuth2 |
| GET | `/auth/google/callback` | Public | Google OAuth2 callback |
| POST | `/auth/verify-email` | Public | Verify email with token |
| POST | `/auth/resend-verification` | Public | Resend verification email |
| POST | `/auth/forgot-password` | Public | Send password reset email |
| POST | `/auth/reset-password` | Public | Reset password with token |
| GET | `/auth/me` | Bearer | Get current user profile |
| PATCH | `/auth/me` | Bearer | Update display name/avatar |

**Security Requirements:**
- Passwords hashed with `bcrypt` (cost factor 12)
- Access tokens: JWT RS256 (asymmetric), 15-minute TTL
- Refresh tokens: cryptographically random 64-byte hex, stored hashed in DB, 7-day TTL, `httpOnly; Secure; SameSite=Strict` cookie
- Token rotation on every refresh (old token invalidated immediately)
- Refresh token family tracking (detect reuse attacks → revoke all tokens in family)
- Email verification required before login (configurable)
- Rate limiting: 5 attempts / 15 min per IP on `/auth/login`
- All sensitive endpoints have `X-Request-ID` tracing

**Google OAuth2 (Custom — No Passport, No third-party SDK):**
```
Step 1: GET /auth/google
  → Generate `state` (CSRF token, store in Redis 10min)
  → Generate `code_verifier` + `code_challenge` (PKCE S256)
  → Store verifier in Redis keyed by state
  → Redirect to:
    https://accounts.google.com/o/oauth2/v2/auth?
      client_id=...&redirect_uri=...&response_type=code
      &scope=openid email profile&state=...&code_challenge=...
      &code_challenge_method=S256&access_type=offline

Step 2: GET /auth/google/callback?code=...&state=...
  → Validate state against Redis (prevent CSRF)
  → Retrieve code_verifier from Redis
  → POST to https://oauth2.googleapis.com/token (code + verifier)
  → Receive { access_token, id_token, refresh_token }
  → Verify id_token signature against Google's JWKS
    (fetch https://www.googleapis.com/oauth2/v3/certs, cache 24h)
  → Extract { sub, email, name, picture } from id_token claims
  → Upsert user (find by googleId or email)
  → Issue MaYu accessToken + refreshToken
  → Redirect to frontend with accessToken in URL fragment (short-lived, 30s)
```

#### POLLS MODULE

**Endpoints:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/polls` | Bearer | Create a new poll |
| GET | `/polls` | Bearer | List creator's polls (paginated) |
| GET | `/polls/:slug` | Optional | Get poll detail (public if active/published) |
| PATCH | `/polls/:slug` | Bearer (owner) | Update poll settings |
| DELETE | `/polls/:slug` | Bearer (owner) | Delete poll |
| POST | `/polls/:slug/activate` | Bearer (owner) | Set status to ACTIVE |
| POST | `/polls/:slug/close` | Bearer (owner) | Set status to EXPIRED |
| POST | `/polls/:slug/publish` | Bearer (owner) | Publish results (PUBLISHED) |
| GET | `/polls/:slug/share` | Bearer (owner) | Get shareable link + QR data |

**Business Logic:**
- Auto-generate unique `slug` from title (e.g., `my-poll-abc123`)
- Enforce expiry: cron job every minute marks `ACTIVE` polls past `expiresAt` as `EXPIRED`; also checked on every response submission
- A poll can only be PUBLISHED after it has at least 1 response
- Questions and options are created in the same request as poll creation (atomic)
- Maximum 20 questions per poll, maximum 10 options per question

**Create Poll Request Schema:**
```json
{
  "title": "Team Lunch Preferences",
  "description": "Optional",
  "isAnonymous": true,
  "requiresAuth": false,
  "expiresAt": "2026-05-30T18:00:00Z",
  "questions": [
    {
      "text": "What cuisine do you prefer?",
      "isMandatory": true,
      "options": [
        { "text": "Japanese" },
        { "text": "Italian" },
        { "text": "Mexican" }
      ]
    }
  ]
}
```

#### RESPONSES MODULE

**Endpoints:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/polls/:slug/respond` | Optional/Required | Submit a response |
| GET | `/polls/:slug/responses` | Bearer (owner) | List responses (paginated, if poll is not anonymous) |

**Business Logic:**
- If `requiresAuth=true` → reject unauthenticated respondents
- If `isAnonymous=false` → attach respondentId to response
- Deduplication: one response per authenticated user per poll, one per `sessionToken` (browser fingerprint) for anonymous polls
- Validate all mandatory questions are answered before accepting
- Validate option belongs to question, question belongs to poll
- On submission → produce Kafka event `response.submitted` (or direct DB write if Kafka unavailable)
- After DB write → emit Socket.io event to poll's room with updated counts
- Check `expiresAt` before accepting (return 410 Gone if expired)

**Submit Response Schema:**
```json
{
  "sessionToken": "anon-fingerprint-uuid",
  "answers": [
    { "questionId": "cld_xxx", "optionId": "cld_yyy" }
  ]
}
```

#### ANALYTICS MODULE

**Endpoints:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/polls/:slug/analytics` | Bearer (owner) | Full analytics for creator |
| GET | `/polls/:slug/results` | Public (if PUBLISHED) | Public results view |

**Analytics Response Shape:**
```json
{
  "pollId": "...",
  "title": "...",
  "status": "ACTIVE",
  "totalResponses": 142,
  "expiresAt": "2026-05-30T18:00:00Z",
  "questions": [
    {
      "id": "...",
      "text": "What cuisine do you prefer?",
      "isMandatory": true,
      "totalAnswered": 140,
      "skippedCount": 2,
      "options": [
        { "id": "...", "text": "Japanese", "count": 87, "percentage": 62.1 },
        { "id": "...", "text": "Italian",  "count": 35, "percentage": 25.0 },
        { "id": "...", "text": "Mexican",  "count": 18, "percentage": 12.9 }
      ]
    }
  ],
  "participation": {
    "completionRate": 98.6,
    "responsesByHour": [...]
  }
}
```

**Performance:** Analytics are computed and cached in Redis for 30 seconds. Cache invalidated on each new response (via Kafka consumer or direct write). Never compute analytics in real-time on every request.

---

## 6. Frontend PRD — Gemini Tasks

### 6.1 Design Philosophy

**Theme: Japanese Wabi-Sabi Minimalism**

The aesthetic centers on intentional emptiness, refined simplicity, and the beauty of incompleteness. Think: ink wash paintings, traditional paper textures, subtle gradients like morning mist, precise typographic hierarchy.

**Color Palette:**
```
Primary Background:  #F5F2ED  (warm rice paper white)
Secondary BG:        #EDE8E1  (aged parchment)
Text Primary:        #1A1714  (ink black)
Text Secondary:      #6B6560  (warm ash)
Accent:              #C44B2B  (vermillion — traditional Japanese red)
Accent Soft:         #E8A49A  (diluted vermillion)
Success:             #3A7D5E  (moss green)
Border:              #D4CFC9  (pale rice paper fold)
Dark Background:     #12100E  (charcoal — for dark mode)
```

**Typography:**
```
Display:  "Noto Serif JP" (for headings — elegant Japanese serif)
Body:     "Inter" or "DM Sans" (clean, neutral body text)
Mono:     "JetBrains Mono" (for IDs, codes)
```

**Motion Principles:**
- Transitions should feel like ink settling on paper — smooth, intentional
- No bouncy springs. Use `ease` curves with 200–400ms duration
- Page transitions: subtle horizontal slide or opacity fade
- Data updates: number counts increment smoothly

### 6.2 Page Inventory

| Page | Route | Auth | Description |
|------|-------|------|-------------|
| Landing | `/` | Public | SaaS marketing page |
| Sign Up | `/signup` | Public | Email/Google registration |
| Sign In | `/signin` | Public | Email/Google login |
| Email Verify | `/verify-email` | Public | Post-registration prompt |
| Dashboard | `/dashboard` | Protected | Poll list + quick stats |
| Create Poll | `/polls/new` | Protected | Multi-step poll builder |
| Edit Poll | `/polls/:slug/edit` | Protected (owner) | Edit draft poll |
| Poll Analytics | `/polls/:slug/analytics` | Protected (owner) | Live analytics dashboard |
| Public Poll | `/p/:slug` | Optional/Required | Respondent-facing poll |
| Results | `/p/:slug/results` | Public (if published) | Published results view |
| 404 | `*` | — | Elegant 404 page |

### 6.3 Page Specifications

#### LANDING PAGE (`/`)

**Hero Section:**
- Full-viewport height
- Headline: "Pulse the room. Instantly."
- Subheadline: "Create beautiful polls, gather real-time feedback, and understand your audience — all in one place."
- CTA: "Start for free" (→ /signup) + "See a live demo" (opens demo poll)
- Animated background: subtle ink-wash SVG animation, gently shifting like water

**Features Section:**
- 3 columns: "Create in seconds", "Collect in real-time", "Understand at a glance"
- Each with a minimal icon and 2-line description
- Animated on scroll-in

**Live Counter Section:**
- "X polls created globally" counter (animated, pulls from public API endpoint)
- Social proof strip

**How It Works Section:**
- 3-step numbered process with a visual of poll builder → share link → analytics dashboard
- Subtle step connector lines (ink-style)

**Pricing Section (optional):**
- Free tier vs Pro tier cards
- Clean comparison, vermillion accent on recommended plan

**Footer:**
- Logo, tagline, nav links, social links

#### DASHBOARD (`/dashboard`)

**Header Stats Row:**
- Total polls created
- Total responses received
- Active polls right now

**Poll List:**
- Card grid (2 columns on desktop, 1 on mobile)
- Each card: poll title, status badge (DRAFT/ACTIVE/EXPIRED/PUBLISHED), response count, expiry countdown, share icon, analytics icon, 3-dot menu (edit, close, delete, publish)
- Status badges use semantic colors (vermillion for active, ash for expired, moss for published)
- Empty state: elegant illustration + "Create your first poll"

**Quick Create:**
- Floating button (vermillion circle with + icon)
- Opens create poll flow

#### CREATE POLL (`/polls/new`)

**Multi-step form (3 steps):**

Step 1 — Poll Settings:
- Title (required)
- Description (optional)
- Anonymous responses toggle
- Require authentication toggle
- Expiry date/time picker (optional)

Step 2 — Questions:
- Drag-to-reorder question list
- Add question button
- Per question: question text, mandatory toggle, add options button
- Per option: option text, drag to reorder, delete
- Inline validation (min 2 options per question)
- Preview panel on right side showing poll as respondent will see it

Step 3 — Review & Launch:
- Summary of all settings
- Preview of all questions
- "Save as Draft" or "Activate Poll" buttons
- On activate: show shareable link with copy button + QR code

#### PUBLIC POLL (`/p/:slug`)

**Design Goals:**
- Extremely clean, distraction-free
- Single-page scroll through all questions
- Progress bar at top (X of Y questions answered)
- Each question rendered as a card

**Question Card:**
- Question text (large, Noto Serif JP)
- Options as styled radio buttons — large tap targets, vermillion selected state
- Mandatory indicator (subtle red asterisk)
- Smooth transition between questions if paginated

**Submit Flow:**
- "Submit Response" button (disabled until all mandatory questions answered)
- On submit: smooth loader → success state with animated confirmation
- If poll expired: elegant message "This poll has ended" with ink-wash illustration
- If already responded: "You've already shared your feedback" message

#### ANALYTICS DASHBOARD (`/polls/:slug/analytics`)

**Layout:**
- Full-width header with poll title, status, copy link, close/publish buttons
- Real-time indicator: live green dot + "Live" badge when poll is active

**Stats Row:**
- Total responses (large number, increments live)
- Completion rate
- Time remaining (countdown)
- Response trend (tiny sparkline)

**Question Analytics:**
- Horizontal bar chart per question (Recharts)
- Option text on left, bar extending right, count + % on right
- Bars animate in on load, update smoothly on new response
- "Winning" option bar slightly bolder/vermillion

**Response Timeline:**
- Area chart showing responses over time
- Useful to see engagement spikes (e.g. after sharing the link)

**Real-Time Update:**
- Socket.io connection to `/analytics` namespace
- When new response arrives → animate counter increment → update bar widths smoothly

**Publish Results Button:**
- Prominent at top-right
- Confirmation modal: "Once published, anyone with the link can see results"
- After publish: status changes, button becomes "Results Published ✓"

#### RESULTS PAGE (`/p/:slug/results`)

**Design:**
- Clean, certificate-like layout
- "Final Results" heading
- Each question with final percentages as bar chart
- Total response count prominently displayed
- "Created with MaYu" watermark footer

### 6.4 Component Library (Shared)

```
components/
├── ui/
│   ├── Button/           # Primary, secondary, ghost, danger variants
│   ├── Input/            # Text, email, password with validation states
│   ├── Textarea/
│   ├── Toggle/           # Custom toggle switch (animated)
│   ├── Badge/            # Status badges with semantic colors
│   ├── Card/             # Container card with hover state
│   ├── Modal/            # Accessible modal with Framer Motion animation
│   ├── Spinner/          # Loading indicator
│   ├── Toast/            # Notification toasts (bottom-right)
│   ├── Avatar/           # User avatar with initials fallback
│   ├── DateTimePicker/   # Custom date/time input
│   └── Tooltip/
├── layout/
│   ├── Navbar/
│   ├── Sidebar/
│   └── PageContainer/
├── poll/
│   ├── QuestionCard/
│   ├── OptionItem/
│   ├── PollCard/         # Dashboard list item
│   └── ProgressBar/
├── analytics/
│   ├── BarChart/         # Question analytics bar
│   ├── StatCard/         # Single metric
│   ├── TimelineChart/    # Response over time
│   └── LiveIndicator/    # Real-time green dot
└── auth/
    ├── GoogleSignInButton/
    └── ProtectedRoute/
```

---

## 7. WebSocket & Real-Time Events

### 7.1 Namespaces

```
/analytics  → Poll analytics updates (only poll owner)
/polls      → Poll status updates (public)
```

### 7.2 Event Catalog

**Server → Client:**

| Namespace | Event | Payload | Consumers |
|-----------|-------|---------|-----------|
| `/analytics` | `analytics:update` | Full analytics object | Poll owner dashboard |
| `/analytics` | `response:count` | `{ pollId, total }` | Poll owner |
| `/polls` | `poll:status` | `{ pollId, status }` | Public poll page |
| `/polls` | `poll:expired` | `{ pollId }` | Public poll page |

**Client → Server:**

| Namespace | Event | Payload | Description |
|-----------|-------|---------|-------------|
| `/analytics` | `join` | `{ pollId, token }` | Join poll's analytics room |
| `/analytics` | `leave` | `{ pollId }` | Leave analytics room |
| `/polls` | `join` | `{ slug }` | Subscribe to poll status |

### 7.3 Authentication for Sockets

```typescript
// /analytics namespace requires JWT in handshake auth
io.of('/analytics').use((socket, next) => {
  const token = socket.handshake.auth.token;
  // verify JWT, check user owns the poll they're subscribing to
  verifyAccessToken(token).then(user => {
    socket.data.user = user;
    next();
  }).catch(() => next(new Error('Unauthorized')));
});
```

### 7.4 Room Strategy

```
poll analytics room: `analytics:${pollId}`  (only owner can join)
poll public room:    `poll:${slug}`          (anyone can join)
```

### 7.5 Redis Adapter

For horizontal scaling (multiple Node.js processes / pods):
```typescript
import { createAdapter } from '@socket.io/redis-adapter';
const pubClient = redis.duplicate();
const subClient = redis.duplicate();
io.adapter(createAdapter(pubClient, subClient));
```

---

## 8. Kafka Integration Strategy

### 8.1 Why Kafka

Under high poll load (hundreds of simultaneous respondents), direct DB writes from the HTTP response handler create a bottleneck. Kafka decouples ingestion from persistence.

### 8.2 Topics

| Topic | Description | Partitions |
|-------|-------------|------------|
| `mayu.response.submitted` | New response event | 12 |
| `mayu.analytics.invalidate` | Cache invalidation signal | 4 |
| `mayu.poll.status.changed` | Poll ACTIVE/EXPIRED/PUBLISHED | 4 |

### 8.3 Response Flow (High Load Path)

```
POST /polls/:slug/respond
  → Validate request
  → Check deduplication (Redis: SET NX)
  → Produce to Kafka `mayu.response.submitted`
  → Return 202 Accepted immediately

Kafka Consumer (responseConsumer.ts):
  → Consume event
  → Write Response + Answers to PostgreSQL (batch writes with buffering)
  → Invalidate Redis analytics cache
  → Emit Socket.io event via Redis adapter
```

### 8.4 Graceful Fallback

```typescript
// If Kafka is unavailable, fall back to synchronous DB write
async function submitResponse(data: ResponseData) {
  try {
    await kafkaProducer.send({ topic: 'mayu.response.submitted', messages: [{ value: JSON.stringify(data) }] });
    return { mode: 'async', status: 202 };
  } catch (kafkaError) {
    logger.warn('Kafka unavailable, falling back to sync write');
    await prisma.response.create({ data: transformResponseData(data) });
    return { mode: 'sync', status: 201 };
  }
}
```

### 8.5 Consumer Configuration

```typescript
const consumer = kafka.consumer({
  groupId: 'mayu-response-writers',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
});

// Batch commit every 500ms or 100 messages — whichever comes first
await consumer.run({
  eachBatchAutoResolve: true,
  autoCommitInterval: 500,
  autoCommitThreshold: 100,
  eachBatch: async ({ batch }) => {
    await writeBatchToDb(batch.messages);
    await invalidateAnalyticsCache(batch.messages);
    await emitSocketEvents(batch.messages);
  }
});
```

---

## 9. Authentication Flows

### 9.1 Email/Password Registration

```
1. POST /auth/register { email, password, displayName }
2. Server: validate → check email unique → hash password (bcrypt 12)
3. Create User (emailVerified: false)
4. Generate email verification token (crypto.randomBytes(32).toString('hex'))
5. Store in EmailVerification table (TTL: 24h)
6. Send verification email via Nodemailer
7. Return 201 { message: "Check your email to verify your account" }

8. User clicks email link: GET /auth/verify-email?token=xxx
9. Server: find token → check not expired → update emailVerified=true → delete token
10. Return 200 { message: "Email verified. You can now log in." }
```

### 9.2 Login

```
1. POST /auth/login { email, password }
2. Server: find user by email → check emailVerified → compare password (bcrypt.compare)
3. Generate accessToken (JWT RS256, 15m, payload: { sub: userId, email, role, jti: uuid })
4. Generate refreshToken (crypto.randomBytes(64).toString('hex'))
5. Hash refreshToken (SHA256) and store in RefreshToken table
6. Set refreshToken as httpOnly cookie (Set-Cookie header)
7. Return 200 { accessToken, user: { id, email, displayName, avatarUrl } }
```

### 9.3 Token Refresh

```
1. POST /auth/refresh (no body — reads httpOnly cookie)
2. Server: read refreshToken cookie → hash it → find in DB
3. Check: not revoked, not expired, user still exists
4. Mark old token as revokedAt = now()
5. Generate new accessToken + new refreshToken (rotation)
6. Store new refreshToken hash in DB (links to same family)
7. Set new refreshToken cookie
8. Return 200 { accessToken }

REUSE DETECTION:
If a refreshToken is found but already revoked:
→ Attacker reused an old token
→ Revoke ALL tokens in the family
→ Return 401 { error: "Session compromised. Please log in again." }
→ (Optionally: send security alert email to user)
```

### 9.4 Google OAuth2 (Custom PKCE OIDC Flow)

```
See Section 5.2 → AUTH MODULE → Google OAuth2

Key implementation notes for IDE:
- Use node's built-in `crypto` for PKCE: 
    const verifier = crypto.randomBytes(32).toString('base64url');
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
- Fetch Google's JWKS from https://www.googleapis.com/oauth2/v3/certs
- Verify id_token using `jsonwebtoken.verify()` with the matching public key
- Cache JWKS in memory for 24h (background refresh before expiry)
- Always verify `aud` claim matches your client_id
- Always verify `iss` claim is "https://accounts.google.com"
- `nonce` claim verification is optional but recommended for additional CSRF protection
```

---

## 10. Testing Requirements

### 10.1 Test Coverage Targets

| Module | Unit | Integration | Target Coverage |
|--------|------|-------------|----------------|
| Auth Service | ✅ | ✅ | ≥ 90% |
| Token Service | ✅ | — | ≥ 95% |
| Google OIDC | ✅ | ✅ | ≥ 85% |
| Polls Service | ✅ | ✅ | ≥ 85% |
| Responses Service | ✅ | ✅ | ≥ 85% |
| Analytics Service | ✅ | ✅ | ≥ 80% |
| Socket Handlers | — | ✅ | ≥ 75% |

### 10.2 Integration Test Strategy

Use a test PostgreSQL instance (Docker) and real Redis (test DB index 15). Each test file:
- Runs migrations fresh with `prisma migrate deploy`
- Seeds minimal data via factory functions
- Uses `supertest` to make real HTTP requests
- Tears down data after each test

```typescript
// tests/helpers/testDb.ts
export async function cleanDatabase() {
  await prisma.$transaction([
    prisma.answer.deleteMany(),
    prisma.response.deleteMany(),
    prisma.option.deleteMany(),
    prisma.question.deleteMany(),
    prisma.poll.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

// tests/helpers/factories.ts
export async function createTestUser(overrides = {}) { ... }
export async function createTestPoll(creatorId: string, overrides = {}) { ... }
export async function createTestResponse(pollId: string, overrides = {}) { ... }
export function generateAccessToken(userId: string) { ... }
```

### 10.3 Critical Test Cases

**Auth:**
- [ ] Register with valid data → 201 + verification email queued
- [ ] Register with duplicate email → 409
- [ ] Register with weak password → 422
- [ ] Login before email verification → 403
- [ ] Login with correct credentials → 200 + accessToken + cookie set
- [ ] Login with wrong password → 401 (rate limit counted)
- [ ] 6th login attempt → 429 rate limit
- [ ] Refresh with valid cookie → 200 + new token + old invalidated
- [ ] Refresh with revoked token → 401 + all family revoked
- [ ] Google callback with invalid state → 400
- [ ] Google callback with tampered id_token → 401

**Polls:**
- [ ] Create poll (authenticated) → 201 + slug generated
- [ ] Create poll without auth → 401
- [ ] Get active poll (public) → 200
- [ ] Get expired poll → 200 (with expired status)
- [ ] Activate poll (owner) → 200
- [ ] Activate poll (non-owner) → 403
- [ ] Auto-expiry: poll past expiresAt → EXPIRED status

**Responses:**
- [ ] Submit to active poll → 201
- [ ] Submit to expired poll → 410
- [ ] Submit twice (authenticated) → 409
- [ ] Submit twice (anonymous, same sessionToken) → 409
- [ ] Submit with unanswered mandatory question → 422
- [ ] Submit to requiresAuth poll without token → 401

**Analytics:**
- [ ] Analytics endpoint returns correct counts
- [ ] Results endpoint on PUBLISHED poll → 200
- [ ] Results endpoint on non-PUBLISHED poll → 403

---

## 11. API Reference Catalog

### 11.1 Standard Response Envelope

```typescript
// Success
{ "success": true, "data": { ... } }

// Paginated
{ "success": true, "data": [...], "meta": { "page": 1, "limit": 20, "total": 142, "totalPages": 8 } }

// Error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
```

### 11.2 HTTP Status Code Usage

| Status | Usage |
|--------|-------|
| 200 | Success |
| 201 | Created |
| 202 | Accepted (async, e.g. Kafka path) |
| 204 | No content (DELETE success) |
| 400 | Bad request (malformed JSON) |
| 401 | Unauthenticated |
| 403 | Forbidden (authenticated but not authorized) |
| 404 | Not found |
| 409 | Conflict (duplicate) |
| 410 | Gone (poll expired) |
| 422 | Validation error |
| 429 | Rate limited |
| 500 | Internal server error |

### 11.3 Error Codes

```
AUTH_REQUIRED          → 401
INVALID_CREDENTIALS    → 401
EMAIL_NOT_VERIFIED     → 403
TOKEN_EXPIRED          → 401
TOKEN_INVALID          → 401
SESSION_COMPROMISED    → 401
FORBIDDEN              → 403
NOT_FOUND              → 404
POLL_EXPIRED           → 410
ALREADY_RESPONDED      → 409
DUPLICATE_EMAIL        → 409
VALIDATION_ERROR       → 422
RATE_LIMITED           → 429
INTERNAL_ERROR         → 500
```

---

## 12. Environment & Deployment Config

### 12.1 `.env.example`

```env
# App
NODE_ENV=development
PORT=3001
API_BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173

# JWT (generate RS256 key pair)
JWT_PRIVATE_KEY_PATH=./keys/private.pem
JWT_PUBLIC_KEY_PATH=./keys/public.pem
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# Database
DATABASE_URL=postgresql://mayu:password@localhost:5432/mayu_db

# Redis
REDIS_URL=redis://localhost:6379

# Google OAuth2
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=mayu-api
KAFKA_CONSUMER_GROUP=mayu-response-writers

# Email (SMTP)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="MaYu <noreply@mayu.app>"

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Features
KAFKA_ENABLED=false   # toggle for fallback testing
```

### 12.2 Docker Compose (Development)

```yaml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mayu_db
      POSTGRES_USER: mayu
      POSTGRES_PASSWORD: password
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    command: redis-server --save 60 1

  zookeeper:
    image: confluentinc/cp-zookeeper:7.6.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    ports: ["2181:2181"]

  kafka:
    image: confluentinc/cp-kafka:7.6.0
    depends_on: [zookeeper]
    ports: ["9092:9092"]
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: true

volumes:
  pgdata:
```

---

## 13. IDE Task Breakdown

### 13.1 Claude (Backend) — Ordered Task List

```
PHASE 1: Foundation
□ Task B-01: Initialize TypeScript Express project with proper tsconfig
□ Task B-02: Configure Zod env validation, Winston logging, request ID middleware
□ Task B-03: Set up Prisma with schema, run first migration
□ Task B-04: Configure ioredis client with connection pooling
□ Task B-05: Global error handler, async wrapper, custom AppError class

PHASE 2: Authentication
□ Task B-06: Implement JWT RS256 token service (generate, verify, refresh)
□ Task B-07: Email/password registration + bcrypt hashing
□ Task B-08: Email verification token (crypto.randomBytes, Nodemailer)
□ Task B-09: Login endpoint with rate limiting (Redis)
□ Task B-10: Refresh token rotation with reuse detection
□ Task B-11: Logout + token revocation
□ Task B-12: Custom Google OAuth2 PKCE flow (no Passport)
□ Task B-13: Google JWKS cache + id_token verification
□ Task B-14: Password reset flow (request + reset)
□ Task B-15: Auth middleware (bearer token + optional auth)

PHASE 3: Polls
□ Task B-16: Create poll endpoint (with nested questions + options, atomic)
□ Task B-17: List polls (creator's own, paginated)
□ Task B-18: Get poll by slug (public access for active/published)
□ Task B-19: Update poll settings (owner only)
□ Task B-20: Poll status transitions (activate, close, publish)
□ Task B-21: Poll expiry cron job (node-cron or setInterval)
□ Task B-22: Slug generation utility

PHASE 4: Responses
□ Task B-23: Submit response (validation, dedup, mandatory checks)
□ Task B-24: Redis-based deduplication (SET NX with TTL)
□ Task B-25: Expiry check middleware for poll-specific routes
□ Task B-26: Response listing for authenticated creators (non-anon polls)

PHASE 5: Analytics
□ Task B-27: Analytics computation service (SQL aggregation)
□ Task B-28: Redis analytics cache (30s TTL, invalidation logic)
□ Task B-29: Analytics API endpoint (creator-only)
□ Task B-30: Public results endpoint (PUBLISHED polls only)

PHASE 6: Real-Time
□ Task B-31: Socket.io server setup with Redis adapter
□ Task B-32: /analytics namespace with JWT auth guard
□ Task B-33: /polls namespace (public, poll status events)
□ Task B-34: Emit analytics:update on new response
□ Task B-35: Emit poll:expired on expiry

PHASE 7: Kafka (Scalability)
□ Task B-36: KafkaJS producer setup with retry logic
□ Task B-37: Topic creation on startup
□ Task B-38: Response submission → Kafka producer path
□ Task B-39: Kafka consumer (batch DB writes)
□ Task B-40: Graceful fallback when Kafka unavailable
□ Task B-41: Consumer emits Socket.io events after DB write

PHASE 8: Testing
□ Task B-42: Vitest + Supertest setup, test database config
□ Task B-43: Test factories + cleanup helpers
□ Task B-44: Auth unit tests (token service, bcrypt, OIDC)
□ Task B-45: Auth integration tests (all endpoints)
□ Task B-46: Polls integration tests
□ Task B-47: Responses integration tests
□ Task B-48: Analytics integration tests
□ Task B-49: Rate limiting tests
□ Task B-50: Socket.io event emission tests
```

### 13.2 Gemini (Frontend) — Ordered Task List

```
PHASE 1: Setup
□ Task F-01: Vite + React + TypeScript project init
□ Task F-02: Tailwind CSS + custom design tokens (Japanese palette)
□ Task F-03: Google Fonts: Noto Serif JP, DM Sans
□ Task F-04: Framer Motion, Recharts, Zustand, React Query, React Hook Form setup
□ Task F-05: Axios instance with auth interceptors (attach token, refresh on 401)
□ Task F-06: Socket.io client setup + custom hook (useSocket)
□ Task F-07: Zustand auth store (user, tokens, login/logout actions)
□ Task F-08: ProtectedRoute + public route components

PHASE 2: UI Foundation
□ Task F-09: Design token CSS variables + global styles
□ Task F-10: Button component (all variants)
□ Task F-11: Input, Textarea, Toggle components
□ Task F-12: Badge, Card, Modal, Toast, Spinner components
□ Task F-13: Navbar (guest vs authenticated states)
□ Task F-14: Page layout container

PHASE 3: Auth Pages
□ Task F-15: Sign Up page (email form + Google button)
□ Task F-16: Sign In page (email form + Google button)
□ Task F-17: Email Verification prompt page
□ Task F-18: Forgot Password + Reset Password pages
□ Task F-19: Google OAuth2 callback handler page
□ Task F-20: Auth form validation with React Hook Form + Zod

PHASE 4: Landing Page
□ Task F-21: Hero section (animated ink-wash background, CTAs)
□ Task F-22: Features section (3 cards with scroll animation)
□ Task F-23: How it Works section (3-step visual)
□ Task F-24: Live counter section (API-driven)
□ Task F-25: Footer
□ Task F-26: Responsive layout (mobile-first)

PHASE 5: Dashboard
□ Task F-27: Stats row (total polls, responses, active polls)
□ Task F-28: PollCard component (title, badge, counts, expiry, actions)
□ Task F-29: Poll list with React Query (infinite scroll or pagination)
□ Task F-30: Empty state illustration
□ Task F-31: 3-dot action menu (edit, close, delete, publish)

PHASE 6: Create/Edit Poll
□ Task F-32: Multi-step form stepper component
□ Task F-33: Step 1 — Poll settings form
□ Task F-34: Step 2 — Question builder (drag-to-reorder with react-beautiful-dnd)
□ Task F-35: Step 2 — Option builder per question
□ Task F-36: Step 2 — Live preview panel
□ Task F-37: Step 3 — Review + launch (copy link + QR code display)
□ Task F-38: Edit poll (pre-populate form from API)

PHASE 7: Public Poll
□ Task F-39: Poll page layout (progress bar, question cards)
□ Task F-40: QuestionCard component (radio option buttons, mandatory indicator)
□ Task F-41: Submit flow (validation, API call, success animation)
□ Task F-42: Poll expired state UI
□ Task F-43: Already responded state UI
□ Task F-44: Requires auth → redirect to sign in with return URL

PHASE 8: Analytics Dashboard
□ Task F-45: Analytics page layout + header actions
□ Task F-46: Live indicator + real-time connection status
□ Task F-47: Stats row with animated number increment
□ Task F-48: BarChart component per question (Recharts)
□ Task F-49: Timeline/area chart for response flow
□ Task F-50: Socket.io integration for live updates
□ Task F-51: Publish results button + confirmation modal

PHASE 9: Results Page
□ Task F-52: Public results layout (clean, printable)
□ Task F-53: Final bar charts (static, read-only)
□ Task F-54: "Powered by MaYu" footer

PHASE 10: Polish
□ Task F-55: Page transitions (Framer Motion AnimatePresence)
□ Task F-56: 404 page (Japanese ink illustration style)
□ Task F-57: Loading skeleton components
□ Task F-58: Error boundary
□ Task F-59: Responsive audit (mobile, tablet, desktop)
□ Task F-60: Accessibility audit (ARIA labels, keyboard navigation)
```

---

*Document version 1.0 — MaYu Hackathon Edition*
*Backend: Claude | Frontend: Gemini | Architecture: Full-Stack TypeScript*