"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Vehicle, WorkOrder } from "@/lib/types";
import type { BayViewData } from "@/lib/services/bay-view-service";
import {
  assignMechanicToWorkOrder,
  assignVehicleToBay,
  getBayViewDataFresh,
  seedWaitingQueue,
  updateWorkOrderStatus,
} from "@/lib/services/bay-view-service";
import {
  savePostServiceData,
  saveCompletionData,
  getWorkOrderServicesWithIntervals,
  getRecommendations,
} from "@/lib/services/post-service-service";
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
import { PostServiceForm } from "./post-service-form";
import type { PostServiceFormData } from "./post-service-form";
import { PickupCompleteForm } from "./pickup-complete-form";
import type { PickupCompleteData } from "./pickup-complete-form";
import { PickupSummary } from "./_pickup-summary";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { VehicleRegistrationDialog } from "./vehicle-registration-dialog";
import { WorkOrderDetailDrawer } from "./work-order-detail-drawer";
import { ErrorBoundary } from "@/components/error-boundary";

function shouldIgnoreDragActivation(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return !!target.closest(
    '[data-no-dnd="true"], button, a, input, textarea, select',
  );
}

class GuardedPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: "onPointerDown" as const,
      handler: ({ nativeEvent }: React.PointerEvent) =>
        !shouldIgnoreDragActivation(nativeEvent.target),
    },
  ];
}

class GuardedTouchSensor extends TouchSensor {
  static activators = [
    {
      eventName: "onTouchStart" as const,
      handler: ({ nativeEvent }: React.TouchEvent) =>
        !shouldIgnoreDragActivation(nativeEvent.target),
    },
  ];
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
  type ToastState = { message: string; variant: "info" | "error" };

  const setToast = useCallback(
    (
      value: ToastState | null | ((prev: ToastState | null) => ToastState | null),
    ) => {
      if (typeof value === "function") return;
      if (value) {
        if (value.variant === "error") toast.error(value.message);
        else toast.success(value.message);
      }
    },
    [],
  );

  const [currentProfile, setCurrentProfile] = useState<{
    id: string;
    full_name: string | null;
  } | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [myJobsOnly, setMyJobsOnly] = useState(false);

  const [pendingStatusChange, setPendingStatusChange] = useState<{
    woId: string;
    status: string;
  } | null>(null);

  // Post-service form state
  const [postServiceData, setPostServiceData] = useState<{
    woId: string;
    vehicleId: string;
    vehiclePlate: string;
    currentOdometer: number | null;
    services: Array<{
      id: string;
      service_name: string;
      service_catalog_id: string | null;
      catalog_interval_months: number | null;
      catalog_interval_km: number | null;
    }>;
    status: string;
  } | null>(null);

  // Pickup completion state
  const [pickupCompleteData, setPickupCompleteData] = useState<{
    woId: string;
    vehicleId: string;
    vehiclePlate: string;
    totalCost: number;
  } | null>(null);

  // Pickup summary state
  const [pickupSummary, setPickupSummary] = useState<{
    woId: string;
    vehiclePlate: string;
    totalCost: number;
    invoiceId: string | null;
    invoiceTotal: number;
    invoiceStatus: string;
    recommendations: Array<{
      serviceName: string;
      nextDueDate: string | null;
      nextDueKm: number | null;
      priority: "standard" | "important" | "urgent";
    }>;
  } | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const woIdFromUrl = searchParams.get("woId");

  const [detailDrawerOpen, setDetailDrawerOpen] = useState(!!woIdFromUrl);
  const [detailWoId, setDetailWoId] = useState<string | null>(woIdFromUrl);

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
    const abort = new AbortController();

    fetchData(true);

    fetch("/api/profile", { signal: abort.signal })
      .then((r) => r.json())
      .then((d) => {
        if (abort.signal.aborted) return;
        const profile = d?.profile ?? d?.data;
        if (profile?.id) {
          setCurrentProfile({
            id: profile.id,
            full_name: profile.full_name ?? null,
          });
          setOrgId(d?.organizationId ?? d?.data?.organizationId ?? null);
        }
      })
      .catch((err) => {
        if (!abort.signal.aborted) console.error("Failed to fetch profile:", err);
      });

