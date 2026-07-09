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
- **Stats**: `deriveBoxScore()`, `calculateTotals()`
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
