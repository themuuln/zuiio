"use client";

import {
  Car,
  ClipboardList,
  Clock,
  DollarSign,
  Lightbulb,
  Percent,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import dynamicImport from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import type { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { ExportColumn } from "@/lib/export";
import { useDashboard } from "@/lib/queries/use-dashboard";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { dashboardKeys } from "@/lib/queries/keys";
import { useRealtimeMulti } from "@/lib/hooks/use-realtime-multi";
import type { WorkOrderDetail } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { DailyTimeline } from "./_daily-timeline";
import { EmptyDashboardState } from "./_empty-state";
import { KpiCard } from "./_kpi-cards";
import { LowStockCard } from "./_low-stock-card";
import { type Period, PeriodBar } from "./_period-bar";
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

// ── Main Dashboard Page ──────────────────────────────────

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("all");
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(
    undefined,
  );
  // ── React Query hooks ───────────────────────────────
  const { data: org, isPending: orgLoading, error: orgError } = useCurrentOrg();
  const orgId = org?.orgId;

  // ── Realtime: refresh dashboard when core tables change ────
  useRealtimeMulti({
    enabled: !!orgId,
    tables: [
      {
        table: "work_orders",
        queryKey: dashboardKeys.all(orgId ?? ""),
        filter: `organization_id=eq.${orgId}`,
      },
      {
        table: "invoices",
        queryKey: dashboardKeys.all(orgId ?? ""),
        filter: `organization_id=eq.${orgId}`,
      },
      {
        table: "work_order_services",
        queryKey: dashboardKeys.all(orgId ?? ""),
        filter: `organization_id=eq.${orgId}`,
      },
      {
        table: "work_order_parts",
        queryKey: dashboardKeys.all(orgId ?? ""),
        filter: `organization_id=eq.${orgId}`,
      },
      {
        table: "customers",
        queryKey: dashboardKeys.all(orgId ?? ""),
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
  } = useDashboard(orgId, period);

  // ── Track first successful load (to distinguish initial vs period-change) ──
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  useEffect(() => {
    if (data) setHasLoadedOnce(true);
  }, [data]);

  // ── Loading during period transitions (data flips to undefined, layout stays) ──
  const isDataLoading = !data || dashboardFetching;

  // Derived error messages for UI
  const errorMessage = orgError
    ? "Failed to load organization"
    : dashboardError
      ? dashboardError.message
      : null;

  // ── Redirect when org not selected ─────────────────
  useEffect(() => {
    if (!orgId && !orgLoading && !dashboardLoading && !dashboardError) {
      router.replace("/auth/select-organization?returnUrl=/dashboard");
    }
  }, [orgId, orgLoading, dashboardLoading, dashboardError, router]);

  const handlePeriodChange = useCallback((p: Period) => {
    setPeriod(p);
  }, []);

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
    [],
  );

  // ── Org Loading State ───────────────────────────────
  if (orgLoading) {
    return (
      <div className="flex flex-col gap-8 pb-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-9 w-56" />
            <Skeleton className="mt-1.5 h-5 w-72" />
          </div>
          <Skeleton className="h-9 w-72 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {[1, 2, 3, 4].map((key) => (
            <Card key={key}>
              <div className="p-6 pb-2">
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="p-6 pt-2">
                <Skeleton className="h-9 w-28" />
              </div>
            </Card>
          ))}
        </div>
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
      </div>
    );
  }

  // ── Org Error State ────────────────────────────────
  if (orgError || (!orgId && !orgLoading)) {
    return (
      <div className="flex flex-col gap-6 pb-8">
        <div>
          <Typography.H2 className="m-0">
            {t("dashboard.welcome")}
          </Typography.H2>
          <Typography.Muted className="mt-1">
            {t("dashboard.subtitle")}
          </Typography.Muted>
        </div>
        <Card className="py-12">
          <CardContent className="flex flex-col items-center gap-4">
            <Typography.Muted>{t("common.noData")}</Typography.Muted>
            <Button onClick={() => window.location.reload()}>
              {t("common.retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Dashboard Error State (first load only) ──────────
  if (dashboardError && !data && !hasLoadedOnce) {
    return (
      <div className="flex flex-col gap-6 pb-8">
        <div>
          <Typography.H2 className="m-0">
            {t("dashboard.welcome")}
          </Typography.H2>
          <Typography.Muted className="mt-1">
            {t("dashboard.subtitle")}
          </Typography.Muted>
        </div>
        <Card className="py-12">
          <CardContent className="flex flex-col items-center gap-4">
            <Typography.Muted>
              {errorMessage ?? t("common.noData")}
            </Typography.Muted>
            <Button onClick={() => refetchDashboard()}>
              {t("common.retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { summary, summaryComparison, insights, recentWorkOrders } = data ?? {};

  const filteredWorkOrders = useMemo(() => {
    if (!recentWorkOrders) return [];
    if (!selectedRange || !selectedRange.from) return recentWorkOrders;

    const fromStart = new Date(selectedRange.from);
    fromStart.setHours(0, 0, 0, 0);

    const toEnd = new Date(selectedRange.to || selectedRange.from);
    toEnd.setHours(23, 59, 59, 999);

    return recentWorkOrders.filter((wo) => {
      if (!wo.created_at) return false;
      const woDate = new Date(wo.created_at);
      return woDate >= fromStart && woDate <= toEnd;
    });
  }, [recentWorkOrders, selectedRange]);

  const hasRevenue = summary ? summary.totalRevenue > 0 : false;
  const hasActiveWos = summary ? summary.activeWorkOrders > 0 : false;

  // Only show empty state when we have real data confirming emptiness
  if (data && !hasRevenue && !hasActiveWos) {
    return (
      <div className="flex flex-col gap-6 pb-8">
        <div>
          <Typography.H2 className="m-0">
            {t("dashboard.welcome")}
          </Typography.H2>
          <Typography.Muted className="mt-1">
            {t("dashboard.subtitle")}
          </Typography.Muted>
        </div>
        <EmptyDashboardState onRetry={() => refetchDashboard()} />
      </div>
    );
  }

  // ── Header (shared across partial and full states) ──
  const header = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <Typography.H2 className="m-0">{t("dashboard.welcome")}</Typography.H2>
        <Typography.Muted className="mt-1">
          {t("dashboard.subtitle")}
        </Typography.Muted>
      </div>
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <PeriodBar value={period} onChange={handlePeriodChange} />
      </div>
    </div>
  );

  // ── Insights ────────────────────────────────────────
  const insightElements =
    (insights ?? []).length > 0 ? (
      <div className="flex flex-wrap gap-3">
        {(insights ?? []).slice(0, hasRevenue ? 3 : 2).map((insight) => (
          <div
            key={insight}
            className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-gradient-to-r from-primary/5 to-transparent px-4 py-2.5 text-sm"
          >
            <Lightbulb className="size-4 shrink-0 text-amber-500" />
            <span className="text-muted-foreground">{insight}</span>
          </div>
        ))}
      </div>
    ) : null;

  // ── Shared content ─────────────────────────────────
  const mainContent = (
    <div className="pb-8">
      {header}
      {!hasRevenue && hasActiveWos && (
        <Card className="border-amber-200/50 bg-amber-50/30 dark:border-amber-800/30 dark:bg-amber-950/10">
          <CardContent className="flex items-start gap-3 py-4">
            <TrendingUp className="mt-0.5 size-5 shrink-0 text-amber-500" />
            <Typography.Muted>
              <span className="font-semibold text-foreground">
                {t("dashboard.activeWorkOrderCount", {
                  count: summary?.activeWorkOrders ?? 0,
                })}
              </span>
            </Typography.Muted>
          </CardContent>
        </Card>
      )}
      <div
        className={`grid grid-cols-2 gap-3 sm:grid-cols-2 ${
          hasRevenue ? "lg:grid-cols-4" : "lg:grid-cols-2"
        } lg:gap-5`}
      >
        {hasRevenue && (
          <>
            <KpiCard
              label={t("dashboard.totalRevenue")}
              value={formatCurrency(summary?.totalRevenue ?? 0)}
              icon={DollarSign}
              loading={isDataLoading}
              accentKey="totalRevenue"
              trend={
                summaryComparison
                  ? {
                      direction:
                        (summary?.totalRevenue ?? 0) >
                        (summaryComparison.totalRevenue ?? 0)
                          ? "up"
                          : (summary?.totalRevenue ?? 0) <
                              (summaryComparison.totalRevenue ?? 0)
                            ? "down"
                            : "neutral",
                      value: formatCurrency(
                        Math.abs(
                          (summary?.totalRevenue ?? 0) -
                            (summaryComparison.totalRevenue ?? 0),
                        ),
                      ),
                    }
                  : null
              }
            />
            <KpiCard
              label={t("dashboard.avgRepairOrder")}
              value={formatCurrency(summary?.avgRepairOrderValue ?? 0)}
              icon={TrendingUp}
              loading={isDataLoading}
              accentKey="avgRepairOrder"
            />
          </>
        )}
        <KpiCard
          label={t("dashboard.activeWorkOrders")}
          value={String(summary?.activeWorkOrders ?? 0)}
          icon={Clock}
          loading={isDataLoading}
          accentKey="activeWorkOrders"
        />
        <KpiCard
          label={t("dashboard.totalCustomers")}
          value={String(summary?.totalCustomers ?? 0)}
          icon={Users}
          loading={isDataLoading}
          accentKey="totalCustomers"
        />
        {hasRevenue && (
          <>
            <KpiCard
              label={t("dashboard.serviceRevenue")}
              value={formatCurrency(summary?.serviceRevenue ?? 0)}
              icon={Wrench}
              loading={isDataLoading}
              accentKey="serviceRevenue"
            />
            <KpiCard
              label={t("dashboard.partsRevenue")}
              value={formatCurrency(summary?.partsRevenue ?? 0)}
              icon={ClipboardList}
              loading={isDataLoading}
              accentKey="partsRevenue"
            />
            <KpiCard
              label={t("dashboard.totalVehicles")}
              value={String(summary?.totalVehicles ?? 0)}
              icon={Car}
              loading={isDataLoading}
              accentKey="totalVehicles"
            />
            <KpiCard
              label={t("dashboard.serviceMix")}
              value={`${(summary?.totalRevenue ?? 0) > 0 ? Math.round(((summary?.serviceRevenue ?? 0) / (summary?.totalRevenue ?? 1)) * 100) : 0}%`}
              icon={Percent}
              loading={isDataLoading}
              accentKey="serviceMix"
            />
          </>
        )}
      </div>
      {orgId && <LowStockCard orgId={orgId} />}
      {insightElements}
      {hasRevenue && data ? <ChartsSection data={data} /> : null}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
              <SectionHeader
                title={t("dashboard.recentWorkOrders")}
                description={t("dashboard.recentWorkOrdersDesc")}
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <DateRangePicker
                  value={selectedRange}
                  onChange={setSelectedRange}
                  className="w-full sm:w-[260px]"
                  align="end"
                />
                {selectedRange && selectedRange.from && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-2 text-muted-foreground hover:text-foreground text-xs"
                    onClick={() => setSelectedRange(undefined)}
                  >
                    {t("common.clearFilter")}
                  </Button>
                )}
              </div>
            </div>
            <RecentWorkOrdersTable
              workOrders={filteredWorkOrders}
              router={router}
              t={t}
              workOrdersForExport={dashboardExportColumns}
            />
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <DailyTimeline orgId={orgId ?? ""} />
        </div>
      </div>
    </div>
  );

  return mainContent;
}
