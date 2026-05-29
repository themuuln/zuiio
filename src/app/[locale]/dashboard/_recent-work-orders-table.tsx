"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useClientNow } from "@/hooks/use-client-now";
import { ExportButton } from "@/components/export-button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ExportColumn } from "@/lib/export";
import type { DashboardData, WorkOrderDetail } from "@/lib/types";
import { formatMNT } from "@/lib/utils";

const WO_STATUS_STYLES: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  Completed: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  Cancelled: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  "In Progress": {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  Diagnosing: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    dot: "bg-yellow-500",
  },
  New: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  "Ready for Pickup": {
    bg: "bg-green-50",
    text: "text-green-700",
    dot: "bg-green-500",
  },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function RecentWorkOrdersTable({
  workOrders,
  router,
  t,
  workOrdersForExport,
}: {
  workOrders: DashboardData["recentWorkOrders"];
  router: ReturnType<typeof useRouter>;
  t: ReturnType<typeof useTranslations>;
  workOrdersForExport: ExportColumn<WorkOrderDetail>[];
}) {
  const { push } = router;
  const now = useClientNow();

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardAction>
          <ExportButton
            data={workOrders}
            columns={workOrdersForExport}
            filename={`dashboard-recent-${now.toISOString().split("T")[0]}.xlsx`}
            sheetName="Recent Work Orders"
            title={t("dashboard.recentWorkOrders")}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                  {t("workOrders.id")}
                </TableHead>
                <TableHead className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                  {t("workOrders.customer")}
                </TableHead>
                <TableHead className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                  {t("workOrders.vehicle")}
                </TableHead>
                <TableHead className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                  {t("workOrders.status")}
                </TableHead>
                <TableHead className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                  {t("workOrders.total")}
                </TableHead>
                <TableHead className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                  {t("workOrders.date")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-5 py-16 text-center text-muted-foreground"
                  >
                    {t("dashboard.noWorkOrders")}
                  </TableCell>
                </TableRow>
              ) : (
                workOrders.map((wo) => {
                  const grandTotal =
                    (wo.services ?? []).reduce(
                      (sum: number, s: { final_price: number }) =>
                        sum + Number(s.final_price),
                      0,
                    ) +
                    (wo.parts ?? []).reduce(
                      (sum: number, p: { final_price: number }) =>
                        sum + Number(p.final_price),
                      0,
                    );

                  return (
                    <TableRow
                      key={wo.id}
                      className="border-b border-border transition-colors hover:bg-muted/30 cursor-pointer"
                      onClick={() => push(`/dashboard/work-orders/${wo.id}`)}
                    >
                      <TableCell className="px-5 py-3.5 font-mono text-xs">
                        {wo.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="px-5 py-3.5">
                        {wo.customer
                          ? `${wo.customer.first_name} ${wo.customer.last_name ?? ""}`.trim()
                          : "\u2014"}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-muted-foreground">
                        {wo.vehicle?.plate_number ?? "\u2014"}
                      </TableCell>
                      <TableCell className="px-5 py-3.5">
                        <Badge variant="outline" className="gap-1.5">
                          <span
                            className={`size-1.5 rounded-full ${
                              WO_STATUS_STYLES[wo.status]?.dot ??
                              "bg-muted-foreground"
                            }`}
                          />
                          {wo.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-right font-medium tabular-nums">
                        {formatMNT(grandTotal)}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-right text-muted-foreground">
                        {formatDate(wo.created_at)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
