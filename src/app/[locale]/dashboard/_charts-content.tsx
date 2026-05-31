"use client";

import { useTranslations } from "next-intl";
// recharts - consider next/dynamic for code splitting
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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
import { Typography } from "@/components/ui/typography";
import type { DashboardData } from "@/lib/types";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatPercent(value: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

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

export default function ChartsSection({ data }: { data: DashboardData }) {
  const t = useTranslations();
  const {
    revenueTrend,
    workOrderStatusDistribution,
    topServices,
    technicianPerformance,
    serviceCategoryBreakdown,
    customerAcquisitionTrend,
  } = data;

  const _totalStatusCount = workOrderStatusDistribution.reduce(
    (sum, s) => sum + s.count,
    0,
  );
  const totalServiceRevenue = serviceCategoryBreakdown.reduce(
    (sum, c) => sum + c.revenue,
    0,
  );

  const revenueConfig = {
    revenue: { label: t("reports.revenue"), color: CHART_COLORS[0] },
  };

  const statusChartConfig = Object.fromEntries(
    workOrderStatusDistribution.map((s) => [
      s.status,
      { label: s.status, color: STATUS_COLORS[s.status] ?? CHART_COLORS[4] },
    ]),
  );

  const categoryChartConfig = Object.fromEntries(
    serviceCategoryBreakdown.map((c, i) => [
      c.category,
      { label: c.category, color: CHART_COLORS[i % CHART_COLORS.length] },
    ]),
  );

  const techConfig = {
    revenue: { label: t("reports.revenue"), color: CHART_COLORS[0] },
    completedOrders: {
      label: t("dashboard.completedOrders"),
      color: CHART_COLORS[1],
    },
  };

  const customerConfig = {
    newCustomers: {
      label: t("dashboard.newCustomers"),
      color: CHART_COLORS[1],
    },
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Row 1: Revenue Trend + WO Status */}
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

      {/* Row 2: Top Services + Technician Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.topServicesRevenue")}</CardTitle>
          </CardHeader>
          <CardContent>
            {topServices.length === 0 ? (
              <div className="flex h-72 items-center justify-center">
                <Typography.Muted className="text-sm text-muted-foreground">
                  {t("common.noData")}
                </Typography.Muted>
              </div>
            ) : (
              <ChartContainer
                config={revenueConfig}
                className="aspect-auto h-[340px] w-full"
              >
                <BarChart
                  data={topServices}
                  layout="vertical"
                  margin={{ left: 20, right: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                    strokeOpacity={0.5}
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    width={140}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Bar
                    dataKey="revenue"
                    name={t("reports.revenue")}
                    radius={[0, 6, 6, 0]}
                    barSize={20}
                  >
                    {topServices.map((item, i) => (
                      <Cell
                        key={item.name}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.technicianPerformance")}</CardTitle>
          </CardHeader>
          <CardContent>
            {technicianPerformance.length === 0 ? (
              <div className="flex h-72 items-center justify-center">
                <Typography.Muted className="text-sm text-muted-foreground">
                  {t("common.noData")}
                </Typography.Muted>
              </div>
            ) : (
              <ChartContainer
                config={techConfig}
                className="aspect-auto h-[340px] w-full"
              >
                <BarChart
                  data={technicianPerformance}
                  margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                    strokeOpacity={0.5}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
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
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="revenue"
                    name={t("reports.revenue")}
                    fill={CHART_COLORS[0]}
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                  />
                  <Bar
                    dataKey="completedOrders"
                    name={t("dashboard.completedOrders")}
                    fill={CHART_COLORS[1]}
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Service Categories + Customer Acquisition */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.revenueByCategory")}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {serviceCategoryBreakdown.length === 0 ? (
              <div className="flex h-72 items-center justify-center">
                <Typography.Muted className="text-sm text-muted-foreground">
                  {t("common.noData")}
                </Typography.Muted>
              </div>
            ) : (
              <ChartContainer
                config={categoryChartConfig}
                className="mx-auto aspect-square h-[340px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Pie
                    data={serviceCategoryBreakdown}
                    cx="50%"
                    cy="45%"
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="revenue"
                    nameKey="category"
                    label={(props: { name?: string; value?: number }) => {
                      const labelName = props.name ?? "";
                      const labelValue = Number(props.value ?? 0);
                      return `${labelName} (${formatPercent(labelValue, totalServiceRevenue)})`;
                    }}
                    labelLine={{ stroke: "#888", strokeWidth: 1 }}
                  >
                    {serviceCategoryBreakdown.map((item, i) => (
                      <Cell
                        key={item.category}
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

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.customerAcquisition")}</CardTitle>
          </CardHeader>
          <CardContent>
            {customerAcquisitionTrend.length === 0 ? (
              <div className="flex h-72 items-center justify-center">
                <Typography.Muted className="text-sm text-muted-foreground">
                  {t("common.noData")}
                </Typography.Muted>
              </div>
            ) : (
              <ChartContainer
                config={customerConfig}
                className="aspect-auto h-[340px] w-full"
              >
                <LineChart
                  data={customerAcquisitionTrend}
                  margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                    strokeOpacity={0.5}
                  />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(m: string) => {
                      const [year, month] = m.split("-");
                      const d = new Date(Number(year), Number(month) - 1);
                      return d.toLocaleDateString("en-US", {
                        month: "short",
                        year: "2-digit",
                      });
                    }}
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Line
                    type="monotone"
                    dataKey="newCustomers"
                    name={t("dashboard.newCustomers")}
                    stroke={CHART_COLORS[1]}
                    strokeWidth={2.5}
                    dot={{ fill: CHART_COLORS[1], r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