    refreshIntervalRef.current = setInterval(() => fetchData(false), 30000);

    return () => {
      abort.abort();
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [fetchData]);

  const pointerSensor = useSensor(GuardedPointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(GuardedTouchSensor, {
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
    const params = new URLSearchParams(searchParams.toString());
    params.set("woId", woId);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function handleDrawerOpenChange(open: boolean) {
    setDetailDrawerOpen(open);
    if (!open) {
      setDetailWoId(null);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("woId");
      router.replace(`?${params.toString()}`, { scroll: false });
    }
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
      toast.error(err instanceof Error ? err.message : "Assignment failed");
    } finally {
      clearPending(workOrderId);
    }
  }

  // Intercept status clicks: route to correct form based on status
  const handleStatusClickWithPostService = useCallback(
    async (woId: string, status: string) => {
      if (status === "Cancelled") {
        handleStatusClick(woId, status);
        return;
      }

      // Find the bay slot or waiting queue item to get vehicle info
      const baySlot = data?.bays.find((b) => b.workOrder?.id === woId);
      const queueItem = data?.waitingQueue.find((w) => w.id === woId);
      const wo = baySlot?.workOrder ?? queueItem;

      if (status === "Completed") {
        // Show pickup complete form (customer satisfaction)
        const baysWithWork = (data?.bays ?? []).filter(
          (b) => b.workOrder?.id === woId,
        );
        const workOrder = baysWithWork[0]?.workOrder ?? queueItem;
        setPickupCompleteData({
          woId,
          vehicleId: wo?.vehicle?.id ?? "",
          vehiclePlate: wo?.vehicle?.plate_number ?? "",
          totalCost: Number(workOrder?.total ?? 0),
        });
        return;
      }

      // "Ready for Pickup" — show PostServiceForm
      try {
        const services = await getWorkOrderServicesWithIntervals(woId);

        setPostServiceData({
          woId,
          vehicleId: wo?.vehicle?.id ?? "",
          vehiclePlate: wo?.vehicle?.plate_number ?? "",
          currentOdometer: wo?.vehicle?.odometer ?? null,
          services,
          status,
        });
      } catch {
        // Fallback to old behavior if fetch fails
        handleStatusClick(woId, status);
      }
    },
    [data, handleStatusClick],
  );

  async function handlePostServiceConfirm(formData: PostServiceFormData) {
    if (!postServiceData) return;
    const { woId, status } = postServiceData;

    try {
      await savePostServiceData({
        workOrderId: woId,
        vehicleId: postServiceData.vehicleId,
        odometerReading: formData.odometerReading,
        recommendations: formData.recommendations,
        mechanicNotes: formData.mechanicNotes,
      });

      // Then update the work order status
      await updateWorkOrderStatus(
        woId,
        status as "Ready for Pickup" | "Completed",
        formData.mechanicNotes || undefined,
      );

      setPostServiceData(null);
      fetchData(false);
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "Error"}`);
    }
  }

  async function handleCompleteConfirm(data: PickupCompleteData) {
    if (!pickupCompleteData) return;
    const { woId, vehicleId } = pickupCompleteData;

    try {
      await saveCompletionData({
        workOrderId: woId,
        vehicleId,
        odometerReading: null,
        customerSatisfaction: data.customerSatisfaction,
        customerFeedback: data.customerFeedback,
        nextAppointmentDate: data.nextAppointmentDate,
      });

      await updateWorkOrderStatus(woId, "Completed");

      // Auto-generate invoice
      let invoiceId: string | null = null;
      let invoiceTotal = pickupCompleteData.totalCost;
      let invoiceStatus = "pending";

      if (orgId) {
        try {
          const invRes = await fetch(`/api/organizations/${orgId}/invoices`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ work_order_id: woId }),
          });
          if (invRes.ok) {
            const invJson = await invRes.json();
            if (invJson.data) {
              invoiceId = invJson.data.id;
              invoiceTotal = Number(invJson.data.total ?? pickupCompleteData.totalCost);
              invoiceStatus = invJson.data.status ?? "pending";
            }
          }
        } catch {
          // Invoice generation is optional — don't block completion
        }
      }

      // Fetch recommendations for the summary
      const recs = await getRecommendations(woId);
      setPickupCompleteData(null);
      setPickupSummary({
        woId,
        vehiclePlate: pickupCompleteData.vehiclePlate,
        totalCost: pickupCompleteData.totalCost,
        invoiceId,
        invoiceTotal,
        invoiceStatus,
        recommendations: recs.map((r: { service_name: string; next_due_date: string | null; next_due_km: number | null; priority: string }) => ({
          serviceName: r.service_name,
          nextDueDate: r.next_due_date,
          nextDueKm: r.next_due_km,
          priority: r.priority as "standard" | "important" | "urgent",
        })),
      });
    } catch (err) {
      toast.error(`Failed to complete: ${err instanceof Error ? err.message : "Error"}`);
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
        <Button
          variant="link"
          onClick={() => fetchData(true)}
          className="text-xs"
        >
          {t("retry")}
        </Button>
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
          userIsMechanic={userIsMechanic ?? false}
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
              if (result.errors.length > 0) {
                toast.error(msg);
              } else {
                toast.success(msg);
              }
              fetchData(true);
            } catch (err) {
              toast.error(`Failed: ${err instanceof Error ? err.message : "error"}`);
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
              onStatusChange={handleStatusClickWithPostService}
              onRemoveFromBay={handleRemoveFromBay}
              onOpenDetail={handleOpenDetail}
              t={t}
            />
          </div>

          <div className="md:w-72 lg:w-80 shrink-0 h-full min-h-0 max-md:max-h-80">
            <BayViewSidebar
              items={filteredQueue}
              mechanics={data.mechanics}
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

      {/* Post-service form for service statuses */}
      {postServiceData && (
        <PostServiceForm
          woId={postServiceData.woId}
          vehicleId={postServiceData.vehicleId}
          vehiclePlate={postServiceData.vehiclePlate}
          currentOdometer={postServiceData.currentOdometer}
          services={postServiceData.services}
          newStatus={postServiceData.status}
          onConfirm={handlePostServiceConfirm}
          onCancel={() => setPostServiceData(null)}
        />
      )}

      {/* Pickup complete form (customer satisfaction) */}
      {pickupCompleteData && (
        <PickupCompleteForm
          woId={pickupCompleteData.woId}
          vehiclePlate={pickupCompleteData.vehiclePlate}
          totalCost={pickupCompleteData.totalCost}
          onConfirm={handleCompleteConfirm}
          onCancel={() => setPickupCompleteData(null)}
        />
      )}

      {/* Pickup summary after completion */}
      {pickupSummary && (
        <PickupSummary
          vehiclePlate={pickupSummary.vehiclePlate}
          totalCost={pickupSummary.totalCost}
          invoiceId={pickupSummary.invoiceId}
          invoiceTotal={pickupSummary.invoiceTotal}
          invoiceStatus={pickupSummary.invoiceStatus}
          recommendations={pickupSummary.recommendations}
          orgId={orgId}
          onDone={() => {
            setPickupSummary(null);
            fetchData(false);
          }}
          onSaveAppointment={async (date: string) => {
            try {
              await saveCompletionData({
                workOrderId: pickupSummary.woId,
                vehicleId: "",
                odometerReading: null,
                nextAppointmentDate: date,
              });
              toast.success("Appointment saved");
            } catch (err) {
              toast.error(`Failed to save: ${err instanceof Error ? err.message : "Error"}`);
            }
          }}
        />
      )}

      {/* Simple notes modal for Cancelled only */}
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

      <ErrorBoundary>
        <WorkOrderDetailDrawer
          workOrderId={detailWoId}
          open={detailDrawerOpen}
          onOpenChange={handleDrawerOpenChange}
          onRefresh={() => fetchData(false)}
        />
      </ErrorBoundary>

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
