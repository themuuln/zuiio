# Zer Production-Ready Mission Architecture

> Goal: Make the Zer mini-ERP production-ready across 5–6 focused milestones.
> Each milestone leaves the product in a coherent, testable, and deployable state.

---

## Table of Contents

1. [Pages Directory Structure](#pages-directory-structure)
2. [Server Actions Organization](#server-actions-organization)
3. [Dashboard Data Flow](#dashboard-data-flow)
4. [Component Reuse Strategy](#component-reuse-strategy)
5. [Milestone Plan](#milestone-plan)

---

## Pages Directory Structure

The root `/` currently serves the marketing landing page. After this project, `/` becomes the dashboard and the landing page moves to `/landing`.

```
src/app/
├── landing/                          # MOVE: current /page.tsx to /landing/page.tsx
│   └── page.tsx
├── page.tsx                          # NEW: Dashboard (KPI overview)
├── loading.tsx                       # NEW: Root loading boundary
├── error.tsx                         # NEW: Root error boundary
├── not-found.tsx                     # NEW: 404 page
│
├── login/
│   ├── page.tsx                      # EXISTS
│   └── actions.ts                    # EXISTS
│
├── register/                         # NEW
│   ├── page.tsx
│   └── actions.ts
│
├── forgot-password/                  # NEW
│   ├── page.tsx
│   └── actions.ts
│
├── update-password/                  # NEW
│   ├── page.tsx
│   └── actions.ts
│
├── organization/
│   └── new/
│       ├── page.tsx                  # EXISTS
│       └── actions.ts                # EXISTS
│
└── (dashboard)/
    ├── layout.tsx                    # EXISTS (auth guard + sidebar shell)
    ├── dashboard-shell.tsx           # EXISTS (sidebar nav component)
    ├── actions.ts                    # EXISTS (logout)
    │
    ├── page.tsx                      # NEW: Dashboard/KPI overview
    ├── loading.tsx                   # NEW
    ├── error.tsx                     # NEW
    │
    ├── products/
    │   ├── page.tsx                  # NEW: Products list with DataTable
    │   ├── loading.tsx               # NEW
    │   ├── error.tsx                 # NEW
    │   ├── actions.ts                # EXISTS
    │   └── new/actions.ts            # EXISTS
    │
    ├── inventory/
    │   ├── page.tsx                  # NEW: Inventory overview (stock levels, alerts)
    │   ├── loading.tsx               # NEW
    │   ├── error.tsx                 # NEW
    │   ├── categories/              # EXISTS (unchanged)
    │   └── movements/               # EXISTS (unchanged)
    │
    ├── sales/
    │   ├── page.tsx                  # NEW: Sales list with DataTable
    │   ├── loading.tsx               # NEW
    │   ├── error.tsx                 # NEW
    │   ├── new/
    │   │   ├── page.tsx              # NEEDS CREATION (sale-form.tsx exists)
    │   │   ├── actions.ts            # EXISTS
    │   │   └── sale-form.tsx         # EXISTS
    │   └── [id]/
    │       └── page.tsx              # NEW: Sale detail page
    │
    ├── expenses/
    │   ├── page.tsx                  # NEW: Expenses list with DataTable
    │   ├── loading.tsx               # NEW
    │   ├── error.tsx                 # NEW
    │   └── new/
    │       ├── page.tsx              # EXISTS
    │       └── actions.ts            # EXISTS
    │
    ├── settings/
    │   ├── page.tsx                  # NEW: Org settings, profile, theme toggle
    │   ├── loading.tsx               # NEW
    │   └── error.tsx                 # NEW
    │
    ├── customers/
    │   ├── page.tsx                  # EXISTS
    │   └── actions.ts                # EXISTS
    │
    ├── suppliers/
    │   ├── page.tsx                  # EXISTS
    │   └── actions.ts                # EXISTS
    │
    ├── reports/
    │   ├── page.tsx                  # EXISTS
    │   ├── loading.tsx               # NEW
    │   ├── error.tsx                 # NEW
    │   ├── actions.ts               # EXISTS
    │   ├── date-range-form.tsx       # EXISTS
    │   └── share-dialog.tsx          # EXISTS
    │
    └── shop/
        ├── layout.tsx                # EXISTS
        ├── page.tsx                  # EXISTS
        ├── loading.tsx               # EXISTS
        ├── cart/page.tsx             # EXISTS
        ├── checkout/page.tsx         # EXISTS
        ├── history/page.tsx          # EXISTS
        ├── history/[id]/page.tsx     # EXISTS
        └── receipt/[id]/page.tsx     # EXISTS
```

**Key decisions:**
- All loading/error boundaries sit **inside** `(dashboard)` so they inherit the sidebar shell
- `sales/new/page.tsx` needs to be created as a wrapper that imports `sale-form.tsx` (the form component already exists)
- `@/app/page.tsx` becomes the dashboard KPI page; the landing page moves to `/landing`
- The `/r/[token]` public report route stays outside auth and is already correct

---

## Server Actions Organization

Server actions follow the existing pattern: **colocated `actions.ts` at each route segment**.

### Existing Pattern (keep)

```ts
// src/app/(dashboard)/expenses/new/actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { validateExpenseInput } from "@/lib/domain-rules";
import { parseAmount, requireAppContext } from "@/lib/erp";
import { getString } from "@/lib/validation";

export async function createExpense(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const { supabase, organizationId, userId } = await requireAppContext();
  // validate + insert
  // revalidatePath(...)
}
```

### New Actions to Create

| Route | Action | Purpose |
|-------|--------|---------|
| `register/actions.ts` | `register` | Create user via Supabase Auth, create profile, call `create_organization` RPC |
| `forgot-password/actions.ts` | `forgotPassword` | `supabase.auth.resetPasswordForEmail` |
| `update-password/actions.ts` | `updatePassword` | `supabase.auth.updateUser({ password })` |
| `(dashboard)/products/actions.ts` | Already exists (export `createProduct`) | |
| `(dashboard)/sales/actions.ts` | `listSales` | Server fetch for initial sales data |
| `(dashboard)/expenses/actions.ts` | `listExpenses` | Server fetch for initial expenses data |
| `(dashboard)/inventory/actions.ts` | `listInventory` | Server fetch for inventory overview |
| `(dashboard)/settings/actions.ts` | `updateOrg`, `updateUser`, `exportData` | Org settings, profile update, CSV export |
| `(dashboard)/actions.ts` | Already exists (logout) | Can add `getDashboardData` aggregate query |

### Action Pattern Guidelines

1. **Read operations**: For initial page load, fetch data directly in server component. For subsequent searches/filters, use TanStack Query client-side. No server action needed for reads unless doing CSV export.
2. **Write operations**: Always `"use server"`, validate with `domain-rules.ts`, return `{ error?: string } | { success: true }`, call `revalidatePath()` on success.
3. **CSV export**: Use a server action that returns a redirect to a route handler (or generate CSV server-side and return as download). Pattern: `export async function exportCsv(...) -> return new Response(csv, { headers: { "Content-Type": "text/csv" } })`.

---

## Dashboard Data Flow

The dashboard (`/`) needs to aggregate data from multiple tables into KPI cards and charts. Use the existing `requireAppContext` + parallel Supabase queries pattern.

### Server Component (aggregate query)

```ts
// src/app/(dashboard)/page.tsx (server component)
async function DashboardPage() {
  const { supabase, organizationId } = await requireAppContext();

  // Run all aggregate queries in parallel
  const [
    { count: totalProducts },
    { count: totalCustomers },
    { count: totalSuppliers },
    { data: recentSales },
    { data: todaySales },
    { data: lowStockProducts },
    { data: pendingSalesCount },
    { data: monthlyExpenses },
    { data: inventoryItems },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("organization_id", organizationId).eq("type", "customer"),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("organization_id", organizationId).eq("type", "supplier"),
    supabase.from("sales").select("id, total_amount, sale_date, status, contacts(name)").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(5),
    supabase.from("sales").select("total_amount, paid_amount").eq("organization_id", organizationId).gte("sale_date", today).lte("sale_date", today).neq("status", "cancelled"),
    supabase.from("products").select("id, name, sku, current_stock, min_stock, unit").eq("organization_id", organizationId),
    supabase.from("sales").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "pending"),
    supabase.from("expenses").select("amount").eq("organization_id", organizationId).gte("expense_date", monthStart).lte("expense_date", monthEnd),
    supabase.from("products").select("cost_price, current_stock").eq("organization_id", organizationId),
  ]);

  // Compute derived KPIs in JS
  const inventoryValue = inventoryItems?.reduce(
    (sum, p) => sum + (Number(p.cost_price ?? 0) * Number(p.current_stock ?? 0)), 0
  ) ?? 0;

  const lowStockItems = lowStockProducts?.filter(
    (p) => Number(p.current_stock ?? 0) < Number(p.min_stock ?? 0)
  ) ?? [];

  const monthlyTotalExpenses = monthlyExpenses?.reduce(
    (sum, e) => sum + Number(e.amount), 0
  ) ?? 0;

  return <DashboardClient data={{ ... }} />;
}
```

### Dashboard Layout

```
+-------------------------------------------------------+
|  Dashboard / Khyanaltyn sambar                        |
+----------+----------+----------+----------+-----------+
| Today    | Today    | Products | Low Stock| Pending   |
| Sales    | Expenses | Count    | Alerts   | Sales     |
| MNT125K  | MNT45K   | 42       | 3 items  | 5         |
+----------+----------+----------+----------+-----------+
| +---------------------------------------------------+ |
| | Recent Sales (table of last 5)                    | |
| +---------------------------------------------------+ |
| +------------------------+  +------------------------+ |
| | Monthly Chart          |  | Low Stock Products     | |
| | (recharts bar/line)    |  | (compact list)         | |
| +------------------------+  +------------------------+ |
+-------------------------------------------------------+
```

### Low Stock Alert Flow

```
+----------------+    +--------------------+    +---------------+
| Server fetch   |--->| Client Dashboard   |--->| toast()       |
| all products   |    | compare            |    | notification  |
| < org          |    | current_stock <    |    | (sonner)      |
|                |    | min_stock          |    |               |
+----------------+    +--------------------+    +---------------+
```

On mount, the dashboard client component checks if any products have `current_stock < min_stock` and fires a sonner toast using a `useEffect` that runs once.

---

## Component Reuse Strategy

### Shared Components (existing, to reuse)

| Component | Path | Usage |
|-----------|------|-------|
| `PageShell` | `@/components/erp/page-shell` | Every list/detail page wrapper (title, description, actions) |
| `ErpEmptyState` | `@/components/erp/empty-state` | Every empty list state |
| `DataTable` | `@/components/ui/data-table` | All list pages (products, sales, expenses, inventory) |
| `Card` / `CardHeader` / `CardContent` | `@/components/ui/card` | Section containers |
| `Badge` | `@/components/ui/badge` | Status badges (sale status, stock level) |
| `Button` | `@/components/ui/button` | Actions |
| `Field` / `FieldGroup` / `FieldLabel` | `@/components/ui/field` | Form fields |
| `Combobox` | `@/components/ui/combobox` | Select/autocomplete |
| Charts | `recharts` | Dashboard + reports charts |

### New Shared Components to Build

| Component | Purpose | Location |
|-----------|---------|----------|
| `StatCard` | KPI card (icon, label, value, trend) | `@/components/erp/stat-card.tsx` |
| `KpiGrid` | Grid layout for StatCard rows | `@/components/erp/kpi-grid.tsx` |
| `ExportButton` | CSV export button with loader | `@/components/erp/export-button.tsx` |
| `ThemeToggle` | Dark mode toggle (uses next-themes) | `@/components/erp/theme-toggle.tsx` |
| `PageSearch` | Search/filter bar for list pages | `@/components/erp/page-search.tsx` |
| `LowStockBadge` | Colored badge for stock level | `@/components/erp/low-stock-badge.tsx` |
| `BarcodeInput` | Barcode field for POS product lookup | `@/components/shop/barcode-input.tsx` |
| `PrintableReceipt` | CSS print-optimized receipt layout | `@/components/shop/printable-receipt.tsx` |

### Reuse Pattern for List Pages

Every list page follows this template:

```tsx
// Server component (page.tsx)
import { PageShell } from "@/components/erp/page-shell";
import { DataTable } from "@/components/ui/data-table";
import { requireAppContext } from "@/lib/erp";
import { columns } from "./columns";
import { CreateButton } from "./create-button";

export default async function ListPage() {
  const { supabase, organizationId } = await requireAppContext();
  const { data } = await supabase
    .from("entity")
    .select("...")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  return (
    <PageShell title="..." description="..." actions={<CreateButton />}>
      {!data?.length ? (
        <ErpEmptyState icon={...} title="..." description="..." action={<CreateButton />} />
      ) : (
        <Card>
          <CardHeader><CardTitle>...</CardTitle></CardHeader>
          <CardContent>
            <DataTable columns={columns} data={data} searchColumn="name" />
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
```

### Dark Mode Strategy

- `next-themes` is already in `package.json`
- Add `<ThemeProvider>` in root layout
- Add `ThemeToggle` component using the existing shadcn sidebar pattern
- Use Tailwind CSS v4 `dark:` variants (already supported in project's Tailwind v4)
- All shadcn components are already dark-mode aware via CSS variables

---

## Milestone Plan

### Milestone 1: Foundation -- Auth Pages + Error Boundaries

**Goal:** Complete the auth flow and basic app infrastructure.

**Deliverables:**

| # | Feature | Type | Files to Create |
|---|---------|------|-----------------|
| 1 | Register page | Page | `src/app/register/page.tsx`, `actions.ts` |
| 2 | Forgot password page | Page | `src/app/forgot-password/page.tsx`, `actions.ts` |
| 3 | Update password page | Page | `src/app/update-password/page.tsx`, `actions.ts` |
| 4 | Root error/loading/not-found | Infrastructure | `src/app/loading.tsx`, `error.tsx`, `not-found.tsx` |
| 5 | Route group error/loading | Infrastructure | `(dashboard)/loading.tsx`, `(dashboard)/error.tsx` |
| 6 | Landing page move | Refactor | Move `/page.tsx` to `/landing/page.tsx` |
| 7 | Sales new page wrapper | Page | `(dashboard)/sales/new/page.tsx` |

**Implementation details:**
- Register: Creates user via Supabase Auth, creates profile, calls `create_organization` RPC (existing), redirects to `/organization/new`
- Forgot password: Calls `supabase.auth.resetPasswordForEmail`, shows success message
- Update password: Uses `supabase.auth.updateUser` with the recovery session token from URL hash
- Auth pages use the same `react-hook-form` + `zod` pattern as login
- Error boundaries follow Next.js convention with `"use client"`, simple retry button
- Loading boundaries use shadcn `Skeleton` component

**Dependencies:** None (can be built in parallel)

**Testing strategy:**
- Manual auth flow testing (register, verify email, login, forgot, reset)
- Unit test: validation functions in `domain-rules.ts` (already exist for register)
- Visual: all auth pages render correctly at mobile/desktop widths
- Redirect test: unauthenticated users hitting `/` go to `/login`

**Validation approach:**
- Run all 3 auth flows end-to-end against real Supabase
- Visit each new route group path to confirm error/loading boundaries render
- `npm run typecheck` + `npm run lint` pass
- `npm run build` succeeds

---

### Milestone 2: Core Pages -- Products, Sales, Expenses Lists

**Goal:** All CRUD entity list pages operational with pagination, search, and empty states.

**Deliverables:**

| # | Feature | Type | Files to Create |
|---|---------|------|-----------------|
| 1 | Products list page | Page | `(dashboard)/products/page.tsx`, `columns.tsx` |
| 2 | Sales list page | Page | `(dashboard)/sales/page.tsx`, `columns.tsx` |
| 3 | Expenses list page | Page | `(dashboard)/expenses/page.tsx`, `columns.tsx` |
| 4 | Sale detail page | Page | `(dashboard)/sales/[id]/page.tsx` |
| 5 | Error/loading for each | Infrastructure | `products/error.tsx`, `products/loading.tsx`, etc. |
| 6 | Search/filter on lists | Enhancement | Integrated into DataTable (already has `searchColumn` prop) |

**Implementation details:**
- Each list page follows the **Reuse Pattern** above
- Products table columns: Name, SKU, Unit, Sale Price, Current Stock, Min Stock, Category
- Sales table columns: Date, Contact, Total Amount, Paid Amount, Status (Badge), Payment Method
- Expenses table columns: Date, Category, Amount, Payment Method, Description
- Sale detail shows header info + line items table + totals
- Pagination is already built into `DataTable` (client-side, default pageSize=10)
- Search/filter is already built into `DataTable` via `searchColumn` prop
- Empty states use `ErpEmptyState` with a CTA to create the first record

**Dependencies:** Milestone 1 (need auth + error boundaries in place)

**Testing strategy:**
- Unit: DataTable renders with empty/single/multiple rows
- Unit: Each entity's column configuration renders correct data types
- Integration: Server component fetches + renders with mock data
- Visual: Table horizontal scroll on mobile, pagination controls visible
- Edge: 0 records shows empty state. 1 record shows single row. 50+ records pagination works

**Validation approach:**
- `npm run typecheck` + `npm run lint`
- `npm run build` passes
- Manually visit each list page with real data
- Test pagination (prev/next, page indicator)
- Test search/filter on each table

---

### Milestone 3: Dashboard + Inventory Overview + Settings

**Goal:** KPI dashboard as the app home, inventory stock overview, and org settings.

**Deliverables:**

| # | Feature | Type | Files to Create |
|---|---------|------|-----------------|
| 1 | Dashboard KPI overview | Page | `(dashboard)/page.tsx`, `dashboard-client.tsx`, `stat-card.tsx`, `kpi-grid.tsx` |
| 2 | Inventory overview | Page | `(dashboard)/inventory/page.tsx` |
| 3 | Settings page | Page | `(dashboard)/settings/page.tsx`, `actions.ts` |
| 4 | StatCard component | Component | `@/components/erp/stat-card.tsx` |
| 5 | KpiGrid component | Component | `@/components/erp/kpi-grid.tsx` |
| 6 | Error/loading for each | Infrastructure | `settings/error.tsx`, `settings/loading.tsx`, etc. |

**Dashboard KPIs to compute:**
- **Today's Sales**: Sum of `total_amount` for today's completed sales
- **Today's Expenses**: Sum of `amount` for today's expenses
- **Total Products**: Count of products
- **Low Stock Alerts**: Count of products where `current_stock < min_stock`
- **Pending Sales**: Count of sales with `status = "pending"`
- **Monthly Sales Trend**: Last 30 days sales grouped by day (for chart)
- **Recent Sales**: Last 5 sales with contact name, amount, date, status
- **Inventory Value**: Sum of `cost_price * current_stock` across all products

**Inventory overview to show:**
- Total products count
- Total stock value (sum of cost_price * current_stock)
- Low stock products list with badges
- Recent stock movements (last 10)
- Quick links to categories and movements pages

**Settings page sections:**
- Organization info (name, slug, type, currency) with edit form
- Profile (full name) with edit form
- Dark mode toggle (next-themes)
- Data export (CSV) for each entity
- Danger zone (leave org, etc.)

**Dependencies:** Milestone 2 (list pages exist as references for dashboard links)

**Testing strategy:**
- Unit: StatCard renders correct value, label, icon
- Unit: KpiGrid renders all StatCards in responsive grid
- Integration: Dashboard server component fetches all aggregates
- Visual: Dashboard layout at mobile/tablet/desktop breakpoints
- Edge: Zero-data state (no products, no sales -- cards show 0 or "-")

**Validation approach:**
- Run typecheck + lint + build
- Manually verify all KPI values match raw Supabase queries
- Test dark mode toggle works and persists
- Verify low stock alerts show correct products
- Confirm responsive layout

---

### Milestone 4: POS Enhancement -- Barcode, Printing, Realtime

**Goal:** Polish the POS/shop experience with barcode support, receipt printing, and realtime inventory sync.

**Deliverables:**

| # | Feature | Type | Files to Create/Modify |
|---|---------|------|------------------------|
| 1 | Barcode input in POS | Component | `@/components/shop/barcode-input.tsx`, modify `catalog-client.tsx` |
| 2 | Printable receipt page | Component | `@/components/shop/printable-receipt.tsx`, modify `receipt/[id]/page.tsx` |
| 3 | Low stock toast notification | Enhancement | Modify `dashboard-shell.tsx` or create low-stock alert hook |
| 4 | Realtime inventory updates | Enhancement | Already wired via `RealtimeSubscriptions` -- verify coverage |

**Implementation details:**
- Barcode: Add a search input in the catalog that filters by `barcode` field on the products table. On scan/enter, auto-add the product to cart
- Receipt printing: Use `@media print` CSS in the receipt page. Add a "Print" button that calls `window.print()`
- Low stock toast: In `dashboard-shell.tsx`, add a useEffect that fetches low stock products once on mount and shows sonner toasts for each
- Realtime: Already wired in `RealtimeSubscriptions` -- verify it covers products and stock_movements channels

**Dependencies:** Milestone 2 (sales list exists for receipt navigation)

**Testing strategy:**
- Unit: Barcode lookup returns correct product
- Unit: Print CSS hides non-printable elements
- Visual: Receipt renders correctly at thermal printer width (58mm/80mm via print styles)
- Integration: Barcode -- add to cart -- checkout flow
- Manual: Print preview shows only receipt content

**Validation approach:**
- Scan a barcode in the POS -- product found and added to cart
- Click print on receipt -- print dialog opens with formatted layout
- Low stock notification fires when dashboard loads with low-stock products
- Realtime subscription updates stock after a sale (verify in another tab)

---

### Milestone 5: Data Export + Dark Mode + Test Expansion

**Goal:** CSV export for all lists, dark mode fully implemented, and test coverage expanded.

**Deliverables:**

| # | Feature | Type | Files to Create/Modify |
|---|---------|------|------------------------|
| 1 | CSV export for all lists | Feature | `@/components/erp/export-button.tsx`, server action per entity |
| 2 | CSV export for reports | Feature | Modify `share-dialog.tsx` or add export button |
| 3 | Dark mode | Feature | Modify `layout.tsx`, add `ThemeProvider`, `ThemeToggle` |
| 4 | ThemeToggle component | Component | `@/components/erp/theme-toggle.tsx` |
| 5 | Expanded tests | Tests | `tests/inventory.test.ts`, `tests/products.test.ts`, `tests/expenses.test.ts`, `tests/auth.test.ts` |

**Implementation details:**
- CSV export: Server action that queries all records for an entity and returns a CSV response. Use `Response` with `Content-Type: text/csv` and `Content-Disposition: attachment`
- Dark mode: Wrap root layout with `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`. All shadcn components already use CSS variables, so dark mode works automatically
- ThemeToggle: Dropdown with Sun/Moon icons, `useTheme()` from next-themes
- New tests follow existing `node:test` + `node:assert/strict` pattern

**Test files to add:**
- `tests/products.test.ts` -- Product CRUD validation, stock calculations
- `tests/auth.test.ts` -- Login/register validation functions
- `tests/expenses.test.ts` -- Expense aggregation, category grouping
- `tests/inventory.test.ts` -- Stock movement calculations, low stock detection
- `tests/reports.test.ts` -- Report data aggregation functions

**Dependencies:** Milestones 1-4 (all features exist to export and test)

**Testing strategy:**
- Unit: CSV generation produces correct header + row format
- Unit: Dark mode toggle changes class on `<html>` element
- Unit: All new tests pass with `npm test`
- Visual: Dark mode renders correctly across all pages
- Edge: Export with 0 records produces header-only CSV

**Validation approach:**
- Click export on each list page -- CSV downloads with correct data
- Toggle dark mode -- all pages render correctly in dark
- `npm test` passes with all new tests
- `npm run typecheck + lint + build` all pass

---

### Milestone 6: Vercel Deployment + Final Polish

**Goal:** Deploy to Vercel with optimized builds and full production readiness.

**Deliverables:**

| # | Feature | Type | Files to Create/Modify |
|---|---------|------|------------------------|
| 1 | Vercel configuration | Config | `vercel.json` (if needed), env vars documented |
| 2 | Build optimizations | Config | Verify `next.config.ts`, enable caching where appropriate |
| 3 | Error monitoring setup | Config | Add error boundary telemetry (optional) |
| 4 | Final typecheck + lint pass | Quality | Fix any remaining issues |
| 5 | Production build test | Quality | `npm run build` succeeds without warnings |
| 6 | User management page | Page | `(dashboard)/settings/users/page.tsx` (if time permits) |

**Implementation details:**
- Vercel: Use Vercel to link and deploy. Set environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`
- Build optimization: `reactCompiler: true` already set
- User management: List org members from `profiles` table, show name/email/role, allow admin to update role

**Dependencies:** All prior milestones

**Testing strategy:**
- Full `npm test` pass
- Full `npm run build` pass
- Verify all pages render in production build
- Verify auth flows work with production Supabase

**Validation approach:**
- `npm run build` completes with no errors
- `npm start` serves the production build correctly
- All 15+ routes accessible and functional
- Deploy preview on Vercel works without errors

---

## Dependency Graph Between Milestones

```
M1 (Auth + Error Boundaries)
 |
 +---> M2 (List Pages)
 |      |
 |      +---> M3 (Dashboard + Inventory + Settings)
 |      |      |
 |      |      +---> M5 (Export + Dark Mode + Tests)
 |      |              |
 |      |              +---> M6 (Deployment)
 |      |
 |      +---> M4 (POS Enhancement)
 |             |
 |             +---> M5 (Export + Dark Mode + Tests)
 |                    |
 |                    +---> M6 (Deployment)
 |
 +---> M5 (can start independently for test expansion)
```

**Key dependencies:**
- M2 needs M1 (auth + error boundaries for new pages)
- M3 needs M2 (list pages exist for cross-linking)
- M4 needs M2 (receipt detail page depends on sales existing)
- M5 depends on M1-M4 (all features must exist to export/test)
- M6 depends on everything

---

## Testing Strategy Summary

### Per Milestone Gate

| Milestone | What to Test | How |
|-----------|-------------|-----|
| M1 | Auth flows, validation, redirects, error/loading states | Manual E2E against real Supabase + unit tests for validators |
| M2 | List rendering, pagination, search, empty states | Unit tests for DataTable + column configs + visual inspection |
| M3 | KPI calculations, dashboard layout, settings CRUD | Unit: StatCard renders, KPI grid responsive, settings form validation |
| M4 | Barcode lookup, print CSS, realtime subscriptions | Manual E2E (scan -> cart -> checkout), print preview, multi-tab |
| M5 | CSV download, dark mode toggle, all unit tests | Unit: CSV format, theme toggle class, `npm test` |
| M6 | Production build, all routes, deployment | `npm run build`, `npm start`, Vercel deploy preview |

### Tools & Surfaces

| Surface | Tool | Concurrency |
|---------|------|-------------|
| Unit tests | `npm test` (node:test + tsx) | Single-threaded |
| Type checking | `npm run typecheck` (tsc) | Single-threaded |
| Linting | `npm run lint` (Biome) | Single-threaded |
| Build | `npm run build` (Next.js) | Multi-threaded |
| Visual testing | Manual + browser devtools | -- |

---

## Summary

This architecture organizes the Zer production-ready mission into 6 milestone gates:

1. **M1 -- Foundation**: Auth pages, error/loading boundaries, landing page move
2. **M2 -- Core Pages**: Products, sales, expenses list pages with pagination and search
3. **M3 -- Dashboard + Inventory + Settings**: KPI home, stock overview, org settings
4. **M4 -- POS Polish**: Barcode, receipt printing, low stock alerts
5. **M5 -- Export + Dark Mode + Tests**: CSV, theme toggle, expanded test suite
6. **M6 -- Deployment**: Vercel config, build optimization, user management

Each milestone is independently testable, builds on prior work, and leaves the app in a deployable state. The user can review and approve each milestone before work begins on the next.
