"use client";

import {
  BarChart3,
  Clock,
  Crown,
  DollarSign,
  Loader2,
  Star,
  Users,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart } from "@/components/charts";
import { RecentList } from "@/components/sidebar-tabs/recent-list";
import { StatusSummary } from "@/components/sidebar-tabs/status-summary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Typography } from "@/components/ui/typography";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { useBranches } from "@/lib/queries/use-branches";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { reportError } from "@/lib/sentry-report";
import { useSelectedBranchId } from "@/lib/stores";
import type {
  MechanicReview,
  ReportMechanicKpi,
} from "@/lib/types/service-params";
import { formatMNT } from "@/lib/utils";

type Period = "week" | "month" | "quarter";

interface MechanicPerf {
  mechanic_id: string;
  mechanic_name: string;
  work_orders_completed: number;
  services_count: number;
  parts_count: number;
  total_revenue: number;
  avg_revenue_per_wo: number;
  hours_worked: number;
  total_commission: number;
  revenue_per_hour: number;
  avg_satisfaction: number | null;
  total_reviews: number;
  recent_reviews: MechanicReview[];
}

const PERIODS: { key: Period; label: string }[] = [
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "quarter", label: "This Quarter" },
];

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
      <CardHeader className="pb-2">
        <Typography.Muted className="text-xs font-medium text-muted-foreground">
          {label}
        </Typography.Muted>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <Typography.Text className="text-2xl font-semibold tabular-nums">
              {value}
            </Typography.Text>
          )}
          <Icon className="ml-auto size-5 text-muted-foreground/40" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function MechanicPerformancePage() {
  const { data: org, isLoading: orgLoading } = useCurrentOrg();
  const orgId = org?.orgId;
  const { data: branches } = useBranches(orgId);
  const [period, setPeriod] = useState<Period>("month");
  const { registerTab, unregisterTab } = useRightSidebar();

  // ── Compute date range ────────────────────────────
  const dateRange = useMemo(() => {
    const now = new Date();
    const end = now.toISOString().slice(0, 10);
    let start: string;
    switch (period) {
      case "week": {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        start = d.toISOString().slice(0, 10);
        break;
      }
      case "month": {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 1);
        start = d.toISOString().slice(0, 10);
        break;
      }
      case "quarter": {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 3);
        start = d.toISOString().slice(0, 10);
        break;
      }
    }
    return { start, end };
  }, [period]);

  const selectedBranchId = useSelectedBranchId();
  const branchFilter = selectedBranchId === "all" ? null : selectedBranchId;
  const branchName =
    selectedBranchId === "all"
      ? "All Branches"
      : (branches?.find((b) => b.id === selectedBranchId)?.name ??
        "Selected Branch");

  // ── Fetch mechanic KPIs from the reports API ──────
  const [mechanics, setMechanics] = useState<MechanicPerf[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Sorting ────────────────────────────────────────
  type SortKey = keyof MechanicPerf;
  type SortDir = "asc" | "desc";
  // Ensure sort type includes all possible keys

  const [sortKey, setSortKey] = useState<SortKey>("total_revenue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortedMechanics = useMemo(() => {
    const sorted = [...mechanics].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      const aNum = typeof aVal === "number" ? aVal : 0;
      const bNum = typeof bVal === "number" ? bVal : 0;
      return sortDir === "asc" ? aNum - bNum : bNum - aNum;
    });
    return sorted;
  }, [mechanics, sortKey, sortDir]);

  const fetchData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const reportParams = new URLSearchParams({
        type: "custom",
        date_from: dateRange.start,
        date_to: dateRange.end,
      });
      if (branchFilter) reportParams.set("branch_id", branchFilter);
      const [reportRes, hoursRes] = await Promise.all([
        fetch(
          `/api/organizations/${orgId}/reports?${reportParams.toString()}`,
        ).then((r) => r.json()),
        fetch(
          `/api/organizations/${orgId}/mechanic-hours?startDate=${dateRange.start}&endDate=${dateRange.end}`,
        ).then((r) => r.json().catch(() => ({ data: [] }))),
      ]);

      const kpis: ReportMechanicKpi[] = reportRes.data?.mechanic_kpis ?? [];
      const hoursMap = new Map<string, number>();
      for (const h of hoursRes.data ?? []) {
        hoursMap.set(h.mechanic_id, h.total_hours);
      }

      const perf: MechanicPerf[] = kpis.map((k) => {
        const hours = hoursMap.get(k.mechanic_id) ?? 0;
        return {
          ...k,
          hours_worked: hours,
          total_commission: 0, // Will be populated from commission endpoint
          revenue_per_hour: hours > 0 ? k.total_revenue / hours : 0,
          avg_satisfaction: k.avg_satisfaction ?? null,
          total_reviews: k.total_reviews ?? 0,
          recent_reviews: k.recent_reviews ?? [],
        };
      });

      // Fetch commission data
      try {
        const commRes = await fetch(
          `/api/organizations/${orgId}/mechanic-commissions?startDate=${dateRange.start}&endDate=${dateRange.end}`,
        );
        const commJson = await commRes.json();
        const commMap = new Map<string, number>();
        for (const c of commJson.data ?? []) {
          commMap.set(c.mechanic_id, c.total_commission);
        }
        for (const m of perf) {
          m.total_commission = commMap.get(m.mechanic_id) ?? 0;
          m.revenue_per_hour =
            m.hours_worked > 0 ? m.total_revenue / m.hours_worked : 0;
        }
      } catch {
        // Commission endpoint may not exist yet, that's fine
      }

      setMechanics(perf);
    } catch (err) {
      reportError(err, "mechanic-performance");
      setMechanics([]);
    } finally {
      setLoading(false);
    }
  }, [orgId, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Detail sheet state ───────────────────────────
  const [selectedMechanic, setSelectedMechanic] = useState<MechanicPerf | null>(
    null,
  );

  // ── Sidebar ───────────────────────────────────────
  useEffect(() => {
    if (!mechanics.length) return;
    const totalJobs = mechanics.reduce(
      (s, m) => s + m.work_orders_completed,
      0,
    );
    const totalHours = mechanics.reduce((s, m) => s + m.hours_worked, 0);
    const totalRevenue = mechanics.reduce((s, m) => s + m.total_revenue, 0);
    const topMech = mechanics[0];

    registerTab(
      "summary",
      "Summary",
      <StatusSummary
        title="Period Summary"
        items={[
          { label: "Active Mechanics", count: mechanics.length },
          { label: "Total Jobs", count: totalJobs },
          { label: "Total Hours", count: Math.round(totalHours * 10) / 10 },
          { label: "Total Revenue", count: totalRevenue },
          ...(topMech
            ? [
                {
                  label: `Top: ${topMech.mechanic_name.split(" ")[0]}`,
                  count: topMech.total_revenue,
                },
              ]
            : []),
        ]}
      />,
      <BarChart3 className="size-4" />,
    );
    registerTab(
      "leaderboard",
      "Rankings",
      <RecentList
        items={mechanics.map((m) => ({
          id: m.mechanic_id,
          primary: m.mechanic_name,
          secondary: `${m.work_orders_completed} jobs · ${formatMNT(m.total_revenue)}`,
        }))}
        emptyMessage="No data"
      />,
    );
    return () => {
      unregisterTab("summary");
      unregisterTab("leaderboard");
    };
  }, [mechanics, registerTab]);

  const totals = useMemo(
    () => ({
      mechanics: mechanics.length,
      jobs: mechanics.reduce((s, m) => s + m.work_orders_completed, 0),
      hours: mechanics.reduce((s, m) => s + m.hours_worked, 0),
      revenue: mechanics.reduce((s, m) => s + m.total_revenue, 0),
      commission: mechanics.reduce((s, m) => s + m.total_commission, 0),
      avgSatisfaction: (() => {
        const rated = mechanics.filter((m) => m.avg_satisfaction != null);
        if (rated.length === 0) return 0;
        return (
          rated.reduce((s, m) => s + (m.avg_satisfaction ?? 0), 0) /
          rated.length
        );
      })(),
    }),
    [mechanics],
  );

  const chartData = useMemo(
    () =>
      mechanics.slice(0, 8).map((m) => ({
        name: m.mechanic_name.split(" ")[0] ?? m.mechanic_name,
        value: m.total_revenue,
      })),
    [mechanics],
  );

  if (orgLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Typography.H1 className="text-2xl font-semibold tracking-tight">
              Mechanic Performance
            </Typography.H1>
            <Typography.Muted className="text-muted-foreground">
              Cross-mechanic comparison for{" "}
              {period === "week"
                ? "the last 7 days"
                : period === "month"
                  ? "the last 30 days"
                  : "the last quarter"}{" "}
              · {branchName}
            </Typography.Muted>
          </div>
          <div className="flex gap-1.5">
            {PERIODS.map((p) => (
              <Button
                key={p.key}
                variant={period === p.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setPeriod(p.key)}
              >
                {p.label}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={fetchData}>
              <Loader2
                className={`size-3.5 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <KpiCard
            label="Active Mechanics"
            value={loading ? "—" : String(totals.mechanics)}
            icon={Users}
            loading={loading}
          />
          <KpiCard
            label="Jobs Completed"
            value={loading ? "—" : String(totals.jobs)}
            icon={Wrench}
            loading={loading}
          />
          <KpiCard
            label="Total Hours"
            value={loading ? "—" : String(Math.round(totals.hours * 10) / 10)}
            icon={Clock}
            loading={loading}
          />
          <KpiCard
            label="Total Revenue"
            value={loading ? "—" : formatMNT(totals.revenue)}
            icon={DollarSign}
            loading={loading}
          />
          <KpiCard
            label="Avg Satisfaction"
            value={
              loading
                ? "—"
                : totals.avgSatisfaction > 0
                  ? `${totals.avgSatisfaction.toFixed(1)} / 5`
                  : "No reviews"
            }
            icon={Star}
            loading={loading}
          />
        </div>

        {/* Chart + Leaderboard */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Bar Chart */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="size-4" />
                Revenue by Mechanic
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[220px] w-full" />
              ) : chartData.length === 0 ? (
                <Typography.Muted className="text-sm text-center py-12">
                  No data for this period
                </Typography.Muted>
              ) : (
                <>
                  <Typography.Muted className="text-xs text-center text-muted-foreground pb-2">
                    Showing top {chartData.length} of {mechanics.length}{" "}
                    mechanics
                  </Typography.Muted>
                  <BarChart
                    data={chartData}
                    config={{
                      value: { label: "Revenue", color: "var(--chart-1)" },
                    }}
                    xKey="name"
                    series={[{ key: "value", color: "var(--chart-1)" }]}
                    height={220}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Leaderboard Table */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Crown className="size-4" />
                Mechanic Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full mb-2" />
                  ))}
                </div>
              ) : mechanics.length === 0 ? (
                <Typography.Muted className="text-sm text-center py-12">
                  No mechanic data for this period
                </Typography.Muted>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="px-4 py-3 w-8">#</TableHead>
                      <TableHead className="px-4 py-3">Mechanic</TableHead>
                      {(
                        [
                          "work_orders_completed",
                          "hours_worked",
                          "total_revenue",
                          "revenue_per_hour",
                          "total_commission",
                          "avg_satisfaction",
                        ] as const
                      ).map((key) => (
                        <TableHead
                          key={key}
                          className="px-4 py-3 text-right cursor-pointer select-none hover:text-foreground transition-colors"
                          onClick={() => handleSort(key)}
                        >
                          <span className="inline-flex items-center gap-1">
                            {key === "work_orders_completed"
                              ? "Jobs"
                              : key === "hours_worked"
                                ? "Hours"
                                : key === "total_revenue"
                                  ? "Revenue"
                                  : key === "revenue_per_hour"
                                    ? "Rev/Hr"
                                    : key === "avg_satisfaction"
                                      ? "Rating"
                                      : "Commission"}
                            {sortKey === key && (
                              <span className="text-[10px]">
                                {sortDir === "asc" ? "▲" : "▼"}
                              </span>
                            )}
                          </span>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedMechanics.map((m, i) => (
                      <TableRow
                        key={m.mechanic_id}
                        className={`border-b border-border hover:bg-muted/30 cursor-pointer ${
                          i === 0 ? "bg-amber-50/40 dark:bg-amber-950/10" : ""
                        }`}
                        onClick={() => setSelectedMechanic(m)}
                      >
                        <TableCell className="px-4 py-3">
                          {i === 0 ? (
                            <Crown className="size-4 text-amber-500" />
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              {i + 1}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 font-medium">
                          <div className="flex items-center gap-2">
                            <span>{m.mechanic_name}</span>
                            {i === 0 && (
                              <span className="text-[10px] font-medium text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                                Top
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right tabular-nums">
                          {m.work_orders_completed}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {m.hours_worked > 0
                            ? Math.round(m.hours_worked * 10) / 10
                            : "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right font-medium tabular-nums">
                          {formatMNT(m.total_revenue)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {m.revenue_per_hour > 0
                            ? formatMNT(Math.round(m.revenue_per_hour))
                            : "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right tabular-nums">
                          {m.total_commission > 0 ? (
                            <span className="text-green-600">
                              {formatMNT(m.total_commission)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right tabular-nums">
                          {m.avg_satisfaction != null ? (
                            <span className="inline-flex items-center gap-1">
                              <Star className="size-3 text-amber-400 fill-amber-400" />
                              {m.avg_satisfaction.toFixed(1)}
                              <span className="text-muted-foreground text-[10px]">
                                ({m.total_reviews})
                              </span>
                              {m.total_reviews < 5 && (
                                <span className="text-[9px] text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 px-1 py-0.5 rounded ml-0.5">
                                  Low
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mechanic Detail Sheet */}
      <Sheet
        open={selectedMechanic !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedMechanic(null);
        }}
      >
        <SheetContent
          side="right"
          className="flex flex-col p-0 overflow-hidden"
        >
          {selectedMechanic && (
            <>
              <SheetHeader className="p-6 pb-4 shrink-0 text-left border-b border-border">
                <SheetTitle className="text-xl font-bold flex items-center gap-2">
                  <span>{selectedMechanic.mechanic_name}</span>
                  {selectedMechanic === sortedMechanics[0] && (
                    <span className="text-[10px] font-medium text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                      Top
                    </span>
                  )}
                </SheetTitle>
                <SheetDescription>
                  Performance breakdown for the selected period
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* KPI grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <Typography.Muted className="text-xs">
                      Jobs Completed
                    </Typography.Muted>
                    <p className="text-xl font-semibold tabular-nums mt-1">
                      {selectedMechanic.work_orders_completed}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <Typography.Muted className="text-xs">
                      Hours Worked
                    </Typography.Muted>
                    <p className="text-xl font-semibold tabular-nums mt-1">
                      {selectedMechanic.hours_worked > 0
                        ? Math.round(selectedMechanic.hours_worked * 10) / 10
                        : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <Typography.Muted className="text-xs">
                      Total Revenue
                    </Typography.Muted>
                    <p className="text-xl font-semibold tabular-nums mt-1">
                      {formatMNT(selectedMechanic.total_revenue)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <Typography.Muted className="text-xs">
                      Revenue / Hour
                    </Typography.Muted>
                    <p className="text-xl font-semibold tabular-nums mt-1">
                      {selectedMechanic.revenue_per_hour > 0
                        ? formatMNT(
                            Math.round(selectedMechanic.revenue_per_hour),
                          )
                        : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <Typography.Muted className="text-xs">
                      Avg Revenue / Job
                    </Typography.Muted>
                    <p className="text-xl font-semibold tabular-nums mt-1">
                      {selectedMechanic.avg_revenue_per_wo > 0
                        ? formatMNT(selectedMechanic.avg_revenue_per_wo)
                        : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <Typography.Muted className="text-xs">
                      Customer Rating
                    </Typography.Muted>
                    <p className="text-xl font-semibold tabular-nums mt-1 flex items-center gap-1.5">
                      {selectedMechanic.avg_satisfaction != null ? (
                        <>
                          <Star className="size-4 text-amber-400 fill-amber-400" />
                          {selectedMechanic.avg_satisfaction.toFixed(1)}
                          <span className="text-sm text-muted-foreground font-normal">
                            / 5 ({selectedMechanic.total_reviews} review
                            {selectedMechanic.total_reviews !== 1 ? "s" : ""})
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground/50 text-base">
                          No reviews
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <Typography.Muted className="text-xs">
                      Commission
                    </Typography.Muted>
                    <p className="text-xl font-semibold tabular-nums mt-1">
                      {selectedMechanic.total_commission > 0 ? (
                        <span className="text-green-600">
                          {formatMNT(selectedMechanic.total_commission)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Service / Parts breakdown */}
                <div>
                  <Typography.Muted className="text-xs font-medium mb-2">
                    Service vs Parts Breakdown
                  </Typography.Muted>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                      <span className="text-sm">Services Performed</span>
                      <span className="text-sm font-medium tabular-nums">
                        {selectedMechanic.services_count}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                      <span className="text-sm">Parts Used</span>
                      <span className="text-sm font-medium tabular-nums">
                        {selectedMechanic.parts_count}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Reviews */}
                {selectedMechanic.recent_reviews.length > 0 && (
                  <div>
                    <Typography.Muted className="text-xs font-medium mb-2">
                      Recent Reviews ({selectedMechanic.recent_reviews.length})
                    </Typography.Muted>
                    <div className="space-y-2">
                      {selectedMechanic.recent_reviews.map((review, idx) => (
                        <div
                          key={`${review.date}-${idx}`}
                          className="rounded-lg bg-muted/50 px-3 py-2.5"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={`size-3 ${
                                    i < review.rating
                                      ? "text-amber-400 fill-amber-400"
                                      : "text-muted-foreground/20"
                                  }`}
                                />
                              ))}
                              <span className="text-xs text-muted-foreground ml-1">
                                {review.customer_name ?? "Anonymous"}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground/60">
                              {new Date(review.date).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </span>
                          </div>
                          {review.feedback && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              "{review.feedback}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rank context */}
                <div>
                  <Typography.Muted className="text-xs font-medium mb-2">
                    Period Context
                  </Typography.Muted>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <Typography.Muted className="text-xs">
                      This mechanic is ranked{" "}
                      <strong className="text-foreground">
                        #
                        {sortedMechanics.findIndex(
                          (sm) =>
                            sm.mechanic_id === selectedMechanic.mechanic_id,
                        ) + 1}
                      </strong>{" "}
                      of {mechanics.length} mechanics by revenue
                    </Typography.Muted>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
