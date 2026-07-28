"use client";

import {
  Car,
  ClipboardList,
  Clock,
  DollarSign,
  Lightbulb,
  PiggyBank,
  Plus,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import dynamicImport from "next/dynamic";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Typography } from "@/components/ui/typography";
import { useCurrentUserRole } from "@/hooks/use-current-user-role";
import { useIsFirstLoad } from "@/hooks/use-is-first-load";
import { usePageHeader } from "@/hooks/use-page-header";
import { useSelectedBranchGuard } from "@/hooks/use-selected-branch-guard";
import type { ExportColumn } from "@/lib/export";
import { useRealtimeMulti } from "@/lib/hooks/use-realtime-multi";
import { useRouter } from "@/lib/i18n/navigation";
import { dashboardKeys } from "@/lib/queries/keys";
import {
  type DashboardPeriod,
  useDashboard,
} from "@/lib/queries/use-dashboard";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { WorkOrderDetail } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { KpiCard } from "./_kpi-cards";
import { LowStockCard } from "./_low-stock-card";
import { RecentWorkOrdersTable } from "./_recent-work-orders";
import { SectionHeader } from "./_section-header";

const ChartsSection = dynamicImport(() => import("./_charts"), {
  ssr: false,
  loading: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      {[1, 2].map((n) => (
        <Card key={n}>
          <div className="p-6 pb-2">
            <Skeleton className="h-5 w-44" />
          </div>
          <div className="p-6 pt-2">
            <Skeleton className="h-72 w-full rounded-lg" />
          </div>
        </Card>
      ))}
    </div>
  ),
});

const PERIODS: DashboardPeriod[] = ["today", "week", "month", "all"];
const PERIOD_LABEL_KEYS: Record<DashboardPeriod, string> = {
  today: "dashboard.periodToday",
  week: "dashboard.periodWeek",
  month: "dashboard.periodMonth",
  all: "dashboard.periodAll",
};
const PERIOD_STORAGE_KEY = "dashboard-period";

interface KpiTrend {
  direction: "up" | "down" | "neutral";
  value: string;
}

