---
name: db-best-practices
description: Senior-level PostgreSQL/Prisma database practices — schema design, migrations, indexing, transactions, and multi-tenant query safety. Use when editing prisma/schema.prisma, writing a migration, or writing/reviewing any Prisma query. These are the standard to aim for, not a description of what every line of this codebase already does — see "Known gaps" at the end.
---

# Database best practices

This project is NestJS + Prisma + PostgreSQL, multi-tenant, shared schema with a `tenantId` column per tenant-owned table. The rules below are how a senior engineer runs a Postgres/Prisma codebase at this scale. Follow them going forward even where existing code doesn't yet.

## Schema design

1. **Every tenant-owned table gets `tenantId` plus an index that leads with it.** A table is rarely queried by `tenantId` alone — index the actual access pattern: `@@index([tenantId, status])`, `@@index([tenantId, dueDate, status])`, etc. A missing composite index here is the most common source of a slow query in this kind of app, and it's invisible until the table has real row counts.
2. **Every foreign key you actually query by gets its own index.** Prisma/Postgres does not automatically index every relation scalar for you — check with `@@index([columnId])` explicitly whenever a `where: { columnId }` query exists, not just when the ORM happens to create one incidentally.
3. **Money is `Int` in minor units, never `Float`, never a mix of units across tables.** One representation, everywhere, matching what the app layer already does.
4. **Use enums for closed vocabularies** (status columns, categories) instead of free-text `String`. It's a real DB-level constraint, not just a TypeScript type — a bad value can't land in the table even from a raw SQL script or another service.
5. **Don't persist a value that's a pure function of other persisted state**, unless it's a deliberate, clearly-justified denormalization with a defined invalidation path. If you can derive it correctly at read time without a real performance cost, derive it — a stored-but-derivable column *will* drift from reality the first time someone forgets to update it in one code path.
6. **Every relation's `onDelete` behavior is a conscious decision, written explicitly**, not left to whatever Prisma defaults to. Ask: if the parent row is deleted, should this row disappear (`Cascade`), block the delete (`Restrict`, the default), or survive with the reference cleared (`SetNull`)? Write down which and why when it's not obvious.
7. **Natural keys get `@unique`** (an email, a slug, a public-facing id) — don't rely on application code alone to prevent duplicates that the database could reject for free.

## Migrations

8. **Never edit an already-applied migration file.** Every schema change is a new forward migration, even to fix a typo in the last one.
9. **A migration that adds a `NOT NULL` column to a populated table needs a default or a backfill step** — either a `DEFAULT` in the same statement, or a two-step migration (add nullable → backfill → add the NOT NULL constraint in a later migration). Never assume the table is empty.
10. **Prefer additive, backward-compatible migrations over same-release drop/rename.** If code is about to stop using a column, ship that first, then drop the column in a later migration — never in the same deploy that stops referencing it, so a rollback of the app doesn't hit a missing column.
11. **Review the generated/hand-written SQL before applying it**, especially anything with `DROP`, `ALTER COLUMN ... TYPE`, or a rename — know what happens to existing rows, not just what the new shape looks like.

## Query performance

12. **`select` only the fields a caller needs.** Don't reach for a broad `include` of an entire relation when three fields off it are all that's used.
13. **No N+1.** Batch related lookups in one query (`include`, or `where: { id: { in: [...] } }`) instead of looping and querying per item.
14. **Independent queries run in `Promise.all`, not sequential `await`s.** Sequential awaits for unrelated reads are pure added latency.
15. **Every list endpoint paginates.** No endpoint should be able to return an unbounded result set as a table grows.

## Transactions

16. **A write that touches more than one row is one `prisma.$transaction`,** and reads the current state *inside* the transaction before computing the write — never read outside a transaction and act on possibly-stale data inside it.
17. **Never do slow I/O inside a transaction** (an HTTP call, a Telegram send, anything network-bound) — it holds a DB connection and locks for the duration. Do the DB work, commit, then do the side effect after.
18. **Default to Postgres's default isolation level (Read Committed).** Only reach for a stricter one when you've identified a specific race it actually prevents — don't add it defensively.

## Multi-tenant query safety

19. **Every single query against a tenant-owned table filters by `tenantId` in its `where` — no exceptions, no "just this once."** This is the one category of bug that leaks one customer's data to another; treat a missing `tenantId` filter as the most severe class of bug this codebase can have, more severe than a crash.
20. **Never derive `tenantId` from anything the client sent** (body, query param, another row's foreign key without re-verification) — it comes from the authenticated user only. Ownership of a nested resource (an installment, a payment) is proven by joining through `tenantId`, not by trusting the id alone.

## Known gaps in this codebase today

Being honest about where this project doesn't yet meet the bar above, so it's visible instead of assumed:

- **Migrations are hand-written SQL**, not generated by `prisma migrate dev`, because that command hangs waiting for a confirmation prompt this environment can't answer. The discipline in rules 8–11 still applies to the hand-written files — they just aren't machine-generated.
- **No automated check** (lint rule, test, or query-log audit) enforces rule 19 — a missing `tenantId` filter would currently only be caught in code review. Worth building a small test helper that inspects `where` clauses on tenant-owned models before this app has many more contributors.
- **`PaymentClaim` has no index on `contractId` alone** (only on `installmentId` and `(tenantId, status, createdAt)`) — fine at current scale, worth adding if a "claims for this contract" query pattern shows up.
- **No configured automated backup/retention policy** has been verified for the Railway Postgres instance as part of this work — confirm one exists before relying on it.
