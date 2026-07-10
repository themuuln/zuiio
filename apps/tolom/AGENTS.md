<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent Instructions

## Required reading: @zuiio shared context

Before coding, load these shared design system docs from the `@zuiio` monorepo (sibling dir `../../`):

| File | What it covers |
|------|----------------|
| `../../docs/design.md` | OKLch color tokens, typography, spacing, motion, component conventions, voice & tone |
| `../../docs/vision.md` | Overall zuiio product vision and how we build |
| `../../docs/stack-web.md` | Next.js 16 stack, Instant Navigations, Turbopack config |
| `../../.claude/instructions.md` | Design essentials quick reference + common patterns |
| `docs/ux-laws-reference.md` | UX laws, heuristics, cognitive biases — 150+ principles with formulas and examples |

**Always read `VISION.md` first** — it is the single source of truth for project direction, architecture, goals, and principles. This file (AGENTS.md) covers operational rules and coding specifics. When in doubt, defer to VISION.md.

---

## Core Rules

1. **Follow VISION.md.** Architecture, design principles, goals, and constraints live there. This file never overrides it.
2. **Read module AGENTS.md before coding.** Every feature module under `src/app/[locale]/dashboard/` has its own AGENTS.md with module-specific patterns. Read it before writing code in that module.
3. **Prioritize clarity and correctness** over cleverness or speed. TOLOM serves real auto shops — bugs lose trust.
4. **Multi-tenancy is sacred.** Every table has `organization_id`. Every query is RLS-scoped. Never bypass.
5. **Ledger over mutation.** Inventory and financial records use append-only ledgers. Never `UPDATE quantity` directly.
6. **Optimistic by default.** All user-facing mutations must update the UI synchronously before server confirmation. Use `useOptimisticCreate`/`useOptimisticUpdate`/`useOptimisticDelete` from `@zuiio/query` for all mutations.
7. **Test coverage is non-negotiable.** Every service function, API route, and RLS policy has tests. Ship tests with implementation.
8. **Load skills before coding.** Check the Skills section → load the listed skills for your task type BEFORE writing any code. Don't skip this.
9. **Use drawers for detail/edit/add/action views.** Every detail view, edit form, add form, or action interface must use a shadcn Sheet (drawer) rather than a new page or dialog. Keeps context and navigation intact. Use the `side="right"` variant as the default.
10. **Always regenerate types after migrations.** After creating or applying a database migration, immediately run `npm run update-types` to keep `database.types.ts` in sync. The Supabase MCP tools do not auto-regenerate — you must do this yourself. If the migration hasn't been applied yet (e.g. just created the `.sql` file), wait until after `supabase db push` / `mcp__supabase_apply_migration`.
11. **Never cast `Record<string, unknown>` on insert/update calls.** Passing `as unknown as Record<string, unknown>` to `.insert()` or `.update()` suppresses type checking and can hide missing-column bugs. If you need a dynamic value that the Insert/Update type doesn't accept, add the column to the query explicitly with a proper type cast.

## Skills

**Load the listed skills BEFORE starting work on each task type.** Don't wait to be asked — these are mandatory pre-reads.

### Skill Loading Rules

| When Task Is... | Load These Skills |
|-----------------|-------------------|
| **New component/page** | `tolom-anti-slop` → `design-system` → `ux-laws` → `accessibility` → `code-standards` → `responsive-design` |
| **New form** | `tolom-anti-slop` → `design-system` → `ux-laws` → `accessibility` → `code-standards` → `testing-patterns` |
| **New dialog/sheet/modal** | `tolom-anti-slop` → `design-system` → `ux-laws` → `accessibility` → `code-standards` |
| **New service function** | `supabase-patterns` → `code-standards` → `testing-patterns` |
| **New API route** | `supabase-patterns` → `code-standards` → `error-handling` → `testing-patterns` |
| **New migration** | `supabase-patterns` → `testing-patterns` |
| **New mutation (create/update/delete)** | `optimistic-ui` → `error-handling` → `supabase-patterns` |
| **Writing tests** | `testing-patterns` |
| **Fixing a bug** | `code-standards` (read relevant section) |
| **Optimizing performance** | `performance` |
| **Responsive/layout work** | `tolom-anti-slop` → `ux-laws` → `responsive-design` → `design-system` |
| **Theme/visual changes** | `tolom-anti-slop` → `ux-laws` → `design-system` |
| **Accessibility audit** | `ux-laws` → `accessibility` |
| **Toast/notification work** | `error-handling` |
| **Design cleanup / anti-slop removal** | `tolom-anti-slop` → `ux-laws` → `impeccable` → `redesign-existing-projects` → `design-taste-frontend` |
| **Visual polish / UI refinement** | `tolom-anti-slop` → `ux-laws` → `impeccable` (polish) → `design-system` |
| **Design audit / critique** | `tolom-anti-slop` → `ux-laws` → `impeccable` (critique) → `design-system` |
| **Redesign existing page/feature** | `tolom-anti-slop` → `ux-laws` → `impeccable` → `redesign-existing-projects` → `design-system` |
| **Database queries** | `supabase-patterns` |
| **PR review / audit** | **Manual:** `/skill:codebase-review` |

