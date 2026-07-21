# @onoo — Agent Instructions

> **Required reading for AI agents:** Before writing any code, load these files:
>
> 1. [Root AGENTS.md](../../AGENTS.md) — shared monorepo rules, conventions, and permission boundaries
> 2. `docs/ROADMAP.md` — feature checklist and implementation status
> 3. `packages/core/src/index.ts` — core package exports

## Overview

**Onoo** is a sports statistics platform for Mongolian basketball leagues. It provides live game tracking, box score derivation, standings, and player/team statistics.

## Directory Structure

```
apps/onoo/
├── packages/core/          ← @onoo/core (events, stats, format, i18n, sync)
├── src/
│   ├── app/                ← Next.js pages (admin, games, teams, players, standings, tracker)
│   ├── components/         ← Shared components
│   └── lib/                ← Utilities, providers, API helpers
├── supabase/
│   ├── functions/          ← Edge Functions (derive-game, manual-box-entry)
│   └── migrations/         ← Database migrations
├── public/                 ← Static assets, PWA manifest
└── docs/                   ← ROADMAP.md (feature checklist)
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| UI | shadcn/ui + Tailwind CSS |
| State | TanStack Query |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Mobile | Expo (Phase 3) |

## Core Rules

### TypeScript
- Strict mode enabled
- `interface` over `type` for object shapes
- `as const` over `enum`
- No `any` without comment

### React
- Server Components by default
- Client Components only when needed (interactivity, browser APIs)
- TanStack Query for server state
- No inline styles — use Tailwind

### Files
- Kebab-case for files: `live-game-center.tsx`
- PascalCase for components: `LiveGameCenter`
- One component per file

### Database
- Use Supabase MCP tools for schema changes
- Always check existing tables before creating new ones
- RLS policies on all tables

### Testing — mandatory for every change
Every new feature, bug fix, or refactor MUST include tests AND be verified by running them.

| Change type | Required test | Tool |
|---|---|---|
| Pure utility / helper / math | Unit test | `vitest` |
| React component | Component test | Vitest + RTL |
| API route / Server Action | Integration test (real DB) | `vitest --config vitest.integration.config.ts` |
| RLS policy | Integration test proving user isolation | `vitest --config vitest.integration.config.ts` |
| Database query / aggregation | Integration test (real DB) | `vitest --config vitest.integration.config.ts` |
| Auth flow | Integration test via Supabase JS client | `vitest --config vitest.integration.config.ts` |
| Critical user flow (login, browse) | E2E (sparingly) | Playwright |

**FastGate — agent verification contract:**
Before declaring any change complete, you MUST run `pnpm test:all`.
1. If tests pass → done.
2. If tests fail → diagnose the failure, fix it, re-run `pnpm test:all`.
3. If still failing after 3 attempts → ESCALATE. Do NOT work around the gate.

**Pre-requisites for running integration tests:**
- `colima start --cpu 4 --memory 8 --dns 8.8.8.8` (one-time)
- `supabase start --exclude studio,imgproxy,logflare,edge-runtime,vector,analytics`
- The above must be running BEFORE `pnpm test:all`

**Mock rule:** Never mock Supabase for integration tests. Use the real Postgres + Auth stack via `supabase start`. Mock-based unit tests are acceptable ONLY for pure logic (formatting, validation, date math).

**Three test layers:**
1. **Unit** (`pnpm test:unit`) — 231 tests, no DB needed, runs in CI first
2. **Integration** (`pnpm test:integration`) — 12 tests, requires Supabase stack
3. **E2E** (`pnpm test:e2e`) — 4 tests, requires Supabase + `@zuiio/ui` build
## Core Package (@onoo/core)

Framework-agnostic. Import from barrel: `import { deriveBoxScore } from "@onoo/core"`

- **Events**: `createEvent()`, `validateEvent()`, `sortEvents()`
- **Stats**: `deriveBoxScore()`, `calculateTotals()`, `detectMilestones()`
- **Format**: `formatNumber()`, `formatPercent()`, `formatClock()`
- **i18n**: `describeEvent()`, `getStatLabel()`
- **Sync**: `EventQueue` (IndexedDB adapter)

## Database Schema

Key tables: `stat_events` (raw play-by-play), `game_player_stats` (derived per-player), `game_team_stats` (derived per-team), `standings` (league standings). Full list in `docs/ROADMAP.md`.

## V2 Trusted-Record Rules

- **Web-first paid-pilot** phase. Mobile, push/follows, claims, consumer analytics, and broad historical import are frozen.
- Lifecycle: `scheduled → live_provisional → final_pending_review → league_verified → official`. Commands enforce every transition.
- `stat_events` are journal entries. Do not delete or rewrite; use void/replacement and retain provenance.
- Derived tables are rebuildable projections, never a browser or import destination.
- Direct writes to `stat_events`, `games.status`, `game_player_stats`, `game_team_stats`, `season_player_stats`, or `standings` are prohibited outside reviewed database commands.
- Public pages read curated `v_public_*` views only. No mock fallbacks.
- Tracker mutations must persist locally before network delivery with idempotency key, session ID, and monotonic local sequence.
- Privileged database functions require explicit authorization, empty `search_path`, revoked `PUBLIC` execution, and narrow grants.

## Commands

```bash
pnpm dev                    # Start dev server (Turbopack)
pnpm build                  # Production build
pnpm -F @onoo/core test     # Run core package tests
pnpm validate:types         # Type-check
pnpm lint                   # Biome lint
pnpm format                 # Biome format
pnpm test:unit              # Fast unit tests (231 tests)
pnpm test:integration       # Real Supabase integration tests (12 tests)
pnpm test:e2e               # Playwright E2E tests (4 tests)
pnpm test:all               # Unit + Integration (CI gate)

## Permission Boundaries

### ✅ Always
- Read nearest `AGENTS.md` and source/tests before editing
- Preserve stat event immutability (append-only journal)
- Keep league/org isolation in every query
- Use pnpm and app-scoped commands (`pnpm build`, not root build)
- **Run `pnpm test:all` and confirm all 243 tests pass before finishing any change**
- **When adding/modifying DB schema, RLS, or API routes: write or update integration tests in `src/app/admin/api/__tests__/*.integration.test.ts`**
- Verify stat derivations against source events after changes
- Regenerate Supabase types using CLI/MCP after migrations

### ⚠️ Ask First
- Directly modify `stat_events`, `game_player_stats`, `game_team_stats`, or `standings`
- Change game lifecycle transitions or status rules
- Add new database tables or RLS policies
- Add, remove, or upgrade dependencies
- Deploy to production or change environment variables
- Modify Edge Function logic

### 🚫 Never
- Delete or rewrite `stat_events` (use void/replacement operations only)
- Skip RLS policies or omit `org_id`/`league_id` scoping
- Expose service-role credentials to client code
- Commit secrets, `.env` files, API keys, or tokens
- Manually edit generated Supabase type files
- Add mock data fallbacks to public pages
- Use npm or Bun (pnpm only)
- Force-push the default branch

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.
<!-- END:nextjs-agent-rules -->

---

**Package APIs change across versions. Always use current docs, never training data.**
