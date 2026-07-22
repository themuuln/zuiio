import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiSparkline, type SparklineProps } from "./_kpi-sparkline";

export const KPI_ACCENTS: Record<
  string,
  { card: string; icon: string; iconBg: string }
> = {
  totalRevenue: {
    card: "bg-emerald-50/60 border-emerald-200 text-emerald-700 dark:bg-emerald-950/15 dark:border-emerald-800/30 dark:text-emerald-300",
    icon: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-100/80 dark:bg-emerald-900/40",
  },
  activeWorkOrders: {
    card: "bg-amber-50/60 border-amber-200 text-amber-700 dark:bg-amber-950/15 dark:border-amber-800/30 dark:text-amber-300",
    icon: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-100/80 dark:bg-amber-900/40",
  },
  avgRepairOrder: {
    card: "bg-blue-50/60 border-blue-200 text-blue-700 dark:bg-blue-950/15 dark:border-blue-800/30 dark:text-blue-300",
    icon: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-100/80 dark:bg-blue-900/40",
  },
  totalCustomers: {
    card: "bg-sky-50/60 border-sky-200 text-sky-700 dark:bg-sky-950/15 dark:border-sky-800/30 dark:text-sky-300",
    icon: "text-sky-600 dark:text-sky-400",
    iconBg: "bg-sky-100/80 dark:bg-sky-900/40",
  },
  serviceRevenue: {
    card: "bg-sky-50/60 border-sky-200 text-sky-700 dark:bg-sky-950/15 dark:border-sky-800/30 dark:text-sky-300",
    icon: "text-sky-600 dark:text-sky-400",
    iconBg: "bg-sky-100/80 dark:bg-sky-900/40",
  },
  partsRevenue: {
    card: "bg-orange-50/60 border-orange-200 text-orange-700 dark:bg-orange-950/15 dark:border-orange-800/30 dark:text-orange-300",
    icon: "text-orange-600 dark:text-orange-400",
    iconBg: "bg-orange-100/80 dark:bg-orange-900/40",
  },
  totalVehicles: {
    card: "bg-rose-50/60 border-rose-200 text-rose-700 dark:bg-rose-950/15 dark:border-rose-800/30 dark:text-rose-300",
    icon: "text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-100/80 dark:bg-rose-900/40",
  },
  serviceMix: {
    card: "bg-teal-50/60 border-teal-200 text-teal-700 dark:bg-teal-950/15 dark:border-teal-800/30 dark:text-teal-300",
    icon: "text-teal-600 dark:text-teal-400",
    iconBg: "bg-teal-100/80 dark:bg-teal-900/40",
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
  sparklineData,
  sparklineColor,
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
  sparklineData?: SparklineProps["data"];
  sparklineColor?: string;
}) {
  const accent = accentKey ? KPI_ACCENTS[accentKey] : undefined;
  const hasBottomContent = !!sparklineData;

  return (
    <Card
      className={`group relative flex flex-col overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
        accent?.card ?? ""
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-1.5 pt-3">
        <CardTitle className="text-xs font-medium text-inherit opacity-70">
          {label}
        </CardTitle>
        <div
          className={`flex size-7 items-center justify-center rounded-lg transition-colors ${
            accent?.iconBg ?? "bg-muted"
          }`}
        >
          <Icon
            className={`size-3.5 ${accent?.icon ?? "text-muted-foreground"}`}
            aria-hidden="true"
          />
        </div>
      </CardHeader>
      <CardContent className={hasBottomContent ? "pb-0.5" : undefined}>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="flex flex-col gap-0.5">
            <div className="text-3xl font-bold tracking-tight tabular-nums leading-none">
              {value}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {trend && (
                <div
                  className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                    trend.direction === "up"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : trend.direction === "down"
                        ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {trend.direction === "up" ? (
                    <ArrowUp className="size-2.5" />
                  ) : trend.direction === "down" ? (
                    <ArrowDown className="size-2.5" />
                  ) : null}
                  <span>{trend.value}</span>
                  {trend.percent && (
                    <span className="opacity-70">({trend.percent})</span>
                  )}
                </div>
              )}
              {comparisonLabel && !trend && (
                <span className="text-[10px] text-muted-foreground">
                  {comparisonLabel}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
      {sparklineData && !loading && (
        <div className="mt-auto px-1">
          <KpiSparkline
            data={sparklineData}
            color={sparklineColor ?? "var(--chart-1)"}
          />
        </div>
      )}
    </Card>
  );
});
