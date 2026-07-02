"use client";

import {
  Activity,
  ArrowDown,
  ArrowUp,
  Car,
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
  Wrench,
} from "lucide-react";
import React from "react";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { BaySlotData, ShiftReport } from "@/lib/services/bay-view-service";
import type { Vehicle, WorkOrder } from "@/lib/types";
import { cn, formatMNT, formatPlateNumber } from "@/lib/utils";

interface TrendDelta {
  bayUtilization: number;
  activeJobs: number;
  completedToday: number;
  revenueToday: number;
  revenuePerLaborHour: number;
}

type QueueItem = WorkOrder & { vehicle: Vehicle | null };

interface KpiCardsProps {
  shiftReport: ShiftReport | null;
  trendDelta: TrendDelta | null;
  occupiedBays: number;
  bayCount: number;
  waitingQueueLength: number;
  bays: BaySlotData[];
  waitingQueue: QueueItem[];
  onOpenWorkOrder?: (woId: string) => void;
  t: (key: string, params?: Record<string, string | number | Date>) => string;
}

// ── Helpers ────────────────────────────────────────────────────

function elapsedMinutes(startedAt: string | null): number | null {
  if (!startedAt) return null;
  const ms = Date.now() - new Date(startedAt).getTime();
  const mins = Math.round(ms / 60000);
  return Number.isFinite(mins) && mins >= 0 ? mins : null;
}

