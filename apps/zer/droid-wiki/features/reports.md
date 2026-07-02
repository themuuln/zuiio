# Reports

Active contributors: themuuln

## Purpose

The Reports module provides a consolidated daily or date-ranged business overview with 5 main sections: financial summary, product sales breakdown, expense breakdown by category, stock movements summary, pending sales, and commission summary. It supports date range filtering via URL search params, CSV export, and public share links via cryptographically signed tokens.

## Directory Layout

| Path | Type | Purpose |
|---|---|---|
| `src/app/(dashboard)/reports/page.tsx` | Server Component | Fetches full report data, renders all sections with charts |
| `src/app/(dashboard)/reports/date-range-form.tsx` | Client Component | Date range picker using react-day-picker, navigates via URL params |
| `src/app/(dashboard)/reports/actions.ts` | Server Action | `createShareLink` and `deleteShareLink` — generates token-based public URLs |
| `src/app/(dashboard)/reports/share-dialog.tsx` | Client Component | Dialog for generating and copying share links |
| `src/lib/reports.ts` | Library | All report query functions: `getFullReport` and individual section queries |

## Key Abstractions

| Abstraction | Type | Purpose |
|---|---|---|
| `FinancialSummary` | Type | totalSales, totalPaid, totalExpenses, netCash, grossProfit |
| `ProductSalesRow` | Type | Per-product: productName, quantity, revenue, cost, profit, margin |
| `ExpenseCategoryRow` | Type | Per-category: category, count, total |
| `StockMovementsSummary` | Type | Counts of in/out/adjustment movements |
| `PendingSaleRow` | Type | Pending sale: id, contactName, saleDate, totalAmount, paymentMethod |
| `CommissionSummaryData` | Type | totalEarned, totalPaid, totalUnpaid, staffBreakdown |
| `ReportData` | Type | Combined object with all 6 report sections |

## How It Works

### Report Sections

The `getFullReport` function in `src/lib/reports.ts` runs 6 queries in parallel:

1. **Financial Summary** (`getFinancialSummary`): Queries sales (total_amount, paid_amount), expenses (amount), and sale_items (quantity, cost_price) to compute totalSales, totalPaid, totalExpenses, netCash (totalPaid - totalExpenses), and grossProfit (totalSales - COGS).

2. **Product Sales** (`getProductSalesBreakdown`): Aggregates sale_items by product name, computing quantity, revenue, cost, profit, and margin percentage. Sorted by revenue descending.

3. **Expense Breakdown** (`getExpenseBreakdownByCategory`): Groups expenses by category, counting occurrences and summing amounts. Sorted by total descending.

4. **Stock Movements** (`getStockMovementsSummary`): Counts stock_movements by type (in/out/adjustment) within the date range.

5. **Pending Sales** (`getPendingSales`): Lists sales with status "pending", including contact name, sale date, total amount, and payment method.

6. **Commission Summary** (`getCommissionSummaryReport`): Aggregates commission_amount from sale_items by staff, queries paid amounts from commission_payout_items, and computes earned/paid/unpaid per staff member.

### Date Range Filtering

The `DateRangeForm` component uses a `DateRangePicker` from react-day-picker. When the user selects a range, it navigates to `/reports?from=YYYY-MM-DD&to=YYYY-MM-DD` using the Next.js router. The server component parses and validates these params (rejecting invalid dates like "2026-02-30").

### CSV Export

The `ExportButton` component links to `/api/export/reports?from=...&to=...` for downloading the report as CSV.

### Public Share Links

The `ShareDialog` generates a cryptographically random 32-byte hex token stored in the `shared_reports` table. Each token is unique per organization + date range combination. The share URL format is `/r/{token}` — anyone with this URL can view the report without authentication.

### Rendering

The reports page renders section pairs: some sections have both a table/chart view side by side (e.g., `ProductSalesTable` + `ProductRevenueChart`, `ExpenseBreakdown` + `ExpenseDonutChart`).

```mermaid
flowchart TD
    A[Reports Page] --> B[Parse date params from URL]
    B --> C[Call getFullReport]
    C --> D[getFinancialSummary]
    C --> E[getProductSalesBreakdown]
    C --> F[getExpenseBreakdownByCategory]
    C --> G[getStockMovementsSummary]
    C --> H[getPendingSales]
    C --> I[getCommissionSummaryReport]
    D --> J[Assemble ReportData]
    E --> J
    F --> J
    G --> J
    H --> J
    I --> J
    J --> K[Render 6 sections with charts]
    K --> L[DateRangeForm for filtering]
    K --> M[ExportButton for CSV]
    K --> N[ShareDialog for public links]
    N --> O[createShareLink server action]
    O --> P[Store token in shared_reports]
    P --> Q[Return /r/{token} URL]
```

## Key Source Files

| File | Purpose |
|---|---|
| `src/app/(dashboard)/reports/page.tsx` | Server component — fetches and renders report |
| `src/lib/reports.ts` | All report query functions with types |
| `src/app/(dashboard)/reports/date-range-form.tsx` | Date range picker with URL navigation |
| `src/app/(dashboard)/reports/actions.ts` | Share link creation and deletion |
| `src/app/(dashboard)/reports/share-dialog.tsx` | Share link dialog UI |
