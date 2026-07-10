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
  ClipboardList,
  DollarSign,
  type LucideIcon,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type KeyboardEvent, useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Cell, Pie, PieChart as RechartsPieChart } from "recharts";
import { BranchSelect } from "@/components/branch-select";
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
import { Typography } from "@/components/ui/typography";
import { useSelectedBranchGuard } from "@/hooks/use-selected-branch-guard";
import type { ExportColumn } from "@/lib/export";
import { useBranches } from "@/lib/queries/use-branches";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import {
  useMechanics,
  useReport,
  useReportFinanceSummary,
  useReportForecast,
  useReportInsights,
  useReportPnl,
  useReportRetention,
  useReportServiceBreakdown,
  useReportTargets,
} from "@/lib/queries/use-reports";
import { useSelectedBranchId, useSetSelectedBranchId } from "@/lib/stores";
import type { DailyReport, ReportMechanicKpi } from "@/lib/types";
import { cn, formatCurrency, hasMultipleBranches } from "@/lib/utils";
import { EodView } from "./_eod-view";
import type { EodReport, ReportData, ReportType } from "./_helpers";
import { getDateRange, periodTitle } from "./_helpers";

// ── Main Reports Page ─────────────────────────────────────
interface FinanceSummary {
  revenue: { total: number; by_method: Record<string, number> };
  expenses: { total: number; by_category: Record<string, number> };
  refunds: { total: number };
  net_profit: number;
}

