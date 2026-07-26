<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.
<!-- END:nextjs-agent-rules -->

# Tolom — Agent Instructions

Load shared context per root `../../AGENTS.md`. Always read `../../docs/vision.md` first — it is the single source of truth for direction and principles. Read the nearest dashboard module `AGENTS.md` before coding in that module.

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

## Commands

```bash
pnpm dev                    # Dev server (Turbopack)
pnpm build                  # Production build
pnpm validate               # tsc --noEmit --incremental + biome check src/
pnpm validate:types         # Type-check only
pnpm validate:lint          # Biome lint only
pnpm lint                   # Biome check only
pnpm test                   # Vitest unit/integration
pnpm test:e2e               # Playwright E2E
pnpm update-types           # Regenerate Supabase types after migration
```

**Pre-merge:** `pnpm lint && npx tsc --noEmit && pnpm build && pnpm test`
**E2E speed:** Always use production build for E2E. Dev mode lazily compiles (8-9s first request).


---

## Local Supabase (Integration Tests)

Integration tests (`src/lib/__tests__/integration/`) require a local Supabase stack via colima:

```bash
# Start colima (macOS Docker runtime, ~1s if already running)
colima start --cpu 4 --memory 8

# Start Supabase (skip services not needed for testing)
supabase start --exclude studio,imgproxy,inbucket,vector,logflare,edge-runtime,meta

# Run full suite with local Supabase credentials
export SUPABASE_URL=http://127.0.0.1:54321
export SUPABASE_ANON_KEY=$(supabase status | sed -n '/Publishable/{n;s/.*│ //;s/ │//;p}')
export SUPABASE_SERVICE_ROLE_KEY=$(supabase status | sed -n '/Secret/{n;s/.*│ //;s/ │//;p}')
npx vitest run

# Stop when done
supabase stop
```

**Key details:**
- The `--exclude` list avoids ports conflicts with other projects. `inbucket` is excluded by default — if a port conflict occurs, stop the other project first: `supabase stop --project-id <name>`.
- Migrations (166 files in `supabase/migrations/`) are applied automatically on `supabase start`.
- Starting fresh: `supabase stop` then `supabase start` resets the DB to a clean migration state.
- One Supabase project can run at a time per port range. If another project is running, stop it first.
- pgTAP RLS tests exist in `supabase/tests/` — run with `supabase test db`. The `pgtap` extension is pre-installed in the local DB.
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
 **This app uses Inline Skeleton loading, NOT general spinner/skeleton-screen loading.**
 
 ### What it means
 
 The component's full shell renders immediately — layout, containers, cards, icons, and **labels as real text**. Only the dynamic data-bound **values** show `<Skeleton>` placeholders.
 
 ```
 ✅ Correct (Inline Skeleton):        ❌ Wrong (General / Full-page skeleton):
 ┌─────────────────────────┐          ┌─────────────────────────┐
 │ Total Revenue           │          │                         │
 │ ▓▓▓▓▓▓▓▓               │  value   │   ┌─────────────────┐   │
 │ ▓▓ ▓▓▓ ↑ ▓▓▓           │  shimmer │   │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │   │
 │ ────────                │          │   │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │   │
 │ Active Work Orders      │  label   │   │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │   │
 │ ▓▓▓▓                    │  real    │   └─────────────────┘   │
 └─────────────────────────┘  text    │                         │
                                       │  (entire surface =     │
                                       │   skeleton blocks)     │
                                       └─────────────────────────┘
 ```
 
 ### Rules
 
 1. **NEVER gate rendering behind `if (loading) return <FullSkeleton>`.** The component tree renders immediately — pass a `loading` prop to data-bound slots, not an early return.
 
 2. **Labels are real text, not skeleton.** A KPI card with `label="Total Revenue"` shows that label as real rendered text on frame 1. Only the `value` (number/currency) gets skeletonized.
 
 3. **Every data-display component needs a `loading` variant.** Each card, stat, metric, and value display must accept `loading?: boolean` and render a `<Skeleton>` in place of the value when loading:
    ```tsx
    // ✅ Correct — label is always visible, value is skeletonized
    <Card>
      <CardHeader>
        <CardTitle>Total Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <span className="text-2xl font-bold">{value}</span>
        )}
      </CardContent>
    </Card>
    ```
 
 4. **Use `<Skeleton>` from `@/components/ui/skeleton`, never a spinner for inline values.** No `Loader2`, `CircularProgressIndicator`, or `<div>Loading...</div>` for data slots. `<Skeleton>` is the only inline loading primitive.
 
 5. **The page shell renders on frame 1.** `loading.tsx` at the page level is only for the very first ever load (Server Component data fetch). After that, client-side navigation always shows the rendered layout with inline skeletons.
 
 6. **Layout-preserving loading:** After the first successful data load, never blank out the layout during refetches — use `keepPreviousData` (React Query) or a `hasLoadedOnce` ref to keep the UI alive and show skeletons only in the transitioning data slots.
 
 ### Current state
 
 **Dashboard (`_dashboard-client.tsx`)** — ✅ Correct. "Always render page structure, skeleton-load values." KPI cards, secondary stats, and chart areas all render the layout with `<Skeleton>` in value slots.
 
 **Admin pages (`dashboard/admin/page.tsx`, `sellers/page.tsx`, `marketing/page.tsx`)** — ❌ Wrong. Uses `if (loading) return <Skeleton>` which replaces the entire page shell. Must be migrated.
 
 ### Migration checklist (for pages that are wrong)
 
 When fixing a page that uses `if (loading) return <Skeleton...>`:
 1. Remove the early `if (loading) return` block
 2. Render the full component tree unconditionally
 3. Pass `loading` to each data-display child that needs it
 4. Ensure labels/icons/structural text are always real rendered elements
 5. Keep `<Skeleton>` only where dynamic values appear


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

- `docs/agent/skill-routing.md` — full 53-line skill matrix and sequencing
- `docs/agent/triage.md` — minor/major heuristics, option-presentation workflow
- `docs/architecture/frontend-patterns.md` — data flow, state management, loading
- `docs/architecture/query-mutations.md` — full `useOrgMutation` examples
- `docs/development/observability.md` — pino/Sentry layers, error discovery
- `docs/database/supabase-workflow.md` — RLS SQL, migration procedure
- `docs/database/common-pitfalls.md` — known issues and fixes
- `e2e/README.md` — fixtures, mocks, resource blocking, sharding

**Package APIs change across versions. Always use current docs, never training data.**
