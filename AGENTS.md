# Repository Guidelines

## Project Overview

TOLOM is a vertical operating system for auto service businesses — a multi-tenant SaaS platform built with Next.js, Supabase, PostgreSQL, and later Flutter for the mechanic mobile app. See `MASTER_PLAN.md` for the full product vision, roadmap, and pricing strategy.

## Project Structure

```
tolom/
├── src/                # Next.js application (frontend + API routes)
│   ├── app/            # App router pages and layouts
│   ├── components/     # Shared React components
│   ├── lib/            # Utilities, clients, helpers
│   └── middleware.ts   # Auth and tenant middleware
├── supabase/           # Supabase migrations, seeds, edge functions
│   ├── migrations/     # SQL migrations (ordered, idempotent)
│   └── functions/      # Edge functions (webhooks, scheduled jobs)
├── docs/               # Product and technical documentation
└── public/             # Static assets
```

## Build, Test, and Development Commands

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run lint         # ESLint check
npm run test         # Run all tests (vitest / jest)
npm run docs:build   # Rebuild VitePress Гарын авлага into public/guide/
supabase start       # Start local Supabase stack (CLI only — no MCP equivalent)
supabase migration new <name>  # Create a new migration file (CLI only — creates local file)
```

Verify before committing:
```bash
npm run lint && npm run test && npm run build
```

## UI Components & shadcn

### Hard rule: Use shadcn MCP to check before building anything

**Before implementing ANY new UI element, use the shadcn MCP tools to check if a component already exists:**
1. `shadcn_search_items_in_registries` — search available shadcn components by keyword
2. `shadcn_get_item_examples_from_registries` — get usage examples with import paths and API
3. Check `src/components/ui/` for already-installed components

**Raw HTML elements (bare `<button>`, `<div>`, `<input>`, `<select>`, `<nav>`, `<aside>`, `<dialog>`) are FORBIDDEN when a shadcn component covers the same use case.** If a shadcn Tab, Dialog, Select, Tooltip, Input, Button, Card, etc. exists, use it — never build from primitives.

### Guidelines

- **Use shadcn/ui components first** — check `src/components/ui/` before building any new UI element. Most form controls, layouts, and interactive elements already have a shadcn primitive.
- **Don't recreate what exists** — if a shadcn component covers 80% of the need, extend it rather than building from scratch. Copy from the shadcn CLI (`npx shadcn add button`) instead of writing bespoke components.
- **Register all shadcn components** in `src/components/ui/`. Keep them minimal — no app-specific styling, no business logic.
- **Use the existing components** (Button, Input, Card, DropdownMenu, Avatar, Skeleton, Tooltip, Typography) before reaching for a custom solution.
- **Before adding a new dependency**, check if shadcn already provides what's needed (dialog, popover, select, table, form, etc.).

## i18n Message Parity

- **Both `mn.json` and `en.json` must be updated together.** When adding or changing any UI string, always add the corresponding key in both locale files. Missing translations cause fallback keys to show in the UI.
- When a key is removed from the code, remove it from both `src/messages/mn.json` and `src/messages/en.json`.

## Coding Style & Naming Conventions

- **TypeScript** throughout — no `any` without a comment explaining why.
- **2-space indentation**, single quotes, trailing semicolons (Prettier defaults).
- **Files/directories**: kebab-case (`work-order-form.tsx`, `use-customer-data.ts`).
- **Components**: PascalCase (`WorkOrderForm`), **hooks**: `use` prefix (`useCustomerData`).
- **Database tables/columns**: snake_case (`work_orders`, `organization_id`).
- **API routes**: RESTful — `GET /api/organizations/[id]/work-orders`.

## API Route Consistency

- **All API routes must use the `api-handler.ts` wrapper.** This ensures consistent error shapes (`ApiResponse<T>`), proper HTTP status codes, and unified error logging. Do not write raw `NextResponse.json()` in route handlers — never duplicate error-handling logic.
- Page components must not contain direct data-fetching logic (raw `fetch()` + inline `useState`/`useEffect`). All data fetching should go through either:
  - **React Query hooks** in `src/lib/queries/` for client-side data
  - **Server services** in `src/lib/services/` for server-side logic
- The only exception is quick prototyping, but it must be migrated before merging.

## Component Size & Splitting

- **Keep page components under ~400 lines.** Beyond that, extract sections into sub-components or separate files (e.g., `_charts.tsx`, `_kpi-card.tsx`, `_work-orders-table.tsx`).
- Files exceeding 500 lines are a signal to split. Place extracted sub-components in a `_`-prefixed file in the same directory (e.g., `dashboard/_charts.tsx`).

## Data Fetching Pattern

| Layer | Location | When to Use |
|-------|----------|-------------|
| **React Query hooks** | `src/lib/queries/` | Client-side pages that need caching, refetching, loading/error states |
| **Server services** | `src/lib/services/` | API route handlers and server components |
| **Direct fetch** | Inside API routes only | To call Supabase or external services from an API handler |

The rule: pages use hooks, hooks call API routes, API routes call services, services query Supabase. Never skip a layer.

## Database & Multi-Tenancy Rules

- Every table MUST include `organization_id`, `branch_id`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`.
- **Row Level Security (RLS) must be enabled on all tables in public schema.** No exception.
- **Never hard-delete financial records.** Use `deleted_at`, `cancelled`, `voided`, or `refunded` statuses.
- **Inventory must be ledger-based** — never update a `quantity` column directly. Use `inventory_movements` with movement type, source, and audit trail.
- Business logic lives in Next.js server-side API routes and edge functions, **never in the browser**.

