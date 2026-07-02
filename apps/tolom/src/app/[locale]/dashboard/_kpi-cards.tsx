import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";

export const KPI_ACCENTS: Record<
  string,
  { bar: string; icon: string; bg: string }
> = {
  totalRevenue: {
    bar: "bg-emerald-500",
    icon: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  activeWorkOrders: {
    bar: "bg-amber-500",
    icon: "text-amber-600",
    bg: "bg-amber-50",
  },
  avgRepairOrder: {
    bar: "bg-blue-500",
    icon: "text-blue-600",
    bg: "bg-blue-50",
  },
  totalCustomers: {
    bar: "bg-violet-500",
    icon: "text-violet-600",
    bg: "bg-violet-50",
  },
  serviceRevenue: {
    bar: "bg-sky-500",
    icon: "text-sky-600",
    bg: "bg-sky-50",
  },
  partsRevenue: {
    bar: "bg-orange-500",
    icon: "text-orange-600",
    bg: "bg-orange-50",
  },
  totalVehicles: {
    bar: "bg-rose-500",
    icon: "text-rose-600",
    bg: "bg-rose-50",
  },
  serviceMix: {
    bar: "bg-teal-500",
    icon: "text-teal-600",
    bg: "bg-teal-50",
  },
};

export const KpiCard = memo(function KpiCard({
  label,
  value,
  icon: Icon,
  loading,
  accentKey,
  trend,
  comparisonLabel,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  loading?: boolean;
  accentKey?: string;
  trend?: {
    direction: "up" | "down" | "neutral";
    value: string;
    percent?: string;
  } | null;
  comparisonLabel?: string;
}) {
  const accent = accentKey ? KPI_ACCENTS[accentKey] : undefined;

  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      {accent && (
        <div className={`absolute left-0 top-0 h-full w-1 ${accent.bar}`} />
      )}
      <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div
          className={`flex size-8 items-center justify-center rounded-lg aspect-square transition-colors ${
            accent?.bg ?? "bg-muted"
          }`}
        >
          <Icon
            className={`size-4 ${accent?.icon ?? "text-muted-foreground"}`}
            aria-hidden="true"
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-9 w-28" />
        ) : (
          <div className="flex items-end gap-2">
            <div className="text-3xl font-semibold tracking-tight tabular-nums">
              {value}
            </div>
            {trend && (
              <div
                className={`flex items-center gap-1 text-xs font-medium mb-1 ${
                  trend.direction === "up"
                    ? "text-emerald-600"
                    : trend.direction === "down"
                      ? "text-red-600"
                      : "text-muted-foreground"
                }`}
              >
                {trend.direction === "up" ? (
                  <ArrowUp className="size-3" />
                ) : trend.direction === "down" ? (
                  <ArrowDown className="size-3" />
                ) : null}
                <span>{trend.value}</span>
                {trend.percent && (
                  <span className="opacity-75">({trend.percent})</span>
                )}
              </div>
            )}
          </div>
        )}
        {comparisonLabel && (
          <Typography.Muted className="mt-0.5 text-xs text-muted-foreground">
            {comparisonLabel}
          </Typography.Muted>
        )}
      </CardContent>
    </Card>
  );
});
