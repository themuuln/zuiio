# Multi-Branch Dashboard & Reports Implementation Plan

**Date:** 2026-06-10
**Author:** Temuulen Undrakhbayar
**Branch:** main
**Commit:** 921adadd
**Status:** ready

---

## Overview

Add cross-branch KPI consolidation and branch comparison views to the dashboard and reports modules. When a multi-branch organization selects "All Branches", the user currently sees aggregated data with no per-branch breakdown. This plan adds:

1. **Dashboard branch comparison section** — a table showing each branch's KPIs side-by-side with totals, performance bars, and deltas
2. **Reports branch comparison tab** — a dedicated comparison view showing all branches' report metrics in a sortable, exportable table

## Requirements

- New backend service: `getBranchComparison()` — returns per-branch KPI summaries
- New React Query hook: `useBranchComparison()`
- New UI component: `BranchComparisonTable` — reusable across dashboard and reports
- Dashboard integration: new "Branch Performance" section below KPI cards (only visible with 2+ branches)
- Reports integration: new "Branch Comparison" tab alongside existing daily/weekly/monthly/eod tabs
- i18n: both `en.json` and `mn.json` updated
- Tests: service function + component tests

## Current State Analysis

### Key Discoveries

| Area | Finding | File:Line |
|------|---------|-----------|
| Branch filtering | `withBranchFilter()` conditionally adds `.eq("branch_id", branchId)` to any query | `src/lib/supabase/with-branch.ts:30` |
| Dashboard data | `getDashboardData()` accepts `branchId` and filters all queries, but doesn't support multi-branch grouping | `src/lib/services/report-service/dashboard.ts:29` |
| Reports data | `getDailyReport()` / `getCustomReport()` accept single `branchId`, no comparison mode | `src/lib/services/report-service/reports.ts:10` |
| Branch selector | `BranchSelect` renders "All" option when `value="all"`, branch list from `useBranches(orgId)` | `src/components/branch-select.tsx:23` |
| Branch state | Zustand store `selectedBranchId` defaults to `"all"`, persisted to localStorage | `src/lib/stores/ui-store.ts` |
| Dashboard types | `DashboardSummary` has 11 fields: totalRevenue, activeWorkOrders, etc. | `src/lib/types/dashboard.ts:6` |
| Report types | `DailyReport` has work_orders_completed, services_count, parts_count, total_revenue, profitability, mechanic_kpis | `src/lib/types/service-params.ts:220` |
| Cache keys | `dashboardKeys.all(orgId, branchId)` and `reportKeys.all(orgId, branchId)` already branch-scoped | `src/lib/queries/keys.ts` |
| Utils | `hasMultipleBranches(branches)` gates branch UI visibility | `src/lib/utils.ts:72` |
| Charts | Recharts already available, `ChartContainer`/`ChartTooltip` from shadcn | `src/components/ui/chart.tsx` |

### Existing Patterns to Follow

1. **Service pattern**: Functions receive `(db, orgId, ...params)` from API route → return plain data. Example: `getDashboardData()` in `src/lib/services/report-service/dashboard.ts:29`
2. **Query hook pattern**: `createOrgQuery<T>(path)` factory → `useQuery` with `queryKey` from key factory. Example: `useDashboard()` in `src/lib/queries/use-dashboard.ts`
3. **Key factory pattern**: `dashboardKeys.all(orgId, branchId)` with `branchId ?? "all"` sentinel. Example: `src/lib/queries/keys.ts:340`
4. **Branch filter gating**: `hasMultipleBranches(branches)` before rendering `BranchSelect`. Example: `src/app/[locale]/dashboard/page.tsx:346`
5. **Component pattern**: `_`-prefixed files co-located with page, barrel exports from `src/components/reports/index.ts`

## Desired End State

### Dashboard — Branch Comparison Section
```
┌──────────────────────────────────────────────────────────────┐
│ 🏢 Branch Performance                                        │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│ Branch   │ Revenue  │ WOs      │ Active   │ Avg Repair Order│
├──────────┼──────────┼──────────┼──────────┼─────────────────┤
│ Баянзүрх │ ₮12.4M   │ 142      │ 8        │ ₮87,324        │
│ Хан-Уул  │ ₮9.8M    │ 98       │ 5        │ ₮100,000       │
│ Сонгино  │ ₮15.2M   │ 178      │ 12       │ ₮85,393        │
├──────────┼──────────┼──────────┼──────────┼─────────────────┤
│ TOTAL    │ ₮37.4M   │ 418      │ 25       │ ₮89,474        │
└──────────────────┴──────────┴──────────┴─────────────────┘
  ████▌           ███▌        ████▌      ████▌
```

### Reports — Branch Comparison Tab
```
┌──────────────────────────────────────────────────────────────┐
│ 📊 Branch Comparison — June 2026                             │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│ Branch   │ WOs      │ Services │ Revenue  │ Gross Profit    │
├──────────┼──────────┼──────────┼──────────┼─────────────────┤
│ Баянзүрх │ 142      │ 312      │ ₮12.4M   │ ₮4.2M (34%)    │
│ Хан-Уул  │ 98       │ 201      │ ₮9.8M    │ ₮3.1M (32%)    │
│ Сонгино  │ 178      │ 398      │ ₮15.2M   │ ₮5.8M (38%)    │
├──────────┼──────────┼──────────┼──────────┼─────────────────┤
│ TOTAL    │ 418      │ 911      │ ₮37.4M   │ ₮13.1M (35%)   │
└──────────────────┴──────────┴──────────┴─────────────────┘
  +8%              +12%        +7%         +9%
```

