# 12. Existing Upload & Evidence Infrastructure

## Summary

Onoo has a production-grade evidence pipeline for official score sheet uploads (PDF) with a private storage bucket, command-based submission/revision workflow, and manual box entry edge function. There is no generic "file upload" UI outside of the photo/logo uploader and the PDF import form. Evidence is tied to `source_submissions` and `correction_records` tables.

---

## 1. Storage Buckets

Three storage buckets are configured:

| Bucket | Public | File Size Limit | Allowed MIME Types | Purpose |
|--------|--------|-----------------|-------------------|---------|
| `evidence` | **false** (private) | 10 MiB | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` | Score sheet evidence files |
| `player-photos` | true | 2 MiB | `image/jpeg`, `image/png`, `image/webp` | Player headshots |
| `team-logos` | true | 2 MiB | `image/jpeg`, `image/png`, `image/webp` | Team logos |

**Evidence bucket (private):**
- Created in migration `20260717165045_evidence_storage_bucket.sql`
- Uses `storage.objects` RLS with `authenticated` role policies for SELECT, INSERT, DELETE
- Admin gating happens at the **API layer** (not at storage level) — evidence is served through a Next.js API route that creates signed URLs
- Files are stored at path `{gameId}/{uuid}.pdf`
- Accessed via `GET /admin/api/submissions/{id}/evidence` which creates a 60-second signed URL

**Photo/logo buckets (public):**
- Created in migration `20260715160000_storage_buckets.sql`
- Public read, authenticated write via RLS
- Uploaded through the `PhotoUploader` React component → Next.js API route → `supabase.storage.from('player-photos'|'team-logos').upload()`

---

## 2. Database Schema for Evidence & Submissions

### `source_submissions` — The core evidence/submission table

```sql
source_submissions (
  id uuid PK,
  game_id uuid FK → games,
  source_type text CHECK ('tracker_journal', 'official_score_sheet', 'manual_box_score', 'import'),
  evidence_url text,             -- path in 'evidence' storage bucket
  rights_confirmed_at timestamptz, -- set when rights checkbox accepted
  submitted_by uuid FK → auth.users,
  submitted_at timestamptz,
  normalized_payload jsonb,      -- parsed box score data
  confidence numeric(3,2),       -- 0-1, how confident the parser was
  status text CHECK ('pending', 'approved', 'rejected', 'superseded'),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  idempotency_key uuid,          -- dedup by submitter+key
  UNIQUE (submitted_by, idempotency_key)
)
```

- Every submission is a **source of truth claim** about a game's stats
- `evidence_url` points to a file in the private `evidence` bucket
- All mutations go through `cmd_submit_source` (SECURITY DEFINER) which authenticates, validates source type, and records the submission
- Status flow: `pending` → `approved`|`rejected` → `superseded`

### `game_revisions` — Immutable journal entries derived from approved submissions

```sql
game_revisions (
  id uuid PK,
  game_id uuid FK → games,
  revision_number integer NOT NULL,  -- sequential per game
  source_submission_id uuid FK → source_submissions,
  parent_revision_id uuid,           -- for chaining/diffs
  state text CHECK ('pending', 'approved', 'rejected', 'superseded'),
  journal jsonb,                     -- human-readable change log
  projection jsonb,                  -- {players: [...], teams: [...]} – the computed box score
  validation_warnings jsonb,
  created_by uuid,
  created_at timestamptz,
  approved_by uuid, approved_at timestamptz
)
```

- A revision is created from an **approved** source submission via `cmd_create_revision`
- `cmd_approve_revision` materializes stats into `game_player_stats` + `game_team_stats`, updates `games.current_revision_number`

### `correction_records` — Post-publication correction requests

```sql
correction_records (
  id uuid PK,
  game_id uuid FK → games,
  requested_by uuid, requested_at timestamptz,
  reason text,
  evidence_url text,           -- optional evidence for correction
  proposed_change jsonb,
  status text CHECK ('pending', 'approved', 'rejected', 'applied'),
  resolved_by uuid, resolved_at timestamptz,
  resulting_revision_id uuid FK → game_revisions
)
```

- Corrections have their own `evidence_url` column separate from source submissions
- `cmd_create_correction` / `cmd_review_correction` / `cmd_apply_correction` comprise the correction pipeline

### `error_reports` (from migration `20260715080802_error_reports.sql`)

Separate table for user-submitted error reports about published games (not examined in detail).

### `audit_log`

All mutations are logged via `private.write_audit()` with actor, action, entity type/id, and payload.

### Stats tables (materialized from approved revisions):

- `game_player_stats` — per-game player box score (PK: game_id, player_id)
- `game_team_stats` — per-game team totals (PK: game_id, team_season_id)
- `season_player_stats` — running season averages
- `standings` — win/loss/percentages per competition

---

## 3. Edge Functions

### `manual-box-entry`

**File:** `supabase/functions/manual-box-entry/index.ts`

- HTTP edge function, Node-compatible (uses Deno std + supabase-js)
- Purpose: Bulk-insert a complete box score from manual data entry
- Input: `{ game_id, player_lines: PlayerLine[] }`
- Each `PlayerLine` includes all counting stats per player
- Workflow:
  1. Authenticates caller (JWT → auth.getUser)
  2. Loads game, validates status is `scheduled` or `final`
  3. Checks `is_league_admin` RPC
  4. Computes team totals from player lines
  5. **Deletes** existing `game_player_stats` / `game_team_stats` for the game
  6. Inserts fresh player + team stats directly (bypasses revision pipeline!)
  7. Updates `games` score and sets status to `final`
  8. Refreshes `season_player_stats` + `standings` via RPC
  9. Writes to `audit_log`
- **Key observation**: This bypasses the source_submission → game_revision pipeline entirely. It directly writes to derived stats tables — this is an older pattern predating the v2 command architecture.

### `derive-game`

**File:** `supabase/functions/derive-game/index.ts`

- Purpose: Derive box score from tracked stat events (the live-tracking path)
- Input: `{ game_id, mode: 'finalize'|'verify' }`
- Workflow:
  1. Auth + status validation + role check
  2. Fetches non-deleted `stat_events` for the game
  3. Calls `deriveBoxScore()` from `@onoo/core/stats` — the shared stat derivation engine
  4. Calls `apply_derived_stats` RPC to materialize results
  5. Refreshes season stats + standings
- Uses the **shared core package** (`@onoo/core/stats/derive`) for box score computation
- Also references `@onoo/core/types` for `GameRoster`, `SportConfig`, `StatEvent`

### `notify-game-events`

**File:** `supabase/functions/notify-game-events/index.ts`

- Purpose: Send push notifications on game status changes (live, final, verified)
- Currently a stub — logs notifications but doesn't call Expo/APN/FCM
- Tracks followers via `follows` table and push tokens via `push_tokens` table

---

## 4. Upload Components

### `PhotoUploader` (`src/components/admin/photo-uploader.tsx`)

- Generic upload component for player photos and team logos
- Client-side: file picker → local preview → POST to API route
- Validates file type (JPEG/PNG/WebP) and size (2MB) client-side
- POSTs as `FormData` to `/admin/api/players/{id}/photo` or `/admin/api/teams/{id}/logo`
- `PhotoUploader` test at `src/components/admin/__tests__/photo-uploader.test.tsx`

### PDF Official Stats Import (Box Entry page)

**File:** `src/app/admin/games/[id]/box-entry/page.tsx`

- The main upload workflow for official score sheets
- Form with: file input (PDF only), rights confirmation checkbox
- POSTs `FormData` to `/admin/api/games/{id}/official-stats`
- Displays parsed result with team score vs and full player stat tables
- Lists previous submissions with status badges and PDF view links

### `/admin/api/games/{id}/official-stats` route

**File:** `src/app/admin/api/games/[id]/official-stats/route.ts`

- This is the **central PDF intake endpoint**
- Uses `unpdf` library (`getDocumentProxy`, `extractTextItems`) to extract text from PDF
- Calls `@onoo/core`'s `parseFibaOfficialStats()` — the FIBA official statistics text parser
- Validates: file type (application/pdf or .pdf), size (10MB max), rights confirmed
- Workflow:
  1. Parse PDF → `FibaOfficialStats` object
  2. Upload raw PDF to `evidence` storage bucket at path `{gameId}/{uuid}.pdf`
  3. Call `cmd_submit_source` RPC with `source_type='official_score_sheet'`, evidence URL, parsed payload, and confidence score
  4. Returns `{ submissionId, boxScore }` to the UI
- On RPC failure, **removes the uploaded evidence file** (transactional cleanup)
- Uses `nodejs` runtime (not edge) — requires `unpdf` which uses PDF.js under the hood

### `/admin/api/submissions/{id}/evidence` route

**File:** `src/app/admin/api/submissions/[id]/evidence/route.ts`

- Serves evidence files via a 60-second signed URL from Supabase Storage
- Public GET (auth-checked) → looks up `evidence_url` on `source_submissions` → creates signed URL → redirects
- This is the only way evidence files are accessed (never direct storage URL)

### Admin game page (`src/app/admin/games/[id]/page.tsx`)

The game detail page has the review tab with the full submission lifecycle UI.

### Review tab component (`src/app/admin/games/[id]/components/review-tab.tsx`)

Not a separate file — the components directory is empty. The review tab likely lives inline in the game page or as a client component import. Found at `src/app/admin/games/[id]/page.tsx` (the single page file).

---

## 5. Core Package (`packages/core/src/`)

### FIBA Official Stats Parser (`imports/fiba-official-stats.ts`)

- `parseFibaOfficialStats(lines: string[]): FibaOfficialStats` — parses FIBA PDF text layout into structured box scores
- `FibaOfficialStats` interface: `{ format, score: {home, away}, teams: [FibaTeamBoxScore, FibaTeamBoxScore], warnings, confidence }`
- Player stat line: `FibaPlayerStatLine` with all standard box score fields + plusMinus
- Uses regex-based layout parsing from text items with x/y coordinates
- Computes confidence (0.98 if no warnings, 0.75 if score mismatch)
- **Marks `normalized_payload` as a reviewable source document — never written directly to derived stats**

### Events (`events/payloads.ts`)

- `SourceSubmissionPayload` Zod schema: validates source_type, evidence_url, rights_confirmed, normalized_payload, confidence, idempotency_key
- Per-event-type payload schemas for all stat event types (shot, rebound, foul, substitution, etc.)

### Stats Derivation (`stats/derive.ts`)

- `deriveBoxScore()` — the core algorithm that converts stat_events into player/team box scores
- Used by the `derive-game` edge function

### Database Types (`types/database.ts`)

- Full TypeScript types for all tables including:
  - `source_submissions` (with evidence_url, confidence)
  - `game_revisions` (with source_submission_id)
  - `correction_records` (with evidence_url)
  - `game_details_view` (with evidence_url, source_submission_id, source_type, source_reviewer_id)
- All command function signatures typed

---

## 6. Game Data Model & Event Flow

### Game Status Lifecycle

```
scheduled → live_provisional → final_pending_review → league_verified → official
                                                                             ↗
