"use client";

import { Clock, DollarSign, TrendingUp, Users } from "lucide-react";
import dynamicImport from "next/dynamic";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { useCurrentUserRole } from "@/hooks/use-current-user-role";
import { useSelectedBranchGuard } from "@/hooks/use-selected-branch-guard";
import type { ExportColumn } from "@/lib/export";
import { useRealtimeMulti } from "@/lib/hooks/use-realtime-multi";
import { useRouter } from "@/lib/i18n/navigation";
import { dashboardKeys } from "@/lib/queries/keys";
import { useDashboard } from "@/lib/queries/use-dashboard";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { WorkOrderDetail } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { KpiCard } from "./_kpi-cards";
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

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
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
  useSelectedBranchGuard(orgId);

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
        table: "invoices",
        queryKey: dashboardKeys.all(orgId ?? "", null),
        filter: `organization_id=eq.${orgId}`,
      },
      {
        table: "work_order_services",
        queryKey: dashboardKeys.all(orgId ?? "", null),
        filter: `organization_id=eq.${orgId}`,
      },
      {
        table: "work_order_parts",
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
  } = useDashboard(orgId, {
    dateFrom: undefined,
    dateTo: undefined,
    branchId: null,
  });

  // Track first successful load
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  useEffect(() => {
    if (data) setHasLoadedOnce(true);
  }, [data]);

  const isDataLoading = !data || dashboardFetching;

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

  const summary = data?.summary ?? null;
  const hasError = !!(orgError || (dashboardError && !hasLoadedOnce));
  const errorText = orgError
    ? "Failed to load organization"
    : (dashboardError?.message ?? null);

  // ── Always render page structure, skeleton-load values ──
  return (
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

      {/* Simple header */}
      <div>
        <Typography.H2 className="m-0">{t("dashboard.welcome")}</Typography.H2>
        <Typography.Muted className="mt-1">
          {t("dashboard.subtitle")}
        </Typography.Muted>
      </div>

      {/* 4 KPI cards — always visible, skeleton shows for values while loading */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        <KpiCard
          label={t("dashboard.totalRevenue")}
          value={formatCurrency(summary?.totalRevenue ?? 0)}
          icon={DollarSign}
          loading={isDataLoading}
          accentKey="totalRevenue"
        />
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
        <KpiCard
          label={t("dashboard.avgRepairOrder")}
          value={formatCurrency(summary?.avgRepairOrderValue ?? 0)}
          icon={TrendingUp}
          loading={isDataLoading}
          accentKey="avgRepairOrder"
        />
      </div>

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
  );
}
export { DashboardPage };
