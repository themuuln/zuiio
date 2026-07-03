"use client";

import { BarChart3, CheckCircle2, Trophy, Wallet } from "lucide-react";
import { ExportButton } from "@/components/export-button";
import { ReportKpiCard } from "@/components/reports";
import { Button } from "@/components/ui/button";
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
import { formatCurrency } from "@/lib/utils";
import type { EodReport } from "./_helpers";

export function EodView({
  data,
  t,
}: {
  data: EodReport;
  t: (key: string) => string;
}) {
  const bestMechanic =
    data.mechanics.length > 0
      ? data.mechanics.reduce((a, b) =>
          a.total_revenue > b.total_revenue ? a : b,
        )
      : null;

  const avgRevenuePerWo =
    data.total_work_orders > 0
      ? Math.round(data.total_revenue / data.total_work_orders)
      : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportKpiCard
          label={t("totalRevenueLabel")}
          value={formatCurrency(data.total_revenue)}
          icon={Wallet}
          subtitle={`${data.mechanics.length} ${t("mechanic")}`}
          cls="text-emerald-600 dark:text-emerald-400"
        />
        <ReportKpiCard
          label={t("totalWorkOrders")}
          value={String(data.total_work_orders)}
          icon={CheckCircle2}
          cls="text-blue-600 dark:text-blue-400"
          subtitle={`${t("avgRevenuePerWo")}: ${formatCurrency(avgRevenuePerWo)}`}
        />
        <ReportKpiCard
          label={t("commission")}
          value={formatCurrency(data.total_commission ?? 0)}
          icon={BarChart3}
          subtitle={`${t("avgRevenuePerWo")}: ${formatCurrency(Math.round((data.total_commission ?? 0) / Math.max(data.total_work_orders, 1)))}`}
        />
        <ReportKpiCard
          label={bestMechanic ? bestMechanic.mechanic_name : t("bestMechanic")}
          value={
            bestMechanic
              ? formatCurrency(bestMechanic.total_revenue)
              : formatCurrency(0)
          }
          icon={Trophy}
          cls="text-amber-600 dark:text-amber-400"
          subtitle={
            bestMechanic
              ? `${bestMechanic.work_orders_completed} ${t("jobs")}`
              : undefined
          }
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold">
            {t("perMechanicBreakdown")}
          </CardTitle>
          <ExportButton
            data={data.mechanics}
            columns={[
              { key: "mechanic_name", label: t("mechanic") },
              { key: "work_orders_completed", label: t("jobs") },
              { key: "services_performed", label: t("services") },
              { key: "parts_used", label: t("parts") },
              {
                key: "total_revenue",
                label: t("revenue"),
                format: "currency" as const,
              },
              {
                key: "total_commission",
                label: t("commission"),
                format: "currency" as const,
              },
            ]}
            filename={`eod-${data.date}.xlsx`}
            sheetName={t("eodSheet")}
          />
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {t("mechanic")}
                </TableHead>
                <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                  {t("jobs")}
                </TableHead>
                <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                  {t("services")}
                </TableHead>
                <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                  {t("parts")}
                </TableHead>
                <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                  {t("revenue")}
                </TableHead>
                <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                  {t("commission")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.mechanics.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {t("noMechanicsCompletedWork")}
                  </TableCell>
                </TableRow>
              ) : (
                data.mechanics.map((m, i) => (
                  <TableRow
                    key={m.mechanic_id}
                    className={`border-b border-border hover:bg-muted/30 ${i === 0 ? "bg-muted/10" : ""} ${bestMechanic && m.mechanic_id === bestMechanic.mechanic_id ? "bg-amber-50/30 dark:bg-amber-950/10" : ""}`}
                  >
                    <TableCell className="px-4 py-3 font-medium">
                      {bestMechanic &&
                      m.mechanic_id === bestMechanic.mechanic_id ? (
                        <span className="inline-flex items-center gap-1.5">
                          {m.mechanic_name}
                          <Trophy
                            className="size-3.5 text-amber-500"
                            aria-hidden="true"
                          />
                        </span>
                      ) : (
                        m.mechanic_name
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums">
                      {m.work_orders_completed}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums">
                      {m.services_performed ?? 0}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums">
                      {m.parts_used ?? 0}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatCurrency(m.total_revenue)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums">
                      {m.total_commission != null ? (
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(m.total_commission)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">&mdash;</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {data.mechanics.length > 0 && (
              <TableFooter>
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell className="px-4 py-3">{t("total")}</TableCell>
                  <TableCell className="px-4 py-3 text-right tabular-nums">
                    {data.mechanics.reduce(
                      (s, m) => s + m.work_orders_completed,
                      0,
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right tabular-nums">
                    {data.mechanics.reduce(
                      (s, m) => s + (m.services_performed ?? 0),
                      0,
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right tabular-nums">
                    {data.mechanics.reduce(
                      (s, m) => s + (m.parts_used ?? 0),
                      0,
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(data.total_revenue)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(data.total_commission ?? 0)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
