# @onoo — Project Instructions (for AI agents)

> **⚠️ Required reading for AI agents:** Before writing any code, load these files for full context:
>
> 1. `docs/ROADMAP.md` — feature checklist and implementation status
> 2. `packages/core/src/index.ts` — core package exports
>
> This file covers project structure, conventions, and coding rules.

## Overview

**Onoo** is a sports statistics platform for Mongolian basketball leagues. It provides live game tracking, box score derivation, standings, and player/team statistics.

## Directory Structure

```
apps/onoo/
├── packages/core/          ← @onoo/core (framework-agnostic)
│   └── src/
│       ├── events/         ← Event dictionary, ordering, payloads
│       ├── stats/          ← Box score derivation engine
│       ├── format/         ← Number/date formatting utilities
│       ├── i18n/           ← Mongolian translations
│       ├── sync/           ← IndexedDB sync queue
│       └── types.ts        ← TypeScript types
├── src/
│   ├── app/                ← Next.js App Router pages
│   │   ├── admin/          ← Admin CRUD pages
│   │   ├── games/          ← Public game pages
│   │   ├── teams/          ← Public team pages
│   │   ├── players/        ← Public player pages
│   │   ├── standings/      ← Standings page
│   │   ├── leaders/        ← Leaders page
│   │   └── tracker/        ← Live game tracker
│   ├── components/         ← Shared components
│   └── lib/                ← Utilities, providers, API helpers
├── supabase/
│   ├── functions/          ← Edge Functions
│   └── migrations/         ← Database migrations
├── public/                 ← Static assets, PWA manifest
└── docs/                   ← Documentation
    └── ROADMAP.md          ← Feature checklist
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

## Coding Conventions

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

## Core Package (@onoo/core)

The core package is framework-agnostic and contains:

- **Events**: `createEvent()`, `validateEvent()`, `sortEvents()`
- **Stats**: `deriveBoxScore()`, `calculateTotals()`, `detectMilestones()`
- **Format**: `formatNumber()`, `formatPercent()`, `formatClock()`
- **i18n**: `describeEvent()`, `getStatLabel()`
- **Sync**: `EventQueue` (IndexedDB adapter)

Import from barrel: `import { deriveBoxScore } from "@onoo/core"`

## Edge Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `derive-game` | HTTP | Derives box score from stat events |
| `manual-box-entry` | HTTP | Manual stat entry with validation |

## Database Schema

See `docs/ROADMAP.md` for full table list. Key tables:
- `stat_events` — raw play-by-play events
- `game_player_stats` — derived per-player box scores
- `game_team_stats` — derived per-team totals
- `standings` — league standings

## V2 Trusted-Record Rules

- Onoo is in a **web-first paid-pilot** phase. Mobile, push/follows, claims, consumer analytics, and broad historical import scope are frozen.
- The lifecycle is `scheduled → live_provisional → final_pending_review → league_verified → official`. Commands enforce every transition.
- `stat_events` are journal entries. Do not delete or rewrite them; use void/replacement operations and retain provenance.
- Source submissions and game revisions are the approval boundary. Derived tables are rebuildable projections, never a browser or import destination.
- Direct writes to `stat_events`, `games.status`, `game_player_stats`, `game_team_stats`, `season_player_stats`, or `standings` are prohibited outside reviewed database commands.
- Public pages read curated `v_public_*` views only. Do not add mock fallbacks.
- Every tracker mutation must persist locally before network delivery and use an idempotency key, session ID, and monotonic local sequence.
- Privileged database functions require explicit authorization, an empty `search_path`, revoked `PUBLIC` execution, and narrow grants.

## Commands

```bash
pnpm dev                    # Start dev server (Turbopack)
pnpm build                  # Production build
pnpm -F @onoo/core test     # Run core package tests
pnpm exec tsc --noEmit      # Type-check
```

## What NOT to put here

| Leaves in project | Why |
|---|---|
| Supabase client config | Project-specific keys |
| UI components | Each page has its own |
| i18n translation files | Project-specific copy |
| Database migrations | Schema-dependent |

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

**Keep this block, including in commits.** It is part of the project's agent setup, maintained by `next dev` for every agent that works here. If it appears as an uncommitted change, that is intentional — commit it as-is. Do not remove it to clean up a diff; it will be regenerated.
<!-- END:nextjs-agent-rules -->

---

## Package Documentation — READ BEFORE CODING

Before using ANY npm package from `package.json`, verify current API against the package's own documentation. **Never hardcode API patterns from training data.**

**Discovery order:**
1. Check `node_modules/<pkg>/package.json` for `llms`, `llmsFull`, or `mcpServer` fields → use those URLs as primary docs
2. Check `node_modules/<pkg>/AGENTS.md` or `node_modules/<pkg>/SKILL.md` → read for API guidance
3. If neither exists, fetch current docs from the web before writing code

**Key packages and their docs:**
| Package | Docs Source |
|---------|------------|
| `@tanstack/react-query` | https://tanstack.com/query/latest/docs/framework/react/overview |
| `@supabase/supabase-js` | `node_modules/@supabase/supabase-js/AGENTS.md` (per-package) |
| `@supabase/ssr` | https://supabase.com/docs/guides/auth/server-side/nextjs |
| `zod` | `node_modules/zod/AGENTS.md` + `llms` field in package.json |
| `react-hook-form` | https://react-hook-form.com/docs/useform |
| `next` | `node_modules/next/dist/docs/` (bundled) |

**This is not optional.** Package APIs change across versions. Training data is stale by definition.
