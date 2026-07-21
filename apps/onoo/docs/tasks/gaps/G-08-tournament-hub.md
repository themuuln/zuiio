---
**ID:** `G-08`
**Name:** Tournament Hub Pages
**Priority:** `P1`
**Status:** `⬜`
**Effort:** `M` (1-2d)
**Tags:** `frontend`, `routing`, `tournament`, `layout`, `data`
**DB Readiness:** `⚠️` Partial — need to audit competition/tournament data model

---

## Goal

Each tournament gets its own branded page with games grouped by phase/round, group standings, knockout bracket, tournament leaders, and editorial content. Self-contained microsite pattern following FIBA's competition hub model.

## Why

Tournaments are the primary organizational unit for Mongolian basketball — the MBA season, the Super Cup, the President's Cup, youth championships. Each has its own structure, and grouping all related data under one route makes the app navigable by tournament. FIBA's competition hub pattern is the gold standard.

## Technical Approach

### Route Structure

```
/tournaments/[id]              → Tournament hub (overview)
/tournaments/[id]/standings    → Group standings
/tournaments/[id]/games        → All games (filterable by phase)
/tournaments/[id]/bracket      → Knockout bracket (G-09)
/tournaments/[id]/leaders      → Tournament leaders
/tournaments/[id]/teams        → Participating teams
```

The hub page (`/tournaments/[id]`) acts as a dashboard with:
- Tournament header: logo, name, dates, venue
- Phase/round navigation tabs
- Latest games grouped by round
- Top group standings (top 1-2 teams per group)
- Tournament leaders (PTS, REB, AST)
- Quick links to bracket, teams, full standings

### Data Model Audit

**Current state:** `games` table has a `competition_id` field. There is no dedicated `competitions` or `tournaments` table.

**Needed:**
- `competitions` table (or audit if one exists):
  - `id` UUID PK
  - `name` text — "MBA 2026 Regular Season"
  - `slug` text — URL-safe identifier
  - `type` enum — `regular_season`, `cup`, `playoff`, `tournament`
  - `start_date`, `end_date` timestamptz
  - `logo_url` text — branding
  - `metadata` jsonb — group structure, phase options
  - `is_active` boolean

- Migration path: either create the table or extend the existing structure. If `competitions` already exists in the DB audit from `list_tables`.

### Page Structure (Hub)

```
┌─────────────────────────────────────────────────────────┐
│ [Logo] MBA 2026 Regular Season          Jan 15 – Apr 30 │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Overview │ Standings │ Games │ Bracket │ Leaders  │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ ┌─ Group A Standings ─┐  ┌─ Latest Games ────────────┐ │
│ │ 1. Team A  5-1      │  │ Round 1: A 78-72 B        │ │
│ │ 2. Team B  4-2      │  │ Round 1: C 65-70 D        │ │
│ │ 3. Team C  3-3      │  │ Round 2: A 80-65 C        │ │
│ │ 4. Team D  0-6      │  │ Round 2: B 72-68 D        │ │
│ └────────────────────────┴──────────────────────────────┘ │
│ ┌─ Tournament Leaders ───────────────────────────────┐ │
│ │ PTS: B. Bat-Erdene  24.1                           │ │
│ │ REB: T. Battulga   12.4                            │ │
│ │ AST: S. Davaajav   8.2                             │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Data Dependencies

| Entity | Access | Purpose |
|--------|--------|---------|
| `games` | Read | Filtered by `competition_id` |
| `standings` | Read | Competition standings |
| `v_public_leaders` | Read | Filtered by `competition_id` |
| `competitions` (new?) | Read | Tournament metadata, dates, branding |

## Implementation Steps

1. **Audit existing competition data model:**
   - Check if `competitions` table exists
   - Check `games.competition_id` usage and referential integrity
   - Run `list_tables` on Supabase to map current schema
   - Decide: create `competitions` or use existing structure

2. **Create or extend data fetchers:**
   - `getCompetition(id)` — tournament metadata
   - `getCompetitionGames(id, round?)` — games filtered by tournament
   - `getCompetitionStandings(id)` — already exists via `competition_id` on standings
   - `getCompetitionLeaders(id)` — already exists via `v_public_leaders`

3. **Build tournament hub page:**
   - `/tournaments/[id]/page.tsx`
   - Server Component with streaming sections
   - Tournament header with logo and metadata
   - Phase/round tabs
   - Game list grouped by round

4. **Build sub-pages:**
   - `/tournaments/[id]/standings` — full standings table
   - `/tournaments/[id]/games` — all games with filters
   - `/tournaments/[id]/leaders` — competition-scoped leaders

5. **Add tournament navigation to site IA:**
   - Link from landing page (active tournaments)
   - Link from game detail page (which tournament classification)

## Implementation Complexity & Effort

**Complexity:** Medium. ~400 lines for the page + components. The data model audit is the primary unknown.

**Effort:** M (1-2 days)
- Data model audit + migration (if needed): 2-4h
- Tournament header + navigation tabs: 1h
- Hub overview section: 2-3h
- Sub-pages: 2-4h
- Integration into site navigation: 1h

## Dependencies / Prereqs

**Blocked by:** G-09 Tournament Bracket (optional — hub can exist without bracket initially, but bracket should link from hub)
**Prereqs:** Data model audit complete. Games must be linked to competitions.

## Design Decisions

- **Follow FIBA's microsite pattern** — each competition feels self-contained with its own navigation, but shares the app shell (header/footer).
- **Server Components with streaming** for the hub page. Tournament metadata blocks on the competition query, but leader data and game list can stream independently.
- **Phase/round tabs** use URL search params, not client state. Shareable URLs for each tab.
- **If no `competitions` table exists**, this is still feasible by adding a minimal migration. Work with existing `competition_id` foreign keys.

## Risks & Gotchas

- **Missing `competitions` table data.** If the audit shows no dedicated table, the existing `competition_id` on games may be enough for a first pass (derive name from games, skip rich metadata).
- **Branded logos** — tournaments may not have uploaded logos yet. Show initials + gradient as fallback.
- **Navigation depth:** Tournament pages add a third level to the URL structure. Ensure breadcrumbs are clear.
- **SEO:** Each tournament hub should have its own meta description and OG image.

## Verification

```bash
# Type check
pnpm exec tsc --noEmit

# Build
pnpm build
```

### Done When

- [ ] Data model audited: `competitions` table exists or migration created
- [ ] Tournament hub page renders at `/tournaments/[id]`
- [ ] Tournament header shows name, dates, logo (or fallback)
- [ ] Games grouped by round/phase
- [ ] Group standings shown (top 1-2 per group)
- [ ] Tournament leaders shown (PTS, REB, AST)
- [ ] Phase/round navigation works with shareable URLs
- [ ] Sub-pages (standings, games, leaders) render correctly
- [ ] Link from landing page to active tournaments
- [ ] TypeScript compilation passes

---

_Last updated: 2026-07-21 | Status: ⬜_
