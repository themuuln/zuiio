---
meta:
  title: "Migrate the Onoo prototype to the V2 paid-pilot plan"
  contentType: "How-to"
  audience: "Onoo product owner and implementation team"
  goal: "Replace the V1 prototype roadmap with a secure, auditable web pilot that can support a paid four-game proof."
  contentPlan:
    - "Adopt the V2 commercial and product scope"
    - "Recover a reproducible database and authorization baseline"
    - "Build the trusted-record vertical slice"
    - "Prove the slice in rehearsals before a paid pilot"
  openQuestions:
    - "Which league signs the design-partner agreement?"
    - "Does the authorized source require an integration instead of direct tracking?"
    - "Which remote schema recovery route preserves the trusted production record?"
---

# Migrate the Onoo prototype to the V2 paid-pilot plan

V2 changes the delivery target from a broad sports-statistics product to a paid, web-first basketball operations pilot. Existing source remains a prototype reference. It must not determine release order or support a public "official" claim.

This plan applies V2 as the execution authority. It preserves useful derivation and registry work, but it replaces unsafe record-changing paths and defers consumer expansion until the pilot gates pass.

## Confirmed migration impact

| Area | V1 / current prototype | V2 requirement | Required cutover |
|---|---|---|---|
| Business target | Public stats product, mobile, analytics, and second-sport work progressed in parallel | One contracted basketball competition and a complete trusted-record flow | Freeze expansion until discovery produces a signed letter of intent or paid pilot agreement |
| Launch scope | `apps/onoo-app`, claims, push, shot charts, comparisons, exports, and broad public surfaces appear complete in the roadmap | Web pilot only; mobile, claims, push, advanced analytics, multi-sport, payments, and public API are deferred | Hide these surfaces behind an internal-demo flag and remove them from launch navigation, deployment claims, and acceptance gates |
| Schema history | Git tracks migrations 001–004, 008, and 009; the hosted project has 001–007 plus a duplicate `007_apply_derived_stats` | One clean, reproducible schema chain | Reconcile hosted history and Git before any feature migration; never patch an unknown remote state |
| Source of truth | Events exist, but manual entry deletes and writes derived tables; CSV import writes season aggregates directly | Every result derives from an approved, versioned live, authorized-import, or manual-backfill source | Replace manual entry and CSV aggregate import with reviewed source submissions and rebuildable projections |
| Game lifecycle | `games.status` and UI allow direct updates; `derive-game` only finalizes or verifies | `scheduled → live provisional → final pending review → league verified → official`, with reviewed corrections | Enforce transitions, approver identity, revision number, and correction lineage in the database |
| Reliability | `EventQueue` is an in-memory class and tracker posts directly after each action | Durable local journal, acknowledgements, recovery after reload, retry/backoff, single-writer handoff, and visible health | Persist before network activity and replace direct browser writes with idempotent commands |
| Authorization | Browser routes and Edge Functions mutate tables directly; hosted `SECURITY DEFINER` functions are callable by `anon` and `authenticated` roles | Narrow authenticated commands with server-side role, league, roster, status, sport, period, and idempotency checks | Revoke unsafe execution, redesign mutation boundaries, and add a role-matrix integration suite |
| Public trust | Public pages fall back to mock data and expose no provenance or revision state | Curated public results with source, status, reviewer, and published revision | Remove silent fallback data and publish only approved projection views |

## Current evidence and non-negotiable decisions

- The hosted Supabase project contains only fixture-scale data: three games, zero journal events, zero derived rows, and zero standings rows. It is not a production record.
- The hosted migration list differs from Git. Remote contains the missing RLS, rollup, and RPC history, while Git contains 008 and 009 that are absent remotely. The remote history also contains two migrations named `007_apply_derived_stats`.
- The Supabase security advisor reports public execution paths for `apply_derived_stats`, `game_league_id`, `is_game_scorekeeper`, `is_league_admin`, `refresh_season_player_stats`, and `refresh_standings`. It also reports an `audit_log` table with RLS enabled but no policy.
- `apps/onoo/src/app/tracker/[gameId]/page.tsx` creates a fresh in-memory `EventQueue` after mount and writes events, event edits, game status, and undo operations directly from the browser.
- `apps/onoo/supabase/functions/manual-box-entry/index.ts` deletes and reinserts `game_player_stats` and `game_team_stats`. `apps/onoo/src/app/api/import/route.ts` writes `season_player_stats` directly. Neither path meets the V2 source model.
- `apps/onoo/src/app/lib/data.ts` and `apps/onoo/src/app/games/[id]/page.tsx` return or render fallback/mock data. A pilot must not silently substitute this data for a real record.