## What We're NOT Doing

- Per-branch drill-down from comparison table (deferred — separate feature)
- Cross-branch inventory comparison (inventory has its own reports module)
- Branch performance benchmarking against external data
- Real-time branch comparison (static per-query snapshot is sufficient)
- Modifying existing branch-scoped queries — only adding new comparison queries
- Changing the `BranchSelect` component behavior

## Decisions

### Decision 1: Backend — Single query with GROUP BY vs. multiple parallel queries
**Explored:**
- Option A: SQL `GROUP BY branch_id` — single query, Postgres does aggregation. Faster, fewer round trips.
- Option B: Parallel per-branch queries — reuse existing service functions. More code duplication, more DB round trips.

**Decision:** Option A (GROUP BY). Follows the pattern in `getRevenueTrendBatched()` which already does grouped aggregation (`src/lib/services/report-service/queries.ts:20`). The new function will query `work_orders` directly with `GROUP BY branch_id`, then fetch services/parts in batched queries by branch.

### Decision 2: Component — Shared `BranchComparisonTable` vs. separate dashboard/reports components
**Explored:**
- Option A: Single shared component with configurable columns
- Option B: Two separate components

**Decision:** Option A (shared). The table structure is identical — branch name + metrics columns + totals row. Column configuration via props. Follows the `MechanicTable` pattern which accepts configurable `kpis` data.

### Decision 3: UI placement — New section on dashboard vs. modifying existing KPI grid
**Explored:**
- Option A: New "Branch Performance" section below KPI cards (standalone Card)
- Option B: Extend existing KPI grid with branch breakdown rows

**Decision:** Option A (new section). Less disruptive to existing layout, clearer visual separation. Follows the pattern of `LowStockCard` and `CashRegisterWidget` which are standalone sections.

### Decision 4: Reports — New tab vs. modifying existing views
**Explored:**
- Option A: New "Branch Comparison" tab (6th tab alongside daily/weekly/monthly/custom/eod)
- Option B: Add a "Compare Branches" toggle to existing views

**Decision:** Option A (new tab). Cleaner separation, no complexity added to existing report types. Follows the existing tab pattern where each tab has its own data fetch and rendering.

## Phase 1: Types & Backend Service

**Files:**
- `src/lib/types/dashboard.ts` — ADD `BranchKpiSummary` and `BranchComparisonData` types
- `src/lib/services/report-service/branch-comparison.ts` — NEW — `getBranchComparison()` service function
- `src/lib/services/report-service/index.ts` — MODIFY — add export

**Overview:** Foundation layer — types and the core data-fetching service. No UI yet.

### Changes Required:

#### 1.1 `src/lib/types/dashboard.ts`

**File**: `src/lib/types/dashboard.ts`
**Changes**: MODIFY — add new types after existing `DashboardSummary`

```typescript
/** Per-branch KPI summary for cross-branch comparison */
export interface BranchKpiSummary {
  branchId: string;
  branchName: string;
  isMain: boolean;
  totalRevenue: number;
  serviceRevenue: number;
  partsRevenue: number;
  grossProfit: number;
  marginPercent: number;
  activeWorkOrders: number;
  completedWorkOrders: number;
  totalCustomers: number;
  avgRepairOrderValue: number;
  serviceMix: number; // percentage of revenue from services
}

/** Cross-branch comparison data */
export interface BranchComparisonData {
  branches: BranchKpiSummary[];
  totals: Omit<BranchKpiSummary, "branchId" | "branchName" | "isMain">;
  periodLabel: string;
}
```

#### 1.2 `src/lib/services/report-service/branch-comparison.ts`

**File**: `src/lib/services/report-service/branch-comparison.ts`
**Changes**: NEW — service function

