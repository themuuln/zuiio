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
supabase start       # Start local Supabase stack
supabase migration new <name>  # Create a new migration
```

Verify before committing:
```bash
npm run lint && npm run test && npm run build
```

## Coding Style & Naming Conventions

- **TypeScript** throughout — no `any` without a comment explaining why.
- **2-space indentation**, single quotes, trailing semicolons (Prettier defaults).
- **Files/directories**: kebab-case (`work-order-form.tsx`, `use-customer-data.ts`).
- **Components**: PascalCase (`WorkOrderForm`), **hooks**: `use` prefix (`useCustomerData`).
- **Database tables/columns**: snake_case (`work_orders`, `organization_id`).
- **API routes**: RESTful — `GET /api/organizations/[id]/work-orders`.

## Database & Multi-Tenancy Rules

- Every table MUST include `organization_id`, `branch_id`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`.
- **Row Level Security (RLS) must be enabled on all tables in public schema.** No exception.
- **Never hard-delete financial records.** Use `deleted_at`, `cancelled`, `voided`, or `refunded` statuses.
- **Inventory must be ledger-based** — never update a `quantity` column directly. Use `inventory_movements` with movement type, source, and audit trail.
- Business logic lives in Next.js server-side API routes and edge functions, **never in the browser**.

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

## Architecture Notes

- **Feature flags and settings over hard-coding** — never build one-off customizations. Everything must be configurable.
- **Read `MASTER_PLAN.md` before building** — the development order (Phase 0 → Phase 1 → ...) is intentional and should not be reordered.
- **Phase 0 (multi-tenant foundation) is the completion gate** — no product features until auth, orgs, branches, roles, and RLS are solid.
