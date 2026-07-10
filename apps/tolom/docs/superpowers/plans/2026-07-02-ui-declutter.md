# UI Declutter — Simplify Sidebar Navigation & Dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce sidebar from 31 nav items to 7–9 clean items, simplify the dashboard home page, and consolidate deeply-nested modules (inventory, finance) into single tabbed pages without breaking any existing routes.

**Architecture:** All existing routes remain functional via direct URL — we only change what's shown in the sidebar navigation (`use-navigation.ts`), what appears on the dashboard home page (`page.tsx`), and update feature status markers accordingly. No route files are deleted.

**Tech Stack:** Next.js 16 App Router, shadcn/ui sidebar, TypeScript, React Query, Tailwind

## Global Constraints

- All existing routes must remain accessible via direct URL (no 404s)
- i18n keys in both `en.json` and `mn.json` must stay in sync
- `npm run validate && npm run test` must pass before completion
- Role-based visibility (mechanic vs admin/owner) must still work
- Feature gates via `useAvailableFeatures` / `PLAN_FEATURES` must still apply
- Nav status dots (green/yellow) must reflect new structure
- No database migrations or API changes

---
---

## Task 1: Restructure Navigation — Define New Nav Items

**Files:**

- Modify: `src/hooks/use-navigation.ts`
- Modify: `src/lib/nav-feature-status.ts`

**Interfaces:**

- Consumes: `useCurrentUserRole`, `useAvailableFeatures`, `usePathname`, Lucide icons
- Produces: New `useNavigation()` return shape with reduced items

**What changes:**

- Reduce from 31 items to 7: Dashboard, Shop Floor (3), Customers (2), Inventory (1), Finance (1), Reports (1), Settings (2) = 7 top-level
- Hidden from nav: mechanic, estimates, appointments, vehicles, mechanic-performance, payroll, cash-register, eod-close, vehicle-models, all inventory sub-routes, guide, admin, members
- Mechanic role: only sees Primary (Bay View) + Shop Floor (2 items: Work Orders, Services) + no Finances

### New nav structure

```typescript
const primaryItems: NavItem[] = [
  { labelKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
];

const navGroups: NavGroup[] = [
  {
    labelKey: "nav.group.shopFloor",
    icon: Wrench,
    children: [
      { labelKey: "nav.bayView", href: "/dashboard/bay-view", icon: LayoutGrid },
      { labelKey: "nav.workOrders", href: "/dashboard/work-orders", icon: ClipboardList },
      { labelKey: "nav.services", href: "/dashboard/services", icon: Sparkles },
    ],
    isCollapsible: false,
  },
  {
    labelKey: "nav.group.customers",
    icon: Users,
    children: [
      { labelKey: "nav.customers", href: "/dashboard/customers", icon: Users },
      { labelKey: "nav.serviceReminders", href: "/dashboard/service-reminders", icon: Bell },
    ],
    isCollapsible: false,
  },
  {
    labelKey: "nav.group.inventory",
    icon: Package,
    children: [
      { labelKey: "nav.inventoryParts", href: "/dashboard/inventory", icon: Package },
    ],
    isCollapsible: false,
  },
  {
    labelKey: "nav.group.finances",
    icon: DollarSign,
    children: [
      { labelKey: "nav.finance", href: "/dashboard/finance", icon: DollarSign },
      { labelKey: "nav.reports", href: "/dashboard/reports", icon: BarChart3 },
    ],
    isCollapsible: false,
  },
];

const utilityItems: NavItem[] = [
  // Guide moved to settings footer — empty here
];

const settingsItems: NavItem[] = [
  { labelKey: "nav.organization", href: "/dashboard/organization", icon: Building2 },
  { labelKey: "nav.settings", href: "/dashboard/settings", icon: Settings },
];
```

### Feature mapping changes

Remove feature gates for items no longer in nav:

```typescript
const navFeatureMap: Record<string, FeatureKey | undefined> = {
  "nav.serviceReminders": FEATURE_KEYS.SERVICE_REMINDERS,
  "nav.group.finances": FEATURE_KEYS.FINANCE,
};
```

### Mechanic role filtering

```typescript
const mechanicHomeItem: NavItem = {
  labelKey: "nav.bayView",
  href: "/dashboard/bay-view",
  icon: LayoutGrid,
};

// For mechanics:
// - primary: [mechanicHomeItem] (single item: Bay View)
// - shopFloor: [Work Orders, Services] (exclude Bay View since it's primary)
// - all other groups hidden (no Customers, Inventory, Finance)
```

### `validated_hrefs` update in `nav-feature-status.ts`

Replace the `VALIDATED_HREFS` set with only the new visible items:

```typescript
const VALIDATED_HREFS = new Set([
  "/dashboard",
  "/dashboard/bay-view",
  "/dashboard/work-orders",
  "/dashboard/services",
  "/dashboard/customers",
  "/dashboard/service-reminders",
  "/dashboard/inventory",
  "/dashboard/finance",
  "/dashboard/reports",
  "/dashboard/organization",
  "/dashboard/settings",
]);
```

Remove the `_IMPLEMENTING_HREFS` set entirely (no yellow dots — everything in nav is validated).

---

- [ ] **Step 1: Rewrite `use-navigation.ts` with the new reduced nav structure**

Read the existing file first, then replace the entire content:

```bash
cat src/hooks/use-navigation.ts
```

