/**
 * Reports Page — ERP-grade business intelligence for auto service shops.
 *
 * Architecture: Thin orchestrator that wires hooks → components.
 * All UI lives in src/components/reports/. All data lives in React Query hooks.
 */
"use client";

import {
  BarChart3,
  Calendar,
  ClipboardList,
  type LucideIcon,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { subDays } from "date-fns";

import { Cell, Pie, PieChart as RechartsPieChart } from "recharts";
import { ExportButton } from "@/components/export-button";
import { MechanicSelect } from "@/components/mechanic-select";
import {
  DailyRevenueChart,
  ForecastCard,
  InsightAlerts,
  MechanicBarChart,
  MechanicTable,
  PnLCard,
  ReportKpiCard,
  RetentionCard,
  ServiceBreakdownChart,
  TargetCard,
} from "@/components/reports";
import { RecentList } from "@/components/sidebar-tabs/recent-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { DatePicker } from "@/components/ui/date-picker";
import { MonthPicker } from "@/components/ui/month-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";
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
import { Typography } from "@/components/ui/typography";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import type { ExportColumn } from "@/lib/export";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import {
  useMechanics,
  useReport,
  useReportForecast,
  useReportInsights,
  useReportPnl,
  useReportRetention,
  useReportServiceBreakdown,
  useReportTargets,
} from "@/lib/queries/use-reports";
import type {
  DailyReport,
  ReportComparison,
  ReportMechanicKpi,
  ReportProfitability,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────

type ReportType = "daily" | "weekly" | "monthly" | "custom" | "eod";

interface ReportData {
  work_orders_completed: number;
  services_count: number;
  parts_count: number;
  total_revenue: number;
  total_discounts: number;
  comparison: ReportComparison | null;
  profitability: ReportProfitability | null;
  mechanic_kpis: ReportMechanicKpi[];
  daily_breakdown?: DailyReport[];
  [key: string]: unknown;
}

interface EodReport {
  date: string;
  mechanics: Array<{
    mechanic_id: string;
    mechanic_name: string;
    work_orders_completed: number;
    services_performed: number;
    parts_used: number;
    total_revenue: number;
    total_commission?: number;
  }>;
  total_work_orders: number;
  total_revenue: number;
  total_commission?: number;
}

// ── Helpers ────────────────────────────────────────────────

function periodTitle(type: ReportType, date: string, dateTo?: string): string {
  if (type === "custom" && dateTo) {
    const fromDate = new Date(date);
    const toDate = new Date(dateTo);
    const formatD = (d: Date) =>
      d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    if (fromDate.toDateString() === toDate.toDateString()) {
      return formatD(fromDate);
    }
    return `${fromDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${formatD(toDate)}`;
  }
  const d = new Date(date);
  switch (type) {
    case "daily":
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    case "weekly": {
      const end = new Date(date);
      end.setDate(end.getDate() + 6);
      return `${new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    case "monthly":
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    case "eod":
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    default:
      return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
  }
}

function getDateRange(
  type: ReportType,
  date: string,
  weekStart: string,
  month: string,
) {
  if (type === "daily" || type === "eod") return { from: date, to: date };
  if (type === "weekly") {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    return { from: weekStart, to: end.toISOString().split("T")[0] };
  }
  const [y, m] = month.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return {
    from: `${month}-01`,
    to: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

// ── EOD Report View ───────────────────────────────────────

function EodView({ data }: { data: EodReport }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportKpiCard
          label="Total Work Orders"
          value={String(data.total_work_orders)}
          icon={ClipboardList}
        />
        <ReportKpiCard
          label="Total Revenue"
          value={formatCurrency(data.total_revenue)}
          icon={Wallet}
          subtitle={`${data.mechanics.length} mechanic${data.mechanics.length === 1 ? "" : "s"} active`}
        />
        <ReportKpiCard
          label="Avg Revenue / WO"
          value={
            data.total_work_orders > 0
              ? formatCurrency(
                  Math.round(data.total_revenue / data.total_work_orders),
                )
              : formatCurrency(0)
          }
          icon={TrendingUp}
        />
        <ReportKpiCard
          label="Total Commission"
          value={formatCurrency(data.total_commission ?? 0)}
          icon={Wallet}
          cls="text-emerald-600 dark:text-emerald-400"
        />
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold">
            Per-Mechanic Breakdown
          </CardTitle>
          <ExportButton
            data={data.mechanics}
            columns={[
              { key: "mechanic_name", label: "Mechanic" },
              { key: "work_orders_completed", label: "Jobs" },
              { key: "services_performed", label: "Services" },
              { key: "parts_used", label: "Parts" },
              { key: "total_revenue", label: "Revenue", format: "currency" },
              {
                key: "total_commission",
                label: "Commission",
                format: "currency",
              },
            ]}
            filename={`eod-${data.date}.xlsx`}
            sheetName="EOD"
          />
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Mechanic
                </TableHead>
                <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Jobs
                </TableHead>
                <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Services
                </TableHead>
                <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Parts
                </TableHead>
                <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Revenue
                </TableHead>
                <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Commission
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.mechanics.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No mechanics completed work today
                  </TableCell>
                </TableRow>
              ) : (
                data.mechanics.map((m, i) => (
                  <TableRow
                    key={m.mechanic_id}
                    className={`border-b border-border hover:bg-muted/30 ${i === 0 ? "bg-muted/10" : ""}`}
                  >
                    <TableCell className="px-4 py-3 font-medium">
                      {m.mechanic_name}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums">
                      {m.work_orders_completed}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums">
                      {m.services_performed ?? 0}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums">
                      {m.parts_used ?? 0}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatCurrency(m.total_revenue)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums">
                      {m.total_commission != null ? (
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(m.total_commission)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">&mdash;</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {data.mechanics.length > 0 && (
              <TableFooter>
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell className="px-4 py-3">Total</TableCell>
                  <TableCell className="px-4 py-3 text-right tabular-nums">
                    {data.mechanics.reduce(
                      (s, m) => s + m.work_orders_completed,
                      0,
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right tabular-nums">
                    {data.mechanics.reduce(
                      (s, m) => s + (m.services_performed ?? 0),
                      0,
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right tabular-nums">
                    {data.mechanics.reduce(
                      (s, m) => s + (m.parts_used ?? 0),
                      0,
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(data.total_revenue)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(data.total_commission ?? 0)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Reports Page ─────────────────────────────────────

export default function ReportsPage() {
  // ── State ────────────────────────────────────────────
  const [mechanicFilter, setMechanicFilter] = useState("");
  const [reportType, setReportType] = useState<ReportType>("daily");
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1);
    return d.toISOString().split("T")[0];
  });
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [customRange, setCustomRange] = useState<DateRange | undefined>(() => ({
    from: subDays(new Date(), 6),
    to: new Date(),
  }));

  // ── Init: get org ID ─────────────────────────────────
  const { data: orgInfo } = useCurrentOrg();
  const orgId = orgInfo?.orgId ?? "";

  // ── Derived params ───────────────────────────────────
  const isEod = reportType === "eod";

  const customFromStr = useMemo(() => {
    if (!customRange?.from) return new Date().toISOString().split("T")[0];
    const y = customRange.from.getFullYear();
    const m = String(customRange.from.getMonth() + 1).padStart(2, "0");
    const d = String(customRange.from.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [customRange?.from]);

  const customToStr = useMemo(() => {
    const toDate = customRange?.to || customRange?.from || new Date();
    const y = toDate.getFullYear();
    const m = String(toDate.getMonth() + 1).padStart(2, "0");
    const d = String(toDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [customRange?.to, customRange?.from]);

  const dateParam =
    reportType === "monthly"
      ? `${month}-01`
      : reportType === "weekly"
        ? weekStart
        : reportType === "custom"
          ? customFromStr
          : date;

  const { from: dateFrom, to: dateTo } = useMemo(() => {
    if (reportType === "custom") {
      return { from: customFromStr, to: customToStr };
    }
    return getDateRange(reportType, date, weekStart, month);
  }, [reportType, date, weekStart, month, customFromStr, customToStr]);

  const periodType =
    reportType === "daily"
      ? "daily"
      : reportType === "weekly"
        ? "weekly"
        : reportType === "monthly"
          ? "monthly"
          : "daily";

  // ── Data hooks ───────────────────────────────────────
  const reportQ = useReport(orgId, reportType, {
    date: dateParam,
    ...(reportType === "custom"
      ? { date_from: dateFrom, date_to: dateTo }
      : {}),
    ...(mechanicFilter ? { mechanic: mechanicFilter } : {}),
  });
  const mechanicsQ = useMechanics(orgId);
  const insightsQ = useReportInsights(orgId, dateFrom, dateTo, !isEod);
  const forecastQ = useReportForecast(orgId, periodType, dateParam, !isEod);
  const targetsQ = useReportTargets(orgId, periodType, date, !isEod);
  const retentionQ = useReportRetention(orgId, dateFrom, dateTo, !isEod);
  const pnlQ = useReportPnl(orgId, dateFrom, dateTo, !isEod);
  const serviceBdQ = useReportServiceBreakdown(orgId, dateFrom, dateTo, !isEod);

  const loading = reportQ.isLoading;
  const erpLoading = insightsQ.isLoading;
  const report = reportQ.data as ReportData | null;
  const eodReport = reportQ.data as EodReport | null;

  // ── Sidebar ──────────────────────────────────────────
  const { registerTab } = useRightSidebar();

  // ── Sidebar ──────────────────────────────────────────
  useEffect(() => {
    registerTab(
      "help",
      "Help",
      <div className="flex flex-col gap-1.5">
        <Typography.Muted className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
          Reports
        </Typography.Muted>
        {(["Daily", "Weekly", "Monthly", "EOD Summary"] as const).map(
          (label) => (
            <div
              key={label}
              className="rounded-md border border-border/50 bg-card px-2.5 py-2"
            >
              <Typography.Text className="text-xs font-medium">
                {label}
              </Typography.Text>
            </div>
          ),
        )}
      </div>,
    );
    registerTab(
      "recent",
      "Recent",
      <RecentList
        items={[]}
        title="Recently Viewed"
        emptyMessage="Reports generated on demand"
      />,
    );
  }, [registerTab]);

  // ── Derived data ─────────────────────────────────────
  const r = report;
  const mechExportCols: ExportColumn<ReportMechanicKpi>[] = [
    { key: "mechanic_name", label: "Mechanic" },
    { key: "work_orders_completed", label: "Jobs" },
    { key: "services_count", label: "Services" },
    { key: "parts_count", label: "Parts" },
    { key: "total_revenue", label: "Revenue", format: "currency" },
    { key: "avg_revenue_per_wo", label: "Avg/WO", format: "currency" },
  ];

  const dailyBreakdown = useMemo(() => {
    if (reportType !== "weekly" || !report?.daily_breakdown) return [];
    return (report.daily_breakdown as DailyReport[]).map((d) => ({
      date: d.date,
      revenue: Number(d.total_revenue ?? 0),
      label: new Date(d.date).toLocaleDateString("en-US", { weekday: "short" }),
    }));
  }, [report, reportType]);

  const monthlyBreakdown = useMemo(() => {
    if (reportType !== "monthly") return [];
    const wb = (report as Record<string, unknown>)?.weekly_breakdown;
    if (!Array.isArray(wb)) return [];
    const points: Array<{ date: string; revenue: number; label: string }> = [];
    for (const week of wb) {
      const bd = (week as Record<string, unknown>).daily_breakdown;
      if (!Array.isArray(bd)) continue;
      for (const day of bd) {
        const d = day as Record<string, unknown>;
        points.push({
          date: d.date as string,
          revenue: Number(d.total_revenue ?? 0),
          label: String(new Date(d.date as string).getDate()),
        });
      }
    }
    return points;
  }, [report, reportType]);

  const mechanics = useMemo(
    () =>
      (mechanicsQ.data ?? []).map((m) => ({
        id: m.id,
        fullName: m.full_name ?? null,
        email: "",
      })),
    [mechanicsQ.data],
  );

  const tabs: { label: string; value: ReportType; icon: LucideIcon }[] = [
    { label: "Daily", value: "daily", icon: Calendar },
    { label: "Weekly", value: "weekly", icon: BarChart3 },
    { label: "Monthly", value: "monthly", icon: TrendingUp },
    { label: "Custom Range", value: "custom", icon: Calendar },
    { label: "EOD Summary", value: "eod", icon: ClipboardList },
  ];

  // ── Render ───────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Typography.H1 className="text-2xl font-semibold tracking-tight">
            Reports
          </Typography.H1>
          <Typography.Muted className="text-sm text-muted-foreground">
            {periodTitle(
              reportType,
              reportType === "monthly"
                ? `${month}-01`
                : reportType === "weekly"
                  ? weekStart
                  : reportType === "custom"
                    ? customFromStr
                    : date,
              dateTo,
            )}
          </Typography.Muted>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => reportQ.refetch()}
          disabled={loading}
        >
          <RefreshCw
            className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Tabs + Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-0.5">
          {tabs.map((tab) => (
            <Button
              key={tab.value}
              onClick={() => setReportType(tab.value)}
              variant={reportType === tab.value ? "default" : "ghost"}
              size="sm"
              className="rounded-md"
            >
              <tab.icon className="size-3.5" />
              {tab.label}
            </Button>
          ))}
        </div>
        <MechanicSelect
          value={mechanicFilter}
          onChange={setMechanicFilter}
          mechanics={mechanics}
          placeholder="All Mechanics"
          size="default"
        />
      </div>

      {/* Date pickers */}
      <div className="flex flex-wrap items-center gap-3">
        <Calendar className="size-4 text-muted-foreground" />
        {(reportType === "daily" || reportType === "eod") && (
          <DatePicker
            value={date ? new Date(date) : undefined}
            onChange={(d) => {
              if (d) {
                const year = d.getFullYear();
                const monthStr = String(d.getMonth() + 1).padStart(2, "0");
                const dayStr = String(d.getDate()).padStart(2, "0");
                setDate(`${year}-${monthStr}-${dayStr}`);
              }
            }}
            className="w-[180px]"
          />
        )}
        {reportType === "weekly" && (
          <DatePicker
            value={weekStart ? new Date(weekStart) : undefined}
            onChange={(d) => {
              if (d) {
                const dateCopy = new Date(d);
                const day = dateCopy.getDay();
                const diff = dateCopy.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(dateCopy.setDate(diff));
                const year = monday.getFullYear();
                const monthStr = String(monday.getMonth() + 1).padStart(2, "0");
                const dayStr = String(monday.getDate()).padStart(2, "0");
                setWeekStart(`${year}-${monthStr}-${dayStr}`);
              }
            }}
            className="w-[180px]"
          />
        )}
        {reportType === "monthly" && (
          <MonthPicker
            value={month}
            onChange={setMonth}
            className="w-[180px]"
          />
        )}
        {reportType === "custom" && (
          <DateRangePicker
            value={customRange}
            onChange={setCustomRange}
            className="w-[260px]"
          />
        )}
      </div>

      {/* Error */}
      {reportQ.isError && (
        <Card className="border-red-200 bg-red-50/30 dark:border-red-800/30 dark:bg-red-950/10">
          <CardContent className="py-4">
            <Typography.Text className="text-sm text-red-600 dark:text-red-400">
              {reportQ.error.message}
            </Typography.Text>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-28" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-28" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
      )}

      {/* ═══ EOD ═════════════════════════════════════════ */}
      {!loading && isEod && eodReport && <EodView data={eodReport} />}

      {/* ═══ DAILY / WEEKLY / MONTHLY ════════════════════ */}
      {!loading && !isEod && report && (
        <div className="flex flex-col gap-6">
          <InsightAlerts insights={insightsQ.data ?? []} loading={erpLoading} />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ReportKpiCard
              label="Work Orders"
              value={String(r?.work_orders_completed ?? 0)}
              icon={ClipboardList}
              delta={r?.comparison?.work_orders_change_pct}
              subtitle={
                r?.work_orders_completed
                  ? `avg ${formatCurrency(Math.round((r?.total_revenue ?? 0) / r.work_orders_completed))}/WO`
                  : undefined
              }
            />
            <ReportKpiCard
              label="Services Sold"
              value={String(r?.services_count ?? 0)}
              icon={Wallet}
              subtitle={
                r?.services_count && r?.work_orders_completed
                  ? `${Math.round((r.services_count / r.work_orders_completed) * 10) / 10}/WO`
                  : undefined
              }
            />
            <ReportKpiCard
              label="Revenue"
              value={formatCurrency(r?.total_revenue ?? 0)}
              icon={Wallet}
              delta={r?.comparison?.revenue_change_pct}
            />
            <ReportKpiCard
              label="Expenses"
              value={formatCurrency(0)}
              icon={Wallet}
              subtitle="connect expense data"
            />
          </div>

          {r?.profitability && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ReportKpiCard
                label="Gross Profit"
                value={formatCurrency(r.profitability.gross_profit)}
                icon={TrendingUp}
                cls={
                  r.profitability.gross_profit >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-500"
                }
              />
              <ReportKpiCard
                label="Margin"
                value={`${r.profitability.margin_percent}%`}
                icon={BarChart3}
                cls={
                  r.profitability.margin_percent >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-500"
                }
              />
              <ReportKpiCard
                label="Eff. Labor Rate"
                value={formatCurrency(r.profitability.effective_labor_rate)}
                icon={Wallet}
                subtitle="per work order"
              />
              <ReportKpiCard
                label="Parts:Labor"
                value={`${Math.round(r.profitability.parts_to_labor_ratio * 100)}%`}
                icon={BarChart3}
                subtitle="parts / labor"
              />
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <ForecastCard
              forecast={forecastQ.data ?? null}
              loading={erpLoading}
            />
            <TargetCard targets={targetsQ.data ?? []} loading={erpLoading} />
          </div>

          {r?.profitability && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    Revenue Split
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <ChartContainer
                      config={{
                        services: {
                          label: "Services",
                          color: "var(--chart-1)",
                        },
                        parts: { label: "Parts", color: "var(--chart-2)" },
                      }}
                      className="h-[140px] w-[140px]"
                    >
                      <RechartsPieChart>
                        <Pie
                          data={[
                            {
                              name: "Services",
                              value: r.profitability.service_revenue,
                            },
                            {
                              name: "Parts",
                              value: r.profitability.parts_revenue,
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          <Cell fill="var(--chart-1)" />
                          <Cell fill="var(--chart-2)" />
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </RechartsPieChart>
                    </ChartContainer>
                    <div className="flex flex-col gap-2">
                      {[
                        {
                          name: "Services",
                          value: r.profitability.service_revenue,
                          color: "var(--chart-1)",
                        },
                        {
                          name: "Parts",
                          value: r.profitability.parts_revenue,
                          color: "var(--chart-2)",
                        },
                      ].map((item) => {
                        const total =
                          r.profitability!.service_revenue +
                          r.profitability!.parts_revenue;
                        return (
                          <div
                            key={item.name}
                            className="flex items-center gap-2"
                          >
                            <div
                              className="size-2.5 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-xs text-muted-foreground">
                              {item.name}
                            </span>
                            <span className="text-xs font-medium tabular-nums">
                              {formatCurrency(item.value)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              ({Math.round((item.value / total) * 100)}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    Profit Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Service Revenue
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(r.profitability.service_revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Service Cost</span>
                    <span className="tabular-nums text-red-500/80">
                      -{formatCurrency(r.profitability.service_cost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-border pt-1.5">
                    <span className="text-muted-foreground">Parts Revenue</span>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(r.profitability.parts_revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Parts Cost</span>
                    <span className="tabular-nums text-red-500/80">
                      -{formatCurrency(r.profitability.parts_cost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold border-t border-border pt-1.5">
                    <span>Gross Profit</span>
                    <span
                      className={`tabular-nums ${r.profitability.gross_profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}
                    >
                      {formatCurrency(r.profitability.gross_profit)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {reportType === "weekly" && dailyBreakdown.length > 0 && (
            <DailyRevenueChart data={dailyBreakdown} />
          )}
          {reportType === "monthly" && monthlyBreakdown.length > 0 && (
            <DailyRevenueChart data={monthlyBreakdown} />
          )}
          {!mechanicFilter &&
            r?.mechanic_kpis &&
            r.mechanic_kpis.length > 0 && (
              <MechanicBarChart kpis={r.mechanic_kpis} />
            )}
          <ServiceBreakdownChart
            data={serviceBdQ.data ?? []}
            loading={erpLoading}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <RetentionCard
              data={retentionQ.data ?? null}
              loading={erpLoading}
            />
            <PnLCard data={pnlQ.data ?? null} loading={erpLoading} />
          </div>

          {!mechanicFilter &&
            r?.mechanic_kpis &&
            r.mechanic_kpis.length > 0 && (
              <MechanicTable
                kpis={r.mechanic_kpis}
                exportCols={mechExportCols}
                exportFile={`mechanics-${reportType}-${dateParam}.xlsx`}
              />
            )}
        </div>
      )}

      {/* Empty state */}
      {!loading && !report && !reportQ.isError && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <BarChart3 className="size-7 text-muted-foreground" />
            </div>
            <div className="text-center">
              <Typography.H3 className="text-sm font-semibold">
                Select a report type
              </Typography.H3>
              <Typography.Muted className="mt-1 text-xs text-muted-foreground">
                Choose Daily, Weekly, Monthly, or End of Day to view your shop
                data.
              </Typography.Muted>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
