"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  CarFront,
  Clock,
  Gauge,
  Loader2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { BayViewData } from "@/lib/services/bay-view-service";
import {
  getBayViewDataFresh,
  seedWaitingQueue,
} from "@/lib/services/bay-view-service";
import { cn } from "@/lib/utils";
import { useBayActionHandlers } from "./_bay-action-handlers";
import { useBayDragHandlers } from "./_bay-drag-handlers";
import { BayListView } from "./_bay-list-view";
import { BaySlot } from "./bay-slot";
import { BayViewToolbar, type ViewMode } from "./bay-view-toolbar";
import { MechanicRoster } from "./mechanic-roster";
import { QuickActions } from "./quick-actions";
import { StatusNotesModal } from "./status-notes-modal";
import { ToastMessage } from "./toast-message";
import { WaitingQueue } from "./waiting-queue";
import { WorkOrderDetailDrawer } from "./work-order-detail-drawer";
import { QueueAssignmentDialog } from "./_queue-assignment-dialog";
import type { Vehicle, WorkOrder } from "@/lib/database.types";
import {
  assignVehicleToBay,
  assignMechanicToWorkOrder,
} from "@/lib/services/bay-view-service";

function BayStats({ data }: { data: BayViewData }) {
  const t = useTranslations("bayView");
  const baysWithWork = data.bays.filter((b) => b.workOrder).length;
  const activeMechanics = data.mechanics.filter(
    (m) => m.current_jobs > 0,
  ).length;
  const waitingCount = data.waitingQueue.length;

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      <div className="flex flex-col items-center gap-1.5 rounded-xl bg-muted/25 px-2 py-2 ring-1 ring-border/40 sm:flex-row sm:gap-3 sm:px-3 sm:py-2.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15 sm:size-10">
          <Gauge className="size-4 text-primary" />
        </div>
        <div className="text-center sm:text-left">
          <div className="text-base font-bold tabular-nums leading-none tracking-tight sm:text-xl">
            {baysWithWork}/{data.bayCount}
          </div>
          <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground sm:mt-1 sm:text-[10px]">
            {t("baysActive")}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5 rounded-xl bg-muted/25 px-2 py-2 ring-1 ring-border/40 sm:flex-row sm:gap-3 sm:px-3 sm:py-2.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/15 sm:size-10">
          <Users className="size-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="text-center sm:text-left">
          <div className="text-base font-bold tabular-nums leading-none tracking-tight sm:text-xl">
            {activeMechanics}
          </div>
          <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground sm:mt-1 sm:text-[10px]">
            {t("mechanicsWorking")}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5 rounded-xl bg-muted/25 px-2 py-2 ring-1 ring-border/40 sm:flex-row sm:gap-3 sm:px-3 sm:py-2.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/15 sm:size-10">
          <Clock className="size-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="text-center sm:text-left">
          <div className="text-base font-bold tabular-nums leading-none tracking-tight sm:text-xl">
            {waitingCount}
          </div>
          <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground sm:mt-1 sm:text-[10px]">
            {t("inQueue")}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BayViewClient() {
  const t = useTranslations("bayView");
  const [data, setData] = useState<BayViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDrag, setActiveDrag] = useState<{
    type: string;
    label: string;
  } | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant: "info" | "error";
  } | null>(null);

  const [currentProfile, setCurrentProfile] = useState<{
    id: string;
    full_name: string | null;
  } | null>(null);
  const [myJobsOnly, setMyJobsOnly] = useState(false);

  const [pendingStatusChange, setPendingStatusChange] = useState<{
    woId: string;
    status: string;
  } | null>(null);

  const [detailWoId, setDetailWoId] = useState<string | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  const [assignWo, setAssignWo] = useState<(WorkOrder & { vehicle: Vehicle | null }) | null>(null);

  const [pendingWoIds, setPendingWoIds] = useState<Record<string, boolean>>({});

  function markPending(...ids: string[]) {
    setPendingWoIds((prev) => {
      const next = { ...prev };
      for (const id of ids) if (id) next[id] = true;
      return next;
    });
  }

  function clearPending(...ids: string[]) {
    setPendingWoIds((prev) => {
      const next = { ...prev };
      for (const id of ids) if (id) delete next[id];
      return next;
    });
  }

  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [confirmSeed, setConfirmSeed] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const fetchData = useCallback(async (showLoader = false) => {
    if (showLoader) setIsRefreshing(true);
    try {
      setError(null);
      // Use fresh (uncached) fetch so after-mutation refetches always
      // reflect committed DB state and never snap back to stale cache.
      const result = await getBayViewDataFresh();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bay view");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    
    fetchData(true);

    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const profile = d?.profile ?? d?.data;
        if (profile?.id) {
          setCurrentProfile({
            id: profile.id,
            full_name: profile.full_name ?? null,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) console.error("Failed to fetch profile:", err);
      });

    refreshIntervalRef.current = setInterval(() => fetchData(false), 30000);

    return () => {
      cancelled = true;
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [fetchData]);

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 300, tolerance: 20 },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  const { handleDragStart, handleDragEnd } = useBayDragHandlers({
    data,
    setData,
    setActiveDrag,
    markPending,
    clearPending,
    fetchData,
    setToast,
  });

  const {
    handleStatusClick,
    handleStatusChangeConfirm,
    handleQuickAssign,
    handleRemoveFromBay,
    handleBayCountChange,
  } = useBayActionHandlers({
    data,
    setData,
    setPendingStatusChange,
    markPending,
    clearPending,
    fetchData,
    setToast,
  });

  function handleOpenDetail(woId: string) {
    setDetailWoId(woId);
    setDetailDrawerOpen(true);
  }

  function handleQueueItemClick(
    wo: WorkOrder & { vehicle: Vehicle | null },
  ) {
    setAssignWo(wo);
  }

  async function handleAssignToBay(
    workOrderId: string,
    bayNumber: number,
    mechanicId?: string,
  ) {
    markPending(workOrderId);
    try {
      await assignVehicleToBay(workOrderId, bayNumber);
      if (mechanicId) {
        await assignMechanicToWorkOrder(workOrderId, mechanicId);
      }
      await fetchData(false);
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Assignment failed",
        variant: "error",
      });
    } finally {
      clearPending(workOrderId);
    }
  }

  const userIsMechanic =
    currentProfile && data?.mechanics.some((m) => m.id === currentProfile.id);

  const filteredBays = myJobsOnly
    ? (data?.bays.map((bay) => ({
        ...bay,
        workOrder:
          bay.workOrder?.mechanic?.id === currentProfile?.id
            ? bay.workOrder
            : null,
      })) ?? [])
    : (data?.bays ?? []);

  const filteredQueue = myJobsOnly
    ? (data?.waitingQueue.filter(
        (wo) => wo.mechanic_id === currentProfile?.id,
      ) ?? [])
    : (data?.waitingQueue ?? []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((id) => (
            <Skeleton key={id} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">{error ?? t("noData")}</p>
        <button
          type="button"
          onClick={() => fetchData(true)}
          className="text-sm text-primary hover:underline"
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-gradient-to-br from-card/70 to-muted/20 p-2.5 shadow-sm shadow-black/5 sm:p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div className="flex max-w-3xl flex-col gap-1.5 sm:gap-2">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                  {t("title")}
                </h1>
                {userIsMechanic && (
                  <Button
                    variant={myJobsOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMyJobsOnly(!myJobsOnly)}
                    className="h-8 gap-1.5 rounded-full px-3 text-xs shadow-sm"
                  >
                    {myJobsOnly ? (
                      <UserCheck className="size-3.5" />
                    ) : (
                      <UserPlus className="size-3.5" />
                    )}
                    {myJobsOnly ? t("myJobs") : t("allJobs")}
                  </Button>
                )}
                {confirmSeed ? (
                  <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background/70 px-1.5 py-1 shadow-sm sm:gap-1.5 sm:px-2">
                    <span className="hidden sm:inline text-[10px] font-medium text-muted-foreground">
                      {t("addDemoVehicles")}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        setConfirmSeed(false);
                        setSeeding(true);
                        try {
                          const result = await seedWaitingQueue();
                          const msg =
                            result.errors.length > 0
                              ? `Added ${result.created}, errors: ${result.errors.slice(0, 2).join("; ")}${result.errors.length > 2 ? "..." : ""}`
                              : `Added ${result.created} vehicles to queue`;
                          setToast({
                            message: msg,
                            variant:
                              result.errors.length > 0 ? "error" : "info",
                          });
                          fetchData(true);
                        } catch (err) {
                          setToast({
                            message: `Failed: ${err instanceof Error ? err.message : "error"}`,
                            variant: "error",
                          });
                        } finally {
                          setSeeding(false);
                        }
                      }}
                      disabled={seeding}
                      className="rounded-full bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground transition-all hover:scale-105 hover:bg-primary/90 active:scale-95 disabled:opacity-50"
                    >
                      {seeding ? t("adding") : "Confirm"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmSeed(false)}
                      className="rounded-full border border-border px-2 py-1 text-[10px] font-medium transition-all hover:scale-105 hover:bg-muted active:scale-95"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmSeed(true)}
                    disabled={seeding}
                    className="flex items-center gap-1.5 rounded-full border border-dashed border-muted-foreground/30 bg-background/50 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:scale-105 hover:border-foreground/30 hover:bg-background hover:text-foreground active:scale-95 disabled:opacity-50"
                  >
                    <CarFront className="size-3.5" />
                    <span className="hidden sm:inline">{seeding ? t("adding") : t("seedQueue")}</span>
                  </button>
                )}
                {isRefreshing || Object.keys(pendingWoIds).length > 0 ? (
                  <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground ring-1 ring-border/50">
                    {Object.keys(pendingWoIds).length > 0 ? (
                      <Loader2 className="size-3 animate-spin text-primary/60" />
                    ) : (
                      <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                    {Object.keys(pendingWoIds).length > 0
                      ? t("saving")
                      : t("refreshing")}
                  </div>
                ) : null}
              </div>
              <p className="hidden sm:block max-w-2xl text-sm leading-6 text-muted-foreground">
                {myJobsOnly ? t("myJobsSubtitle") : t("allJobsSubtitle")}
              </p>
            </div>
            <BayViewToolbar
              bayCount={data.bayCount}
              onRefresh={() => fetchData(true)}
              onBayCountChange={handleBayCountChange}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>
          <BayStats data={data} />
        </div>

        {viewMode === "grid" ? (
          <div
            className={cn(
              "grid gap-4 lg:gap-5",
              "max-h-[calc(100vh-23rem)] overflow-y-auto pr-1 [scrollbar-gutter:stable]",
              data.bayCount <= 2
                ? "grid-cols-1 sm:grid-cols-2"
                : data.bayCount <= 4
                  ? "grid-cols-1 sm:grid-cols-2"
                  : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
            )}
          >
            {filteredBays.map((bay) => (
              <BaySlot
                key={bay.bayNumber}
                bay={bay}
                isPending={!!(bay.workOrder && pendingWoIds[bay.workOrder.id])}
                onStatusChange={handleStatusClick}
                onRemoveFromBay={handleRemoveFromBay}
                // TODO: onAssignMechanic is a no-op here — mechanic assignment is managed via drag-and-drop in BaySlot
                onAssignMechanic={async () => {}}
                onOpenDetail={handleOpenDetail}
              />
            ))}
          </div>
        ) : (
          <BayListView
            bays={filteredBays}
            onStatusClick={handleStatusClick}
            onOpenDetail={handleOpenDetail}
            t={t}
          />
        )}

        <div className="grid items-start gap-3 sm:gap-5 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1.15fr]">
          <QuickActions />
          <MechanicRoster mechanics={data.mechanics} />
          <WaitingQueue
            items={filteredQueue}
            pendingWoIds={pendingWoIds}
            onQuickAssign={handleQuickAssign}
            mechanics={data.mechanics}
            onItemClick={handleQueueItemClick}
          />
        </div>
      </div>

      {pendingStatusChange && (
        <StatusNotesModal
          woId={pendingStatusChange.woId}
          newStatus={pendingStatusChange.status}
          onConfirm={handleStatusChangeConfirm}
          onCancel={() => setPendingStatusChange(null)}
        />
      )}

      <DragOverlay dropAnimation={null}>
        {activeDrag && (
          <div
            className="rotate-1 cursor-grabbing rounded-xl border-2 border-primary/80 bg-card/95 px-4 py-2.5 text-sm font-semibold shadow-2xl shadow-primary/30 ring-4 ring-primary/10 backdrop-blur-sm"
            style={{ willChange: "transform" }}
          >
            {activeDrag.label}
          </div>
        )}
      </DragOverlay>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {toast?.message ?? ""}
      </div>

      {toast && (
        <ToastMessage
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}

      <WorkOrderDetailDrawer
        workOrderId={detailWoId}
        open={detailDrawerOpen}
        onOpenChange={(open) => {
          setDetailDrawerOpen(open);
          if (!open) setDetailWoId(null);
        }}
        onRefresh={() => fetchData(false)}
      />

      {assignWo && (
        <QueueAssignmentDialog
          workOrder={assignWo}
          bays={data.bays.map((b) => ({
            bayNumber: b.bayNumber,
            occupied: !!b.workOrder,
          }))}
          mechanics={data.mechanics}
          onAssign={handleAssignToBay}
          onClose={() => setAssignWo(null)}
        />
      )}
    </DndContext>
  );
}
