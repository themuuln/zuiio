"use client";

import { format } from "date-fns";
import {
  BarChart3,
  Clock,
  Crown,
  DollarSign,
  Star,
  Users,
  Wrench,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { z } from "zod";
import { BarChart } from "@/components/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { Skeleton } from "@/components/ui/skeleton";

import { Typography } from "@/components/ui/typography";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { useBranches } from "@/lib/queries/use-branches";
import {
  useMechanicCommissions,
  useMechanicHours,
  useMechanicKpis,
} from "@/lib/queries/use-mechanic-performance";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useReportMechanicLeaderboard } from "@/lib/queries/use-reports";
import { useSelectedBranchId } from "@/lib/stores";
import type { MechanicReview } from "@/lib/types/service-params";
import { cn, formatMNT } from "@/lib/utils";

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

interface LeaderboardItem {
  mechanic_id: string;
  mechanic_name: string;
  avatar_url: string | null;
  total_orders: number;
  completed_orders: number;
  revenue: number;
  parts_cost: number;
  avg_hours_per_order: number;
}

const mechanicPerformanceFilterSchema = z.object({
  dateRange: z
    .object({
      from: z.date().optional(),
      to: z.date().optional(),
    })
    .optional(),
});

type MechanicPerformanceFilterValues = z.infer<
  typeof mechanicPerformanceFilterSchema
>;

const ACCENT_MAP = {
  teal: {
    dot: "bg-teal-500",
    icon: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-50/60 dark:bg-teal-950/20 ring-teal-500/15",
  },
  green: {
    dot: "bg-green-500",
    icon: "text-green-600 dark:text-green-400",
    bg: "bg-green-50/60 dark:bg-green-950/20 ring-green-500/15",
  },
  amber: {
    dot: "bg-amber-500",
    icon: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50/60 dark:bg-amber-950/20 ring-amber-500/15",
  },
  blue: {
    dot: "bg-blue-500",
    icon: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50/60 dark:bg-blue-950/20 ring-blue-500/15",
  },
} as const;

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "teal" | "green" | "amber" | "blue";
  loading?: boolean;
}) {
  const a = ACCENT_MAP[accent];
  return (
    <div className="group relative flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm shadow-black/5 transition-[transform,box-shadow] duration-200 hover:shadow-md hover:-translate-y-0.5">
      <span
        className={cn(
          "absolute right-3 top-3 size-1.5 rounded-full shadow-[0_0_6px] transition-opacity",
          a.dot,
          loading ? "opacity-30" : "opacity-100",
        )}
      />
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 transition-colors duration-200",
          a.bg,
          a.icon,
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <Typography.Muted className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {label}
        </Typography.Muted>
        {loading ? (
          <Skeleton className="mt-1.5 h-7 w-20" />
        ) : (
          <Typography.Text className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight [font-feature-settings:'tnum']">
            {value}
          </Typography.Text>
        )}
      </div>
    </div>
  );
}

