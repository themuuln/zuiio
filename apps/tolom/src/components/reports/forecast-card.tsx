/**
 * ForecastCard — Revenue projection based on current pace.
 *
 * Shows: projected revenue, days progress bar, daily run rate, on-track indicator.
 */
import { TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import type { ReportForecast } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { DeltaIndicator } from "./delta-indicator";

interface ForecastCardProps {
  forecast: ReportForecast | null;
  loading?: boolean;
}

export function ForecastCard({ forecast, loading }: ForecastCardProps) {
  const t = useTranslations("reports");

  if (loading) return <Skeleton className="h-[120px] rounded-xl" />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <TrendingUp
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
          {t("forecastTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {forecast ? (
          <>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-semibold tabular-nums">
                {formatCurrency(forecast.projected_revenue)}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("projected")}
              </span>
              {forecast.projected_change_pct !== null && (
                <DeltaIndicator value={forecast.projected_change_pct} />
              )}
            </div>

            <div>
              <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
                <span>
                  {t("daysElapsed", {
                    elapsed: String(forecast.days_elapsed),
                    total: String(forecast.total_days),
                  })}
                </span>
                <span>
                  {forecast.total_days > 0
                    ? Math.round(
                        (forecast.days_elapsed / forecast.total_days) * 100,
                      )
                    : 0}
                  %
                </span>
              </div>
              <Progress
                value={
                  forecast.total_days > 0
                    ? Math.round(
                        (forecast.days_elapsed / forecast.total_days) * 100,
                      )
                    : 0
                }
                className="h-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">
                  {t("dailyRunRate")}
                </span>
                <span className="block font-medium tabular-nums">
                  {formatCurrency(forecast.daily_run_rate)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">{t("current")}</span>
                <span className="block font-medium tabular-nums">
                  {formatCurrency(forecast.current_revenue)}
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
                  {forecast.on_track ? t("onTrack") : t("behindPace")} ·{" "}
                  {t("previousPeriod")}
                </div>
              )}
          </>
        ) : (
          <Typography.Muted className="py-6 text-center text-sm text-muted-foreground">
            {t("noDataForPeriod")}
          </Typography.Muted>
        )}
      </CardContent>
    </Card>
  );
}