function formatElapsed(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── Clickable card wrapper ─────────────────────────────────────

function ClickableKpiCard({
  onClick,
  className,
  children,
}: {
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  }

  return (
    <Card
      className={cn(
        "bg-transparent border-none ring-0 shadow-none px-4 py-3 gap-0 flex flex-col rounded-none flex-1 min-w-0 cursor-pointer select-none transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      {children}
    </Card>
  );
}

// ── Bay occupancy row ──────────────────────────────────────────

function BayOccupancyRow({
  bay,
  onOpenWorkOrder,
  onClose,
}: {
  bay: BaySlotData;
  onOpenWorkOrder?: (woId: string) => void;
  onClose: () => void;
}) {
  const wo = bay.workOrder;
  if (!wo) return null;

  return (
    <button
      type="button"
      onClick={() => {
        onOpenWorkOrder?.(wo.id);
        onClose();
      }}
      className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-3 py-2 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-7 items-center justify-center rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-xs font-bold text-indigo-700 dark:text-indigo-300">
          {bay.bayNumber}
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {wo.vehicle
              ? formatPlateNumber(wo.vehicle.plate_number ?? "")
              : "—"}
          </span>
          <span className="text-xs text-muted-foreground">
            {wo.mechanic?.full_name ?? "No mechanic"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{wo.status}</span>
        <Car className="size-3.5 text-muted-foreground/50" />
      </div>
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────

export const KpiCards = React.memo(function KpiCards({
  shiftReport,
  trendDelta,
  occupiedBays,
  bayCount,
  waitingQueueLength,
  bays,
  waitingQueue,
  onOpenWorkOrder,
  t,
}: KpiCardsProps) {
  const [bayUtilOpen, setBayUtilOpen] = React.useState(false);
  const [activeJobsOpen, setActiveJobsOpen] = React.useState(false);
  const [completedOpen, setCompletedOpen] = React.useState(false);
  const [revenueOpen, setRevenueOpen] = React.useState(false);
  const [queueOpen, setQueueOpen] = React.useState(false);

  const occupiedBaySlots = React.useMemo(
    () => bays.filter((b) => b.workOrder),
    [bays],
  );
  const emptyBaySlots = React.useMemo(
    () => bays.filter((b) => !b.workOrder),
    [bays],
  );

  const activeBaySlots = React.useMemo(
    () =>
      bays.filter(
        (b) =>
          b.workOrder &&
          b.workOrder.status !== "Completed" &&
          b.workOrder.status !== "Cancelled",
      ),
    [bays],
  );

  return (
    <div className="px-5 py-2 shrink-0">
      <div className="flex flex-col lg:flex-row">
        {/* Card 1: Bay Utilization */}
        <ClickableKpiCard onClick={() => setBayUtilOpen(true)}>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
              {t("bayUtilization")}
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
              <Activity className="size-4" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xl font-bold font-mono tracking-tight">
              {shiftReport?.bayUtilization ?? 0}%
              {trendDelta && trendDelta.bayUtilization !== 0 && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-semibold ml-2",
                    trendDelta.bayUtilization > 0
                      ? "text-emerald-500"
                      : "text-red-500",
                  )}
                >
                  {trendDelta.bayUtilization > 0 ? (
                    <ArrowUp className="size-3" />
                  ) : (
                    <ArrowDown className="size-3" />
                  )}
                  {Math.abs(trendDelta.bayUtilization)}%
                </span>
              )}
            </span>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${shiftReport?.bayUtilization ?? 0}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {occupiedBays} of {bayCount} bays occupied
          </span>
        </ClickableKpiCard>
        <Separator orientation="vertical" className="hidden lg:block" />

        {/* Card 2: Active Workloads */}
        <ClickableKpiCard onClick={() => setActiveJobsOpen(true)}>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
              {t("activeJobs")}
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
              <Wrench className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono tracking-tight">
              {shiftReport?.activeJobs ?? 0}
              {trendDelta && trendDelta.activeJobs !== 0 && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-semibold ml-2",
                    trendDelta.activeJobs > 0
                      ? "text-emerald-500"
                      : "text-red-500",
                  )}
                >
                  {trendDelta.activeJobs > 0 ? (
                    <ArrowUp className="size-3" />
                  ) : (
                    <ArrowDown className="size-3" />
                  )}
                  {Math.abs(trendDelta.activeJobs)}
                </span>
              )}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              active
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-medium mt-1">
            +{waitingQueueLength} in waiting queue
          </span>
        </ClickableKpiCard>
        <Separator orientation="vertical" className="hidden lg:block" />

        {/* Card 3: Completed Today */}
        <ClickableKpiCard onClick={() => setCompletedOpen(true)}>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
              {t("completedToday")}
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono tracking-tight">
              {shiftReport?.completedToday ?? 0}
              {trendDelta && trendDelta.completedToday !== 0 && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-semibold ml-2",
                    trendDelta.completedToday > 0
                      ? "text-emerald-500"
                      : "text-red-500",
                  )}
                >
                  {trendDelta.completedToday > 0 ? (
                    <ArrowUp className="size-3" />
                  ) : (
                    <ArrowDown className="size-3" />
                  )}
                  {Math.abs(trendDelta.completedToday)}
                </span>
              )}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              completed
            </span>
          </div>
          <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium mt-1">
            <Clock className="size-3" /> Avg{" "}
            {Number.isFinite(shiftReport?.avgDurationMinutes)
              ? (shiftReport?.avgDurationMinutes ?? 0)
              : 0}
            m
          </span>
        </ClickableKpiCard>
        <Separator orientation="vertical" className="hidden lg:block" />

        {/* Card 4: Revenue / Labor Hour */}
        <ClickableKpiCard onClick={() => setRevenueOpen(true)}>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
              Rev / Labor Hr
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400">
              <DollarSign className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatMNT(
                Number.isFinite(shiftReport?.revenuePerLaborHour)
                  ? (shiftReport?.revenuePerLaborHour ?? 0)
                  : 0,
              )}
              {trendDelta && trendDelta.revenuePerLaborHour !== 0 && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-semibold ml-2",
                    trendDelta.revenuePerLaborHour > 0
                      ? "text-emerald-500"
                      : "text-red-500",
                  )}
                >
                  {trendDelta.revenuePerLaborHour > 0 ? (
                    <ArrowUp className="size-3" />
                  ) : (
                    <ArrowDown className="size-3" />
                  )}
                  {formatMNT(Math.abs(trendDelta.revenuePerLaborHour || 0))}
                </span>
              )}
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-medium mt-1">
            {formatMNT(shiftReport?.revenueToday ?? 0)} total today
          </span>
        </ClickableKpiCard>
        <Separator orientation="vertical" className="hidden lg:block" />

        {/* Card 5: Waiting Queue */}
        <ClickableKpiCard onClick={() => setQueueOpen(true)}>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
              {t("waitingQueue")}
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400">
              <Users className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono tracking-tight">
              {waitingQueueLength}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              waiting
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-medium mt-1">
            {shiftReport?.activeJobs ?? 0} jobs in progress
          </span>
        </ClickableKpiCard>
      </div>

      {/* ═══ Drill-down dialogs ═══════════════════════════════════ */}

      {/* Bay Utilization */}
      <Dialog open={bayUtilOpen} onOpenChange={setBayUtilOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4 text-indigo-500" />
              {t("bayUtilization")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Bay occupancy breakdown
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-200/50 dark:border-indigo-800/30 p-3 text-center">
                <div className="text-2xl font-semibold tabular-nums text-indigo-700 dark:text-indigo-300">
                  {shiftReport?.bayUtilization ?? 0}%
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                  Utilization
                </div>
              </div>
              <div className="rounded-lg bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200/50 dark:border-emerald-800/30 p-3 text-center">
                <div className="text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                  {occupiedBaySlots.length}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                  Occupied
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 border border-border/50 p-3 text-center">
                <div className="text-2xl font-semibold tabular-nums text-foreground/70">
                  {emptyBaySlots.length}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                  Available
                </div>
              </div>
            </div>

            {occupiedBaySlots.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Occupied Bays
                </span>
                <div className="flex flex-col gap-1">
                  {occupiedBaySlots.map((bay) => (
                    <BayOccupancyRow
                      key={bay.bayNumber}
                      bay={bay}
                      onOpenWorkOrder={onOpenWorkOrder}
                      onClose={() => setBayUtilOpen(false)}
                    />
                  ))}
                </div>
              </div>
            )}

            {emptyBaySlots.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Available Bays
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {emptyBaySlots.map((bay) => (
                    <span
                      key={bay.bayNumber}
                      className="flex size-8 items-center justify-center rounded-md bg-muted/50 text-xs font-medium text-muted-foreground"
                    >
                      {bay.bayNumber}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {occupiedBaySlots.length === 0 && emptyBaySlots.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                <Activity className="size-5" />
                <span className="text-sm">No bay data available</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Active Jobs */}
      <Dialog open={activeJobsOpen} onOpenChange={setActiveJobsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Wrench className="size-4 text-amber-500" />
              {t("activeJobs")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Active work orders breakdown
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-800/30 p-3 text-center">
                <div className="text-2xl font-semibold tabular-nums text-amber-700 dark:text-amber-300">
                  {activeBaySlots.length}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                  In Bays
                </div>
              </div>
              <div className="rounded-lg bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200/50 dark:border-rose-800/30 p-3 text-center">
                <div className="text-2xl font-semibold tabular-nums text-rose-700 dark:text-rose-300">
                  {waitingQueueLength}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                  In Queue
                </div>
              </div>
            </div>

            {activeBaySlots.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Jobs in Bays
                </span>
                <div className="flex flex-col gap-1">
                  {activeBaySlots.map((bay) => {
                    const wo = bay.workOrder!;
                    const elapsed = elapsedMinutes(wo.started_at);
                    return (
                      <button
                        key={bay.bayNumber}
                        type="button"
                        onClick={() => {
                          onOpenWorkOrder?.(wo.id);
                          setActiveJobsOpen(false);
                        }}
                        className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-3 py-2 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex size-7 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/30 text-xs font-bold text-amber-700 dark:text-amber-300">
                            {bay.bayNumber}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {wo.vehicle
                                ? formatPlateNumber(
                                    wo.vehicle.plate_number ?? "",
                                  )
                                : "—"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {wo.mechanic?.full_name ?? "No mechanic"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatElapsed(elapsed)}
                          </span>
                          <Clock className="size-3.5 text-muted-foreground/50" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {waitingQueue.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Waiting Queue
                </span>
                <div className="flex flex-col gap-1">
                  {waitingQueue.map((wo) => {
                    const elapsed = elapsedMinutes(wo.created_at);
                    return (
                      <button
                        key={wo.id}
                        type="button"
                        onClick={() => {
                          onOpenWorkOrder?.(wo.id);
                          setActiveJobsOpen(false);
                        }}
                        className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-3 py-2 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex size-7 items-center justify-center rounded-md bg-rose-100 dark:bg-rose-900/30 text-xs font-bold text-rose-700 dark:text-rose-300">
                            <Users className="size-3.5" />
                          </span>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {wo.vehicle
                                ? formatPlateNumber(
                                    wo.vehicle.plate_number ?? "",
                                  )
                                : "—"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {wo.vehicle?.make ?? "Unknown vehicle"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatElapsed(elapsed)}
                          </span>
                          <Clock className="size-3.5 text-muted-foreground/50" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeBaySlots.length === 0 && waitingQueue.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                <CheckCircle2 className="size-5" />
                <span className="text-sm">No active jobs</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Completed Today */}
      <Dialog open={completedOpen} onOpenChange={setCompletedOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="size-4 text-emerald-500" />
              {t("completedToday")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Today's completed jobs summary
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200/50 dark:border-emerald-800/30 p-3 text-center">
                <div className="text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                  {shiftReport?.completedToday ?? 0}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                  Completed
                </div>
              </div>
              <div className="rounded-lg bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200/50 dark:border-emerald-800/30 p-3 text-center">
                <div className="text-xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-300 truncate">
                  {formatMNT(shiftReport?.revenueToday ?? 0)}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                  Revenue
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 border border-border/50 p-3 text-center">
                <div className="text-2xl font-semibold tabular-nums text-foreground/70">
                  {Number.isFinite(shiftReport?.avgDurationMinutes)
                    ? (shiftReport?.avgDurationMinutes ?? 0)
                    : 0}
                  <span className="text-sm font-normal">m</span>
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                  Avg Duration
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="size-4" />
                  Jobs completed
                </span>
                <span className="font-semibold tabular-nums">
                  {shiftReport?.completedToday ?? 0}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="size-4" />
                  Total revenue
                </span>
                <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatMNT(shiftReport?.revenueToday ?? 0)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-4" />
                  Avg job duration
                </span>
                <span className="font-semibold tabular-nums">
                  {Number.isFinite(shiftReport?.avgDurationMinutes)
                    ? formatElapsed(shiftReport?.avgDurationMinutes ?? 0)
                    : "—"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="size-4" />
                  Revenue per job
                </span>
                <span className="font-semibold tabular-nums">
                  {(shiftReport?.completedToday ?? 0) > 0
                    ? formatMNT(
                        Math.round(
                          (shiftReport?.revenueToday ?? 0) /
                            (shiftReport?.completedToday ?? 1),
                        ),
                      )
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revenue / Labor Hour */}
      <Dialog open={revenueOpen} onOpenChange={setRevenueOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <DollarSign className="size-4 text-sky-500" />
              Revenue / Labor Hour
            </DialogTitle>
            <DialogDescription className="sr-only">
              Revenue and labor efficiency breakdown
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-sky-50/50 dark:bg-sky-950/10 border border-sky-200/50 dark:border-sky-800/30 p-3 text-center">
                <div className="text-xl font-semibold tabular-nums text-sky-700 dark:text-sky-300">
                  {formatMNT(
                    Number.isFinite(shiftReport?.revenuePerLaborHour)
                      ? (shiftReport?.revenuePerLaborHour ?? 0)
                      : 0,
                  )}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                  Per Labor Hour
                </div>
              </div>
              <div className="rounded-lg bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200/50 dark:border-emerald-800/30 p-3 text-center">
                <div className="text-xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-300 truncate">
                  {formatMNT(shiftReport?.revenueToday ?? 0)}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                  Total Today
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="size-4" />
                  Revenue today
                </span>
                <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatMNT(shiftReport?.revenueToday ?? 0)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Wrench className="size-4" />
                  Active jobs
                </span>
                <span className="font-semibold tabular-nums">
                  {shiftReport?.activeJobs ?? 0}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="size-4" />
                  Completed today
                </span>
                <span className="font-semibold tabular-nums">
                  {shiftReport?.completedToday ?? 0}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-4" />
                  Avg job duration
                </span>
                <span className="font-semibold tabular-nums">
                  {Number.isFinite(shiftReport?.avgDurationMinutes)
                    ? formatElapsed(shiftReport?.avgDurationMinutes ?? 0)
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Waiting Queue */}
      <Dialog open={queueOpen} onOpenChange={setQueueOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-rose-500" />
              {t("waitingQueue")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Vehicles waiting for service
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200/50 dark:border-rose-800/30 p-3 text-center">
                <div className="text-2xl font-semibold tabular-nums text-rose-700 dark:text-rose-300">
                  {waitingQueueLength}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                  Waiting
                </div>
              </div>
              <div className="rounded-lg bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-800/30 p-3 text-center">
                <div className="text-2xl font-semibold tabular-nums text-amber-700 dark:text-amber-300">
                  {shiftReport?.activeJobs ?? 0}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                  In Progress
                </div>
              </div>
            </div>

            {waitingQueue.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Queue
                </span>
                <div className="flex flex-col gap-1">
                  {waitingQueue.map((wo, idx) => {
                    const elapsed = elapsedMinutes(wo.created_at);
                    return (
                      <button
                        key={wo.id}
                        type="button"
                        onClick={() => {
                          onOpenWorkOrder?.(wo.id);
                          setQueueOpen(false);
                        }}
                        className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-3 py-2 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex size-7 items-center justify-center rounded-md bg-rose-100 dark:bg-rose-900/30 text-xs font-bold text-rose-700 dark:text-rose-300">
                            {idx + 1}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {wo.vehicle
                                ? formatPlateNumber(
                                    wo.vehicle.plate_number ?? "",
                                  )
                                : "—"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {wo.vehicle?.make ?? "Unknown vehicle"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatElapsed(elapsed)}
                          </span>
                          <Clock className="size-3.5 text-muted-foreground/50" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {waitingQueue.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                <CheckCircle2 className="size-5" />
                <span className="text-sm">No vehicles waiting</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});