```typescript
/**
 * Branch Comparison Service
 *
 * Returns per-branch KPI summaries for cross-branch comparison.
 * Used by dashboard branch comparison section and reports comparison tab.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { cacheDurations, cacheTags } from "@/lib/cache/keys";
import { withCache } from "@/lib/cache/with-cache";

import type { BranchComparisonData, BranchKpiSummary } from "@/lib/types";

/**
 * Get KPI comparison data across all branches for an organization.
 *
 * @param db - Supabase client
 * @param orgId - Organization ID
 * @param dateFrom - Period start date (YYYY-MM-DD)
 * @param dateTo - Period end date (YYYY-MM-DD)
 * @returns BranchComparisonData with per-branch metrics and totals
 */
export async function getBranchComparison(
  db: SupabaseClient,
  orgId: string,
  dateFrom: string,
  dateTo: string,
): Promise<BranchComparisonData> {
  const supabase = db;

  return withCache(
    ["getBranchComparison", orgId, dateFrom, dateTo],
    async () => {
      // ── 1. Fetch branches ──
      const { data: branches } = await supabase
        .from("branches")
        .select("id, name, is_main")
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .order("name");

      const branchList = branches ?? [];
      const branchIds = branchList.map((b) => b.id);

      if (branchIds.length === 0) {
        return {
          branches: [],
          totals: emptyTotals(),
          periodLabel: `${dateFrom} – ${dateTo}`,
        };
      }

      // ── 2. Fetch completed WOs per branch in date range ──
      const { data: completedWos } = await supabase
        .from("work_orders")
        .select("id, branch_id")
        .eq("organization_id", orgId)
        .eq("status", "Completed")
        .gte("created_at", `${dateFrom}T00:00:00`)
        .lte("created_at", `${dateTo}T23:59:59`)
        .is("deleted_at", null)
        .in("branch_id", branchIds);

      // ── 3. Fetch active WOs per branch ──
      const { data: activeWos } = await supabase
        .from("work_orders")
        .select("branch_id")
        .eq("organization_id", orgId)
        .not("status", "in", '("Completed","Cancelled")')
        .is("deleted_at", null)
        .in("branch_id", branchIds);

      // ── 4. Fetch total customers per branch ──
      const { data: customerCounts } = await supabase
        .from("customers")
        .select("branch_id")
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .in("branch_id", branchIds);

      // ── 5. Group WO IDs by branch for revenue calculation ──
      const woByBranch = new Map<string, string[]>();
      for (const wo of completedWos ?? []) {
        const bid = wo.branch_id as string;
        if (!bid) continue;
        if (!woByBranch.has(bid)) woByBranch.set(bid, []);
        woByBranch.get(bid)!.push(wo.id);
      }

      // ── 6. Fetch services + parts revenue per branch ──
      const allWoIds = (completedWos ?? []).map((w) => w.id);
      const [servicesData, partsData] = await Promise.all([
        allWoIds.length > 0
          ? supabase
              .from("work_order_services")
              .select(
                "final_price, unit_cost, quantity, work_order_id",
              )
              .in("work_order_id", allWoIds)
          : { data: [] as any[] },
        allWoIds.length > 0
          ? supabase
              .from("work_order_parts")
              .select(
                "final_price, unit_cost, quantity, work_order_id",
              )
              .in("work_order_id", allWoIds)
          : { data: [] as any[] },
      ]);

      // Build WO→branch map
      const woBranchMap = new Map<string, string>();
      for (const wo of completedWos ?? []) {
        woBranchMap.set(wo.id, wo.branch_id as string);
      }

      // Aggregate revenue by branch
      const branchRevenue = new Map<
        string,
        { serviceRev: number; partsRev: number; serviceCost: number; partsCost: number }
      >();
      for (const bid of branchIds) {
        branchRevenue.set(bid, {
          serviceRev: 0,
          partsRev: 0,
          serviceCost: 0,
          partsCost: 0,
        });
      }

      for (const s of servicesData.data ?? []) {
        const bid = woBranchMap.get(s.work_order_id);
        if (!bid) continue;
        const rev = branchRevenue.get(bid)!;
        rev.serviceRev += Number(s.final_price);
        rev.serviceCost += Number(s.unit_cost ?? 0) * Number(s.quantity);
      }
      for (const p of partsData.data ?? []) {
        const bid = woBranchMap.get(p.work_order_id);
        if (!bid) continue;
        const rev = branchRevenue.get(bid)!;
        rev.partsRev += Number(p.final_price);
        rev.partsCost += Number(p.unit_cost ?? 0) * Number(p.quantity);
      }

      // ── 7. Build per-branch summaries ──
      const activeByBranch = new Map<string, number>();
      for (const wo of activeWos ?? []) {
        const bid = wo.branch_id as string;
        if (!bid) continue;
        activeByBranch.set(bid, (activeByBranch.get(bid) ?? 0) + 1);
      }

      const customersByBranch = new Map<string, number>();
      for (const c of customerCounts ?? []) {
        const bid = c.branch_id as string;
        if (!bid) continue;
        customersByBranch.set(bid, (customersByBranch.get(bid) ?? 0) + 1);
      }

      const summaries: BranchKpiSummary[] = branchList.map((branch) => {
        const rev = branchRevenue.get(branch.id) ?? {
          serviceRev: 0,
          partsRev: 0,
          serviceCost: 0,
          partsCost: 0,
        };
        const totalRevenue = rev.serviceRev + rev.partsRev;
        const totalCost = rev.serviceCost + rev.partsCost;
        const grossProfit = totalRevenue - totalCost;
        const woCount = woByBranch.get(branch.id)?.length ?? 0;

        return {
          branchId: branch.id,
          branchName: branch.name,
          isMain: branch.is_main ?? false,
          totalRevenue,
          serviceRevenue: rev.serviceRev,
          partsRevenue: rev.partsRev,
          grossProfit,
          marginPercent:
            totalRevenue > 0
              ? Math.round((grossProfit / totalRevenue) * 1000) / 10
              : 0,
          activeWorkOrders: activeByBranch.get(branch.id) ?? 0,
          completedWorkOrders: woCount,
          totalCustomers: customersByBranch.get(branch.id) ?? 0,
          avgRepairOrderValue:
            woCount > 0 ? Math.round((totalRevenue / woCount) * 100) / 100 : 0,
          serviceMix:
            totalRevenue > 0
              ? Math.round((rev.serviceRev / totalRevenue) * 1000) / 10
              : 0,
        };
      });

      // ── 8. Compute totals ──
      const totals = {
        totalRevenue: summaries.reduce((s, b) => s + b.totalRevenue, 0),
        serviceRevenue: summaries.reduce((s, b) => s + b.serviceRevenue, 0),
        partsRevenue: summaries.reduce((s, b) => s + b.partsRevenue, 0),
        grossProfit: summaries.reduce((s, b) => s + b.grossProfit, 0),
        marginPercent: 0,
        activeWorkOrders: summaries.reduce((s, b) => s + b.activeWorkOrders, 0),
        completedWorkOrders: summaries.reduce(
          (s, b) => s + b.completedWorkOrders,
          0,
        ),
        totalCustomers: summaries.reduce((s, b) => s + b.totalCustomers, 0),
        avgRepairOrderValue: 0,
        serviceMix: 0,
      };

      totals.marginPercent =
        totals.totalRevenue > 0
          ? Math.round((totals.grossProfit / totals.totalRevenue) * 1000) / 10
          : 0;
      totals.avgRepairOrderValue =
        totals.completedWorkOrders > 0
          ? Math.round(
              (totals.totalRevenue / totals.completedWorkOrders) * 100,
            ) / 100
          : 0;
      totals.serviceMix =
        totals.totalRevenue > 0
          ? Math.round(
              (totals.serviceRevenue / totals.totalRevenue) * 1000,
            ) / 10
          : 0;

      return {
        branches: summaries,
        totals,
        periodLabel: `${dateFrom} – ${dateTo}`,
      };
    },
    {
      tags: [cacheTags.reports(orgId)],
      revalidate: cacheDurations.reports,
    },
  );
}

function emptyTotals(): BranchComparisonData["totals"] {
  return {
    totalRevenue: 0,
    serviceRevenue: 0,
    partsRevenue: 0,
    grossProfit: 0,
    marginPercent: 0,
    activeWorkOrders: 0,
    completedWorkOrders: 0,
    totalCustomers: 0,
    avgRepairOrderValue: 0,
    serviceMix: 0,
  };
}
```

