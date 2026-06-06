# Dashboard Root

**Purpose:** Main dashboard shell — KPI cards, charts, timeline, recent work orders, and global dialogs for the entire dashboard section.

## File Structure

```
dashboard/
├── page.tsx                 # Main dashboard page — KPIs, charts, timeline, recent WOs
├── layout.tsx               # Dashboard layout — sidebar, page header, brand theme, auth
├── error.tsx                # Error boundary — reports to Sentry, shows retry UI
├── loading.tsx              # Loading skeleton (PageShellSkeleton with 4 cards)
├── actions.ts               # Server action — getDashboardStats (org-scoped)
├── _auth-wrapper.tsx        # Auth gate — useRequireAuth, preload screen, SubscriptionGuard
├── _charts.tsx              # Dynamic import wrapper for ChartsSection (SSR disabled)
├── _charts-content.tsx      # Recharts — revenue trend, WO status pie, top services, tech perf, categories, customer acquisition
├── _daily-timeline.tsx      # Today's Activity timeline — fetches /reports?type=timeline
├── _empty-state.tsx         # Empty dashboard — welcome message + "Create First Work Order" CTA
├── _global-dialogs.tsx      # Lazy-loaded global sheets (customer, vehicle, expense, WO, supplier, PO, appointment, parts car)
├── _goal-card.tsx           # Daily revenue goal card with inline edit (currently unused in page.tsx)
├── _kpi-cards.tsx           # KpiCard component — accent-colored card with trend arrows
├── _low-stock-card.tsx      # Low stock alert card — links to inventory alerts + PO creation
├── _period-bar.tsx          # DateFilterBar — DateRangePicker wrapper
├── _recent-work-orders.tsx  # RecentWorkOrdersTable — clickable WO table with export (used by page)
├── _recent-work-orders-table.tsx # Duplicate table component (shadcn Table variant, not used by page)
├── _section-header.tsx      # SectionHeader — title + description block
├── admin/                   # Admin panel sub-route
├── appointments/            # Appointments management
├── bay-view/                # Mechanic bay view (v1)
├── bay-view-v2/             # Mechanic bay view (v2)
├── customers/               # Customer management
├── eod-close/               # End-of-day close report
├── estimates/               # Estimates/quotes
├── expenses/                # Expense tracking
├── finance/                 # Finance overview
├── guide/                   # Redirects to /guide
├── inventory/               # Inventory management
├── mechanic/                # Mechanic portal
├── mechanic-performance/    # Mechanic performance analytics
├── organization/            # Org settings, members, roles, devices
├── payroll/                 # Payroll management
├── reports/                 # Reports dashboard
├── service-reminders/       # Service reminders
├── services/                # Service catalog
├── settings/                # Application settings
├── vehicle-models/          # Vehicle model management
├── vehicles/                # Vehicle management
└── work-orders/             # Work order management
```

## Key Components

- `DashboardPage` — Main page. Redirects mechanics to `/dashboard/bay-view`. Shows KPIs, charts, timeline, low stock alerts, insights, and recent work orders.
- `ChartsSection` (dynamic) — 6 Recharts panels: revenue trend (area), WO status (pie), top services (horizontal bar), tech performance (bar), service categories (pie), customer acquisition (line).
- `MechanicTrendChart` (dynamic) — Weekly mechanic trend (exported separately for reuse).
- `DailyTimeline` — Vertical timeline of today's activity (up to 15 events).
- `KpiCard` — Stat card with accent color bar, icon, value, and optional trend arrow.
- `LowStockCard` — Alert card showing out-of-stock and below-threshold part counts.
- `RecentWorkOrdersTable` — Table of recent WOs with export button. Rows are clickable (navigates to WO detail).
- `DateFilterBar` — Date range picker in the header.
- `AuthWrapper` — Wraps all dashboard pages. Handles auth, subscription guard, and IndexedDB preload.
- `GlobalDialogs` — Renders all lazy-loaded global sheets (new customer, vehicle, expense, WO, supplier, PO, appointment, parts car). State managed via `usePageHeader()`.

## Data Flow

- **API endpoints:**
  - `GET /api/organizations/{orgId}/reports?type=dashboard` — main dashboard data (via `useDashboard` hook)
  - `GET /api/organizations/{orgId}/reports?type=timeline` — today's activity (direct fetch in `DailyTimeline`)
- **React Query hooks:**
  - `useDashboard(orgId, { dateFrom, dateTo, branchId })` — dashboard summary, charts, insights
  - `useCurrentOrg()` — current organization info
  - `useBranches(orgId)` — branch list for branch selector
  - `useInventoryBalances(orgId)` — stock levels for low stock alert
  - `useStockThresholds(orgId)` — minimum stock thresholds
- **Realtime:** `useRealtimeMulti` listens to `work_orders`, `invoices`, `work_order_services`, `work_order_parts`, `customers` — invalidates `dashboardKeys.all`.
- **Server action:** `getDashboardStats()` in `actions.ts` — server-side stats via `dashboard-service`.
- **Query key factory:** `dashboardKeys.all(orgId, branchId)` and `dashboardKeys.summary(orgId, period, branchId)`.

## State Management

- **URL state:** `BranchSelect` writes to `useSelectedBranchId()` / `useSetSelectedBranchId()` (Zustand).
- **Local state:** `dateRange` (DateRange), `hasLoadedOnce` (first-load tracking for layout-preserving loading).
- **Global dialogs:** State managed via `PageHeaderProvider` context (`usePageHeader()`). Sheets and detail IDs are stored in context, not Zustand.
- **Layout-preserving loading pattern:** Uses `hasLoadedOnce` ref to distinguish "never loaded" from "period transition". After first load, the layout always renders — only data areas show skeletons.

## Conventions

- Mechanic users are automatically redirected to `/dashboard/bay-view`.
- Charts are dynamically imported with `ssr: false` to avoid bundling recharts in the server bundle.
- The `KpiCard` `accentKey` prop maps to `KPI_ACCENTS` — each key has `bar`, `icon`, and `bg` color classes.
- Work order grand total is computed client-side: sum of `services[].final_price` + `parts[].final_price`.
- Export columns are defined in the page and passed down to `RecentWorkOrdersTable`.
- `_recent-work-orders-table.tsx` is a duplicate (shadcn `Table` variant) not used by the page — `_recent-work-orders.tsx` (plain `<table>`) is the active one.

## Dependencies

- Shared: `BranchSelect`, `Card`, `Badge`, `Skeleton`, `Typography`, `ExportButton`, `DateRangePicker`, `PageShellSkeleton`
- Hooks: `useCurrentUserRole`, `usePageHeader`, `useSelectedBranchGuard`, `useRightSidebar`, `useRequireAuth`, `usePreloadStatus`
- Stores: `useSelectedBranchId`, `useSetSelectedBranchId` from `@/lib/stores`
- Charts: Recharts (`AreaChart`, `PieChart`, `BarChart`, `LineChart`), `ChartContainer` from shadcn
- Sub-route pages inherit the dashboard layout (sidebar, auth, brand theme, global dialogs)
