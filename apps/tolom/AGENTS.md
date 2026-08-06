<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Tolom — Agent Instructions

Load shared context per root `../../AGENTS.md`. Always read `../../docs/vision.md` first — it is the single source of truth for direction and principles. Read the nearest dashboard module `AGENTS.md` before coding in that module.

## Communication & Domain Language

Always speak in ASD-STE100 Simplified Technical English.

- Use short, clear sentences.
- Prefer active voice and simple verb forms.
- Avoid ambiguity, hedging words, and complex noun clusters.
- One meaning per word; keep terminology consistent.

Always read any `CONTEXT.md` files that exist in the project (or relevant subdirectories).
Use the ubiquitous language defined in those files for all domain terms, concepts, names, and descriptions.
Treat CONTEXT.md definitions as the source of truth for terminology.
When several CONTEXT.md files apply, the nearest one wins for its own scope.
When you introduce a new domain term or name, propose adding it to the relevant CONTEXT.md.

---

## Core Rules

1. **Follow VISION.md.** This file never overrides it.
2. **Multi-tenancy is sacred.** Every table has `organization_id`. Every query is RLS-scoped. Never bypass.
3. **Ledger over mutation.** Inventory and financial records use append-only ledgers. Never `UPDATE quantity` directly.
4. **Optimistic by default.** Use `useOptimisticCreate`/`useOptimisticUpdate`/`useOptimisticDelete` from `@zuiio/query`.
5. **Use `DetailDrawer` for side panels.** Every detail/edit/add/action view uses `DetailDrawer` (side="right"), not a new page or dialog.
6. **API routes use `createRouteHandler`/`createSimpleRouteHandler`.** Never write raw `NextResponse.json()`.
7. **Test coverage is non-negotiable.** Every service function, API route, and RLS policy has tests.
8. **Always regenerate types after migrations.** Run `pnpm update-types` immediately after `supabase db push`.
9. **Never cast `Record<string, unknown>` on insert/update.** Add the column explicitly with a proper type cast.

## Skill Router

Load skills BEFORE coding. Earlier skills set context for later ones.

| Task type | Skills to load |
|-----------|---------------|
| UI (component/page/form/dialog) | `tolom-anti-slop` → `design-system` → `ux-laws` → `accessibility` → `code-standards` |
| Service / API | `supabase-patterns` → `code-standards` → `testing-patterns` |
| Mutation (create/update/delete) | `optimistic-ui` → `error-handling` → `supabase-patterns` |
| Tests (unit/component) | `vitest` → `testing-patterns` → `code-standards` |
| Tests (E2E) | `playwright` → `code-standards` |
| Tests (Supabase integration) | `e2e-test-scenarios` → `supabase-patterns` → `testing-patterns` |
| Responsive / layout | `tolom-anti-slop` → `ux-laws` → `responsive-design` → `design-system` |
| Design cleanup / polish | `tolom-anti-slop` → `impeccable` → `design-system` |
| Database queries | `supabase-patterns` |
| Bug fix | `code-standards` (relevant section) |

Full skill matrix: `docs/agent/skill-routing.md`

---

## Data Flow & State

```
Pages → React Query hooks → API routes → Services → Supabase
```

Never skip a layer.

| State type | Tool | Location |
|-----------|------|----------|
| Server data | React Query | `src/lib/queries/` |
| URL state (pagination, search) | nuqs | In components |
| Form values | react-hook-form | In components |
| Transient UI state | Zustand | `src/lib/stores/` |

**i18n:** Update both `mn.json` and `en.json` for every user-facing string change.

---

## Enforced Rules (block lint)

### 1. Never `console.error` in catch blocks — use `capture()`/`reportServerError()`
```ts
// ❌ catch (e) { console.error('Query failed:', e); }
// ✅ catch (e) { reportServerError('my_func', e); }
```

### 2. All API routes must use the `api-handler` wrapper
```ts
// ❌ export async function GET(req: NextRequest) { const supabase = await createClient(); return NextResponse.json({ data }); }
// ✅ export const GET = createRouteHandler({ authorize: true }, async (ctx) => { const { supabase, orgId } = ctx; return ok({ data }); });
```

