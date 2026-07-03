# Mechanic Performance

**Purpose:** Cross-mechanic comparison analytics — leaderboard, revenue chart, per-mechanic detail sheet with reviews and ratings.

## File Structure

```
mechanic-performance/
└── page.tsx    # Full page: KPIs, bar chart, sortable leaderboard table, detail sheet
```

## Key Components

- **`MechanicPerformancePage`** — Entry point. Fetches mechanic KPIs from reports API, hours from mechanic-hours API, and commissions from mechanic-commissions API. Merges into a unified `MechanicPerf[]` array.
- **`KpiCard`** — Simple stat card (label + value + icon). Used for aggregate totals: active mechanics, jobs, hours, revenue, avg satisfaction.
- **Leaderboard Table** — Sortable table with columns: rank, mechanic name, jobs, hours, revenue, rev/hr, commission, rating. Click a row to open the detail sheet.
- **Revenue Bar Chart** — Uses `@/components/charts` `BarChart`. Shows top 8 mechanics by revenue.
- **Mechanic Detail Sheet** — Slide-out `Sheet` with full breakdown: KPI grid, service vs parts, recent reviews (star rating + feedback), and rank context.

## Data Flow

| Source | Endpoint | Purpose |
|--------|----------|---------|
| Reports API | `GET /api/organizations/{orgId}/reports?type=custom&date_from=...&date_to=...` | Mechanic KPIs (revenue, jobs, satisfaction, reviews) |
| Hours API | `GET /api/organizations/{orgId}/mechanic-hours?startDate=...&endDate=...` | Hours worked per mechanic |
| Commission API | `GET /api/organizations/{orgId}/mechanic-commissions?startDate=...&endDate=...` | Total commission per mechanic |

- All three are fetched in parallel via `Promise.all` + separate fetch for commissions (graceful fallback if endpoint missing).
- Branch filter applied via `useSelectedBranchId()` (Zustand). `"all"` = no filter.
- Period selector: week (7d), month (30d), quarter (3mo).

## Sorting

- `sortKey` can be any `MechanicPerf` field. Default: `total_revenue` desc.
- Click column header to toggle sort. Arrow indicator shows direction.
- Top mechanic gets crown icon + "Top" badge.

## Conventions

- No sub-component files — everything inline in `page.tsx`.
- No React Query hooks for data fetching — uses raw `fetch()` + `useState` (not yet migrated to hooks pattern).
- Currency via `formatMNT()`. Rating shown as stars with review count.

## Dependencies

- `@/components/charts` — BarChart
- `@/lib/queries/use-branches` — Branch list
- `@/lib/queries/use-organization` — Current org
- `@/lib/stores` — useSelectedBranchId
- `@/lib/types/service-params` — MechanicReview, ReportMechanicKpi types
