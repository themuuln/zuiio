/**
 * ForecastCard — Revenue projection based on current pace.
 *
 * Shows: projected revenue, days progress bar, daily run rate, on-track indicator.
 */
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReportForecast } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { DeltaIndicator } from "./delta-indicator";

function formatCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return formatCurrency(n);
}

interface ForecastCardProps {
  forecast: ReportForecast | null;
  loading?: boolean;
}

export function ForecastCard({ forecast, loading }: ForecastCardProps) {
  if (loading) return <Skeleton className="h-[120px] rounded-xl" />;
  if (!forecast) return null;

  const progressPct =
    forecast.total_days > 0
      ? Math.round((forecast.days_elapsed / forecast.total_days) * 100)
      : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <TrendingUp className="size-4 text-muted-foreground" />
          Revenue Forecast
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-semibold tabular-nums">
            {formatCompact(forecast.projected_revenue)}
          </span>
          <span className="text-xs text-muted-foreground">projected</span>
          {forecast.projected_change_pct !== null && (
            <DeltaIndicator value={forecast.projected_change_pct} />
          )}
        </div>

        <div>
          <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
            <span>
              {forecast.days_elapsed} of {forecast.total_days} days elapsed
            </span>
            <span>{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-1.5" />
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground">Daily run rate</span>
            <span className="block font-medium tabular-nums">
              {formatCompact(forecast.daily_run_rate)}/day
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Current</span>
            <span className="block font-medium tabular-nums">
              {formatCompact(forecast.current_revenue)}
            </span>
          </div>
        </div>

        {forecast.previous_period_revenue &&
          forecast.previous_period_revenue > 0 && (
            <div
              className={`text-xs font-medium ${
                forecast.on_track
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-500"
              }`}
            >
              {forecast.on_track ? "✓ On track" : "⚠ Behind pace"} vs previous
              period
            </div>
          )}
      </CardContent>
    </Card>
  );
}
