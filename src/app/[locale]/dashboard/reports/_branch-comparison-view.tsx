/**
 * BranchComparisonView — Enhanced branch comparison for reports.
 *
 * Shows ranked branch table with full profitability metrics,
 * sorted by revenue, with totals row.
 */
"use client";

import { BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import type { BranchComparisonData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface BranchComparisonViewProps {
  data: BranchComparisonData | null;
  loading?: boolean;
}

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
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-2 h-8 w-24" />
              </div>
            </Card>
          ))}
        </div>
        <Card>
          <div className="p-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="mb-2 h-10 w-full" />
            ))}
          </div>
        </Card>
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

  const sortedBranches = [...data.branches].sort(
    (a, b) => b.totalRevenue - a.totalRevenue,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Summary KPIs — totals across all branches */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="p-4">
            <Typography.Muted className="text-xs">
              Total Revenue
            </Typography.Muted>
            <Typography.H2 className="mt-1 text-2xl font-bold tabular-nums">
              {formatCurrency(data.totals.totalRevenue)}
            </Typography.H2>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <Typography.Muted className="text-xs">
              Total Work Orders
            </Typography.Muted>
            <Typography.H2 className="mt-1 text-2xl font-bold tabular-nums">
              {data.totals.completedWorkOrders}
            </Typography.H2>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <Typography.Muted className="text-xs">
              Gross Profit
            </Typography.Muted>
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
        <CardContent className="overflow-x-auto p-0">
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
              {sortedBranches.map((branch, index) => (
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
        </CardContent>
      </Card>
    </div>
  );
}
