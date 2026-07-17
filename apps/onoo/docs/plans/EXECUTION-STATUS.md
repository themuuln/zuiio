# Execution status ledger

Per-task implementation state for the specs in this directory. Updated in the same commit as the work.

**Legend:** ✅ done & verified per spec done-when · 🟡 code-complete, verification blocked by environment · ⬜ not started

**Environment constraints (updated 2026-07-15):** no Docker/container runtime on this machine → no local Supabase stack. Migrations applied to hosted project via Supabase MCP (`mcp__supabase_onoo_apply_migration`). The hosted project now has the full V2 chain: all base tables, RLS policies, private helpers (`user_can_*`, `write_audit`, `raise_error`), all 13 `cmd_*` functions, 5 `v_public_*` views, and seed data. The `20260711094500_v2_recovery.sql` file was patched to remove `ALTER TYPE ... DROP VALUE` (not supported by Postgres) — the MCP-applied version skips those.

**Migration chain status:** `20260712000000_paid_pilot_commands.sql` and `20260712010000_paid_pilot_publication.sql` are NOT yet applied to the hosted project. They enhance `cmd_record_event` with ruleset vocabulary binding and add the correction trio — apply when ready for pilot.


## Phase 1 — Trusted data foundation

| Task | State | Notes |
|---|---|---|
| 1.1 Local stack proof | 🟡 | `scripts/verify-stack.sh` written; `--remote` mode run (13 drift findings above). Local mode + types diff blocked on Docker. `src/lib/supabase/types.ts` designated as canonical generated-types path (does not exist yet; first local run creates it). |
| 1.2 Ruleset-bound vocabulary | 🟡 | `validateEvent` extended with optional `ruleset` param → calls `isEventAllowedByRuleset`; 7 new core tests pass. Migration already checks ruleset in `cmd_record_event` (20260712000000). RPC-side rejection unverified — blocked on Docker. |
| 1.3 Submission review UI | ✅ | `src/app/admin/games/[id]/components/review-tab.tsx` — lists submissions + revisions with approve/reject via `cmd_approve_source`/`cmd_approve_revision` RPCs. Confirmation dialogs, sonner toasts, TanStack Query invalidation. Evidence bucket created (`20260717165045_evidence_storage_bucket.sql`). Game detail page restructured with Tabs (Тоглолт / Шалгах). |
| 1.4 Projection rebuild command | ⬜ | |
| 1.5 Authorization cutover | ⬜ | |
| 1.6 Journal durability tests | ✅ | 15 core tests for EventQueue durability (subset ack, idempotent ack, rejection persistence, monotonic sequences) pass. Manual reload procedure documented in test file header. |
| 1.7 Handoff UI | 🟡 | `tracker/[gameId]/components/handoff-dialog.tsx` written; needs integration verification. |
| 1.8 Runbook + paper fallback | ✅ | `docs/runbook.md` written (pre-game checklist, failure ladder, handoff procedure, post-game flow, error code reference). Printable scoresheet at `/tracker/paper` (A4 portrait, period grid + player tally rows + print CSS). |
| 1.9 Ops console | 🟡 | `src/app/admin/ops/page.tsx` built (active sessions, pending submissions/revisions, audit log, stale games, error reports). Needs integration verification. |
| 1.10 Integration + chaos tests | ⬜ | |

## Phase 2 — Player profile as showcase

| Task | State | Notes |
|---|---|---|
| 2.1 Roster onboarding kit | ⬜ | |
| 2.2 Consent & takedown | ⬜ | |
| 2.3 Hero identity card | ✅ | `src/app/players/[id]/components/hero-card.tsx` — trading-card style, bio + season averages, team color accent. |
| 2.4 Season story arc | ✅ | `src/app/players/[id]/components/season-arc.tsx` — Recharts AreaChart with PTS/REB/AST toggle, game-by-game trend. |
| 2.5 Shooting profile | ✅ | `src/app/players/[id]/components/shooting-profile.tsx` — radial gauge rings (FG/3P/FT) + horizontal points breakdown bar. |
| 2.6 Career highs & milestones | ✅ | `packages/core/src/stats/milestones.ts` (detectMilestones) + `src/app/players/[id]/components/milestones.tsx` (badge display). 331-line test suite passes. |
| 2.7 Radar vs league average | ✅ | `src/app/players/[id]/components/skill-radar.tsx` — Recharts RadarChart, normalized 0–100 axes vs league max, actual values in tooltips. |
| 2.8 Recent games strip | ✅ | `src/app/players/[id]/components/recent-games.tsx` — last-5 game capsules with W/L context. |
| 2.9 Plain-language summaries | ✅ | `packages/core/src/i18n/summaries.ts` — `describePlayerGame()` generates Mongolian one-liners with career-high, double-double, shooting suffix detection. |
| 2.10 Report-error intake | ✅ | `src/components/report-error-dialog.tsx` + `src/app/api/report-error/route.ts` — public dialog with message/contact, POSTs to `public_error_reports`. |
| 2.11 Season selector & career | ✅ | `src/app/players/[id]/components/season-selector.tsx` — competition tabs with career toggle via `?season=` param. |
| 2.12 Box score below fold | ✅ | Player page renders full box score in Tabs component below visual layer. |

## Phase 3 — Discovery & league surfaces

| Task | State | Notes |
|---|---|---|
| 3.1 Home: tonight's games | ⬜ | |
| 3.2 Standings redesign | ⬜ | |
| 3.3 Leaders redesign | ⬜ | |
| 3.4 Qualification rules | ⬜ | |
| 3.5 Awards & MVP races | ⬜ | |
| 3.6 Player comparison | ⬜ | |
| 3.7 Team pages | ⬜ | |
| 3.8 Search & browse | ⬜ | |

## Phase 4 — Shareability & reach

| Task | State | Notes |
|---|---|---|
| 4.1 OG images | ⬜ | |
| 4.2 Shareable stat cards | ⬜ | |
| 4.3 Game recap pages | ⬜ | |
| 4.4 Embeds | ⬜ | |
| 4.5 Sponsor placements | ⬜ | |
| 4.6 Audience dashboard | ⬜ | |
| 4.7 English view/export | ⬜ | |
| 4.8 SEO basics | ⬜ | |

## Phase 5 — Live experience

| Task | State | Notes |
|---|---|---|
| 5.1 Provisional visibility | ⬜ | |
| 5.2 Realtime game center | ⬜ | |
| 5.3 Live stat lines | ⬜ | |
