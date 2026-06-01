"use client";

import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  Coins,
  Play,
  Square,
  UserPlus,
  Users,
  Wrench,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { PickupCompleteData } from "@/components/bay-view-v2/pickup-complete-dialog";
import { PickupCompleteDialog } from "@/components/bay-view-v2/pickup-complete-dialog";
import { MechanicSelect } from "@/components/mechanic-select";
import { NewMechanicSheet } from "@/components/new-mechanic-sheet";
import { RecentList } from "@/components/sidebar-tabs/recent-list";
import { StatusSummary } from "@/components/sidebar-tabs/status-summary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { useClientNow } from "@/hooks/use-client-now";
import { useQueryClient } from "@tanstack/react-query";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { useCurrentUserRole } from "@/hooks/use-current-user-role";
import {
  useMechanicEod,
  useMechanicWorkOrders,
  useMechanicTrend,
  useClockStatus,
  useClockToggle,
  useMechanicsList,
} from "@/lib/queries/use-mechanic-dashboard";
import { useUpdateWorkOrderStatus } from "@/lib/queries/use-work-order-detail";
import { cn, formatMNT } from "@/lib/utils";

const MechanicTrendChart = dynamic(
  () => import("../_charts").then((m) => m.MechanicTrendChart),
  { ssr: false },
);

// ── Types ──────────────────────────────────────────

interface WorkOrderRow {
  id: string;
  status: string;
  description: string | null;
  total: number;
  customer_name: string | null;
  vehicle_plate: string | null;
  vehicle_id: string | null;
  created_at: string;
}

// ── Status config ──────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; bar: string; dot: string; bg: string }
> = {
  New: {
    label: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    bar: "bg-blue-500",
    dot: "bg-blue-500",
    bg: "hover:bg-blue-50/50 dark:hover:bg-blue-950/10",
  },
  Diagnosing: {
    label:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    bar: "bg-yellow-500",
    dot: "bg-yellow-500",
    bg: "hover:bg-yellow-50/50 dark:hover:bg-yellow-950/10",
  },
  "In Progress": {
    label:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    bar: "bg-orange-500",
    dot: "bg-orange-500 animate-pulse",
    bg: "hover:bg-orange-50/50 dark:hover:bg-orange-950/10",
  },
  "Ready for Pickup": {
    label:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    bar: "bg-green-500",
    dot: "bg-green-500 animate-pulse",
    bg: "hover:bg-green-50/50 dark:hover:bg-green-950/10",
  },
  Completed: {
    label: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    bar: "bg-gray-400",
    dot: "bg-gray-400",
    bg: "hover:bg-gray-50/50 dark:hover:bg-gray-950/10",
  },
  Cancelled: {
    label: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    bar: "bg-red-400",
    dot: "bg-red-400",
    bg: "hover:bg-red-50/50 dark:hover:bg-red-950/10",
  },
};

// ── Allowed status transitions ──────────────────────────

const NEXT_STATUSES: Record<string, string[]> = {
  New: ["Diagnosing"],
  Diagnosing: ["In Progress"],
  "In Progress": ["Ready for Pickup"],
  "Ready for Pickup": ["Completed"],
};

function getStatusCfg(status: string) {
  return (
    STATUS_CONFIG[status] ?? {
      label: "bg-muted text-muted-foreground",
      bar: "bg-border",
      dot: "bg-muted-foreground",
      bg: "hover:bg-muted/30",
    }
  );
}

// ── Helpers ────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  return `${h}h ${mins % 60}m`;
}

// ── KPI Card ───────────────────────────────────────

const ACCENT_MAP = {
  blue: {
    dot: "bg-blue-500",
    icon: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50/60 dark:bg-blue-950/20 ring-blue-500/15",
  },
  green: {
    dot: "bg-emerald-500",
    icon: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50/60 dark:bg-emerald-950/20 ring-emerald-500/15",
  },
  amber: {
    dot: "bg-amber-500",
    icon: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50/60 dark:bg-amber-950/20 ring-amber-500/15",
  },
} as const;

