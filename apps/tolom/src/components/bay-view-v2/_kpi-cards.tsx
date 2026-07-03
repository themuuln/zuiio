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
import { formatMNT, formatPlateNumber } from "@/lib/utils";
import { elapsedMinutes } from "./_helpers";

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

function formatElapsed(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
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
        <span className="flex size-7 items-center justify-center rounded-md bg-muted text-xs font-bold text-foreground">
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
// ── StatChip component ────────────────────────────────────

function StatChip({
  label,
  value,
  trend,
  subtitle,
  onClick,
}: {
  label: string;
  value: string;
  trend?: number | null;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 text-xs hover:bg-muted/50 px-2 py-1 rounded-md transition-colors cursor-pointer shrink-0"
    >
      <span className="font-semibold text-muted-foreground tabular-nums">
        {label}
      </span>
      <span className="font-mono font-bold text-sm text-foreground">
        {value}
      </span>
      {trend !== undefined && trend !== null && trend !== 0 && (
        <span
          className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${trend > 0 ? "text-emerald-500" : "text-red-500"}`}
        >
          {trend > 0 ? (
            <ArrowUp className="size-2.5" />
          ) : (
            <ArrowDown className="size-2.5" />
          )}
          {Math.abs(trend)}
          {label.includes("%") ? "%" : ""}
        </span>
      )}
      {subtitle && (
        <span className="text-[10px] text-muted-foreground/60">{subtitle}</span>
      )}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────

export const KpiCards = React.memo(function KpiCards({
  shiftReport,
  trendDelta,
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
    <div className="shrink-0">
      <div className="flex items-center gap-4 px-4 py-1.5 border-b border-border/30 shrink-0">
        <StatChip
          label={t("bayUtilization")}
          value={`${shiftReport?.bayUtilization ?? 0}%`}
          trend={trendDelta?.bayUtilization}
          onClick={() => setBayUtilOpen(true)}
        />
        <Separator orientation="vertical" className="h-5" />
        <StatChip
          label={t("activeJobs")}
          value={String(shiftReport?.activeJobs ?? 0)}
          trend={trendDelta?.activeJobs}
          subtitle={`+${waitingQueueLength}`}
          onClick={() => setActiveJobsOpen(true)}
        />
        <Separator orientation="vertical" className="h-5" />
        <StatChip
          label={t("completedToday")}
          value={String(shiftReport?.completedToday ?? 0)}
          trend={trendDelta?.completedToday}
          onClick={() => setCompletedOpen(true)}
        />
        <Separator orientation="vertical" className="h-5" />
        <StatChip
          label={t("revPerLaborHr")}
          value={formatMNT(shiftReport?.revenuePerLaborHour ?? 0)}
          trend={trendDelta?.revenuePerLaborHour}
          onClick={() => setRevenueOpen(true)}
        />
        <Separator orientation="vertical" className="h-5" />
        <StatChip
          label={t("waitingQueue")}
          value={String(waitingQueueLength)}
          onClick={() => setQueueOpen(true)}
        />
      </div>

      {/* ═══ Drill-down dialogs ═══════════════════════════════════ */}

      {/* Bay Utilization */}
      <Dialog open={bayUtilOpen} onOpenChange={setBayUtilOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4 text-muted-foreground" />
              {t("bayUtilization")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Bay occupancy breakdown
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted/50 border border-border/50 p-3 text-center">
                <div className="text-2xl font-semibold tabular-nums text-foreground">
                  {shiftReport?.bayUtilization ?? 0}%
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                  Utilization
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 border border-border/50 p-3 text-center">
                <div className="text-2xl font-semibold tabular-nums text-foreground">
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
                <span className="text-xs font-semibold text-muted-foreground">
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
                <span className="text-xs font-semibold text-muted-foreground">
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
              <Wrench className="size-4 text-muted-foreground" />
              {t("activeJobs")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Active work orders breakdown
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 border border-border/50 p-3 text-center">
                <div className="text-2xl font-semibold tabular-nums text-foreground">
                  {activeBaySlots.length}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                  In Bays
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 border border-border/50 p-3 text-center">
                <div className="text-2xl font-semibold tabular-nums text-foreground">
                  {waitingQueueLength}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                  In Queue
                </div>
              </div>
            </div>

            {activeBaySlots.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
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
                          <span className="flex size-7 items-center justify-center rounded-md bg-muted text-xs font-bold text-foreground">
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
                <span className="text-xs font-semibold text-muted-foreground">
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
                          <span className="flex size-7 items-center justify-center rounded-md bg-muted text-xs font-bold text-foreground">
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
              <CheckCircle2 className="size-4 text-muted-foreground" />
              {t("completedToday")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Today's completed jobs summary
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted/50 border border-border/50 p-3 text-center">
                <div className="text-2xl font-semibold tabular-nums text-foreground">
                  {shiftReport?.completedToday ?? 0}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                  Completed
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 border border-border/50 p-3 text-center">
                <div className="text-xl font-semibold tabular-nums text-foreground truncate">
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
                <span className="font-semibold tabular-nums text-foreground">
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
              <DollarSign className="size-4 text-muted-foreground" />
              {t("revenuePerLaborHour")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t("revenuePerLaborHourDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 border border-border/50 p-3 text-center">
                <div className="text-xl font-semibold tabular-nums text-foreground">
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
              <div className="rounded-lg bg-muted/50 border border-border/50 p-3 text-center">
                <div className="text-xl font-semibold tabular-nums text-foreground truncate">
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
                <span className="font-semibold tabular-nums text-foreground">
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
              <Users className="size-4 text-muted-foreground" />
              {t("waitingQueue")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Vehicles waiting for service
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 border border-border/50 p-3 text-center">
                <div className="text-2xl font-semibold tabular-nums text-foreground">
                  {waitingQueueLength}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                  Waiting
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 border border-border/50 p-3 text-center">
                <div className="text-2xl font-semibold tabular-nums text-foreground">
                  {shiftReport?.activeJobs ?? 0}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                  In Progress
                </div>
              </div>
            </div>

            {waitingQueue.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
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
                          <span className="flex size-7 items-center justify-center rounded-md bg-muted text-xs font-bold text-foreground">
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
