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
import type {
  DashboardData,
  TechnicianPerformance,
  TopService,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function MechanicTrendChart({
  data,
}: {
  data: { week: string; orders: number; revenue: number }[];
}) {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
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

function EmptyCardBody({ message }: { message: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function TopServicesCard({ services }: { services: TopService[] }) {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const top = services.slice(0, 5);
  const maxRevenue = Math.max(...top.map((s) => s.revenue), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.topServicesRevenue")}</CardTitle>
      </CardHeader>
      <CardContent>
        {top.length === 0 ? (
          <EmptyCardBody message={t("dashboard.noData")} />
        ) : (
          <div className="flex flex-col gap-4">
            {top.map((service) => (
              <div key={service.name} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{service.name}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {service.count} · {formatCurrency(service.revenue)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/80"
                    style={{
                      width: `${Math.max((service.revenue / maxRevenue) * 100, 2)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CategoryBreakdownCard({
  categories,
}: {
  categories: DashboardData["serviceCategoryBreakdown"];
}) {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;

  const config = useMemo(
    () =>
      Object.fromEntries(
        categories.map((c, i) => [
          c.category,
          { label: c.category, color: CHART_COLORS[i % CHART_COLORS.length] },
        ]),
      ),
    [categories],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.revenueByCategory")}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        {categories.length === 0 ? (
          <EmptyCardBody message={t("dashboard.noData")} />
        ) : (
          <ChartContainer
            config={config}
            className="mx-auto aspect-square h-[220px]"
          >
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Pie
                data={categories}
                cx="50%"
                cy="45%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
                dataKey="revenue"
                nameKey="category"
              >
                {categories.map((entry, i) => (
                  <Cell
                    key={entry.category}
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function TechnicianPerformanceCard({
  technicians,
}: {
  technicians: TechnicianPerformance[];
}) {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const top = [...technicians]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.technicianPerformance")}</CardTitle>
      </CardHeader>
      <CardContent>
        {top.length === 0 ? (
          <EmptyCardBody message={t("dashboard.noData")} />
        ) : (
          <div className="flex flex-col gap-3">
            {top.map((tech, i) => (
              <div key={tech.id} className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {tech.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {tech.completedOrders} {t("dashboard.completedOrders")}
                  </div>
                </div>
                <div className="shrink-0 text-sm font-medium tabular-nums">
                  {formatCurrency(tech.revenue)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ChartsSection({ data }: { data: DashboardData }) {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const {
    revenueTrend,
    workOrderStatusDistribution,
    topServices,
    serviceCategoryBreakdown,
    technicianPerformance,
  } = data;

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
    <div className="flex flex-col gap-6">
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
                  tickFormatter={(v) => `₮${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
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
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
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

      {/* Second row: what sells, where revenue comes from, who delivers it */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <TopServicesCard services={topServices} />
        <CategoryBreakdownCard categories={serviceCategoryBreakdown} />
        <TechnicianPerformanceCard technicians={technicianPerformance} />
      </div>
    </div>
  );
}
