# Horizon C — Unified Basketball Network

---

**ID:** `T-C.1`
**Name:** Unified identity & athlete timeline
**Status:** `✅ done`
**Priority:** `P1`
**Phase:** Horizon C — Unified basketball network
**Effort:** `L`
**Tags:** `identity`, `backend`, `frontend`, `database`

---

## Goal

Link academy students to players across domains, display unified identity badges on public profiles, and show a combined athlete timeline of game events and academy milestones.

## Architecture

### Database (migration `20260723140000_canonical_identity.sql`)
- Added `user_id` (→ `auth.users`) to `academy_students`
- Created `canonical_identities` table (identity hub)
- Added `canonical_identity_id` to `players` and `academy_students`
- RPCs: `cmd_create_canonical_link`, `cmd_merge_canonical_identities`, `cmd_link_student_to_user`, `cmd_get_athlete_affiliations`
- View: `v_athlete_timeline` (unified game + academy events)

### Admin
- `/admin/api/link-student-to-player` route
- `LinkStudentDialog` component for searching & linking students
- "Холбох" column on admin players page

### Public
- HeroCard shows academy affiliation badges (School icon + academy name)
- "Хронологи" (Timeline) tab on player profile page
- `AthleteTimeline` server component with vertical timeline UI

### Tests
- 6 integration tests for all RPCs (canonical identity CRUD)
- 6 component tests for AthleteTimeline (empty, game, enrollment, mixed, locale)
- HeroCard social links test updated for new props

## Done When

- [x] Migration applies locally and remotely
- [x] Admin can link academy student to player via search dialog
- [x] Player page shows academy affiliation badges on HeroCard
- [x] Player page has "Хронологи" tab with game + enrollment events
- [x] All 6 RPC integration tests pass
- [x] All 6 timeline component tests pass
- [x] TypeScript compiles (0 new errors)
- [x] Feature tracked in PM docs

---

_Last updated: 2026-07-23 | Status: ✅_
