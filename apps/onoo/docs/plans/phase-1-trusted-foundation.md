# Phase 1 — Trusted data foundation (execution spec)

Prereq reading: `docs/plans/00-conventions.md`. Much of this phase already exists in migrations `20260709*`–`20260712*`; these tasks finish, wire up, and prove that machinery. Check what exists before writing anything new.

## Task 1.1 — Local stack proof

**Goal:** Prove the migration chain resets cleanly, generated types match, and the role matrix holds.
**Touches:** `scripts/` (new: `scripts/verify-stack.sh`), `src/lib/supabase/types.ts` (or wherever generated types live — locate with `grep -r "Database" src/lib/supabase/`).
**Steps:**
1. `supabase db reset` against the local stack; it must complete with zero errors.
2. `supabase gen types typescript --local` → diff against the committed types file; commit the regenerated file if it differs.
3. Write `scripts/verify-stack.sh` that runs both steps plus a role-matrix probe: as `anon`, attempt `SELECT` on each base table (must fail) and each `v_public_*` view (must succeed); attempt `cmd_record_event` as anon (must fail). Use `psql` against the local stack.
**Done when:** script exits 0 locally and is documented at the top of the file with usage.

## Task 1.2 — Ruleset-bound event vocabulary

**Goal:** An event whose type isn't allowed by the game's ruleset is rejected at both layers.
**Touches:** new migration; `packages/core/src/events/` (validation already has `isEventAllowedByRuleset` — verify and extend); core tests.
**Data:** tables `stat_event_types`, `basketball_rulesets`, `games`.
**Steps:**
1. Migration: extend `cmd_record_event` to join the game's ruleset and reject event types not present in `stat_event_types` for that ruleset (raise exception with code `event_type_not_in_ruleset`).
2. Core: ensure `validateEvent` calls `isEventAllowedByRuleset` and the tracker surfaces the rejection reason.
3. Core tests: one allowed and one disallowed event type per ruleset fixture.
**Done when:** core tests pass; recording a disallowed event via RPC in local stack returns the exception.

## Task 1.3 — Submission review UI (approval workflow)

**Goal:** Admins can see and act on the existing approval pipeline from the UI. The RPCs exist; the UI doesn't.
**Touches:** `src/app/admin/games/[id]/` (add a "Review" tab), new components in `src/app/admin/games/[id]/components/`; new migration only for the evidence bucket.
**Data:** tables `source_submissions`, `game_revisions`, `correction_records` (read via admin API routes you add: `src/app/admin/api/games/[id]/submissions/route.ts`, `.../revisions/route.ts`); RPCs `cmd_approve_source`, `cmd_create_revision`, `cmd_approve_revision`.
**Steps:**
1. Migration: private Supabase Storage bucket `evidence` (authenticated read/write for admins only).
2. Admin API routes listing submissions/revisions for a game (auth-checked, per convention).
3. Review tab: list submissions with status, evidence link, approve button → `cmd_approve_source`; list revisions with diff summary, approve button → `cmd_approve_revision`. Confirmation dialog before each approval.
4. Every action shows a sonner toast with the RPC result.
**Done when:** a submission created in seed data can be approved end-to-end from the browser and the game's revision becomes visible in `v_public_box_score`.

## Task 1.4 — Projection rebuild command

**Goal:** Derived tables are rebuilt only from approved revision events, by one SQL command.
**Touches:** new migration adding `cmd_rebuild_projection(p_game_id uuid)`.
**Steps:**
1. Port the derivation in `supabase/functions/derive-game/index.ts` (which calls `deriveBoxScore` from `@onoo/core`) into SQL, or have the command validate + upsert rows computed by the edge function — decision: keep derivation in the edge function, but the edge function must write ONLY via `cmd_rebuild_projection`, which verifies the caller, verifies the game has an approved revision, deletes-and-reinserts `game_player_stats`/`game_team_stats` for that game, and recomputes `season_player_stats` and `standings` rows affected.
2. Wire "Rebuild" button in the admin Review tab (Task 1.3) → edge function → command.
3. Add `private.write_audit` call inside the command.
**Done when:** editing an event via void/replace + re-approve + rebuild changes the public box score; direct `INSERT` into `game_player_stats` as any app role fails.

## Task 1.5 — Authorization cutover (retire legacy write paths)

