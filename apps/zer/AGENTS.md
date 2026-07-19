<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.
<!-- END:nextjs-agent-rules -->

# Zer — Agent Instructions

Load shared context per root `../../AGENTS.md`. Always read `../../docs/vision.md` first — it is the single source of truth for direction and principles.

---

## Core Rules

1. **Server Actions + FormData.** Every mutation is a Server Action with FormData (not JSON API routes).
2. **Multi-tenancy.** Every table has `organization_id`. Every query is RLS-scoped. Never bypass.
3. **Optimistic by default.** Use `useOptimisticCreate`/`useOptimisticUpdate`/`useOptimisticDelete` from `@zuiio/query`.
4. **Use drawers for create/edit/detail.** `SlideInDrawer` / `DrawerLayout` for all side panels.
5. **Test coverage.** Every action, route, and RLS policy has tests.
6. **Design First.** Before new UI, lock design decisions via the 6-Round Lock (see `docs/design/ui-workflow.md`).
7. **PPR shell.** Retain full outer structure during loading/error. No page-replacing early returns.

## Shared vs Zer-Specific

Before writing code, check if it exists in `@zuiio`. Reusable by Tolom → `@zuiio` package. Zer-specific → `src/lib/`. Unsure? Start in Zer, extract later.

**Barrel files** (`src/lib/utils.ts`, `src/lib/format.ts`, etc.) re-export from `@zuiio`. Do not add new code there.

---

## Forms

All forms use **react-hook-form** + **zod** + **Server Actions**:

```tsx
const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
  resolver: zodResolver(schema),
});
const onSubmit = async (data: Values) => {
  const formData = new FormData();
  formData.append("name", data.name);
  const result = await serverAction(undefined, formData);
  if (result?.error) throw new Error(result.error);
};
```

**Rules:** Always `onSubmit={handleSubmit(onSubmit)}` — never `form action={...}`. Use `register()` for standard inputs, `Controller` for custom. Server errors in `serverError` useState or `ErrorBanner`. Combine `mutation.isPending` + `isSubmitting` on submit buttons. Error messages in Mongolian.

## Drawers

Use `SlideInDrawer` / `DrawerLayout` from `@/components/ui/`. For nested drawers (e.g., variant manager inside product create), use `NestedDrawerPanel`.

---

## Enforced Rules (block lint)

### 1. Never `console.error` in catch blocks — use `capture()`/`reportServerError()`
```ts
// ❌ catch (e) { console.error('Query failed:', e); }
// ✅ catch (e) { reportServerError('my_func', e); }
```

### 2. Every Supabase query must capture errors
```ts
// ❌ const { data } = await supabase.from('products').select('*');
// ✅ const { data, error } = await supabase.from('products').select('*');
//    if (error) { reportServerError('query', error); return apiError('QUERY_ERROR', error.message, 500); }
```
**Every query should use `withDbCapture()`** — the only way to guarantee errors aren't silently swallowed.

### 3. No `as any` / `as never` / `as unknown as Record<string, unknown>`
Type assertions suppress type checking and hide missing-column bugs.

### 4. Use `DetailDrawer` for side panels, not raw `Sheet`/`Dialog`
```tsx
// ❌ <Sheet><SheetContent>...</SheetContent></Sheet>
// ✅ <DetailDrawer><DetailDrawer.Header>...</DetailDrawer.Header>...</DetailDrawer>
```

---

## Commands

```bash
pnpm dev                    # Dev server (Turbopack)
pnpm build                  # Production build
pnpm validate               # tsc --noEmit + biome check
pnpm validate:types         # Type-check only
pnpm lint                   # Biome lint only
pnpm test                   # Vitest unit/integration
pnpm test:e2e               # Playwright E2E
```

**Pre-merge:** `pnpm validate && pnpm test`

---

## Permission Boundaries

### ✅ Always
- Use Server Actions + FormData for mutations
- Use `ctx.supabase` from `requireActionContext()`
- Wrap Supabase queries with `withDbCapture()`
- Use optimistic mutation hooks and standard drawer components
- Preserve the PPR shell during loading/error states

### ⚠️ Ask First
- Change accounting, stock, revenue, permissions, or org visibility semantics
- Apply migrations remotely, run backfills, or modify production data
- Extract Zer-specific logic into a shared `@zuiio/*` package
- Add new dependencies

### 🚫 Never
- Add a JSON API route for a standard Zer mutation
- Call `createClient()` directly inside a Server Action
- Replace inline PPR loading/error states with page-level early returns
- Manually patch `database.types.ts`
- Bypass RLS / `organization_id` scoping
- Commit secrets, `.env`, or credentials

## Debugging Checklist

When investigating a bug: (1) check `pnpm dev` terminal for `[capture]` lines, (2) check `pnpm dev` log file, (3) check Supabase logs, (4) check browser console + network tab. Every error must be captured via `capture()`/`reportServerError()` — never silently swallowed.


## On-Demand Documentation

- `docs/design/ui-workflow.md` — 6-Round Lock, screenshot feedback loop, anti-slop
- `docs/development/debugging.md` — capture destinations, redirect-loop, checklist
- `docs/architecture/forms-and-drawers.md` — full form, drawer, checkout examples
- `docs/architecture/optimistic-mutations.md` — mutation examples, cache behavior
- `docs/database/supabase-workflow.md` — RLS SQL, migration procedure, type generation

**Package APIs change across versions. Always use current docs, never training data.**
