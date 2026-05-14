"use client";

import {
  Car,
  Check,
  ClipboardList,
  Clock,
  DollarSign,
  Pencil,
  Percent,
  Plus,
  Target,
  TrendingUp,
  Users,
  Wrench,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { ExportButton } from "@/components/export-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type Period = "today" | "week" | "month" | "all";

const ChartsSection = dynamic(() => import("./_charts"), {
  ssr: false,
  loading: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      {[1, 2].map((n) => (
        <Card key={n}>
          <CardHeader>
            <Skeleton className="h-5 w-44" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-72 w-full rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>
  ),
});

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── KPI Card ─────────────────────────────────────────────

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
    <Card className="transition-shadow hover:shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-9 w-28" />
        ) : (
          <div className="text-3xl font-bold tracking-tight tabular-nums">
            {value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5">
      <Typography.H3 className="m-0">{title}</Typography.H3>
      {description && (
        <Typography.Muted className="mt-1">{description}</Typography.Muted>
      )}
    </div>
  );
}

// ── Period Pills ─────────────────────────────────────────

type PeriodOption = { key: Period; label: string };

function PeriodBar({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  const options: PeriodOption[] = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "all", label: "All Time" },
  ];

  return (
    <div className="flex flex-wrap gap-1.5 tablet:gap-2">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`min-h-[44px] rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors tablet:px-4 ${
            value === opt.key
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────

function EmptyDashboardState({ onRetry }: { onRetry: () => void }) {
  const _t = useTranslations();
  return (
    <Card className="py-16">
      <CardContent className="flex flex-col items-center gap-5">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <TrendingUp className="size-8 text-muted-foreground" />
        </div>
        <div className="max-w-md text-center">
          <Typography.H4 className="m-0">No data yet</Typography.H4>
          <Typography.P className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            Start by creating your first work order. Your dashboard will show
            revenue, customer stats, and trends once you have completed work
            orders.
          </Typography.P>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/work-orders/new"
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" />
            New Work Order
          </Link>
          <Button variant="outline" onClick={onRetry}>
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Recent Work Orders Table ────────────────────────────

function RecentWorkOrdersTable({
  workOrders,
  router,
  t,
  workOrdersForExport,
}: {
  workOrders: DashboardData["recentWorkOrders"];
  router: ReturnType<typeof useRouter>;
  t: ReturnType<typeof useTranslations>;
  workOrdersForExport: ExportColumn<WorkOrderDetail>[];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-0">
        <div />
        <ExportButton
          data={workOrders}
          columns={workOrdersForExport}
          filename={`dashboard-recent-${new Date().toISOString().split("T")[0]}.xlsx`}
          sheetName="Recent Work Orders"
          title={t("dashboard.recentWorkOrders")}
        />
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                  {t("workOrders.id")}
                </th>
                <th className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                  {t("workOrders.customer")}
                </th>
                <th className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                  {t("workOrders.vehicle")}
                </th>
                <th className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                  {t("workOrders.status")}
                </th>
                <th className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                  {t("workOrders.total")}
                </th>
                <th className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                  {t("workOrders.date")}
                </th>
              </tr>
            </thead>
            <tbody>
              {workOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-16 text-center text-muted-foreground"
                  >
                    {t("dashboard.noWorkOrders")}
                  </td>
                </tr>
              ) : (
                workOrders.map((wo) => {
                  const grandTotal =
                    wo.services.reduce(
                      (sum: number, s: { final_price: number }) =>
                        sum + Number(s.final_price),
                      0,
                    ) +
                    wo.parts.reduce(
                      (sum: number, p: { final_price: number }) =>
                        sum + Number(p.final_price),
                      0,
                    );

                  return (
                    <tr
                      key={wo.id}
                      className="border-b border-border transition-colors hover:bg-muted/30 cursor-pointer"
                      onClick={() =>
                        router.push(`/dashboard/work-orders/${wo.id}`)
                      }
                    >
                      <td className="px-5 py-3.5 font-mono text-xs">
                        {wo.id.slice(0, 8)}...
                      </td>
                      <td className="px-5 py-3.5">
                        {wo.customer
                          ? `${wo.customer.first_name} ${wo.customer.last_name ?? ""}`.trim()
                          : "\u2014"}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {wo.vehicle?.plate_number ?? "\u2014"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: `${
                              wo.status === "Completed"
                                ? "#22c55e"
                                : wo.status === "Cancelled"
                                  ? "#ef4444"
                                  : wo.status === "In Progress"
                                    ? "#f97316"
                                    : wo.status === "Diagnosing"
                                      ? "#eab308"
                                      : wo.status === "New"
                                        ? "#3b82f6"
                                        : "#6b7280"
                            }20`,
                            color:
                              wo.status === "Completed"
                                ? "#22c55e"
                                : wo.status === "Cancelled"
                                  ? "#ef4444"
                                  : wo.status === "In Progress"
                                    ? "#f97316"
                                    : wo.status === "Diagnosing"
                                      ? "#eab308"
                                      : wo.status === "New"
                                        ? "#3b82f6"
                                        : "#6b7280",
                          }}
                        >
                          {wo.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium tabular-nums">
                        {formatCurrency(grandTotal)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-muted-foreground">
                        {formatDate(wo.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Quick Actions ───────────────────────────────────────

function QuickActions({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <div>
      <SectionHeader title={t("dashboard.quickActions")} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/dashboard/work-orders/new"
          className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          <Plus className="size-4 text-primary" />
          New Work Order
        </Link>
        <Link
          href="/dashboard/customers/new"
          className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          <Users className="size-4 text-primary" />
          New Customer
        </Link>
        <Link
          href="/dashboard/vehicles/new"
          className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          <Car className="size-4 text-primary" />
          New Vehicle
        </Link>
        <Link
          href="/dashboard/reports"
          className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          <TrendingUp className="size-4 text-primary" />
          View Reports
        </Link>
      </div>
    </div>
  );
}

// ── Main Dashboard Page ──────────────────────────────────

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
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
          wo.services.reduce(
            (s: number, x: { final_price: number }) =>
              s + Number(x.final_price),
            0,
          ) +
          wo.parts.reduce(
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
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-28" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2].map((n) => (
            <Card key={n}>
              <CardHeader>
                <Skeleton className="h-5 w-44" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-72 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── Org Error State (redirect to org selection) ──────
  if (orgError || (!orgId && !orgLoading)) {
    const needsRedirect =
      !orgId && !orgLoading && !dashboardLoading && !dashboardError;
    if (needsRedirect) {
      router.replace("/auth/select-organization?returnUrl=/dashboard");
    }

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
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-28" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2].map((n) => (
            <Card key={n}>
              <CardHeader>
                <Skeleton className="h-5 w-44" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-72 w-full rounded-lg" />
              </CardContent>
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

  const { summary, recentWorkOrders } = data;

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

  // ── Daily Revenue Goal Card ──
  const goalCard = (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Target className="size-4" />
          Daily Revenue Goal
        </CardTitle>
        {!editingGoal && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEditGoal}
            className="h-8"
            aria-label="Set daily goal"
          >
            <Pencil className="size-3.5" />
            {dailyGoal > 0 ? "Edit" : "Set Goal"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {editingGoal ? (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ₮
              </span>
              <input
                type="number"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSetGoal()}
                className="flex h-11 w-full rounded-md border border-input bg-background pl-7 pr-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Enter daily revenue goal"
                min={0}
              />
            </div>
            <Button
              size="sm"
              onClick={handleSetGoal}
              disabled={updateSettings.isPending}
              aria-label="Save goal"
            >
              <Check className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingGoal(false)}
              aria-label="Cancel"
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {settingsLoading ? (
              <Skeleton className="h-9 w-28" />
            ) : dailyGoal > 0 ? (
              <>
                <div className="text-3xl font-bold tracking-tight tabular-nums">
                  {formatCurrency(dailyGoal)}
                </div>
                {summary.totalRevenue > 0 && (
                  <div className="flex-1">
                    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="bg-primary transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.round((summary.totalRevenue / dailyGoal) * 100))}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatCurrency(summary.totalRevenue)} /{" "}
                      {formatCurrency(dailyGoal)} (
                      {Math.round((summary.totalRevenue / dailyGoal) * 100)}%)
                    </p>
                  </div>
                )}
              </>
            ) : (
              <Typography.Muted>
                Set a daily revenue target to track your progress.
              </Typography.Muted>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // ── Active WOs exist but none completed ──
  if (!hasRevenue && hasActiveWos) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div className="flex flex-col gap-8">
          {header}

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

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-2 lg:gap-5">
            <KpiCard
              label={t("dashboard.activeWorkOrders")}
              value={String(summary.activeWorkOrders)}
              icon={Clock}
              loading={dashboardLoading}
            />
            <KpiCard
              label={t("dashboard.totalCustomers")}
              value={String(summary.totalCustomers)}
              icon={Users}
              loading={dashboardLoading}
            />
          </div>

          <ChartsSection data={data} />

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

          <QuickActions t={t} />
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-8 space-y-6">
            <DailyTimeline orgId={orgId ?? ""} />
          </div>
        </aside>
      </div>
    );
  }

  // ── Full dashboard state (has revenue) ──
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
      <div className="flex flex-col gap-8">
        {header}

        {goalCard}

        <SectionHeader title={t("dashboard.keyMetrics")} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          <KpiCard
            label={t("dashboard.totalRevenue")}
            value={formatCurrency(summary.totalRevenue)}
            icon={DollarSign}
            loading={dashboardLoading}
          />
          <KpiCard
            label={t("dashboard.activeWorkOrders")}
            value={String(summary.activeWorkOrders)}
            icon={Clock}
            loading={dashboardLoading}
          />
          <KpiCard
            label={t("dashboard.avgRepairOrder")}
            value={formatCurrency(summary.avgRepairOrderValue)}
            icon={TrendingUp}
            loading={dashboardLoading}
          />
          <KpiCard
            label={t("dashboard.totalCustomers")}
            value={String(summary.totalCustomers)}
            icon={Users}
            loading={dashboardLoading}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          <KpiCard
            label={t("dashboard.serviceRevenue")}
            value={formatCurrency(summary.serviceRevenue)}
            icon={Wrench}
            loading={dashboardLoading}
          />
          <KpiCard
            label={t("dashboard.partsRevenue")}
            value={formatCurrency(summary.partsRevenue)}
            icon={ClipboardList}
            loading={dashboardLoading}
          />
          <KpiCard
            label={t("dashboard.totalVehicles")}
            value={String(summary.totalVehicles)}
            icon={Car}
            loading={dashboardLoading}
          />
          <KpiCard
            label="Service Mix"
            value={`${summary.totalRevenue > 0 ? Math.round((summary.serviceRevenue / summary.totalRevenue) * 100) : 0}%`}
            icon={Percent}
            loading={dashboardLoading}
          />
        </div>

        <ChartsSection data={data} />

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

        <QuickActions t={t} />
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-8 space-y-6">
          <DailyTimeline orgId={orgId ?? ""} />
        </div>
      </aside>
    </div>
  );
}
