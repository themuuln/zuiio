/**
 * ServiceBreakdownChart — Horizontal bar chart of revenue by service type.
 *
 * Uses the shared BarChart wrapper from src/components/charts/.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ServiceBreakdown } from "@/lib/types";
import { BarChart } from "@/components/charts";

interface ServiceBreakdownChartProps {
  data: ServiceBreakdown[];
  loading?: boolean;
}

export function ServiceBreakdownChart({
  data,
  loading,
}: ServiceBreakdownChartProps) {
  if (loading) return <Skeleton className="h-[220px] rounded-xl" />;
  if (!data.length) return null;

  const chartData = data.slice(0, 6).map((s) => ({
    name:
      s.service_name.length > 20
        ? s.service_name.slice(0, 18) + "…"
        : s.service_name,
    revenue: s.total_revenue,
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">
          Revenue by Service
        </CardTitle>
      </CardHeader>
      <CardContent>
        <BarChart
          data={chartData}
          config={{ revenue: { label: "Revenue", color: "var(--chart-1)" } }}
          xKey="name"
          series={[{ key: "revenue", color: "var(--chart-1)" }]}
          height={200}
        />
      </CardContent>
    </Card>
  );
}
