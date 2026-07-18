---
name: backend-feature
description: How to add or modify a NestJS feature module in this project (module/controller/service/DTO conventions, tenancy, transactions, pure logic). Use whenever creating or changing backend endpoints, services, or business logic.
---

# Adding a backend feature

Every feature lives in `apps/backend/src/modules/<feature>/` with this shape:

```
modules/<feature>/
  <feature>.module.ts
  <feature>.controller.ts
  <feature>.service.ts
  dto/<action>-<entity>.dto.ts
  <pure-logic>.ts          (only if the feature has real domain logic)
```

## Rules

1. **Tenancy first.** Every service method takes `tenantId` as its first parameter. It comes from `@CurrentUser()` in the controller — never from the request body or query. Every Prisma query includes `tenantId` in its `where`. Cross-table writes verify ownership by querying with `tenantId`, not by trusting a passed id.
2. **DTOs validate everything.** One class per input in `dto/`, using class-validator decorators. Money fields are `@IsInt() @Min(1)` (minor units). Dates are ISO strings validated with `@IsDateString()` and converted at the service boundary.
3. **Pure logic goes in plain files.** Anything with branching business rules (date math, money math, allocation) is a pure function in its own file — no Nest decorators, no Prisma imports, takes data, returns data. The service orchestrates: load → pure function → persist. Add a `*.spec.ts` next to every pure-logic file.
4. **Multi-row writes are one transaction.** Use `prisma.$transaction(async (tx) => ...)` and pass `tx` down. Re-read state inside the transaction before computing writes.
5. **Errors are Nest HTTP exceptions** (`NotFoundException`, `BadRequestException`, ...) thrown from services. The global filter shapes the response — never try/catch to reshape errors locally, never swallow.
6. **Endpoints are guarded by default** (global JWT guard). Only `@Public()` opts out — currently just login and the public customer page. List endpoints paginate via the shared pagination helpers.
7. Register the module in `app.module.ts`. No comments anywhere. Shared enums/constants come from `@prisma/client` or `src/common/constants.ts` — never string literals inline.
8. **Imports are relative, never `src/...`.** The backend runs on plain `tsc` + `node`/`tsx` (no bundler, no `tsconfig-paths`), so there is no `src/*` path alias — it type-checks but fails at runtime with `MODULE_NOT_FOUND`. Always import with `../../` relative paths.

Mirror the existing `customers` module when in doubt — it is the reference implementation.