### Loading Order

When multiple skills apply, load them in the listed order. Earlier skills set context for later ones.

### Per-Task Examples

**"Add a customer form"** → `design-system` + `ux-laws` + `accessibility` + `code-standards` + `testing-patterns`

**"Create invoice refund endpoint"** → `supabase-patterns` + `code-standards` + `error-handling` + `testing-patterns`

**"Fix bay view layout on iPad"** → `ux-laws` + `responsive-design` + `design-system`

**"Add optimistic update to work order status"** → `optimistic-ui` + `error-handling` + `supabase-patterns`

**"Write tests for expense service"** → `testing-patterns` + `supabase-patterns`

**"Add dark mode toggle"** → `design-system` + `accessibility` + `code-standards`

**"Clean up this AI slop website"** → `impeccable` (critique) → `redesign-existing-projects` → `design-taste-frontend`

**"Polish this interface / make it look premium"** → `impeccable` (polish) → `design-system`

**"Audit my UI for issues"** → `impeccable` (critique) → `design-system`

---

## Workflow & Autonomy

### Pipeline

Use the **rpiv pipeline** for research, planning, and large features. Every task starts with triage:

- **Triage** → classify scope (see Triage Protocol below). Minor = proceed silently. Major = stop after research and get confirmation.
- **Research** → understand the codebase area, existing patterns, dependencies
- **Plan** → break into phases with clear success criteria
- **Implement** → phase by phase, verify each before moving on
- **Verify at runtime** → use `next-dev-loop` skill (agent-browser + `agent-browser`) after every edit that changes behavior
- **Validate** → lint, type-check, test, self-review

### Guardrails

- Run `npm run lint && npx tsc --noEmit` (or `npm run validate`) before any build
- Run `npm run validate && npm run test` before considering any task complete
- **After every edit that changes UI or behavior:** verify at runtime with `next-dev-loop` (see Pipeline above)
- Run `lsp_diagnostics` on changed files before builds

### Triage Protocol

Before any task, the agent must triage it. Always research first (2-5 mins — read relevant files, understand scope and dependencies), then classify. If the classification is ambiguous, default to major.

#### Heuristics Table

| Minor → Do silently, commit without asking | Major → Research → Recommend → Wait |
|-------------------------------------------|--------------------------------------|
| 1-2 files changed | 3+ files changed |
| No schema/data change | Migration, column semantics, or new table |
| No API response shape change | Breaking API shape or new endpoint |
| Pure UI (spacing, loading, copy, tokens) | Affects business logic (revenue, visibility, auth) |
| Same responsibility, no new concepts | Crosses module boundaries or adds new concepts |
| Production bundle unaffected | New dependency or significant bundle growth |
| Self-contained test addition | Integration tests across multiple services |
| Minor/patch dependency bumps | Anything touching `organization_id` scope logic |
| Type improvements, documentation updates | Bug fixes without clear root cause |

#### Behavior Rules

**If Minor:**

- Proceed with research → implement → validate
- Commit and mention the change in passing

**If Major:**

1. **Research** — understand the code area, read docs, explore 2-3 approaches
2. **Present** — lay out options with trade-offs (one paragraph each)
3. **Recommend** — suggest the best path and why
4. **Wait** — do nothing until the user confirms

Default to major when in doubt. When a major change touches shared code (layouts, wrappers, utilities), also note which sibling routes or modules could be affected.

---

## Tools & Commands

### Essential Commands

```bash
# Development
npm run dev                    # Dev server (Turbopack, lazy compilation)
npm run build                  # Production build
PORT=$(nextport) npm run start # Production server on free port

# Validation (preferred over build for quick feedback)
npm run validate               # tsc --noEmit --incremental + biome check src/
npm run validate:types         # Type-check only
npm run validate:lint          # Biome lint only

# Testing
npm run test                   # Vitest unit/integration tests
npm run test:e2e               # Playwright E2E tests
npm run lint                   # Biome check only
npx tsc --noEmit             # Type check (or npm run validate:types)

# Supabase (CLI only — MCP preferred for queries)
supabase start                 # Local Supabase stack
supabase migration new <name>  # Create migration file
npm run update-types           # Regenerate types after migration (must be applied first)

# Documentation
npm run docs:build             # Rebuild VitePress into public/guide/
```

### Pre-Merge Checklist

```bash
npm run lint && npx tsc --noEmit && npm run build   # Gate build on lint + types
npm run test                                           # Tests after build
```


## 🚨 ENFORCED RULES (block `npm run lint`)

