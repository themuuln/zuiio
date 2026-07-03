<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent Instructions

## Required reading: @zuiio shared context

Before coding, load these shared design system docs from the `@zuiio` monorepo (sibling dir `../zuiio/`):

| File | What it covers |
|------|----------------|
| `../zuiio/docs/design.md` | OKLch color tokens, typography, spacing, motion, component conventions, voice & tone |
| `../zuiio/docs/vision.md` | Overall zuiio product vision and how we build |
| `../zuiio/docs/stack-web.md` | Next.js 16 stack, Instant Navigations, Turbopack config |
| `../zuiio/.claude/instructions.md` | Design essentials quick reference + common patterns |

**Always read `VISION.md` first** — it is the single source of truth for project direction, architecture, goals, and principles. This file (AGENTS.md) covers operational rules and coding specifics. When in doubt, defer to VISION.md.

---

## Core Rules

1. **Follow VISION.md.** Architecture, design principles, goals, and constraints live there. This file never overrides it.
2. **Read module AGENTS.md before coding.** Every feature module under `src/app/[locale]/dashboard/` has its own AGENTS.md with module-specific patterns. Read it before writing code in that module.
3. **Prioritize clarity and correctness** over cleverness or speed. TOLOM serves real auto shops — bugs lose trust.
4. **Multi-tenancy is sacred.** Every table has `organization_id`. Every query is RLS-scoped. Never bypass.
5. **Ledger over mutation.** Inventory and financial records use append-only ledgers. Never `UPDATE quantity` directly.
6. **Optimistic by default.** All user-facing mutations must update the UI synchronously before server confirmation. Load `.agents/skills/optimistic-ui/SKILL.md` before writing mutation code.
7. **Test coverage is non-negotiable.** Every service function, API route, and RLS policy has tests. Ship tests with implementation.
8. **Load skills before coding.** Check the Skills section → load the listed skills for your task type BEFORE writing any code. Don't skip this.
9. **Use drawers for detail/edit/add/action views.** Every detail view, edit form, add form, or action interface must use a shadcn Sheet (drawer) rather than a new page or dialog. Keeps context and navigation intact. Use the `side="right"` variant as the default.

## Skills

**Load the listed skills BEFORE starting work on each task type.** Don't wait to be asked — these are mandatory pre-reads.

### Skill Loading Rules

| When Task Is... | Load These Skills |
|-----------------|-------------------|
| **New component/page** | `design-system` → `accessibility` → `code-standards` → `responsive-design` |
| **New form** | `design-system` → `accessibility` → `code-standards` → `testing-patterns` |
| **New dialog/sheet/modal** | `design-system` → `accessibility` → `code-standards` |
| **New service function** | `supabase-patterns` → `code-standards` → `testing-patterns` |
| **New API route** | `supabase-patterns` → `code-standards` → `error-handling` → `testing-patterns` |
| **New migration** | `supabase-patterns` → `testing-patterns` |
| **New mutation (create/update/delete)** | `optimistic-ui` → `error-handling` → `supabase-patterns` |
| **Writing tests** | `testing-patterns` |
| **Fixing a bug** | `code-standards` (read relevant section) |
| **Optimizing performance** | `performance` |
| **Responsive/layout work** | `responsive-design` → `design-system` |
| **Theme/visual changes** | `design-system` |
| **Accessibility audit** | `accessibility` |
| **Toast/notification work** | `error-handling` |
| **Design cleanup / anti-slop removal** | `impeccable` → `redesign-existing-projects` → `design-taste-frontend` |
| **Visual polish / UI refinement** | `impeccable` (polish) → `design-system` |
| **Design audit / critique** | `impeccable` (critique) → `design-system` |
| **Redesign existing page/feature** | `impeccable` → `redesign-existing-projects` → `design-system` |
| **Database queries** | `supabase-patterns` |
| **PR review / audit** | **Manual:** `/skill:codebase-review` |

### Loading Order

When multiple skills apply, load them in the listed order. Earlier skills set context for later ones.

### Per-Task Examples

**"Add a customer form"** → `design-system` + `accessibility` + `code-standards` + `testing-patterns`

**"Create invoice refund endpoint"** → `supabase-patterns` + `code-standards` + `error-handling` + `testing-patterns`

**"Fix bay view layout on iPad"** → `responsive-design` + `design-system`

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
- **Validate** → lint, type-check, test, self-review

### Guardrails

- Run `npm run lint && npx tsc --noEmit` (or `npm run validate`) before any build
- Run `npm run validate && npm run test` before considering any task complete
- Run `lsp_diagnostics` on changed files before builds
- Never merge with failing tests or type errors
- One module at a time — don't refactor neighbors while fixing a target
- Atomic commits — one logical change per commit

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
supabase gen types typescript --linked > src/lib/database.types.ts  # Regen types

# Documentation
npm run docs:build             # Rebuild VitePress into public/guide/
```

### Pre-Merge Checklist

```bash
npm run lint && npx tsc --noEmit && npm run build   # Gate build on lint + types
npm run test                                           # Tests after build
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
- **Always import types from `@/lib/types`**, never from `@/lib/database.types` (auto-generated, changes on regeneration).
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
- Load `.pi/skills/design-system/SKILL.md` for full token reference, spacing scale, animation presets, and component composition rules.

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

Load `.agents/skills/optimistic-ui/SKILL.md` before any mutation work. Core rules:

- Never block optimistic updates with `if (busy) return`
- Use stable keys (sorted IDs, not object refs) for reconciliation
- Track in-flight fetches with a counter, not a boolean
- `toast.dismiss()` before `toast.success()` on rapid interactions

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
3. **Regenerate types** after every migration
4. Add RLS policies — every new table must have them
5. Run `npm run validate && npm run test` before committing

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

### Type Safety

- **Regenerate types** after EVERY migration: `supabase gen types typescript --linked > src/lib/database.types.ts`
- **Import from `@/lib/types`**, never from `@/lib/database.types` (breaks on regen)
- **Service functions** must accept `db: SupabaseClient` as first param (enables testing)

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
| Importing `@/lib/database.types` | Build breaks on type regen | Always use `@/lib/types` |
| Missing RLS on new table | Data leaks across orgs | Every new table needs SELECT, INSERT, UPDATE, DELETE policies |
| Types not regenerated | Frontend fields missing/wrong | Run `supabase gen types` after EVERY migration |
| Service role in client | Bypasses RLS accidentally | Use anon key in browser, service_role in server only |

---

## Documentation Sync

After any user-facing change, check if `docs/*.md` (VitePress source) needs updating. If a page/feature changed, update the matching doc and run `npm run docs:build`.

---

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
