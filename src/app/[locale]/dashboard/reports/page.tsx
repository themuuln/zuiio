/**
 * Reports Page — ERP-grade business intelligence for auto service shops.
 *
 * Architecture: Thin orchestrator that wires hooks → components.
 * All UI lives in src/components/reports/. All data lives in React Query hooks.
 */
"use client";

import { subDays } from "date-fns";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  ClipboardList,
  type LucideIcon,
  RefreshCw,
  TrendingUp,
  Trophy,
  Wallet,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Cell, Pie, PieChart as RechartsPieChart } from "recharts";
import { BranchSelect } from "@/components/branch-select";
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
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { MonthPicker } from "@/components/ui/month-picker";
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
import { useBranches } from "@/lib/queries/use-branches";
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

function periodTitle(
  type: ReportType,
  date: string,
  dateTo?: string,
  loc: string = "mn",
): string {
  if (type === "custom" && dateTo) {
    const fromDate = new Date(date);
    const toDate = new Date(dateTo);
    const formatD = (d: Date) =>
      d.toLocaleDateString(loc, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    if (fromDate.toDateString() === toDate.toDateString())
      return formatD(fromDate);
    return `${fromDate.toLocaleDateString(loc, { month: "short", day: "numeric" })} – ${formatD(toDate)}`;
  }
  const d = new Date(date);
  const opts: Intl.DateTimeFormatOptions =
    type === "monthly"
      ? { month: "long", year: "numeric" }
      : type === "weekly"
        ? { month: "short", day: "numeric", year: "numeric" }
        : { weekday: "long", month: "long", day: "numeric", year: "numeric" };
  return d.toLocaleDateString(loc, opts);
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

function EodView({ data, t }: { data: EodReport; t: (key: string) => string }) {
  const bestMechanic =
    data.mechanics.length > 0
      ? data.mechanics.reduce((a, b) =>
          a.total_revenue > b.total_revenue ? a : b,
        )
      : null;

  const avgRevenuePerWo =
    data.total_work_orders > 0
      ? Math.round(data.total_revenue / data.total_work_orders)
      : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Dashboard-style KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportKpiCard
          label={t("reports.totalRevenueLabel")}
          value={formatCurrency(data.total_revenue)}
          icon={Wallet}
          subtitle={`${data.mechanics.length} ${t("reports.mechanic")}`}
          cls="text-emerald-600 dark:text-emerald-400"
        />
        <ReportKpiCard
          label={t("reports.totalWorkOrders")}
          value={String(data.total_work_orders)}
          icon={CheckCircle2}
          cls="text-blue-600 dark:text-blue-400"
          subtitle={`${t("reports.avgRevenuePerWo")}: ${formatCurrency(avgRevenuePerWo)}`}
        />
        <ReportKpiCard
          label={t("reports.commission")}
          value={formatCurrency(data.total_commission ?? 0)}
          icon={BarChart3}
          subtitle={`${t("reports.avgRevenuePerWo")}: ${formatCurrency(Math.round((data.total_commission ?? 0) / Math.max(data.total_work_orders, 1)))}`}
        />
        <ReportKpiCard
          label={
            bestMechanic
              ? bestMechanic.mechanic_name
              : t("reports.bestMechanic")
          }
          value={
            bestMechanic
              ? formatCurrency(bestMechanic.total_revenue)
              : formatCurrency(0)
          }
          icon={Trophy}
          cls="text-amber-600 dark:text-amber-400"
          subtitle={
            bestMechanic
              ? `${bestMechanic.work_orders_completed} ${t("reports.jobs")}`
              : undefined
          }
        />
      </div>

      {/* Per-mechanic breakdown card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold">
            {t("reports.perMechanicBreakdown")}
          </CardTitle>
          <ExportButton
            data={data.mechanics}
            columns={[
              { key: "mechanic_name", label: t("reports.mechanic") },
              { key: "work_orders_completed", label: t("reports.jobs") },
              { key: "services_performed", label: t("reports.services") },
              { key: "parts_used", label: t("reports.parts") },
              {
                key: "total_revenue",
                label: t("reports.revenue"),
                format: "currency" as const,
              },
              {
                key: "total_commission",
                label: t("reports.commission"),
                format: "currency" as const,
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
                  {t("reports.mechanic")}
                </TableHead>
                <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                  {t("reports.jobs")}
                </TableHead>
                <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                  {t("reports.services")}
                </TableHead>
                <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                  {t("reports.parts")}
                </TableHead>
                <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                  {t("reports.revenue")}
                </TableHead>
                <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                  {t("reports.commission")}
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
                    {t("reports.noMechanicsCompletedWork")}
                  </TableCell>
                </TableRow>
              ) : (
                data.mechanics.map((m, i) => (
                  <TableRow
                    key={m.mechanic_id}
                    className={`border-b border-border hover:bg-muted/30 ${i === 0 ? "bg-muted/10" : ""} ${bestMechanic && m.mechanic_id === bestMechanic.mechanic_id ? "bg-amber-50/30 dark:bg-amber-950/10" : ""}`}
                  >
                    <TableCell className="px-4 py-3 font-medium">
                      {i === 0 && bestMechanic ? (
                        <span className="inline-flex items-center gap-1.5">
                          {m.mechanic_name}
                          <Trophy className="size-3.5 text-amber-500" />
                        </span>
                      ) : (
                        m.mechanic_name
                      )}
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
                  <TableCell className="px-4 py-3">
                    {t("reports.total")}
                  </TableCell>
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
  const t = useTranslations("reports");
  const locale = useLocale();
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
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");

  // ── Init: get org ID ─────────────────────────────────
  const { data: orgInfo } = useCurrentOrg();
  const orgId = orgInfo?.orgId ?? "";
  const branchFilter = selectedBranchId === "all" ? null : selectedBranchId;
  const branchesQ = useBranches(orgId);

  useEffect(() => {
    const branches = branchesQ.data ?? [];
    if (selectedBranchId === "all") {
      if (branches.length === 1) {
        setSelectedBranchId(branches[0].id);
      }
      return;
    }

    const branchStillExists = branches.some(
      (branch) => branch.id === selectedBranchId,
    );
    if (!branchStillExists) {
      setSelectedBranchId("all");
    }
  }, [branchesQ.data, selectedBranchId]);

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
  const reportQ = useReport(
    orgId,
    reportType,
    {
      date: dateParam,
      ...(reportType === "custom"
        ? { date_from: dateFrom, date_to: dateTo }
        : {}),
      ...(mechanicFilter ? { mechanic: mechanicFilter } : {}),
    },
    branchFilter,
  );
  const mechanicsQ = useMechanics(orgId, branchFilter);
  const insightsQ = useReportInsights(
    orgId,
    dateFrom,
    dateTo,
    !isEod,
    branchFilter,
  );
  const forecastQ = useReportForecast(
    orgId,
    periodType,
    dateParam,
    !isEod,
    branchFilter,
  );
  const targetsQ = useReportTargets(
    orgId,
    periodType,
    date,
    !isEod,
    branchFilter,
  );
  const retentionQ = useReportRetention(
    orgId,
    dateFrom,
    dateTo,
    !isEod,
    branchFilter,
  );
  const pnlQ = useReportPnl(orgId, dateFrom, dateTo, !isEod, branchFilter);
  const serviceBdQ = useReportServiceBreakdown(
    orgId,
    dateFrom,
    dateTo,
    !isEod,
    branchFilter,
  );

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
      label: new Date(d.date).toLocaleDateString(locale, { weekday: "short" }),
    }));
  }, [report, reportType, locale]);

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

  useEffect(() => {
    if (!mechanicFilter) return;

    const mechanicStillAvailable = mechanics.some(
      (mechanic) => mechanic.id === mechanicFilter,
    );
    if (!mechanicStillAvailable) {
      setMechanicFilter("");
    }
  }, [mechanicFilter, mechanics]);

  const tabs: { label: string; value: ReportType; icon: LucideIcon }[] = [
    { label: t("daily"), value: "daily", icon: Calendar },
    { label: t("weekly"), value: "weekly", icon: BarChart3 },
    { label: t("monthly"), value: "monthly", icon: TrendingUp },
    { label: t("customRange"), value: "custom", icon: Calendar },
    { label: t("eodSummary"), value: "eod", icon: ClipboardList },
  ];

  // ── Render ───────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Typography.H1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
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
              locale,
            )}
          </Typography.Muted>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void Promise.all([
              reportQ.refetch(),
              insightsQ.refetch(),
              forecastQ.refetch(),
              targetsQ.refetch(),
              retentionQ.refetch(),
              pnlQ.refetch(),
              serviceBdQ.refetch(),
            ]);
          }}
          disabled={loading}
        >
          <RefreshCw
            className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`}
          />
          {t("refresh")}
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <BranchSelect
            value={selectedBranchId}
            onChange={setSelectedBranchId}
            branches={branchesQ.data ?? []}
            placeholder={t("branch")}
            allLabel={t("allBranches")}
            className="min-w-44"
          />
          <MechanicSelect
            value={mechanicFilter}
            onChange={setMechanicFilter}
            mechanics={mechanics}
            placeholder={t("allMechanics")}
            size="default"
          />
        </div>
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
              "Couldn't load reports. Try again."
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
      {!loading && isEod && eodReport && <EodView data={eodReport} t={t} />}

      {/* ═══ DAILY / WEEKLY / MONTHLY ════════════════════ */}
      {!loading && !isEod && report && (
        <div className="flex flex-col gap-6">
          <InsightAlerts insights={insightsQ.data ?? []} loading={erpLoading} />

          {/* ── #68: Comparison period column — computed deltas + prev period values ── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ReportKpiCard
              label={t("workOrders")}
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
              label={t("servicesSold")}
              value={String(r?.services_count ?? 0)}
              icon={Wallet}
              subtitle={
                r?.services_count && r?.work_orders_completed
                  ? `${Math.round((r.services_count / r.work_orders_completed) * 10) / 10}/WO`
                  : undefined
              }
              delta={
                r?.comparison?.services_count != null &&
                (r?.services_count ?? 0) > 0 &&
                r.comparison.services_count > 0
                  ? Math.round(
                      (((r?.services_count ?? 0) -
                        r.comparison.services_count) /
                        r.comparison.services_count) *
                        1000,
                    ) / 10
                  : null
              }
            />
            <ReportKpiCard
              label={t("revenue")}
              value={formatCurrency(r?.total_revenue ?? 0)}
              icon={Wallet}
              delta={r?.comparison?.revenue_change_pct}
              subtitle={
                r?.comparison?.total_revenue != null
                  ? `prev: ${formatCurrency(r.comparison.total_revenue)}`
                  : undefined
              }
            />
            <ReportKpiCard
              label={t("expenses")}
              value={formatCurrency(0)}
              icon={Wallet}
              subtitle="connect expense data"
            />
          </div>

          {r?.profitability && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ReportKpiCard
                label={t("grossProfit")}
                value={formatCurrency(r.profitability.gross_profit)}
                icon={TrendingUp}
                cls={
                  r.profitability.gross_profit >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-500"
                }
              />
              <ReportKpiCard
                label={t("margin")}
                value={`${r.profitability.margin_percent}%`}
                icon={BarChart3}
                cls={
                  r.profitability.margin_percent >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-500"
                }
              />
              <ReportKpiCard
                label={t("effLaborRate")}
                value={formatCurrency(r.profitability.effective_labor_rate)}
                icon={Wallet}
                subtitle="per work order"
              />
              <ReportKpiCard
                label={t("partsToLabor")}
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
                    {t("revenueSplit")}
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
                          (r?.profitability?.service_revenue ?? 0) +
                          (r?.profitability?.parts_revenue ?? 0);
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
                    {t("profitBreakdown")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {t("serviceRevenue")}
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(r.profitability.service_revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {t("serviceCost")}
                    </span>
                    <span className="tabular-nums text-red-500/80">
                      -{formatCurrency(r.profitability.service_cost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-border pt-1.5">
                    <span className="text-muted-foreground">
                      {t("partsRevenue")}
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(r.profitability.parts_revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {t("partsCost")}
                    </span>
                    <span className="tabular-nums text-red-500/80">
                      -{formatCurrency(r.profitability.parts_cost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold border-t border-border pt-1.5">
                    <span>{t("grossProfit")}</span>
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
                comparison={r?.comparison}
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
                {t("title")}
              </Typography.H3>
              <Typography.Muted className="mt-1 text-xs text-muted-foreground">
                {t("subtitle")}
              </Typography.Muted>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