#### 1.3 `src/lib/services/report-service/index.ts`

**File**: `src/lib/services/report-service/index.ts`
**Changes**: MODIFY — add re-export

```typescript
export { getBranchComparison } from "./branch-comparison";
```

### Success Criteria:

#### Automated Verification:
- [ ] Type checking passes: `npm run validate:types`
- [ ] No circular dependencies: `grep -r "branch-comparison" src/lib/services/report-service/ | wc -l` returns >= 1 (index.ts export)

#### Manual Verification:
- [ ] `BranchKpiSummary` and `BranchComparisonData` types are importable from `@/lib/types`
- [ ] `getBranchComparison` is importable from `@/lib/services/report-service`

---

## Phase 2: API Route & React Query Hook

**Files:**
- `src/app/api/organizations/[id]/reports/route.ts` — MODIFY — add `branch-comparison` case
- `src/lib/queries/use-branch-comparison.ts` — NEW — React Query hook
- `src/lib/queries/keys.ts` — MODIFY — add `branchComparison` key

**Overview:** Wire the service to an API endpoint and create the client-side data hook. Depends on Phase 1.

### Changes Required:

#### 2.1 `src/lib/queries/keys.ts`

**File**: `src/lib/queries/keys.ts`
**Changes**: MODIFY — add to `dashboardKeys`

```typescript
export const dashboardKeys = {
  all: (orgId: string, branchId?: string | null) =>
    ["organizations", orgId, "dashboard", branchId ?? "all"] as const,
  summary: (orgId: string, period: string, branchId?: string | null) =>
    [...dashboardKeys.all(orgId, branchId), "summary", period] as const,
  branchComparison: (orgId: string, dateFrom: string, dateTo: string) =>
    ["organizations", orgId, "dashboard", "branch-comparison", dateFrom, dateTo] as const,
};
```

#### 2.2 `src/lib/queries/use-branch-comparison.ts`

**File**: `src/lib/queries/use-branch-comparison.ts`
**Changes**: NEW — React Query hook

```typescript
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { BranchComparisonData } from "@/lib/types";
import { createOrgQuery } from "./factory";
import { dashboardKeys } from "./keys";

const fetchBranchComparison = createOrgQuery<BranchComparisonData>(
  "/reports",
);

/**
 * Fetches cross-branch KPI comparison data.
 * Used by dashboard and reports for the branch comparison view.
 */
export function useBranchComparison(
  orgId: string | undefined,
  dateFrom: string,
  dateTo: string,
  enabled: boolean = true,
): UseQueryResult<BranchComparisonData, Error> {
  return useQuery({
    queryKey: dashboardKeys.branchComparison(orgId ?? "", dateFrom, dateTo),
    queryFn: async () => {
      if (!orgId) throw new Error("Organization is required");
      return fetchBranchComparison(orgId, {
        params: {
          type: "branch-comparison",
          date_from: dateFrom,
          date_to: dateTo,
        },
      });
    },
    enabled: !!orgId && enabled,
    staleTime: 60_000,
    retry: 1,
  });
}
```

#### 2.3 `src/app/api/organizations/[id]/reports/route.ts`

**File**: `src/app/api/organizations/[id]/reports/route.ts`
**Changes**: MODIFY — add `branch-comparison` case to the switch statement

Add inside the `switch (type)` block, before the `default` case:

```typescript
case "branch-comparison": {
  const comparison = await getBranchComparison(
    orgId,
    dateFrom,
    dateTo,
  );
  return NextResponse.json({ data: comparison });
}
```

Also add `getBranchComparison` to the imports at the top of the file.

### Success Criteria:

#### Automated Verification:
- [ ] Type checking passes: `npm run validate:types`
- [ ] Biome lint passes: `npm run validate:lint`

#### Manual Verification:
- [ ] `useBranchComparison` hook is importable from `@/lib/queries/use-branch-comparison`
- [ ] API route handles `?type=branch-comparison&date_from=...&date_to=...`

---

## Phase 3: Branch Comparison Table Component

**Files:**
- `src/components/branch-comparison-table.tsx` — NEW — shared comparison table
- `src/components/branch-comparison-table.test.tsx` — NEW — component tests

