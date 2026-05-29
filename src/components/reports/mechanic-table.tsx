/**
 * MechanicTable — Per-mechanic KPI breakdown table with export.
 */
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
import { ExportButton } from "@/components/export-button";
import type { ExportColumn } from "@/lib/export";
import { formatCurrency } from "@/lib/utils";
import type { ReportMechanicKpi } from "@/lib/types";

interface MechanicTableProps {
  kpis: ReportMechanicKpi[];
  exportCols: ExportColumn<ReportMechanicKpi>[];
  exportFile: string;
}

export function MechanicTable({
  kpis,
  exportCols,
  exportFile,
}: MechanicTableProps) {
  if (!kpis.length) return null;

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {kpis.map((m, i) => (
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
              </TableRow>
            ))}
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
                {formatCurrency(kpis.reduce((s, m) => s + m.total_revenue, 0))}
              </TableCell>
              <TableCell className="px-4 py-3" />
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