## Scope and source-of-truth cutover

### Product boundary

Ship only this vertical slice for the first paid pilot:

1. Configure competition, roster, venue, assigned scorer, and approving official
2. Capture live events or ingest an authorized manual or historical source with evidence
3. Persist a durable game journal and expose scorer sync health
4. Finalize, review, verify, correct, and publish with immutable revision history
5. Publish a real game result, basic standings, team/roster page, export, and final-data embed
6. Operate a console for game readiness, queue health, reviews, corrections, incidents, and service-level agreement reporting

Keep existing mobile, claims, push, shot charts, player comparisons, team analytics, advanced metrics, generic CSV import, open API, multi-sport, registration, payments, ticketing, and advertising code as internal demos only. Do not delete useful prototypes during the pilot migration. Do not display them as released pilot capabilities.

### Documentation cutover

| File | Action | Specific change |
|---|---|---|
| `docs/notes/onoo-sports-stats-platform-plan-v2.md` | Keep | Treat sections 5, 6, 7, 9, 10, and 11 as the product and acceptance authority |
| `docs/notes/onoo-sports-stats-platform-plan.md` | Keep | Mark as superseded strategy reference in its opening metadata or companion index; do not rewrite historical reasoning |
| `docs/notes/onoo-implementation-spec.md` | Keep | Add a prominent V2 supersession notice; retain only reusable prototype details until its data and security sections are reconciled |
| `apps/onoo/docs/ROADMAP.md` | Replace | Remove all "complete" production claims. Add V2 gates: discovery, schema recovery, secure slice, rehearsal, paid proof, full-season reference, then expansion |
| `apps/onoo/docs/ARCHITECTURE.md` | Replace | Describe authoritative commands, durable journal, approved source revisions, rebuildable projections, curated public views, and the operations console |
| `apps/onoo/AGENTS.md` | Modify | Add V2 state-machine, source-model, and pilot-scope constraints so future implementation cannot reintroduce direct derived-table writes or consumer-scope work |

## Migration sequence

### Phase -1: validate the paid problem before funding recovery

**Outcome:** One design-partner league supplies a named buyer, approving official, game calendar, data-rights path, and paid problem.

1. Meet the Space League founder and the V2 discovery cohort: MBA/FIBA contact, Stat.mn, Leagues.mn, MSports, two league operators, four scorekeepers, three club general managers, and three sponsors.
2. Observe two to four live games. Record the authoritative source, data-entry workflow, failure recovery, correction workflow, export needs, rights holder, and payer for each game.
3. Complete the FIBA LiveStats and incumbent workflow teardown. Decide whether Onoo tracks live events, integrates an authorized source, or operates reconciliation and publication around an incumbent.
4. Obtain a letter of intent or signed pilot agreement. The agreement must specify a one-season minimum, payment schedule, data rights, raw-data ownership, public and export rights, correction window, SLA, service scope, and termination or takedown terms.

**Stop condition:** Two prospective buyers name the same paid gap and one signs a letter of intent or pilot agreement. Stop product expansion if this gate fails.

### Phase 0A: freeze prototype expansion and recover the database baseline

**Outcome:** A clean, reproducible local schema matches the chosen remote baseline, has generated types, and passes function and RLS checks in continuous integration (CI).

1. Freeze feature development outside the pilot slice. Add a temporary internal-demo feature flag to prevent deferred mobile and consumer work from appearing in web pilot navigation.
2. Export and preserve the hosted migration history, schema definition, function definitions, RLS policies, storage configuration, seed state, and row counts. Record SHA-256 checksums in `apps/onoo/docs/schema-recovery-record.md`.
3. Compare the hosted history with `apps/onoo/supabase/migrations`. Classify each artifact as tracked-and-hosted, hosted-only, tracked-only, or divergent. Treat both `007_apply_derived_stats` definitions as divergent until their SQL and callers are compared.
   Recover and test the hosted definitions of `is_game_scorekeeper`, `is_league_admin`, and both `apply_derived_stats` signatures before any replacement. The tracked chain contains no `CREATE FUNCTION` source for these RPCs even though Edge Functions call them.
