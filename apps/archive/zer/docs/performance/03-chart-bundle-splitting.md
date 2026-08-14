# Task 3: Keep recharts out of eagerly-loaded bundles

**Goal:** recharts is ~200KB+ of client JS. The project already has a dynamic-import barrel for report charts (`src/components/reports/report-charts-dynamic.ts`) — but some pages bypass it and import charts statically.

Read `docs/performance/README.md` ground rules first.

## Fix 1 — Public report page uses the dynamic barrel

`src/app/r/[token]/page.tsx` (verified) statically imports six recharts-backed components:

```ts
import { ExpenseDonutChart } from "@/components/reports/expense-donut-chart";
import { FinancialSummaryChart } from "@/components/reports/financial-summary-chart";
import { PendingSalesChart } from "@/components/reports/pending-sales-chart";
import { ProductMarginChart } from "@/components/reports/product-margin-chart";
import { ProductRevenueChart } from "@/components/reports/product-revenue-chart";
import { StockMovementChart } from "@/components/reports/stock-movement-chart";
```

First open `src/components/reports/report-charts-dynamic.ts` and confirm it exports dynamically-imported versions of these six components (it did on audit date). Then replace the six static imports with imports from the barrel, e.g.:

```ts
import {
  ExpenseDonutChart,
  FinancialSummaryChart,
  PendingSalesChart,
  ProductMarginChart,
  ProductRevenueChart,
  StockMovementChart,
} from "@/components/reports/report-charts-dynamic";
```

Match the barrel's actual export names — if they differ (e.g. `DynamicExpenseDonutChart`), use those and alias. Non-chart imports on that page (`ExpenseBreakdown`, `FinancialSummary`, `PendingSales`, `ProductSalesTable`, `StockMovements`, etc.) stay as they are.

## Fix 2 — Audit for other static chart imports

Find every file that statically imports recharts or a `*-chart` component outside the dynamic barrel:

```bash
grep -rln "from \"recharts\"" src/ --include="*.tsx" --include="*.ts"
grep -rn "components/reports/.*-chart\"" src/ --include="*.tsx" | grep -v report-charts-dynamic
grep -rn "monthly-trend-chart\"" src/ --include="*.tsx" | grep -v dynamic
```

Rules for what you find:

- A chart component file itself importing recharts (e.g. `expense-donut-chart.tsx`, `src/components/ui/chart.tsx`) is **fine** — the point is that these files are only reachable through `next/dynamic`.
- A **page, section, or layout** importing a chart component directly (not via a `-dynamic` wrapper) is a violation → route it through the existing dynamic wrapper, or create one following the exact pattern in `report-charts-dynamic.ts` / `monthly-trend-chart-dynamic.tsx` (dynamic import + `ChartSkeleton` from `src/components/ui/chart-skeleton.tsx` as loading state).
- The dashboard's `monthly-trend-section.tsx` already imports via `monthly-trend-chart-dynamic` — verify, don't change if correct.

## Fix 3 — Verify

After changes, confirm recharts is no longer in the first-load bundle of the report page:

```bash
pnpm build
```

In the build output route table, note the First Load JS for `/r/[token]` before and after (run the build once on a clean checkout first, or read the number from your report's baseline). It should drop substantially (recharts + chart components move to an async chunk). Record both numbers in your report.

## Do NOT

- Do not convert chart components to server components (recharts requires the client).
- Do not edit `src/components/ui/chart.tsx` internals.
- Do not add a bundle-analyzer dependency.

## Definition of done

- [ ] `src/app/r/[token]/page.tsx` imports all six charts via the dynamic barrel
- [ ] No page/section/layout statically imports a recharts-backed component (grep output clean or each hit justified in report)
- [ ] First Load JS for `/r/[token]` recorded before/after and reduced
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all pass
- [ ] Browser check (`next-dev-loop` skill): a public report page and the dashboard monthly trend still render charts (skeleton first, then chart), no console errors
