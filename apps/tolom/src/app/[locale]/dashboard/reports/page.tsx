/**
 * Reports Page — ERP-grade business intelligence for auto service shops.
 *
 * Thin orchestrator: holds state + data hooks, delegates rendering to
 * focused sub-components (_reports-header, _reports-tab-bar, etc.).
 */
"use client";

import { subDays } from "date-fns";
import {
  BarChart3,
  Calendar,
  ClipboardList,
  DollarSign,
  type LucideIcon,
  TrendingUp,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Card, CardContent } from "@/components/ui/card";
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
import type { FinanceSummary } from "./_finance-tab";
import type { EodReport, ReportData, ReportType } from "./_helpers";
import { getDateRange, periodTitle } from "./_helpers";
import { ReportsDatePicker } from "./_reports-date-picker";
import { ReportsFilters } from "./_reports-filters";
import { ReportsHeader } from "./_reports-header";
import { ReportsSkeleton } from "./_reports-skeleton";
import { ReportsTabBar } from "./_reports-tab-bar";

// Lazy-load tab content — only the active tab's code is fetched
const EodView = dynamic(() => import("./_eod-view").then((m) => m.EodView), {
  ssr: false,
});
const FinanceTab = dynamic(
  () => import("./_finance-tab").then((m) => m.FinanceTab),
  { ssr: false },
);
const OverviewTab = dynamic(
  () => import("./_overview-tab").then((m) => m.OverviewTab),
  { ssr: false },
);
// ── Main Reports Page ─────────────────────────────────────

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

  // ── Derived data ─────────────────────────────────────
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

  // ── Render ───────────────────────────────────────────
  return (
    <div className="px-4 pt-4 pb-6 md:px-6 flex flex-col gap-6">
      <ReportsHeader
        title={t("title")}
        subtitle={periodTitle(
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
        onRefresh={() => {
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
        refreshing={loading}
        t={t}
      />

      {/* Tabs + Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ReportsTabBar
          tabs={tabs}
          activeTab={reportType}
          onTabChange={setReportType}
          t={t}
        />
        <ReportsFilters
          branches={branches}
          selectedBranchId={selectedBranchId}
          onBranchChange={setSelectedBranchId}
          mechanics={mechanics}
          mechanicFilter={mechanicFilter}
          onMechanicFilterChange={setMechanicFilter}
          t={t}
        />
      </div>

      {/* Date pickers */}
      <ReportsDatePicker
        reportType={reportType}
        date={date}
        weekStart={weekStart}
        month={month}
        customRange={customRange}
        onDateChange={setDate}
        onWeekStartChange={setWeekStart}
        onMonthChange={setMonth}
        onCustomRangeChange={setCustomRange}
      />

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
      {loading && <ReportsSkeleton />}

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
        <OverviewTab
          reportType={reportType}
          report={report}
          loading={erpLoading}
          insights={insightsQ.data ?? []}
          forecast={forecastQ.data ?? null}
          targets={targetsQ.data ?? []}
          retention={retentionQ.data ?? null}
          pnl={pnlQ.data ?? null}
          serviceBreakdown={serviceBdQ.data ?? []}
          dailyBreakdown={dailyBreakdown}
          monthlyBreakdown={monthlyBreakdown}
          mechExportCols={mechExportCols}
          dateParam={dateParam}
          mechanicFilter={mechanicFilter}
          t={t}
        />
      )}

      {/* ═══ FINANCE PANEL ═══════════════════════════════ */}
      {reportType === "finance" && (
        <FinanceTab
          financePeriod={financePeriod}
          onPeriodChange={setFinancePeriod}
          financeQ={{ data: financeSummary, isPending: financeQ.isPending }}
          t={t}
        />
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