function KpiCard({
  icon: Icon,
  label,
  value,
  subtext,
  accent,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtext?: string;
  accent: "blue" | "green" | "amber";
  loading?: boolean;
}) {
  const a = ACCENT_MAP[accent];

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm shadow-black/5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
      )}
    >
      {/* Accent dot */}
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
        {subtext && !loading && (
          <Typography.Muted className="mt-0.5 text-[11px] text-muted-foreground/60">
            {subtext}
          </Typography.Muted>
        )}
      </div>
    </div>
  );
}

// ── Work Order Row ─────────────────────────────────

function WorkOrderRow({
  wo,
  onClick,
  onStatusChange,
}: {
  wo: WorkOrderRow;
  onClick: () => void;
  onStatusChange: (newStatus: string) => void;
}) {
  const cfg = getStatusCfg(wo.status);
  const elapsed = timeAgo(wo.created_at);

  const nextStatuses = (() => {
    const transitions = NEXT_STATUSES[wo.status] ?? [];
    if (wo.status !== "Cancelled" && wo.status !== "Completed") {
      return [...transitions, "Cancelled"];
    }
    return transitions;
  })();

  const canChange = nextStatuses.length > 0;

  return (
    <button
      type="button"
      aria-label={`Open work order for ${wo.customer_name ?? "customer"}`}
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-center gap-3 border-b border-border/40 px-4 py-3 text-left transition-all duration-150 last:border-b-0 h-auto rounded-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        cfg.bg,
        "hover:pl-5",
      )}
    >
      {/* Status color bar */}
      <span
        className={cn(
          "absolute left-0 top-0 h-full w-0.5 transition-all duration-200",
          cfg.bar,
          "group-hover:w-1",
        )}
      />

      {/* Status dot */}
      <span className={cn("size-2 shrink-0 rounded-full shadow-sm", cfg.dot)} />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {wo.customer_name ?? "—"}
          </span>
          <span className="hidden sm:inline text-[11px] text-muted-foreground/50">
            {wo.vehicle_plate ?? ""}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
          <span className="truncate max-w-[200px]">
            {wo.description ?? "No description"}
          </span>
          <span className="text-[10px] text-muted-foreground/40 shrink-0">
            · {elapsed}
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="text-sm font-semibold tabular-nums text-foreground/80">
          {formatMNT(wo.total ?? 0)}
        </span>
        {canChange ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-0.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              <Badge
                className={cn(
                  cfg.label,
                  "border-0 text-[10px] font-semibold px-2 py-0.5",
                )}
                variant="secondary"
              >
                {wo.status}
              </Badge>
              <ChevronDown className="size-3 text-muted-foreground/50 shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={4}>
              <DropdownMenuGroup>
                {nextStatuses.map((status) => {
                  const sc = getStatusCfg(status);
                  return (
                    <DropdownMenuItem
                      key={status}
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange(status);
                      }}
                      className="gap-2"
                    >
                      {status === "Cancelled" ? (
                        <X className="size-3.5 text-destructive" />
                      ) : (
                        <span
                          className={cn("size-2 shrink-0 rounded-full", sc.dot)}
                        />
                      )}
                      <span className="text-xs">{status}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Badge
            className={cn(
              cfg.label,
              "border-0 text-[10px] font-semibold px-2 py-0.5",
            )}
            variant="secondary"
          >
            {wo.status}
          </Badge>
        )}
      </div>
    </button>
  );
}

// ── Clock In/Out Button ────────────────────────────

