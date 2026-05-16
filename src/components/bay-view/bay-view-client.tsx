"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { BayViewData } from "@/lib/services/bay-view-service";
import {
  assignMechanicToWorkOrder,
  assignVehicleToBay,
  getBayViewDataFresh,
  seedWaitingQueue,
} from "@/lib/services/bay-view-service";
import type { Vehicle, WorkOrder } from "@/lib/database.types";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { useBayActionHandlers } from "./_bay-action-handlers";
import { useBayDragHandlers } from "./_bay-drag-handlers";
import { BayViewBody } from "./_bay-view-body";
import { BayViewHeader } from "./_bay-view-header";
import { BayViewSidebar } from "./_bay-view-sidebar";
import { QueueAssignmentDialog } from "./_queue-assignment-dialog";
import type { ColumnsMode, ViewMode } from "./bay-view-toolbar";
import { MechanicRegistrationDialog } from "./mechanic-registration-dialog";
import { PinSettingsDialog } from "./pin-settings-dialog";
import { ShiftReportModal } from "./shift-report-modal";
import { StatusNotesModal } from "./status-notes-modal";
import { ToastMessage } from "./toast-message";
import { VehicleRegistrationDialog } from "./vehicle-registration-dialog";
import { WorkOrderDetailDrawer } from "./work-order-detail-drawer";

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

  const [assignWo, setAssignWo] = useState<
    (WorkOrder & { vehicle: Vehicle | null }) | null
  >(null);

  const [pendingWoIds, setPendingWoIds] = useState<Record<string, boolean>>({});

  const [showVehicleReg, setShowVehicleReg] = useState(false);
  const [showMechanicReg, setShowMechanicReg] = useState(false);
  const [showServiceLookup, setShowServiceLookup] = useState(false);
  const [showShiftReport, setShowShiftReport] = useState(false);
  const [showPinSettings, setShowPinSettings] = useState(false);

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
  const [columns, setColumns] = usePersistedState<ColumnsMode>(
    "bay-view-columns",
    "auto",
  );

  const fetchData = useCallback(async (showLoader = false) => {
    if (showLoader) setIsRefreshing(true);
    try {
      setError(null);
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
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-36" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((id) => (
            <Skeleton key={id} className="h-24 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <p className="text-sm text-muted-foreground">{error ?? t("noData")}</p>
        <button
          type="button"
          onClick={() => fetchData(true)}
          className="text-xs text-primary hover:underline"
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  const baysWithWork = data.bays.filter((b) => b.workOrder).length;
  const activeMechanics = data.mechanics.filter(
    (m) => m.current_jobs > 0,
  ).length;
  const waitingCount = data.waitingQueue.length;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full flex-col">
        <BayViewHeader
          bayCount={data.bayCount}
          baysWithWork={baysWithWork}
          activeMechanics={activeMechanics}
          waitingCount={waitingCount}
          userIsMechanic={userIsMechanic}
          myJobsOnly={myJobsOnly}
          isRefreshing={isRefreshing}
          hasPendingOps={Object.keys(pendingWoIds).length > 0}
          seeding={seeding}
          confirmSeed={confirmSeed}
          viewMode={viewMode}
          columns={columns}
          onMyJobsToggle={() => setMyJobsOnly(!myJobsOnly)}
          onRefresh={() => fetchData(true)}
          onBayCountChange={handleBayCountChange}
          onViewModeChange={setViewMode}
          onColumnsChange={setColumns}
          onShowVehicleReg={() => setShowVehicleReg(true)}
          onShowMechanicReg={() => setShowMechanicReg(true)}
          onShowServiceLookup={() => setShowServiceLookup(true)}
          onShowShiftReport={() => setShowShiftReport(true)}
          onShowPinSettings={() => setShowPinSettings(true)}
          onSeedQueue={() => setConfirmSeed(true)}
          onConfirmSeed={async () => {
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
                variant: result.errors.length > 0 ? "error" : "info",
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
          onCancelSeed={() => setConfirmSeed(false)}
        />

        <div className="flex flex-1 overflow-hidden md:flex-row flex-col">
          <div className="flex-1 overflow-hidden min-h-0">
            <BayViewBody
              bays={filteredBays}
              bayCount={data.bayCount}
              viewMode={viewMode}
              columns={columns}
              pendingWoIds={pendingWoIds}
              onStatusChange={handleStatusClick}
              onRemoveFromBay={handleRemoveFromBay}
              onOpenDetail={handleOpenDetail}
              t={t}
            />
          </div>

          <div className="md:w-72 lg:w-80 shrink-0 h-full min-h-0 max-md:max-h-80">
            <BayViewSidebar
              items={filteredQueue}
              mechanics={data.mechanics.map((m) => ({
                id: m.id,
                full_name: m.full_name,
                current_jobs: m.current_jobs,
              }))}
              pendingWoIds={pendingWoIds}
              onQuickAssign={(woId) => {
                const bay = data.bays.find((b) => !b.workOrder);
                if (bay) handleAssignToBay(woId, bay.bayNumber);
              }}
              onItemClick={handleQueueItemClick}
            />
          </div>
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
          <div className="rotate-1 cursor-grabbing rounded-xl border-2 border-primary/80 bg-card/95 px-3 py-2 text-sm font-semibold shadow-2xl shadow-primary/30 ring-4 ring-primary/10 backdrop-blur-sm">
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

      {showVehicleReg && (
        <VehicleRegistrationDialog onClose={() => setShowVehicleReg(false)} />
      )}
      {showMechanicReg && (
        <MechanicRegistrationDialog onClose={() => setShowMechanicReg(false)} />
      )}
      {showServiceLookup && (
        <VehicleRegistrationDialog
          onClose={() => setShowServiceLookup(false)}
          initialMode="lookup"
        />
      )}
      {showShiftReport && (
        <ShiftReportModal onClose={() => setShowShiftReport(false)} />
      )}
      {showPinSettings && (
        <PinSettingsDialog onClose={() => setShowPinSettings(false)} />
      )}

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
