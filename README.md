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

## Deploying to Railway

Each app is a separate Railway service built from its own `Dockerfile` (multi-stage, pnpm-workspace-aware — the build context is the repo root, since both apps share the root lockfile).

1. Provision managed **PostgreSQL** and **Redis** on Railway.
2. Create a service for `apps/backend`: set **Root Directory** to `apps/backend` (Railway will use its `Dockerfile`/`railway.json` from there). Set env vars:
   - `DATABASE_URL` — from the Postgres plugin
   - `REDIS_URL` — from the Redis plugin (falls back to `REDIS_HOST`/`REDIS_PORT` if unset)
   - `JWT_SECRET` — a strong random value
   - `JWT_EXPIRES_IN` — e.g. `7d`
   - `FRONTEND_URL` — the frontend service's public URL (CORS origin)
   - `TELEGRAM_BOT_TOKEN`, `REMINDER_HOUR` — optional
   - `PORT` is injected by Railway automatically; the app reads it directly.
   - On deploy, the container runs `prisma migrate deploy` before starting.
3. Create a service for `apps/frontend`: set **Root Directory** to `apps/frontend`. Set env vars:
   - `BACKEND_URL` — the backend service's internal or public URL (read server-side only, in the `/api/auth/*` and `/api/backend/*` route handlers — never exposed to the browser)
4. Both services expose `GET /health` (backend) and `GET /login` (frontend) for Railway's health checks.

## Architecture notes

See [`CLAUDE.md`](./CLAUDE.md) for the core design decisions (multi-tenancy, money handling, the recurrence engine, payment allocation) and the full engineering standards this codebase follows.