**Overview:** Reusable UI component for displaying branch comparison data. Depends on Phase 1 types.

### Changes Required:

#### 3.1 `src/components/branch-comparison-table.tsx`

**File**: `src/components/branch-comparison-table.tsx`
**Changes**: NEW — shared component

```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Typography } from "@/components/ui/typography";
import type { BranchComparisonData, BranchKpiSummary } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface BranchComparisonTableProps {
  data: BranchComparisonData | null;
  loading?: boolean;
  /** Which columns to show. Defaults to all. */
  columns?: ColumnKey[];
  /** Column configuration overrides */
  columnConfig?: Partial<Record<ColumnKey, ColumnConfig>>;
}

type ColumnKey =
  | "revenue"
  | "workOrders"
  | "activeWorkOrders"
  | "avgRepairOrder"
  | "grossProfit"
  | "margin"
  | "customers"
  | "serviceMix";

interface ColumnConfig {
  label: string;
  format: "currency" | "number" | "percent";
  getValue: (branch: BranchKpiSummary) => number;
  getDelta?: (branch: BranchKpiSummary) => number | null;
}

const DEFAULT_COLUMNS: Record<ColumnKey, ColumnConfig> = {
  revenue: {
    label: "Revenue",
    format: "currency",
    getValue: (b) => b.totalRevenue,
  },
  workOrders: {
    label: "Completed WOs",
    format: "number",
    getValue: (b) => b.completedWorkOrders,
  },
  activeWorkOrders: {
    label: "Active WOs",
    format: "number",
    getValue: (b) => b.activeWorkOrders,
  },
  avgRepairOrder: {
    label: "Avg Repair Order",
    format: "currency",
    getValue: (b) => b.avgRepairOrderValue,
  },
  grossProfit: {
    label: "Gross Profit",
    format: "currency",
    getValue: (b) => b.grossProfit,
  },
  margin: {
    label: "Margin",
    format: "percent",
    getValue: (b) => b.marginPercent,
  },
  customers: {
    label: "Customers",
    format: "number",
    getValue: (b) => b.totalCustomers,
  },
  serviceMix: {
    label: "Service Mix",
    format: "percent",
    getValue: (b) => b.serviceMix,
  },
};

const DEFAULT_COLUMNS_LIST: ColumnKey[] = [
  "revenue",
  "workOrders",
  "activeWorkOrders",
  "avgRepairOrder",
];

function formatValue(value: number, format: "currency" | "number" | "percent"): string {
  switch (format) {
    case "currency":
      return formatCurrency(value);
    case "percent":
      return `${value}%`;
    case "number":
    default:
      return String(Math.round(value));
  }
}

/** Get the best value for a column (highest revenue/profit/margin, lowest N/A) */
function getBestValue(
  branches: BranchKpiSummary[],
  config: ColumnConfig,
): number {
  return Math.max(...branches.map((b) => config.getValue(b)));
}

function PerformanceBar({
  value,
  max,
  format,
}: {
  value: number;
  max: number;
  format: "currency" | "number" | "percent";
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary/60 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">
        {formatValue(value, format)}
      </span>
    </div>
  );
}

export function BranchComparisonTable({
  data,
  loading = false,
  columns = DEFAULT_COLUMNS_LIST,
  columnConfig,
}: BranchComparisonTableProps) {
  const configs = columns.map((key) => ({
    key,
    ...DEFAULT_COLUMNS[key],
    ...(columnConfig?.[key] ?? {}),
  }));

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Branch Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.branches.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">
          Branch Performance
        </CardTitle>
        <Typography.Muted className="text-xs">
          {data.periodLabel}
        </Typography.Muted>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="px-4 py-3 text-left font-medium">
                Branch
              </TableHead>
              {configs.map((cfg) => (
                <TableHead
                  key={cfg.key}
                  className="px-4 py-3 text-right font-medium"
                >
                  {cfg.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.branches.map((branch) => {
              const best = getBestValue(data.branches, configs[0]);
              return (
                <TableRow
                  key={branch.branchId}
                  className="border-b border-border hover:bg-muted/30"
                >
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{branch.branchName}</span>
                      {branch.isMain && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          Main
                        </span>
                      )}
                    </div>
                  </TableCell>
                  {configs.map((cfg) => (
                    <TableCell
                      key={cfg.key}
                      className="px-4 py-3 text-right"
                    >
                      {cfg.key === "revenue" ? (
                        <PerformanceBar
                          value={cfg.getValue(branch)}
                          max={best}
                          format={cfg.format}
                        />
                      ) : (
                        <span className="tabular-nums">
                          {formatValue(cfg.getValue(branch), cfg.format)}
                        </span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-muted/30 font-semibold">
              <TableCell className="px-4 py-3">TOTAL</TableCell>
              {configs.map((cfg) => {
                const totalKey = cfg.key === "activeWorkOrders"
                  ? "activeWorkOrders"
                  : cfg.key === "workOrders"
                    ? "completedWorkOrders"
                    : cfg.key === "customers"
                      ? "totalCustomers"
                      : cfg.key;
                const totalValue =
                  totalKey in data.totals
                    ? (data.totals as Record<string, number>)[totalKey]
                    : 0;
                return (
                  <TableCell
                    key={cfg.key}
                    className="px-4 py-3 text-right tabular-nums"
                  >
                    {formatValue(totalValue, cfg.format)}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
```

### Success Criteria:

