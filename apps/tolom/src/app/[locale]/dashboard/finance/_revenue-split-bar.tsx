"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

interface RevenueSplitBarProps {
  total: number;
  service: number;
  parts: number;
  loading?: boolean;
}

export function RevenueSplitBar({
  total,
  service,
  parts,
  loading,
}: RevenueSplitBarProps) {
  const t = useTranslations("finance");

  if (loading) return <Skeleton className="h-16 w-full rounded-xl" />;
  if (total === 0) return null;

  const svcPct = Math.round((service / total) * 100);
  const prtPct = Math.round((parts / total) * 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">
          {t("revenueBreakdown")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="bg-blue-500 transition-[width] duration-500 ease-out-quart"
            style={{ width: `${svcPct}%` }}
            title={`${t("dashboard.serviceRevenue")}: ${svcPct}%`}
          />
          <div
            className="bg-amber-500 transition-[width] duration-500 ease-out-quart"
            style={{ width: `${prtPct}%` }}
            title={`${t("dashboard.partsRevenue")}: ${prtPct}%`}
          />
        </div>
        <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">
              {t("dashboard.serviceRevenue")}
            </span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(service)}
            </span>
            <span className="text-xs text-muted-foreground">({svcPct}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">
              {t("dashboard.partsRevenue")}
            </span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(parts)}
            </span>
            <span className="text-xs text-muted-foreground">({prtPct}%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
