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
supabase start       # Start local Supabase stack
supabase migration new <name>  # Create a new migration
```

Verify before committing:
```bash
npm run lint && npm run test && npm run build
```

## UI Components & shadcn

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

## Supabase Types Sync Rule

- **Regenerate TypeScript types after every migration.** After creating or modifying any migration file, update `src/lib/database.types.ts` so the frontend types match the actual schema.
- Committing a migration without updating `database.types.ts` is a build break waiting to happen — the frontend will reference columns/types that no longer exist or miss new ones.

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

## Гарын авлага (VitePress Documentation) Sync Rule

- **Always update docs after code changes.** After implementing, modifying, or removing any user-facing feature, page, API, or UI element, check whether the corresponding page in `docs/*.md` (VitePress source) needs updating.
- If a new page/feature is added → create a new `docs/*.md` file and add it to `docs/.vitepress/config.mjs` sidebar.
- If an existing page/feature changes → update the matching `docs/*.md` with the current behavior, fields, options, and flow.
- After updating docs source, run `npm run docs:build` to regenerate `public/guide/` and verify the updated pages render via `/guide/*` on the dev server.
- This applies to all feature work, settings changes, UI layout changes, and new modules — not just explicit documentation requests.
