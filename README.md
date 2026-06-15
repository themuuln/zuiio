# TOLOM — Авто засварын удирдлагын систем

Multi-tenant SaaS platform for auto service businesses. Built with Next.js 16, Supabase, PostgreSQL, and shadcn/ui.

## Quick Start

```bash
pnpm install              # Install dependencies
cp .env.example .env      # Configure environment
supabase start            # Start local Supabase
pnpm run dev              # Start dev server on http://localhost:3000
```

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm run dev` | Dev server (Turbopack) |
| `pnpm run build` | Production build |
| `pnpm run validate` | Fast type-check + lint (~90% less resources than build) |
| `pnpm run test` | Unit/integration tests (vitest) |
| `pnpm run lint` | Biome check (lint + format + import sort) |
| `pnpm run docs:build` | Rebuild VitePress documentation |

## Architecture

```
src/
├── app/
│   ├── [locale]/dashboard/   # 23 feature modules (pages)
│   └── api/                  # RESTful API routes (wrapped via createRouteHandler)
├── components/
│   ├── ui/                   # shadcn primitives (62)
│   └── (feature dirs)        # Domain-specific components
├── lib/
│   ├── services/             # Server-side business logic (74 services)
│   │   └── create-crud-service.ts   # CRUD factory for standardized operations
│   ├── queries/              # React Query hooks with useOrgMutation factory
│   ├── stores/               # Zustand client state (2 stores)
│   ├── validation/           # Shared Zod schemas (11 modules)
│   ├── api-handler.ts        # Route handler factory (rateLimit, subscription, auth)
│   └── types/                # TypeScript type definitions
└── middleware.ts             # Auth + tenant isolation
```

**Data flow:** Pages -> React Query hooks -> API routes (createRouteHandler) -> Services (createCrudService) -> Supabase

### Codebase Cleanup

The project underwent a significant refactoring that standardized boilerplate and reduced code duplication:

- **CrudService factory** (`createCrudService`) standardizes CRUD operations across 13 service files, providing built-in multi-tenancy, soft-delete, audit logging, and cache invalidation.
- **Route handler factory** (`createRouteHandler`) with rateLimit and subscription options removed ~1450 lines of inline boilerplate across ~150 API routes.
- **Shared Zod schemas** provide 11 validation modules (6 domain-specific + 5 common validators), wired into 7 form components.
- **useOrgMutation factory** (`mutation-factory.ts`) eliminated ~2200 lines of duplicated mutation boilerplate across 14+ query hooks.
- **Bay view service** refactored from a 1339-line server action hybrid into pure service functions with thin server action wrappers.
- **3 large files** (>500 lines) split into smaller focused modules.
- **36 characterization tests** added to lock down existing behavior before refactoring.

## Feature Modules

| Module | Description |
|--------|-------------|
| Dashboard | KPIs, charts, timeline, revenue goals |
| Bay View | Workshop bay management with 3 view modes (Grid/Kanban/List), drag-and-drop vehicle/mechanic assignment, queue management, post-service flows, and work order detail drawer. All mutations use React Query optimistic UI with instant cache updates and error rollback. |
| Work Orders | Full lifecycle (create, status transitions, services, parts) |
| Customers | Customer management, vehicle history, invoicing |
| Vehicles | Vehicle registration, plate search, service history |
| Services | Service catalog, pricing, intervals |
| Inventory | Parts catalog, stock management, purchase orders |
| Expenses | Expense tracking, categories |
| Estimates | Quote generation (6 views) |
| Reports | Dashboard, shift reports, technician performance |
| Appointments | Scheduling, reminders |
| Settings | Org settings, roles, members |
| Finance | Revenue tracking, invoices, transactions |
| Organization | Members, roles, devices |
| Mechanic | Daily reports, clock in/out, work queue |

## Database

- **Supabase** with PostgreSQL, Row Level Security (RLS) on all tables
- **Multi-tenant** via `organization_id` on every table
- **Ledger-based inventory** -- never update quantity directly
- Migrations in `supabase/migrations/` (ordered, idempotent)

## Testing

```bash
pnpm run test                    # All tests
pnpm run validate && pnpm run test  # Pre-commit verification
```

- **vitest** for unit/integration tests (co-located with source)
- **Playwright** for E2E tests (in `e2e/`)
- Test credentials: all passwords `Tolom!11`, PIN `1234`

## Documentation

User-facing documentation (Гарын авлага) lives in `docs/` and is built with VitePress into `public/guide/`. See `docs/.vitepress/config.mjs` for the sidebar structure.

## AI Agent Navigation

This project is documented for AI coding agents:

- **`AGENTS.md`** (root) -- Project-wide rules, conventions, and architecture
- **`src/components/AGENTS.md`** -- UI component layer
- **`src/lib/services/AGENTS.md`** -- Business logic layer

Key files for agent orientation: `create-crud-service.ts` (CRUD factory), `api-handler.ts` (route factory), `mutation-factory.ts` (query mutation factory), and `src/lib/validation/` (shared Zod schemas).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | Supabase (PostgreSQL + Auth + Realtime) |
| UI | shadcn/ui + Tailwind CSS v4 |
| State | React Query (server) + Zustand (client) |
| Forms | react-hook-form + Zod validation |
| i18n | next-intl (Mongolian + English) |
| Testing | vitest + Playwright |
| Linting | Biome v2.2.0 |
| Docs | VitePress |

## License

Private -- (c) 2026 TOLOM. All rights reserved.
