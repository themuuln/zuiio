"use client";

import {
  Activity,
  AreaChartIcon,
  Car,
  ClipboardList,
  Clock,
  DollarSign,
  LayoutDashboard,
  Percent,
  Plus,
  TrendingUp,
  Users,
  Wrench,
  Target,
  Pencil,
  Check,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardData } from "@/lib/types";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useDashboard } from "@/lib/queries/use-dashboard";
import {
  useOrgSettings,
  useUpdateOrgSettings,
} from "@/lib/queries/use-org-settings";
import { formatCurrency } from "@/lib/utils";

type Period = "today" | "week" | "month" | "all";
type Tab = "overview" | "charts" | "activity";

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
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

// ── Tab Bar ──────────────────────────────────────────────

const TABS: {
  key: Tab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "charts", label: "Charts", icon: AreaChartIcon },
  { key: "activity", label: "Recent Activity", icon: Activity },
];

function TabBar({
  value,
  onChange,
}: {
  value: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl border border-border bg-card p-1 w-fit">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              value === tab.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Icon className="size-4" />
            {tab.label}
          </button>
        );
      })}
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
    <div className="flex gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
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
          <h3 className="text-lg font-semibold">No data yet</h3>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            Start by creating your first work order. Your dashboard will show
            revenue, customer stats, and trends once you have completed work
            orders.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/work-orders/new"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
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

// ── Main Dashboard Page ──────────────────────────────────

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("all");
  const [tab, setTab] = useState<Tab>("overview");
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");

  // ── React Query hooks ───────────────────────────────
  const {
    data: org,
    isPending: orgLoading,
    error: orgError,
  } = useCurrentOrg();
  const orgId = org?.orgId;

  const {
    data,
    isPending: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useDashboard(orgId, period);

  // Combined loading: wait for both org and dashboard
  const loading = orgLoading || (!!orgId && dashboardLoading);

  // Derived error messages for UI
  const errorMessage = orgError
    ? "Failed to load organization"
    : dashboardError
      ? dashboardError.message
      : null;

  // ── Org Settings (daily revenue goal) ──────────────
  const {
    settings,
    isLoading: settingsLoading,
  } = useOrgSettings(orgId);
  const updateSettings = useUpdateOrgSettings(orgId);

  const dailyGoal = settings?.daily_revenue_goal ?? 0;

  const handleSetGoal = useCallback(() => {
    const val = parseInt(goalInput, 10);
    if (isNaN(val) || val < 0) return;
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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
          <h1 className="text-2xl font-bold tracking-tight">
            {t("dashboard.welcome")}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <Card className="py-12">
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground">{t("common.noData")}</p>
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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
          <h1 className="text-2xl font-bold tracking-tight">
            {t("dashboard.welcome")}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <Card className="py-12">
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground">
              {errorMessage ?? t("common.noData")}
            </p>
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
          <h1 className="text-2xl font-bold tracking-tight">
            {t("dashboard.welcome")}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <EmptyDashboardState onRetry={() => refetchDashboard()} />
      </div>
    );
  }

  // Active WOs exist but none completed — partial state
  if (!hasRevenue && hasActiveWos) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t("dashboard.welcome")}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {t("dashboard.subtitle")}
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <PeriodBar value={period} onChange={handlePeriodChange} />
            <TabBar value={tab} onChange={setTab} />
          </div>
        </div>

        {tab === "overview" && (
          <>
            <Card className="border-amber-200/50 bg-amber-50/30 dark:border-amber-800/30 dark:bg-amber-950/10">
              <CardContent className="flex items-start gap-3 py-4">
                <TrendingUp className="mt-0.5 size-5 shrink-0 text-amber-500" />
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{summary.activeWorkOrders} work order{summary.activeWorkOrders === 1 ? "" : "s"} in progress.</span>
                  {" "}Revenue and metrics appear here once work orders are marked <strong>Completed</strong>.
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
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
          </>
        )}

        {tab === "charts" && <ChartsSection data={data} />}

        {tab === "activity" && (
          <div>
            <SectionHeader
              title={t("dashboard.recentWorkOrders")}
              description={t("dashboard.recentWorkOrdersDesc")}
            />
            <Card>
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
                      {recentWorkOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-16 text-center text-muted-foreground">
                            {t("dashboard.noWorkOrders")}
                          </td>
                        </tr>
                      ) : (
                        recentWorkOrders.map((wo) => {
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
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* ── Header ────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("dashboard.welcome")}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <PeriodBar value={period} onChange={handlePeriodChange} />
          <TabBar value={tab} onChange={setTab} />
        </div>
      </div>

      {/* ── Tab: Overview ─────────────────────────────── */}
      {tab === "overview" && (
        <>
          {/* Daily Revenue Goal */}
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
                      autoFocus
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
                            {formatCurrency(dailyGoal)}{" "}
                            ({Math.round((summary.totalRevenue / dailyGoal) * 100)}
                            %)
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Set a daily revenue target to track your progress.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <SectionHeader title={t("dashboard.keyMetrics")} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
        </>
      )}

      {/* ── Tab: Charts ───────────────────────────────── */}
      {tab === "charts" && <ChartsSection data={data} />}

      {/* ── Tab: Recent Activity ──────────────────────── */}
      {tab === "activity" && (
        <div>
          <SectionHeader
            title={t("dashboard.recentWorkOrders")}
            description={t("dashboard.recentWorkOrdersDesc")}
          />
          <Card>
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
                    {recentWorkOrders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-16 text-center text-muted-foreground"
                        >
                          {t("dashboard.noWorkOrders")}
                        </td>
                      </tr>
                    ) : (
                      recentWorkOrders.map((wo) => {
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
                                  backgroundColor: `${wo.status === "Completed" ? "#22c55e" : wo.status === "Cancelled" ? "#ef4444" : wo.status === "In Progress" ? "#f97316" : wo.status === "Diagnosing" ? "#eab308" : wo.status === "New" ? "#3b82f6" : "#6b7280"}20`,
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
        </div>
      )}

      {/* ── Quick Actions ─────────────────────────────── */}
      <div>
        <SectionHeader title={t("dashboard.quickActions")} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard/work-orders/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Plus className="size-4 text-primary" />
            New Work Order
          </Link>
          <Link
            href="/dashboard/customers/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Users className="size-4 text-primary" />
            New Customer
          </Link>
          <Link
            href="/dashboard/vehicles/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Car className="size-4 text-primary" />
            New Vehicle
          </Link>
          <Link
            href="/dashboard/reports"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <TrendingUp className="size-4 text-primary" />
            View Reports
          </Link>
        </div>
      </div>
    </div>
  );
}
