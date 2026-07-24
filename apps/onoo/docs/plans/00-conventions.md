# Execution Conventions (read before any phase spec)

This file is for AI implementers. Read order: `AGENTS.md` → this file → the phase spec for your task. Do not make architectural decisions yourself — every decision you need is in these files. If a spec contradicts the codebase, stop and report the contradiction instead of improvising.

## Stack facts (verified 2026-07-15)

| Thing | Fact |
|---|---|
| Framework | Next.js 16.2.10, App Router, React 19.2.7, Turbopack |
| Styling | Tailwind CSS v4, shadcn/ui components in `src/components/ui/` |
| Available shadcn components | badge, button, card, dialog, form, input, label, select, separator, table, tabs, textarea |
| Charts | Recharts via shadcn chart component (`src/components/ui/chart.tsx`). Used in shooting-profile, skill-radar, season-arc. |
| Animation | No animation library. Use CSS transitions and the `useCountUp` hook (`src/lib/hooks/use-count-up.ts`). Do NOT add framer-motion. |
| Server state | TanStack Query v5 (client components only) |
| Forms | react-hook-form + zod v4 + `@hookform/resolvers` |
| Database | Supabase. Server client via `@supabase/ssr`; browser client at `src/lib/supabase/client.ts` |
| Icons | lucide-react |
| Toasts | sonner |
| Dates | date-fns + date-fns-tz (timezone: `Asia/Ulaanbaatar`) |
| Monorepo | `@onoo/core` at `packages/core` (framework-agnostic; has its own tests) |

## Data access rules (non-negotiable)

1. **Public pages read curated views only**: `v_public_games`, `v_public_box_score`, `v_public_standings`, `v_public_leaders`, `v_public_team_roster` (+ views added by these specs). Never query base tables from public pages.
2. **All public data fetching goes through `src/app/lib/data.ts`** helper functions. Add new helpers there; follow the existing style (server client, typed returns, empty-array on no data).
3. **Every mutation goes through a `cmd_*` Postgres RPC.** Existing commands: `cmd_record_event`, `cmd_void_event`, `cmd_transition_game`, `cmd_submit_source`, `cmd_approve_source`, `cmd_create_revision`, `cmd_approve_revision`, `cmd_assign_scorer`, `cmd_handoff_session`, `cmd_open_tracker_session`. New mutations need a new `cmd_*` function in a migration, never a direct `.insert()`/`.update()`.
4. **Protected tables — never write from app code**: `stat_events`, `games` (status), `game_player_stats`, `game_team_stats`, `season_player_stats`, `standings`.
5. **Admin API routes** live in `src/app/admin/api/*/route.ts` and must start with the `supabase.auth.getUser()` check → 401, matching existing routes.

## Migration rules

- New migration = new file `supabase/migrations/<UTC yyyymmddHHMMSS>_<snake_case_name>.sql`. Get the timestamp with `date -u +%Y%m%d%H%M%S`. Never edit an already-committed migration.
- View changes use `CREATE OR REPLACE VIEW`. New privileged functions: `SECURITY DEFINER`, `SET search_path = ''`, `REVOKE EXECUTE ... FROM PUBLIC`, explicit `GRANT` to the narrowest role — copy the pattern from `20260712000000_paid_pilot_commands.sql`.
- RLS on every new table. Public-readable data is exposed through a view, not by opening the table.
- Seed fixtures live in `supabase/seed.sql`. When a task's done-when needs seeded data (a live game, a 30-point performance, a hidden player), extend `seed.sql` so the fixture survives `supabase db reset` — never insert ad hoc.

## UI rules

- Server Components by default; `"use client"` only for interactivity (forms, charts, realtime, IndexedDB).
- Mongolian-first copy. Stat labels come from `getStatLabel(stat, locale)` / `STAT_LABELS` in `@onoo/core` (dictionary: `packages/core/src/i18n/stats.ts`, has `mn` and `en` keys). Player names via `formatPlayerName(nameLatin, canonicalName, locale)`.
- Every list/detail surface needs a designed empty state in Mongolian (see existing pattern: "Энэ өдөр тоглолт товлогоогүй байна" on the homepage).
- Layouts must work at 360px width. No login/signup prompts on any public surface.
- Missing player photo → render the placeholder identity component (Task 2.1), never a broken image.
- Files kebab-case, components PascalCase, one component per file. Route-local components go in `src/app/<route>/components/`.

## Dependency policy

Sanctioned additions, and only when their task says so: `recharts` (installed via `pnpm dlx shadcn@latest add chart`). Anything else requires human approval — stop and ask.

## Frozen code — do not touch or extend

- `supabase/functions/notify-game-events/` (push notifications are deferred scope)
- Anything Expo/mobile
- `supabase/functions/manual-box-entry/` — ❌ deleted (Task 1.5). `src/app/api/import/route.ts` now submits via `cmd_submit_source`.

## Definition of done (every task)

1. `pnpm exec tsc --noEmit` passes.
2. `pnpm build` passes.
3. If `packages/core` was touched: `pnpm -F @onoo/core test` passes.
4. Page renders correctly at 360px viewport and shows its empty state when data is absent.
5. The matching checkbox in `docs/ROADMAP.md` is ticked in the same commit.
6. No new console errors in `pnpm dev`.
