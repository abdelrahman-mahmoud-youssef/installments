# Installment SaaS

Multi-tenant SaaS for managing installment contracts: customers, contracts, generated installment schedules, transaction-based payments, daily Telegram reminders.

## Layout

pnpm workspace monorepo:

- `apps/backend/` — NestJS + Prisma + PostgreSQL + BullMQ (Redis)
- `apps/frontend/` — Next.js 16 App Router + Tailwind + shadcn/ui (Base UI primitives) + TanStack Query + React Hook Form + Zod
- `docker-compose.yml` — postgres + redis for local dev
- `pnpm-workspace.yaml` / root `package.json` — workspace + cross-app scripts

## Commands

- Install once: `pnpm install` (root — installs both apps, runs `prisma generate` via backend's `postinstall`)
- Infra: `pnpm infra:up` (postgres + redis), `pnpm infra:down`
- Both apps: `pnpm dev` from the root (parallel — backend on 3001, frontend on 3000)
- Backend only: `pnpm --filter installment-backend dev`, `... exec prisma migrate dev`, `... seed`, `... test`
- Frontend only: `pnpm --filter frontend dev`
- Everything: `pnpm build`, `pnpm test`, `pnpm lint` (fan out to every app via `-r`)

## Core design decisions (do not silently change)

- **Multi-tenancy:** shared schema, `tenantId` column on every tenant-owned row. `tenantId` comes only from the JWT (`CurrentUser`), never from client payloads. Every query filters by it.
- **Money:** integers in minor units (`Int`) everywhere. Formatting happens only in the UI (`Money` component / formatters).
- **OVERDUE is derived, never stored:** `dueDate < today AND status IN (PENDING, PARTIALLY_PAID)`. Stored `InstallmentStatus` has no OVERDUE value.
- **Installment schedules are generated upfront** as rows at contract creation, inside one transaction. The last installment absorbs rounding/balance remainders so `sum(installments) === totalAmount - downPayment` always holds.
- **Monthly recurrence anchors on `firstPaymentDate`'s day-of-month.** Each occurrence is computed from the anchor (`min(anchorDay, daysInMonth)`), never from the previous occurrence — 31 Jan → 28 Feb → 31 Mar.
- **Payments are records, never flags.** A `Payment` links to installments through `PaymentAllocation` rows. Default allocation is oldest-first with overpayment cascading to next unpaid installments; manual allocation is passing explicit `{installmentId, amount}` pairs. All payment writes happen in one Prisma transaction.
- **Pure business logic lives in plain functions** (`recurrence.ts`, `schedule.ts`, `allocation.ts`) that take data in and return data out — no Nest, no Prisma imports. These are the unit-tested core.
- **No repository classes over Prisma.** Services inject `PrismaService` directly.
- **Public customer page** exposes only `Customer.publicId` (UUID) — never internal ids, phone, notes, or tenant data.
- Dates are date-only (`@db.Date`); "today" comes from one shared helper.
- **Subscriptions are derived, never a stored flag:** a shop is active while `today < Tenant.subscriptionExpiresOn` (new shops get a 14-day trial). Each paid month (500 EGP) is a `TenantSubscription` row added by a `PlatformAdmin` from the `/platform` dashboard. The global `SubscriptionGuard` answers non-GET requests from an expired shop with 402 `SUBSCRIPTION_INACTIVE`; opt a route out with `@AllowWithoutSubscription()`. Platform routes use `@PlatformRoute()` with their own JWT scope and cookie — the platform owner is never a tenant `Role`.

# Engineering Standards

Mandatory for every line of code in this project.

## Principles

- Long-term maintainability over short-term speed. No quick hacks, no temporary code. Refactor immediately if a cleaner design exists.
- Clean Architecture where it adds value. Feature-based modules, not file-type folders. Business logic separated from framework code.
- SOLID, DRY, KISS, YAGNI. Composition over inheritance. Dependency injection. One responsibility per file.
- Design patterns (Repository, Strategy, Factory, Adapter, Builder, Value Objects, Domain Services) only when they improve the architecture — no unnecessary abstractions.

## Code quality

- Strongly typed everywhere. No `any` unless unavoidable.
- No duplicate code, large files, large functions, deep nesting, magic numbers/strings, hidden side effects, dead code, unused imports/variables/functions.
- Meaningful names, no abbreviations. Names explain intent: `calculateRemainingBalance()`, not `calc()`. No "utils" dumping grounds — shared logic is organized intentionally.
- Functions: single responsibility, short, return early, avoid nested conditions and boolean flags.
- **No comments of any kind** — no inline, block, or TODO comments. Code must be self-explanatory through naming and structure.
- Shared constants for routes, statuses, roles, limits, messages. Configuration centralized (backend: `@nestjs/config`; frontend: `lib/config`). Secrets only in environment variables.

## Backend rules

- DTOs with class-validator on every input. Global `ValidationPipe`, global JWT guard (`@Public()` opts out), global exception filter, centralized logging.
- Validate all inputs; never trust client data. Protect all private routes. Never expose internal ids on public surfaces.
- Efficient queries: no N+1, select only needed fields, use the defined indexes, keep transactions atomic.
- Structure everything to be unit-testable: logic in pure functions or injectable services with narrow dependencies.

## Frontend rules

- **i18n: English + Arabic via next-intl.** All pages live under `app/[locale]/`; `en` has no URL prefix (`localePrefix: 'as-needed'`), `ar` is prefixed (`/ar/...`). `dir="rtl"`/`"ltr"` is set on `<html>` in `app/[locale]/layout.tsx` based on locale. Every UI string lives in `messages/en.json` / `messages/ar.json`, one key per string, no string ever hardcoded in a component. `Link`, `redirect`, `usePathname`, `useRouter` come from `@/i18n/navigation` (locale-aware), never from `next/link`/`next/navigation` — the exceptions are `useParams`, `useSearchParams`, and `notFound`, which aren't locale-specific and stay from `next/navigation`. Backend error messages are not translated (English only) — only the UI chrome is bilingual.
- shadcn/ui components whenever appropriate. Components small, reusable, accessible, responsive, composable. UI / business logic / data fetching separated — no large business logic inside React components.
- Mobile-first, responsive at mobile/tablet/laptop/desktop/wide. No fixed widths; flexible layouts; responsive typography; no layout shift while loading.
- Tailwind + CSS variables for design tokens (colors, spacing, radius, shadows, typography). Consistent spacing.
- Forms: React Hook Form + Zod, shared schemas in `lib/schemas/`, reusable form components, error/loading/disabled states, proper accessibility.
- Server state in TanStack Query, UI state in local React state. No unnecessary global state.
- All HTTP through the API layer in `lib/api/` — never `fetch` directly in components. Auth, error handling, and request config centralized there.
- Every async operation shows loading, empty, error, and success states with user-friendly messages. Never swallow errors silently.
- Performance: pagination, debounced search, dynamic imports where appropriate. Memoize only when beneficial; no premature optimization.

## Git

Focused commits; no unrelated changes in the same commit.

## Before every implementation, verify

Simpler? Reusable? No duplicate logic? Scalable? Testable? Readable in six months? Follows existing architecture? Immediately understandable by another senior engineer? If any answer is no, improve it first.
