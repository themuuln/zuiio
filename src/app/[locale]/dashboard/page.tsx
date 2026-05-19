"use client";

export const dynamic = "force-dynamic";

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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import type { ExportColumn } from "@/lib/export";
import { useDashboard } from "@/lib/queries/use-dashboard";
import {
  useOrgSettings,
  useUpdateOrgSettings,
} from "@/lib/queries/use-org-settings";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { DashboardData, WorkOrderDetail } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { DailyTimeline } from "./_daily-timeline";
import { EmptyDashboardState } from "./_empty-state";
import { GoalCard } from "./_goal-card";
import { KpiCard } from "./_kpi-cards";
import { PeriodBar, type Period } from "./_period-bar";
import { QuickActions } from "./_quick-actions";
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
  const { replace } = useRouter();
  const [period, setPeriod] = useState<Period>("all");
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");

  // ── React Query hooks ───────────────────────────────
  const { data: org, isPending: orgLoading, error: orgError } = useCurrentOrg();
  const orgId = org?.orgId;

  const {
    data,
    isPending: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useDashboard(orgId, period);

  // Derived error messages for UI
  const errorMessage = orgError
    ? "Failed to load organization"
    : dashboardError
      ? dashboardError.message
      : null;

  // ── Org Settings (daily revenue goal) ──────────────
  const { settings, isLoading: settingsLoading } = useOrgSettings(orgId);
  const updateSettings = useUpdateOrgSettings(orgId);

  const dailyGoal = settings?.daily_revenue_goal ?? 0;

  const handleSetGoal = useCallback(() => {
    const val = parseInt(goalInput, 10);
    if (Number.isNaN(val) || val < 0) return;
    updateSettings.mutate({ daily_revenue_goal: val });
    setEditingGoal(false);
  }, [goalInput, updateSettings]);

  const handleEditGoal = useCallback(() => {
    setGoalInput(String(dailyGoal || ""));
    setEditingGoal(true);
  }, [dailyGoal]);

  const handlePeriodChange = useCallback((p: Period) => {
    setPeriod(p);
  }, []);

  const dashboardExportColumns: ExportColumn<WorkOrderDetail>[] = useMemo(
    () => [
      { key: "id", label: "WO #", value: (wo) => wo.id.slice(0, 8) },
      {
        key: "customer",
        label: "Customer",
        value: (wo) =>
          wo.customer
            ? `${wo.customer.first_name ?? ""} ${wo.customer.last_name ?? ""}`.trim()
            : "—",
      },
      {
        key: "vehicle",
        label: "Vehicle",
        value: (wo) => wo.vehicle?.plate_number ?? "—",
      },
      { key: "status", label: "Status" },
      {
        key: "grand_total",
        label: "Total",
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
      { key: "created_at", label: "Date", format: "date" as const },
    ],
    [],
  );

  // ── Org Loading State ───────────────────────────────
  if (orgLoading) {
    return (
      <div className="flex flex-col gap-8">
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

  // ── Redirect when org not selected ─────────────────
  useEffect(() => {
    if (!orgId && !orgLoading && !dashboardLoading && !dashboardError) {
      replace("/auth/select-organization?returnUrl=/dashboard");
    }
  }, [orgId, orgLoading, dashboardLoading, dashboardError, router]);

  // ── Org Error State ────────────────────────────────
  if (orgError || (!orgId && !orgLoading)) {
    return (
      <div className="flex flex-col gap-6">
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

  // ── Dashboard Loading State (first load, no data yet) ──
  if (dashboardLoading && !data) {
    return (
      <div className="flex flex-col gap-8">
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

  // ── Dashboard Error State ────────────────────────────
  if (dashboardError && !data) {
    return (
      <div className="flex flex-col gap-6">
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

  if (!data) return null;

  const { summary, summaryComparison, insights, recentWorkOrders } = data;

  const hasRevenue = summary.totalRevenue > 0;
  const hasActiveWos = summary.activeWorkOrders > 0;

  if (!hasRevenue && !hasActiveWos) {
    return (
      <div className="flex flex-col gap-6">
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
      <PeriodBar value={period} onChange={handlePeriodChange} />
    </div>
  );

  // ── Insights ────────────────────────────────────────
  const insightElements =
    insights.length > 0 ? (
      <div className="flex flex-wrap gap-3">
        {insights.slice(0, hasRevenue ? 3 : 2).map((insight) => (
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
    <>
      {header}
      {!hasRevenue && hasActiveWos && (
        <Card className="border-amber-200/50 bg-amber-50/30 dark:border-amber-800/30 dark:bg-amber-950/10">
          <CardContent className="flex items-start gap-3 py-4">
            <TrendingUp className="mt-0.5 size-5 shrink-0 text-amber-500" />
            <Typography.Muted>
              <span className="font-semibold text-foreground">
                {summary.activeWorkOrders} work order
                {summary.activeWorkOrders === 1 ? "" : "s"} in progress.
              </span>{" "}
              Revenue and metrics appear here once work orders are marked{" "}
              <strong>Completed</strong>.
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
              value={formatCurrency(summary.totalRevenue)}
              icon={DollarSign}
              loading={dashboardLoading}
              accentKey="totalRevenue"
              trend={
                summaryComparison
                  ? {
                      direction:
                        summary.totalRevenue > summaryComparison.totalRevenue
                          ? "up"
                          : summary.totalRevenue <
                              summaryComparison.totalRevenue
                            ? "down"
                            : "neutral",
                      value: formatCurrency(
                        Math.abs(
                          summary.totalRevenue -
                            summaryComparison.totalRevenue,
                        ),
                      ),
                    }
                  : null
              }
            />
            <KpiCard
              label={t("dashboard.avgRepairOrder")}
              value={formatCurrency(summary.avgRepairOrderValue)}
              icon={TrendingUp}
              loading={dashboardLoading}
              accentKey="avgRepairOrder"
            />
          </>
        )}
        <KpiCard
          label={t("dashboard.activeWorkOrders")}
          value={String(summary.activeWorkOrders)}
          icon={Clock}
          loading={dashboardLoading}
          accentKey="activeWorkOrders"
        />
        <KpiCard
          label={t("dashboard.totalCustomers")}
          value={String(summary.totalCustomers)}
          icon={Users}
          loading={dashboardLoading}
          accentKey="totalCustomers"
        />
        {hasRevenue && (
          <>
            <KpiCard
              label={t("dashboard.serviceRevenue")}
              value={formatCurrency(summary.serviceRevenue)}
              icon={Wrench}
              loading={dashboardLoading}
              accentKey="serviceRevenue"
            />
            <KpiCard
              label={t("dashboard.partsRevenue")}
              value={formatCurrency(summary.partsRevenue)}
              icon={ClipboardList}
              loading={dashboardLoading}
              accentKey="partsRevenue"
            />
            <KpiCard
              label={t("dashboard.totalVehicles")}
              value={String(summary.totalVehicles)}
              icon={Car}
              loading={dashboardLoading}
              accentKey="totalVehicles"
            />
            <KpiCard
              label="Service Mix"
              value={`${summary.totalRevenue > 0 ? Math.round((summary.serviceRevenue / summary.totalRevenue) * 100) : 0}%`}
              icon={Percent}
              loading={dashboardLoading}
              accentKey="serviceMix"
            />
          </>
        )}
      </div>
      {insightElements}
      {hasRevenue && <ChartsSection data={data} />}
      <div>
        <SectionHeader
          title={t("dashboard.recentWorkOrders")}
          description={t("dashboard.recentWorkOrdersDesc")}
        />
        <RecentWorkOrdersTable
          workOrders={recentWorkOrders}
          router={router}
          t={t}
          workOrdersForExport={dashboardExportColumns}
        />
      </div>
      <DailyTimeline orgId={orgId ?? ""} />
      <QuickActions t={t} />
    </>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
      <div className="flex flex-col gap-8">{mainContent}</div>
      {hasRevenue && (
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <GoalCard
              dailyGoal={dailyGoal}
              totalRevenue={summary.totalRevenue}
              editingGoal={editingGoal}
              goalInput={goalInput}
              settingsLoading={settingsLoading}
              isPending={updateSettings.isPending}
              onGoalInputChange={setGoalInput}
              onSave={handleSetGoal}
              onCancel={() => setEditingGoal(false)}
              onEdit={handleEditGoal}
            />
          </div>
        </aside>
      )}
    </div>
  );
}