export default function ReportsPage() {
  const t = useTranslations("reports");
  const locale = useLocale();
  // ── State ────────────────────────────────────────────
  const [mechanicFilter, setMechanicFilter] = useState("");
  const [reportType, setReportType] = useState<ReportType>("daily");
  const [financePeriod, setFinancePeriod] = useState<
    "day" | "week" | "month" | "year"
  >("month");

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
  const selectedBranchId = useSelectedBranchId();
  const setSelectedBranchId = useSetSelectedBranchId();

  // ── Init: get org ID ─────────────────────────────────
  const { data: orgInfo } = useCurrentOrg();
  const orgId = orgInfo?.orgId ?? "";
  const branchFilter = selectedBranchId === "all" ? null : selectedBranchId;
  const branchesQ = useBranches(orgId);
  const branches = branchesQ.data ?? [];
  useSelectedBranchGuard(orgId);

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
  const financeQ = useReportFinanceSummary(orgId, financePeriod);
  const financeSummary = financeQ.data as FinanceSummary | undefined;

  const loading = reportQ.isPending;
  const erpLoading = insightsQ.isPending;
  const report = reportQ.data as ReportData | null;
  const eodReport = reportQ.data as EodReport | null;

  // ── Sidebar ──────────────────────────────────────────

  // ── Sidebar ──────────────────────────────────────────
  // ── Derived data ─────────────────────────────────────
  const r = report;
  const mechExportCols: ExportColumn<ReportMechanicKpi>[] = [
    { key: "mechanic_name", label: t("mechanic") },
    { key: "work_orders_completed", label: t("jobs") },
    { key: "services_count", label: t("services") },
    { key: "parts_count", label: t("parts") },
    { key: "total_revenue", label: t("revenue"), format: "currency" },
    { key: "avg_revenue_per_wo", label: t("avgPerWo"), format: "currency" },
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
    { label: "Finance", value: "finance", icon: DollarSign },
  ];

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    let nextIndex = currentIndex;

    switch (event.key) {
      case "ArrowRight":
        nextIndex = (currentIndex + 1) % tabs.length;
        break;
      case "ArrowLeft":
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    setReportType(nextTab.value);

    requestAnimationFrame(() => {
      document.getElementById(`reports-tab-${nextTab.value}`)?.focus();
    });
  };

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
          aria-label={t("refresh")}
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
            aria-hidden="true"
          />
          {t("refresh")}
        </Button>
      </div>

      {/* Tabs + Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label={t("title")}
          className="flex flex flex-wrap gap-1 rounded-lg border border-border bg-card p-0.5"
        >
          {tabs.map((tab, index) => {
            const isActive = reportType === tab.value;

            return (
              <Button
                key={tab.value}
                id={`reports-tab-${tab.value}`}
                role="tab"
                type="button"
                aria-selected={isActive}
                aria-controls={`reports-panel-${tab.value}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setReportType(tab.value)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className="rounded-md"
              >
                <tab.icon className="size-3.5" aria-hidden="true" />
                {tab.label}
              </Button>
            );
          })}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {hasMultipleBranches(branches) && (
            <BranchSelect
              value={selectedBranchId}
              onChange={setSelectedBranchId}
              branches={branches}
              placeholder={t("branch")}
              allLabel={t("allBranches")}
              className="min-w-44"
            />
          )}
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
        <Calendar className="size-4 text-muted-foreground" aria-hidden="true" />
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
              {t("errorLoading")}
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
      {!loading && isEod && eodReport && (
        <div
          id="reports-panel-eod"
          role="tabpanel"
          aria-labelledby="reports-tab-eod"
        >
          <EodView data={eodReport} t={t} />
        </div>
      )}

      {/* ═══ DAILY / WEEKLY / MONTHLY ════════════════════ */}
      {!loading && !isEod && reportType !== "finance" && report && (
        <div
          id={`reports-panel-${reportType}`}
          role="tabpanel"
          aria-labelledby={`reports-tab-${reportType}`}
          className="flex flex-col gap-6"
        >
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
                  ? t("averagePerWorkOrder", {
                      value: formatCurrency(
                        Math.round(
                          (r?.total_revenue ?? 0) / r.work_orders_completed,
                        ),
                      ),
                    })
                  : undefined
              }
            />
            <ReportKpiCard
              label={t("servicesSold")}
              value={String(r?.services_count ?? 0)}
              icon={Wallet}
              subtitle={
                r?.services_count && r?.work_orders_completed
                  ? t("servicesPerWorkOrder", {
                      value:
                        Math.round(
                          (r.services_count / r.work_orders_completed) * 10,
                        ) / 10,
                    })
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
                  ? t("previousRevenue", {
                      value: formatCurrency(r.comparison.total_revenue),
                    })
                  : undefined
              }
            />
            <ReportKpiCard
              label={t("expenses")}
              value={formatCurrency(0)}
              icon={Wallet}
              subtitle={t("connectExpenseData")}
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
                subtitle={t("perWorkOrder")}
              />
              <ReportKpiCard
                label={t("partsToLabor")}
                value={`${Math.round(r.profitability.parts_to_labor_ratio * 100)}%`}
                icon={BarChart3}
                subtitle={t("partsOverLabor")}
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
                          label: t("services"),
                          color: "var(--chart-1)",
                        },
                        parts: { label: t("parts"), color: "var(--chart-2)" },
                      }}
                      className="h-[140px] w-[140px]"
                    >
                      <RechartsPieChart>
                        <Pie
                          data={[
                            {
                              name: t("services"),
                              value: r.profitability.service_revenue,
                            },
                            {
                              name: t("parts"),
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
                          name: t("services"),
                          value: r.profitability.service_revenue,
                          color: "var(--chart-1)",
                        },
                        {
                          name: t("parts"),
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

          {reportType === "weekly" && (
            <DailyRevenueChart data={dailyBreakdown} />
          )}
          {reportType === "monthly" && (
            <DailyRevenueChart data={monthlyBreakdown} />
          )}
          {!mechanicFilter && (
            <MechanicBarChart kpis={r?.mechanic_kpis ?? []} />
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

          {!mechanicFilter && (
            <MechanicTable
              kpis={r?.mechanic_kpis ?? []}
              exportCols={mechExportCols}
              exportFile={`mechanics-${reportType}-${dateParam}.xlsx`}
              comparison={r?.comparison}
            />
          )}
        </div>
      )}

      {/* ═══ FINANCE PANEL ═══════════════════════════════ */}
      {reportType === "finance" && (
        <div
          id="reports-panel-finance"
          role="tabpanel"
          aria-labelledby="reports-tab-finance"
          className="flex flex-col gap-6"
        >
          {/* Period Selector */}
          <div
            className="flex items-center gap-2"
            role="tablist"
            aria-label="Finance period"
          >
            {(["day", "week", "month", "year"] as const).map((p) => (
              <Button
                key={p}
                variant={financePeriod === p ? "default" : "ghost"}
                size="sm"
                role="tab"
                aria-selected={financePeriod === p}
                onClick={() => setFinancePeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </div>

          {financeQ.isPending ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : !financeSummary ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-16">
                <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                  <DollarSign className="size-7 text-muted-foreground" />
                </div>
                <Typography.Muted className="text-sm text-muted-foreground">
                  No finance data available
                </Typography.Muted>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground">
                      Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-2xl font-bold tabular-nums">
                      {formatCurrency(financeSummary.revenue.total)}
                    </span>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground">
                      Expenses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-2xl font-bold tabular-nums text-red-500">
                      {formatCurrency(financeSummary.expenses.total)}
                    </span>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground">
                      Refunds
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-2xl font-bold tabular-nums">
                      {formatCurrency(financeSummary.refunds.total)}
                    </span>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground">
                      Net Profit
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span
                      className={cn(
                        "text-2xl font-bold tabular-nums",
                        financeSummary.net_profit >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-500",
                      )}
                    >
                      {formatCurrency(financeSummary.net_profit)}
                    </span>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Methods & Expense Categories */}
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">
                      Payment Methods
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(financeSummary.revenue.by_method).length ===
                    0 ? (
                      <Typography.Muted className="text-sm">
                        No data
                      </Typography.Muted>
                    ) : (
                      <table
                        className="w-full text-sm"
                        aria-label="Payment methods breakdown"
                      >
                        <thead>
                          <tr className="border-b border-border/60">
                            <th className="px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                              Method
                            </th>
                            <th className="px-2 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(financeSummary.revenue.by_method).map(
                            ([method, amount]) => (
                              <tr
                                key={method}
                                className="border-b border-border/30"
                              >
                                <td className="px-2 py-2 font-medium">
                                  {method}
                                </td>
                                <td className="px-2 py-2 text-right tabular-nums">
                                  {formatCurrency(amount)}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">
                      Expense Categories
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(financeSummary.expenses.by_category).length ===
                    0 ? (
                      <Typography.Muted className="text-sm">
                        No data
                      </Typography.Muted>
                    ) : (
                      <table
                        className="w-full text-sm"
                        aria-label="Expense categories breakdown"
                      >
                        <thead>
                          <tr className="border-b border-border/60">
                            <th className="px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                              Category
                            </th>
                            <th className="px-2 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(
                            financeSummary.expenses.by_category,
                          ).map(([cat, amount]) => (
                            <tr key={cat} className="border-b border-border/30">
                              <td className="px-2 py-2 font-medium">{cat}</td>
                              <td className="px-2 py-2 text-right tabular-nums">
                                {formatCurrency(amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
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