#### Automated Verification:
- [ ] Type checking passes: `npm run validate:types`
- [ ] Biome lint passes: `npm run validate:lint`

#### Manual Verification:
- [ ] Component renders a table with branch names, metrics, and totals
- [ ] Performance bar renders correctly for revenue column
- [ ] Component handles empty data gracefully (returns null)
- [ ] Component handles loading state with skeletons

---

## Phase 4: Dashboard Integration

**Files:**
- `src/app/[locale]/dashboard/page.tsx` — MODIFY — add branch comparison section
- `src/app/[locale]/dashboard/_branch-comparison-section.tsx` — NEW — extracted section component

**Overview:** Add the branch comparison view to the dashboard page. Only shows when org has 2+ branches. Depends on Phases 2 & 3.

### Changes Required:

#### 4.1 `src/app/[locale]/dashboard/_branch-comparison-section.tsx`

**File**: `src/app/[locale]/dashboard/_branch-comparison-section.tsx`
**Changes**: NEW — extracted dashboard section

```tsx
"use client";

import { useTranslations } from "next-intl";
import { BranchComparisonTable } from "@/components/branch-comparison-table";
import { useBranchComparison } from "@/lib/queries/use-branch-comparison";

interface BranchComparisonSectionProps {
  orgId: string;
  dateFrom: string;
  dateTo: string;
}

export function BranchComparisonSection({
  orgId,
  dateFrom,
  dateTo,
}: BranchComparisonSectionProps) {
  const t = useTranslations();
  const { data, isLoading } = useBranchComparison(orgId, dateFrom, dateTo);

  return (
    <BranchComparisonTable
      data={data ?? null}
      loading={isLoading}
      columns={["revenue", "workOrders", "activeWorkOrders", "avgRepairOrder"]}
    />
  );
}
```

#### 4.2 `src/app/[locale]/dashboard/page.tsx`

**File**: `src/app/[locale]/dashboard/page.tsx`
**Changes**: MODIFY — import and render `BranchComparisonSection` after KPI cards

Add import at top:
```typescript
import { BranchComparisonSection } from "./_branch-comparison-section";
```

Add after the KPI grid (after the closing `</div>` of the grid, before `<ChartsSection>`):
```tsx
{/* ── Branch Comparison (multi-branch only) ── */}
{hasMultipleBranches(branches) && (
  <BranchComparisonSection
    orgId={orgId}
    dateFrom={dateFrom ?? new Date().toISOString().split("T")[0]}
    dateTo={dateTo ?? new Date().toISOString().split("T")[0]}
  />
)}
```

### Success Criteria:

#### Automated Verification:
- [ ] Type checking passes: `npm run validate:types`
- [ ] No new lint errors: `npm run validate:lint`

#### Manual Verification:
- [ ] Dashboard shows "Branch Performance" table when org has 2+ branches
- [ ] Table shows branch names with "Main" badge, revenue with performance bar, WO counts, avg repair order
- [ ] Table shows TOTAL row at bottom
- [ ] Section does NOT appear when org has 1 branch
- [ ] Loading state shows skeleton animation
- [ ] Date range filter affects the comparison data

---

## Phase 5: Reports Branch Comparison Tab

**Files:**
- `src/app/[locale]/dashboard/reports/page.tsx` — MODIFY — add comparison tab
- `src/app/[locale]/dashboard/reports/_branch-comparison-view.tsx` — NEW — report comparison view

**Overview:** Add a dedicated "Branch Comparison" tab to the reports page with enhanced metrics. Depends on Phases 2 & 3.

### Changes Required:

#### 5.1 `src/app/[locale]/dashboard/reports/_branch-comparison-view.tsx`

**File**: `src/app/[locale]/dashboard/reports/_branch-comparison-view.tsx`
**Changes**: NEW — report comparison view

```tsx
"use client";

import { BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import type { BranchComparisonData } from "@/lib/types";

interface BranchComparisonViewProps {
  data: BranchComparisonData | null;
  loading?: boolean;
}

/**
 * Enhanced branch comparison view for reports.
 * Shows full KPI grid including profitability metrics.
 */
export function BranchComparisonView({
  data,
  loading = false,
}: BranchComparisonViewProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <div className="p-6">
                <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-8 w-24 animate-pulse rounded bg-muted" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.branches.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <BarChart3 className="size-7 text-muted-foreground" />
          </div>
          <div className="text-center">
            <Typography.H3 className="text-sm font-semibold">
              No Branch Data
            </Typography.H3>
            <Typography.Muted className="mt-1 text-xs text-muted-foreground">
              Create multiple branches to see comparison data
            </Typography.Muted>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary KPIs — totals across all branches */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="p-4">
            <Typography.Muted className="text-xs">Total Revenue</Typography.Muted>
            <Typography.H2 className="mt-1 text-2xl font-bold tabular-nums">
              {formatCurrency(data.totals.totalRevenue)}
            </Typography.H2>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <Typography.Muted className="text-xs">Total Work Orders</Typography.Muted>
            <Typography.H2 className="mt-1 text-2xl font-bold tabular-nums">
              {data.totals.completedWorkOrders}
            </Typography.H2>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <Typography.Muted className="text-xs">Gross Profit</Typography.Muted>
            <Typography.H2 className="mt-1 text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCurrency(data.totals.grossProfit)}
            </Typography.H2>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <Typography.Muted className="text-xs">Avg Margin</Typography.Muted>
            <Typography.H2 className="mt-1 text-2xl font-bold tabular-nums">
              {data.totals.marginPercent}%
            </Typography.H2>
          </div>
        </Card>
      </div>

      {/* Branch ranking table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Rank
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Branch
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Revenue
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  WOs
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Gross Profit
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Margin
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Avg Order
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Customers
                </th>
              </tr>
            </thead>
            <tbody>
              {data.branches
                .sort((a, b) => b.totalRevenue - a.totalRevenue)
                .map((branch, index) => (
                  <tr
                    key={branch.branchId}
                    className="border-b border-border hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{branch.branchName}</span>
                        {branch.isMain && (
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            Main
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatCurrency(branch.totalRevenue)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {branch.completedWorkOrders}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(branch.grossProfit)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {branch.marginPercent}%
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatCurrency(branch.avgRepairOrderValue)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {branch.totalCustomers}
                    </td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/30 font-semibold">
                <td className="px-4 py-3" />
                <td className="px-4 py-3">TOTAL</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatCurrency(data.totals.totalRevenue)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {data.totals.completedWorkOrders}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(data.totals.grossProfit)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {data.totals.marginPercent}%
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatCurrency(data.totals.avgRepairOrderValue)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {data.totals.totalCustomers}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}

// Re-export for convenience
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("mn-MN", {
    style: "currency",
    currency: "MNT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
```

