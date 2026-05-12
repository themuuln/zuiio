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
import { CarFront, Clock, Gauge, UserCheck, UserPlus, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  assignMechanicToWorkOrder,
  assignVehicleToBay,
  type BayViewData,
  getBayViewData,
  removeVehicleFromBay,
  seedWaitingQueue,
  unassignMechanicFromWorkOrder,
  updateWorkOrderStatus,
} from "@/lib/services/bay-view-service";
import { BaySlot } from "./bay-slot";
import { BayViewToolbar } from "./bay-view-toolbar";
import { MechanicRoster } from "./mechanic-roster";
import { StatusNotesModal } from "./status-notes-modal";
import { ToastMessage } from "./toast-message";
import { WaitingQueue } from "./waiting-queue";

// ── Stats Summary ──────────────────────────────────────
function BayStats({ data }: { data: BayViewData }) {
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
            Bays Active
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
            Mechanics Working
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
            In Queue
          </div>
        </div>
      </div>
    </div>
  );
}

export function BayViewClient() {
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

  // ── Auto-refresh ───────────────────────────────────────
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);

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
        <p className="text-muted-foreground">{error ?? "No data available"}</p>
        <button
          type="button"
          onClick={() => fetchData(true)}
          className="text-sm text-primary hover:underline"
        >
          Retry
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
                <h1 className="text-2xl font-bold tracking-tight">Bay View</h1>
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
                    {myJobsOnly ? "My Jobs" : "All Jobs"}
                  </Button>
                )}
                <button
                  type="button"
                  onClick={async () => {
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
                  className="flex items-center gap-1.5 rounded-lg border border-dashed border-muted-foreground/30 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50"
                >
                  <CarFront className="size-3.5" />
                  {seeding ? "Adding..." : "Seed Queue"}
                </button>
                {isRefreshing && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                    Refreshing...
                  </div>
                )}
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">
                {myJobsOnly
                  ? "Showing only your assigned work orders"
                  : "Drag vehicles to bays, assign mechanics to work orders"}
              </p>
            </div>
            <BayViewToolbar
              bayCount={data.bayCount}
              onRefresh={() => fetchData(true)}
              onBayCountChange={handleBayCountChange}
            />
          </div>
          <BayStats data={data} />
        </div>

        {/* Garage Floor */}
        <div
          className={cn(
            "grid gap-3",
            data.bayCount <= 2
              ? "grid-cols-1 sm:grid-cols-2"
              : data.bayCount <= 4
                ? "grid-cols-2"
                : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
          )}
        >
          {filteredBays.map((bay) => (
            <BaySlot
              key={bay.bayNumber}
              bay={bay}
              onStatusChange={handleStatusClick}
              onRemoveFromBay={handleRemoveFromBay}
              onAssignMechanic={async () => {}}
            />
          ))}
        </div>

        {/* Bottom panels */}
        <div className="grid gap-4 md:grid-cols-2">
          <MechanicRoster mechanics={data.mechanics} />
          <WaitingQueue items={filteredQueue} />
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
    </DndContext>
  );
}
