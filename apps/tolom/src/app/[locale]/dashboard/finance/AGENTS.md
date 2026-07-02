# Finance Module

**Purpose:** Financial overview dashboard showing revenue, work order transactions, invoices, and expenses with branch-aware filtering.

## File Structure

```
finance/
├── page.tsx               # Main page — tab orchestrator (970 lines)
├── _kpi-card.tsx          # Reusable KPI metric card (label, value, icon, subtitle)
├── _overview-tab.tsx      # Overview tab — KPIs, charts, top services, revenue split
├── _transactions-tab.tsx  # Transactions tab — work order table with export
├── _revenue-split-bar.tsx # Horizontal bar showing service vs parts revenue %
├── _no-revenue-banner.tsx # Banner for shops with no completed WOs yet
├── _empty-finance-state.tsx # Empty state when no financial data exists
├── loading.tsx            # PageShellSkeleton with 4 cards
└── error.tsx              # Error boundary with Sentry reporting
```

## Key Components

| Component | Role |
|-----------|------|
| `FinancePage` | Main orchestrator. Manages tabs, date range, branch filter, search. Registers right sidebar tabs. |
| `TabBar` | 4-tab switcher: Overview, Transactions, Invoices, Expenses |
| `KpiCard` | Generic metric card — `label`, `value`, `icon`, `subtitle`, `loading` |
| `OverviewTab` | Renders KPIs (revenue, WOs, avg order, profit, margin), `AreaChart` revenue trend, `RevenueSplitBar`, `TopServicesTable` |
| `TransactionsTab` | `DataTable` of work orders with search, export, mobile card layout |
| `InvoicesTab` | Inline — fetches invoices from `/api/.../invoices`, status badges, send-email, copy-link |
| `ExpensesTab` | Inline — uses `useExpenses`/`useExpenseStats` hooks, recent 10 expenses table |
| `RevenueSplitBar` | Stacked bar — blue (services) vs amber (parts) with percentage labels |

## Data Flow

| Source | Hook/Endpoint | Used By |
|--------|---------------|---------|
| Dashboard data | `useDashboard(orgId, { dateFrom, dateTo, branchId })` | Overview, Transactions tabs |
| Expenses list | `useExpenses(orgId)` | ExpensesTab |
| Expense stats | `useExpenseStats(orgId)` | ExpensesTab |
| Invoice stats | `GET /api/organizations/{oid}/invoices?type=stats` | InvoicesTab |
| Invoice list | `GET /api/organizations/{oid}/invoices?status=` | InvoicesTab |
| Send invoice email | `PATCH /api/organizations/{oid}/invoices/{id}` (action: `send_email`) | InvoicesTab |
| Org settings | `useOrgSettings(orgId)` | Branch filter toggle (`finance_separate_per_branch`) |
| Branches | `useBranches(orgId)` | Branch select (multi-branch orgs only) |

## State Management

- **URL state**: `useTableFilters("finance-invoices")` for invoice search + status filter
- **Local state**: Tab selection, date range (3-month default), search string, invoice data (`useReducer`)
- **Global state**: `useSelectedBranchId` from Zustand store for branch filtering
- **Layout preservation**: `hasLoadedOnce` ref pattern — skeleton only on first load, not on tab/date transitions

## Conventions

- Branch filtering is gated behind `finance_separate_per_branch` org setting — only shows `BranchSelect` when enabled
- All currency uses `formatCurrency()` (MNT)
- Invoice status badges use color-coded `Badge` with dark mode variants
- Sidebar gets two registered tabs: "Period Summary" and "Recent Transactions"
- `useRightSidebar().registerTab()` pattern for populating sidebar with summary/recent data
- Invoices and Expenses tabs fetch data inline (not via shared hooks in some cases)

## Dependencies

- `@/components/branch-select` — branch filter dropdown
- `@/components/export-button` — Excel export
- `@/components/list-toolbar` — search + filter bar
- `@/components/sidebar-tabs/recent-list`, `status-summary` — right sidebar content
- `@/components/charts/area-chart` — revenue trend chart (Recharts)
- `@/lib/queries/use-dashboard`, `use-expenses`, `use-organization`, `use-org-settings`, `use-branches`
- `@/lib/hooks/use-url-filters`, `use-fuzzy-search` — table filtering/searching
- `@/hooks/use-right-sidebar` — sidebar tab registration
- `@/hooks/use-client-now` — SSR-safe current time
