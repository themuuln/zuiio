"use client";

import { AlertTriangle, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { Link } from "@/lib/i18n/navigation";
import {
  useInventoryBalances,
  useStockThresholds,
} from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useSelectedBranchId } from "@/lib/stores";

export default function AlertsPage() {
  const t = useTranslations("inventory");
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;
  const selectedBranchId = useSelectedBranchId();
  const branchFilter = selectedBranchId === "all" ? null : selectedBranchId;
  const { data: balances = [], isPending: balancesLoading } =
    useInventoryBalances(orgId, branchFilter);
  const { data: thresholds = [], isPending: thresholdsLoading } =
    useStockThresholds(orgId, branchFilter);

  const alerts = useMemo(() => {
    const thresholdMap = new Map<string, number>();
    for (const th of thresholds) {
      thresholdMap.set(th.part_id, th.minimum_quantity);
    }

    const result: Array<
      { min: number; shortage: number } & (typeof balances)[number]
    > = [];
    for (const b of balances) {
      const min = thresholdMap.get(b.part_id ?? "") ?? 0;
      const shortage = Math.max(0, min - (b.quantity_on_hand ?? 0));
      if (shortage > 0) {
        result.push({ ...b, min, shortage });
      }
    }
    return result.sort((a, b) => b.shortage - a.shortage);
  }, [balances, thresholds]);

  const isPending = balancesLoading || thresholdsLoading;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Typography.H1 className="text-2xl font-semibold tracking-tight">
          {t("alertsTitle")}
        </Typography.H1>
        <Typography.Muted className="text-muted-foreground">
          {t("alertsSubtitle")}
        </Typography.Muted>
      </div>

      <Card>
        <CardContent className="p-0">
          {isPending ? (
            <div className="divide-y divide-border">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="flex items-center gap-4 p-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <AlertTriangle />
                </EmptyMedia>
                <EmptyTitle>{t("noAlerts")}</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="divide-y divide-border">
              {alerts.map((a) => (
                <div
                  key={a.part_id}
                  className="flex items-center gap-4 p-4 min-h-[64px]"
                >
                  <AlertTriangle className="size-5 text-destructive shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Typography.Text className="font-medium text-sm truncate">
                      {a.part_name}
                    </Typography.Text>
                    <Typography.Muted className="text-xs text-muted-foreground">
                      {a.category ?? "—"} · {a.part_number ?? "—"}
                    </Typography.Muted>
                  </div>
                  <span className="text-sm tabular-nums">
                    {a.quantity_on_hand} / {a.min} {a.unit}
                  </span>
                  <span className="text-sm font-semibold text-destructive tabular-nums shrink-0">
                    -{a.shortage}
                  </span>
                  <Link
                    href="/dashboard/inventory/purchase-orders/new"
                    className="shrink-0"
                  >
                    <Button size="sm" variant="outline">
                      <Plus className="size-3" /> {t("createPO")}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