## Supabase CLI & MCP Usage

### CLI vs MCP — When to Use What

| Operation | Preferred Tool | Notes |
|-----------|---------------|-------|
| Create migration file | **CLI** `supabase migration new <name>` | MCP has no equivalent |
| Apply migration to remote | **MCP** `execute_sql` | Avoids migration history conflicts; but see warning below |
| Generate TS types (Docker down) | **CLI** `supabase gen types typescript --linked > src/lib/database.types.ts` | Works without Docker; requires `supabase login` |
| Generate TS types (Docker up) | **MCP** `supabase-tolom_generate_typescript_types()` | Writes to file automatically |
| Execute ad-hoc SQL query | **MCP** `execute_sql` | CLI `db query` connects to **local Docker**, not remote (counter-intuitive) |
| Deploy edge function | **MCP** `deploy_edge_function` | CLI also works: `supabase functions deploy <name>` |
| Check security/performance | **MCP** `get_advisors` | — |

### ⚠️ Critical: Don't Mix MCP `execute_sql` and CLI `db push`

**Problem**: MCP `execute_sql` applies SQL directly to the database WITHOUT recording it in the `_supabase_migrations` history table. If you later run `supabase db push`, the CLI detects these as "Remote migration versions not found in local migrations directory" and **blocks** with a repair error.

**Fix when this happens**: The CLI prints exact repair commands:
```bash
supabase migration repair --status applied <version>  # Mark remote-only as applied locally
supabase migration repair --status reverted <version>  # Drop local-only from history
```
Copy-paste the repair lines from the error output.

**Better: Use MCP exclusively, or CLI exclusively. Don't switch mid-stream.**

### `supabase db query` is Local-Only

Despite the name, `supabase db query` connects to the **local Docker Postgres** (port 54322), not the remote database. If Docker isn't running, it fails with `connection refused`. To run SQL on remote without Docker:
- Use MCP `execute_sql`
- Use `psql` with the connection string from Supabase dashboard
- Use Supabase Studio SQL editor

### `supabase gen types typescript --linked` Works Without Docker

This is the most reliable remote operation. It connects to the linked project via the Supabase API (not Postgres directly), so it works even when Docker is down. Only requires `supabase login` to have been done previously.

### Recommended Workflow

```
1. supabase migration new <name>              # CLI — creates local file
2. # write SQL in the migration file
3. # pick ONE apply method and stick with it:
```

**Option A: CLI-only** (needs Docker running)
```bash
supabase start
supabase db push            # Apply pending migrations
supabase gen types typescript --linked > src/lib/database.types.ts
npm run build
```

**Option B: MCP-only** (no Docker needed)
```
supabase-tolom_execute_sql(query="<migration-sql>")
supabase-tolom_generate_typescript_types()
# then manually create the migration .sql file for git history
```

**Option C: Hybrid with repair** (if you mix by accident)
```bash
# After MCP applied migrations:
supabase db push  # Will fail with repair instructions — follow them
supabase gen types typescript --linked > src/lib/database.types.ts
```

