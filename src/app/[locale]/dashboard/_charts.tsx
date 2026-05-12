"use client";

import { useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, STATUS_COLORS } from "@/components/charts/chart-colors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatPercent(value: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  valueFormatter?: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const fmt = valueFormatter ?? ((v: number) => String(v));

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-lg">
      {label && (
        <p className="mb-1.5 font-semibold text-card-foreground">{label}</p>
      )}
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2.5 py-0.5">
          <span
            className="block size-3 shrink-0 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold tabular-nums">{fmt(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

interface ChartsSectionProps {
  data: DashboardData;
}

export default function ChartsSection({ data }: ChartsSectionProps) {
  const t = useTranslations();
  const {
    revenueTrend,
    workOrderStatusDistribution,
    topServices,
    technicianPerformance,
    serviceCategoryBreakdown,
    customerAcquisitionTrend,
  } = data;

  const totalStatusCount = workOrderStatusDistribution.reduce(
    (sum, s) => sum + s.count,
    0,
  );
  const totalServiceRevenue = serviceCategoryBreakdown.reduce(
    (sum, c) => sum + c.revenue,
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Row 1: Revenue Trend + WO Status */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("dashboard.revenueTrend")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
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
                <Tooltip
                  content={
                    <ChartTooltip valueFormatter={(v) => formatCurrency(v)} />
                  }
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
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.workOrderStatus")}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
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
                <Tooltip
                  content={
                    <ChartTooltip
                      valueFormatter={(v) =>
                        `${v} (${formatPercent(v, totalStatusCount)})`
                      }
                    />
                  }
                />
                <Legend
                  verticalAlign="bottom"
                  height={40}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-xs text-muted-foreground">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
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
                <p className="text-sm text-muted-foreground">
                  {t("common.noData")}
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={340}>
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
                  <Tooltip
                    content={
                      <ChartTooltip valueFormatter={(v) => formatCurrency(v)} />
                    }
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
              </ResponsiveContainer>
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
                <p className="text-sm text-muted-foreground">
                  {t("common.noData")}
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={340}>
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
                  <Tooltip
                    content={
                      <ChartTooltip valueFormatter={(v) => formatCurrency(v)} />
                    }
                  />
                  <Legend
                    iconType="rect"
                    iconSize={10}
                    formatter={(value: string) => (
                      <span className="text-xs text-muted-foreground">
                        {value}
                      </span>
                    )}
                  />
                  <Bar
                    dataKey="revenue"
                    name={t("reports.revenue")}
                    fill={CHART_COLORS[0]}
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                  />
                  <Bar
                    dataKey="completedOrders"
                    name="Completed Orders"
                    fill={CHART_COLORS[1]}
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
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
                <p className="text-sm text-muted-foreground">
                  {t("common.noData")}
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <PieChart>
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
                  <Tooltip
                    content={
                      <ChartTooltip valueFormatter={(v) => formatCurrency(v)} />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
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
                <p className="text-sm text-muted-foreground">
                  {t("common.noData")}
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={340}>
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
                  <Tooltip
                    content={
                      <ChartTooltip valueFormatter={(v) => `${v} customers`} />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="newCustomers"
                    name="New Customers"
                    stroke={CHART_COLORS[1]}
                    strokeWidth={2.5}
                    dot={{ fill: CHART_COLORS[1], r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
