"use client";

import {
  Car,
  ClipboardList,
  Clock,
  DollarSign,
  Percent,
  Plus,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { DashboardData } from "@/lib/types";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const d = new Date(Number(year), Number(month) - 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
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
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      {label && (
        <p className="mb-1 font-medium text-card-foreground">{label}</p>
      )}
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="block size-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium tabular-nums">{fmt(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold tabular-nums">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (orgId: string) => {
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/reports?type=dashboard`,
      );
      const json = await res.json();
      if (json.error) {
        setError(json.error.message);
      } else {
        setData(json.data);
      }
    } catch (err) {
      setError("Failed to load dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/organizations")
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.id) {
          fetchDashboard(d.data.id);
        } else {
          setError("No organization found");
          router.replace("/auth/select-organization?returnUrl=/dashboard");
        }
      })
      .catch(() => {
        setError("Failed to load organization");
      })
      .finally(() => setLoading(false));
  }, [fetchDashboard, router]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-1 h-5 w-48" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["kpi1", "kpi2", "kpi3", "kpi4"].map((key) => (
            <Card key={key}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2].map((n) => (
            <Card key={n}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome to TOLOM
          </h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-muted-foreground">
              {error ?? "No data available"}
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    summary,
    workOrderStatusDistribution,
    revenueTrend,
    topServices,
    technicianPerformance,
    recentWorkOrders,
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome to TOLOM</h1>
        <p className="text-muted-foreground">
          Real-time overview of your shop&apos;s performance.
        </p>
      </div>

      <div>
        <SectionHeader title="Key Metrics" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Total Revenue"
            value={formatCurrency(summary.totalRevenue)}
            icon={DollarSign}
          />
          <KpiCard
            label="Active Work Orders"
            value={String(summary.activeWorkOrders)}
            icon={Clock}
          />
          <KpiCard
            label="Avg Repair Order"
            value={formatCurrency(summary.avgRepairOrderValue)}
            icon={TrendingUp}
          />
          <KpiCard
            label="Total Customers"
            value={String(summary.totalCustomers)}
            icon={Users}
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Service Revenue"
            value={formatCurrency(summary.serviceRevenue)}
            icon={Wrench}
          />
          <KpiCard
            label="Parts Revenue"
            value={formatCurrency(summary.partsRevenue)}
            icon={ClipboardList}
          />
          <KpiCard
            label="Total Vehicles"
            value={String(summary.totalVehicles)}
            icon={Car}
          />
          <KpiCard
            label="Service Margin"
            value={`${summary.totalRevenue > 0 ? Math.round((summary.serviceRevenue / summary.totalRevenue) * 100) : 0}%`}
            icon={Percent}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trend (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
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
                      stopOpacity={0.3}
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
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  content={
                    <ChartTooltip valueFormatter={(v) => formatCurrency(v)} />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke={CHART_COLORS[0]}
                  fill="url(#revenueGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Work Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={workOrderStatusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
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
                  height={36}
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Services by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {topServices.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No service data yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={topServices}
                  layout="vertical"
                  margin={{ left: 20, right: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    width={130}
                  />
                  <Tooltip
                    content={
                      <ChartTooltip valueFormatter={(v) => formatCurrency(v)} />
                    }
                  />
                  <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]}>
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
            <CardTitle>Technician Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {technicianPerformance.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No technician data yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={technicianPerformance}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    content={
                      <ChartTooltip valueFormatter={(v) => formatCurrency(v)} />
                    }
                  />
                  <Legend
                    formatter={(value: string) => (
                      <span className="text-xs text-muted-foreground">
                        {value}
                      </span>
                    )}
                  />
                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill={CHART_COLORS[0]}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="completedOrders"
                    name="Completed Orders"
                    fill={CHART_COLORS[1]}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Service Category</CardTitle>
          </CardHeader>
          <CardContent>
            {serviceCategoryBreakdown.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No category data yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={serviceCategoryBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
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
            <CardTitle>Customer Acquisition (12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={customerAcquisitionTrend}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatMonth}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  allowDecimals={false}
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
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS[1], r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div>
        <SectionHeader
          title="Recent Work Orders"
          description="Latest 10 work orders"
        />
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Vehicle
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Total
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentWorkOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-muted-foreground"
                      >
                        No work orders yet
                      </td>
                    </tr>
                  ) : (
                    recentWorkOrders.map((wo) => {
                      const grandTotal =
                        wo.services.reduce(
                          (sum: number, s: { final_price: number }) =>
                            sum + Number(s.final_price),
                          0,
                        ) +
                        wo.parts.reduce(
                          (sum: number, p: { final_price: number }) =>
                            sum + Number(p.final_price),
                          0,
                        );

                      return (
                        <tr
                          key={wo.id}
                          className="border-b border-border transition-colors hover:bg-muted/30 cursor-pointer"
                          onClick={() =>
                            router.push(`/dashboard/work-orders/${wo.id}`)
                          }
                        >
                          <td className="px-4 py-3 font-mono text-xs">
                            {wo.id.slice(0, 8)}...
                          </td>
                          <td className="px-4 py-3">
                            {wo.customer
                              ? `${wo.customer.first_name} ${wo.customer.last_name ?? ""}`.trim()
                              : "\u2014"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {wo.vehicle?.plate_number ?? "\u2014"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                              style={{
                                backgroundColor: `${STATUS_COLORS[wo.status] ?? "#888"}20`,
                                color: STATUS_COLORS[wo.status] ?? "#888",
                              }}
                            >
                              {wo.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium tabular-nums">
                            {formatCurrency(grandTotal)}
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {formatDate(wo.created_at)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <SectionHeader title="Quick Actions" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard/work-orders/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Plus className="size-4" />
            New Work Order
          </Link>
          <Link
            href="/dashboard/customers/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Users className="size-4" />
            New Customer
          </Link>
          <Link
            href="/dashboard/vehicles/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Car className="size-4" />
            New Vehicle
          </Link>
          <Link
            href="/dashboard/reports"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <TrendingUp className="size-4" />
            View Reports
          </Link>
        </div>
      </div>
    </div>
  );
}