/** Percent change vs previous period, or null when there is no baseline. */
function computeTrend(
  current: number,
  previous: number | null | undefined,
): KpiTrend | null {
  if (previous == null || previous <= 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (!Number.isFinite(pct)) return null;
  return {
    direction: pct > 0 ? "up" : pct < 0 ? "down" : "neutral",
    value: `${pct > 0 ? "+" : ""}${pct}%`,
  };
}

export default function DashboardPage() {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const router = useRouter();
  const { openDrawer } = usePageHeader();
  const { isMechanic, loading: roleLoading } = useCurrentUserRole();

  // Redirect mechanics to bay view
  useEffect(() => {
    if (!roleLoading && isMechanic) {
      router.replace("/dashboard/bay-view");
    }
  }, [roleLoading, isMechanic, router]);
  // React Query hooks
  const { data: org, isPending: orgLoading, error: orgError } = useCurrentOrg();
  const orgId = org?.orgId;
  // Skip branch selection and dashboard queries for mechanics
  // (they get redirected to bay view, and these APIs return 403).
  // Also skip while role is still loading — we need to know if user
  // is a mechanic before firing these queries.
  const effectiveOrgId = roleLoading
    ? undefined
    : isMechanic
      ? undefined
      : orgId;
  useSelectedBranchGuard(effectiveOrgId);

  // Period selector — "month" gives previous-period trends and insights by default
  const [period, setPeriod] = useState<DashboardPeriod>("month");
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PERIOD_STORAGE_KEY);
      if (stored && PERIODS.includes(stored as DashboardPeriod)) {
        setPeriod(stored as DashboardPeriod);
      }
    } catch {
      /* ignore */
    }
  }, []);
  const changePeriod = useCallback((next: DashboardPeriod) => {
    setPeriod(next);
    try {
      localStorage.setItem(PERIOD_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  // Realtime: refresh dashboard when core tables change
  useRealtimeMulti({
    enabled: !!orgId,
    tables: [
      {
        table: "work_orders",
        queryKey: dashboardKeys.all(orgId ?? "", null),
        filter: `organization_id=eq.${orgId}`,
      },
      {
        table: "customers",
        queryKey: dashboardKeys.all(orgId ?? "", null),
        filter: `organization_id=eq.${orgId}`,
      },
    ],
  });
  const {
    data,
    isPending: dashboardLoading,
    isFetching: dashboardFetching,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useDashboard(effectiveOrgId, {
    period,
    branchId: null,
  });
  const isFirstLoad = useIsFirstLoad(!!data);

  // Show skeletons only during initial load or when stale data was never loaded
  // During period switching, keepPreviousData shows old data — show subtle indicator instead
  const isInitialLoad = !data && dashboardLoading;
  const isPeriodSwitch = data && dashboardFetching;
  const showSkeletons = isInitialLoad || (isFirstLoad && !data);

  const summary = data?.summary ?? null;

  // ── Empty state for new orgs ──
  const isEmpty = !!(
    data &&
    summary &&
    summary.totalRevenue === 0 &&
    summary.totalCustomers === 0 &&
    summary.activeWorkOrders === 0
  );
  const comparison = data?.summaryComparison ?? null;
  const insights = data?.insights ?? [];
  const workOrders = data?.recentWorkOrders ?? [];

  // Redirect when org not selected
  useEffect(() => {
    if (!orgId && !orgLoading && !dashboardLoading && !dashboardError) {
      router.replace("/auth/select-organization?returnUrl=/dashboard");
    }
  }, [orgId, orgLoading, dashboardLoading, dashboardError, router]);

  const dashboardExportColumns: ExportColumn<WorkOrderDetail>[] = useMemo(
    () => [
      {
        key: "id",
        label: t("workOrders.id"),
        value: (wo) => wo.id.slice(0, 8),
      },
      {
        key: "customer",
        label: t("customers.name"),
        value: (wo) =>
          wo.customer
            ? `${wo.customer.first_name ?? ""} ${wo.customer.last_name ?? ""}`.trim()
            : "—",
      },
      {
        key: "vehicle",
        label: t("workOrders.vehicle"),
        value: (wo) => wo.vehicle?.plate_number ?? "—",
      },
      { key: "status", label: t("workOrders.status") },
      {
        key: "grand_total",
        label: t("common.total"),
        format: "currency" as const,
        value: (wo) =>
          (wo.services ?? []).reduce(
            (s: number, x: { final_price: number }) =>
              s + Number(x.final_price),
            0,
          ) +
          (wo.parts ?? []).reduce(
            (s: number, x: { final_price: number }) =>
              s + Number(x.final_price),
            0,
          ),
      },
      {
        key: "created_at",
        label: t("workOrders.date"),
        format: "date" as const,
      },
    ],
    [t],
  );

  const hasError = !!(orgError || (dashboardError && isFirstLoad));
  const errorText = orgError
    ? "Failed to load organization"
    : (dashboardError?.message ?? null);

  const revenueTrendKpi = computeTrend(
    summary?.totalRevenue ?? 0,
    comparison?.totalRevenue,
  );
  const aroTrendKpi = computeTrend(
    summary?.avgRepairOrderValue ?? 0,
    comparison?.avgRepairOrderValue,
  );
  const vsPrevLabel = t("dashboard.vsPrevPeriod");

  const totalRevenue = summary?.totalRevenue ?? 0;
  const servicePct =
    totalRevenue > 0
      ? Math.round(((summary?.serviceRevenue ?? 0) / totalRevenue) * 100)
      : 0;
  const partsPct =
    totalRevenue > 0
      ? Math.round(((summary?.partsRevenue ?? 0) / totalRevenue) * 100)
      : 0;

  const secondaryStats: {
    key: string;
    label: string;
    value: string;
    sub: string | null;
    icon: typeof PiggyBank;
    loading: boolean;
  }[] = [
    {
      key: "grossProfit",
      label: t("dashboard.grossProfit"),
      value: formatCurrency(summary?.grossProfit ?? 0),
      sub: t("dashboard.marginLabel", {
        percent: Math.round(summary?.marginPercent ?? 0),
      }),
      icon: PiggyBank,
      loading: showSkeletons,
    },
    {
      key: "serviceRevenue",
      label: t("dashboard.serviceRevenue"),
      value: formatCurrency(summary?.serviceRevenue ?? 0),
      sub: t("dashboard.ofRevenue", { percent: servicePct }),
      icon: TrendingUp,
      loading: showSkeletons,
    },
    {
      key: "partsRevenue",
      label: t("dashboard.partsRevenue"),
      value: formatCurrency(summary?.partsRevenue ?? 0),
      sub: t("dashboard.ofRevenue", { percent: partsPct }),
      icon: DollarSign,
      loading: showSkeletons,
    },
    {
      key: "totalVehicles",
      label: t("dashboard.totalVehicles"),
      value: String(summary?.totalVehicles ?? 0),
      sub: null,
      icon: Car,
      loading: showSkeletons,
    },
  ];

  // ── Always render page structure, skeleton-load values ──
  return (
    <div className="relative">
      {/* Subtle loading bar during period switches — data stays visible via keepPreviousData */}
      {isPeriodSwitch && (
        <div className="absolute top-0 left-0 right-0 z-50">
          <div className="h-0.5 bg-muted overflow-hidden">
            <div className="h-full w-full bg-primary animate-pulse" />
          </div>
        </div>
      )}
      <div className="flex flex-col gap-8 pb-8">
        {/* Inline error banner */}
        {hasError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive flex items-center justify-between">
            <span>{errorText ?? t("common.noData")}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={
                dashboardError
                  ? () => refetchDashboard()
                  : () => window.location.reload()
              }
            >
              {t("common.retry")}
            </Button>
          </div>
        )}

        {/* Header: greeting + period selector + quick actions */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Typography.H2 className="m-0">
              {t("dashboard.welcome")}
            </Typography.H2>
            <Typography.Muted className="mt-1">
              {t("dashboard.subtitle")}
            </Typography.Muted>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ToggleGroup
              variant="outline"
              size="sm"
              value={[period]}
              onValueChange={(values) => {
                const next = values[0] as DashboardPeriod | undefined;
                if (next && next !== period) changePeriod(next);
              }}
              className="gap-1"
            >
              {PERIODS.map((p) => (
                <ToggleGroupItem key={p} value={p}>
                  {t(PERIOD_LABEL_KEYS[p])}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openDrawer("newCustomer")}
              >
                <UserPlus className="size-4" />
                {t("dashboard.newCustomer")}
              </Button>
              <Button size="sm" onClick={() => openDrawer("newWorkOrder")}>
                <Plus className="size-4" />
                {t("dashboard.newWorkOrder")}
              </Button>
            </div>
          </div>
        </div>

        {/* Inventory alert — renders only when parts are low/out of stock */}
        {orgId && <LowStockCard orgId={orgId} />}

        {isEmpty && !showSkeletons && (
          <Card className="border-dashed border-primary/30 bg-primary/5">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                <ClipboardList className="size-8 text-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <Typography.H3>{t("dashboard.emptyTitle")}</Typography.H3>
                <Typography.Muted>
                  {t("dashboard.emptyDescription")}
                </Typography.Muted>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" onClick={() => openDrawer("newWorkOrder")}>
                  <Plus className="size-4" />
                  {t("dashboard.createFirstWorkOrder")}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => openDrawer("newCustomer")}
                >
                  <UserPlus className="size-4" />
                  {t("dashboard.addCustomer")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 4 KPI cards — always visible, skeleton shows for values while loading */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <KpiCard
            label={t("dashboard.totalRevenue")}
            value={formatCurrency(summary?.totalRevenue ?? 0)}
            icon={DollarSign}
            loading={showSkeletons}
            accentKey="totalRevenue"
            trend={revenueTrendKpi}
            comparisonLabel={revenueTrendKpi ? vsPrevLabel : undefined}
            sparklineData={
              data?.revenueTrend?.map((p) => ({ value: p.revenue })) ??
              undefined
            }
            sparklineColor="var(--chart-1)"
          />
          <KpiCard
            label={t("dashboard.activeWorkOrders")}
            value={String(summary?.activeWorkOrders ?? 0)}
            icon={Clock}
            loading={showSkeletons}
            accentKey="activeWorkOrders"
          />
          <KpiCard
            label={t("dashboard.totalCustomers")}
            value={String(summary?.totalCustomers ?? 0)}
            icon={Users}
            loading={showSkeletons}
            accentKey="totalCustomers"
            sparklineData={
              data?.customerAcquisitionTrend?.map((p) => ({
                value: p.newCustomers,
              })) ?? undefined
            }
            sparklineColor="var(--chart-2)"
          />
          <KpiCard
            label={t("dashboard.avgRepairOrder")}
            value={formatCurrency(summary?.avgRepairOrderValue ?? 0)}
            icon={TrendingUp}
            loading={showSkeletons}
            accentKey="avgRepairOrder"
            trend={aroTrendKpi}
            comparisonLabel={aroTrendKpi ? vsPrevLabel : undefined}
          />
        </div>

        {/* Secondary metrics strip: profit, revenue mix, fleet size */}
        <Card className="overflow-hidden py-0">
          <CardContent className="grid grid-cols-2 gap-px bg-border p-0 lg:grid-cols-4">
            {secondaryStats.map((stat) => (
              <div key={stat.key} className="flex flex-col gap-1 bg-card p-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <stat.icon className="size-3.5" aria-hidden="true" />
                  {stat.label}
                </div>
                {stat.loading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <div className="text-lg font-semibold tracking-tight tabular-nums">
                    {stat.value}
                  </div>
                )}
                {!stat.loading && stat.sub && (
                  <span className="text-xs text-muted-foreground">
                    {stat.sub}
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Smart insights — only when the API produced comparisons */}
        {insights.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex gap-3 p-4">
              <Lightbulb
                className="mt-0.5 size-5 shrink-0 text-amber-500"
                aria-hidden="true"
              />
              <div className="flex flex-col gap-1.5">
                <Typography.Text className="text-sm font-medium">
                  {t("dashboard.insights")}
                </Typography.Text>
                <ul className="flex list-none flex-col gap-1 text-sm text-muted-foreground">
                  {insights.map((insight) => (
                    <li key={insight}>{insight}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts — use dynamic import's own loading skeleton */}
        {data ? (
          <ChartsSection data={data} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {[1, 2].map((n) => (
              <Card key={n}>
                <div className="p-6 pb-2">
                  <Skeleton className="h-5 w-44" />
                </div>
                <div className="p-6 pt-2">
                  <Skeleton className="h-72 w-full rounded-lg" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Recent Work Orders */}
        <div>
          <SectionHeader
            title={t("dashboard.recentWorkOrders")}
            description={t("dashboard.recentWorkOrdersDesc")}
          />
          {data ? (
            <RecentWorkOrdersTable
              workOrders={workOrders}
              router={router}
              t={t}
              workOrdersForExport={dashboardExportColumns}
            />
          ) : (
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/40 p-4"
                >
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="h-3 w-2/5" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-lg" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export { DashboardPage };