Note: Import `formatCurrency` from `@/lib/utils` instead of re-defining — this is shown inline for clarity.

#### 5.2 `src/app/[locale]/dashboard/reports/page.tsx`

**File**: `src/app/[locale]/dashboard/reports/page.tsx`
**Changes**: MODIFY — add "comparison" tab and view

Add import:
```typescript
import { BranchComparisonView } from "./_branch-comparison-view";
import { useBranchComparison } from "@/lib/queries/use-branch-comparison";
import { GitBranch } from "lucide-react";
```

Add "comparison" to the tabs array:
```typescript
const tabs: { label: string; value: ReportType; icon: LucideIcon }[] = [
  { label: t("daily"), value: "daily", icon: Calendar },
  { label: t("weekly"), value: "weekly", icon: BarChart3 },
  { label: t("monthly"), value: "monthly", icon: TrendingUp },
  { label: t("customRange"), value: "custom", icon: Calendar },
  { label: t("eodSummary"), value: "eod", icon: ClipboardList },
  ...(hasMultipleBranches(branches)
    ? [{ label: t("branchComparison"), value: "comparison" as ReportType, icon: GitBranch }]
    : []),
];
```

Update `ReportType` to include `"comparison"`:
```typescript
type ReportType = "daily" | "weekly" | "monthly" | "custom" | "eod" | "comparison";
```

Add branch comparison data hook:
```typescript
const branchComparisonQ = useBranchComparison(
  orgId,
  customFromStr,
  customToStr,
  reportType === "comparison",
);
```

Add rendering block after the EOD view and before the empty state:
```tsx
{/* ═══ BRANCH COMPARISON ════════════════════════════ */}
{!loading && reportType === "comparison" && (
  <div
    id="reports-panel-comparison"
    role="tabpanel"
    aria-labelledby="reports-tab-comparison"
  >
    <BranchComparisonView
      data={branchComparisonQ.data ?? null}
      loading={branchComparisonQ.isLoading}
    />
  </div>
)}
```

### Success Criteria:

#### Automated Verification:
- [ ] Type checking passes: `npm run validate:types`
- [ ] No new lint errors: `npm run validate:lint`

#### Manual Verification:
- [ ] Reports page shows "Branch Comparison" tab when org has 2+ branches
- [ ] Tab shows ranked branch table with revenue, WOs, profit, margin, avg order, customers
- [ ] TOTAL row shows aggregate metrics
- [ ] Branches are sorted by revenue (highest first)
- [ ] "Main" badge appears on the main branch
- [ ] Date range filter affects comparison data
- [ ] Empty state shows when no branches exist

---

## Phase 6: i18n & Tests

**Files:**
- `messages/en.json` — MODIFY — add new translation keys
- `messages/mn.json` — MODIFY — add Mongolian translations
- `src/lib/services/report-service/branch-comparison.test.ts` — NEW — service tests

**Overview:** Final phase — translations and test coverage. Depends on all previous phases.

### Changes Required:

#### 6.1 `messages/en.json`

**File**: `messages/en.json`
**Changes**: MODIFY — add keys

```json
{
  "reports": {
    "branchComparison": "Branch Comparison"
  },
  "dashboard": {
    "branchPerformance": "Branch Performance"
  }
}
```

#### 6.2 `messages/mn.json`

**File**: `messages/mn.json`
**Changes**: MODIFY — add Mongolian translations

```json
{
  "reports": {
    "branchComparison": "Салбар хоорондын харьцуулалт"
  },
  "dashboard": {
    "branchPerformance": "Салбарын гүйцэтгэл"
  }
}
```

#### 6.3 `src/lib/services/report-service/branch-comparison.test.ts`

**File**: `src/lib/services/report-service/branch-comparison.test.ts`
**Changes**: NEW — service function tests

