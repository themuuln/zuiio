/**
 * DailyRevenueChart — Bar chart for daily revenue breakdown.
 *
 * Used on weekly and monthly report tabs.
 */

import { BarChart } from "@/components/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DailyRevenueChartProps {
  data: Array<{ date: string; revenue: number; label: string }>;
}

export function DailyRevenueChart({ data }: DailyRevenueChartProps) {
  if (!data.length) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Daily Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <BarChart
          data={data}
          config={{ revenue: { label: "Revenue", color: "var(--chart-1)" } }}
          xKey="label"
          series={[{ key: "revenue", color: "var(--chart-1)" }]}
          height={200}
        />
      </CardContent>
    </Card>
  );
}