export default function MechanicPerformancePage() {
  const t = useTranslations("mechanicPerformance") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const { data: org, isPending: orgLoading } = useCurrentOrg();
  const orgId = org?.orgId;
  const { data: branches } = useBranches(orgId);
  const form = useForm<MechanicPerformanceFilterValues>({
    resolver: zodResolver(mechanicPerformanceFilterSchema),
    defaultValues: {
      dateRange: (() => {
        const now = new Date();
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const start = new Date(end);
        start.setDate(start.getDate() - 29);
        return { from: start, to: end };
      })(),
    },
  });
  const watchedDateRange = form.watch("dateRange");
  // ── Compute date range ────────────────────────────
  const selectedRange = useMemo(() => {
    if (!watchedDateRange?.from) return null;
    const start = watchedDateRange.from.toISOString().slice(0, 10);
    const end = (watchedDateRange.to ?? watchedDateRange.from)
      .toISOString()
      .slice(0, 10);
    return { start, end };
  }, [watchedDateRange]);

  const selectedBranchId = useSelectedBranchId();
  const branchFilter = selectedBranchId === "all" ? null : selectedBranchId;
  const branchName =
    selectedBranchId === "all"
      ? t("allBranches")
      : (branches?.find((b) => b.id === selectedBranchId)?.name ??
        t("selectedBranch"));

  // ── React Query hooks ────────────────────────────
  const { data: reportsData, isPending: reportsLoading } = useMechanicKpis(
    orgId,
    selectedRange,
    branchFilter,
  );
  const { data: hoursData, isPending: hoursLoading } = useMechanicHours(
    orgId,
    selectedRange,
  );
  const { data: commissionsData, isPending: commissionsLoading } =
    useMechanicCommissions(orgId, selectedRange);
  const { data: leaderboardData = [], isPending: leaderboardLoading } =
    useReportMechanicLeaderboard(orgId, "month");
  const leaderboard = (leaderboardData ?? []) as LeaderboardItem[];

  // ── Merge query results into MechanicPerf[] ──────
  const mechanics = useMemo(() => {
    const kpis = reportsData?.mechanic_kpis ?? [];
    const hoursMap = new Map<string, number>();
    for (const h of hoursData ?? []) hoursMap.set(h.mechanic_id, h.total_hours);
    const commMap = new Map<string, number>();
    for (const c of commissionsData ?? [])
      commMap.set(c.mechanic_id, c.total_commission);

    return kpis.map((k) => {
      const hours = hoursMap.get(k.mechanic_id) ?? 0;
      return {
        ...k,
        hours_worked: hours,
        total_commission: commMap.get(k.mechanic_id) ?? 0,
        revenue_per_hour: hours > 0 ? k.total_revenue / hours : 0,
        avg_satisfaction: k.avg_satisfaction ?? null,
        total_reviews: k.total_reviews ?? 0,
        recent_reviews: k.recent_reviews ?? [],
      };
    });
  }, [reportsData, hoursData, commissionsData]);

  const loading = reportsLoading || hoursLoading || commissionsLoading;

  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  useEffect(() => {
    if (!loading && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [loading, hasLoadedOnce]);

  const showSkeleton = orgLoading && !hasLoadedOnce;

  // ── Sorting ────────────────────────────────────────
  type SortKey = keyof MechanicPerf;
  type SortDir = "asc" | "desc";
  // Ensure sort type includes all possible keys

  const [sortKey, setSortKey] = useState<SortKey>("total_revenue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const _handleSort = (key: SortKey) => {
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

  // ── Detail sheet state ───────────────────────────
  const [selectedMechanic, setSelectedMechanic] = useState<MechanicPerf | null>(
    null,
  );

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

  return (
    <>
      <div className="px-4 pt-4 pb-6 md:px-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between min-w-0 flex-wrap">
          <div>
            <Typography.H1 className="text-2xl font-semibold tracking-tight">
              {t("title")}
            </Typography.H1>
            {showSkeleton ? (
              <Skeleton className="h-4 w-72 mt-1" />
            ) : (
              <Typography.Muted className="text-muted-foreground">
                {watchedDateRange?.from
                  ? t("subtitle", {
                      from: format(watchedDateRange.from, "MMM d, yyyy"),
                      to: format(
                        watchedDateRange.to ?? watchedDateRange.from,
                        "MMM d, yyyy",
                      ),
                      branch: branchName,
                    })
                  : t("subtitleNoDates", { branch: branchName })}
              </Typography.Muted>
            )}
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <DateRangePicker
              align="end"
              className="w-full min-w-0 sm:w-[16rem]"
              value={watchedDateRange as DateRange | undefined}
              onChange={(range) =>
                form.setValue(
                  "dateRange",
                  range as MechanicPerformanceFilterValues["dateRange"],
                )
              }
            />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-3 grid-cols-5">
          <KpiCard
            label={t("activeMechanics")}
            value={loading ? "—" : String(totals.mechanics)}
            icon={Users}
            accent="teal"
            loading={showSkeleton}
          />
          <KpiCard
            label={t("jobsCompleted")}
            value={loading ? "—" : String(totals.jobs)}
            icon={Wrench}
            accent="green"
            loading={showSkeleton}
          />
          <KpiCard
            label={t("totalHours")}
            value={loading ? "—" : String(Math.round(totals.hours * 10) / 10)}
            icon={Clock}
            accent="amber"
            loading={showSkeleton}
          />
          <KpiCard
            label={t("totalRevenue")}
            value={loading ? "—" : formatMNT(totals.revenue)}
            icon={DollarSign}
            accent="blue"
            loading={showSkeleton}
          />
          <KpiCard
            label={t("avgSatisfaction")}
            value={
              loading
                ? "—"
                : totals.avgSatisfaction > 0
                  ? `${totals.avgSatisfaction.toFixed(1)} / 5`
                  : t("noReviews")
            }
            icon={Star}
            accent="amber"
            loading={showSkeleton}
          />
        </div>

        {/* Chart + Leaderboard */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Bar Chart */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="size-4" />
                {t("revenueByMechanic")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showSkeleton ? (
                <Skeleton className="h-[220px] w-full" />
              ) : chartData.length === 0 ? (
                <Typography.Muted className="text-sm text-center py-12">
                  {t("noData")}
                </Typography.Muted>
              ) : (
                <>
                  <Typography.Muted className="text-xs text-center text-muted-foreground pb-2">
                    {t("showingTop", {
                      count: chartData.length,
                      total: mechanics.length,
                    })}
                  </Typography.Muted>
                  <BarChart
                    data={chartData}
                    config={{
                      value: {
                        label: t("chartRevenue"),
                        color: "var(--chart-1)",
                      },
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
          <Card className="lg:col-span-2 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Crown className="size-4" />
                {t("leaderboard")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {leaderboardLoading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : leaderboard.length === 0 ? (
                <Typography.Muted className="text-sm text-center py-12">
                  {t("noMechanicData")}
                </Typography.Muted>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60">
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 w-10">
                          #
                        </th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                          {t("colMechanic")}
                        </th>
                        <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                          {t("colJobs")}
                        </th>
                        <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                          {t("colRevenue")}
                        </th>
                        <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                          {t("colHours")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((item, i) => {
                        const isTop = i === 0;
                        const initials = item.mechanic_name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase();
                        return (
                          <tr
                            key={item.mechanic_id}
                            className={cn(
                              "border-b border-border/40 transition-colors",
                              "hover:bg-muted/40",
                              isTop &&
                                "bg-amber-50/40 dark:bg-amber-950/15 ring-1 ring-amber-500/20",
                            )}
                          >
                            <td className="px-4 py-3">
                              {isTop ? (
                                <Crown className="size-4 text-amber-500" />
                              ) : (
                                <span className="text-xs text-muted-foreground/60 font-medium">
                                  {i + 1}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={cn(
                                    "flex size-7 items-center justify-center rounded-full text-[10px] font-bold shrink-0",
                                    "bg-primary/10 text-primary",
                                  )}
                                >
                                  {initials}
                                </span>
                                <span
                                  className={cn(
                                    "font-medium",
                                    isTop && "text-foreground",
                                  )}
                                >
                                  {item.mechanic_name}
                                </span>
                                {isTop && (
                                  <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full leading-none">
                                    #1
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums font-medium">
                              {item.total_orders}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums font-semibold">
                              {formatMNT(item.revenue)}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-muted-foreground/70">
                              {item.avg_hours_per_order > 0 ? (
                                Math.round(item.avg_hours_per_order * 10) / 10
                              ) : (
                                <span className="text-muted-foreground/30">
                                  —
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mechanic Detail Sheet */}
      <DetailDrawer
        open={selectedMechanic !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedMechanic(null);
        }}
        size="lg"
      >
        {selectedMechanic && (
          <>
            <DetailDrawer.Header className="p-6 pb-4 shrink-0 text-left border-b border-border">
              <DetailDrawer.Title className="text-xl font-bold flex items-center gap-2">
                <span>{selectedMechanic.mechanic_name}</span>
                {selectedMechanic === sortedMechanics[0] && (
                  <span className="text-[10px] font-medium text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                    {t("topBadge")}
                  </span>
                )}
              </DetailDrawer.Title>
              <DetailDrawer.Description>
                {t("performanceBreakdown")}
              </DetailDrawer.Description>
            </DetailDrawer.Header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* KPI grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <Typography.Muted className="text-xs">
                    {t("jobsCompleted")}
                  </Typography.Muted>
                  <p className="text-xl font-semibold tabular-nums mt-1">
                    {selectedMechanic.work_orders_completed}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <Typography.Muted className="text-xs">
                    {t("hoursWorked")}
                  </Typography.Muted>
                  <p className="text-xl font-semibold tabular-nums mt-1">
                    {selectedMechanic.hours_worked > 0
                      ? Math.round(selectedMechanic.hours_worked * 10) / 10
                      : "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <Typography.Muted className="text-xs">
                    {t("totalRevenue")}
                  </Typography.Muted>
                  <p className="text-xl font-semibold tabular-nums mt-1">
                    {formatMNT(selectedMechanic.total_revenue)}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <Typography.Muted className="text-xs">
                    {t("revenuePerHour")}
                  </Typography.Muted>
                  <p className="text-xl font-semibold tabular-nums mt-1">
                    {selectedMechanic.revenue_per_hour > 0
                      ? formatMNT(Math.round(selectedMechanic.revenue_per_hour))
                      : "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <Typography.Muted className="text-xs">
                    {t("avgRevenuePerJob")}
                  </Typography.Muted>
                  <p className="text-xl font-semibold tabular-nums mt-1">
                    {selectedMechanic.avg_revenue_per_wo > 0
                      ? formatMNT(selectedMechanic.avg_revenue_per_wo)
                      : "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <Typography.Muted className="text-xs">
                    {t("customerRating")}
                  </Typography.Muted>
                  <p className="text-xl font-semibold tabular-nums mt-1 flex items-center gap-1.5">
                    {selectedMechanic.avg_satisfaction != null ? (
                      <>
                        <Star className="size-4 text-amber-400 fill-amber-400" />
                        {selectedMechanic.avg_satisfaction.toFixed(1)}
                        <span className="text-sm text-muted-foreground font-normal">
                          / 5 ({selectedMechanic.total_reviews}{" "}
                          {selectedMechanic.total_reviews !== 1
                            ? t("reviews")
                            : t("review")}
                          )
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground/50 text-base">
                        {t("noReviews")}
                      </span>
                    )}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <Typography.Muted className="text-xs">
                    {t("commission")}
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
                  {t("servicePartsBreakdown")}
                </Typography.Muted>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-sm">{t("servicesPerformed")}</span>
                    <span className="text-sm font-medium tabular-nums">
                      {selectedMechanic.services_count}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-sm">{t("partsUsed")}</span>
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
                    {t("recentReviews", {
                      count: selectedMechanic.recent_reviews.length,
                    })}
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
                              {review.customer_name ?? t("anonymous")}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground/60">
                            {new Date(review.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
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
                  {t("periodContext")}
                </Typography.Muted>
                <div className="rounded-lg bg-muted/50 p-3">
                  <Typography.Muted className="text-xs">
                    {t("rankContext", {
                      rank:
                        sortedMechanics.findIndex(
                          (sm) =>
                            sm.mechanic_id === selectedMechanic.mechanic_id,
                        ) + 1,
                      total: mechanics.length,
                    })}
                  </Typography.Muted>
                </div>
              </div>
            </div>
          </>
        )}
      </DetailDrawer>
    </>
  );
}