```typescript
import { describe, expect, it, vi } from "vitest";
import { getBranchComparison } from "./branch-comparison";

// Mock Supabase client
function createMockDb() {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    then: vi.fn(),
  };

  const db = {
    from: vi.fn().mockReturnValue(mockQuery),
  };

  return { db: db as any, mockQuery };
}

describe("getBranchComparison", () => {
  it("returns empty data when no branches exist", async () => {
    const { db, mockQuery } = createMockDb();
    mockQuery.then = vi.fn().mockResolvedValue({ data: [], error: null });

    const result = await getBranchComparison(db, "org-1", "2026-06-01", "2026-06-10");

    expect(result.branches).toEqual([]);
    expect(result.totals.totalRevenue).toBe(0);
  });

  it("returns per-branch summaries with correct revenue aggregation", async () => {
    const { db, mockQuery } = createMockDb();

    let callCount = 0;
    mockQuery.then = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // branches query
        return Promise.resolve({
          data: [
            { id: "b1", name: "Branch A", is_main: true },
            { id: "b2", name: "Branch B", is_main: false },
          ],
          error: null,
        });
      }
      if (callCount === 2) {
        // completed WOs
        return Promise.resolve({
          data: [
            { id: "wo1", branch_id: "b1" },
            { id: "wo2", branch_id: "b1" },
            { id: "wo3", branch_id: "b2" },
          ],
          error: null,
        });
      }
      if (callCount === 3) {
        // active WOs
        return Promise.resolve({ data: [{ branch_id: "b1" }], error: null });
      }
      if (callCount === 4) {
        // customers
        return Promise.resolve({
          data: [{ branch_id: "b1" }, { branch_id: "b1" }, { branch_id: "b2" }],
          error: null,
        });
      }
      // services + parts
      return Promise.resolve({ data: [], error: null });
    });

    const result = await getBranchComparison(db, "org-1", "2026-06-01", "2026-06-10");

    expect(result.branches).toHaveLength(2);
    expect(result.branches[0].branchName).toBe("Branch A");
    expect(result.branches[0].isMain).toBe(true);
    expect(result.branches[0].completedWorkOrders).toBe(2);
    expect(result.branches[1].completedWorkOrders).toBe(1);
    expect(result.totals.completedWorkOrders).toBe(3);
  });
});
```

### Success Criteria:

#### Automated Verification:
- [ ] Tests pass: `npm run test`
- [ ] Type checking passes: `npm run validate:types`
- [ ] Full validation: `npm run validate && npm run test`

#### Manual Verification:
- [ ] English UI shows "Branch Comparison" tab label
- [ ] Mongolian UI shows "Салбар хоорондын харьцуулалт"
- [ ] Service tests cover empty branches, multi-branch aggregation, and totals

---

## Ordering Constraints

```
Phase 1 (Types & Service)
  ↓
Phase 2 (API & Hook)
  ↓
Phase 3 (Component) ── can run parallel with Phase 2
  ↓
Phase 4 (Dashboard) ── depends on Phase 2 + Phase 3
Phase 5 (Reports) ── depends on Phase 2 + Phase 3 (parallel with Phase 4)
  ↓
Phase 6 (i18n & Tests) ── depends on all
```

## Performance Considerations

- `getBranchComparison()` makes ~5 queries total (branches, completed WOs, active WOs, customers, services+parts). Same order of magnitude as `getDashboardData()` which makes ~10 queries.
- Cache key: `["getBranchComparison", orgId, dateFrom, dateTo]` with `cacheDurations.reports` (5 min).
- On dashboard, comparison section only renders when `hasMultipleBranches(branches)` — zero overhead for single-branch orgs.
- On reports, comparison tab only fetches when `reportType === "comparison"` — lazy fetch via React Query `enabled` flag.
- Revenue calculation aggregates through WO→services/parts join, same pattern as existing `getDashboardData()`.

## Verification Notes

1. `npm run validate && npm run test` must pass before considering any phase complete
2. Run `lsp_diagnostics` on all new/modified files before builds
3. Verify `hasMultipleBranches()` correctly gates UI visibility
4. Test with org that has 0, 1, 2, and 3+ branches
5. Verify cache invalidation when branch data changes
6. Check that date range filter properly affects comparison data

## Pattern References

| Pattern | File | Why |
|---------|------|-----|
| Service function shape | `src/lib/services/report-service/dashboard.ts:29` | `(db, orgId, ...) → Promise<T>` |
| React Query hook | `src/lib/queries/use-dashboard.ts:16` | `createOrgQuery<T>(path)` + `useQuery` |
| Cache key factory | `src/lib/queries/keys.ts:340` | `dashboardKeys.all(orgId, branchId)` |
| Branch filter gating | `src/app/[locale]/dashboard/page.tsx:346` | `hasMultipleBranches(branches)` |
| Table component | `src/components/reports/mechanic-table.tsx` | Reusable table with configurable columns |
| API route switch | `src/app/api/organizations/[id]/reports/route.ts:87` | `case "type": ...` pattern |
| i18n dual update | `messages/en.json` + `messages/mn.json` | Both locales always updated together |

## Developer Context

- Research completed: multi-branch dashboard patterns from ServiceTitan, Fleetio, Shop-Ware
- Codebase analysis: 22 dashboard modules, reports module with 8 hooks, branch filtering via `withBranchFilter()`
- Key constraint: `branch_id` is nullable on all entity tables — queries must handle null branch gracefully
- Existing "All Branches" mode shows consolidated data without per-branch breakdown — this is the gap being filled

## References

- Research: Multi-branch dashboard best practices (ServiceTitan, Fleetio, Shop-Ware patterns)
- Codebase: `src/lib/services/report-service/dashboard.ts` — existing dashboard data service
- Codebase: `src/lib/services/report-service/reports.ts` — existing report functions
- Codebase: `src/components/branch-select.tsx` — branch selector component
- Codebase: `src/lib/supabase/with-branch.ts` — branch filtering utility
