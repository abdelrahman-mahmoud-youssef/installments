# Installment SaaS

Multi-tenant SaaS for managing installment contracts: customers, contracts with three installment-calculation methods, a recurrence engine, transaction-based payments, and daily Telegram reminders. The UI is bilingual (English / Arabic, with RTL support).

pnpm workspace monorepo:

- `apps/backend` — NestJS + Prisma + PostgreSQL + BullMQ (Redis)
- `apps/frontend` — Next.js 16 App Router + Tailwind + shadcn/ui + TanStack Query + React Hook Form + Zod

## Local development

Prerequisites: Node 22+, Docker, [pnpm](https://pnpm.io) (`corepack enable && corepack prepare pnpm@10.10.0 --activate`).

```bash
pnpm install                 # installs both apps, generates the Prisma client
pnpm infra:up                # starts postgres + redis (docker compose)
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.local.example apps/frontend/.env.local
pnpm --filter installment-backend exec prisma migrate dev
pnpm --filter installment-backend seed   # creates a demo tenant + admin user
pnpm dev                     # runs backend (:3001) and frontend (:3000) in parallel
```

Seeded login: `admin@demo.com` / `password123`.

Other useful commands (run from the repo root, fan out to every workspace):

```bash
pnpm build
pnpm test
pnpm lint
```

Or target one app: `pnpm --filter installment-backend <script>` / `pnpm --filter frontend <script>`.

> If `pnpm dev` prints `apps/backend dev: Failed`, a stale process is usually still holding port **3001** (or **3000** for the frontend). Stop leftover dev servers and retry — on Windows: `taskkill /F /IM node.exe`, on macOS/Linux: `lsof -ti:3001,3000 | xargs kill`.

## Deploying to Railway

Both apps deploy as **separate services from the same GitHub repo**, each built with its own multi-stage `Dockerfile`. The Dockerfiles are pnpm-workspace-aware and expect the **repo root as the build context** (both apps share the root `pnpm-lock.yaml`), so each service's config lives in `apps/<app>/railway.json` and points back to its Dockerfile by a repo-root-relative path.

### 1. Provision data stores

Add Railway's managed **PostgreSQL** and **Redis** plugins to the project.

### 2. Backend service (`apps/backend`)

- **New Service → GitHub repo** (this repo).
- Settings → leave **Root Directory empty** (the Docker build context must be the repo root).
- Settings → **Config-as-code / Railway Config File**: `apps/backend/railway.json` (or set the service variable `RAILWAY_CONFIG_FILE=apps/backend/railway.json`). This supplies the Dockerfile path, the `prisma migrate deploy && node dist/main.js` start command, and the `/health` health check.
- **Variables**:
  - `DATABASE_URL` — reference the Postgres plugin (`${{Postgres.DATABASE_URL}}`)
  - `REDIS_URL` — reference the Redis plugin (`${{Redis.REDIS_URL}}`); the app also accepts `REDIS_HOST`/`REDIS_PORT`
  - `JWT_SECRET` — a strong random value
  - `JWT_EXPIRES_IN` — e.g. `7d`
  - `FRONTEND_URL` — the frontend service's public URL (used as the CORS origin)
  - `TELEGRAM_BOT_TOKEN`, `REMINDER_HOUR` — optional (daily reminders)
  - `PORT` — injected by Railway automatically; the app binds `0.0.0.0:$PORT`.

### 3. Frontend service (`apps/frontend`)

- **New Service → GitHub repo** (same repo).
- Settings → leave **Root Directory empty**.
- Settings → **Railway Config File**: `apps/frontend/railway.json` (or `RAILWAY_CONFIG_FILE=apps/frontend/railway.json`).
- **Variables**:
  - `BACKEND_URL` — the backend service's URL, read **server-side only** by the `/api/auth/*` and `/api/backend/*` route handlers (never exposed to the browser). Prefer Railway private networking: `http://${{backend.RAILWAY_PRIVATE_DOMAIN}}:${{backend.PORT}}`.
  - `PORT` — injected by Railway; the start command passes it to `next start`.

### 4. Health checks

- Backend: `GET /health` → `{ "status": "ok" }`.
- Frontend: `GET /login` (renders the sign-in page for the default locale).

> All browser → backend traffic is proxied through the frontend's own `/api/backend/*` route (same origin), so the backend never needs to be publicly reachable — expose it privately and keep only the frontend's domain public if you prefer.

## Architecture notes

See [`CLAUDE.md`](./CLAUDE.md) for the core design decisions (multi-tenancy, money handling, the recurrence engine, payment allocation) and the full engineering standards this codebase follows.
