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
│   └── api/                  # RESTful API routes
├── components/
│   ├── ui/                   # shadcn primitives (62)
│   └── (feature dirs)        # Domain-specific components
├── lib/
│   ├── services/             # Server-side business logic (47 services)
│   ├── queries/              # React Query hooks (28 hooks)
│   ├── stores/               # Zustand client state (2 stores)
│   ├── validation/           # Zod schemas
│   └── types/                # TypeScript type definitions
└── middleware.ts             # Auth + tenant isolation
```

**Data flow:** Pages → React Query hooks → API routes → Services → Supabase

## Feature Modules

| Module | Description |
|--------|-------------|
| Dashboard | KPIs, charts, timeline, revenue goals |
| Bay View | Multi-view bay management (Grid/Kanban/List) |
| Work Orders | Full CRUD wizard, status lifecycle, PDF generation |
| Estimates | Quote creation, conversion to work orders |
| Customers | CRM with import, notes, shared data |
| Vehicles | Vehicle registry with model catalog |
| Services | Service catalog with bilingual names, model pricing |
| Inventory | Parts, suppliers, POs, movements, valuation, alerts |
| Finance | Revenue tracking, invoices, transactions |
| Expenses | Expense logging with categories |
| Reports | Profitability, mechanic performance, forecasts |
| Settings | 10-section organization configuration |
| Organization | Members, roles, devices management |
| Mechanic | Daily reports, clock in/out, work queue |
| Appointments | Calendar-based scheduling |

## Database

- **Supabase** with PostgreSQL, Row Level Security (RLS) on all tables
- **Multi-tenant** via `organization_id` on every table
- **Ledger-based inventory** — never update quantity directly
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

- **`AGENTS.md`** (root) — Project-wide rules, conventions, and architecture
- **`src/components/AGENTS.md`** — UI component layer
- **`src/lib/services/AGENTS.md`** — Business logic layer
- **`src/app/[locale]/dashboard/*/AGENTS.md`** — Per-module documentation (23 modules)

Each module AGENTS.md documents: file structure, key components, data flow, services used, and conventions. Read the root AGENTS.md first, then drill into the relevant module.

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

Private — © 2026 TOLOM. All rights reserved.