### Type Sync Rule

- **Regenerate TypeScript types after every migration**, regardless of which tool applied it.
- After MCP: call `supabase-tolom_generate_typescript_types()`.
- After CLI: `supabase gen types typescript --linked > src/lib/database.types.ts`.
- Committing a migration without updating `database.types.ts` is a build break — the frontend will reference columns/types that don't exist or miss new ones.
- Always run `npm run build` after regenerating types to catch mismatches.

### Failure consequence
Skipping the deploy step causes **"Failed to load..." errors** — API routes/Supabase queries fail because the remote database doesn't have the latest tables/functions. All development blocks until resolved.

## Testing Guidelines

- **Framework**: vitest (unit/integration), Playwright (E2E).
- **Test files**: co-located with source or in `__tests__/` directories.
- **Naming**: `describe('WorkOrderService')` / `it('deducts inventory on part addition')`.
- **RLS policies must be tested** — verify Organization A cannot access Organization B's data.
- Run `npm run test` before opening a PR.

## Commit & Pull Request Guidelines

This repo follows the global guidelines in `~/.factory/AGENTS.md`:

- **Atomic commits** — one logical change per commit.
- **Do not commit secrets, env files, or local config.**
- **Test files must be in the same commit as their implementation.**
- **Commit order**: utilities/types → models/schemas → services/logic → API/controllers → config/infra.
- PRs should reference the relevant phase from `MASTER_PLAN.md` and include screenshots for UI changes.
- **Branch naming**: `feat/<phase>/<module>-<description>` — e.g., `feat/phase1/inventory-ledger`, `feat/phase2/services-catalog`. This links every branch to the development phase in MASTER_PLAN.md and makes it easy to track progress.

## Architecture Notes

- **Feature flags and settings over hard-coding** — never build one-off customizations. Everything must be configurable.
- **Read `MASTER_PLAN.md` before building** — the development order (Phase 0 → Phase 1 → ...) is intentional and should not be reordered.
- **Phase 0 (multi-tenant foundation) is the completion gate** — no product features until auth, orgs, branches, roles, and RLS are solid.

## Installed Agent Skills (Global)

The following skills are installed globally (`~/.agents/skills/`) and MUST be loaded via `skill(name="...")` when the task matches their domain. They auto-trigger on relevant keywords.

| Skill | When to Load | Trigger Keywords |
|-------|-------------|-----------------|
| **frontend-design** | Designing/redesigning any UI — pages, components, layouts. Rejects generic AI aesthetics. | `design UI`, `redesign`, `make it look good`, `frontend`, `landing page`, `aesthetic` |
| **ui-ux-pro-max** | Choosing colors, typography, layout patterns, or reviewing UX. 50+ styles, 161 palettes, 57 font pairings. | `color palette`, `typography`, `UX pattern`, `design system`, `style guide`, `UI review` |
| **web-design-guidelines** | Auditing UI code for design and accessibility compliance against Vercel standards. | `audit design`, `check UI`, `accessibility review`, `design review`, `polish` |
| **marketing-psychology** | Applying behavioral science, cognitive biases, or psychology to conversion, onboarding, or pricing pages. | `psychology`, `cognitive bias`, `conversion`, `behavioral science`, `persuasion`, `A/B test` |
| **product-management** | Product strategy, roadmap, prioritization, PRDs, OKRs, PMF measurement, stakeholder decisions. | `roadmap`, `prioritize`, `PRD`, `OKR`, `product strategy`, `PMF`, `RICE`, `backlog` |

**Usage**: When a task matches any trigger keyword above, call `skill(name="<skill-name>")` before proceeding.

## Гарын авлага (VitePress Documentation) Sync Rule

- **Always update docs after code changes.** After implementing, modifying, or removing any user-facing feature, page, API, or UI element, check whether the corresponding page in `docs/*.md` (VitePress source) needs updating.
- If a new page/feature is added → create a new `docs/*.md` file and add it to `docs/.vitepress/config.mjs` sidebar.
- If an existing page/feature changes → update the matching `docs/*.md` with the current behavior, fields, options, and flow.
- After updating docs source, run `npm run docs:build` to regenerate `public/guide/` and verify the updated pages render via `/guide/*` on the dev server.
- This applies to all feature work, settings changes, UI layout changes, and new modules — not just explicit documentation requests.
