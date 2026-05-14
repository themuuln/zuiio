"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { CarFront, Clock, Gauge, UserCheck, UserPlus, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  assignMechanicToWorkOrder,
  assignToFirstAvailableBay,
  assignVehicleToBay,
  type BayViewData,
  getBayViewData,
  removeVehicleFromBay,
  reorderQueue,
  seedWaitingQueue,
  unassignMechanicFromWorkOrder,
  updateWorkOrderStatus,
} from "@/lib/services/bay-view-service";
import { BaySlot } from "./bay-slot";
import { BayViewToolbar, type ViewMode } from "./bay-view-toolbar";
import { MechanicRoster } from "./mechanic-roster";
import { StatusPill } from "./status-pill";
import { QuickActions } from "./quick-actions";
import { StatusNotesModal } from "./status-notes-modal";
import { ToastMessage } from "./toast-message";
import { WaitingQueue } from "./waiting-queue";
import { WorkOrderDetailDrawer } from "./work-order-detail-drawer";

// ── Stats Summary ──────────────────────────────────────
function BayStats({ data }: { data: BayViewData }) {
  const t = useTranslations("bayView");
  const baysWithWork = data.bays.filter((b) => b.workOrder).length;
  const activeMechanics = data.mechanics.filter(
    (m) => m.current_jobs > 0,
  ).length;
  const waitingCount = data.waitingQueue.length;

  return (
    <div className="flex flex-wrap gap-4 p-3 rounded-xl bg-muted/30 border border-border/50">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10">
          <Gauge className="size-4 text-primary" />
        </div>
        <div>
          <div className="text-lg font-bold tabular-nums leading-tight">
            {baysWithWork}/{data.bayCount}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
            {t("baysActive")}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center size-8 rounded-lg bg-blue-500/10">
          <Users className="size-4 text-blue-500" />
        </div>
        <div>
          <div className="text-lg font-bold tabular-nums leading-tight">
            {activeMechanics}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
            {t("mechanicsWorking")}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center size-8 rounded-lg bg-amber-500/10">
          <Clock className="size-4 text-amber-500" />
        </div>
        <div>
          <div className="text-lg font-bold tabular-nums leading-tight">
            {waitingCount}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
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

  // ── Current user / My Jobs ─────────────────────────────
  const [currentProfile, setCurrentProfile] = useState<{
    id: string;
    full_name: string | null;
  } | null>(null);
  const [myJobsOnly, setMyJobsOnly] = useState(false);

  // ── Status change notes modal ───────────────────────────
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    woId: string;
    status: string;
  } | null>(null);

  // ── Work order detail drawer ────────────────────────────
  const [detailWoId, setDetailWoId] = useState<string | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  // ── Shift report modal ─────────────────────────────────────
  const [showShiftReport, setShowShiftReport] = useState(false);

  // ── PIN settings dialog ────────────────────────────────────
  const [showPinSettings, setShowPinSettings] = useState(false);

  // ── Auto-refresh ───────────────────────────────────────
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [confirmSeed, setConfirmSeed] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const fetchData = useCallback(async (showLoader = false) => {
    if (showLoader) setIsRefreshing(true);
    try {
      setError(null);
      const result = await getBayViewData();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bay view");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);

    // Fetch current user profile
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        const profile = d?.profile ?? d?.data;
        if (profile?.id) {
          setCurrentProfile({ id: profile.id, full_name: profile.full_name ?? null });
        }
      })
      .catch(() => {});

    // Start auto-refresh (every 30s)
    refreshIntervalRef.current = setInterval(() => fetchData(false), 30000);

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [fetchData]);

  // Sensors — fast response on both pointer and touch
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 50, tolerance: 8 },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  // ── Drag handlers ──────────────────────────────────────

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const activeData = active.data.current;
    if (activeData?.type === "vehicle") {
      setActiveDrag({ type: "vehicle", label: "Vehicle" });
    } else if (activeData?.type === "mechanic") {
      setActiveDrag({ type: "mechanic", label: "Mechanic" });
    } else if (activeData?.type === "mechanic-assigned") {
      setActiveDrag({ type: "mechanic-assigned", label: "Mechanic" });
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) {
      // Dropped outside — unassign mechanic if dragging mechanic off a bay
      const activeData = active.data.current;
      if (activeData?.type === "mechanic-assigned" && activeData.workOrderId) {
        try {
          await unassignMechanicFromWorkOrder(activeData.workOrderId);
          fetchData();
        } catch {
          // silently fail
        }
      }
      return;
    }

    const activeData = active.data.current;
    const overId = String(over.id);

    try {
      // Case 1: Dragging a vehicle to a bay
      if (activeData?.type === "vehicle" && overId.startsWith("bay-")) {
        const bayNumber = Number.parseInt(overId.replace("bay-", ""), 10);
        await assignVehicleToBay(activeData.workOrderId, bayNumber);
        fetchData();
        return;
      }

      // Case 2: Dragging a mechanic from roster to a bay (vehicle card)
      if (activeData?.type === "mechanic") {
        // over could be a bay, a vehicle card, or a mechanic badge
        let targetWoId: string | null = null;

        if (overId.startsWith("bay-")) {
          // Dropped on a bay slot — find the WO in that bay
          const bayNumber = Number.parseInt(overId.replace("bay-", ""), 10);
          const bay = data?.bays.find((b) => b.bayNumber === bayNumber);
          targetWoId = bay?.workOrder?.id ?? null;

          // Empty bay — show helpful message
          if (!targetWoId) {
            setToast({
              message: "Drop the vehicle here first, then assign a mechanic.",
              variant: "info",
            });
            return;
          }
        } else if (overId.startsWith("vehicle-")) {
          targetWoId = overId.replace("vehicle-", "");
        } else if (overId.startsWith("mechanic-on-wo-")) {
          targetWoId = overId.replace("mechanic-on-wo-", "");
        }

        if (targetWoId && activeData.mechanicId) {
          await assignMechanicToWorkOrder(targetWoId, activeData.mechanicId);
          fetchData();
        }
        return;
      }

      // Case 3: Dragging an assigned mechanic to another bay
      if (activeData?.type === "mechanic-assigned") {
        const mechanicId = activeData.mechanicId;
        const currentWoId = activeData.workOrderId;

        if (!mechanicId) return;

        // If dropped on a different vehicle
        if (overId.startsWith("vehicle-")) {
          const newWoId = overId.replace("vehicle-", "");
          if (newWoId !== currentWoId) {
            await assignMechanicToWorkOrder(newWoId, mechanicId);
            fetchData();
          }
        } else if (overId.startsWith("bay-")) {
          const bayNumber = Number.parseInt(overId.replace("bay-", ""), 10);
          const bay = data?.bays.find((b) => b.bayNumber === bayNumber);
          if (!bay?.workOrder) {
            setToast({
              message:
                "Drop the vehicle here first, then reassign the mechanic.",
              variant: "info",
            });
            return;
          }
          if (bay.workOrder.id !== currentWoId) {
            await assignMechanicToWorkOrder(bay.workOrder.id, mechanicId);
            fetchData();
          }
        }
      }
      // Case 4: Reorder within waiting queue — vehicle dropped on another vehicle
      if (activeData?.type === "vehicle" && overId.startsWith("vehicle-")) {
        const activeWoId = activeData.workOrderId;
        const targetWoId = overId.replace("vehicle-", "");

        const queue = data?.waitingQueue ?? [];
        const queueIds = queue.map((w) => w.id);
        const activeIdx = queueIds.indexOf(activeWoId);
        const targetIdx = queueIds.indexOf(targetWoId);

        if (activeIdx !== -1 && targetIdx !== -1) {
          const reordered = arrayMove(queue, activeIdx, targetIdx);
          const updates = reordered.map((wo, i) => ({
            id: wo.id,
            queue_order: i,
          }));
          await reorderQueue(updates);
          fetchData();
          return;
        }
      }
    } catch (err) {
      console.error("Drag action failed:", err);
    }
  }

  // ── Action handlers ────────────────────────────────────

  function handleStatusClick(woId: string, status: string) {
    // Open notes modal before confirming status change
    setPendingStatusChange({ woId, status });
  }

  async function handleStatusChangeConfirm(
    woId: string,
    status: string,
    notes?: string,
  ) {
    setPendingStatusChange(null);
    try {
      await updateWorkOrderStatus(
        woId,
        status as "Ready for Pickup" | "Completed",
        notes,
      );
      fetchData(false);
    } catch (err) {
      setToast({
        message: `Failed to change status: ${err instanceof Error ? err.message : "Unknown error"}`,
        variant: "error",
      });
    }
  }

  async function handleQuickAssign(woId: string) {
    try {
      const bay = await assignToFirstAvailableBay(woId);
      setToast({
        message: `Assigned to Bay ${bay}`,
        variant: "info",
      });
      fetchData(false);
    } catch (err) {
      setToast({
        message: `Failed: ${err instanceof Error ? err.message : "error"}`,
        variant: "error",
      });
    }
  }

  function handleOpenDetail(woId: string) {
    setDetailWoId(woId);
    setDetailDrawerOpen(true);
  }

  async function handleRemoveFromBay(woId: string) {
    try {
      await removeVehicleFromBay(woId);
      fetchData(false);
    } catch (err) {
      setToast({
        message: `Failed to remove: ${err instanceof Error ? err.message : "Unknown error"}`,
        variant: "error",
      });
    }
  }

  async function handleBayCountChange(count: number) {
    if (!data) return;
    const prevCount = data.bayCount;
    const prevBays = data.bays;

    // Optimistic update
    setData({
      ...data,
      bayCount: count,
      bays: Array.from({ length: count }, (_, i) => {
        const existing = data.bays[i];
        return existing ?? { bayNumber: i + 1, workOrder: null };
      }),
    });

    try {
      const { updateBayCount } = await import("@/lib/services/bay-view-service");
      await updateBayCount(count);
    } catch {
      // Roll back on failure
      setData({
        ...data,
        bayCount: prevCount,
        bays: prevBays,
      });
      setToast({
        message: "Failed to update bay count — reverted",
        variant: "error",
      });
    }
  }

  // ── Filtered data (My Jobs mode) ───────────────────────

  const userIsMechanic =
    currentProfile &&
    data?.mechanics.some((m) => m.id === currentProfile.id);

  const filteredBays = myJobsOnly
    ? data?.bays.map((bay) => ({
        ...bay,
        workOrder:
          bay.workOrder?.mechanic?.id === currentProfile?.id
            ? bay.workOrder
            : null,
      })) ?? []
    : data?.bays ?? [];

  const filteredQueue = myJobsOnly
    ? data?.waitingQueue.filter(
        (wo) => wo.mechanic_id === currentProfile?.id,
      ) ?? []
    : data?.waitingQueue ?? [];

  // ── Loading / Error States ─────────────────────────────

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

  // ── Render ─────────────────────────────────────────────

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
                {userIsMechanic && (
                  <Button
                    variant={myJobsOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMyJobsOnly(!myJobsOnly)}
                    className="h-8 gap-1.5 text-xs"
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
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {t("addDemoVehicles")}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        setConfirmSeed(false);
                        setSeeding(true);
                        try {
                          const result = await seedWaitingQueue();
                          const msg = result.errors.length > 0
                            ? `Added ${result.created}, errors: ${result.errors.slice(0, 2).join("; ")}${result.errors.length > 2 ? "..." : ""}`
                            : `Added ${result.created} vehicles to queue`;
                          setToast({ message: msg, variant: result.errors.length > 0 ? "error" : "info" });
                          fetchData(true);
                        } catch (err) {
                          setToast({ message: `Failed: ${err instanceof Error ? err.message : "error"}`, variant: "error" });
                        } finally {
                          setSeeding(false);
                        }
                      }}
                      disabled={seeding}
                      className="rounded-md bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {seeding ? t("adding") : "Confirm"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmSeed(false)}
                    className="rounded-md border border-border px-2 py-1 text-[10px] font-medium hover:bg-muted transition-colors"
                  >
                    {t("cancel")}
                  </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmSeed(true)}
                    disabled={seeding}
                    className="flex items-center gap-1.5 rounded-lg border border-dashed border-muted-foreground/30 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50"
                  >
                    <CarFront className="size-3.5" />
                    {seeding ? t("adding") : t("seedQueue")}
                  </button>
                )}
                {isRefreshing && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                    {t("refreshing")}
                  </div>
                )}
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">
                {myJobsOnly
                  ? t("myJobsSubtitle")
                  : t("allJobsSubtitle")}
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

        {/* Garage Floor */}
        {viewMode === "grid" ? (
          <div
            className={cn(
              "grid gap-3",
              "max-h-[calc(100vh-22rem)] overflow-y-auto",
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
                onStatusChange={handleStatusClick}
                onRemoveFromBay={handleRemoveFromBay}
                onAssignMechanic={async () => {}}
                onOpenDetail={handleOpenDetail}
              />
            ))}
          </div>
        ) : (
          <div className="max-h-[calc(100vh-22rem)] overflow-y-auto space-y-1">
            <div className="flex items-center gap-3 px-3 py-1.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider border-b border-border/50">
              <span className="w-12 shrink-0">{t("listHeaderBay")}</span>
              <span className="flex-1 min-w-0">{t("listHeaderVehicle")}</span>
              <span className="w-24 shrink-0 hidden sm:block">{t("listHeaderCustomer")}</span>
              <span className="w-28 shrink-0 hidden md:block">{t("listHeaderMechanic")}</span>
              <span className="w-28 shrink-0">{t("listHeaderStatus")}</span>
              <span className="w-16 shrink-0 text-right hidden sm:block">{t("listHeaderTime")}</span>
              <span className="w-28 shrink-0" />
            </div>
            {filteredBays.map((bay) => {
              const wo = bay.workOrder;
              return (
                <div
                  key={bay.bayNumber}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                    wo
                      ? "bg-card hover:bg-muted/40 border border-border/50"
                      : "bg-muted/10 border border-dashed border-border/30",
                  )}
                >
                  <span className="w-12 shrink-0 text-xs font-bold tabular-nums text-muted-foreground">
                    #{bay.bayNumber}
                  </span>
                  <div className="flex-1 min-w-0">
                    {wo?.vehicle ? (
                      <div className="truncate">
                        <span className="text-sm font-semibold">
                          {wo.vehicle.plate_number}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1.5 hidden sm:inline">
                          {wo.vehicle.make} {wo.vehicle.model}
                          {wo.vehicle.year ? ` · ${wo.vehicle.year}` : ""}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/50 italic">
                        {t("emptyBay")}
                      </span>
                    )}
                  </div>
                  <span className="w-24 shrink-0 text-xs text-muted-foreground truncate hidden sm:block">
                    {wo?.customer_name ?? "—"}
                  </span>
                  <span className="w-28 shrink-0 text-xs text-muted-foreground truncate hidden md:block">
                    {wo?.mechanic?.full_name ?? "—"}
                  </span>
                  <span className="w-28 shrink-0">
                    {wo ? <StatusPill status={wo.status} /> : null}
                  </span>
                  <span className="w-16 shrink-0 text-right text-[10px] text-muted-foreground tabular-nums hidden sm:block">
                    {wo?.started_at ?? wo?.created_at
                      ? (() => {
                          const d = new Date(wo.started_at ?? wo.created_at);
                          const mins = Math.floor((Date.now() - d.getTime()) / 60000);
                          return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h`;
                        })()
                      : "—"}
                  </span>
                  <div className="w-28 shrink-0 flex gap-1 justify-end">
                    {wo && wo.status !== "Ready for Pickup" && wo.status !== "Completed" && wo.status !== "Cancelled" && (
                      <button
                        type="button"
                        onClick={() => handleStatusClick(wo.id, "Ready for Pickup")}
                        className="rounded-md bg-green-500/10 px-2 py-1 text-[10px] font-medium text-green-600 hover:bg-green-500/20 transition-colors"
                      >
                        {t("markReady")}
                      </button>
                    )}
                    {wo && (
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(wo.id)}
                        className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/20 transition-colors"
                      >
                        {t("open")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom panels */}
        <div className="grid gap-4 md:grid-cols-3">
          <QuickActions />
          <MechanicRoster mechanics={data.mechanics} />
          <WaitingQueue
            items={filteredQueue}
            onQuickAssign={handleQuickAssign}
          />
        </div>
      </div>

      {/* Status Change Notes Modal */}
      {pendingStatusChange && (
        <StatusNotesModal
          woId={pendingStatusChange.woId}
          newStatus={pendingStatusChange.status}
          onConfirm={handleStatusChangeConfirm}
          onCancel={() => setPendingStatusChange(null)}
        />
      )}

      {/* Drag overlay — shows what's being dragged */}
      <DragOverlay dropAnimation={null}>
        {activeDrag && (
          <div
            className="rounded-lg border-2 border-primary bg-card px-4 py-2 text-sm font-semibold shadow-xl cursor-grabbing"
            style={{ willChange: "transform" }}
          >
            {activeDrag.label}
          </div>
        )}
      </DragOverlay>

      {/* Live region for screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {toast?.message ?? ""}
      </div>

      {/* Toast notifications */}
      {toast && (
        <ToastMessage
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Work Order Detail Drawer */}
      <WorkOrderDetailDrawer
        workOrderId={detailWoId}
        open={detailDrawerOpen}
        onOpenChange={(open) => {
          setDetailDrawerOpen(open);
          if (!open) setDetailWoId(null);
        }}
        onRefresh={() => fetchData(false)}
      />
    </DndContext>
  );
}
