# Reports Page Decomposition Research

> Deep research on decomposing `src/app/[locale]/dashboard/reports/page.tsx` (1048 lines)
> into smaller, maintainable, lazy-loaded components.

## Current State Analysis

| Metric | Value |
|---|---|
| Page file | 1047 lines |
| Extracted components | 12 files in `src/components/reports/` (1,041 lines total) |
| Already extracted | `_eod-view.tsx`, `_helpers.ts` |
| Tab types | 6 (daily, weekly, monthly, custom, eod, finance) |
| TanStack Query hooks | 10+ at page level |
| Chart library | recharts 3.9.2 |
| State variables | 7 useState calls |
| Imports | ~50 imports (recharts, date-fns, lucide, next-intl, UI components) |

### What the Page Does
The page is a thin orchestrator: it manages state + hooks, renders a tab bar, date pickers, and then conditionally renders tab content. The tab content sections are already the bulk of the code (lines 518-1047). The "thick" parts are:

1. **State initialization** (lines 83-107) — 7 useState + zustand
2. **Derived params** (lines 117-160) — date calculations, memoization
3. **Data hooks** (lines 161-217) — 10 TanStack Query calls
4. **Tab content rendering** (lines 518-1047) — ~530 lines of JSX per tab

---

## 1. Recommended Decomposition Strategy

### Principle: "Each tab = one lazy-loaded component"

The page has 6 distinct visual modes controlled by `reportType`. These are natural decomposition boundaries because:
- Only one tab renders at a time (`reportType === "X"` conditions)
- Each tab has different data requirements
- Each tab has different UI complexity (EOD is simple, finance has tables, daily/weekly/monthly share KPIs)

### Proposed Component Hierarchy

```
ReportsPage (orchestrator — ~250 lines)
├── ReportsHeader         — title, period display, refresh button
├── ReportsTabBar         — tab buttons + keyboard nav
├── ReportsFilters        — branch/mechanic selects
├── ReportsDatePicker     — date pickers that switch by reportType
├── ReportsLoadingSkeleton — skeleton states
├── ReportsErrorCard      — error display
│
├── ReportsOverviewTab    — shared by daily/weekly/monthly/custom (~300 lines)
│   ├── InsightAlerts
│   ├── ReportKpiCard (×4)
│   ├── ProfitabilitySection (revenue split pie chart + breakdown)
│   ├── DailyRevenueChart
│   ├── MechanicBarChart
│   ├── ServiceBreakdownChart
│   ├── RetentionCard
│   ├── PnLCard
│   ├── MechanicTable
│   ├── ForecastCard
│   └── TargetCard
│
├── ReportsEodTab         — EOD-specific content (~150 lines)
│   └── EodView (already extracted)
│
└── ReportsFinanceTab     — finance panel with period selector + tables (~200 lines)
    ├── FinancePeriodSelector
    ├── FinanceKpiCards
    ├── PaymentMethodsTable
    └── ExpenseCategoriesTable
```

### Why Not Separate Tabs for Daily/Weekly/Monthly?

These 3 tabs share ~80% of their rendering (same KPI cards, same charts, different data). They use the same `InsightAlerts → KPIs → Charts → Tables` structure. Splitting them into 3 separate files would create duplicate code. Instead:

- **One `ReportsOverviewTab`** handles daily/weekly/monthly/custom
- It receives `reportType` as a prop and conditionally shows weekly/monthly charts
- This is the **composition** pattern: one component, parameterized

---

## 2. Lazy Loading Plan

### What to Lazy Load

| Component | Strategy | Rationale |
|---|---|---|
| `ReportsEodTab` | `next/dynamic` with `ssr: false` | Only shown for EOD tab; has no SSR value |
| `ReportsFinanceTab` | `next/dynamic` with `ssr: false` | Only shown for finance tab; complex tables |
| `ReportsOverviewTab` | `next/dynamic` with `ssr: false` | Heavy recharts usage; only shown when not EOD/finance |
| recharts imports | Already tree-shakable in v3 | Individual components (PieChart, BarChart) import only what's used |

### Implementation Pattern