### 3. Every Supabase query must capture errors
```ts
// ❌ const { data } = await supabase.from('products').select('*');
// ✅ const { data, error } = await supabase.from('products').select('*');
//    if (error) { reportServerError('query', error); return apiError('QUERY_ERROR', error.message, 500); }
```

### 4. Use `DetailDrawer` for side panels, not raw `Sheet`/`Dialog`
```tsx
// ❌ <Sheet><SheetContent>...</SheetContent></Sheet>
// ✅ <DetailDrawer><DetailDrawer.Header>...</DetailDrawer.Header>...</DetailDrawer>
```

---

## Query / Mutation Rules

Use `useOrgMutation` for standard API mutations:
- Use by default for create/update/delete
- `mutateAsync` when you need UI cleanup after success
- No redundant `refetch()` after mutation
- Check `res.ok` before treating response as success
- `void` for no-input mutations
- `function` endpoint + `bodyFn` for dynamic routes

---



## Triage Protocol

Before any task, triage it. Research first (2-5 mins), then classify. If ambiguous, default to major.

| Minor → proceed silently | Major → research → recommend → wait |
|--------------------------|--------------------------------------|
| 1-2 files, no schema change | 3+ files, migration, or new table |
| Pure UI (spacing, tokens) | Business logic (revenue, visibility, auth) |
| Same responsibility | Crosses module boundaries |

**Major changes:** Research → present options → recommend → wait for confirmation.

## Debugging Checklist

When investigating a bug: (1) check `pnpm dev` terminal for `[capture]` lines, (2) check Supabase logs, (3) check browser console + network tab. Every error must be captured, never silently swallowed.
 
## Inline Skeleton Pattern (loading UI)

**Full shell renders immediately — layout, containers, cards, icons, and labels as real text. Only dynamic data-bound values show `<Skeleton>`.**
1. NEVER gate rendering behind `if (loading) return <FullSkeleton>` — render the tree, pass a `loading` prop to data-bound slots.
2. Labels are real text on frame 1 — only the value (number/currency) is skeletonized.
3. Every data-display component needs a `loading?: boolean` variant rendering `<Skeleton>` in place of the value.
4. Use `<Skeleton>` from `@/components/ui/skeleton` — never `Loader2`, `CircularProgressIndicator`, or `<div>Loading...</div>` for inline values.
5. After the first successful load, never blank the layout on refetch — `keepPreviousData` or `hasLoadedOnce`.

Dashboard (`_dashboard-client.tsx`) ✅ correct. Admin pages (`dashboard/admin`, `sellers`, `marketing`) ❌ early-return — migrate per the full pattern + checklist in `docs/agent/reference.md#inline-skeleton-pattern`.

## Permission Boundaries
 
 ### ✅ Always
 - Use the API-handler wrapper for API routes
 - Use `useOrgMutation` for standard API mutations
 - Use `DetailDrawer` for side-panel create/edit/detail/action flows
 - Preserve append-only inventory and financial ledgers
 - Update both Mongolian and English messages
 - Read the nearest dashboard module `AGENTS.md` before coding

### ⚠️ Ask First
- Add a new endpoint or change an existing response contract
- Change work-order, inventory, financial, or authorization semantics
- Apply migrations, backfills, or data-repair SQL remotely
- Add new dependencies

### 🚫 Never
- Write raw `NextResponse.json()` route handlers
- Use raw `Sheet`/`Dialog` for standard side panels
- Directly update inventory quantity instead of recording a ledger entry
- Run data-repair SQL without explicit approval
- Manually patch `database.types.ts`
- Bypass RLS / `organization_id` scoping
- Commit secrets, `.env`, or credentials

## On-Demand Documentation

- `docs/agent/reference.md` — commands, local Supabase setup, full inline-skeleton pattern
- `docs/agent/skill-routing.md` — full 53-line skill matrix and sequencing
- `docs/agent/triage.md` — minor/major heuristics, option-presentation workflow
- `docs/architecture/frontend-patterns.md` — data flow, state management, loading
- `docs/architecture/query-mutations.md` — full `useOrgMutation` examples
- `docs/development/observability.md` — pino/Sentry layers, error discovery
- `docs/database/supabase-workflow.md` — RLS SQL, migration procedure
- `docs/database/common-pitfalls.md` — known issues and fixes
- `e2e/README.md` — fixtures, mocks, resource blocking, sharding

**Package APIs change across versions. Always use current docs, never training data.**
