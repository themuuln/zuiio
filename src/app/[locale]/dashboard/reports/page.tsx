"use client";

import {
  BarChart3,
  Calendar,
  ClipboardList,
  DollarSign,
  Download,
  Lightbulb,
  Percent,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Info,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Cell, Pie, Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, PieChart as RechartsPieChart } from "recharts";
import { MechanicSelect } from "@/components/mechanic-select";
import { ExportButton } from "@/components/export-button";
import type { ExportColumn } from "@/lib/export";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/utils";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { RecentList } from "@/components/sidebar-tabs/recent-list";
import { Typography } from "@/components/ui/typography";
import { CHART_COLORS } from "@/components/charts/chart-colors";
import type {
  DailyReport,
  ReportComparison,
  ReportForecast,
  ReportInsight,
  ReportMechanicKpi,
  ReportProfitability,
  ReportTarget,
  CustomerRetentionData,
  PnLSummary,
  ServiceBreakdown,
} from "@/lib/types";

type ReportType = "daily" | "weekly" | "monthly" | "eod";

// ── Helpers ────────────────────────────────────────────────

function reportPeriodTitle(type: ReportType, date: string): string {
  const d = new Date(date);
  switch (type) {
    case "daily":
      return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    case "weekly": {
      const start = new Date(date);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    case "monthly":
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    case "eod":
      return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }
}

function getDateRange(type: ReportType, date: string, weekStart: string, month: string): { from: string; to: string } {
  if (type === "daily" || type === "eod") return { from: date, to: date };
  if (type === "weekly") {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    return { from: weekStart, to: end.toISOString().split("T")[0] };
  }
  const [y, m] = month.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, "0")}` };
}

function formatCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return formatCurrency(n);
}

// ── Types for report data ──────────────────────────────────

interface Mechanic { id: string; fullName: string | null; email: string; }

interface ReportData {
  work_orders_completed: number;
  services_count: number;
  parts_count: number;
  total_revenue: number;
  total_discounts: number;
  comparison: ReportComparison | null;
  profitability: ReportProfitability | null;
  mechanic_kpis: ReportMechanicKpi[];
  work_orders?: unknown[];
  daily_breakdown?: DailyReport[];
  [key: string]: unknown;
}

interface EodReport {
  date: string;
  mechanics: Array<{
    mechanic_id: string; mechanic_name: string;
    work_orders_completed: number; services_performed: number;
    parts_used: number; total_revenue: number;
    total_discounts?: number; total_commission?: number;
  }>;
  total_work_orders: number;
  total_revenue: number;
  total_commission?: number;
}

// ── Delta Indicator ───────────────────────────────────────

function Delta({ value, invert }: { value: number | null; invert?: boolean }) {
  if (value === null || value === undefined) return null;
  const up = value > 0;
  const color = value === 0 ? "text-muted-foreground" : invert ? (up ? "text-red-500" : "text-green-600 dark:text-green-400") : (up ? "text-green-600 dark:text-green-400" : "text-red-500");
  const Icon = value === 0 ? null : up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${color}`}>
      {Icon && <Icon className="size-3" />}
      {up ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
}