function ClockInOutButton({
  clockedIn,
  since,
  onToggle,
  loading,
}: {
  clockedIn: boolean;
  since: string | null;
  onToggle: () => void;
  loading: boolean;
}) {
  const t = useTranslations();
  const now = useClientNow();
  const elapsed =
    clockedIn && since
      ? formatElapsed(new Date(since).getTime(), now.getTime())
      : null;

  return (
    <Button
      variant={clockedIn ? "destructive" : "default"}
      onClick={onToggle}
      disabled={loading}
      className={cn(
        "gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm",
        !clockedIn &&
          "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50",
        clockedIn && "border-red-300 dark:border-red-800",
        loading && "opacity-50 cursor-not-allowed",
      )}
    >
      {clockedIn ? (
        <Square className="size-4 shrink-0" />
      ) : (
        <Play className="size-4 shrink-0 translate-x-0.5" />
      )}
      <span>{clockedIn ? t("mechanic.clockOut") : t("mechanic.clockIn")}</span>
      {elapsed && (
        <span className="tabular-nums text-xs font-mono text-muted-foreground/70">
          {elapsed}
        </span>
      )}
    </Button>
  );
}

function formatElapsed(start: number, end: number): string {
  const diff = Math.max(0, end - start);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// ── MechanicDashboard ──────────────────────────────

function MechanicDashboard({
  userId,
  orgId,
  mechanicName,
  isAdminView,
}: {
  userId: string;
  orgId: string;
  mechanicName?: string | null;
  isAdminView: boolean;
}) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const now = useClientNow();
  const { push } = useRouter();
  const { registerTab, unregisterTab } = useRightSidebar();

  // ── Queries ──
  const eodQuery = useMechanicEod(orgId, userId);
  const woQuery = useMechanicWorkOrders(orgId, userId);
  const trendQuery = useMechanicTrend(orgId, userId);
  const clockQuery = useClockStatus(orgId);
  const [pendingPickupComplete, setPendingPickupComplete] = useState<{
    woId: string;
    vehicleId: string;
    vehiclePlate: string;
    totalCost: number;
  } | null>(null);

  const eod = eodQuery.data ?? null;
  const assignedWos = woQuery.data ?? [];
  const trend = trendQuery.data ?? null;
  const clockStatus = clockQuery.data ?? {
    clockedIn: false,
    since: null,
    todayHours: 0,
  };

  // Combined loading: show skeleton until main data loads
  const mainDataPending =
    eodQuery.isPending || woQuery.isPending || trendQuery.isPending;
  const dataLoading = mainDataPending;
  const isRefreshing =
    (eodQuery.isFetching ||
      woQuery.isFetching ||
      trendQuery.isFetching ||
      clockQuery.isFetching) &&
    !mainDataPending;
  const clockLoading = clockQuery.isFetching;

  // Sort: active/pickup first, then new, then rest
  const sortedWos = useMemo(() => {
    const priority: Record<string, number> = {
      "In Progress": 0,
      "Ready for Pickup": 1,
      New: 2,
      Diagnosing: 3,
    };
    return (assignedWos ?? []).toSorted(
      (a, b) => (priority[a.status] ?? 99) - (priority[b.status] ?? 99),
    );
  }, [assignedWos]);

  // ── Mount: register tabs + open sidebar (once) ────────
  useEffect(() => {
    registerTab("stats", "Stats", null, <BarChart3 className="size-4" />);
    registerTab("jobs", "Jobs", null, <Wrench className="size-4" />);
    return () => {
      unregisterTab("stats");
      unregisterTab("jobs");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerTab, unregisterTab]);

  // ── Data: update tab content without reopening ─────────
  useEffect(() => {
    registerTab(
      "stats",
      "Stats",
      <StatusSummary
        title="Today"
        items={[
          { label: "Completed Today", count: eod?.work_orders_completed ?? 0 },
          { label: "Revenue Today", count: eod?.total_revenue ?? 0 },
          {
            label: "Active Jobs",
            count: assignedWos.length,
            color: "secondary",
          },
        ]}
      />,
      <BarChart3 className="size-4" />,
    );

    registerTab(
      "jobs",
      "Jobs",
      <RecentList
        title="Assigned"
        items={sortedWos.map((wo) => ({
          id: wo.id,
          primary: wo.vehicle_plate ?? "—",
          secondary: wo.status,
          timestamp: timeAgo(wo.created_at),
          href: `/dashboard/work-orders/${wo.id}`,
        }))}
        loading={dataLoading}
        emptyMessage="No active work orders"
      />,
    );
  }, [eod, assignedWos, sortedWos, dataLoading, registerTab]);

  const updateStatus = useUpdateWorkOrderStatus(orgId);
  const clockMutation = useClockToggle(orgId);

  const handleClockToggle = () => {
    const action = clockStatus.clockedIn ? "clock-out" : "clock-in";
    clockMutation.mutate(action, {
      onSuccess: () => {
        toast.success(
          clockStatus.clockedIn
            ? t("mechanic.clockedOut")
            : t("mechanic.clockedIn"),
        );
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Network error");
      },
    });
  };

  const handlePickupCompleteConfirm = async (data: PickupCompleteData) => {
    if (!pendingPickupComplete) return;
    const { woId } = pendingPickupComplete;

    try {
      const { saveCompletionData } = await import(
        "@/lib/services/post-service-service"
      );
      await saveCompletionData({
        workOrderId: woId,
        vehicleId: pendingPickupComplete.vehicleId,
        customerSatisfaction: data.customerSatisfaction,
        customerFeedback: data.customerFeedback,
        nextAppointmentDate: data.nextAppointmentDate,
      });

      await updateStatus.mutateAsync({ woId, status: "Completed" });
      toast.success("Completed");
    } catch {
      toast.error("Failed to complete work order");
    } finally {
      setPendingPickupComplete(null);
    }
  };

  const handleStatusChange = async (woId: string, newStatus: string) => {
    // Intercept Completed — show PickupCompleteDialog instead of direct update
    if (newStatus === "Completed") {
      const wo = assignedWos.find((w) => w.id === woId);
      if (wo) {
        setPendingPickupComplete({
          woId,
          vehicleId: wo.vehicle_id ?? "",
          vehiclePlate: wo.vehicle_plate ?? "",
          totalCost: Number(wo.total),
        });
        return;
      }
    }

    // Optimistic update on work orders list
    queryClient.setQueryData(
      ["organizations", orgId, "mechanics", userId, "work-orders"],
      (prev: WorkOrderRow[] | undefined) =>
        (prev ?? []).map((w) =>
          w.id === woId ? { ...w, status: newStatus } : w,
        ),
    );
    try {
      await updateStatus.mutateAsync({ woId, status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
    } catch {
      // Refetch will correct optimistic update on error
      queryClient.invalidateQueries({
        queryKey: ["organizations", orgId, "mechanics", userId, "work-orders"],
      });
    }
  };

  return (
    <div className="tablet-touch flex flex-col gap-6">
      {/* ── Header (non-admin only — admin page renders its own) ── */}
      {!isAdminView && (
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <Typography.H1 className="text-xl font-semibold tracking-tight">
                {mechanicName ?? t("nav.mechanic")}
              </Typography.H1>
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-50/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px] shadow-emerald-500/60" />
                Live
              </span>
            </div>
            <Typography.Muted className="mt-0.5 text-xs text-muted-foreground/60">
              {now.toLocaleDateString("mn-MN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Typography.Muted>
          </div>
          <ClockInOutButton
            clockedIn={clockStatus.clockedIn}
            since={clockStatus.since}
            onToggle={handleClockToggle}
            loading={clockLoading}
          />
        </div>
      )}

      {/* ── Refresh indicator ── */}
      {isRefreshing && (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50 -mt-3">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Updating...
        </div>
      )}

      {/* ── KPI Grid ── */}
      <div className="grid gap-3 sm:grid-cols-4">
        <KpiCard
          icon={CheckCircle2}
          label={t("mechanic.completedToday")}
          value={eod?.work_orders_completed ?? 0}
          subtext={t("mechanic.servicesAndParts", {
            services: eod?.services_count ?? 0,
            parts: eod?.parts_count ?? 0,
          })}
          accent="green"
          loading={dataLoading}
        />
        <KpiCard
          icon={Coins}
          label={t("mechanic.revenueToday")}
          value={formatMNT(eod?.total_revenue ?? 0)}
          subtext={t("mechanic.fromCompleted")}
          accent="blue"
          loading={dataLoading}
        />
        <KpiCard
          icon={ClipboardList}
          label={t("mechanic.activeJobs")}
          value={assignedWos.length}
          subtext={
            isAdminView
              ? t("mechanic.assignedToMechanic")
              : t("mechanic.assignedToYou")
          }
          accent="amber"
          loading={dataLoading}
        />
        <KpiCard
          icon={Clock}
          label={t("mechanic.hoursToday")}
          value={clockStatus.todayHours.toFixed(1)}
          subtext={
            clockStatus.clockedIn
              ? t("mechanic.clockedIn")
              : t("mechanic.clockedOut")
          }
          accent="blue"
        />
      </div>

      {/* ── Efficiency KPIs ── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <KpiCard
          icon={Coins}
          label="Avg Job Value"
          value={trend ? formatMNT(trend.avgJobValue) : "—"}
          subtext="Revenue per completed order"
          accent="blue"
          loading={dataLoading}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Jobs Per Day"
          value={trend ? String(trend.jobsPerDay) : "—"}
          subtext="Average over selected period"
          accent="green"
          loading={dataLoading}
        />
      </div>

      {/* ── Trend Chart ── */}
      {trend?.weeklyTrend && trend.weeklyTrend.length > 0 && (
        <MechanicTrendChart data={trend.weeklyTrend} />
      )}

      {/* ── Work Orders ── */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm shadow-black/5">
        <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
          <Wrench className="size-4 text-muted-foreground/60" />
          <span className="text-sm font-semibold">
            {isAdminView
              ? t("mechanic.mechanicWorkOrders")
              : t("mechanic.myWorkOrders")}
          </span>
          <span className="ml-auto text-[10px] text-muted-foreground/50">
            {sortedWos.length} job{sortedWos.length !== 1 ? "s" : ""}
          </span>
        </div>

        {dataLoading ? (
          <div className="flex flex-col gap-0">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={`skeleton-${i}`}
                className="h-16 w-full rounded-none border-b border-border/30 last:border-b-0"
              />
            ))}
          </div>
        ) : sortedWos.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardList />
              </EmptyMedia>
              <EmptyTitle>{t("mechanic.noActiveWorkOrders")}</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="divide-y-0">
            {sortedWos.map((wo) => (
              <WorkOrderRow
                key={wo.id}
                wo={wo}
                onClick={() => push(`/dashboard/work-orders/${wo.id}`)}
                onStatusChange={(newStatus) =>
                  handleStatusChange(wo.id, newStatus)
                }
              />
            ))}
          </div>
        )}
      </div>

      {pendingPickupComplete && (
        <PickupCompleteDialog
          open={!!pendingPickupComplete}
          onOpenChange={(open) => {
            if (!open) setPendingPickupComplete(null);
          }}
          woId={pendingPickupComplete.woId}
          vehiclePlate={pendingPickupComplete.vehiclePlate}
          totalCost={pendingPickupComplete.totalCost}
          onConfirm={handlePickupCompleteConfirm}
        />
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────

export default function MechanicPage() {
  const t = useTranslations();
  const now = useClientNow();
  const {
    profile,
    loading: roleLoading,
    isMechanic,
    isAdmin,
  } = useCurrentUserRole();
  const pageQueryClient = useQueryClient();
  const mechanicsQuery = useMechanicsList(profile?.organizationId ?? undefined);
  const mechanics = mechanicsQuery.data ?? [];
  const mechanicsLoading = mechanicsQuery.isPending;
  const [selectedMechanicId, setSelectedMechanicId] = useState<string | null>(
    null,
  );
  const [showAddMechanic, setShowAddMechanic] = useState(false);

  // Auto-select the first mechanic once loaded
  useEffect(() => {
    if (mechanics.length > 0 && !selectedMechanicId) {
      setSelectedMechanicId(mechanics[0].id);
    }
  }, [mechanics, selectedMechanicId]);

  if (roleLoading) {
    return (
      <div className="tablet-touch flex flex-col gap-6">
        <div>
          <Skeleton className="h-7 w-44" />
          <Skeleton className="mt-1.5 h-4 w-56" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={`skeleton-${i}`}
              className="rounded-xl border border-border/60 bg-card p-4"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-7 w-16" />
              <Skeleton className="mt-1 h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!isMechanic && !isAdmin && !roleLoading) {
    return (
      <div className="tablet-touch flex flex-col items-center justify-center py-20 gap-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50">
          <Wrench className="size-7 text-muted-foreground" />
        </div>
        <Typography.H2 className="text-lg font-semibold">
          Mechanic Dashboard
        </Typography.H2>
        <Typography.Muted className="text-sm text-muted-foreground text-center max-w-md">
          This view is for mechanics. Your current role is{" "}
          <strong>{profile?.roleName ?? "unknown"}</strong>.{"\n"}
          Ask your admin to assign you the Mechanic role to access this page.
        </Typography.Muted>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <>
        {mechanicsLoading ? (
          <div className="tablet-touch flex flex-col gap-6">
            <div>
              <Skeleton className="h-7 w-44" />
              <Skeleton className="mt-1.5 h-4 w-56" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={`skeleton-${i}`}
                  className="rounded-xl border border-border/60 bg-card p-4"
                >
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-2 h-7 w-16" />
                  <Skeleton className="mt-1 h-3 w-20" />
                </div>
              ))}
            </div>
          </div>
        ) : mechanics.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyTitle>{t("mechanic.noMechanics")}</EmptyTitle>
              <EmptyDescription>
                {t("mechanic.noMechanicsDesc")}
              </EmptyDescription>
            </EmptyHeader>
            <Button onClick={() => setShowAddMechanic(true)} className="mt-4">
              <UserPlus className="mr-2 size-4" />
              Invite mechanic
            </Button>
          </Empty>
        ) : selectedMechanicId ? (
          <div className="tablet-touch flex flex-col gap-6">
            {/* Admin header with selector */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <Typography.H1 className="text-xl font-semibold tracking-tight">
                    {mechanics.find((m) => m.id === selectedMechanicId)
                      ?.full_name ?? t("nav.mechanic")}
                  </Typography.H1>
                  <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-50/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px] shadow-emerald-500/60" />
                    Live
                  </span>
                </div>
                <Typography.Muted className="mt-0.5 text-xs text-muted-foreground/60">
                  {now.toLocaleDateString("mn-MN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Typography.Muted>
              </div>

              <div className="flex items-center gap-2">
                <Users className="size-4 text-muted-foreground/50 shrink-0" />
                <MechanicSelect
                  value={selectedMechanicId ?? ""}
                  onChange={setSelectedMechanicId}
                  mechanics={mechanics}
                  placeholder={t("mechanic.selectMechanic")}
                  size="sm"
                  className="w-[200px]"
                />
              </div>
            </div>

            <MechanicDashboard
              userId={selectedMechanicId}
              orgId={profile?.organizationId!}
              mechanicName={
                mechanics.find((m) => m.id === selectedMechanicId)?.full_name
              }
              isAdminView
            />
          </div>
        ) : null}
        <NewMechanicSheet
          open={showAddMechanic}
          onOpenChange={(open) => {
            setShowAddMechanic(open);
            if (!open) {
              pageQueryClient.invalidateQueries({
                queryKey: [
                  "organizations",
                  profile?.organizationId!,
                  "mechanics",
                  "list",
                ],
              });
            }
          }}
        />
      </>
    );
  }

  return (
    <>
      <MechanicDashboard
        userId={profile?.id!}
        orgId={profile?.organizationId!}
        mechanicName={profile?.fullName}
        isAdminView={false}
      />
      <NewMechanicSheet
        open={showAddMechanic}
        onOpenChange={(open) => {
          setShowAddMechanic(open);
          if (!open) {
            pageQueryClient.invalidateQueries({
              queryKey: [
                "organizations",
                profile?.organizationId!,
                "mechanics",
                "list",
              ],
            });
          }
        }}
      />
    </>
  );
}
