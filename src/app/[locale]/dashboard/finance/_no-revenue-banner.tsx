"use client";

import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface NoRevenueBannerProps {
  activeWorkOrders: number;
}

export function NoRevenueBanner({ activeWorkOrders }: NoRevenueBannerProps) {
  return (
    <Card className="border-amber-200/50 bg-amber-50/30 dark:border-amber-800/30 dark:bg-amber-950/10">
      <CardContent className="flex items-start gap-3 py-4">
        <TrendingUp className="mt-0.5 size-5 shrink-0 text-amber-500" />
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {activeWorkOrders} work order{activeWorkOrders === 1 ? "" : "s"} in
            progress.
          </span>{" "}
          Revenue appears here once work orders are marked{" "}
          <strong>Completed</strong>; close out jobs to see financial metrics,
          service mix, and breakdown.
        </div>
      </CardContent>
    </Card>
  );
}