// ── KPI Card ──────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, subtitle, loading, cls, delta, deltaInvert }: {
  label: string; value: string; icon: LucideIcon; subtitle?: string;
  loading?: boolean; cls?: string; delta?: number | null; deltaInvert?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-24" /> : (
          <>
            <div className="flex items-baseline gap-2">
              <div className={`text-2xl font-semibold tabular-nums ${cls ?? ""}`}>{value}</div>
              {delta !== undefined && <Delta value={delta ?? null} invert={deltaInvert} />}
            </div>
            {subtitle && <Typography.Muted className="mt-0.5 text-xs text-muted-foreground">{subtitle}</Typography.Muted>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Insight Alert Cards ───────────────────────────────────

function InsightAlerts({ insights, loading }: { insights: ReportInsight[]; loading?: boolean }) {
  if (loading) return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-[80px] rounded-xl" />)}</div>;
  if (!insights.length) return null;

  const severityConfig = {
    positive: { bg: "bg-green-50/50 dark:bg-green-950/20", border: "border-green-200/50 dark:border-green-800/30", icon: CheckCircle2, iconColor: "text-green-500" },
    warning: { bg: "bg-amber-50/50 dark:bg-amber-950/20", border: "border-amber-200/50 dark:border-amber-800/30", icon: AlertTriangle, iconColor: "text-amber-500" },
    danger: { bg: "bg-red-50/50 dark:bg-red-950/20", border: "border-red-200/50 dark:border-red-800/30", icon: AlertTriangle, iconColor: "text-red-500" },
    info: { bg: "bg-blue-50/50 dark:bg-blue-950/20", border: "border-blue-200/50 dark:border-blue-800/30", icon: Info, iconColor: "text-blue-500" },
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {insights.map((insight) => {
        const config = severityConfig[insight.severity];
        const Icon = config.icon;
        return (
          <Card key={insight.id} className={`${config.bg} ${config.border}`}>
            <CardContent className="py-3 px-4">
              <div className="flex items-start gap-2">
                <Icon className={`mt-0.5 size-4 shrink-0 ${config.iconColor}`} />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold">{insight.title}</span>
                  <span className="text-[11px] text-muted-foreground leading-tight">{insight.message}</span>
                  {insight.action && <span className="text-[11px] text-muted-foreground/70 italic mt-0.5">{insight.action}</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ── Forecast Card ─────────────────────────────────────────

function ForecastCard({ forecast, loading }: { forecast: ReportForecast | null; loading?: boolean }) {
  if (loading) return <Skeleton className="h-[120px] rounded-xl" />;
  if (!forecast) return null;

  const progressPct = forecast.total_days > 0 ? Math.round((forecast.days_elapsed / forecast.total_days) * 100) : 0;
  const paceVsTarget = forecast.previous_period_revenue && forecast.previous_period_revenue > 0
    ? Math.round((forecast.projected_revenue / forecast.previous_period_revenue) * 100)
    : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <TrendingUp className="size-4 text-muted-foreground" />
          Revenue Forecast
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-semibold tabular-nums">{formatCompact(forecast.projected_revenue)}</span>
          <span className="text-xs text-muted-foreground">projected</span>
          {forecast.projected_change_pct !== null && <Delta value={forecast.projected_change_pct} />}
        </div>

        {/* Progress bar — days elapsed */}
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>{forecast.days_elapsed} of {forecast.total_days} days elapsed</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground">Daily run rate</span>
            <span className="block font-medium tabular-nums">{formatCompact(forecast.daily_run_rate)}/day</span>
          </div>
          <div>
            <span className="text-muted-foreground">Current</span>
            <span className="block font-medium tabular-nums">{formatCompact(forecast.current_revenue)}</span>
          </div>
        </div>

        {paceVsTarget !== null && (
          <div className={`text-xs font-medium ${forecast.on_track ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
            {forecast.on_track ? "✓ On track" : "⚠ Behind pace"} vs previous period ({paceVsTarget}% of target)
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Revenue Target Card ───────────────────────────────────

function TargetCard({ targets, loading, onSetTarget }: { targets: ReportTarget[]; loading?: boolean; onSetTarget?: () => void }) {
  if (loading) return <Skeleton className="h-[100px] rounded-xl" />;

  const target = targets[0]; // show first target
  if (!target) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-6 gap-2">
          <Target className="size-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">No revenue target set</span>
          {onSetTarget && (
            <Button variant="outline" size="sm" onClick={onSetTarget} className="mt-1">
              Set Target
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const progressPct = Math.min(100, target.progress_pct);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Target className="size-4 text-muted-foreground" />
          Revenue Target
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold tabular-nums">{formatCompact(target.actual_revenue)}</span>
          <span className="text-sm text-muted-foreground">of {formatCompact(target.target_revenue)}</span>
        </div>
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>{target.progress_pct}% achieved</span>
            {target.achieved && <span className="text-green-600 dark:text-green-400 font-medium">✓ Target met!</span>}
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${target.achieved ? "bg-green-500" : "bg-primary"}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Customer Retention Card ───────────────────────────────

function RetentionCard({ data, loading }: { data: CustomerRetentionData | null; loading?: boolean }) {
  if (loading) return <Skeleton className="h-[200px] rounded-xl" />;
  if (!data || data.total_customers === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          Customer Retention
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <span className="text-lg font-semibold tabular-nums">{data.retention_rate}%</span>
            <span className="block text-[10px] text-muted-foreground">Retention</span>
          </div>
          <div>
            <span className="text-lg font-semibold tabular-nums">{data.returning_customers}</span>
            <span className="block text-[10px] text-muted-foreground">Returning</span>
          </div>
          <div>
            <span className="text-lg font-semibold tabular-nums">{data.new_customers}</span>
            <span className="block text-[10px] text-muted-foreground">New</span>
          </div>
        </div>
        <div className="flex justify-between text-xs border-t border-border pt-2">
          <span className="text-muted-foreground">Avg visits/customer</span>
          <span className="font-medium tabular-nums">{data.avg_visits_per_customer}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Avg lifetime value</span>
          <span className="font-medium tabular-nums">{formatCurrency(data.avg_lifetime_value)}</span>
        </div>
        {data.top_customers.length > 0 && (
          <div className="border-t border-border pt-2">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Top Customers</span>
            <div className="flex flex-col gap-1 mt-1">
              {data.top_customers.slice(0, 3).map((c) => (
                <div key={c.customer_id} className="flex justify-between text-xs">
                  <span className="truncate">{c.customer_name}</span>
                  <span className="tabular-nums font-medium">{formatCurrency(c.total_revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── P&L Card ──────────────────────────────────────────────

function PnLCard({ data, loading }: { data: PnLSummary | null; loading?: boolean }) {
  if (loading) return <Skeleton className="h-[300px] rounded-xl" />;
  if (!data) return null;

  const rows: Array<{ label: string; amount: number; bold?: boolean; indent?: boolean; color?: string }> = [
    { label: "Service Revenue", amount: data.revenue.service_revenue, indent: true },
    { label: "Parts Revenue", amount: data.revenue.parts_revenue, indent: true },
    { label: "Total Revenue", amount: data.revenue.total, bold: true },
    { label: "Cost of Goods Sold", amount: -data.cogs.total, bold: false },
    { label: "Gross Profit", amount: data.gross_profit, bold: true, color: data.gross_profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500" },
    { label: `Gross Margin`, amount: data.gross_margin_pct, bold: false, color: "text-muted-foreground" },
  ];

  // Expense lines
  if (data.expenses.by_category.length > 0) {
    for (const cat of data.expenses.by_category.slice(0, 5)) {
      rows.push({ label: `  ${cat.category}`, amount: -cat.amount, indent: true });
    }
  }
  rows.push({ label: "Total Expenses", amount: -data.expenses.total, bold: false });
  rows.push({ label: "Net Profit", amount: data.net_profit, bold: true, color: data.net_profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500" });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Profit & Loss</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={`${row.label}-${i}`} className={row.bold ? "font-semibold" : ""}>
                <TableCell className={`px-4 py-1.5 text-xs ${row.indent ? "pl-8" : ""}`}>{row.label}</TableCell>
                <TableCell className={`px-4 py-1.5 text-xs text-right tabular-nums ${row.color ?? ""}`}>
                  {row.label.includes("Margin") || row.label.includes("%")
                    ? `${row.amount.toFixed(1)}%`
                    : formatCurrency(row.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ── Service Breakdown Chart ────────────────────────────────

function ServiceBreakdownChart({ data, loading }: { data: ServiceBreakdown[]; loading?: boolean }) {
  if (loading) return <Skeleton className="h-[220px] rounded-xl" />;
  if (!data.length) return null;

  const chartData = data.slice(0, 6).map((s) => ({
    name: s.service_name.length > 20 ? s.service_name.slice(0, 18) + "…" : s.service_name,
    revenue: s.total_revenue,
    count: s.service_count,
  }));

  const config = { revenue: { label: "Revenue", color: CHART_COLORS[0] } };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Revenue by Service</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[200px] w-full">
          <RechartsBarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
            <CartesianGrid horizontal={false} className="stroke-border" strokeOpacity={0.5} />
            <XAxis type="number" tick={{ fontSize: 10 }} className="text-muted-foreground" axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} className="text-muted-foreground" axisLine={false} tickLine={false} width={100} />
            <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v))} />} />
            <Bar dataKey="revenue" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
          </RechartsBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ── Donut Chart ───────────────────────────────────────────

function Donut({ serviceRevenue, partsRevenue }: { serviceRevenue: number; partsRevenue: number }) {
  const total = serviceRevenue + partsRevenue;
  if (total === 0) return null;
  const data = [
    { name: "Services", value: serviceRevenue, color: CHART_COLORS[0] },
    { name: "Parts", value: partsRevenue, color: CHART_COLORS[1] },
  ];
  const config = { services: { label: "Services", color: CHART_COLORS[0] }, parts: { label: "Parts", color: CHART_COLORS[1] } };

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Revenue Split</CardTitle></CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <ChartContainer config={config} className="h-[140px] w-[140px]">
            <RechartsPieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                {data.map((e) => <Cell key={e.name} fill={e.color} />)}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </RechartsPieChart>
          </ChartContainer>
          <div className="flex flex-col gap-2">
            {data.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-muted-foreground">{item.name}</span>
                <span className="text-xs font-medium tabular-nums">{formatCurrency(item.value)}</span>
                <span className="text-[10px] text-muted-foreground">({Math.round((item.value / total) * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Daily Revenue Bar Chart ───────────────────────────────

function DailyRevenueChart({ data }: { data: Array<{ date: string; revenue: number; label: string }> }) {
  if (!data.length) return null;
  const config = { revenue: { label: "Revenue", color: CHART_COLORS[0] } };
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Daily Revenue</CardTitle></CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[200px] w-full">
          <RechartsBarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <CartesianGrid vertical={false} className="stroke-border" strokeOpacity={0.5} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} className="text-muted-foreground" axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" axisLine={false} tickLine={false} />
            <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v))} />} />
            <Bar dataKey="revenue" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
          </RechartsBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ── Mechanic Bar Chart ────────────────────────────────────

function MechanicBarChart({ kpis }: { kpis: ReportMechanicKpi[] }) {
  if (!kpis.length) return null;
  const data = kpis.slice(0, 8).map((k) => ({ name: k.mechanic_name.split(" ")[0] ?? k.mechanic_name, revenue: k.total_revenue }));
  const config = { revenue: { label: "Revenue", color: CHART_COLORS[0] } };
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Mechanic Performance</CardTitle></CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[220px] w-full">
          <RechartsBarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
            <CartesianGrid horizontal={false} className="stroke-border" strokeOpacity={0.5} />
            <XAxis type="number" tick={{ fontSize: 10 }} className="text-muted-foreground" axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} className="text-muted-foreground" axisLine={false} tickLine={false} width={60} />
            <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v))} />} />
            <Bar dataKey="revenue" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
          </RechartsBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ── Mechanic KPI Table ────────────────────────────────────

function MechanicTable({ kpis, exportCols, exportFile }: {
  kpis: ReportMechanicKpi[]; exportCols: ExportColumn<ReportMechanicKpi>[]; exportFile: string;
}) {
  if (!kpis.length) return null;
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">Per-Mechanic Breakdown</CardTitle>
        <ExportButton data={kpis} columns={exportCols} filename={exportFile} sheetName="Mechanics" />
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">Mechanic</TableHead>
              <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">Jobs</TableHead>
              <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">Services</TableHead>
              <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">Parts</TableHead>
              <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">Revenue</TableHead>
              <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">Avg/WO</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kpis.map((m, i) => (
              <TableRow key={m.mechanic_id} className={`border-b border-border hover:bg-muted/30 ${i === 0 ? "bg-muted/10" : ""}`}>
                <TableCell className="px-4 py-3 font-medium">{m.mechanic_name}</TableCell>
                <TableCell className="px-4 py-3 text-right tabular-nums">{m.work_orders_completed}</TableCell>
                <TableCell className="px-4 py-3 text-right tabular-nums">{m.services_count}</TableCell>
                <TableCell className="px-4 py-3 text-right tabular-nums">{m.parts_count}</TableCell>
                <TableCell className="px-4 py-3 text-right font-medium tabular-nums">{formatCurrency(m.total_revenue)}</TableCell>
                <TableCell className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatCurrency(m.avg_revenue_per_wo)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-muted/30 font-semibold">
              <TableCell className="px-4 py-3">Total</TableCell>
              <TableCell className="px-4 py-3 text-right tabular-nums">{kpis.reduce((s, m) => s + m.work_orders_completed, 0)}</TableCell>
              <TableCell className="px-4 py-3 text-right tabular-nums">{kpis.reduce((s, m) => s + m.services_count, 0)}</TableCell>
              <TableCell className="px-4 py-3 text-right tabular-nums">{kpis.reduce((s, m) => s + m.parts_count, 0)}</TableCell>
              <TableCell className="px-4 py-3 text-right tabular-nums">{formatCurrency(kpis.reduce((s, m) => s + m.total_revenue, 0))}</TableCell>
              <TableCell className="px-4 py-3" />
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}

// ════════════════════════════════════════════════════════════
// ── MAIN REPORTS PAGE ─────────────────────────────────────
// ════════════════════════════════════════════════════════════

export default function ReportsPage() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [selectedMechanic, setSelectedMechanic] = useState("");
  const [reportType, setReportType] = useState<ReportType>("daily");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1);
    return d.toISOString().split("T")[0];
  });
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  // Core report data
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [expenses, setExpenses] = useState<{ totalAmount: number; thisMonth: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ERP-grade data
  const [insights, setInsights] = useState<ReportInsight[]>([]);
  const [forecast, setForecast] = useState<ReportForecast | null>(null);
  const [targets, setTargets] = useState<ReportTarget[]>([]);
  const [retention, setRetention] = useState<CustomerRetentionData | null>(null);
  const [pnl, setPnl] = useState<PnLSummary | null>(null);
  const [serviceBreakdown, setServiceBreakdown] = useState<ServiceBreakdown[]>([]);
  const [erpLoading, setErpLoading] = useState(true);

  const orgIdRef = useRef<string | null>(null);
  const { registerTab } = useRightSidebar();

  const isEod = reportType === "eod";
  const r = report as ReportData | null;
  const eodReport = report as EodReport | null;
  const hasData = (r?.work_orders_completed ?? 0) > 0 || (r?.total_revenue ?? 0) > 0;

  const { from: dateFrom, to: dateTo } = useMemo(
    () => getDateRange(reportType, date, weekStart, month),
    [reportType, date, weekStart, month],
  );

  const fetchMechanics = useCallback(async (oid: string) => {
    try {
      const res = await fetch(`/api/organizations/${oid}/reports?type=mechanics`);
      const json = await res.json();
      if (!json.error && Array.isArray(json.data)) {
        setMechanics(json.data.map((m: { id: string; full_name: string | null }) => ({ id: m.id, fullName: m.full_name ?? null, email: "" })));
      }
    } catch { /* silent */ }
  }, []);

  const fetchReport = useCallback(async () => {
    const orgId = orgIdRef.current;
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ type: reportType });
      if (selectedMechanic) params.set("mechanic", selectedMechanic);
      let dateParam = "";
      if (reportType === "daily" || reportType === "eod") dateParam = date;
      if (reportType === "weekly") dateParam = weekStart;
      if (reportType === "monthly") dateParam = month;
      if (dateParam) params.set("date", dateParam);

      const [reportJson, expenseJson] = await Promise.all([
        fetch(`/api/organizations/${orgId}/reports?${params}`).then((r) => r.json()),
        fetch(`/api/organizations/${orgId}/expenses?type=stats`).then((r) => r.json()),
      ]);

      if (reportJson.error) { toast.error(reportJson.error.message); setError(reportJson.error.message); }
      else setReport(reportJson.data ?? null);
      if (!expenseJson.error && expenseJson.data) {
        setExpenses({ totalAmount: expenseJson.data.totalAmount ?? 0, thisMonth: expenseJson.data.thisMonth ?? 0 });
      }
    } catch { toast.error("Failed to load report"); setError("Failed to load report"); }
    finally { setLoading(false); }
  }, [reportType, selectedMechanic, date, weekStart, month]);

  // Fetch ERP-grade data (insights, forecast, targets, retention, P&L, service breakdown)
  const fetchErpData = useCallback(async () => {
    const orgId = orgIdRef.current;
    if (!orgId || isEod) { setErpLoading(false); return; }
    setErpLoading(true);
    try {
      const periodType = reportType === "daily" ? "daily" : reportType === "weekly" ? "weekly" : "monthly";
      const baseParams = `date_from=${dateFrom}&date_to=${dateTo}`;

      const [insightsRes, forecastRes, targetsRes, retentionRes, pnlRes, svcRes] = await Promise.all([
        fetch(`/api/organizations/${orgId}/reports?type=insights&${baseParams}`).then((r) => r.json()),
        fetch(`/api/organizations/${orgId}/reports?type=forecast&period_type=${periodType}&date=${reportType === "monthly" ? month + "-01" : reportType === "weekly" ? weekStart : date}`).then((r) => r.json()),
        fetch(`/api/organizations/${orgId}/reports?type=targets&period_type=${periodType}&date=${date}`).then((r) => r.json()),
        fetch(`/api/organizations/${orgId}/reports?type=retention&${baseParams}`).then((r) => r.json()),
        fetch(`/api/organizations/${orgId}/reports?type=pnl&${baseParams}`).then((r) => r.json()),
        fetch(`/api/organizations/${orgId}/reports?type=service-breakdown&${baseParams}`).then((r) => r.json()),
      ]);

      if (!insightsRes.error) setInsights(insightsRes.data ?? []);
      if (!forecastRes.error) setForecast(forecastRes.data ?? null);
      if (!targetsRes.error) setTargets(targetsRes.data ?? []);
      if (!retentionRes.error) setRetention(retentionRes.data ?? null);
      if (!pnlRes.error) setPnl(pnlRes.data ?? null);
      if (!svcRes.error) setServiceBreakdown(svcRes.data ?? []);
    } catch { /* silent — non-critical */ }
    finally { setErpLoading(false); }
  }, [isEod, reportType, dateFrom, dateTo, month, weekStart, date]);

  // Init
  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/profile", { signal: abort.signal })
      .then((r) => r.json())
      .then((d) => {
        const oid = d?.organizationId ?? d?.data?.organizationId;
        if (oid) { orgIdRef.current = oid; fetchMechanics(oid); fetchReport(); }
      })
      .catch((err) => { if (!abort.signal.aborted) console.error(err); })
      .finally(() => setLoading(false));
    return () => abort.abort();
  }, [fetchMechanics, fetchReport]);

  useEffect(() => { fetchReport(); }, [fetchReport]);
  useEffect(() => { fetchErpData(); }, [fetchErpData]);

  // ── Derived ────────────────────────────────────────────

  const dailyBreakdown = useMemo(() => {
    if (reportType !== "weekly" || !report) return [];
    const bd = (report as Record<string, unknown>).daily_breakdown;
    if (!Array.isArray(bd)) return [];
    return bd.map((d: Record<string, unknown>) => ({
      date: d.date as string,
      revenue: Number(d.total_revenue ?? 0),
      label: new Date(d.date as string).toLocaleDateString("en-US", { weekday: "short" }),
    }));
  }, [report, reportType]);

  const monthlyDailyBreakdown = useMemo(() => {
    if (reportType !== "monthly" || !report) return [];
    const wb = (report as Record<string, unknown>).weekly_breakdown;
    if (!Array.isArray(wb)) return [];
    const points: Array<{ date: string; revenue: number; label: string }> = [];
    for (const week of wb) {
      const dailyBd = (week as Record<string, unknown>).daily_breakdown;
      if (!Array.isArray(dailyBd)) continue;
      for (const day of dailyBd) {
        const d = day as Record<string, unknown>;
        points.push({ date: d.date as string, revenue: Number(d.total_revenue ?? 0), label: String(new Date(d.date as string).getDate()) });
      }
    }
    return points;
  }, [report, reportType]);

  const mechExportCols: ExportColumn<ReportMechanicKpi>[] = [
    { key: "mechanic_name", label: "Mechanic" },
    { key: "work_orders_completed", label: "Jobs" },
    { key: "services_count", label: "Services" },
    { key: "parts_count", label: "Parts" },
    { key: "total_revenue", label: "Revenue", format: "currency" },
    { key: "avg_revenue_per_wo", label: "Avg/WO", format: "currency" },
  ];

  const tabs: { label: string; value: ReportType; icon: LucideIcon }[] = [
    { label: "Daily", value: "daily", icon: Calendar },
    { label: "Weekly", value: "weekly", icon: BarChart3 },
    { label: "Monthly", value: "monthly", icon: TrendingUp },
    { label: "EOD Summary", value: "eod", icon: ClipboardList },
  ];

  useEffect(() => {
    registerTab("help", "Help", (
      <div className="flex flex-col gap-1.5">
        <Typography.Muted className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">Reports</Typography.Muted>
        {tabs.map((tab) => (
          <div key={tab.value} className="rounded-md border border-border/50 bg-card px-2.5 py-2">
            <Typography.Text className="text-xs font-medium">{tab.label}</Typography.Text>
            <Typography.Muted className="text-[10px] text-muted-foreground leading-tight mt-0.5">
              {tab.value === "daily" && "Today vs previous day, insights, forecast, P&L"}
              {tab.value === "weekly" && "Weekly breakdown with charts and trends"}
              {tab.value === "monthly" && "Full monthly analysis with all metrics"}
              {tab.value === "eod" && "Per-mechanic end-of-day summary"}
            </Typography.Muted>
          </div>
        ))}
      </div>
    ));
    registerTab("recent", "Recent", <RecentList items={[]} title="Recently Viewed" emptyMessage="Reports generated on demand" />);
  }, [registerTab]);

  // ── Render ─────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Header + Export */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Typography.H1 className="text-2xl font-semibold tracking-tight">Reports</Typography.H1>
          <Typography.Muted className="text-sm text-muted-foreground">
            {reportPeriodTitle(reportType, reportType === "monthly" ? month + "-01" : reportType === "weekly" ? weekStart : date)}
          </Typography.Muted>
        </div>
        <div className="flex items-center gap-2">
          {!isEod && r && r.total_revenue > 0 && (
            <ExportButton
              data={[{ metric: "Revenue", value: r.total_revenue }, { metric: "Work Orders", value: r.work_orders_completed }, { metric: "Services", value: r.services_count }, { metric: "Parts", value: r.parts_count }]}
              columns={[{ key: "metric", label: "Metric" }, { key: "value", label: "Value" }]}
              filename={`${reportType}-report-${dateFrom}.xlsx`}
              sheetName="Report"
            />
          )}
          <Button variant="outline" size="sm" onClick={() => { fetchReport(); fetchErpData(); }} disabled={loading}>
            <RefreshCw className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`} />Refresh
          </Button>
        </div>
      </div>

      {/* Tabs + Mechanic filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-0.5">
          {tabs.map((tab) => (
            <Button key={tab.value} onClick={() => setReportType(tab.value)} variant={reportType === tab.value ? "default" : "ghost"} size="sm" className="rounded-md">
              <tab.icon className="size-3.5" />{tab.label}
            </Button>
          ))}
        </div>
        <MechanicSelect value={selectedMechanic} onChange={setSelectedMechanic} mechanics={mechanics} placeholder="All Mechanics" size="default" />
      </div>

      {/* Date pickers */}
      <div className="flex flex-wrap items-center gap-3">
        <Calendar className="size-4 text-muted-foreground" />
        {(reportType === "daily" || reportType === "eod") && <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 w-auto" />}
        {reportType === "weekly" && <Input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} className="h-9 w-auto" />}
        {reportType === "monthly" && <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="h-9 w-auto" />}
      </div>

      {/* Error */}
      {error && !loading && (
        <Card className="border-red-200 bg-red-50/30 dark:border-red-800/30 dark:bg-red-950/10">
          <CardContent className="py-4"><Typography.Text className="text-sm text-red-600 dark:text-red-400">{error}</Typography.Text></CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((i) => <Card key={i}><CardHeader className="pb-2"><Skeleton className="h-4 w-28" /></CardHeader><CardContent><Skeleton className="h-8 w-24" /></CardContent></Card>)}</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((i) => <Card key={i}><CardHeader className="pb-2"><Skeleton className="h-4 w-28" /></CardHeader><CardContent><Skeleton className="h-8 w-24" /></CardContent></Card>)}</div>
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
      )}

      {/* ═══════════════════════ EOD ═══════════════════════ */}
      {!loading && isEod && eodReport && (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Total Work Orders" value={String(eodReport.total_work_orders)} icon={ClipboardList} />
            <KpiCard label="Total Revenue" value={formatCurrency(eodReport.total_revenue)} icon={DollarSign} subtitle={`${eodReport.mechanics.length} mechanic${eodReport.mechanics.length === 1 ? "" : "s"} active`} />
            <KpiCard label="Avg Revenue / WO" value={eodReport.total_work_orders > 0 ? formatCurrency(Math.round(eodReport.total_revenue / eodReport.total_work_orders)) : formatCurrency(0)} icon={TrendingUp} />
            <KpiCard label="Total Commission" value={formatCurrency(eodReport.total_commission ?? 0)} icon={Wallet} cls="text-emerald-600 dark:text-emerald-400" />
          </div>
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Per-Mechanic Breakdown</CardTitle>
              <ExportButton data={eodReport.mechanics.map((m) => ({ ...m, avg_per_wo: m.work_orders_completed > 0 ? Math.round(m.total_revenue / m.work_orders_completed) : 0 }))}
                columns={[{ key: "mechanic_name", label: "Mechanic" }, { key: "work_orders_completed", label: "Jobs" }, { key: "services_performed", label: "Services" }, { key: "parts_used", label: "Parts" }, { key: "total_revenue", label: "Revenue", format: "currency" }, { key: "total_commission", label: "Commission", format: "currency" }, { key: "avg_per_wo", label: "Avg/WO", format: "currency" }]}
                filename={`eod-${date}.xlsx`} sheetName="EOD" />
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">Mechanic</TableHead>
                  <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">Jobs</TableHead>
                  <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">Services</TableHead>
                  <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">Parts</TableHead>
                  <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">Revenue</TableHead>
                  <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">Commission</TableHead>
                  <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">Avg/WO</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {eodReport.mechanics.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No mechanics completed work today</TableCell></TableRow>
                  ) : eodReport.mechanics.map((m, i) => {
                    const avg = m.work_orders_completed > 0 ? Math.round(m.total_revenue / m.work_orders_completed) : 0;
                    return (
                      <TableRow key={m.mechanic_id} className={`border-b border-border hover:bg-muted/30 ${i === 0 ? "bg-muted/10" : ""}`}>
                        <TableCell className="px-4 py-3 font-medium">{m.mechanic_name}</TableCell>
                        <TableCell className="px-4 py-3 text-right tabular-nums">{m.work_orders_completed}</TableCell>
                        <TableCell className="px-4 py-3 text-right tabular-nums">{m.services_performed ?? 0}</TableCell>
                        <TableCell className="px-4 py-3 text-right tabular-nums">{m.parts_used ?? 0}</TableCell>
                        <TableCell className="px-4 py-3 text-right font-medium tabular-nums">{formatCurrency(m.total_revenue)}</TableCell>
                        <TableCell className="px-4 py-3 text-right tabular-nums">{m.total_commission != null ? <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(m.total_commission)}</span> : <span className="text-muted-foreground">&mdash;</span>}</TableCell>
                        <TableCell className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatCurrency(avg)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                {eodReport.mechanics.length > 0 && (
                  <TableFooter><TableRow className="bg-muted/30 font-semibold">
                    <TableCell className="px-4 py-3">Total</TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums">{eodReport.mechanics.reduce((s, m) => s + (m.work_orders_completed ?? 0), 0)}</TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums">{eodReport.mechanics.reduce((s, m) => s + (m.services_performed ?? 0), 0)}</TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums">{eodReport.mechanics.reduce((s, m) => s + (m.parts_used ?? 0), 0)}</TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums">{formatCurrency(eodReport.total_revenue)}</TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(eodReport.total_commission ?? 0)}</TableCell>
                    <TableCell className="px-4 py-3" />
                  </TableRow></TableFooter>
                )}
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════════════════ DAILY / WEEKLY / MONTHLY ═══════ */}
      {!loading && !isEod && report && (
        <div className="flex flex-col gap-6">
          {/* ── Row 0: Insights / Alerts ──────────────────── */}
          <InsightAlerts insights={insights} loading={erpLoading} />

          {/* ── Row 1: Core KPIs ─────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Work Orders" value={String(r?.work_orders_completed ?? 0)} icon={ClipboardList} delta={r?.comparison?.work_orders_change_pct}
              subtitle={r?.work_orders_completed ? `avg ${formatCurrency(Math.round((r?.total_revenue ?? 0) / r.work_orders_completed))}/WO` : undefined} />
            <KpiCard label="Services Sold" value={String(r?.services_count ?? 0)} icon={Wrench}
              subtitle={r?.services_count && r?.work_orders_completed ? `${Math.round((r.services_count / r.work_orders_completed) * 10) / 10}/WO` : undefined} />
            <KpiCard label="Revenue" value={formatCurrency(r?.total_revenue ?? 0)} icon={DollarSign} delta={r?.comparison?.revenue_change_pct} />
            <KpiCard label="Expenses" value={formatCurrency(expenses?.thisMonth ?? 0)} icon={Wallet}
              subtitle={expenses?.totalAmount ? `${formatCurrency(expenses.totalAmount)} all time` : undefined} />
          </div>

          {/* ── Row 2: Profitability ─────────────────────── */}
          {r?.profitability && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard label="Gross Profit" value={formatCurrency(r.profitability.gross_profit)} icon={TrendingUp}
                cls={r.profitability.gross_profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500"} />
              <KpiCard label="Margin" value={`${r.profitability.margin_percent}%`} icon={Percent}
                cls={r.profitability.margin_percent >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500"} />
              <KpiCard label="Eff. Labor Rate" value={formatCurrency(r.profitability.effective_labor_rate)} icon={Wrench} subtitle="per work order" />
              <KpiCard label="Parts:Labor" value={`${Math.round(r.profitability.parts_to_labor_ratio * 100)}%`} icon={BarChart3} subtitle="parts / labor" />
            </div>
          )}

          {/* ── Row 3: Forecast + Target ─────────────────── */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ForecastCard forecast={forecast} loading={erpLoading} />
            <TargetCard targets={targets} loading={erpLoading} />
          </div>

          {/* ── Row 4: Revenue Split + Profit Breakdown ──── */}
          <div className="grid gap-4 lg:grid-cols-2">
            {r?.profitability && <Donut serviceRevenue={r.profitability.service_revenue} partsRevenue={r.profitability.parts_revenue} />}
            {r?.profitability && r.profitability.total_cost > 0 && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Profit Breakdown</CardTitle></CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Service Revenue</span><span className="font-medium tabular-nums">{formatCurrency(r.profitability.service_revenue)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Service Cost</span><span className="tabular-nums text-red-500/80">-{formatCurrency(r.profitability.service_cost)}</span></div>
                  <div className="flex justify-between text-xs border-t border-border pt-1.5"><span className="text-muted-foreground">Parts Revenue</span><span className="font-medium tabular-nums">{formatCurrency(r.profitability.parts_revenue)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Parts Cost</span><span className="tabular-nums text-red-500/80">-{formatCurrency(r.profitability.parts_cost)}</span></div>
                  <div className="flex justify-between text-xs font-semibold border-t border-border pt-1.5">
                    <span>Gross Profit</span>
                    <span className={`tabular-nums ${r.profitability.gross_profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>{formatCurrency(r.profitability.gross_profit)}</span>
                  </div>
                  {r.total_revenue > 0 && expenses && (
                    <div className="flex justify-between text-xs font-semibold border-t border-border pt-1.5">
                      <span>Net Profit</span>
                      <span className={`tabular-nums ${r.total_revenue - expenses.thisMonth < 0 ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>{formatCurrency(r.total_revenue - expenses.thisMonth)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {!r?.profitability && r && expenses && (
              <Card>
                <CardHeader className="pb-2"><Typography.Muted className="text-xs font-medium text-muted-foreground">Net Profit</Typography.Muted></CardHeader>
                <CardContent>
                  <Typography.Text className={`text-2xl font-semibold tabular-nums ${r.total_revenue - expenses.thisMonth < 0 ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>{formatCurrency(r.total_revenue - expenses.thisMonth)}</Typography.Text>
                  <Typography.Muted className="text-xs text-muted-foreground mt-1">{formatCurrency(r.total_revenue)} revenue − {formatCurrency(expenses.thisMonth)} expenses</Typography.Muted>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Row 5: Charts ────────────────────────────── */}
          {reportType === "weekly" && <DailyRevenueChart data={dailyBreakdown} />}
          {reportType === "monthly" && monthlyDailyBreakdown.length > 0 && <DailyRevenueChart data={monthlyDailyBreakdown} />}
          {!selectedMechanic && r?.mechanic_kpis && r.mechanic_kpis.length > 0 && <MechanicBarChart kpis={r.mechanic_kpis} />}
          <ServiceBreakdownChart data={serviceBreakdown} loading={erpLoading} />

          {/* ── Row 6: Customer Retention + P&L ──────────── */}
          <div className="grid gap-4 lg:grid-cols-2">
            <RetentionCard data={retention} loading={erpLoading} />
            <PnLCard data={pnl} loading={erpLoading} />
          </div>

          {/* ── Row 7: Mechanic Table ────────────────────── */}
          {!selectedMechanic && r?.mechanic_kpis && r.mechanic_kpis.length > 0 && (
            <MechanicTable kpis={r.mechanic_kpis} exportCols={mechExportCols}
              exportFile={`mechanics-${reportType}-${reportType === "monthly" ? month : reportType === "weekly" ? weekStart : date}.xlsx`} />
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && !report && !error && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted"><BarChart3 className="size-7 text-muted-foreground" /></div>
            <div className="text-center">
              <Typography.H3 className="text-sm font-semibold">Select a report type</Typography.H3>
              <Typography.Muted className="mt-1 text-xs text-muted-foreground">Choose Daily, Weekly, Monthly, or End of Day to view your shop data.</Typography.Muted>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
