# Dashboard Root

**Purpose:** Main dashboard shell — KPI cards, charts, timeline, recent work orders, and global dialogs for the entire dashboard section.

## File Structure

```
dashboard/
├── page.tsx                 # Dashboard page — 4 KPIs, 2 charts, recent work orders
├── layout.tsx               # Dashboard layout — sidebar, page header, brand theme, auth
├── error.tsx                # Error boundary — reports to Sentry, shows retry UI
├── loading.tsx              # Loading skeleton (PageShellSkeleton with 4 cards)
├── actions.ts               # Server action — getDashboardStats (org-scoped)
├── _auth-wrapper.tsx        # Auth gate — useRequireAuth, query prewarm, SubscriptionGuard
├── _charts.tsx              # Dynamic import wrapper for ChartsSection (SSR disabled)
├── _charts-content.tsx      # Charts — revenue trend area chart + WO status donut (also exports MechanicTrendChart)
├── _global-dialogs.tsx      # Lazy-loaded global sheets (customer, vehicle, expense, WO, supplier, PO, appointment, parts car)
├── _kpi-cards.tsx           # KpiCard component — accent-colored card
├── _low-stock-card.tsx      # Low stock alert card — used by eod-close page
├── _recent-work-orders.tsx  # RecentWorkOrdersTable — clickable WO table with export
├── _section-header.tsx      # SectionHeader — title + description block
├── admin/                   # Admin panel sub-route
├── appointments/            # Appointments management
├── bay-view/                # Mechanic bay view (v1)
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

- `DashboardPage` — Main page. Redirects mechanics to `/dashboard/bay-view`. Shows 4 KPIs, revenue trend chart, WO status donut, and recent work orders table.
- `ChartsSection` (dynamic) — 2 charts: revenue trend (area) and WO status (donut).
- `MechanicTrendChart` (dynamic) — Weekly mechanic trend bar chart (exported separately for reuse).
- `KpiCard` — Stat card with accent color bar, icon, and value.
- `RecentWorkOrdersTable` — Table of recent WOs with export button. Rows are clickable (navigates to WO detail).
- `AuthWrapper` — Wraps all dashboard pages. Handles auth, subscription guard, and query prewarm (IndexedDB offline caching).
- `GlobalDialogs` — Renders all lazy-loaded global sheets (new customer, vehicle, expense, WO, supplier, PO, appointment, parts car). State managed via `usePageHeader()`.

## Data Flow

- **API endpoints:**
  - `GET /api/organizations/{orgId}/reports?type=dashboard` — main dashboard data (via `useDashboard` hook)
- **React Query hooks:**
  - `useDashboard(orgId, { dateFrom, dateTo, branchId })` — dashboard summary, charts
  - `useCurrentOrg()` — current organization info
- **Realtime:** `useRealtimeMulti` listens to `work_orders`, `invoices`, `work_order_services`, `work_order_parts`, `customers` — invalidates `dashboardKeys.all`.
- **Server action:** `getDashboardStats()` in `actions.ts` — server-side stats via `dashboard-service`.
- **Query key factory:** `dashboardKeys.all(orgId, branchId)` and `dashboardKeys.summary(orgId, period, branchId)`.

## State Management

- **URL state:** `BranchSelect` writes to `useSelectedBranchId()` (Zustand).
- **Local state:** `hasLoadedOnce` (first-load tracking for layout-preserving loading).
- **Global dialogs:** State managed via `PageHeaderProvider` context (`usePageHeader()`). Sheets and detail IDs are stored in context, not Zustand.
- **Layout-preserving loading pattern:** Uses `hasLoadedOnce` ref to distinguish "never loaded" from "period transition". After first load, the layout always renders — only data areas show skeletons.

## Conventions

- Mechanic users are automatically redirected to `/dashboard/bay-view`.
- Charts are dynamically imported with `ssr: false` to avoid bundling recharts in the server bundle.
- The `KpiCard` `accentKey` prop maps to `KPI_ACCENTS` — each key has `bar`, `icon`, and `bg` color classes.
- Work order grand total is computed client-side: sum of `services[].final_price` + `parts[].final_price`.

## Dependencies

- Shared: `BranchSelect`, `Card`, `Badge`, `Skeleton`, `Typography`, `ExportButton`, `DateRangePicker`, `PageShellSkeleton`
- Hooks: `useCurrentUserRole`, `useSelectedBranchGuard`, `useRequireAuth`
- Stores: `useSelectedBranchId`, `useSetSelectedBranchId` from `@/lib/stores`
- Charts: Recharts (`AreaChart`, `PieChart`, `BarChart`, `LineChart`), `ChartContainer` from shadcn
- Sub-route pages inherit the dashboard layout (sidebar, auth, brand theme, global dialogs)