**Goal:** No path outside `cmd_*` commands can write protected tables.
**Touches:** `src/app/api/import/route.ts`, `supabase/functions/manual-box-entry/`, sweep of app code.
**Steps:**
1. Rewrite `src/app/api/import/route.ts`: instead of writing `season_player_stats` directly, it must create a `source_submissions` row (`cmd_submit_source`) with the parsed CSV as payload, entering the normal review pipeline. Keep the same CSV columns; document in the route header.
2. Delete `supabase/functions/manual-box-entry/` and remove any references (grep `manual-box-entry`).
3. Sweep: `grep -rn "\.insert(\|\.update(\|\.upsert(" src/ supabase/functions/` — every hit on a protected table must be replaced with an RPC or removed. List remaining hits in the PR description with justification.
4. Migration: `REVOKE INSERT, UPDATE, DELETE` on protected tables from `authenticated` and `anon` roles (verify current grants first with `\dp` — this may already hold via RLS; make it explicit).
**Done when:** the grep sweep shows zero unjustified hits and the role-matrix script (Task 1.1) still exits 0.

## Task 1.6 — Journal durability verification

**Goal:** Confirm the existing IndexedDB journal (already implemented in `src/lib/tracker/queue.ts`, state machine pending → sending → acknowledged|rejected) survives reload and replays safely.
**Touches:** `packages/core/src/sync/` tests; `src/lib/tracker/queue.ts` only if a bug is found.
**Steps:** Write core tests for `EventQueue`: enqueue N ops → simulate ack of subset → assert pending set; simulate duplicate ack (idempotency); simulate rejection → op stays with `rejected` state and reason. Document the manual reload test in the file header (start tracking, kill tab, reopen, assert replay).
**Done when:** `pnpm -F @onoo/core test` covers these cases and passes.

## Task 1.7 — Lead-to-backup scorer handoff UI

**Goal:** A backup scorer can take over a live game without double-tracking; `cmd_handoff_session` exists — build the flow.
**Touches:** `src/app/tracker/[gameId]/page.tsx` + new `src/app/tracker/[gameId]/components/handoff-dialog.tsx`.
**Steps:**
1. Tracker header shows current session holder (from `tracker_sessions` via `cmd_open_tracker_session` response).
2. "Гар шилжүүлэх" (handoff) button → dialog → calls `cmd_handoff_session`; old session becomes read-only immediately (tracker checks session validity on every send; on `session_superseded` rejection, lock the UI with a full-screen notice).
3. Pending IndexedDB ops from the old device still flush (they carry the old session id — command must accept acked ops from superseded sessions but reject NEW ops; verify the command does this, extend the migration if not).
**Done when:** two browser profiles can hand off a live game; the superseded profile locks and its queued ops flush.

## Task 1.8 — Game-day runbook + paper fallback

**Goal:** Printed procedure and scoresheet for when tech fails.
**Touches:** new `docs/runbook.md`; new route `src/app/tracker/paper/page.tsx` (printable scoresheet, print CSS via Tailwind `print:` variants).
**Steps:** Runbook sections: pre-game checklist (device charge, local stack of pending ops empty, roster confirmed), during-game failure ladder (app crash → reload/replay; device dead → handoff; network dead → keep tracking offline; all dead → paper sheet), post-game (paper → `manual` source submission via Task 1.3 UI). Paper page: rosters + quarter score grid + per-player tally rows, A4 portrait.
**Done when:** runbook reviewed against the actual tracker flows (no references to features that don't exist) and the paper page prints legibly on A4.

## Task 1.9 — Ops console

**Goal:** One private page showing pilot health.
**Touches:** new `src/app/admin/ops/page.tsx` + admin API route `src/app/admin/api/ops/route.ts`.
**Data (read-only, service-role on server)**: active `tracker_sessions`; count of `source_submissions` with status pending; count of `game_revisions` pending; last 50 `audit_log` rows; games in `final_pending_review` older than 24h (staleness alarm).
**Steps:** single server-rendered page, table per section, red badge when staleness alarm is non-empty. Link it from the admin nav.
**Done when:** page renders with seed data and all counts match SQL spot-checks.

## Task 1.10 — Integration + chaos tests

**Goal:** Prove recovery under failure, mechanically.
**Touches:** `packages/core/src/sync/` (chaos tests), `scripts/integration-test.sh`.
**Steps:**
1. Core chaos tests: random ack/reject/timeout sequences against `EventQueue` invariants (no op lost, no op double-applied — assert by op ledger).
2. `scripts/integration-test.sh`: against local stack — seed a game, record 20 events via `cmd_record_event` (some duplicated operation_ids → must be idempotent), void one, transition to `final_pending_review`, approve revision, rebuild projection, assert `v_public_box_score` totals equal an independently computed expectation.
**Done when:** both run green locally and are documented in the runbook's pre-season checklist.
