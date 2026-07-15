# Execution status ledger

Per-task implementation state for the specs in this directory. Updated in the same commit as the work.

**Legend:** ✅ done & verified per spec done-when · 🟡 code-complete, verification blocked by environment · ⬜ not started

**Environment constraints (2026-07-15):** no Docker/container runtime on this machine → no local Supabase stack; only the anon key exists for the hosted project → no DDL can be applied anywhere from this environment. Consequence: migrations are authored and reviewed but unapplied; done-whens requiring live DB behavior stay 🟡 until someone runs the chain (Docker `supabase db reset`, or `supabase db push` with project credentials).

**Hosted project drift (found 2026-07-15 by `scripts/verify-stack.sh --remote`):** the hosted project (`iyhujghadlymroihxyiy`) predates the V2 chain — all 12 probed base tables (`stat_events`, `games`, `game_player_stats`, `game_team_stats`, `season_player_stats`, `standings`, `source_submissions`, `game_revisions`, `audit_log`, `tracker_sessions`, `players`, `teams`) are **anon-readable**, and no `cmd_*` function exists there. The 5 `v_public_*` views do exist and serve pilot data. Deploying the migration chain to that project (or replacing it) is a prerequisite for any real pilot.

## Phase 1 — Trusted data foundation

| Task | State | Notes |
|---|---|---|
| 1.1 Local stack proof | 🟡 | `scripts/verify-stack.sh` written; `--remote` mode run (13 drift findings above). Local mode + types diff blocked on Docker. `src/lib/supabase/types.ts` designated as canonical generated-types path (does not exist yet; first local run creates it). |
| 1.2 Ruleset-bound vocabulary | 🟡 | `validateEvent` extended with optional `ruleset` param → calls `isEventAllowedByRuleset`; 7 new core tests pass. Migration already checks ruleset in `cmd_record_event` (20260712000000). RPC-side rejection unverified — blocked on Docker. |
| 1.3 Submission review UI | ⬜ | |
| 1.4 Projection rebuild command | ⬜ | |
| 1.5 Authorization cutover | ⬜ | |
| 1.6 Journal durability tests | ✅ | 15 core tests for EventQueue durability (subset ack, idempotent ack, rejection persistence, monotonic sequences) pass. Manual reload procedure documented in test file header. |
| 1.7 Handoff UI | ⬜ | |
| 1.8 Runbook + paper fallback | ✅ | `docs/runbook.md` written (pre-game checklist, failure ladder, handoff procedure, post-game flow, error code reference). Printable scoresheet at `/tracker/paper` (A4 portrait, period grid + player tally rows + print CSS). |
| 1.9 Ops console | ⬜ | |
| 1.10 Integration + chaos tests | ⬜ | |

## Phase 2 — Player profile as showcase

| Task | State | Notes |
|---|---|---|
| 2.1 Roster onboarding kit | ⬜ | |
| 2.2 Consent & takedown | ⬜ | |
| 2.3 Hero identity card | ⬜ | |
| 2.4 Season story arc | ⬜ | |
| 2.5 Shooting profile | ⬜ | |
| 2.6 Career highs & milestones | ⬜ | |
| 2.7 Radar vs league average | ⬜ | |
| 2.8 Recent games strip | ⬜ | |
| 2.9 Plain-language summaries | ⬜ | |
| 2.10 Report-error intake | ⬜ | |
| 2.11 Season selector & career | ⬜ | |
| 2.12 Box score below fold | ⬜ | |

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
