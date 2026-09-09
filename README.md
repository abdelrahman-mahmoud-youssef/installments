# Installment SaaS

Multi-tenant SaaS for managing installment contracts: customers, contracts with three installment-calculation methods, a recurrence engine, transaction-based payments, and daily Telegram reminders. The UI is bilingual (English / Arabic, with RTL support).

pnpm workspace monorepo:

- `apps/backend` — NestJS + Prisma + PostgreSQL + BullMQ (Redis)
- `apps/frontend` — Next.js 16 App Router + Tailwind + shadcn/ui + TanStack Query + React Hook Form + Zod
- `apps/mobile` — iOS-first Expo + React Native companion app for staff (see `apps/mobile/CLAUDE.md`); talks to the backend directly over a Bearer token, not through the frontend's proxy

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
  - `REDIS_URL` — reference the Redis plugin (`${{Redis.REDIS_URL}}`); the app also accepts `REDIS_HOST`/`REDIS_PORT`. **Set one of these explicitly** — `REDIS_HOST` defaults to `localhost` if left unset, so a missing Redis config won't fail fast at boot, it'll silently fail later when a queue job runs.
  - `JWT_SECRET` — a strong random value, 16+ chars
  - `JWT_EXPIRES_IN` — e.g. `7d`
  - `TWO_FACTOR_ENCRYPTION_KEY` — **required**, 32+ chars (e.g. `openssl rand -hex 32`) — encrypts TOTP secrets at rest
  - `FRONTEND_URL` — optional; the frontend's public URL. If unset, CORS reflects the request origin. (Browser traffic is same-origin via the frontend proxy anyway.)
  - `ROOT_DOMAIN` — the production frontend domain, used to build public share-link/contract URLs (must match the frontend's `NEXT_PUBLIC_SITE_URL` below). Optional in dev, should be set in production if share links or reminders are used.
  - `STORAGE_PROVIDER` — `backblaze` (default) or `local`. If `backblaze` (or unset), `B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET`, `B2_ENDPOINT` are **required** — the app fails env validation at boot without them. Use `local` only for quick throwaway deploys; Railway's filesystem isn't persistent, so uploaded files (receipts, logos, ID images) would be lost on redeploy.
  - `RESEND_API_KEY`, `RESEND_FROM_EMAIL` — optional, but required for forgot/reset-password emails to actually send; the sending domain must be verified in Resend.
  - `TELEGRAM_BOT_TOKEN`, `REMINDER_HOUR` — optional (daily reminders)
  - `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN` — optional; only needed if WhatsApp reminders/webhooks are enabled, in which case the live `<backend>/whatsapp/webhook` URL must also be registered with Meta.

> The service only needs a reachable **`DATABASE_URL`**, `JWT_SECRET`, `TWO_FACTOR_ENCRYPTION_KEY`, and (unless `STORAGE_PROVIDER=local`) the four `B2_*` variables to boot and pass the `/health` check — `FRONTEND_URL` and Redis are otherwise optional (without Redis, the daily reminder job is skipped rather than crashing startup). If the health check still times out, check the deploy logs for a `prisma migrate deploy` / database-connection error, or an env validation error for a missing required variable.
  - `PORT` — injected by Railway automatically; the app binds `0.0.0.0:$PORT`.

### 3. Frontend service (`apps/frontend`)

- **New Service → GitHub repo** (same repo).
- Settings → leave **Root Directory empty**.
- Settings → **Railway Config File**: `apps/frontend/railway.json` (or `RAILWAY_CONFIG_FILE=apps/frontend/railway.json`).
- **Variables**:
  - `BACKEND_URL` — the backend service's URL, read **server-side only** by the `/api/auth/*` and `/api/backend/*` route handlers (never exposed to the browser). Prefer Railway private networking: `http://${{backend.RAILWAY_PRIVATE_DOMAIN}}:${{backend.PORT}}`.
  - `NEXT_PUBLIC_BACKEND_URL` — the backend's **public** URL (must be a browser-reachable HTTPS URL, not the private domain used above). Fetched directly by the browser for uploaded assets (logos, receipts, ID images) via `lib/assets.ts` — the app throws at runtime wherever an image is rendered if this is missing.
  - `NEXT_PUBLIC_SITE_URL` — the frontend's own public URL (e.g. `https://app.example.com`). Used for page metadata and to build the public share-link domain; must match the backend's `ROOT_DOMAIN` above.
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — optional; only needed if the shop location picker/map is used.
  - `PORT` — injected by Railway; the start command passes it to `next start`.

### 4. Health checks

- Backend: `GET /health` → `{ "status": "ok" }`.
- Frontend: `GET /login` (renders the sign-in page for the default locale).

> All browser → backend traffic is proxied through the frontend's own `/api/backend/*` route (same origin), so the backend never needs to be publicly reachable for the web app alone — expose it privately and keep only the frontend's domain public if that's your only client.
>
> The **mobile app** (`apps/mobile`) is a separate client that talks to the backend directly with a Bearer token (no cookie proxy) — if you deploy the mobile app, the backend's `NEXT_PUBLIC_BACKEND_URL`-equivalent (its own public URL) must be reachable from the internet, not just from the frontend service over Railway's private network.

## Architecture notes

See [`CLAUDE.md`](./CLAUDE.md) for the core design decisions (multi-tenancy, money handling, the recurrence engine, payment allocation) and the full engineering standards this codebase follows.