4. Select one recovery route using the recorded evidence:
   - **Reconstruct history:** Recover hosted 005–007 into Git, remove or replace unsupported tracked-only migrations, then reproduce the hosted schema from a clean reset
   - **Create a new baseline:** Keep the remote project as a disposable prototype, create a fresh Supabase project or branch, and generate one reviewed baseline from the intended V2 schema
5. Do not apply 008 or 009 to the hosted project until their schema assumptions, phone-claim scope, and V2 privacy policy are reconciled. Migration 009's claims policy references `memberships.organization_id`, but the tracked membership model uses polymorphic `scope_type` and `scope_id`. Claims are deferred from the pilot.
6. Generate `apps/onoo/packages/core/src/types/database.ts` from the recovered baseline. Reject manual type edits.
7. Add `.github/workflows/onoo-pilot.yml`. Require clean reset, seed, generated-type diff, SQL function checks, RLS integration tests, `pnpm -F @onoo/core test`, and web type validation before pilot branches can merge.

**Files and artifacts:**

| Path | Action | Specific change |
|---|---|---|
| `apps/onoo/supabase/migrations/` | Reconcile | Replace the divergent tracked chain only after the recorded recovery decision; use `supabase migration new` for every new V2 migration |
| `apps/onoo/supabase/seed.sql` | Modify | Seed only explicit pilot fixtures, roles, game assignments, and source evidence; never substitute fixture data in production reads |
| `apps/onoo/packages/core/src/types/database.ts` | Regenerate | Reflect the recovered V2 database schema |
| `apps/onoo/docs/schema-recovery-record.md` | Create | Store remote inventory, comparison result, chosen recovery route, backup reference, checksums, and reset evidence |
| `.github/workflows/onoo-pilot.yml` | Create | Enforce database and application checks for the pilot slice |

**Stop condition:** A clean environment can reset, seed, generate types without diff, invoke required functions, and pass the role matrix. No hosted security advisory reports public execution for privileged record-changing functions.

### Phase 0B: establish the trusted record model

**Outcome:** Every public result resolves to one approved, versioned source revision.

1. Add a versioned basketball ruleset. Each game records the ruleset version used for validation and derivation.
2. Model source provenance for three inputs: live play-by-play, authorized source import, and manual backfill. Store source type, original source reference or storage object, importer, confidence, reviewer, approval decision, and historical-import label.
3. Add tracker sessions with assigned scorer, session identifier, server acknowledgement state, private device metadata, session ordering, takeover record, and closure reason.
4. Replace the ambiguous game lifecycle with explicit V2 record states. Preserve legacy statuses only long enough to migrate existing fixture rows. Enforce transitions through a database command, not client conditionals.
5. Add immutable game revisions and correction records. A correction creates a new reviewable revision, retains the prior revision and reason, and increments the public revision number. Undo and edit become void or replacement operations in the revision journal.
6. Add player aliases, reversible merge history, redirect identity, and reviewed claim or dispute records. Keep public date of birth, contact data, claim evidence, device information, and operator data private by default.
7. Define database invariants: a game has distinct competing teams, a roster belongs to the competition and source revision, event types match the ruleset, period and clock values are valid, each command has a stable idempotency key, and only verified or official revisions produce official standings and career statistics.

**Files and artifacts:**

| Path | Action | Specific change |
|---|---|---|
| `apps/onoo/supabase/migrations/<timestamp>_v2_record_model.sql` | Create | Add rulesets, source submissions, revisions, tracker sessions, correction records, aliases, merge history, constraints, and explicit status transitions |
| `apps/onoo/supabase/migrations/<timestamp>_v2_publication_views.sql` | Create | Add curated security-invoker public views that expose only approved, permitted result data |
| `apps/onoo/packages/core/src/types/index.ts` | Modify | Export V2 command, source, revision, ruleset, and status discriminated unions |
| `apps/onoo/packages/core/src/events/dictionary.ts` | Modify | Bind event validation to the selected basketball ruleset version |
| `apps/onoo/packages/core/src/events/payloads.ts` | Modify | Validate source, session, event, void, and replacement command payloads without `any` |
| `apps/onoo/packages/core/src/stats/derive.ts` | Modify | Derive only from the approved revision journal and ruleset; return validation warnings with source identifiers |

**Stop condition:** The database rejects invalid state transitions, cross-league or invalid-roster commands, duplicate command IDs, direct derived-table edits, and attempts to publish an unapproved revision.

### Phase 0C: replace direct mutations with scoped commands

**Outcome:** Clients cannot change a record by writing arbitrary tables or calling privileged functions directly.