Replace with the new structure shown above. Keep all logic for `isActive`, `filteredSections`, `breadcrumbs`, `searchItems` working with the reduced item set.

Key changes:

- Remove imports no longer needed: `ArrowRightLeft, AlertTriangle, Banknote, BookOpen, Building2 (settings), Calendar, Car, FileText, Shield, TrendingUp, Truck, Warehouse`
- Keep: `BarChart3, Bell, ClipboardList, DollarSign, LayoutDashboard, LayoutGrid, Package, Settings, Sparkles, Users, Wrench`
- Reduce `navGroups` from 4 groups (Shop Floor 5, Customers 4, Inventory 8, Finances 7) to 4 groups (Shop Floor 3, Customers 2, Inventory 1, Finances 2)
- Clear `utilityItems` to an empty array
- Reduce `settingsItems` from 5 to 2 (Organization, Settings)
- Simplify mechanic filtering (mechanic sees only Bay View as primary + Work Orders/Services in shop floor, nothing else)
- Remove `navFeatureMap` entries for items no longer in nav
- Remove `FINANCES_GROUP_KEY` constant and related mechanic finances hiding (now Finance has its own group)

- [ ] **Step 2: Update `nav-feature-status.ts`**

Replace `VALIDATED_HREFS` and remove `_IMPLEMENTING_HREFS`:

```typescript
const VALIDATED_HREFS = new Set([
  "/dashboard",
  "/dashboard/bay-view",
  "/dashboard/work-orders",
  "/dashboard/services",
  "/dashboard/customers",
  "/dashboard/service-reminders",
  "/dashboard/inventory",
  "/dashboard/finance",
  "/dashboard/reports",
  "/dashboard/organization",
  "/dashboard/settings",
]);

export function getNavItemStatus(href: string): NavItemStatus {
  return "validated"; // Everything in the sidebar is validated
}

export function getNavStatusDotClass(href: string): string {
  return "bg-green-500"; // Always green for items in sidebar
}
```

- [ ] **Step 3: Validate the changes**

```bash
npm run validate:types
```

Expected: No type errors. Fix any import issues if icons changed.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/use-navigation.ts src/lib/nav-feature-status.ts
git commit -m "refactor: reduce sidebar from 31 to 7 nav items"
```

---

## Task 2: Simplify Dashboard Home Page

**Files:**

- Modify: `src/app/[locale]/dashboard/page.tsx`

**Interfaces:**

- Consumes: `useDashboard`, `useBranches`, `useCashRegisterSessions`, `useCurrentOrg`, `useRealtimeMulti`
- Produces: Simplified dashboard page with fewer sections

**What changes:**

- Remove `BranchComparisonSection` import and usage
- Remove `DailyTimeline` import and usage
- Remove `LowStockCard` import and usage
- Remove `CashRegisterWidget` component entirely
- Remove `insightElements` (the lightbulb tips)
- Remove `BranchSelect` and `DateFilterBar` from header (keep the header cleaner)
- KPIs: keep only 4 cards — Revenue, Active Work Orders, Customers, Avg Repair Order
  - Remove: Service Revenue, Parts Revenue, Total Vehicles, Service Mix
- Charts: keep only first row — Revenue Trend + Work Order Status
  - Remove: Top Services, Technician Performance, Service Categories, Customer Acquisition (rows 2 and 3)
- Simplify header to just a title (remove sticky header, filters, etc.)
- Import cleanup: remove unused imports

### New simplified dashboard structure

```tsx
export default function DashboardPage() {
  // ... hooks (keep existing data fetching)
  
  return (
    <div className="flex flex-col gap-8 pb-8">
      {/* Simple header */}
      <div>
        <Typography.H2 className="m-0">{t("dashboard.welcome")}</Typography.H2>
        <Typography.Muted className="mt-1">{t("dashboard.subtitle")}</Typography.Muted>
      </div>

      {/* 4 KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        <KpiCard label={t("dashboard.totalRevenue")} value={formatCurrency(summary?.totalRevenue ?? 0)} icon={DollarSign} loading={isDataLoading} />
        <KpiCard label={t("dashboard.activeWorkOrders")} value={String(summary?.activeWorkOrders ?? 0)} icon={Clock} loading={isDataLoading} />
        <KpiCard label={t("dashboard.totalCustomers")} value={String(summary?.totalCustomers ?? 0)} icon={Users} loading={isDataLoading} />
        <KpiCard label={t("dashboard.avgRepairOrder")} value={formatCurrency(summary?.avgRepairOrderValue ?? 0)} icon={TrendingUp} loading={isDataLoading} />
      </div>

      {/* Charts - single row: Revenue Trend + WO Status */}
      {data ? <ChartsSection data={data} /> : null}

      {/* Recent Work Orders */}
      <div>
        <SectionHeader title={t("dashboard.recentWorkOrders")} description={t("dashboard.recentWorkOrdersDesc")} />
        <RecentWorkOrdersTable workOrders={filteredWorkOrders} router={router} t={t} workOrdersForExport={dashboardExportColumns} />
      </div>
    </div>
  );
}
```

Chart section should also be simplified — only render Row 1. Modify `_charts-content.tsx` or inline the charts:

<｜｜DSML｜｜tool_calls>
<｜｜DSML｜｜invoke name="read">
<｜｜DSML｜｜parameter name="path" string="true">/Users/themuuln/coding/personal/tolom/src/app/[locale]/dashboard/_charts.tsx
