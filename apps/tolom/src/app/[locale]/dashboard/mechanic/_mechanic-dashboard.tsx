"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  Coins,
  Play,
  Search,
  Square,
  Wrench,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ElapsedTimer } from "@/components/bay-view-v2/_elapsed-display";
import type { PickupCompleteData } from "@/components/bay-view-v2/pickup-complete-dialog";
import { PickupCompleteDialog } from "@/components/bay-view-v2/pickup-complete-dialog";
import { ShiftReportDialog } from "@/components/bay-view-v2/shift-report-dialog";
import { StatusNotesModal } from "@/components/bay-view-v2/status-notes-modal";
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
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { useClientNow } from "@/hooks/use-client-now";
import { useRealtimeMulti } from "@/lib/hooks/use-realtime-multi";
import { mechanicKeys } from "@/lib/queries/keys";
import {
  useClockStatus,
  useClockToggle,
  useMechanicEod,
  useMechanicTrend,
  useMechanicWorkOrders,
} from "@/lib/queries/use-mechanic-dashboard";
import { useUpdateWorkOrderStatus } from "@/lib/queries/use-work-order-detail";
import { reportServerError } from "@/lib/sentry-report-server";
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
  started_at: string | null;
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

function timeAgo(dateStr: string, t: (key: string) => string): string {
  const mins = Math.max(
    0,
    Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000),
  );
  if (mins < 1) return t("common.justNow");
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  return `${h}h ${mins % 60}m`;
}

// ── Sub-components ─────────────────────────────────

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
        {subtext && !loading && (
          <Typography.Muted className="mt-0.5 text-[11px] text-muted-foreground/60">
            {subtext}
          </Typography.Muted>
        )}
      </div>
    </div>
  );
}

function WorkOrderRowComponent({
  wo,
  onClick,
  onStatusChange,
}: {
  wo: WorkOrderRow;
  onClick: () => void;
  onStatusChange: (newStatus: string) => void;
}) {
  const t = useTranslations() as (key: string, values?: Record<string, string | number>) => string;
  const cfg = getStatusCfg(wo.status);
  const elapsed = timeAgo(wo.created_at, t);
  const jobTimer = wo.started_at ?? wo.created_at;

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
        "group relative flex w-full items-center gap-3 border-b border-border/40 px-4 py-3 text-left transition-[color,background-color,border-color,padding] duration-150 last:border-b-0 h-auto rounded-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        cfg.bg,
        "hover:pl-5",
      )}
    >
      <span
        className={cn(
          "absolute left-0 top-0 h-full w-0.5 transition-[width] duration-200",
          cfg.bar,
          "group-hover:w-1",
        )}
      />
      <span className={cn("size-2 shrink-0 rounded-full shadow-sm", cfg.dot)} />
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
            {wo.description ?? t("common.noDescription")}
          </span>
          <span className="text-[10px] text-muted-foreground/40 shrink-0">
            · {elapsed}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
        <ElapsedTimer startedAt={jobTimer} />
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
  const t = useTranslations() as (key: string, values?: Record<string, string | number>) => string;
  const now = useClientNow();
  const elapsed =
    clockedIn && since
      ? formatElapsedStr(new Date(since).getTime(), now.getTime())
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