1. Replace browser table writes in `apps/onoo/src/app/tracker/[gameId]/page.tsx` with authenticated command calls. The server validates session ownership, game assignment, competition, roster, ruleset, current state, period, ordering, and idempotency.
2. Replace generic administrative mutations in `apps/onoo/src/app/admin/api/**/*.ts` with narrowly scoped commands for competition setup, roster publication, scorer assignment, review, verification, correction approval, and publication. Retire direct delete routes for pilot records.
3. Rewrite `apps/onoo/supabase/functions/derive-game/index.ts` as an internal projection command. It must only derive approved revisions, write projections transactionally, record the acting approver, and never use public RPC exposure as its authorization boundary.
4. Replace `apps/onoo/supabase/functions/manual-box-entry/index.ts` with a manual-source-submission command. It attaches source evidence and creates a reviewable input. It must never delete or write `game_player_stats` or `game_team_stats` directly.
5. Revoke `EXECUTE` for untrusted roles on all privileged `SECURITY DEFINER` functions. Move privileged helpers out of the exposed schema when needed, set an explicit `search_path`, and grant only the service or authenticated command role that requires execution.
6. Rebuild RLS around a tested role matrix: anonymous spectator, authenticated spectator, league operations lead, assigned lead scorer, backup scorer, approving official, league administrator, and service worker. Public views expose approved data only. Raw journals, audit records, device metadata, evidence, and private player fields remain unavailable to public roles.

**Files and artifacts:**

| Path | Action | Specific change |
|---|---|---|
| `apps/onoo/src/app/tracker/[gameId]/page.tsx` | Modify | Call durable journal and scoped command APIs only; remove direct `stat_events` and `games` mutations |
| `apps/onoo/src/app/admin/api/**/*.ts` | Replace | Remove generic CRUD and destructive pilot-record endpoints in favor of role-scoped commands |
| `apps/onoo/supabase/functions/derive-game/index.ts` | Replace | Project approved revisions through a private, authenticated command boundary |
| `apps/onoo/supabase/functions/manual-box-entry/index.ts` | Replace | Submit manual evidence-backed source records for review |
| `apps/onoo/supabase/migrations/<timestamp>_v2_authorization.sql` | Create | Install command functions, RLS, grants, revoked execution rights, and audit policies |
| `apps/onoo/tests/database/role-matrix.test.ts` | Create | Prove each role's allowed and denied operations against a reset database |

**Stop condition:** Each mutation has one authoritative command path. The role-matrix tests deny all unassigned, cross-league, invalid-status, invalid-roster, duplicate, and direct-projection mutations.

### Phase 0D: build the durable single-writer journal

**Outcome:** One scorer can safely record a game through connectivity loss, reload, retry, and controlled handoff.

1. Retain `EventQueue` only as a pure ordering reducer. Add serializable journal operation, acknowledgement, retry, and recovery types in `@onoo/core`.
2. Add an IndexedDB-backed per-game journal under `apps/onoo/src/lib/tracker/`. Persist the operation before any request. Restore journal state before tracker interaction after reload.
3. Send stable client-generated operation IDs, tracker session IDs, and monotonic per-session sequence values to the command endpoint. The endpoint acknowledges the exact operation IDs it commits.
4. Add retry and exponential backoff. Preserve rejected operations and render a user-actionable reason rather than dropping them.
5. Add a visible command center in the tracker: queue depth, last acknowledged server receipt, connection state, stale authentication state, battery and network checklist, backup-device status, and an incident action.
6. Implement the single-writer handoff protocol. The lead scorer closes or transfers the active session, the backup device confirms the last receipt, and the server prevents concurrent writers from creating uncontrolled streams.
7. Replace UI `console.error` handling with the project capture path and structured operational events.

**Files and artifacts:**

| Path | Action | Specific change |
|---|---|---|
| `apps/onoo/packages/core/src/sync/queue.ts` | Modify | Make operations serializable, idempotent, acknowledged, recoverable, and revision-aware |
| `apps/onoo/packages/core/src/sync/index.ts` | Modify | Export V2 journal contracts and reducers |
| `apps/onoo/src/lib/tracker/game-journal.ts` | Create | Implement IndexedDB persistence, restore, retry/backoff, and acknowledgement reconciliation |
| `apps/onoo/src/lib/tracker/session-handoff.ts` | Create | Implement the controlled transfer protocol and receipt validation |
| `apps/onoo/src/app/tracker/[gameId]/page.tsx` | Modify | Restore journal before input, show health, block unsafe finalization, and call session commands |
| `apps/onoo/packages/core/src/sync/__tests__/queue.test.ts` | Expand | Cover restore, acknowledgement, duplicate operations, void/replacement ordering, and rejected operations |

