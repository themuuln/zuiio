/**
 * MechanicBarChart — Horizontal bar chart of mechanic revenue performance.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportMechanicKpi } from "@/lib/types";
import { BarChart } from "@/components/charts";

interface MechanicBarChartProps {
  kpis: ReportMechanicKpi[];
}

export function MechanicBarChart({ kpis }: MechanicBarChartProps) {
  if (!kpis.length) return null;

  const data = kpis.slice(0, 8).map((k) => ({
    name: k.mechanic_name.split(" ")[0] ?? k.mechanic_name,
    revenue: k.total_revenue,
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">
          Mechanic Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <BarChart
          data={data}
          config={{ revenue: { label: "Revenue", color: "var(--chart-1)" } }}
          xKey="name"
          series={[{ key: "revenue", color: "var(--chart-1)" }]}
          height={220}
        />
      </CardContent>
    </Card>
  );
}
