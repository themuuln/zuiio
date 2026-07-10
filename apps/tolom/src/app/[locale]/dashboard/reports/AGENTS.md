# Reports Module

**Purpose:** ERP-grade business intelligence dashboard — daily/weekly/monthly/custom reports, EOD summary, and advanced analytics (forecasting, targets, retention, P&L, service breakdown).

## File Structure

```
reports/
├── page.tsx    # Main page — all report types in a single orchestrator (1084 lines)
├── loading.tsx # Spinner loader
└── error.tsx   # Error boundary with Sentry
```

Note: All UI sub-components live in `src/components/reports/` (12 files), not co-located here.

## Key Components

| Component | Location | Role |
|-----------|----------|------|
| `ReportsPage` | page.tsx | Orchestrator — report type tabs, date pickers, branch/mechanic filters, wires all data hooks |
| `EodView` | page.tsx (inline) | End-of-Day report — per-mechanic breakdown table with totals |
| `ReportKpiCard` | `@/components/reports` | KPI card with optional delta (comparison period) |
| `InsightAlerts` | `@/components/reports` | Alert cards from report insights API |
| `ForecastCard` | `@/components/reports` | Revenue forecasting display |
| `TargetCard` | `@/components/reports` | Target vs actual progress |
| `DailyRevenueChart` | `@/components/reports` | Bar chart for daily revenue (weekly/monthly views) |
| `MechanicBarChart` | `@/components/reports` | Bar chart comparing mechanic performance |
| `MechanicTable` | `@/components/reports` | DataTable with mechanic KPIs + export + comparison deltas |
| `ServiceBreakdownChart` | `@/components/reports` | Service category breakdown |
| `RetentionCard` | `@/components/reports` | Customer retention metrics |
| `PnLCard` | `@/components/reports` | Profit & loss summary |
| `RevenueSplitPie` | inline Recharts `PieChart` | Services vs parts donut chart |
| `ProfitBreakdown` | inline Card | Itemized profit breakdown (service/part revenue - cost) |

## Report Types

| Type | Date Input | Content |
|------|-----------|---------|
| `daily` | Single date (`DatePicker`) | Full report with KPIs, profitability, charts |
| `weekly` | Week start date (`DatePicker` — snaps to Monday) | Daily breakdown chart within the week |
| `monthly` | Month (`MonthPicker`) | Weekly breakdown within the month |
| `custom` | Date range (`DateRangePicker`) | Full report for arbitrary range |
| `eod` | Single date (`DatePicker`) | End-of-day: per-mechanic table with revenue, commission, best mechanic highlight |

## Data Flow

| Source | Hook | Used By |
|--------|------|---------|
| Core report | `useReport(orgId, reportType, params, branchId)` | Main report data (WOs, services, parts, revenue, profitability, mechanic KPIs) |
| Mechanics list | `useMechanics(orgId, branchId)` | Mechanic filter dropdown |
| Insights | `useReportInsights(orgId, dateFrom, dateTo, enabled, branchId)` | `InsightAlerts` |
| Forecast | `useReportForecast(orgId, periodType, dateParam, enabled, branchId)` | `ForecastCard` |
| Targets | `useReportTargets(orgId, periodType, date, enabled, branchId)` | `TargetCard` |
| Retention | `useReportRetention(orgId, dateFrom, dateTo, enabled, branchId)` | `RetentionCard` |
| P&L | `useReportPnl(orgId, dateFrom, dateTo, enabled, branchId)` | `PnLCard` |
| Service breakdown | `useReportServiceBreakdown(orgId, dateFrom, dateTo, enabled, branchId)` | `ServiceBreakdownChart` |

## State Management

- **Local state**: `reportType` (tab), `date`, `weekStart`, `month`, `customRange`, `mechanicFilter`
- **Global state**: `useSelectedBranchId` / `useSetSelectedBranchId` for branch filtering
- **No URL state** — all state is local to the component (no `useTableFilters`)
- **Period derivation**: `getDateRange()` helper computes `dateFrom`/`dateTo` from report type + date inputs

## Conventions

- `useSelectedBranchGuard(orgId)` ensures branch selection is initialized
- Branch filter only shown when org has multiple branches (`hasMultipleBranches()`)
- Mechanic filter auto-clears if selected mechanic disappears from the list
- Refresh button refetches all 7 hooks in parallel via `Promise.all`
- Sidebar gets "Help" and "Recently Viewed" tabs
- Comparison deltas shown as `delta` prop on `ReportKpiCard` (percentage change from prior period)
- Recharts used for pie chart (inline) and bar charts (via `@/components/reports` wrappers)
- All report components accept `loading` prop for skeleton states

## Dependencies

- `@/components/reports/index.ts` — barrel export for all report sub-components (12 components)
- `@/components/branch-select`, `@/components/mechanic-select` — filter dropdowns
- `@/components/export-button` — Excel export
- `@/components/ui/date-picker`, `month-picker`, `date-range-picker` — date inputs
- `@/lib/queries/use-reports` — all report data hooks (8 hooks)
- `@/lib/queries/use-branches`, `use-organization` — org/branch data
- `@/lib/stores` — `useSelectedBranchId`, `useSetSelectedBranchId`
- `@/hooks/use-selected-branch-guard` — branch initialization
- `recharts` — `PieChart`, `Pie`, `Cell` for revenue split donut
