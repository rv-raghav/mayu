# MaYu — Live Poll Intelligence

MaYu is a modern, real-time polling and analytics platform designed with a premium Japanese-inspired minimalist aesthetic. It allows facilitators to create interactive polls, share them securely, and watch audience responses update live on analytics dashboards via WebSockets.

> **Live Demo Video:** https://youtu.be/J1_cXW67pwA

---

## 🌟 Key Features

- **Live Analytics:** Watch poll results update in real-time as users submit responses (powered by Socket.io and Redis).
- **Japanese Minimalist UI:** A highly polished design system using terracotta accents, paper backgrounds, and serif typography.
- **Robust Authentication:** JWT-based auth with HTTP-only cookies, automated token refresh, and Google OAuth 2.0 integration.
- **Complex Poll Types:** Supports multiple-choice, star ratings, long-form text, and drag-and-drop ranking.
- **Event-Driven Architecture:** Ready for massive scale with Kafka producers/consumers handling response ingestion (can be toggled off for smaller deployments).
- **Public & Private Sessions:** Host open polls for anyone with a link, or restrict access to authenticated participants.

---

## 🛠 Tech Stack

**Frontend (Vercel):**

- React 18 & TypeScript
- Vite (Fast Build Tooling)
- TailwindCSS (Custom Design Tokens)
- Zustand (Global State Management)
- TanStack React Query (Server State & Caching)
- React Hook Form + Zod (Validation)
- Socket.io-client (Real-time events)
- Recharts (Data Visualization)

**Backend (Render):**

- Node.js & Express
- TypeScript
- Prisma ORM
- PostgreSQL (Hosted on Supabase with Connection Pooling)
- Redis (Hosted on Upstash for session states & Pub/Sub)
- Socket.io (WebSocket Server)
- KafkaJS (Aiven Kafka integration for event streaming)
- Nodemailer (Lazy-loaded SMTP support)

---

## 🚀 Getting Started Locally

### Prerequisites

- Node.js (v20+)
- PostgreSQL Database
- Redis Instance (Local or Upstash)
- Optional: Kafka Cluster (Aiven or Confluent)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/mayu.git
cd mayu
```

### 2. Backend Setup

```bash
cd backend
npm install
```

**Environment Variables:**
Create a `.env` file in the `backend` directory based on `.env.example`:

```env
NODE_ENV=development
PORT=3001
API_BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173

# Generate keys using: node -e "console.log(require('crypto').generateKeyPairSync('rsa', {modulusLength: 2048}).privateKey.export({type: 'pkcs1', format: 'pem'}))"
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
JWT_PUBLIC_KEY="-----BEGIN RSA PUBLIC KEY-----\n..."

DATABASE_URL="postgresql://user:password@localhost:5432/mayu_db"
DIRECT_DATABASE_URL="postgresql://user:password@localhost:5432/mayu_db"
REDIS_URL="redis://localhost:6379"

# Google OAuth
GOOGLE_CLIENT_ID="your_client_id"
GOOGLE_CLIENT_SECRET="your_client_secret"
GOOGLE_REDIRECT_URI="http://localhost:3001/auth/google/callback"
```

**Database Migration & Start:**

```bash
npx prisma generate
npx prisma migrate dev
npm run dev
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

**Environment Variables:**
Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

**Start the Development Server:**

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## ☁️ Deployment Guide

### Database (Supabase)

1. Create a PostgreSQL project.
2. Go to Settings > Database > Connection Pooling.
3. Grab the **Transaction Mode (port 6543)** URL for `DATABASE_URL`.
4. Grab the **Session Mode (port 5432)** URL for `DIRECT_DATABASE_URL` (Used only for running `npx prisma migrate deploy` locally).

### Backend (Render)

1. Connect your GitHub repository to a new Render **Web Service**.
2. **Root Directory:** `backend`
3. **Build Command:** `npm install && npx prisma generate && npm run build`
4. **Start Command:** `npm run start`
5. Map all environment variables from your `.env` to the Render Dashboard.
6. Ensure `PORT` is set to `10000` (Render defaults).

### Frontend (Vercel)

1. Import the repository into Vercel.
2. **Framework Preset:** Vite
3. **Root Directory:** `frontend`
4. Add Environment Variables:
   - `VITE_API_URL` = `https://your-backend.onrender.com`
   - `VITE_SOCKET_URL` = `https://your-backend.onrender.com`

---

## 🗄 Project Structure

```text
mayu/
├── backend/
│   ├── prisma/             # Schema & Migrations
│   ├── src/
│   │   ├── config/         # Environment, Database, Redis, Kafka setup
│   │   ├── middleware/     # Auth checks, error handling, rate limiting
│   │   ├── modules/        # Domain logic (auth, polls, responses, analytics)
│   │   ├── sockets/        # Socket.io event handlers
│   │   └── workers/        # Background consumers (Kafka/Redis)
│   └── server.ts           # HTTP & Socket server initialization
│
└── frontend/
    ├── src/
    │   ├── components/     # UI Building Blocks (shadcn-inspired)
    │   ├── hooks/          # Custom React Query & Socket hooks
    │   ├── lib/            # Axios instance, formatting utilities
    │   ├── pages/          # App views (Dashboard, Create Poll, Analytics)
    │   └── store/          # Zustand state (Auth, UI)
    └── index.css           # Core Design Tokens & Theming
```

---

## 📡 Architecture Highlights

- **JWT Dual-Token Security:** Ephemeral short-lived access tokens mapped with long-lived, HttpOnly refresh tokens. Key pairs are handled as inline PEM string environment variables.
- **WebSocket Scaling:** Configured using Redis pub/sub adapters to allow multiple Node.js instances to broadcast live analytics synchronously.
- **Lazy Load Integrations:** SMTP (Nodemailer) and Event Streaming (Kafka) safely degrade if environment variables are missing, preventing crash loops on boot.
- **TypeScript Aliasing Mitigation:** `tsc-alias` is used in the production build to safely replace `@/` paths before Node runtime.