scheduled → cancelled                                              correction
scheduled → postponed
live_provisional → final_pending_review (via derive-game:finalize)
final_pending_review → league_verified (via cmd_transition_game)
league_verified → official (via cmd_transition_game)
```

### Event Flow: Two Paths

**Path A — Live Tracking (real-time stat events):**
1. `stat_events` recorded via `cmd_record_event` during live game
2. Game finalized: `derive-game` edge function calls `deriveBoxScore()` + `apply_derived_stats` RPC
3. Stats materialized in `game_player_stats` / `game_team_stats` directly (bypasses revision pipeline at this stage)
4. Game transitions to `final_pending_review`

**Path B — Offline/Import (PDF or manual):**
1. PDF uploaded to `evidence` bucket, parsed → `cmd_submit_source` creates `source_submission` (status= `pending`)
2. Reviewer approves via `cmd_approve_source` (status→ `approved`)
3. `cmd_create_revision` creates `game_revision` from the approved source
4. `cmd_approve_revision` materializes stats into `game_player_stats`/`game_team_stats`, updates game scores
5. Game transitions to `league_verified` or `official`

**Path C — Manual Box Entry (bulk data entry):**
1. `manual-box-entry` edge function directly writes `game_player_stats`/`game_team_stats` and updates game scores
2. **Does NOT** create a `source_submission` or `game_revision` — writes directly
3. Game set to `final` status directly
4. This is older and does not follow the v2 trusted-record pipeline

**Correction Flow:**
1. `correction_records` created with evidence URL, proposed change
2. Approved via `cmd_review_correction`
3. Applied via `cmd_apply_correction` which creates a new `game_revision` and updates stats

### Direct Writes Revoked

Migration `20260715120000_revoke_direct_writes.sql` explicitly revokes INSERT/UPDATE/DELETE on:
- `stat_events`
- `game_player_stats`
- `game_team_stats`
- `season_player_stats`
- `standings`
- `games` (status updates)

All mutations now go through SECURITY DEFINER commands (`cmd_*` functions). The `manual-box-entry` edge function predates this restriction — it uses the service_role key to bypass.

---

## 7. Key Architectural Observations

1. **Evidence is private**: The `evidence` bucket uses signed URLs, never public access. Evidence is linked only to `source_submissions.evidence_url` and `correction_records.evidence_url`.

2. **Two competing write patterns**: The v2 architecture enforces `cmd_*` command functions for all mutations, but `manual-box-entry` edge function predates this and uses service-role direct writes. Any new manual entry UI should go through the command pipeline (create `source_submission` → create `game_revision` → approve → materialize).

3. **No generic file upload component**: Only the `PhotoUploader` (for player/team images) and the PDF import form exist. There is no reusable `<FileUpload>` or `<EvidenceUpload>` component.

4. **PDF parsing is specialized**: The FIBA parser (`parseFibaOfficialStats`) is tightly coupled to the FIBA "Official Statistics" PDF layout. It will not parse arbitrary score sheets.

5. **Core package is shared**: `@onoo/core` contains the box score derivation engine, FIBA parser, event validation, and database types. Edge functions reference it as an npm dependency (though Deno native imports are also used directly).

6. **audit_log on every mutation**: Every `cmd_*` function calls `private.write_audit()` — this is the canonical audit trail for all evidence/submission operations.

7. **No image evidence support**: While the `evidence` bucket accepts JPEG/PNG/WebP, there is no UI for uploading image-based evidence (e.g., photos of score sheets). Only the PDF upload flow is implemented in the UI.

8. **Search/revisions API routes**: Simple GET endpoints at `/admin/api/games/{id}/submissions` and `/admin/api/games/{id}/revisions` return all records for a game, used by the admin review tab.