```tsx
// page.tsx — orchestrator
import dynamic from 'next/dynamic';
import { startTransition } from 'react';

const ReportsOverviewTab = dynamic(
  () => import('./_overview-tab').then(m => m.ReportsOverviewTab),
  { ssr: false, loading: () => <ReportsLoadingSkeleton /> }
);

const ReportsEodTab = dynamic(
  () => import('./_eod-tab').then(m => m.ReportsEodTab),
  { ssr: false, loading: () => <ReportsLoadingSkeleton /> }
);

const ReportsFinanceTab = dynamic(
  () => import('./_finance-tab').then(m => m.ReportsFinanceTab),
  { ssr: false, loading: () => <ReportsLoadingSkeleton /> }
);

// Tab switching with startTransition to avoid fallback flicker
const handleTabSwitch = (value: ReportType) => {
  startTransition(() => {
    setReportType(value);
  });
};
```

### Why `next/dynamic` over `React.lazy`

In Next.js App Router, `next/dynamic` is preferred because:
1. It handles SSR/non-SSR at the bundler level (`ssr: false` is meaningful)
2. It preloads chunks before the component renders
3. It integrates with Next.js's chunking strategy
4. `React.lazy` works but doesn't have the `ssr` option — important since recharts needs DOM

### Critical: `startTransition` for Tab Switching

From React docs: when switching between lazy tabs, wrap the state update in `startTransition` to keep the old tab visible while the new one loads. Without it, the user sees the fallback skeleton on every tab switch — disorienting.

```tsx
// ❌ BAD — shows skeleton on every tab switch
setReportType("finance");

// ✅ GOOD — keeps current tab visible until new tab is ready
startTransition(() => {
  setReportType("finance");
});
```

---

## 3. State Management Approach

### Current State Classification

| State Variable | Type | Who Uses It | Recommendation |
|---|---|---|---|
| `reportType` | URL-worthy | All tabs, tab bar | **Move to URL searchParams** |
| `mechanicFilter` | URL-worthy | Overview tab, mechanic select | **Move to URL searchParams** |
| `date` | URL-worthy | DatePicker | **Move to URL searchParams** |
| `weekStart` | URL-worthy | DatePicker | **Move to URL searchParams** |
| `month` | URL-worthy | MonthPicker | **Move to URL searchParams** |
| `customRange` | URL-worthy | DateRangePicker | **Move to URL searchParams** |
| `financePeriod` | Local to finance tab | FinanceTab only | **Move inside ReportsFinanceTab** |

### Recommended: URL searchParams for Tab + Date State

**Why?** Shareable URLs, browser back/forward works, deep linking works. A user can bookmark `/reports?tab=daily&date=2026-07-10` and return to the exact view.

```tsx
// Use Next.js useSearchParams for tab + date state
import { useSearchParams, useRouter } from 'next/navigation';

// In the orchestrator:
const searchParams = useSearchParams();
const reportType = (searchParams.get('tab') ?? 'daily') as ReportType;
const date = searchParams.get('date') ?? today();

// To update:
router.push(`/dashboard/reports?tab=finance&period=month`, { scroll: false });
```

### Data Sharing Across Decomposed Components

Since TanStack Query deduplicates by query key, all tabs automatically share cache for the same query. No special wiring needed.

```
ReportsOverviewTab calls useReportInsights(orgId, dateFrom, dateTo, ...)
ReportsFinanceTab calls useReportFinanceSummary(orgId, financePeriod)

→ TanStack Query deduplicates identical calls automatically
→ Cache is shared because both are children of the same QueryClientProvider
```

### No Context Needed

The current architecture is already correct: **lift state to the orchestrator, pass down as props**. There's no state that needs to cross sibling component boundaries. Each tab receives its data as props from the orchestrator.

```
Orchestrator owns: reportType, date params, orgId, branchFilter
Each tab receives: data it needs as props
No context needed.
```

---

## 4. File Structure

### Before (current)

```
src/app/[locale]/dashboard/reports/
├── page.tsx              ← 1047 lines (everything)
├── _eod-view.tsx         ← extracted
├── _helpers.ts           ← extracted
├── package.json
├── next.config.ts
└── tsconfig.json

src/components/reports/
├── index.ts              ← barrel export
├── daily-revenue-chart.tsx
├── delta-indicator.tsx
├── forecast-card.tsx
├── insight-alerts.tsx
├── kpi-card.tsx
├── mechanic-bar-chart.tsx
├── mechanic-table.tsx
├── pnl-card.tsx
├── retention-card.tsx
├── service-breakdown-chart.tsx
└── target-card.tsx
```

### After (proposed)

