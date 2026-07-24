---
**ID:** `G-13`
**Name:** Season/Competition Selector
**Priority:** `P2`
**Status:** `⬜`
**Effort:** `S` (2-4h)
**Tags:** `frontend`, `navigation`, `data`, `leaders`, `standings`
**DB Readiness:** `✅` Fully supported by current schema

---

## Goal

Add a dropdown to switch between seasons/competitions on the landing page leader section, Leaders page, and Standings page. Default to current season. Enables historical data browsing.

## Why

Basketball happens year after year. Without a season selector, the user can only see the current season's data. A selector opens the entire history of the league — last season's champions, historical stat leaders, trends over time. Every competitor (NBA, BBRef, FIBA) has this. It's table-stakes navigation for a stats app.

## Technical Approach

### Component: `<SeasonSelect>`

- Uses shadcn `<Select>` component (already installed in the app)
- Dropdown label: "Season" with calendar icon
- Options: list of `{ value: competitionId, label: "2025-26 MBA" }` sorted by date descending
- Default: current season (determined by latest `start_date` or flag)
- On change:
  1. Update URL search param: `?season=<competitionId>`
  2. Re-fetch data for the selected season

### Data Source

- New data fetcher: `getCompetitions() → Competition[]`
  - Returns all competitions with `id`, `name`, `start_date`, `is_active`
  - Sorted by `start_date DESC`
  - Active competition shown first (pinned)
- If no dedicated `competitions` table, derive list from `games.competition_id` (distinct values)

### Integration Points

**1. Landing page — Leaders strip:**
- Add `<SeasonSelect>` above the multi-category leaderboard strip
- On change, re-fetch leader data for the selected competition
- Selected competition in context, shared by all components on the page

**2. Leaders page:**
- Add `<SeasonSelect>` at the top of the page, right-aligned or centered
- On change, re-fetch `v_public_leaders` filtered by competition
- Clean transition: data loading state, then new leaders render

**3. Standings page:**
- Same pattern: `<SeasonSelect>` at the top
- On change, re-fetch standings for selected competition

### State Management

```ts
// React Context or URL search param
const [selectedCompetition, setSelectedCompetition] = useState<string>(
  currentCompetitionId
);

// Re-fetch on change
const { data: leaders } = useQuery({
  queryKey: ['leaders', selectedCompetition],
  queryFn: () => getLeaders(selectedCompetition),
});
```

Using URL search params (`?season=...`) is recommended — shareable URLs across seasons.

## Data Dependencies

| Entity | Access | Purpose |
|--------|--------|---------|
| Competitions list | New query | Season names and IDs |
| `v_public_leaders` | Filtered by competition | Leaders data for selected season |
| `standings` | Filtered by competition | Standings for selected season |

No database changes needed — seasons/competitions already exist in the data model.

## Implementation Steps

1. **Create `getCompetitions` fetcher:**
   - Query: `SELECT id, name, start_date, is_active FROM competitions ORDER BY start_date DESC`
   - Handle case where `competitions` table doesn't exist yet — fall back to distinct `competition_id` values from `games`
   - Cache with `staleTime: 300_000` (5 min) — competition list rarely changes

2. **Create `<SeasonSelect>` component:**
   - Wraps shadcn `<Select>`
   - Props: `value: string`, `onChange: (id: string) => void`
   - Options generated from competition list
   - "Current Season" badge on the active competition option

3. **Add to landing page:**
   - Import `<SeasonSelect>` into landing page component
   - Store selected ID in state or URL param
   - Re-fetch on change

4. **Add to Leaders page:**
   - Same pattern: select + re-fetch
   - Update URL search param for shareability

5. **Add to Standings page:**
   - Same pattern

6. **Test:**
   - Dropdown shows all seasons
   - Switching season re-fetches data correctly
   - URL updates with season param
   - Browser back/forward navigates between seasons

## Implementation Complexity & Effort

**Complexity:** Low. ~80 lines for the selector + data refetch logic.

**Effort:** S (2-4 hours)
- Component: 30min
- Data fetcher: 30min
- Integration (3 pages): 1-2h
- URL param sync: 30min

## Dependencies / Prereqs

**Blocked by:** G-04 Multi-Category Leaderboard Strip (for landing page integration)
**Prereqs:** shadcn `<Select>` installed. Competitions exist in data model. Leaders/standings pages accept competition filter.

## Design Decisions

- **URL search params over React Context.** Season selection is a page-level concern, and URL params make selections shareable — a key requirement for "last season's standings" links.
- **Re-fetch on change rather than filtering client-side.** Ensures data freshness and avoids loading all seasons' data upfront. The cache handles re-visits.
- **Active season pinned at the top** of the dropdown list for quick access.
- **Competition list cached 5 minutes** — the list changes once per year when a new season starts.

## Risks & Gotchas

- **Competitions table may not exist.** If it doesn't, derive the season list from `games.competition_id`. This is less rich (no `name` or `start_date`) but functional. Add a migration to create the `competitions` table as follow-up.
- **Loading state on season switch.** The selected page should show a skeleton while re-fetching, not a flash of old data or blank page.
- **Invalid season in URL.** If someone shares `?season=invalid-id`, handle gracefully by falling back to current season.
- **Season selector on every page** could feel repetitive. Consider making it a shared component at the app level (e.g., in the header) if it appears on 3+ surfaces.

## Verification

```bash
# Type check
pnpm exec tsc --noEmit

# Build
pnpm build
```

### Done When

- [ ] `<SeasonSelect>` renders on landing page, leaders page, and standings page
- [ ] Dropdown shows all available seasons/competitions
- [ ] Current season is default and pinned at the top
- [ ] Switching season updates URL with `?season=<id>`
- [ ] Data re-fetches for the selected season
- [ ] Invalid season in URL falls back to current season
- [ ] Browser back/forward navigates between seasons
- [ ] TypeScript compilation passes

---

_Last updated: 2026-07-21 | Status: ⬜_
