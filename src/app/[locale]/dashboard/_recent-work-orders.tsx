"use client";

import { Badge } from "@/components/ui/badge";
import { useClientNow } from "@/hooks/use-client-now";
import { ExportButton } from "@/components/export-button";
import { Card, CardContent } from "@/components/ui/card";
import type { ExportColumn } from "@/lib/export";
import type { DashboardData, WorkOrderDetail } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export const WO_STATUS_STYLES: Record<
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

export function RecentWorkOrdersTable({
  workOrders,
  router,
  t,
  workOrdersForExport,
}: {
  workOrders: DashboardData["recentWorkOrders"];
  router: { push: (url: string) => void };
  t: (key: string) => string;
  workOrdersForExport: ExportColumn<WorkOrderDetail>[];
}) {
  const now = useClientNow();
  return (
    <div className="flex flex-col gap-2">
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-5 py-2 text-left font-medium text-muted-foreground">
                    {t("workOrders.id")}
                  </th>
                  <th className="px-5 py-2 text-left font-medium text-muted-foreground">
                    {t("workOrders.customer")}
                  </th>
                  <th className="px-5 py-2 text-left font-medium text-muted-foreground">
                    {t("workOrders.vehicle")}
                  </th>
                  <th className="px-5 py-2 text-left font-medium text-muted-foreground">
                    {t("workOrders.status")}
                  </th>
                  <th className="px-5 py-2 text-right font-medium text-muted-foreground">
                    {t("workOrders.total")}
                  </th>
                  <th className="px-5 py-2 text-right font-medium text-muted-foreground">
                    {t("workOrders.date")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {!workOrders || workOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-8 text-center text-muted-foreground"
                    >
                      {t("dashboard.noWorkOrders")}
                    </td>
                  </tr>
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
                      <tr
                        key={wo.id}
                        className="border-b border-border transition-colors hover:bg-muted/30 cursor-pointer"
                        onClick={() =>
                          router.push(`/dashboard/work-orders/${wo.id}`)
                        }
                      >
                        <td className="px-5 py-2 font-mono text-xs">
                          {wo.id.slice(0, 8)}...
                        </td>
                        <td className="px-5 py-2">
                          {wo.customer
                            ? `${wo.customer.first_name} ${wo.customer.last_name ?? ""}`.trim()
                            : "\u2014"}
                        </td>
                        <td className="px-5 py-2 text-muted-foreground">
                          {wo.vehicle?.plate_number ?? "\u2014"}
                        </td>
                        <td className="px-5 py-2">
                          <Badge variant="outline" className="gap-1.5">
                            <span
                              className={`size-1.5 rounded-full ${
                                WO_STATUS_STYLES[wo.status]?.dot ??
                                "bg-muted-foreground"
                              }`}
                            />
                            {wo.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-2 text-right font-medium tabular-nums">
                          {formatCurrency(grandTotal)}
                        </td>
                        <td className="px-5 py-2 text-right text-muted-foreground">
                          {formatDate(wo.created_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <ExportButton
          data={workOrders}
          columns={workOrdersForExport}
          filename={`dashboard-recent-${now.toISOString().split("T")[0]}.xlsx`}
          sheetName="Recent Work Orders"
          title="Recent Work Orders"
          label={t("common.export")}
          buttonSize="xs"
          className="min-w-0 px-2"
        />
      </div>
    </div>
  );
}
