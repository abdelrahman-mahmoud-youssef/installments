---
name: frontend-feature
description: How to add or modify a frontend page or feature in this project (Next.js App Router, TanStack Query hooks, API layer, forms, shadcn/ui conventions). Use whenever creating or changing pages, components, hooks, or client-side data fetching.
---

# Adding a frontend feature

Every feature spans four layers — never collapse them into the component:

```
src/lib/api/<feature>.ts        typed API functions (use the shared client from lib/api/client.ts)
src/lib/schemas/<feature>.ts    Zod schemas + inferred types (form + response shapes)
src/hooks/use-<feature>.ts      TanStack Query hooks (queries + mutations, cache invalidation)
src/app/(app)/<feature>/        pages — thin: compose components, wire hooks
src/components/<feature>/       feature components when a page file grows past easy reading
```

## Rules

1. **No `fetch` in components.** All HTTP goes through `lib/api/client.ts` (attaches JWT, parses errors into a typed `ApiError`). API functions return typed data validated against the feature's Zod schema where shape matters.
2. **Server state = TanStack Query, UI state = local `useState`.** Query keys live next to the hooks as exported constants. Mutations invalidate the exact keys they affect.
3. **Forms = React Hook Form + `zodResolver`** with the schema from `lib/schemas/`. Use the shadcn `Form` components. Submit buttons show loading and disable while pending. Server validation errors surface via toast + field errors.
4. **Every async view renders all four states:** loading (skeletons sized like the real content — no layout shift), empty (message + primary action), error (friendly message + retry), success.
5. **shadcn/ui first.** Check `components/ui/` before writing any custom element; add missing primitives with `npx shadcn@latest add <name>`. Shared app components (`DataTable`, `Money`, `StatusBadge`, `ConfirmDialog`, `PageHeader`) live in `src/components/shared/` — reuse them, never re-implement.
6. **Money is integer minor units end-to-end.** Display only through the `Money` component / `formatMoney`; input only through `MoneyInput` (converts to/from minor units at the edge).
7. **Mobile-first.** Base styles are mobile; scale up with `sm:/md:/lg:/xl:`. No fixed pixel widths — flex/grid + `max-w-*`. Tables get horizontal scroll containers on small screens.
8. Routes come from `lib/routes.ts`, never inline strings. No comments anywhere. Debounce search inputs with the shared `useDebouncedValue` hook.

Mirror the customers feature when in doubt — it is the reference implementation.