```
src/app/[locale]/dashboard/reports/
├── page.tsx              ← ~250 lines (orchestrator only)
├── _overview-tab.tsx     ← ~350 lines (daily/weekly/monthly/custom content)
├── _finance-tab.tsx      ← ~250 lines (finance panel with tables)
├── _eod-tab.tsx          ← ~80 lines (wraps EodView)
├── _reports-header.tsx   ← ~50 lines (title + refresh button)
├── _reports-filters.tsx  ← ~40 lines (branch + mechanic selects)
├── _reports-date-picker.tsx ← ~60 lines (switches picker by reportType)
├── _reports-skeleton.tsx ← ~40 lines (loading skeletons)
├── _finance-period-selector.tsx ← ~30 lines
├── _helpers.ts           ← (existing, unchanged)
├── _eod-view.tsx         ← (existing, unchanged)
├── _types.ts             ← shared types extracted from page
├── package.json
├── next.config.ts
└── tsconfig.json

src/components/reports/   ← (existing, unchanged)
├── index.ts
├── ... (12 existing components)
```

### Key Convention: Underscore Prefix

Files prefixed with `_` are **route-internal** — they live alongside the page but aren't routes themselves. This is the Next.js convention for components that belong to a specific route. They import from `@/components/reports` for shared components.

---

## 5. Migration Steps

Ordered steps to decompose without breaking the page:

### Phase 1: Extract Pure UI Sub-components (no behavior change)

1. **Extract `ReportsHeader`** — title + period display + refresh button (lines 326-371)
   - Pure presentational, receives `reportType`, `date`, `dateTo`, `locale`, `loading`, `onRefresh` as props
   - Zero risk — it's already a self-contained block

2. **Extract `ReportsTabBar`** — tab buttons + keyboard nav (lines 374-403)
   - Receives `tabs`, `reportType`, `onTabChange`, `t` as props
   - Moves `handleTabKeyDown` inside the component

3. **Extract `ReportsFilters`** — branch + mechanic selects (lines 404-423)
   - Receives branch/mechanic data and handlers as props

4. **Extract `ReportsDatePicker`** — date pickers that switch by type (lines 426-474)
   - Receives `reportType`, date values, and setters as props
   - Contains the conditional DatePicker/MonthPicker/DateRangePicker logic

5. **Extract `ReportsLoadingSkeleton`** — skeleton grid (lines 488-516)
   - Pure presentational, zero props needed

6. **Extract `ReportsErrorCard`** — error display (lines 477-485)
   - Pure presentational

### Phase 2: Extract Tab Content (moderate risk)

7. **Extract `ReportsFinanceTab`** — finance panel (lines 822-1045)
   - This is the most self-contained tab: different data source, different UI
   - Receives `financeQ`, `financePeriod`, `setFinancePeriod` as props
   - Move `FinanceSummary` interface to `_types.ts`

8. **Extract `ReportsOverviewTab`** — daily/weekly/monthly/custom content (lines 529-820)
   - This is the biggest extraction
   - Receives `report`, `reportType`, `insightsQ`, `forecastQ`, `targetsQ`, `retentionQ`, `pnlQ`, `serviceBdQ`, `mechanicsQ`, `mechanicFilter`, `dailyBreakdown`, `monthlyBreakdown`, `mechExportCols`, `dateParam`, `erpLoading` as props
   - This is intentional: the orchestrator fetches, tabs display

### Phase 3: Add Lazy Loading (no behavior change)

9. **Wrap tabs with `next/dynamic`**
   - Add `ssr: false` to all three tab components
   - Add `startTransition` to tab switching
   - Verify each tab loads correctly in isolation

### Phase 4: URL State (optional, improves UX)

10. **Move `reportType` to URL searchParams**
    - Enables deep linking: `/reports?tab=finance`
    - Browser back/forward navigates between tabs

11. **Move date params to URL searchParams** (optional follow-up)
    - Enables bookmarking: `/reports?tab=daily&date=2026-07-10`
    - More complex to implement, do separately

### Verification After Each Step

- Run `npm run build` — must pass
- Visit each tab manually — must render correctly
- Run E2E tests: `npx playwright test e2e/` — must pass
- Check bundle size: `npm run build && du -sh .next/`

---

## 6. recharts Alternatives — Bundle Size Comparison

### Current: recharts 3.9.2

