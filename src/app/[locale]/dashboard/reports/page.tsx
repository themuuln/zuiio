"use client";

import {
  Calendar,
  ClipboardList,
  TrendingUp,
  Users,
  Wrench,
  BarChart3,
  DollarSign,
  Download,
  Lightbulb,
  Percent,
  RefreshCw,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClientNow } from "@/hooks/use-client-now";
import { toast } from "sonner";
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
import { formatCurrency } from "@/lib/utils";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { StatusSummary } from "@/components/sidebar-tabs/status-summary";
import { RecentList } from "@/components/sidebar-tabs/recent-list";
import { Typography } from "@/components/ui/typography";

type ReportType = "daily" | "weekly" | "monthly" | "eod";

/** Compact number: 1.2M, 430k */
function compactNum(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(Math.round(n));
}

interface Mechanic {
  id: string;
  fullName: string | null;
  email: string;
}

/** Shape returned by daily/weekly/monthly report endpoints */
interface ReportData {
  work_orders_completed: number;
  services_performed: number;
  parts_used: number;
  total_revenue: number;
  total_discounts: number;
  gross_profit?: number;
  margin_percent?: number;
  service_revenue?: number;
  service_cost?: number;
  parts_revenue?: number;
  parts_cost?: number;
  total_cost?: number;
  [key: string]: unknown;
}

/** Shape returned by EOD endpoint */
interface EodReport {
  date: string;
  mechanics: Array<{
    mechanic_id: string;
    mechanic_name: string;
    work_orders_completed: number;
    services_performed: number;
    parts_used: number;
    total_revenue: number;
    total_discounts?: number;
    total_commission?: number;
  }>;
  total_work_orders: number;
  total_revenue: number;
  total_commission?: number;
}

// ── Report Period Title Helper ─────────────────────────────

function reportPeriodTitle(type: ReportType, date: string): string {
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
      const start = new Date(date);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    case "monthly":
      return d.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    case "eod":
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
  }
}

// ── Mini Derivation ───────────────────────────────────────

function avgRevenuePerWo(revenue: number, wos: number): string {
  if (wos === 0) return "—";
  return formatCurrency(Math.round(revenue / wos));
}

// ── KPI Card (reports variant) ───────────────────────────

