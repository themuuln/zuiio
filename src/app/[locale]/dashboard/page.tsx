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
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { BranchSelect } from "@/components/branch-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { useCurrentUserRole } from "@/hooks/use-current-user-role";
import { usePageHeader } from "@/hooks/use-page-header";
import { useSelectedBranchGuard } from "@/hooks/use-selected-branch-guard";
import type { ExportColumn } from "@/lib/export";
import { useRealtimeMulti } from "@/lib/hooks/use-realtime-multi";
import { useRouter } from "@/lib/i18n/navigation";
import { dashboardKeys } from "@/lib/queries/keys";
import { useBranches } from "@/lib/queries/use-branches";
import { useDashboard } from "@/lib/queries/use-dashboard";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useSelectedBranchId, useSetSelectedBranchId } from "@/lib/stores";
import type { WorkOrderDetail } from "@/lib/types";
import { formatCurrency, hasMultipleBranches } from "@/lib/utils";
import { DailyTimeline } from "./_daily-timeline";
import { KpiCard } from "./_kpi-cards";
import { LowStockCard } from "./_low-stock-card";
import { DateFilterBar } from "./_period-bar";
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
  const { isMechanic, loading: roleLoading } = useCurrentUserRole();

  // ── Redirect mechanics to bay view ─────────────────────
  useEffect(() => {
    if (!roleLoading && isMechanic) {
      router.replace("/dashboard/bay-view");
    }
  }, [roleLoading, isMechanic, router]);
  usePageHeader();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const selectedBranchId = useSelectedBranchId();
  const setSelectedBranchId = useSetSelectedBranchId();
  // ── React Query hooks ───────────────────────────────
  const { data: org, isPending: orgLoading, error: orgError } = useCurrentOrg();
  const orgId = org?.orgId;
  const branchFilter = selectedBranchId === "all" ? null : selectedBranchId;
  const { data: branches = [] } = useBranches(orgId);
  useSelectedBranchGuard(orgId);

  // ── Realtime: refresh dashboard when core tables change ────
  useRealtimeMulti({
    enabled: !!orgId,
    tables: [
      {
        table: "work_orders",
        queryKey: dashboardKeys.all(orgId ?? "", branchFilter),
        filter: branchFilter
          ? `organization_id=eq.${orgId},branch_id=eq.${branchFilter}`
          : `organization_id=eq.${orgId}`,
      },
      {
        table: "invoices",
        queryKey: dashboardKeys.all(orgId ?? "", branchFilter),
        filter: branchFilter
          ? `organization_id=eq.${orgId},branch_id=eq.${branchFilter}`
          : `organization_id=eq.${orgId}`,
      },
      {
        table: "work_order_services",
        queryKey: dashboardKeys.all(orgId ?? "", branchFilter),
        filter: `organization_id=eq.${orgId}`,
      },
      {
        table: "work_order_parts",
        queryKey: dashboardKeys.all(orgId ?? "", branchFilter),
        filter: `organization_id=eq.${orgId}`,
      },
      {
        table: "customers",
        queryKey: dashboardKeys.all(orgId ?? "", branchFilter),
        filter: branchFilter
          ? `organization_id=eq.${orgId},branch_id=eq.${branchFilter}`
          : `organization_id=eq.${orgId}`,
      },
    ],
  });

  const dateFrom = dateRange?.from?.toISOString().split("T")[0];
  const dateTo = dateRange?.to?.toISOString().split("T")[0];

  const {
    data,
    isPending: dashboardLoading,
    isFetching: dashboardFetching,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useDashboard(orgId, {
    dateFrom,
    dateTo,
    branchId: branchFilter,
  });

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

  const filteredWorkOrders = useMemo(() => {
    const recentWorkOrders = data?.recentWorkOrders;
    if (!recentWorkOrders) return [];
    if (!dateRange?.from) return recentWorkOrders;

    const fromStart = new Date(dateRange.from);
    fromStart.setHours(0, 0, 0, 0);

    const toEnd = new Date(dateRange.to || dateRange.from);
    toEnd.setHours(23, 59, 59, 999);

    return recentWorkOrders.filter((wo) => {
      if (!wo.created_at) return false;
      const woDate = new Date(wo.created_at);
      return woDate >= fromStart && woDate <= toEnd;
    });
  }, [data?.recentWorkOrders, dateRange]);

  // ── Redirect when org not selected ─────────────────
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
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

  const { summary, summaryComparison, insights } = data ?? {};

  function getTrend(
    current: number,
    previous: number,
    formatAsCurrency: boolean,
  ): { direction: "up" | "down" | "neutral"; value: string } | null {
    if (!summaryComparison) return null;
    const direction =
      current > previous ? "up" : current < previous ? "down" : "neutral";
    return {
      direction,
      value: formatAsCurrency
        ? formatCurrency(Math.abs(current - previous))
        : String(Math.abs(current - previous)),
    };
  }

  const hasRevenue = summary ? summary.totalRevenue > 0 : false;
  const hasActiveWos = summary ? summary.activeWorkOrders > 0 : false;

  // ── Header (shared across partial and full states) ──
  const header = (
    <div className="sticky top-0 z-10 flex-shrink-0 border-b border-border/40 bg-background/80 backdrop-blur-md px-4 py-2.5 select-none">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Typography.H2 className="m-0 text-base font-bold">
          {t("dashboard.welcome")}
        </Typography.H2>
        <div className="flex items-center gap-2">
          {hasMultipleBranches(branches) && (
            <BranchSelect
              value={selectedBranchId}
              onChange={setSelectedBranchId}
              branches={branches}
              placeholder={t("dashboard.branch")}
              allLabel={t("dashboard.allBranches")}
              className="min-w-44"
            />
          )}
          <DateFilterBar value={dateRange} onChange={setDateRange} />
        </div>
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
    <div className="flex flex-col gap-8 pb-8">
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
        className={`grid grid-cols-2 gap-4 sm:grid-cols-2 ${
          hasRevenue ? "lg:grid-cols-4" : "lg:grid-cols-2"
        } lg:gap-6`}
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
              trend={getTrend(
                summary?.avgRepairOrderValue ?? 0,
                summaryComparison?.avgRepairOrderValue ?? 0,
                true,
              )}
            />
          </>
        )}
        <KpiCard
          label={t("dashboard.activeWorkOrders")}
          value={String(summary?.activeWorkOrders ?? 0)}
          icon={Clock}
          loading={isDataLoading}
          accentKey="activeWorkOrders"
          trend={getTrend(
            summary?.activeWorkOrders ?? 0,
            summaryComparison?.activeWorkOrders ?? 0,
            false,
          )}
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
              trend={getTrend(
                summary?.serviceRevenue ?? 0,
                summaryComparison?.serviceRevenue ?? 0,
                true,
              )}
            />
            <KpiCard
              label={t("dashboard.partsRevenue")}
              value={formatCurrency(summary?.partsRevenue ?? 0)}
              icon={ClipboardList}
              loading={isDataLoading}
              accentKey="partsRevenue"
              trend={getTrend(
                summary?.partsRevenue ?? 0,
                summaryComparison?.partsRevenue ?? 0,
                true,
              )}
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
      {data ? <ChartsSection data={data} /> : null}
      {/* ── Timeline (horizontal strip) ── */}
      {orgId && (
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <DailyTimeline orgId={orgId} />
        </div>
      )}
      {orgId && <LowStockCard orgId={orgId} />}
      {insightElements}
      {/* ── Recent Work Orders ── */}
      <div>
        <SectionHeader
          title={t("dashboard.recentWorkOrders")}
          description={t("dashboard.recentWorkOrdersDesc")}
        />
        <RecentWorkOrdersTable
          workOrders={filteredWorkOrders}
          router={router}
          t={t}
          workOrdersForExport={dashboardExportColumns}
        />
      </div>
    </div>
  );

  return mainContent;
}
