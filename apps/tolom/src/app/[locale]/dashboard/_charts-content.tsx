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
  Label,
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
import type { DashboardData, TopService } from "@/lib/types";
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
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="revenue"
              name={t("reports.revenue")}
              fill={CHART_COLORS[0]}
              radius={[3, 3, 0, 0]}
              barSize={14}
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
            />
            <Bar
              dataKey="orders"
              name={t("reports.completedWo")}
              fill={CHART_COLORS[1]}
              radius={[3, 3, 0, 0]}
              barSize={14}
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
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

  const totalRevenue = useMemo(
    () => categories.reduce((sum, c) => sum + c.revenue, 0),
    [categories],
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">
          {t("dashboard.revenueByCategory")}
        </CardTitle>
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
                {totalRevenue > 0 && (
                  <Label
                    content={({ viewBox }) => {
                      const { cx, cy } = viewBox as { cx: number; cy: number };
                      return (
                        <text
                          x={cx}
                          y={cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={cx}
                            dy="-0.5em"
                            className="fill-foreground text-base font-bold"
                          >
                            {formatCurrency(totalRevenue)}
                          </tspan>
                          <tspan
                            x={cx}
                            dy="1.6em"
                            className="fill-muted-foreground text-[10px] font-medium"
                          >
                            {t("reports.total")}
                          </tspan>
                        </text>
                      );
                    }}
                  />
                )}
              </Pie>
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
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

  // Compute KPI tiles for revenue chart
  const totalRevenue = useMemo(
    () => revenueTrend.reduce((sum, p) => sum + p.revenue, 0),
    [revenueTrend],
  );
  const avgRevenue =
    revenueTrend.length > 0 ? totalRevenue / revenueTrend.length : 0;
  const totalWorkOrders = useMemo(
    () => revenueTrend.reduce((sum, p) => sum + p.workOrders, 0),
    [revenueTrend],
  );
  const totalStatusCount = useMemo(
    () => workOrderStatusDistribution.reduce((sum, s) => sum + s.count, 0),
    [workOrderStatusDistribution],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>{t("dashboard.revenueTrend")}</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueTrend.length === 0 ? (
              <EmptyCardBody message={t("dashboard.noData")} />
            ) : (
              <>
                {/* KPI summary strip with card-like tiles */}
                <div className="mb-5 grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
                    <p className="mb-0.5 text-xs text-muted-foreground">
                      {t("reports.total")}
                    </p>
                    <p className="text-lg font-bold tabular-nums tracking-tight leading-none">
                      {formatCurrency(totalRevenue)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
                    <p className="mb-0.5 text-xs text-muted-foreground">
                      {t("reports.average")}
                    </p>
                    <p className="text-lg font-bold tabular-nums tracking-tight leading-none">
                      {formatCurrency(Math.round(avgRevenue))}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
                    <p className="mb-0.5 text-xs text-muted-foreground">
                      {t("dashboard.activeWorkOrders")}
                    </p>
                    <p className="text-lg font-bold tabular-nums tracking-tight leading-none">
                      {totalWorkOrders}
                    </p>
                  </div>
                </div>
                <ChartContainer
                  config={revenueConfig}
                  className="aspect-auto h-[280px] w-full"
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
                      vertical={false}
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
                      content={
                        <ChartTooltipContent
                          labelFormatter={(_label, payload) =>
                            formatDate(payload[0]?.payload?.date ?? "")
                          }
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke={CHART_COLORS[0]}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#revenueGradient)"
                    />
                  </AreaChart>
                </ChartContainer>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("dashboard.workOrderStatus")}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ChartContainer
              config={statusChartConfig}
              className="mx-auto aspect-square h-[300px]"
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
                  outerRadius={95}
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
                  {totalStatusCount > 0 && (
                    <Label
                      content={({ viewBox }) => {
                        const { cx, cy } = viewBox as {
                          cx: number;
                          cy: number;
                        };
                        return (
                          <text
                            x={cx}
                            y={cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={cx}
                              dy="-0.5em"
                              className="fill-foreground text-3xl font-bold"
                            >
                              {totalStatusCount}
                            </tspan>
                            <tspan
                              x={cx}
                              dy="1.6em"
                              className="fill-muted-foreground text-xs font-medium"
                            >
                              {t("reports.total")}
                            </tspan>
                          </text>
                        );
                      }}
                    />
                  )}
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
        {/* Technician Performance as horizontal bar chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {t("dashboard.technicianPerformance")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {technicianPerformance.length === 0 ? (
              <EmptyCardBody message={t("dashboard.noData")} />
            ) : (
              <div className="flex flex-col gap-3">
                {[...technicianPerformance]
                  .sort((a, b) => b.revenue - a.revenue)
                  .slice(0, 6)
                  .map((tech, i) => {
                    const maxRevenue = Math.max(
                      ...technicianPerformance.map((t) => t.revenue),
                      1,
                    );
                    const pct = (tech.revenue / maxRevenue) * 100;
                    return (
                      <div key={tech.id} className="flex items-center gap-3">
                        <div
                          className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums ${
                            i === 0
                              ? "bg-amber-100 text-amber-700 ring-1 ring-amber-300/50 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-600/30"
                              : i === 1
                                ? "bg-slate-100 text-slate-600 ring-1 ring-slate-300/50 dark:bg-slate-800/40 dark:text-slate-400 dark:ring-slate-600/30"
                                : i === 2
                                  ? "bg-orange-100 text-orange-700 ring-1 ring-orange-300/50 dark:bg-orange-950/40 dark:text-orange-400 dark:ring-orange-600/30"
                                  : "bg-muted text-muted-foreground ring-1 ring-border/40"
                          }`}
                        >
                          {i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="truncate text-sm font-medium">
                              {tech.name}
                            </span>
                            <span className="shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
                              {formatCurrency(tech.revenue)}
                            </span>
                          </div>
                          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full transition-all duration-500 ease-out"
                              style={{
                                width: `${Math.max(pct, 2)}%`,
                                background: `linear-gradient(90deg, ${CHART_COLORS[i % CHART_COLORS.length]}, ${CHART_COLORS[(i + 2) % CHART_COLORS.length]})`,
                              }}
                            />
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {tech.completedOrders}{" "}
                            {t("dashboard.completedOrders")}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
