/**
 * ServiceBreakdownChart — Horizontal bar chart of revenue by service type.
 *
 * Uses the shared BarChart wrapper from src/components/charts/.
 */

import { useTranslations } from "next-intl";
import { BarChart } from "@/components/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import type { ServiceBreakdown } from "@/lib/types";

interface ServiceBreakdownChartProps {
  data: ServiceBreakdown[];
  loading?: boolean;
}

export function ServiceBreakdownChart({
  data,
  loading,
}: ServiceBreakdownChartProps) {
  const t = useTranslations("reports");

  if (loading) return <Skeleton className="h-[220px] rounded-xl" />;

  const chartData = data.slice(0, 6).map((s) => ({
    name:
      s.service_name.length > 20
        ? `${s.service_name.slice(0, 18)}…`
        : s.service_name,
    revenue: s.total_revenue,
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">
          {t("revenueByService")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <BarChart
            data={chartData}
            config={{
              revenue: { label: t("revenue"), color: "var(--chart-1)" },
            }}
            xKey="name"
            series={[{ key: "revenue", color: "var(--chart-1)" }]}
            height={200}
          />
        ) : (
          <Typography.Muted className="py-8 text-center text-sm text-muted-foreground">
            {t("noDataForPeriod")}
          </Typography.Muted>
        )}
      </CardContent>
    </Card>
  );
}
