"use client";

import { AlertTriangle, PackagePlus, ShoppingCart } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { Link } from "@/lib/i18n/navigation";
import {
  useInventoryBalances,
  useStockThresholds,
} from "@/lib/queries/use-inventory";

interface LowStockCardProps {
  orgId: string;
}

export function LowStockCard({ orgId }: LowStockCardProps) {
  const { data: balances = [], isPending: balancesLoading } =
    useInventoryBalances(orgId);
  const { data: thresholds = [], isPending: thresholdsLoading } =
    useStockThresholds(orgId);

  const alerts = useMemo(() => {
    const thresholdMap = new Map<string, number>();
    for (const th of thresholds) {
      thresholdMap.set(th.part_id, th.minimum_quantity);
    }

    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const b of balances) {
      const min = thresholdMap.get(b.part_id ?? "") ?? 5; // default threshold
      const qty = b.quantity_on_hand ?? 0;
      if (qty <= 0) {
        outOfStockCount++;
      } else if (qty < min) {
        lowStockCount++;
      }
    }

    return {
      lowStockCount,
      outOfStockCount,
      total: lowStockCount + outOfStockCount,
    };
  }, [balances, thresholds]);

  const isPending = balancesLoading || thresholdsLoading;

  if (isPending) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-12" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.total === 0) return null;

  return (
    <Card className="border-amber-200/50 bg-amber-50/30 dark:border-amber-800/30 dark:bg-amber-950/10">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-500" />
            <div>
              <Typography.Text className="text-sm font-medium">
                {alerts.outOfStockCount > 0
                  ? `${alerts.outOfStockCount} out of stock`
                  : `${alerts.lowStockCount} items running low`}
              </Typography.Text>
              <Typography.Muted className="text-xs text-muted-foreground mt-0.5">
                {alerts.outOfStockCount > 0
                  ? `${alerts.lowStockCount} more below threshold · Restock soon`
                  : `Below minimum stock level · Restock soon`}
              </Typography.Muted>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              render={<Link href="/dashboard/inventory/alerts" />}
              variant="outline"
              size="sm"
            >
              <PackagePlus className="size-3.5" />
              View
            </Button>
            <Button
              render={<Link href="/dashboard/inventory/purchase-orders/new" />}
              variant="default"
              size="sm"
            >
              <ShoppingCart className="size-3.5" />
              Order
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
