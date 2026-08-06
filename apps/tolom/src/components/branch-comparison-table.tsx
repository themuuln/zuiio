/**
 * BranchComparisonTable — Cross-branch KPI comparison table.
 *
 * Reusable across dashboard and reports. Shows per-branch metrics
 * with performance bars, totals row, and configurable columns.
 */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BranchComparisonData, BranchKpiSummary } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────

interface BranchComparisonTableProps {
  data: BranchComparisonData | null;
  loading?: boolean;
  /** Which columns to show. Defaults to dashboard columns. */
  columns?: ColumnKey[];
  /** Card title override */
  title?: string;
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
  /** Key in totals object — maps to BranchComparisonData["totals"] */
  totalsKey: string;
}

// ── Column Registry ────────────────────────────────────────

const COLUMN_CONFIG: Record<ColumnKey, ColumnConfig> = {
  revenue: {
    label: "Revenue",
    format: "currency",
    getValue: (b) => b.totalRevenue,
    totalsKey: "totalRevenue",
  },
  workOrders: {
    label: "Completed WOs",
    format: "number",
    getValue: (b) => b.completedWorkOrders,
    totalsKey: "completedWorkOrders",
  },
  activeWorkOrders: {
    label: "Active WOs",
    format: "number",
    getValue: (b) => b.activeWorkOrders,
    totalsKey: "activeWorkOrders",
  },
  avgRepairOrder: {
    label: "Avg Repair Order",
    format: "currency",
    getValue: (b) => b.avgRepairOrderValue,
    totalsKey: "avgRepairOrderValue",
  },
  grossProfit: {
    label: "Gross Profit",
    format: "currency",
    getValue: (b) => b.grossProfit,
    totalsKey: "grossProfit",
  },
  margin: {
    label: "Margin",
    format: "percent",
    getValue: (b) => b.marginPercent,
    totalsKey: "marginPercent",
  },
  customers: {
    label: "Customers",
    format: "number",
    getValue: (b) => b.totalCustomers,
    totalsKey: "totalCustomers",
  },
  serviceMix: {
    label: "Service Mix",
    format: "percent",
    getValue: (b) => b.serviceMix,
    totalsKey: "serviceMix",
  },
};

const DASHBOARD_COLUMNS: ColumnKey[] = [
  "revenue",
  "workOrders",
  "activeWorkOrders",
  "avgRepairOrder",
];

const REPORT_COLUMNS: ColumnKey[] = [
  "revenue",
  "workOrders",
  "grossProfit",
  "margin",
  "avgRepairOrder",
  "customers",
];

// ── Helpers ────────────────────────────────────────────────

function formatValue(
  value: number,
  format: "currency" | "number" | "percent",
): string {
  switch (format) {
    case "currency":
      return formatCurrency(value);
    case "percent":
      return `${value}%`;
    default:
      return String(Math.round(value));
  }
}

function getBestValue(
  branches: BranchKpiSummary[],
  config: ColumnConfig,
): number {
  return Math.max(...branches.map((b) => config.getValue(b)));
}

// ── Performance Bar ────────────────────────────────────────

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
          className="h-full rounded-full bg-primary/60 transition-[width] duration-500 ease-out-quart"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">
        {formatValue(value, format)}
      </span>
    </div>
  );
}

// ── Loading Skeleton ───────────────────────────────────────

function TableSkeleton({ columns }: { columns: ColumnKey[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-44" />
      </CardHeader>
      <CardContent className="flex flex-col gap-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-24" />
            {columns.map((c) => (
              <Skeleton key={c} className="ml-auto h-4 w-16" />
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Main Component ─────────────────────────────────────────

export function BranchComparisonTable({
  data,
  loading = false,
  columns = DASHBOARD_COLUMNS,
  title = "Branch Performance",
}: BranchComparisonTableProps) {
  if (loading) {
    return <TableSkeleton columns={columns} />;
  }

  if (!data || data.branches.length === 0) return null;

  const configs = columns.map((key) => COLUMN_CONFIG[key]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
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
                  key={cfg.totalsKey}
                  className="px-4 py-3 text-right font-medium"
                >
                  {cfg.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.branches.map((branch) => {
              const bestRev = getBestValue(
                data.branches,
                COLUMN_CONFIG.revenue,
              );
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
                      key={cfg.totalsKey}
                      className="px-4 py-3 text-right"
                    >
                      {cfg.totalsKey === "totalRevenue" ? (
                        <PerformanceBar
                          value={cfg.getValue(branch)}
                          max={bestRev}
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
                const totalValue = (data.totals as Record<string, number>)[
                  cfg.totalsKey
                ];
                return (
                  <TableCell
                    key={cfg.totalsKey}
                    className="px-4 py-3 text-right tabular-nums"
                  >
                    {formatValue(totalValue ?? 0, cfg.format)}
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

// ── Named column presets for external use ──────────────────

export const BRANCH_TABLE_COLUMNS = {
  dashboard: DASHBOARD_COLUMNS,
  reports: REPORT_COLUMNS,
} as const;
