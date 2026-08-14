/**
 * DailyRevenueChart — Bar chart for daily revenue breakdown.
 *
 * Used on weekly and monthly report tabs.
 */

import { useTranslations } from "next-intl";
import { BarChart } from "@/components/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";

interface DailyRevenueChartProps {
  data: Array<{ date: string; revenue: number; label: string }>;
}

export function DailyRevenueChart({ data }: DailyRevenueChartProps) {
  const t = useTranslations("reports");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">
          {t("dailyRevenue")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <BarChart
            data={data}
            config={{
              revenue: { label: t("revenue"), color: "var(--chart-1)" },
            }}
            xKey="label"
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