| Metric | Value |
|---|---|
| Raw JS (recharts alone) | 3,220 KB |
| node_modules (recharts + d3 deps) | ~9.1 MB |
| Estimated gzipped | ~120-150 KB |
| Rendering | SVG |
| Tree-shaking | Yes (v3 improved) |
| React 19 compat | Yes (v3.8+) |
| SSR | Yes (but needs DOM for animations) |

### Alternatives Comparison

| Library | Bundle (gzipped) | Rendering | Tree-shake | Charts Used | Migration Effort |
|---|---|---|---|---|---|
| **recharts 3.x** | ~120-150 KB | SVG | ✅ | Pie, Bar, Line, Area, Radar | **Current** |
| **Chart.js + react-chartjs-2** | ~60 KB | Canvas | ✅ | Pie, Bar, Line, Radar | Medium (API rewrite) |
| **@visx/visx** (per-component) | ~30-80 KB (depends on usage) | SVG | ✅✅ (granular) | Pie, Bar, Line | High (low-level API) |
| **TanStack Charts** | ~40 KB | SVG/Canvas | ✅ | Line, Bar, Scatter | Medium (headless, needs custom rendering) |
| **Nivo** | ~150-200 KB | SVG | Partial | Pie, Bar, Line, Radar, Heatmap | High (different API) |
| **Victory** | ~100 KB | SVG | ✅ | Pie, Bar, Line | Medium |
| **ECharts (via echarts-for-react)** | ~300 KB+ (full) / ~80 KB (tree-shaken) | Canvas | Partial | Everything | High |
| **ApexCharts** | ~130 KB | SVG | No | Pie, Bar, Line | High |

### Recommendation: Stay with recharts

**Reasons:**

1. **You're already using it** — the migration cost outweighs the savings. The page uses `PieChart`, `Pie`, `Cell` from recharts inline, plus `ChartContainer` from your shadcn chart wrapper.

2. **120-150KB gzipped is not catastrophic** — it's a reports page, not a landing page. Users expect dashboard pages to load heavier bundles.

3. **Lazy loading solves the real problem** — wrapping recharts imports in a lazy-loaded tab component means users only download recharts when they visit the reports page. On other pages, the cost is $0.

4. **recharts 3.x is the most mature option** — JSX-based API, good docs, widely used. The alternatives that save significant bundle size (@visx, TanStack Charts) require substantially more code per chart.

5. **The inline `PieChart` on lines 661-695** is the only recharts usage in the page. Everything else uses your `@/components/ui/chart` wrapper (shadcn's ChartContainer). Moving this inline chart to a dedicated component (e.g., `RevenueSplitPieChart`) and lazy-loading it is the highest-impact optimization.

### When to Reconsider

- If recharts bundle size becomes a measurable LCP/FCP issue (measure first)
- If you need Canvas rendering for large datasets (>10K points)
- If recharts stops being maintained (unlikely — very active project)

---

## Summary: The 3 Highest-Impact Changes

1. **Extract `_overview-tab.tsx` and `_finance-tab.tsx`** — removes ~500 lines from page.tsx
2. **Lazy-load both tabs with `next/dynamic`** — eliminates recharts from initial page bundle
3. **Add `startTransition`** — makes tab switching feel instant

Everything else is refinement. Start with these 3 and the page goes from 1048 lines to ~250 lines, with only the tab you're viewing loaded into memory.

---

## Sources

- [React Code Splitting Docs](https://legacy.reactjs.org/docs/code-splitting.html)
- [Next.js Lazy Loading Guide](https://nextjs.org/docs/pages/guides/lazy-loading)
- [Kent C. Dodds: When to Break Up Components](https://kentcdodds.com/blog/when-to-break-up-a-component-into-multiple-components)
- [Developer Way: React Composition Patterns](https://www.developerway.com/posts/components-composition-how-to-get-it-right)
- [React State Management 2025](https://www.developerway.com/posts/react-state-management-2025)
- [LogRocket: Advanced React State with URL Parameters](https://blog.logrocket.com/advanced-react-state-management-using-url-parameters/)
- [LogRocket: Best React Chart Libraries 2026](https://blog.logrocket.com/best-react-chart-libraries-2026/)
- [Embeddable: 8 Best React Chart Libraries](https://embeddable.com/blog/react-chart-libraries)
- [Perfecting Loading with next/dynamic + Suspense](https://medium.com/@mariaHelllo/perfecting-the-loading-experience-with-next-dynamic-and-react-suspense-cbbba44e98fb)
