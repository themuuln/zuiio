/**
 * MechanicBarChart — Horizontal bar chart of mechanic revenue performance.
 */

import { useTranslations } from "next-intl";
import { BarChart } from "@/components/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import type { ReportMechanicKpi } from "@/lib/types";

interface MechanicBarChartProps {
  kpis: ReportMechanicKpi[];
}

export function MechanicBarChart({ kpis }: MechanicBarChartProps) {
  const t = useTranslations("reports");

  const data = kpis.slice(0, 8).map((k) => ({
    name: k.mechanic_name.split(" ")[0] ?? k.mechanic_name,
    revenue: k.total_revenue,
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">
          {t("mechanicPerformance")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <BarChart
            data={data}
            config={{
              revenue: { label: t("revenue"), color: "var(--chart-1)" },
            }}
            xKey="name"
            series={[{ key: "revenue", color: "var(--chart-1)" }]}
            height={220}
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