**Stop condition:** Airplane mode, browser reload, duplicate submission, stale authentication, browser sleep, queue recovery, and documented device handoff lose zero acknowledged or unacknowledged operations.

### Phase 0E: replace imports and projections with reviewed publication

**Outcome:** Historical and manual results are truthful, reviewable records rather than direct aggregate writes.

1. Replace `apps/onoo/src/app/api/import/route.ts` with an authenticated import-submission API. Require source scan or URL, rights confirmation, source type, importer, confidence, and target competition.
2. Parse and normalize imported box-score data into a source submission. Resolve teams and players through aliases and a review queue. Do not silently create canonical identities from raw names.
3. Add a review UI that compares the source, normalized input, official score sheet, current revision, and proposed projection. An approving official accepts, rejects, or requests correction.
4. Project only the approved source revision into game lines, standings, leaders, exports, and embeds. Mark imported records as historical import or authorized feed. Do not call them live capture.
5. Replace every silent public fallback in `apps/onoo/src/app/lib/data.ts`, including the unconditional mock return in `getLeaders`, plus the mock box-score section in `apps/onoo/src/app/games/[id]/page.tsx`. Render a clear empty or unavailable state when the pilot has no approved data.
6. Publish through curated public views. Add a provenance badge and revision timeline to the real game page. Include source label, state, reviewer, revision number, and publication time.

**Files and artifacts:**

| Path | Action | Specific change |
|---|---|---|
| `apps/onoo/src/app/api/import/route.ts` | Replace | Submit versioned evidence-backed imports instead of mutating season aggregates |
| `apps/onoo/src/app/admin/games/[id]/box-entry/page.tsx` | Modify | Submit a reviewed manual source record; remove the mocked success path |
| `apps/onoo/src/app/admin/games/[id]/review/page.tsx` | Create | Compare sources and approve, reject, or request corrections |
| `apps/onoo/src/app/games/[id]/page.tsx` | Modify | Render approved data, provenance, revision timeline, and truthful unavailable states |
| `apps/onoo/src/app/lib/data.ts` | Replace | Query curated views for every helper, including leaders; remove every mock-data fallback and unconditional mock return from pilot paths |
| `apps/onoo/src/app/api/export/route.ts` | Modify | Export only approved projections with source and revision metadata |
| `apps/onoo/src/app/api/embed/games/[id]/route.ts` | Create | Serve a final-data embed with status and revision metadata |

**Stop condition:** Ten licensed historical score sheets can be imported, independently reviewed, corrected through a new revision, and displayed as historical or authorized data without direct derived-table writes.

### Phase 0F: operate, observe, and rehearse the vertical slice

**Outcome:** The web pilot has evidence for availability, correctness, recovery, and operational readiness.

1. Add `apps/onoo/src/app/admin/operations/page.tsx`. Show readiness checklists, active sessions, queue depth, last receipt, unverified games, pending corrections, incidents, verification time, coverage, and sponsor or media delivery.
2. Record structured telemetry for queue depth, sync failures, rejected commands, function errors, verification time, realtime latency, device handoffs, correction rate, and restore drills. Protect private device and operator details from public access.
3. Define backup and recovery operations: point-in-time recovery ownership, event-log export, source-evidence retention, correction deadline, incident template, and postmortem procedure. Store the runbook in `apps/onoo/docs/game-day-runbook.md`.
4. Add deterministic tests for ruleset validation, state transitions, source approvals, identity merges, projections, and public-view privacy. Add property tests for event ordering and idempotency.
5. Add database integration tests for the role matrix, command invariants, function grants, and RLS. Add browser and device chaos tests for the failure modes in V2 section 9.
6. Conduct three to five supervised scrimmages. Reconcile each final result with the official sheet, review every incident, and update the runbook before a contract game.

**Files and artifacts:**