These rules are checked by `npm run lint` and **block CI**.

### Rule 1: Never `console.error` in catch blocks — use `capture()`/`reportServerError()` instead

```ts
+ // ❌ BLOCKED by lint
catch (e) { console.error('Query failed:', e); }
.catch(console.error)

+ // ✅ Required (import from @/lib/sentry-report-server)
catch (e) { reportServerError('my_func', e); }
.catch((e) => reportServerError('my_func', e));
```

The script `scripts/capture-check.mjs` runs as part of `npm run lint` and scans every `.ts`/`.tsx` file. Any `console.error` preceded by `catch` within 3 lines is a violation.

### Rule 2: All API routes must use the `api-handler` wrapper

Never write raw `NextResponse.json()` or `createClient()` in an API route file. Use `createRouteHandler` or `createSimpleRouteHandler` from `@/lib/supabase/api-handler` (if exists, otherwise use `@zuiio/core`).

```ts
+ // ❌ BLOCKED
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  return NextResponse.json({ data });
}

+ // ✅ Required
export const GET = createRouteHandler({ authorize: true }, async (ctx) => {
  const { supabase, orgId } = ctx;
  return ok({ data });
});
```

### Rule 3: Every Supabase query must capture errors

```ts
+ // ❌ Silent error swallowing
const { data } = await supabase.from('products').select('*');

+ // ✅ Required
const { data, error } = await supabase.from('products').select('*');
if (error) { reportServerError('products_query', error); return apiError('QUERY_ERROR', error.message, 500); }
```

### Rule 4: Use `DetailDrawer` for side panels, not raw `Sheet`/`Dialog`

```ts
+ // ❌ Bypasses project pattern
<Sheet><SheetContent>...</SheetContent></Sheet>

+ // ✅ Required
<DetailDrawer>
  <DetailDrawer.Header>...</DetailDrawer.Header>
  <DetailDrawer.Body>...</DetailDrawer.Body>
  <DetailDrawer.Footer>...</DetailDrawer.Footer>
</DetailDrawer>
```

For CI/production readiness, the full chain: `npm run lint && npx tsc --noEmit && npm run build && npm run test`.

### Testing Speed

**Always use production build for testing.** Dev mode lazily compiles (8-9s first request). Production build + `PORT=$(nextport) npm run start` eliminates compilation overhead — first request in ~100ms.

---

## Coding Standards

### Naming & Structure

| Element | Convention | Example |
|---------|-----------|---------|
| Files/directories | kebab-case | `work-order-form.tsx`, `use-customer-data.ts` |
| Components | PascalCase | `WorkOrderForm` |
| Hooks | `use` prefix | `useCustomerData` |
| Database tables | snake_case | `work_orders`, `organization_id` |
| API routes | RESTful | `GET /api/organizations/[id]/work-orders` |

### Type Safety

- TypeScript strict. No `any` without a comment explaining why.
- **Always import types from `@/lib/database.types`**, never from `@/lib/database.types` (auto-generated, changes on regeneration).
- 2-space indent, single quotes, trailing semicolons (Biome defaults).
- **Always use `npm run format -- <path>` to format files.** Never run `npx biome` commands directly — use the scripts in `package.json` instead (`npm run format` for formatting, `npm run lint` for checking, `npm run validate:lint` for CI lint).

### API Routes

- **All routes use `api-handler.ts` wrapper.** Never write raw `NextResponse.json()`.
- **No raw data fetching in page components.** Use React Query hooks (client) or server services (server). No `fetch()` + `useState`/`useEffect` in pages.

### Component Size

- Pages under ~400 lines. Extract sub-components into `_`-prefixed files.
- Files over 500 lines are a signal to split.

### Data Flow

```
Pages → React Query hooks → API routes → Services → Supabase
```

Never skip a layer. See `src/lib/queries/` (hooks), `src/lib/services/` (business logic), `src/app/api/` (routes).

### State Management

| State type | Tool | Location |
|-----------|------|----------|
| Server data | React Query | `src/lib/queries/` |
| URL state (pagination, search) | nuqs | In components |
| Form values | react-hook-form | In components |
| Transient UI state | Zustand | `src/lib/stores/` |

**Zustand stores** require `devtools + persist + immer` middleware. Always export selector hooks — never destructure the full store. See existing stores in `src/lib/stores/` for the pattern.

### Styling

- **Semantic color tokens only.** Use `bg-primary`, `text-muted-foreground`, etc. Never `bg-blue-500`.
- **`gap-*` with flex**, not `space-y-*` or `space-x-*`.
- **`size-*`** when width equals height.
- **`truncate` shorthand**, not `overflow-hidden text-ellipsis whitespace-nowrap`.
- **shadcn/ui components first.** Never build from raw HTML what the library provides.
- See `../../docs/design.md` for full token reference. spacing scale, animation presets, and component composition rules.
### Border Radius Hierarchy

