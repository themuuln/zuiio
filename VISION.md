# TOLOM — Project Vision

> Auto service businesses deserve a purpose-built operating system, not a spreadsheet with ambition.

TOLOM is a vertical SaaS platform for auto repair shops — a full operating system that replaces disconnected spreadsheets, paper tickets, and generic CRM tools with a single system of record for work orders, inventory, staff, payments, and customer relationships. Built for Mongolia's auto service market, designed to expand regionally.

**Target users:** Auto repair shop owners/managers (primary), mechanics (mobile), customers (portal).

---

## Goals & Success Criteria

### Primary Goals

1. **Replace every spreadsheet.** Every workflow — intake to invoice to daily close — runs through TOLOM.
2. **Zero-friction daily use.** Create a work order, assign a mechanic, track parts, close the day, see P&L — without training.
3. **Multi-tenant from day one.** Data isolation via RLS. One instance, thousands of shops, zero cross-tenant leakage.
4. **Mobile-first for mechanics.** Every surface works on a 10" tablet. The shop floor is a tablet and a wrench, not a laptop.

### Quality Standards

- TypeScript strict end-to-end. No `any` without justification.
- Pages load < 2s on 4G. API responses < 200ms at p95.
- Every service function, API route, and RLS policy has tests.
- Empty `data:[]` from a broken query must surface as an error, not a blank table.

### Non-Goals

- **Generic CRM/ERP.** We don't serve dentists, lawyers, or salons. Every decision optimizes for auto repair.
- **Self-hosted.** Cloud-only (Supabase + Vercel). No Docker for end users.
- **Enterprise ERP parity.** The 80% that covers 95% of a small shop's needs. Complex accounting integrations come later.
- **Per-tenant CSS overrides.** One design system. Orgs get brand color and logo only.

---

## Architecture & Technical Principles

### High-Level Architecture

```
Browser / Tablet / Phone
        ↓
  Next.js 16 (App Router, RSC)
  ├── [locale]/dashboard/*   → 22 feature modules
  ├── api/                   → RESTful API routes
  └── middleware.ts           → Auth + tenant routing
        ↓
  Supabase (PostgreSQL + Auth + Edge Functions + Storage)
  ├── RLS policies on every table
  └── Edge functions (webhooks, cron)
        ↓
  React Query (server cache) · Zustand (UI state) · nuqs (URL state)
```

### Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 | RSC, streaming, middleware |
| Database & Auth | Supabase (PostgreSQL + SSR) | RLS, managed Postgres, cookie sessions |
| State | React Query + Zustand | Server cache + ephemeral UI |
| Styling | Tailwind + shadcn/ui | Composable, accessible |
| i18n | next-intl | Mongolian + English |
| Testing | Vitest + Playwright | Unit + E2E |
| Monitoring | Sentry + Vercel Analytics | Errors + Web Vitals |

### Design Principles

1. **Single source of truth.** Postgres is canonical. React Query caches it. Zustand holds UI-only state.
2. **Ledger-based mutations.** Inventory, payments, financial records use append-only ledgers. Never UPDATE a quantity directly.
3. **Optimistic by default.** Mutations update UI synchronously. Server reconciles. Error rolls back.
4. **Convention over configuration.** Every module: page → components → queries → services → API route → migration.
5. **Security at the database level.** RLS is primary access control. API routes validate; Postgres enforces.

### Coding Conventions

- TypeScript strict. 2-space indent. Single quotes. Biome for lint/format.
- Files: kebab-case. Components: PascalCase. Hooks: `use` prefix. Tables: snake_case.
- Pages under ~400 lines. One logical change per commit. Tests ship with implementation.

---

## Agent Collaboration Rules

### Decision Hierarchy

1. **VISION.md** — project direction
2. **MASTER_PLAN.md** — phase ordering, feature scope
3. **AGENTS.md** (root + per-module) — conventions, patterns, anti-patterns
4. **Skill files** (`.agents/skills/`) — task-specific procedures
5. **Agent judgment** — fill gaps when docs don't cover a case

### Agent Behavior

- **Read before writing.** Always load the relevant AGENTS.md and skill files before implementing.
- **Verify after building.** `lsp_diagnostics` before builds. `npm run validate` before commits.
- **One module at a time.** Don't refactor neighbors while fixing a target module.
- **Never skip RLS.** Every new table gets policies. Every query is tested against tenant isolation.

### When to Ask the Human

- Business logic changing revenue calculations or data visibility
- Schema migrations altering existing column semantics
- Breaking API response shape changes
- New external dependencies
- Anything touching auth or authorization

### Proceed Autonomously

- Clear bug fixes with testable solutions
- UI adjustments (spacing, loading states)
- Type improvements, test additions, doc updates
- Minor/patch dependency bumps

---

## Constraints & Preferences

### Hard Constraints

- **Multi-tenancy is non-negotiable.** Every table has `organization_id`. Every query is scoped.
- **No hard deletes on financial data.** Use soft delete, void, or refund statuses.
- **Mongolian + English parity.** Every UI string in both locales. No orphan keys.
- **Build must pass.** `npm run validate && npm run test` before any merge.

### Preferred Patterns

- shadcn/ui over custom HTML — never build from scratch what the library provides
- React Query hooks in `src/lib/queries/` — never raw `fetch` + `useState` in components
- API routes use `api-handler.ts` wrapper — consistent error shapes
- Zustand with `devtools + persist + immer` middleware
- Optimistic UI for all user-facing mutations

### Things to Avoid

- Raw color values (`bg-blue-500`) — use semantic tokens (`bg-primary`)
- `space-y-*` / `space-x-*` — use `gap-*` with flex
- Importing from `@/lib/database.types` — always use `@/lib/types`
- Direct DB updates for mutable state — use ledger pattern
- Generic AI-generated copy — TOLOM serves Mongolian auto shops, not a generic audience