| Path | Action | Specific change |
|---|---|---|
| `apps/onoo/src/app/admin/operations/page.tsx` | Create | Provide pilot operations, review, incident, and service-level agreement visibility |
| `apps/onoo/src/lib/observability/onoo-operations.ts` | Create | Capture pilot operational metrics through the approved capture path |
| `apps/onoo/docs/game-day-runbook.md` | Create | Define readiness, paper fallback, recovery, handoff, escalation, reconciliation, correction, and postmortem procedures |
| `apps/onoo/tests/database/*.test.ts` | Create | Verify RLS, grants, state transitions, invariants, and projection correctness |
| `apps/onoo/tests/e2e/tracker-chaos.spec.ts` | Create | Exercise offline, reload, duplicate, expired-auth, sleep, handoff, finalization, and correction scenarios |
| `.github/workflows/onoo-pilot.yml` | Expand | Run unit, database integration, browser, and type checks as required pilot evidence |

**Stop condition:** Three to five supervised scrimmages record zero unrecoverable events, every final score matches the official sheet, no record changes silently, and the complete web slice passes CI and runtime checks.

### Phase 1: run the paid four-game proof

**Outcome:** Four paid games establish a trusted record and a season-conversion decision.

1. Collect the deposit and confirm the signed agreement before field work.
2. Run the readiness checklist and assign lead scorer, backup scorer, operations lead, and approving official before each game.
3. Deliver a permitted live provisional feed, verified final box score within 24 hours, revision trail, export or embed, and pilot quality report.
4. Review contribution cost, incidents, correction rate, verification time, and sponsor or media delivery after each game.
5. Schedule a season-conversion meeting before the fourth game.

**Stop condition:** Before field work, receive at least a 1,000,000 MNT pilot deposit and signed data and right-to-publish terms. The agreement includes a one-season minimum and payment schedule. Across the proof, no event is unrecoverable, final scores are correct, the verification SLA is met, admin and scorer satisfaction is at least 8/10, and contribution cost is within the agreed model. Schedule the conversion meeting before the fourth game. Secure a season contract or sponsor-backed purchase order within 14 days of pilot close before Phase 2.

### Phase 2 and later: expand only after the reference season

Cover one complete competition with weekly operations reports and visibly reviewed corrections. Expand to a second league only after 80% eligible-game coverage, agreed quality and SLA targets, positive contribution margin, and renewal or sponsor-backed demand.

Reconsider the deferred mobile fan app, athlete claims, push notifications, advanced analytics, league operations modules, commercial data feeds, and additional sports only when a named buyer commits to each capability.

## Test and release matrix

| Layer | Required proof |
|---|---|
| Database baseline | Clean reset, seed, generated-type diff, function validation, migration-history comparison, and RLS role matrix |
| Domain core | Unit and property tests for ruleset validation, ordering, idempotency, status transitions, corrections, alias merges, and projection invariants |
| Commands | Positive and denial tests for every role, game state, league boundary, roster boundary, and duplicate operation |
| Tracker | Browser and real-device tests for offline capture, reload, retry, duplicate submission, expired authentication, sleep, handoff, finalization, and correction |
| Public views | Approved data only, provenance and revision metadata visible, private fields and raw journals absent, no mock fallback |
| Operations | Queue health, failure telemetry, incident workflow, backup export, restore drill, score-sheet reconciliation, and verification SLA evidence |
| Pilot gate | Three to five supervised scrimmages before contract games; four paid games before full-season expansion |

## Risks and decision rules

| Risk | Decision rule |
|---|---|
| No paid gap or rights path | Partner with the authorized source, narrow to a segment with a paid gap, or stop. Do not build more consumer features |
| Hosted schema cannot reproduce cleanly | Preserve the prototype as evidence and create a fresh V2 baseline. Do not repair live data through unreviewed migrations |
| Incumbent is the authoritative source | Operate reconciliation, verification, publication, and distribution around that source. Do not duplicate data without permission |
| Offline journal fails a rehearsal | Block contract-game coverage. Fix persistence, acknowledgement, or handoff and repeat the failed scenario |
| Final score mismatches the official sheet | Do not label the result official. Correct through a new reviewed revision and perform a root-cause review |
| Pilot evidence does not support a full season | Do not add a second league, mobile launch, or new sport. Apply the V2 partner, narrow, pivot, or stop rule |

## Verification before implementation approval

Review the following evidence before moving from this plan to code:

1. `docs/notes/onoo-sports-stats-platform-plan-v2.md` sections 5, 6, 7, 9, 10, and 11 match the scope and gates above
2. Local migration inventory and hosted Supabase migration history are captured in `apps/onoo/docs/schema-recovery-record.md`
3. Hosted security advisor findings have an owner and remediation test in the authorization phase
4. Deferred features are hidden from the pilot without deleting their prototypes
5. The design-partner agreement supplies the customer, rights, approver, schedule, and paid workflow that this slice will serve