The design system defines a strict radius ladder. Use the right tier for the right element — a card-level container with `rounded-lg` instead of `rounded-xl` is a lint violation.

| Token | Value | Used On | DO NOT use on |
|-------|-------|---------|---------------|
| `rounded-sm` | 6px (`--radius-sm`) | — | Reserve; not currently in use |
| `rounded-md` | 8px (`--radius-md`) | Segmented control inner items (StatusFilter, ViewSelector, BranchPills), inline chips, stat badges | Buttons, inputs, card containers |
| `rounded-lg` | 10px (`--radius`) | **Buttons**, **Inputs**, **Segmented control containers**, dropdowns, popovers, error boundaries, skeleton blocks, toolbar items | Card-level containers (use `rounded-xl`) |
| `rounded-xl` | 14px (`--radius-xl`) | **Card-level containers**: BayCard, SectionCard, NotesSection, StatusTimeline, TotalsSummary, CondensedQueueItem, queue rail items, draggable vehicle wrappers | Buttons, inputs (use `rounded-lg`) |
| `rounded-4xl` | ~26px | Badges, status pills, small decorative dots | Buttons, cards |
| `rounded-full` | `9999px` | Mechanic avatars, icon containers, tight pill labels, timeline dots | Buttons, cards, inputs |

**Card container pattern:** `rounded-xl border border-border/60 bg-card/40 p-3` — never use `rounded-lg` for this combination.
**Segmented control pattern:** container `rounded-lg` / inner items `rounded-md` (StatusFilter, ViewSelector, BranchPills).
**Buttons & Inputs:** always `rounded-lg`, never anything else.
**Stat chips & inline stats:** `rounded-lg` (inside dialogs, KPI cards).

When in doubt: card container → `rounded-xl`, everything else → `rounded-lg` or lower.

### i18n

Both `mn.json` and `en.json` must be updated together. Remove keys from both when deleting UI strings.

### Drawer/Sheet Consistency

All side-panel drawers (create, edit, detail views) follow this structure:

```
DetailDrawer (root — always @/components/ui/detail-drawer)
├── DetailDrawer.Header   ← shrink-0, border-b (title + description, optional actions slot)
├── DetailDrawer.Body     ← flex-1, overflow-y-auto (form/content)
└── DetailDrawer.Footer   ← shrink-0, border-t (Cancel + Submit buttons, outside <form>)
```

Rules:

- **Use `DetailDrawer`** — never raw `Drawer`/`Sheet`/`Dialog` for side panels.
- **Footer outside `<form>`** — buttons connect to the form via `form="<id>"` + `type="submit"` so the footer stays pinned on scroll.
- **Header actions** — use the `actions` prop on `DetailDrawer.Header` for buttons alongside the title (e.g. "Manage Variants"). Never build custom header layouts.
- **Width convention** — simple forms (invite, config) → `size="md"`, standard forms → `size="lg"` (default), complex forms with tables → `size="2xl"`.
- **`modal={false}`** — only when a nested dialog opens while the drawer stays open (e.g. VariantEditorSheet inside EditServiceSheet).
- **All widths use `sm:max-w-*`** — full-width on mobile, constrained on desktop.

---

## Testing Requirements

### Unit & Integration (Vitest)

- **Every service function** in `src/lib/services/` has unit tests.
- **Every API route** has integration tests.
- **RLS policies** are tested — verify Org A cannot access Org B's data.
- Test files are co-located with source or in `__tests__/` directories.
- Naming: `describe('WorkOrderService')` / `it('deducts inventory on part addition')`.

### E2E (Playwright)

