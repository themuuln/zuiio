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
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type ReportType = "daily" | "weekly" | "monthly" | "eod";

function formatMNT(amount: number): string {
  return new Intl.NumberFormat("mn-MN", {
    style: "currency",
    currency: "MNT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

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
  }>;
  total_work_orders: number;
  total_revenue: number;
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

function avgRevenuePerWo(
  revenue: number,
  wos: number,
): string {
  if (wos === 0) return "—";
  return formatMNT(Math.round(revenue / wos));
}

// ── KPI Card (reports variant) ───────────────────────────

function ReportKpiCard({
  label,
  value,
  icon: Icon,
  subtitle,
  loading,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  subtitle?: string;
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
          <>
            <div className="text-2xl font-bold tabular-nums">{value}</div>
            {subtitle && (
              <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
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
        <span className="text-amber-600 dark:text-amber-400">Parts {prtPct}%</span>
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
        <div className="flex items-end justify-between gap-2" style={{ height: 100 }}>
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
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

// ── Main Reports Page ────────────────────────────────────

export default function ReportsPage() {
  const t = useTranslations();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [selectedMechanic, setSelectedMechanic] = useState<string>("");
  const [reportType, setReportType] = useState<ReportType>("daily");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        const oid = d?.organizationId ?? d?.data?.organizationId;
        if (oid) setOrgId(oid);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fetchMechanics = useCallback(async (oid: string) => {
    try {
      const res = await fetch(`/api/organizations/${oid}/reports?type=mechanics`);
      const json = await res.json();
      if (!json.error && json.data?.mechanics) {
        setMechanics(json.data.mechanics);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (orgId) fetchMechanics(orgId);
  }, [orgId, fetchMechanics]);

  const fetchReport = useCallback(async () => {
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

      const res = await fetch(`/api/organizations/${orgId}/reports?${params}`);
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message);
        setError(json.error.message);
      } else setReport(json.data ?? null);
    } catch {
      toast.error("Failed to load report");
      setError("Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [orgId, reportType, selectedMechanic, date, weekStart, month]);

  useEffect(() => {
    if (orgId) fetchReport();
  }, [orgId, fetchReport]);

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

    const parts2 = rev > 0 ? `avg ${formatMNT(Math.round(rev / wo))}/WO` : "";
    return `${wo} job${wo === 1 ? "" : "s"} completed · ${formatMNT(rev)} revenue · ${svc} services · ${parts} parts ${parts2 ? "· " + parts2 : ""}`;
  }, [r, loading]);

  const eodReport = report as EodReport | null;
  const hasData = (r?.work_orders_completed ?? 0) > 0 || (r?.total_revenue ?? 0) > 0;
  const isEod = reportType === "eod";

  // ── Tab config ────────────────────────────────────────

  const tabs: { label: string; value: ReportType; icon: LucideIcon }[] = [
    { label: "Daily", value: "daily", icon: Calendar },
    { label: "Weekly", value: "weekly", icon: BarChart3 },
    { label: "Monthly", value: "monthly", icon: TrendingUp },
    { label: "EOD Summary", value: "eod", icon: ClipboardList },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            {reportPeriodTitle(reportType, reportType === "monthly" ? month + "-01" : reportType === "weekly" ? weekStart : date)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchReport} disabled={loading}>
            <RefreshCw className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`} />
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
              <button
                key={tab.value}
                type="button"
                onClick={() => setReportType(tab.value)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  reportType === tab.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="size-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedMechanic}
            onChange={(e) => setSelectedMechanic(e.target.value)}
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm min-w-[160px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Filter by mechanic"
          >
            <option value="">All Mechanics</option>
            {mechanics.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName ?? m.email}
              </option>
            ))}
          </select>
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
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
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
          {reportType === "weekly" && (
            <Skeleton className="h-32 w-full rounded-xl" />
          )}
        </div>
      )}

      {/* ── EOD Report ────────────────────────────────────── */}
      {!loading && isEod && eodReport && (
        <div className="space-y-6">
          {/* EOD Summary KPI row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ReportKpiCard
              label="Total Work Orders"
              value={String(eodReport.total_work_orders)}
              icon={ClipboardList}
            />
            <ReportKpiCard
              label="Total Revenue"
              value={formatMNT(eodReport.total_revenue)}
              icon={DollarSign}
              subtitle={`${eodReport.mechanics.length} mechanic${eodReport.mechanics.length === 1 ? "" : "s"} active`}
            />
            <ReportKpiCard
              label="Avg Revenue / WO"
              value={
                eodReport.total_work_orders > 0
                  ? formatMNT(Math.round(eodReport.total_revenue / eodReport.total_work_orders))
                  : formatMNT(0)
              }
              icon={TrendingUp}
            />
            <ReportKpiCard
              label="Mechanics"
              value={String(eodReport.mechanics.length)}
              icon={Users}
            />
          </div>

          {/* EOD Mechanic Breakdown Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Per-Mechanic Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mechanic</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Jobs</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Services</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Parts</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Revenue</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Avg/WO</th>
                  </tr>
                </thead>
                <tbody>
                  {eodReport.mechanics.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No mechanics completed work today
                      </td>
                    </tr>
                  ) : (
                    eodReport.mechanics.map((m, i) => {
                      const avg = m.work_orders_completed > 0
                        ? Math.round(m.total_revenue / m.work_orders_completed)
                        : 0;
                      return (
                        <tr
                          key={m.mechanic_id}
                          className={`border-b border-border transition-colors hover:bg-muted/30 ${i === 0 ? "bg-muted/10" : ""}`}
                        >
                          <td className="px-4 py-3 font-medium">{m.mechanic_name}</td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {m.work_orders_completed}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {m.services_performed ?? 0}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {m.parts_used ?? 0}
                          </td>
                          <td className="px-4 py-3 text-right font-medium tabular-nums">
                            {formatMNT(m.total_revenue)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                            {formatMNT(avg)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {eodReport.mechanics.length > 0 && (
                  <tfoot>
                    <tr className="bg-muted/30 font-semibold">
                      <td className="px-4 py-3">Total</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {eodReport.mechanics.reduce((s, m) => s + (m.work_orders_completed ?? 0), 0)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {eodReport.mechanics.reduce((s, m) => s + (m.services_performed ?? 0), 0)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {eodReport.mechanics.reduce((s, m) => s + (m.parts_used ?? 0), 0)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatMNT(eodReport.total_revenue)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums" />
                    </tr>
                  </tfoot>
                )}
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Daily / Weekly / Monthly (non-EOD) ─────────────── */}
      {!loading && !isEod && report && (
        <div className="space-y-6">
          {/* Insight line */}
          {insightLine && (
            <Card className="border-amber-200/50 bg-amber-50/30 dark:border-amber-800/30 dark:bg-amber-950/10">
              <CardContent className="flex items-start gap-2 py-3">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <p className="text-sm text-muted-foreground">{insightLine}</p>
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
                  <h3 className="text-sm font-semibold">No completed work in this period</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Try selecting a different date range or mechanic.
                  </p>
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
                  label="Parts Used"
                  value={String(r?.parts_used ?? 0)}
                  icon={TrendingUp}
                  subtitle={
                    r?.parts_used && r?.work_orders_completed
                      ? `${Math.round((r.parts_used / r.work_orders_completed) * 10) / 10}/WO`
                      : undefined
                  }
                />
                <ReportKpiCard
                  label="Total Revenue"
                  value={formatMNT(r?.total_revenue ?? 0)}
                  icon={DollarSign}
                  subtitle={
                    r?.total_discounts && r.total_discounts > 0
                      ? `${formatMNT(r.total_discounts)} in discounts`
                      : undefined
                  }
                />
              </div>

              {/* Revenue breakdown bar */}
              {r && r.total_revenue > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Revenue Breakdown</CardTitle>
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
              <h3 className="text-sm font-semibold">Select a report type</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Choose Daily, Weekly, Monthly, or End of Day to view your shop data.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
