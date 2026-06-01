/**
 * MechanicTable — Per-mechanic KPI breakdown table with export.
 */

import { ExportButton } from "@/components/export-button";
import { DeltaIndicator } from "@/components/reports/delta-indicator";
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
import type { ExportColumn } from "@/lib/export";
import type { ReportComparison, ReportMechanicKpi } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface MechanicTableProps {
  kpis: ReportMechanicKpi[];
  exportCols: ExportColumn<ReportMechanicKpi>[];
  exportFile: string;
  /** Optional comparison data for the "Change" column */
  comparison?: ReportComparison | null;
}

export function MechanicTable({
  kpis,
  exportCols,
  exportFile,
  comparison,
}: MechanicTableProps) {
  if (!kpis.length) return null;

  const totalPrevRevenue = comparison?.total_revenue ?? null;
  const totalCurRevenue = kpis.reduce((s, m) => s + m.total_revenue, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-semibold">
          Per-Mechanic Breakdown
        </CardTitle>
        <ExportButton
          data={kpis}
          columns={exportCols}
          filename={exportFile}
          sheetName="Mechanics"
        />
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                Mechanic
              </TableHead>
              <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                Jobs
              </TableHead>
              <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                Services
              </TableHead>
              <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                Parts
              </TableHead>
              <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                Revenue
              </TableHead>
              <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                Avg/WO
              </TableHead>
              {comparison && (
                <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                  vs Prev
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {kpis.map((m, i) => {
              const mechPct =
                totalCurRevenue > 0 ? m.total_revenue / totalCurRevenue : 0;
              const mechPrevRevenue =
                totalPrevRevenue != null
                  ? Math.round(totalPrevRevenue * mechPct * 100) / 100
                  : null;
              const mechRevenueDelta =
                mechPrevRevenue != null && mechPrevRevenue > 0
                  ? Math.round(
                      ((m.total_revenue - mechPrevRevenue) / mechPrevRevenue) *
                        1000,
                    ) / 10
                  : null;

              return (
                <TableRow
                  key={m.mechanic_id}
                  className={`border-b border-border hover:bg-muted/30 ${i === 0 ? "bg-muted/10" : ""}`}
                >
                  <TableCell className="px-4 py-3 font-medium">
                    {m.mechanic_name}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right tabular-nums">
                    {m.work_orders_completed}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right tabular-nums">
                    {m.services_count}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right tabular-nums">
                    {m.parts_count}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-medium tabular-nums">
                    {formatCurrency(m.total_revenue)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {formatCurrency(m.avg_revenue_per_wo)}
                  </TableCell>
                  {comparison && (
                    <TableCell className="px-4 py-3 text-right tabular-nums">
                      {mechRevenueDelta != null ? (
                        <DeltaIndicator value={mechRevenueDelta} showPercent />
                      ) : (
                        <span className="text-muted-foreground">&mdash;</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-muted/30 font-semibold">
              <TableCell className="px-4 py-3">Total</TableCell>
              <TableCell className="px-4 py-3 text-right tabular-nums">
                {kpis.reduce((s, m) => s + m.work_orders_completed, 0)}
              </TableCell>
              <TableCell className="px-4 py-3 text-right tabular-nums">
                {kpis.reduce((s, m) => s + m.services_count, 0)}
              </TableCell>
              <TableCell className="px-4 py-3 text-right tabular-nums">
                {kpis.reduce((s, m) => s + m.parts_count, 0)}
              </TableCell>
              <TableCell className="px-4 py-3 text-right tabular-nums">
                {formatCurrency(totalCurRevenue)}
              </TableCell>
              <TableCell className="px-4 py-3" />
              {comparison && (
                <TableCell className="px-4 py-3 text-right tabular-nums">
                  {comparison.revenue_change_pct != null ? (
                    <DeltaIndicator
                      value={comparison.revenue_change_pct}
                      showPercent
                    />
                  ) : (
                    <span className="text-muted-foreground">&mdash;</span>
                  )}
                </TableCell>
              )}
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