function ReportKpiCard({
  label,
  value,
  icon: Icon,
  subtitle,
  loading,
  valueClassName,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  subtitle?: string;
  loading?: boolean;
  valueClassName?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div
              className={`text-2xl font-semibold tabular-nums${valueClassName ? ` ${valueClassName}` : ""}`}
            >
              {value}
            </div>
            {subtitle && (
              <Typography.Muted className="mt-0.5 text-xs text-muted-foreground">
                {subtitle}
              </Typography.Muted>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Revenue Breakdown Mini-Bar ───────────────────────────

function RevenueMiniBar({
  total,
  service,
  parts,
}: {
  total: number;
  service: number;
  parts: number;
}) {
  if (total === 0) return null;
  const svcPct = Math.round((service / total) * 100);
  const prtPct = Math.round((parts / total) * 100);
  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="flex h-2 w-full max-w-[120px] overflow-hidden rounded-full bg-muted">
        <div
          className="bg-blue-500 transition-all"
          style={{ width: `${svcPct}%` }}
        />
        <div
          className="bg-amber-500 transition-all"
          style={{ width: `${prtPct}%` }}
        />
      </div>
      <span className="text-muted-foreground whitespace-nowrap">
        <span className="text-blue-600 dark:text-blue-400">Svc {svcPct}%</span>
        {" · "}
        <span className="text-amber-600 dark:text-amber-400">
          Parts {prtPct}%
        </span>
      </span>
    </div>
  );
}

// ── Daily Breakdown Chart (for weekly) ───────────────────

function DailyBreakdownChart({
  breakdown,
  loading,
}: {
  breakdown: Array<{ date: string; total_revenue: number }>;
  loading?: boolean;
}) {
  if (loading || !breakdown?.length) return null;

  const maxRev = Math.max(...breakdown.map((d) => d.total_revenue), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Daily Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="flex items-end justify-between gap-2"
          style={{ height: 100 }}
        >
          {breakdown.map((day) => {
            const pct = (day.total_revenue / maxRev) * 100;
            const dayLabel = new Date(day.date).toLocaleDateString("en-US", {
              weekday: "short",
            });
            const dateLabel = new Date(day.date).getDate();
            return (
              <div
                key={day.date}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                  {compactNum(day.total_revenue)}
                </span>
                <div
                  className="w-full rounded-t bg-primary/80 transition-all"
                  style={{
                    height: `${Math.max(pct, 4)}%`,
                    minHeight: day.total_revenue > 0 ? 8 : 4,
                  }}
                />
                <div className="flex flex-col items-center gap-0">
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {dayLabel}
                  </span>
                  <span className="text-[9px] text-muted-foreground/60">
                    {dateLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Section Header ───────────────────────────────────────

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-3">
      <Typography.H3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </Typography.H3>
      {description && (
        <Typography.Muted className="text-xs text-muted-foreground">
          {description}
        </Typography.Muted>
      )}
    </div>
  );
}

// ── Main Reports Page ────────────────────────────────────

export default function ReportsPage() {
  const t = useTranslations();
  const now = useClientNow();
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [selectedMechanic, setSelectedMechanic] = useState<string>("");
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
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [expenses, setExpenses] = useState<{
    totalAmount: number;
    thisMonth: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const orgIdRef = useRef<string | null>(null);
  const { registerTab } = useRightSidebar();

  const fetchMechanics = useCallback(async (oid: string) => {
    try {
      const res = await fetch(
        `/api/organizations/${oid}/reports?type=mechanics`,
      );
      const json = await res.json();
      if (!json.error && Array.isArray(json.data)) {
        setMechanics(
          (json.data as Array<{ id: string; full_name: string | null }>).map(
            (m) => ({
              id: m.id,
              fullName: m.full_name ?? null,
              email: "",
            }),
          ),
        );
      }
    } catch {
      // silent
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: orgIdRef is stable, .current read at call time
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
        fetch(`/api/organizations/${orgId}/reports?${params}`).then((r) =>
          r.json(),
        ),
        fetch(`/api/organizations/${orgId}/expenses?type=stats`).then((r) =>
          r.json(),
        ),
      ]);

      if (reportJson.error) {
        toast.error(reportJson.error.message);
        setError(reportJson.error.message);
      } else {
        setReport(reportJson.data ?? null);
      }

      if (!expenseJson.error && expenseJson.data) {
        setExpenses({
          totalAmount: expenseJson.data.totalAmount ?? 0,
          thisMonth: expenseJson.data.thisMonth ?? 0,
        });
      }
    } catch {
      toast.error("Failed to load report");
      setError("Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [reportType, selectedMechanic, date, weekStart, month]);

  // Init: fetch org ID then trigger initial data loads
  // biome-ignore lint/correctness/useExhaustiveDependencies: orgIdRef is a ref, read at call time
  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/profile", { signal: abort.signal })
      .then((r) => r.json())
      .then((d) => {
        const oid = d?.organizationId ?? d?.data?.organizationId;
        if (oid) {
          orgIdRef.current = oid;
          fetchMechanics(oid);
          fetchReport();
        }
      })
      .catch((err) => {
        if (!abort.signal.aborted) console.error(err);
      })
      .finally(() => setLoading(false));
    return () => abort.abort();
  }, [fetchMechanics, fetchReport]);

  // Re-fetch report when filters change
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // ── Derived data ──────────────────────────────────────

  const r = report as ReportData | null;

  // For weekly: extract daily_breakdown for chart
  const dailyBreakdown = useMemo(() => {
    if (reportType !== "weekly" || !report) return [];
    const bd = (report as Record<string, unknown>).daily_breakdown;
    if (!Array.isArray(bd)) return [];
    return bd.map((d: Record<string, unknown>) => ({
      date: d.date as string,
      total_revenue: Number(d.total_revenue ?? 0),
    }));
  }, [report, reportType]);

  // ── Insight line ──────────────────────────────────────

  const insightLine = useMemo(() => {
    if (!r || loading) return null;
    const wo = r.work_orders_completed ?? 0;
    const rev = r.total_revenue ?? 0;
    const svc = r.services_performed ?? 0;
    const parts = r.parts_used ?? 0;
    if (wo === 0 && rev === 0) return null;

    const parts2 =
      rev > 0 ? `avg ${formatCurrency(Math.round(rev / wo))}/WO` : "";
    return `${wo} job${wo === 1 ? "" : "s"} completed · ${formatCurrency(rev)} revenue · ${svc} services · ${parts} parts ${parts2 ? "· " + parts2 : ""}`;
  }, [r, loading]);

  const eodReport = report as EodReport | null;
  const hasData =
    (r?.work_orders_completed ?? 0) > 0 || (r?.total_revenue ?? 0) > 0;
  const isEod = reportType === "eod";

  // ── Tab config ────────────────────────────────────────

  const tabs: { label: string; value: ReportType; icon: LucideIcon }[] = [
    { label: "Daily", value: "daily", icon: Calendar },
    { label: "Weekly", value: "weekly", icon: BarChart3 },
    { label: "Monthly", value: "monthly", icon: TrendingUp },
    { label: "EOD Summary", value: "eod", icon: ClipboardList },
  ];

  useEffect(() => {
    registerTab(
      "help",
      "Help",
      <div className="flex flex-col gap-1.5">
        <Typography.Muted className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
          Report Types
        </Typography.Muted>
        <div className="rounded-md border border-border/50 bg-card px-2.5 py-2">
          <Typography.Text className="text-xs font-medium">
            Daily
          </Typography.Text>
          <Typography.Muted className="text-[10px] text-muted-foreground leading-tight mt-0.5">
            Today&apos;s performance
          </Typography.Muted>
        </div>
        <div className="rounded-md border border-border/50 bg-card px-2.5 py-2">
          <Typography.Text className="text-xs font-medium">
            Weekly
          </Typography.Text>
          <Typography.Muted className="text-[10px] text-muted-foreground leading-tight mt-0.5">
            This week&apos;s breakdown
          </Typography.Muted>
        </div>
        <div className="rounded-md border border-border/50 bg-card px-2.5 py-2">
          <Typography.Text className="text-xs font-medium">
            Monthly
          </Typography.Text>
          <Typography.Muted className="text-[10px] text-muted-foreground leading-tight mt-0.5">
            Monthly trends
          </Typography.Muted>
        </div>
        <div className="rounded-md border border-border/50 bg-card px-2.5 py-2">
          <Typography.Text className="text-xs font-medium">
            EOD Summary
          </Typography.Text>
          <Typography.Muted className="text-[10px] text-muted-foreground leading-tight mt-0.5">
            Per-mechanic summary
          </Typography.Muted>
        </div>
      </div>,
    );

    registerTab(
      "recent",
      "Recent",
      <RecentList
        items={[]}
        title="Recently Viewed"
        emptyMessage="Reports are generated on demand"
      />,
    );
  }, [registerTab]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Typography.H1 className="text-2xl font-semibold tracking-tight">Reports</Typography.H1>
          <Typography.Muted className="text-sm text-muted-foreground">
            {reportPeriodTitle(
              reportType,
              reportType === "monthly"
                ? month + "-01"
                : reportType === "weekly"
                  ? weekStart
                  : date,
            )}
          </Typography.Muted>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReport}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs + Mechanic filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.value}
                onClick={() => setReportType(tab.value)}
                variant={reportType === tab.value ? "default" : "ghost"}
                size="sm"
                className="rounded-md"
              >
                <Icon className="size-3.5" />
                {tab.label}
              </Button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <MechanicSelect
            value={selectedMechanic}
            onChange={setSelectedMechanic}
            mechanics={mechanics}
            placeholder="All Mechanics"
            size="default"
          />
        </div>
      </div>

      {/* Date pickers */}
      <div className="flex flex-wrap items-center gap-3">
        {reportType === "daily" && (
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 w-auto"
            />
          </div>
        )}
        {reportType === "weekly" && (
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <Input
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="h-9 w-auto"
            />
          </div>
        )}
        {reportType === "monthly" && (
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-9 w-auto"
            />
          </div>
        )}
        {reportType === "eod" && (
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 w-auto"
            />
          </div>
        )}
      </div>

      {/* Error */}
      {error && !loading && (
        <Card className="border-red-200 bg-red-50/30 dark:border-red-800/30 dark:bg-red-950/10">
          <CardContent className="py-4">
            <Typography.Text className="text-sm text-red-600 dark:text-red-400">
              {error}
            </Typography.Text>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={`skeleton-${i}`}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-28" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
          {reportType === "weekly" && (
            <Skeleton className="h-32 w-full rounded-xl" />
          )}
        </div>
      )}

      {/* ── EOD Report ────────────────────────────────────── */}
      {!loading && isEod && eodReport && (
        <div className="flex flex-col gap-6">
          {/* EOD Summary KPI row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ReportKpiCard
              label="Total Work Orders"
              value={String(eodReport.total_work_orders)}
              icon={ClipboardList}
            />
            <ReportKpiCard
              label="Total Revenue"
              value={formatCurrency(eodReport.total_revenue)}
              icon={DollarSign}
              subtitle={`${eodReport.mechanics.length} mechanic${eodReport.mechanics.length === 1 ? "" : "s"} active`}
            />
            <ReportKpiCard
              label="Avg Revenue / WO"
              value={
                eodReport.total_work_orders > 0
                  ? formatCurrency(
                      Math.round(
                        eodReport.total_revenue / eodReport.total_work_orders,
                      ),
                    )
                  : formatCurrency(0)
              }
              icon={TrendingUp}
            />
            <ReportKpiCard
              label="Mechanics"
              value={String(eodReport.mechanics.length)}
              icon={Users}
            />
            <ReportKpiCard
              label="Total Commission"
              value={formatCurrency(eodReport.total_commission ?? 0)}
              icon={Wallet}
              valueClassName="text-emerald-600 dark:text-emerald-400"
            />
          </div>

          {/* EOD Mechanic Breakdown Table */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Per-Mechanic Breakdown
              </CardTitle>
              <ExportButton
                data={eodReport.mechanics.map((m) => ({
                  ...m,
                  avg_per_wo:
                    m.work_orders_completed > 0
                      ? Math.round(m.total_revenue / m.work_orders_completed)
                      : 0,
                }))}
                columns={[
                  { key: "mechanic_name", label: "Mechanic" },
                  { key: "work_orders_completed", label: "Jobs" },
                  { key: "services_performed", label: "Services" },
                  { key: "parts_used", label: "Parts" },
                  {
                    key: "total_revenue",
                    label: "Revenue",
                    format: "currency",
                  },
                  {
                    key: "total_commission",
                    label: "Commission",
                    format: "currency",
                  },
                  { key: "avg_per_wo", label: "Avg/WO", format: "currency" },
                ]}
                filename={`eod-breakdown-${date}.xlsx`}
                sheetName="EOD Breakdown"
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
                    <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Avg/WO
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eodReport.mechanics.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No mechanics completed work today
                      </TableCell>
                    </TableRow>
                  ) : (
                    eodReport.mechanics.map((m, i) => {
                      const avg =
                        m.work_orders_completed > 0
                          ? Math.round(
                              m.total_revenue / m.work_orders_completed,
                            )
                          : 0;
                      return (
                        <TableRow
                          key={m.mechanic_id}
                          className={`border-b border-border transition-colors hover:bg-muted/30 ${i === 0 ? "bg-muted/10" : ""}`}
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
                              <span className="text-muted-foreground">
                                &mdash;
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                            {formatCurrency(avg)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
                {eodReport.mechanics.length > 0 && (
                  <TableFooter>
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell className="px-4 py-3">Total</TableCell>
                      <TableCell className="px-4 py-3 text-right tabular-nums">
                        {eodReport.mechanics.reduce(
                          (s, m) => s + (m.work_orders_completed ?? 0),
                          0,
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right tabular-nums">
                        {eodReport.mechanics.reduce(
                          (s, m) => s + (m.services_performed ?? 0),
                          0,
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right tabular-nums">
                        {eodReport.mechanics.reduce(
                          (s, m) => s + (m.parts_used ?? 0),
                          0,
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right tabular-nums">
                        {formatCurrency(eodReport.total_revenue)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(eodReport.total_commission ?? 0)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right tabular-nums" />
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Daily / Weekly / Monthly (non-EOD) ─────────────── */}
      {!loading && !isEod && report && (
        <div className="flex flex-col gap-6">
          {/* Insight line */}
          {insightLine && (
            <Card className="border-amber-200/50 bg-amber-50/30 dark:border-amber-800/30 dark:bg-amber-950/10">
              <CardContent className="flex items-start gap-2 py-3">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <Typography.Muted className="text-sm text-muted-foreground">
                  {insightLine}
                </Typography.Muted>
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {!hasData && !loading ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-16">
                <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                  <BarChart3 className="size-7 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <Typography.H3 className="text-sm font-semibold">
                    No completed work in this period
                  </Typography.H3>
                  <Typography.Muted className="mt-1 text-xs text-muted-foreground">
                    Try selecting a different date range or mechanic.
                  </Typography.Muted>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* KPI Cards Row */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <ReportKpiCard
                  label="Work Orders Completed"
                  value={String(r?.work_orders_completed ?? 0)}
                  icon={ClipboardList}
                  subtitle={
                    r?.work_orders_completed
                      ? `avg ${avgRevenuePerWo(r?.total_revenue ?? 0, r?.work_orders_completed ?? 0)}/WO`
                      : undefined
                  }
                />
                <ReportKpiCard
                  label="Services Performed"
                  value={String(r?.services_performed ?? 0)}
                  icon={Wrench}
                  subtitle={
                    r?.services_performed && r?.work_orders_completed
                      ? `${Math.round((r.services_performed / r.work_orders_completed) * 10) / 10}/WO`
                      : undefined
                  }
                />
                <ReportKpiCard
                  label="Total Revenue"
                  value={formatCurrency(r?.total_revenue ?? 0)}
                  icon={DollarSign}
                  subtitle={
                    r?.total_discounts && r.total_discounts > 0
                      ? `${formatCurrency(r.total_discounts)} in discounts`
                      : undefined
                  }
                />
                <ReportKpiCard
                  label="Expenses"
                  value={formatCurrency(expenses?.thisMonth ?? 0)}
                  icon={Wallet}
                  subtitle={
                    expenses?.totalAmount
                      ? `${formatCurrency(expenses.totalAmount)} all time`
                      : undefined
                  }
                />
              </div>

              {/* Profit KPIs */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <ReportKpiCard
                  label="Gross Profit"
                  value={formatCurrency(r?.gross_profit ?? 0)}
                  icon={TrendingUp}
                  valueClassName={
                    (r?.gross_profit ?? 0) >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-500"
                  }
                />
                <ReportKpiCard
                  label="Margin %"
                  value={`${(r?.margin_percent ?? 0).toFixed(1)}%`}
                  icon={Percent}
                  valueClassName={
                    (r?.margin_percent ?? 0) >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-500"
                  }
                />
                <ReportKpiCard
                  label="Services Cost"
                  value={formatCurrency(r?.service_cost ?? 0)}
                  icon={Wrench}
                />
                <ReportKpiCard
                  label="Parts Cost"
                  value={formatCurrency(r?.parts_cost ?? 0)}
                  icon={BarChart3}
                />
              </div>

              {/* Net Profit */}
              {r && expenses && (
                <Card>
                  <CardHeader className="pb-2">
                    <Typography.Muted className="text-xs font-medium text-muted-foreground">
                      Net Profit
                    </Typography.Muted>
                  </CardHeader>
                  <CardContent>
                    <Typography.Text
                      className={`text-2xl font-semibold tabular-nums ${r.total_revenue - expenses.thisMonth < 0 ? "text-red-500" : "text-green-600 dark:text-green-400"}`}
                    >
                      {formatCurrency(r.total_revenue - expenses.thisMonth)}
                    </Typography.Text>
                    <Typography.Muted className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(r.total_revenue)} revenue &minus;{" "}
                      {formatCurrency(expenses.thisMonth)} expenses
                    </Typography.Muted>
                  </CardContent>
                </Card>
              )}

              {/* Revenue breakdown bar */}
              {r && r.total_revenue > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">
                      Revenue Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RevenueMiniBar
                      total={r.total_revenue}
                      service={r.total_revenue - (r.total_discounts ?? 0)}
                      parts={r.total_discounts ?? 0}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Profit Breakdown */}
              {r &&
                (r.service_revenue !== undefined ||
                  r.total_cost !== undefined) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">
                        Profit Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      <div>
                        <Typography.Muted className="text-xs font-medium text-muted-foreground mb-2">
                          Service vs Parts Revenue
                        </Typography.Muted>
                        <RevenueMiniBar
                          total={r.total_revenue}
                          service={r.service_revenue ?? 0}
                          parts={r.parts_revenue ?? 0}
                        />
                      </div>
                      {(r.total_cost ?? 0) > 0 && (
                        <div className="flex flex-col gap-1.5 border-t border-border pt-3">
                          <Typography.Muted className="text-xs font-medium text-muted-foreground mb-2">
                            Cost Breakdown
                          </Typography.Muted>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              Service Cost
                            </span>
                            <span className="font-medium tabular-nums">
                              {formatCurrency(r.service_cost ?? 0)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              Parts Cost
                            </span>
                            <span className="font-medium tabular-nums">
                              {formatCurrency(r.parts_cost ?? 0)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs font-medium border-t border-border pt-1.5 mt-1.5">
                            <span>Total Cost</span>
                            <span className="tabular-nums">
                              {formatCurrency(r.total_cost ?? 0)}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

              {/* Weekly: Daily Breakdown Chart */}
              {reportType === "weekly" && (
                <DailyBreakdownChart breakdown={dailyBreakdown} />
              )}
            </>
          )}
        </div>
      )}

      {/* ── No report state (before first load) ────────────── */}
      {!loading && !report && !error && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <BarChart3 className="size-7 text-muted-foreground" />
            </div>
            <div className="text-center">
              <Typography.H3 className="text-sm font-semibold">Select a report type</Typography.H3>
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
