"use client";

import { useTranslations } from "next-intl";
import type { useRouter } from "@/lib/i18n/navigation";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMNT } from "@/lib/utils";
import type { WorkOrderStatus } from "@/lib/types";
import { Typography } from "@/components/ui/typography";

interface WorkOrderSummary {
  id: string;
  status: WorkOrderStatus;
  description: string | null;
  complaint: string | null;
  total: number;
  created_at: string;
  vehicles?: { plate_number: string; make: string; model: string } | null;
}

interface Props {
  workOrders: WorkOrderSummary[];
  router: ReturnType<typeof useRouter>;
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

export function CustomerWorkOrderHistory({ workOrders, router }: Props) {
  const t = useTranslations("vehicles");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {t("serviceHistory")} ({workOrders.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {workOrders.length === 0 ? (
          <Typography.Muted className="py-6 text-center text-sm text-muted-foreground">
            {t("noServiceHistory")}
          </Typography.Muted>
        ) : (
          <div className="flex flex-col gap-3">
            {workOrders.map((workOrder) => (
              <Button
                key={workOrder.id}
                onClick={() =>
                  router.push(`/dashboard/work-orders/${workOrder.id}`)
                }
                variant="ghost"
                className="w-full justify-start rounded-lg bg-muted/50 p-4"
              >
                <div className="flex items-start justify-between gap-4 w-full">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={workOrder.status} />
                      <span className="text-sm text-muted-foreground">
                        {formatDate(workOrder.created_at)}
                      </span>
                    </div>
                    {workOrder.vehicles && (
                      <Typography.Muted className="text-xs text-muted-foreground">
                        {workOrder.vehicles.plate_number}
                        {workOrder.vehicles.make && workOrder.vehicles.model
                          ? ` · ${workOrder.vehicles.make} ${workOrder.vehicles.model}`
                          : ""}
                      </Typography.Muted>
                    )}
                    <Typography.Text className="text-sm font-medium">
                      {workOrder.complaint ||
                        workOrder.description ||
                        "General service"}
                    </Typography.Text>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatMNT(Number(workOrder.total))}
                    </span>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
