"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, STATUS_COLORS } from "@/components/charts/chart-colors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { DashboardData } from "@/lib/types";

export function MechanicTrendChart({
  data,
}: {
  data: { week: string; orders: number; revenue: number }[];
}) {
  const t = useTranslations();
  if (data.length === 0) return null;
  const config = {
    revenue: { label: t("reports.revenue"), color: CHART_COLORS[0] },
    orders: { label: t("reports.completedWo"), color: CHART_COLORS[1] },
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          {t("dashboard.weeklyTrend")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={config}
          className="aspect-auto h-[200px] w-full"
        >
          <BarChart
            data={data}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-border"
              strokeOpacity={0.5}
              vertical={false}
            />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 10 }}
              className="text-muted-foreground"
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10 }}
              className="text-muted-foreground"
              axisLine={false}
              tickLine={false}
              width={35}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="revenue"
              name={t("reports.revenue")}
              fill={CHART_COLORS[0]}
              radius={[3, 3, 0, 0]}
              barSize={14}
            />
            <Bar
              dataKey="orders"
              name={t("reports.completedWo")}
              fill={CHART_COLORS[1]}
              radius={[3, 3, 0, 0]}
              barSize={14}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ChartsSection({ data }: { data: DashboardData }) {
  const t = useTranslations();
  // Cached/partial payloads may lack these fields at runtime despite the type
  const revenueTrend = data.revenueTrend ?? [];
  const workOrderStatusDistribution = data.workOrderStatusDistribution ?? [];

  const revenueConfig = useMemo(
    () => ({
      revenue: { label: t("reports.revenue"), color: CHART_COLORS[0] },
    }),
    [t],
  );

  const statusChartConfig = useMemo(
    () =>
      Object.fromEntries(
        workOrderStatusDistribution.map((s) => [
          s.status,
          {
            label: s.status,
            color: STATUS_COLORS[s.status] ?? CHART_COLORS[4],
          },
        ]),
      ),
    [workOrderStatusDistribution],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{t("dashboard.revenueTrend")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={revenueConfig}
            className="aspect-auto h-[320px] w-full"
          >
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient
                  id="revenueGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={CHART_COLORS[0]}
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor={CHART_COLORS[0]}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                interval="preserveStartEnd"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="revenue"
                name={t("reports.revenue")}
                stroke={CHART_COLORS[0]}
                strokeWidth={2.5}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.workOrderStatus")}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <ChartContainer
            config={statusChartConfig}
            className="mx-auto aspect-square h-[320px]"
          >
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Pie
                data={workOrderStatusDistribution}
                cx="50%"
                cy="45%"
                innerRadius={65}
                outerRadius={100}
                paddingAngle={3}
                dataKey="count"
                nameKey="status"
              >
                {workOrderStatusDistribution.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_COLORS[entry.status] ?? CHART_COLORS[4]}
                  />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