- Reuses a single auth session via `e2e/global-setup.ts` → `e2e/.auth/user.json`.
- **shadcn selectors:** Use ARIA roles and `data-*` attributes, never CSS classes. See [Playwright Test Selectors](#playwright-test-selectors) below.
- Route mocking via `playwright_browser_route` for error states and edge cases.

### Testing Hygiene

1. Test each phase before starting the next — don't batch QA.
2. Use production server for API tests, never dev mode.
3. Check response shape — empty `data:[]` could be a silent SQL failure.
4. Test full lifecycle (create → update → delete → verify cascade).

---

## Key Patterns

### Optimistic UI

Use `useOptimisticCreate`/`useOptimisticUpdate`/`useOptimisticDelete` from `@zuiio/query` for all mutations. Core rules:

- Never block optimistic updates with `if (busy) return`
- Use stable keys (sorted IDs, not object refs) for reconciliation
- Track in-flight fetches with a counter, not a boolean
- `toast.dismiss()` before `toast.success()` on rapid interactions


### TanStack Query Mutations (`useOrgMutation`)

**Always use `useOrgMutation` from `@zuiio/query` for all API mutations.** It auto-invalidates related queries and standardizes error handling. Direct `useMutation` is only acceptable when the mutation requires advanced patterns not supported (e.g., offline queues with `useMutationQueue`).

**Admin hooks:** Admin pages operate cross-org, so use `useOrgMutation` with an explicit `endpoint` string, never `createOrgQuery` (which is org-scoped).

**Pattern by use case:**

```ts
// ✅ Standard form create — useOrgMutation + mutateAsync + try/catch
const createMutation = useOrgMutation<unknown, CreateValues>({
  endpoint: `/api/organizations/${orgId}/appointments`,
  method: "POST",
  queryKey: appointmentKeys.all(orgId),
  successMessage: t("created"),
  errorMessage: t("failedToCreate"),
});

const handleSubmit = async (data: CreateValues) => {
  const result = await createMutation.mutateAsync(data);
  form.reset();     // cleanup after success
  onSuccess?.(result);
};

// ✅ Simple delete — useOrgMutation with auto-invalidation
const deleteMutation = useOrgMutation<unknown, void>({
  endpoint: `/api/organizations/${orgId}/customers/${customerId}`,
  method: "DELETE",
  queryKey: customerKeys.all(orgId),
  successMessage: t("deleted"),
});

// ✅ Dynamic endpoint — use a function
useOrgMutation<CashRegisterEntry, { sessionId: string; amount: number }>({
  endpoint: (vars) => `/api/organizations/${orgId}/cash-register/${vars.sessionId}/cash-out`,
  method: "POST",
  queryKey: cashRegisterKeys.all(orgId),
  bodyFn: (vars) => ({ amount: vars.amount }),
  successMessage: "Cash out recorded",
});
```

**Rules:**

1. **Prefer `mutateAsync` + try/catch** in components over `onSuccess` in hook config. This keeps hooks reusable (not coupled to UI state like form reset, drawer close). Only use config-level `onSuccess` for cache-side effects (invalidation propagation, toast).
2. **No manual `refetch()` after mutations.** `useOrgMutation` auto-invalidates via `queryKey` (list queries) and `invalidateKeys` (secondary relations). A manual `refetch()` immediately after a mutation is always redundant.
3. **Every query hook must have `!res.ok` checks.** Raw `fetch` in query functions must check `res.ok` before parsing JSON — a 4xx/5xx response otherwise returns silently broken data:

   ```ts
   const res = await fetch(`/api/...`);
   if (!res.ok) throw new Error(`Failed: ${res.status}`);
   ```

4. **`useOrgMutation` with no-argument mutations** (delete, simple POST) set the type param to `void`: `useOrgMutation<ResponseType, void>({...})`.
5. **Dynamic `endpoint` functions** receive the mutation variables as the first argument. Use `bodyFn` to transform variables into the request body — avoids leaking HTTP-level formatting into call sites.

### Error Logging & Observability

The project uses pino for structured server-side logging and Sentry for error tracking. Three layers catch errors:

1. **API route errors** — `api-handler.ts` try/catch wraps every route with pino + `toApiErrorResponse`
2. **React error boundaries** — call `reportError()` from `@/lib/sentry-report` (client) or `reportServerError()` from `@/lib/sentry-report-server` (server)
3. **Process-wide safety net** — `src/instrumentation.ts` registers `unhandledRejection` and `uncaughtException` handlers that log through pino and send to Sentry

**Supabase errors** are tracked via `logSupabaseResult()` in `@/lib/supabase/logger`, which catches both explicit PostgREST errors and silent RLS null-data failures.

**Agent Error Discovery Protocol** — when you start a session, check for errors autonomously:

1. **SessionStart hook** — `~/.factory/hooks/load-context.sh` prints the last 3 errors from `logs/error.log`
2. **Sentry MCP** — query recent issues/events with `sentry___search_issues` or `sentry___search_events` for stack traces and context
3. **Supabase logs** — use `supabase-tolom___get_logs(service)` for API/DB/Auth-level errors
4. **Raw log file** — read `logs/error.log` directly or use the extraction script:

```bash
node _scripts/extract-errors.mjs --file logs/error.log --tail 20
```

Supports `--tail N`, `--json`, `--context N`, and `--watch` flags. Reads from stdin when no `--file` is given.

**Error file persistence**: All non-Edge pino instances (main logger + process logger) write error-level entries to `logs/error.log`. The file is git-ignored and only persists locally. If the user reports an issue, start by reading `logs/error.log` before asking them to copy-paste anything.

### UI Loading

After first load, preserve page chrome (tabs, headers, buttons) on refetch. Only skeleton-load data-dependent content areas. Use `hasLoadedOnce` to distinguish "never loaded" from "period transition."

### Database Migrations

1. Create migration: `supabase migration new <name>`
2. Write idempotent SQL
3. Apply: `supabase db push` (or `mcp__supabase_apply_migration`)
4. **Regenerate types**: `npm run update-types`
5. Add RLS policies — every new table must have them
6. Run `npm run validate && npm run test` before committing
---

## Supabase Integration Rules

**These rules prevent the most common integration bugs. Follow them on EVERY task touching Supabase.**

### RLS Policy Checklist

Every new table **MUST** have all 4 policies before any code references it:

```sql
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "my_table_select" ON my_table FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "my_table_insert" ON my_table FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "my_table_update" ON my_table FOR UPDATE
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "my_table_delete" ON my_table FOR DELETE
  USING (organization_id = get_user_organization_id());
```

**Verify RLS coverage before writing service code:**

```sql
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
```

### Service Query Checklist

Every service query **MUST** include:

| Clause | Purpose | Example |
|--------|---------|--------|
| `.eq('organization_id', orgId)` | Multi-tenancy scope | Required on every query |
| `.is('deleted_at', null)` | Soft delete filter | Required on every SELECT |
| `.select('col1, col2, ...')` | Explicit columns | Never `select('*')` in production |

- **Regenerate types** after EVERY migration: `npm run update-types`
- **Import from `@/lib/database.types`**, never from `@/lib/database.types` (breaks on regen)

### Auth & Keys

- **Client-side**: Use `anon` key only (respects RLS)
- **Server-side**: Use `service_role` key only (bypasses RLS)
- **Never** mix keys or use inline clients — always use factory functions

### Silent Failure Detection

RLS failures return `data: []` with **no error**. Always:

1. Check `data` is not empty when expecting results
2. Log response shape in development
3. Test with different org users to verify isolation

---

## Common Pitfalls

| Issue | Symptom | Fix |
|-------|---------|-----|
| Nested `[id]` route params | Build error: "same slug name 'id' repeat" | Rename to `[recordId]` or `[orgId]` |
| `profiles!inner` join without FK | Empty `data:[]` silently | Add FK or query profiles separately |
| Missing UNIQUE constraint | Upsert silently fails | Match `onConflict` to a `UNIQUE` constraint |
| Upsert resets immutable fields | Status/paid_at wiped | Use check-then-update instead |
| `revalidateTag` missing 2nd arg | TS error in Next.js 16 | `revalidateTag(tag, "default")` |
| **RLS blocking service queries** | **Empty results, no error** | **Add 4 RLS policies + `.eq('organization_id', orgId)`** |
| Importing `@/lib/database.types` | Build breaks on type regen | Always use `@/lib/database.types` |
| Missing RLS on new table | Data leaks across orgs | Every new table needs SELECT, INSERT, UPDATE, DELETE policies |
| Types not regenerated | Frontend fields missing/wrong | Run `supabase gen types` after EVERY migration |
| Service role in client | Bypasses RLS accidentally | Use anon key in browser, service_role in server only |

---

## Documentation Sync

After any user-facing change, check if `docs/*.md` (VitePress source) needs updating. If a page/feature changed, update the matching doc and run `npm run docs:build`.

---


---

## Debugging

Tolom uses `@zuiio/capture` for unified error capture. Every error is logged to console.error (visible in `npm run dev` terminal) and sent to Sentry.

### How to capture errors

```ts
import { capture, withDbCapture } from "@/lib/capture";

// Generic error
capture(error, { context: "Work order load" });

// Auto-capture Supabase query errors (preferred — catches every path)
const { data, error } = await withDbCapture("loadWorkOrder",
  supabase.from("work_orders").select("*").single()
);
```

**Wrap every Supabase query** with `withDbCapture()` — especially `.single()`, `.maybeSingle()`, and `.insert()` calls.

### Where errors appear

| Source | When | How to check |
|--------|------|-------------|
| `npm run dev` terminal | Immediately | Look for `[capture]` lines |
| `.next/dev/logs/next-development.log` | Immediately | `grep "\[capture\]" .next/dev/logs/next-development.log` |
| Sentry dashboard | Production | `sentry.io` — requires `NEXT_PUBLIC_SENTRY_DSN` |
| Browser DevTools | Client-side errors | Console + Network tabs |

### Redirect loop protection

The middleware (`src/lib/supabase/middleware.ts`) detects repeated redirects and breaks the loop after 3 attempts within 30 seconds.

### Debugging checklist

When investigating a bug:
1. Check the dev terminal for `[capture]` lines
2. Check `grep "\[capture\]" .next/dev/logs/next-development.log`
3. Open the browser and check console + network tab
4. **Use Supabase MCP to query actual data** — don't guess, verify:
   ```sql
   -- Check work order data
   SELECT wo.id, wo.bay_number, wo.status, wo.mechanic_id, p.full_name
   FROM work_orders wo
   LEFT JOIN profiles p ON p.id = wo.mechanic_id
   WHERE wo.bay_number = 1 AND wo.deleted_at IS NULL;

   -- Check helpers for a work order
   SELECT woh.mechanic_id, p.full_name, woh.sort_order
   FROM work_order_helpers woh
   LEFT JOIN profiles p ON p.id = woh.mechanic_id
   WHERE woh.work_order_id = '<work-order-id>';
   ```
5. **Cross-reference** — if `mechanic_id` is null but helpers exist, that's the bug
6. **Fix the data** — promote the first helper to lead:
   ```sql
   UPDATE work_orders SET mechanic_id = '<helper-mechanic-id>' WHERE id = '<work-order-id>';
   DELETE FROM work_order_helpers WHERE work_order_id = '<work-order-id>' AND mechanic_id = '<helper-mechanic-id>';
   ```
7. **Fix the code** — check if the service layer handles this case

## E2E Testing

E2E tests live in `e2e/` and run against a real Next.js production build. The suite is split into two tiers: **fast** (mocked APIs, ~15s timeout) and **full** (real Supabase, ~5min timeout). Default to fast/mocked unless you need to verify real DB behavior.

### Architecture

```
e2e/
├── test-extensions.ts   # Extended test fixture — blocks fonts/images/analytics
├── mocks/
│   └── index.ts         # Route-level API mocking helpers
├── fixtures/
│   └── index.ts         # Deterministic fixture factories (seed IDs + overrides)
├── helpers.ts           # Auth helpers (login, locale, navigation)
├── .auth/user.json      # Saved auth session (global-setup writes this)
├── global-setup.ts      # Logs in once, saves storageState
├── *.spec.ts            # Fast suite (mocked) — uses mocks + fixtures
└── *-full-flow.spec.ts  # Full suite (real DB) — no mocking
```

### Import Convention

**Every spec must import `test` and `expect` from `./test-extensions`, never from `@playwright/test` directly.** The test-extensions fixture blocks fonts, images, and analytics (~25-40% faster page loads). Only import from `@playwright/test` if you need screenshots or visual assertions.

```ts
import { expect, type Page, test } from "./test-extensions";
import { mockBayView } from "./mocks";
import { SEED, bayFixture } from "./fixtures";
```

### Mock Helpers (`e2e/mocks/index.ts`)

Route-level mocks intercept API calls before they reach the server. All mocks use `page.route()` under the hood.

| Helper | What it mocks | When to use |
|--------|---------------|-------------|
| `mockBayView(page, overrides?)` | `GET /api/organizations/[id]/bay-view` | Bay view tests with custom data |
| `mockWorkOrderDetail(page, id, overrides?)` | `GET /api/organizations/[id]/work-orders/[id]/detail` | Work order drawer tests |
| `mockUpdateWorkOrder(page, id, response?)` | `POST /api/organizations/[id]/work-orders/[id]` | Save/update flow tests |
| `mockOrganizations(page)` | `GET /api/organizations/**` | Tests needing org context |
| `mockProfile(page)` | `GET /api/profile` | Tests needing user profile |
| `mockSupabaseREST(page)` | `**/rest/v1/**` (all Supabase REST) | Sledgehammer — empties all Supabase calls |

**Composing mocks:** Stack multiple helpers in `beforeEach` for tests needing several API responses:

```ts
test.beforeEach(async ({ page }) => {
  await mockProfile(page);
  await mockOrganizations(page);
  await mockBayView(page);
  await page.goto("/dashboard/bay-view");
});
```

**Overriding fixture data:** Pass a `Partial<>` override to customize the mock response:

```ts
await mockBayView(page, {
  kpi: { total_bays: 6, occupied: 0, empty: 6, utilization_percent: 0 },
  bays: Array.from({ length: 6 }, (_, i) => bayFixture({ bay_number: i + 1, status: "empty" })),
});
```

### Fixture Factories (`e2e/fixtures/index.ts`)

Fixtures provide deterministic mock data matching real API response shapes. Every factory accepts a `Partial<>` override for test-specific tweaking. All IDs come from `supabase/seed-e2e.ts` for consistency between seeded data and mocked responses.

| Factory | Returns | Key fields |
|---------|---------|------------|
| `bayViewFixture(overrides?)` | `BayViewResponse` | 6 bays (3 occupied, 3 empty), KPI summary |
| `bayFixture(overrides?)` | `BayFixture` | Single bay with vehicle, mechanic, services |
| `workOrderDetailFixture(overrides?)` | `WorkOrderDetailFixture` | Full work order with items, status timeline |

Seed constants are available via `SEED.orgId`, `SEED.mechanics.bat`, `SEED.vehicles.prius`, etc. — match the values in `supabase/seed-e2e.ts`.

### Resource Blocking (`test-extensions.ts`)

The custom `test` fixture intercepts all requests and blocks fonts, images, and analytics scripts. This cuts page load time by ~25-40% for purely functional tests. It is automatically active for all specs importing from `./test-extensions`.

**Blocked categories:** Fonts (woff/ttf/otf), images (png/jpg/webp/svg/gif), analytics (gtag/plausible/google-analytics/vercel-insights).

**When to bypass:** If a test needs screenshots or visual assertions, import `test` directly from `@playwright/test` to get unblocked resources.

### CI Sharding

The `e2e` CI job shards tests across 4 parallel runners with 4 workers each (16x total parallelism):

```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4]
    shardTotal: [4]
```

Run command: `npx playwright test --shard=${{ matrix.shard }}/${{ matrix.shardTotal }}`

CI spins up a local Supabase stack, seeds it (`bun supabase/seed-e2e.ts`), then runs all specs. Reports are merged via `playwright merge-reports` in a follow-up job.

### Writing New Tests

**Default: fast/mocked.** New specs should use mocked APIs for speed. Import from `./test-extensions`, mock the APIs your page hits, and set a tight timeout:

```ts
import { expect, type Page, test } from "./test-extensions";
import { mockBayView } from "./mocks";

test.setTimeout(15_000); // Fast — no real DB round-trips

test.describe("My Feature (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await mockBayView(page); // Mock the APIs this page calls
    await page.goto("/dashboard/my-route");
  });

  test("does the thing", async ({ page }) => {
    // Assert against fixture data
  });
});
```

**Full integration: real DB.** When the test must verify real Supabase queries, RLS, or multi-step mutations, use the real DB. Name the file `*-full-flow.spec.ts` and set a generous timeout:

```ts
import { expect, type Page, test } from "./test-extensions";

test.setTimeout(300_000); // Full — real Supabase + cold start

test.describe("My Feature (Full Flow)", () => {
  test("creates and verifies end-to-end", async ({ page }) => {
    // No mocking — hits real Supabase seeded data
    await page.goto("/dashboard/my-route");
    await expect(page.getByRole(...)).toBeVisible({ timeout: 60_000 });
  });
});
```

**Auth tests** (login, registration, password-reset) stay as-is — they interact with Supabase Auth directly, not REST APIs.

### Rules

1. **Never import `test`/`expect` from `@playwright/test`** in spec files — always from `./test-extensions`.
2. **Mock by default** — only touch real DB when the test specifically needs it.
3. **Use `SEED` constants** for IDs — never hardcode UUIDs.
4. **Keep fast specs under 15s** — mocked APIs are instant; generous timeouts mask failures.
5. **Name full-flow specs with `-full-flow` suffix** so the CI split is obvious.


## Sub-AGENTS.md Reference

| Layer | File |
|-------|------|
| Business logic | `src/lib/services/AGENTS.md` |
| Shared components | `src/components/AGENTS.md` |
| Feature modules | `src/app/[locale]/dashboard/<module>/AGENTS.md` |

Every dashboard module has its own AGENTS.md. Read the relevant one when working in that module — it contains module-specific patterns, API shapes, and pitfalls not covered here.

---

## Design Context

Before making visual decisions, load these project-level design files:

| File | What it covers |
|------|----------------|
| `PRODUCT.md` | Register (product), target users, brand personality, anti-references, design principles, accessibility requirements |
| `DESIGN.md` | Color palette (OKLCH tokens), typography (SF Pro Display), component conventions, elevation, do's and don'ts |
| `packages/zuiio/DESIGN.md` | Parent design system (violet brand, teal accent) — inherited foundation |
| `.impeccable/design.json` | Live panel sidecar: tonal ramps, component HTML/CSS snippets, motion tokens |

**Key identity rules from DESIGN.md:**

- Monochrome-neutral core: no decorative color, no brand color washes
- Single font family (SF Pro Display) for all UI text
- Cards use `ring-1 ring-foreground/10`, never paired with drop shadows
- Red means danger only — never decoration
- Motion: 150–250ms, ease-out-quart, transform/opacity only
- Tablet-native: 44px touch targets
- Tablet-native: 44px touch targets

## Design Pre-Flight (MANDATORY)

Before writing ANY UI/component/layout code, complete these steps:

### Step 1: Load Design Context
```
1. Read DESIGN_SYSTEM.md (tokens, components, violation patterns — machine-readable)
2. Read DESIGN.md (full rationale, do's and don'ts)
3. Read PRODUCT.md (brand personality, anti-references, design principles)
```

### Step 2: Write a Design Plan
Before code, answer in plain text:
- What component am I building?
- Which tokens will I use? (list exact Tailwind classes)
- Which existing component can I reuse or extend?
- What anti-patterns am I avoiding? (name 2-3 specific ones)

### Step 3: Self-Critique
Run the plan through the Slop Test from `tolom-anti-slop` skill. If it fails, revise before coding.

### Step 4: After Code, Validate
Run `node scripts/design-slop-check.mjs` to verify no anti-patterns slipped through.

**This is not optional.** Every UI task goes through pre-flight. No exceptions.