function formatElapsedStr(start: number, end: number): string {
  const diff = Math.max(0, end - start);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// ── Dashboard (extracted from page.tsx) ───────────────

export function MechanicDashboard({
  userId,
  orgId,
  mechanicName,
  avatarUrl: _avatarUrl,
  isAdminView,
}: {
  userId: string;
  orgId: string;
  mechanicName?: string | null;
  avatarUrl?: string | null;
  isAdminView: boolean;
}) {
  const t = useTranslations() as (key: string, values?: Record<string, string | number>) => string;
  const queryClient = useQueryClient();
  const now = useClientNow();
  const { push } = useRouter();

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
  const [pendingStatusNotes, setPendingStatusNotes] = useState<{
    woId: string;
    status: string;
  } | null>(null);
  const [showShiftReport, setShowShiftReport] = useState(false);
  const [woSearch, setWoSearch] = useState("");
  const [woStatusFilter, setWoStatusFilter] = useState<string | null>(null);

  useRealtimeMulti({
    enabled: !!orgId,
    tables: [
      {
        table: "work_orders",
        queryKey: mechanicKeys.workOrders(orgId, userId),
        filter: `organization_id=eq.${orgId}`,
      },
      {
        table: "work_orders",
        queryKey: mechanicKeys.eod(orgId, userId),
        filter: `organization_id=eq.${orgId}`,
      },
    ],
  });

  const eod = eodQuery.data ?? null;
  const assignedWos = woQuery.data ?? [];
  const trend = trendQuery.data ?? null;
  const clockStatus = clockQuery.data ?? {
    clockedIn: false,
    since: null,
    todayHours: 0,
  };

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

  const filteredWos = useMemo(() => {
    let result = sortedWos;
    if (woSearch.trim()) {
      const q = woSearch.toLowerCase();
      result = result.filter(
        (wo) =>
          wo.customer_name?.toLowerCase().includes(q) ||
          wo.vehicle_plate?.toLowerCase().includes(q) ||
          wo.description?.toLowerCase().includes(q),
      );
    }
    if (woStatusFilter) {
      result = result.filter((wo) => wo.status === woStatusFilter);
    }
    return result;
  }, [sortedWos, woSearch, woStatusFilter]);

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
        if (clockStatus.clockedIn) setShowShiftReport(true);
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : t("common.networkError"),
        );
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
      toast.success(t("mechanic.completed"));
    } catch (error) {
      reportServerError("Unexpected error", error);
      toast.error(t("mechanic.failedToComplete"));
    } finally {
      setPendingPickupComplete(null);
    }
  };

  const handleStatusChange = async (woId: string, newStatus: string) => {
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

    const prevWos = queryClient.getQueryData<WorkOrderRow[]>(
      mechanicKeys.workOrders(orgId, userId),
    );
    queryClient.setQueryData(
      mechanicKeys.workOrders(orgId, userId),
      (prev: WorkOrderRow[] | undefined) =>
        (prev ?? []).map((w) =>
          w.id === woId ? { ...w, status: newStatus } : w,
        ),
    );
    toast.dismiss();
    toast.success(t("mechanic.statusUpdatedTo", { status: newStatus }));
    updateStatus.mutate(
      { woId, status: newStatus },
      {
        onError: () => {
          if (prevWos) {
            queryClient.setQueryData(
              mechanicKeys.workOrders(orgId, userId),
              prevWos,
            );
          }
          queryClient.invalidateQueries({
            queryKey: mechanicKeys.workOrders(orgId, userId),
          });
        },
      },
    );
  };

  const handleStatusNotesConfirm = (
    woId: string,
    status: string,
    notes?: string,
  ) => {
    setPendingStatusNotes(null);
    const prevWos = queryClient.getQueryData<WorkOrderRow[]>(
      mechanicKeys.workOrders(orgId, userId),
    );
    queryClient.setQueryData(
      mechanicKeys.workOrders(orgId, userId),
      (prev: WorkOrderRow[] | undefined) =>
        (prev ?? []).map((w) => (w.id === woId ? { ...w, status } : w)),
    );
    toast.dismiss();
    toast.success(t("mechanic.statusUpdatedTo", { status }));
    updateStatus.mutate(
      { woId, status, notes },
      {
        onError: () => {
          if (prevWos) {
            queryClient.setQueryData(
              mechanicKeys.workOrders(orgId, userId),
              prevWos,
            );
          }
          queryClient.invalidateQueries({
            queryKey: mechanicKeys.workOrders(orgId, userId),
          });
        },
      },
    );
  };

  return (
    <div className="tablet-touch flex flex-col gap-6">
      {!isAdminView && (
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div>
                <Typography.H1 className="text-xl font-semibold tracking-tight">
                  {mechanicName ?? t("nav.mechanic")}
                </Typography.H1>
                <Typography.Muted className="mt-0.5 text-xs text-muted-foreground/60">
                  {now.toLocaleDateString("mn-MN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Typography.Muted>
              </div>
            </div>
          </div>
          <ClockInOutButton
            clockedIn={clockStatus.clockedIn}
            since={clockStatus.since}
            onToggle={handleClockToggle}
            loading={clockLoading}
          />
        </div>
      )}

      {isRefreshing && (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50 -mt-3">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {t("common.updating")}
        </div>
      )}

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

      {trend?.weeklyTrend && trend.weeklyTrend.length > 0 && (
        <>
          <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
            <span>
              <span className="font-semibold text-foreground/80">
                {trend ? formatMNT(trend.avgJobValue) : "—"}
              </span>{" "}
              {t("mechanic.avgJobValue")}
            </span>
            <span>
              <span className="font-semibold text-foreground/80">
                {trend ? String(trend.jobsPerDay) : "—"}
              </span>{" "}
              {t("mechanic.jobsPerDay")}
            </span>
          </div>
          <MechanicTrendChart data={trend?.weeklyTrend} />
        </>
      )}

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm shadow-black/5">
        <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
          <Wrench className="size-4 text-muted-foreground/60" />
          <span className="text-sm font-semibold">
            {isAdminView
              ? t("mechanic.mechanicWorkOrders")
              : t("mechanic.myWorkOrders")}
          </span>
          <span className="ml-auto text-[10px] text-muted-foreground/50">
            {t("mechanic.jobCount", { count: filteredWos.length })}
          </span>
        </div>

        {sortedWos.length > 0 && (
          <div className="flex items-center gap-2 border-b border-border/40 px-4 py-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
              <input
                type="text"
                placeholder={t("mechanic.searchWorkOrders")}
                aria-label={t("mechanic.searchWorkOrders")}
                value={woSearch}
                onChange={(e) => setWoSearch(e.target.value)}
                className="h-8 w-full rounded-lg border border-border/60 bg-muted/30 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-0.5 rounded-lg border border-border/50 bg-muted/40 p-0.5 h-7">
              {(
                [
                  { key: null, label: t("mechanic.all"), dot: null },
                  { key: "New", label: "New", dot: "bg-amber-500" },
                  { key: "Diagnosing", label: "Diag", dot: "bg-blue-500" },
                  { key: "In Progress", label: "Active", dot: "bg-teal-500" },
                  {
                    key: "Ready for Pickup",
                    label: "Ready",
                    dot: "bg-emerald-500",
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.key ?? "all"}
                  type="button"
                  onClick={() => setWoStatusFilter(opt.key)}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2 text-xs font-medium transition-[color,background-color,border-color] duration-200 cursor-pointer h-5",
                    woStatusFilter === opt.key
                      ? "bg-background text-foreground shadow-sm border border-border/30"
                      : "text-muted-foreground/60 hover:bg-muted/60 hover:text-foreground/80",
                  )}
                >
                  {opt.dot && (
                    <span
                      className={cn("size-1.5 rounded-full shrink-0", opt.dot)}
                    />
                  )}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {dataLoading ? (
          <div className="flex flex-col gap-0">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={`skeleton-${i}`}
                className="h-16 w-full rounded-none border-b border-border/30 last:border-b-0"
              />
            ))}
          </div>
        ) : filteredWos.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardList />
              </EmptyMedia>
              <EmptyTitle>
                {sortedWos.length === 0
                  ? t("mechanic.noActiveWorkOrders")
                  : t("mechanic.noMatchingWorkOrders")}
              </EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="divide-y-0">
            {filteredWos.map((wo) => (
              <WorkOrderRowComponent
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

      {pendingStatusNotes && (
        <StatusNotesModal
          woId={pendingStatusNotes.woId}
          newStatus={pendingStatusNotes.status}
          onConfirm={handleStatusNotesConfirm}
          onCancel={() => setPendingStatusNotes(null)}
        />
      )}

      <ShiftReportDialog
        open={showShiftReport}
        onOpenChange={setShowShiftReport}
      />
    </div>
  );
}
