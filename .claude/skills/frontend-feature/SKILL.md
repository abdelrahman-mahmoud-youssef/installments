---
name: frontend-feature
description: How to add or modify a frontend page or feature in this project (Next.js App Router, TanStack Query hooks, API layer, forms, shadcn/ui conventions). Use whenever creating or changing pages, components, hooks, or client-side data fetching.
---

# Adding a frontend feature

`apps/frontend/`. Every feature spans four layers — never collapse them into the component:

```
src/lib/api/<feature>.ts        typed API functions (use the shared client from lib/api/client.ts)
src/lib/schemas/<feature>.ts    Zod schemas + inferred types (forms only, not response types)
src/hooks/use-<feature>.ts      TanStack Query hooks (queries + mutations, cache invalidation)
src/app/(app)/<feature>/        pages — thin: compose components, wire hooks
src/components/<feature>/       feature components when a page file grows past easy reading
```

## Rules

1. **No `fetch` in components.** All authenticated HTTP goes through `lib/api/client.ts`'s `apiClient`, which calls `/api/backend/<path>` — a Next.js route handler (`app/api/backend/[...path]/route.ts`) that reads the JWT from an **httpOnly cookie** server-side and forwards it as `Authorization: Bearer` to the NestJS backend. The JWT is never readable by client JS. The one exception is `lib/api/public.ts`, which fetches the no-auth public customer endpoint directly from a Server Component — it doesn't need the proxy.
2. **Server state = TanStack Query, UI state = local `useState`.** Query keys live next to the hooks as exported constants. Mutations invalidate the exact keys they affect.
3. **Forms = React Hook Form + `zodResolver`** with the schema from `lib/schemas/`. Use this project's own `components/ui/form.tsx` (hand-written — see note below). Numeric fields use `components/shared/number-input.tsx`, not a plain `<Input type="number">` bound via spread — Zod schemas here use plain `z.number()`, not `z.coerce.number()`, which breaks `useForm`'s resolver typing. Submit buttons show loading and disable while pending. Server validation errors surface via `sonner` toast; field errors via `FormMessage`.
4. **Every async view renders all four states:** loading (skeletons sized like the real content — no layout shift), empty (`components/shared/empty-state.tsx`), error (friendly message), success.
5. **shadcn/ui first.** Check `components/ui/` before writing any custom element. This scaffold's shadcn generation uses **Base UI (`@base-ui/react`), not Radix** — different primitive props (`render={<Element/>}` instead of `asChild`), and there's no Slot equivalent, hence the hand-written `form.tsx`. Shared app components (`Money`, `StatusBadge`, `ConfirmDialog`, `PageHeader`, `PaginationControls`, `StatCard`, `NumberInput`) live in `src/components/shared/` — reuse them, never re-implement. There is no generic `DataTable`; each list page composes `components/ui/table.tsx` directly (only ~4 tables total — not worth abstracting).
6. **Money is integer minor units end-to-end**, matching the backend. Display only through the `Money` component / `formatMoney`; forms collect major units (dollars) and convert with `toMinorUnits` at the `lib/api/*.ts` boundary, never inside components.
7. **Mobile-first.** Base styles are mobile; scale up with `sm:/md:/lg:/xl:`. No fixed pixel widths — flex/grid + `max-w-*`. `components/ui/table.tsx` already wraps in a horizontal-scroll container.
8. Routes come from `lib/routes.ts`, never inline strings. No comments anywhere. Debounce search inputs with `hooks/use-debounced-value.ts`.
9. **This is Next.js 16, not 15** — `params`/`searchParams`/`cookies()`/`headers()` are `Promise`s with no sync fallback; `middleware.ts` is deprecated in favor of `proxy.ts` (this project doesn't use either — route protection is a plain async Server Component layout, `app/(app)/layout.tsx`, reading `cookies()` and redirecting).

Mirror the customers feature when in doubt — it is the reference implementation.
