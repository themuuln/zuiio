"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useCurrentUserRole } from "@/lib/queries/use-profile";
import { useOrgSettings } from "@/lib/queries/use-org-settings";
import { useProfile } from "@/lib/queries/use-profile";
import { useSelectedBranchId, useSetSelectedBranchId } from "@/lib/stores";
import { useFuzzySearch } from "@/lib/hooks/use-fuzzy-search";
import { bayViewKeys } from "@/lib/queries/keys";
import type { BaySlotData, BayViewData, ShiftReport } from "@/lib/services/bay-view-service";
import { getBayViewDataFresh, getShiftReport } from "@/lib/services/bay-view-service";
import {
  normalizeOrgTransferBankAccounts,
  resolveOrgTransferBanks,
} from "@/lib/payments/org-bank-accounts";
import { resolvePaymentMethodFees } from "./_payment-fees";
import { ErrorBoundary } from "@/components/error-boundary";
import { BayViewErrorState } from "./_error-state";
import { ErrorSection } from "./_error-section";
import { GridView } from "./_grid-view";
import { KanbanView } from "./_kanban-view";
import { KpiCards } from "./_kpi-cards";
import { ListView } from "./_list-view";
import { Toolbar } from "./_toolbar";
import { WorkOrderDetailDrawer } from "./work-order-detail-drawer";
import { useBayDragHandlers } from "./_bay-drag-handlers";
import {
  useUpdateBayViewStatus,
  useRemoveVehicleFromBay,
  useUpdateBayCount,
} from "@/lib/queries/use-bay-view";
import { useBayViewPending } from "./_use-bay-view-pending";
import { useBayViewToast } from "./_use-bay-view-toast";
import { useBayViewDialogs } from "./_use-bay-view-dialogs";
import { useBayCountMutation } from "./_use-bay-count-mutation";
import { DndContext, DragOverlay, useSensor, useSensors } from "@dnd-kit/core";
import { type ActiveDragState, GuardedPointerSensor, GuardedTouchSensor, type ViewMode } from "./_types";
import { BayCardDragPreview } from "./bay-card";
import { GripVertical } from "lucide-react";
import { StatusNotesModal } from "./status-notes-modal";
import type { PostServiceFormData } from "./post-service-dialog";
import { PostServiceDialog } from "./post-service-dialog";
import type { PickupCompleteData } from "./pickup-complete-dialog";
import { PickupCompleteDialog } from "./pickup-complete-dialog";
import { VehicleRegistrationDialog } from "./vehicle-registration-dialog";
import { ShiftReportDialog } from "./shift-report-dialog";
import { AssignDialog } from "./assign-dialog";
import { ToastMessage } from "./toast-message";
import { formatPlateNumber } from "@/lib/utils";
import { BayViewPageSkeleton } from "./_page-skeleton";
import type { Vehicle, WorkOrder } from "@/lib/types";

/**
 * Self-contained Bay View content component.
 * Fetches data via React Query, manages UI state, and renders
 * the full bay view with all view modes, dialogs, and drag-and-drop.
 */
export function BayViewContent() {
  const t = useTranslations("bayView");
  const queryClient = useQueryClient();
  const { data: orgInfo } = useCurrentOrg();
  const { settings: orgSettings } = useOrgSettings(orgInfo?.orgId);
  const paymentMethodFees = resolvePaymentMethodFees(orgSettings?.payment_method_fees);
  const transferBanks = resolveOrgTransferBanks(
    normalizeOrgTransferBankAccounts(orgSettings?.transfer_bank_accounts),
  );

  const selectedBranchId = useSelectedBranchId();
  const setSelectedBranchId = useSetSelectedBranchId();
  const branchFilter = selectedBranchId === "all" ? undefined : selectedBranchId;
  const { role: userRole } = useCurrentUserRole();

  // ── React Query ──────────────────────────────────────────────
  const bayQuery = useQuery({
    queryKey: bayViewKeys.data(branchFilter),
    queryFn: () => getBayViewDataFresh(branchFilter),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const shiftQuery = useQuery({
    queryKey: bayViewKeys.shiftReport(branchFilter),
    queryFn: () => getShiftReport(branchFilter),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const data = bayQuery.data ?? null;
  const shiftReport = shiftQuery.data ?? null;
  const loading = bayQuery.isLoading;
  const error = bayQuery.error instanceof Error ? bayQuery.error.message : null;

  const fetchData = useCallback(async () => {
    await bayQuery.refetch();
    await shiftQuery.refetch();
  }, [bayQuery, shiftQuery]);

  /** Optimistic update wrapper — writes directly to React Query cache. */
  const setData = useCallback(
    (updater: React.SetStateAction<BayViewData | null>) => {
      queryClient.setQueryData(
        bayViewKeys.data(branchFilter),
        (prev: BayViewData | null) =>
          typeof updater === "function" ? updater(prev) : updater,
      );
    },
    [queryClient, branchFilter],
  );

  // ── Mutations ──────────────────────────────────────────────
  const updateStatusMutation = useUpdateBayViewStatus(branchFilter);
  const removeMutation = useRemoveVehicleFromBay(branchFilter);
  const updateBayCountMutation = useUpdateBayCount(branchFilter);

  // ── Extracted hooks ──────────────────────────────────────────
  const dialogs = useBayViewDialogs();
  const pending = useBayViewPending();
  const toast = useBayViewToast();
  const bayCount = useBayCountMutation({
    currentBayCount: data?.bayCount ?? 0,
    onApply: useCallback(
      async (next: number) => {
        await updateBayCountMutation.mutateAsync({ count: next });
      },
      [updateBayCountMutation],
    ),
    onRefetch: fetchData,
  });

  // ── UI state ─────────────────────────────────────────────────
  const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null);
  const [pendingWoIds, setPendingWoIds] = useState<Record<string, boolean>>({});
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailWoId, setDetailWoId] = useState<string | null>(null);
  const [drawerInitialAction, setDrawerInitialAction] = useState<"add-service" | "add-part" | null>(null);
  const [currentProfile, setCurrentProfile] = useState<{ id: string; full_name: string | null } | null>(null);
  const [myJobsOnly, setMyJobsOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [baySearchQuery, setBaySearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const markPending = useCallback((...ids: string[]) => {
    setPendingWoIds((prev) => {
      const next = { ...prev };
      for (const id of ids) if (id) next[id] = true;
      return next;
    });
  }, []);

  const clearPending = useCallback((...ids: string[]) => {
    setPendingWoIds((prev) => {
      const next = { ...prev };
      for (const id of ids) if (id) delete next[id];
      return next;
    });
  }, []);

  // ── Profile ──────────────────────────────────────────────────
  const { data: profileData } = useProfile();
  useEffect(() => {
    if (profileData?.id) {
      setCurrentProfile({ id: profileData.id, full_name: profileData.fullName ?? null });
    }
  }, [profileData?.id, profileData?.fullName]);

  // ── Sensors ──────────────────────────────────────────────────
  const pointerSensor = useSensor(GuardedPointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(GuardedTouchSensor, {
    activationConstraint: { delay: 300, tolerance: 20 },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  // ── Handlers ─────────────────────────────────────────────────
  const handleOpenDetail = useCallback((woId: string) => {
    setDetailWoId(woId);
    setDetailDrawerOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailDrawerOpen(false);
    setDetailWoId(null);
  }, []);

  const handleQueueItemClick = useCallback(
    (wo: { id: string }) => handleOpenDetail(wo.id),
    [handleOpenDetail],
  );

  const handleEmptyBayClick = useCallback(
    (bayNumber: number) => dialogs.openAssign(bayNumber),
    [dialogs],
  );

  // ── Status intercept ─────────────────────────────────────────
  function handleStatusClick(woId: string, status: string) {
    const wo = data?.bays.find((b) => b.workOrder?.id === woId)?.workOrder;
    if (!wo) return;

    if (status === "Completed") {
      pending.requestPickupComplete(
        woId,
        wo.vehicle?.id ?? "",
        formatPlateNumber(wo.vehicle?.plate_number ?? ""),
        status,
        Number(wo.total),
      );
      return;
    }

    if (status === "Ready for Pickup" && wo.vehicle?.id) {
      pending.requestPostService(
        woId,
        wo.vehicle.id,
        formatPlateNumber(wo.vehicle.plate_number ?? ""),
        wo.vehicle.odometer ?? null,
        status,
        Number(wo.total),
      );
      return;
    }

    if (status === "Diagnosing" || status === "In Progress") {
      updateStatusMutation.mutate({ woId, status });
      return;
    }

    pending.requestStatusChange(woId, status);
  }

  async function handleStatusModalConfirm(woId: string, status: string, notes?: string) {
    updateStatusMutation.mutate({ woId, status, notes });
    pending.clearPending();
  }

  async function handlePostServiceConfirm(postData: PostServiceFormData) {
    const p = pending.pending;
    if (p?.type !== "postService") return;
    const { savePostServiceData } = await import("@/lib/services/post-service-service");
    await savePostServiceData({
      workOrderId: p.woId,
      vehicleId: p.vehicleId,
      odometerReading: postData.odometerReading,
      recommendations: postData.recommendations,
      mechanicNotes: postData.mechanicNotes,
    });
    updateStatusMutation.mutate({ woId: p.woId, status: p.newStatus });
    pending.clearPending();
  }

  async function handlePickupCompleteConfirm(pickupData: PickupCompleteData) {
    const p = pending.pending;
    if (p?.type !== "pickupComplete") return;
    const { saveCompletionData } = await import("@/lib/services/post-service-service");
    await saveCompletionData({
      workOrderId: p.woId,
      vehicleId: p.vehicleId,
      odometerReading: null,
      customerSatisfaction: pickupData.customerSatisfaction,
      customerFeedback: pickupData.customerFeedback ?? null,
      nextAppointmentDate: pickupData.nextAppointmentDate,
    });
    updateStatusMutation.mutate({ woId: p.woId, status: p.newStatus });
    pending.clearPending();
  }

  const handleRemoveFromBay = useCallback(
    (woId: string) => {
      removeMutation.mutate({ woId });
    },
    [removeMutation],
  );

  async function handleAssign(workOrderId: string, _mechanicId?: string) {
    const { assignVehicleToBay } = await import("@/lib/services/bay-view-service");
    await assignVehicleToBay(workOrderId, dialogs.assignBay ?? 0);
    dialogs.closeAssign();
    await fetchData();
  }

  const handleRemoveHelper = useCallback(
    async (woId: string, mechanicId: string) => {
      const { removeHelperFromWorkOrder } = await import("@/lib/services/bay-view-service");
      await removeHelperFromWorkOrder(woId, mechanicId);
      await fetchData();
    },
    [fetchData],
  );

  const handleAssignMechanic = useCallback(
    async (woId: string, mechanicId: string) => {
      const { assignMechanicToWorkOrder } = await import("@/lib/services/bay-view-service");
      await assignMechanicToWorkOrder(woId, mechanicId);
      await fetchData();
    },
    [fetchData],
  );

  const handleRemoveMechanic = useCallback(
    async (woId: string) => {
      const { unassignMechanicFromWorkOrder } = await import("@/lib/services/bay-view-service");
      await unassignMechanicFromWorkOrder(woId);
      await fetchData();
    },
    [fetchData],
  );

  // ── Drag handlers ────────────────────────────────────────────
  const { handleDragStart, handleDragEnd } = useBayDragHandlers({
    data,
    setData,
    setActiveDrag: setActiveDrag as React.Dispatch<
      React.SetStateAction<{ type: string; label: string; previewBay?: BaySlotData | null } | null>
    >,
    onStatusChange: handleStatusClick,
    markPending,
    clearPending,
    fetchData,
    setToast: toast.setToast,
  });

  // ── Trend delta ──────────────────────────────────────────────
  const prevShiftReportRef = useRef<ShiftReport | null>(null);
  useEffect(() => {
    if (shiftReport) prevShiftReportRef.current = shiftReport;
  }, [shiftReport]);
  const prevShiftReport = prevShiftReportRef.current;
  const trendDelta =
    shiftReport && prevShiftReport
      ? {
          bayUtilization: shiftReport.bayUtilization - prevShiftReport.bayUtilization,
          activeJobs: shiftReport.activeJobs - prevShiftReport.activeJobs,
          completedToday: shiftReport.completedToday - prevShiftReport.completedToday,
          revenueToday: shiftReport.revenueToday - prevShiftReport.revenueToday,
          revenuePerLaborHour: shiftReport.revenuePerLaborHour - prevShiftReport.revenuePerLaborHour,
        }
      : null;

  // ── Computed values ──────────────────────────────────────────
  const readyWosCount = useMemo(
    () =>
      data?.waitingQueue.filter(
        (wo) => wo.status === "Ready for Pickup" || wo.status === "Awaiting Parts" || wo.status === "On Hold",
      ).length ?? 0,
    [data?.waitingQueue],
  );

  const occupiedBays = useMemo(() => data?.bays.filter((b) => b.workOrder).length ?? 0, [data?.bays]);

  const statusFilteredBays = useMemo(() => {
    if (!data) return [];
    if (!statusFilter) return data.bays;
    return data.bays.filter((b) => {
      if (statusFilter === "empty") return !b.workOrder;
      return b.workOrder?.status === statusFilter;
    });
  }, [data, statusFilter]);

  const searchedBays = useFuzzySearch(
    myJobsOnly
      ? (data?.bays
          .map((bay) => {
            if (!bay.workOrder) return bay;
            const isMain = bay.workOrder.mechanic?.id === currentProfile?.id;
            if (!isMain) return { ...bay, workOrder: null };
            return bay;
          })
          .filter((b) => b.workOrder !== null) ?? [])
      : (statusFilteredBays ?? []),
    baySearchQuery,
    {
      keys: [
        "workOrder.vehicle.plate_number",
        "workOrder.vehicle.make",
        "workOrder.vehicle.model",
        "workOrder.customer_name",
        "workOrder.mechanic.full_name",
        "workOrder.status",
      ],
      threshold: 0.4,
    },
  );

  const filteredQueue = useFuzzySearch(data?.waitingQueue ?? [], baySearchQuery, {
    keys: ["vehicle.plate_number", "vehicle.make", "vehicle.model", "customer_name"],
    threshold: 0.4,
  });

  const searchedBranchSections = useMemo(() => {
    if (!data?.branchSections || data.branchSections.length <= 1) return null;
    return data.branchSections
      .map((section) => ({
        ...section,
        bays: section.bays.filter((b) => {
          if (statusFilter === "empty") return !b.workOrder;
          if (!statusFilter) return true;
          return b.workOrder?.status === statusFilter;
        }),
      }))
      .filter((section) => section.bays.length > 0);
  }, [data?.branchSections, statusFilter]);

  // ── Pending WO for dialogs ───────────────────────────────────
  const pendingPostServiceBay = useMemo(() => {
    if (pending.pending?.type !== "postService") return null;
    return data?.bays.find((b) => b.workOrder?.id === pending.pending!.woId) ?? null;
  }, [pending.pending, data?.bays]);

  // ── Loading / Error states ───────────────────────────────────
  if (loading && !data) {
    return <BayViewPageSkeleton />;
  }

  if (error && !data) {
    return <BayViewErrorState error={error} t={t} fetchData={fetchData} />;
  }

  if (!data) return null;

  // ── Render ───────────────────────────────────────────────────
  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveDrag(null)}
    >
      <div className="flex h-full flex-1 flex-col overflow-hidden bg-background rounded-2xl border border-border/30 shadow-sm">
        <Toolbar
          viewMode={viewMode}
          setViewMode={setViewMode}
          userIsMechanic={userRole === "Mechanic"}
          myJobsOnly={myJobsOnly}
          setMyJobsOnly={setMyJobsOnly}
          fetchData={fetchData}
          baySearchQuery={baySearchQuery}
          setBaySearchQuery={setBaySearchQuery}
          readyWosCount={readyWosCount}
          t={t}
          batchCompletePending={false}
          setBatchCompleteDialogOpen={(v) => dialogs.set("batchComplete", v)}
          setShowVehicleReg={(v) => dialogs.set("vehicleReg", v)}
          setShowShiftReport={(v) => dialogs.set("shiftReport", v)}
          bayCountMutationInFlightRef={{ current: false } as React.MutableRefObject<boolean>}
          bayCountDebounceRef={{ current: null } as React.MutableRefObject<ReturnType<typeof setTimeout> | null>}
          bayCountPending={bayCount.pending}
          bayCountInputValue={bayCount.inputValue}
          setBayCountInputValue={bayCount.setInputValue}
          applyBayCountChange={bayCount.apply}
          bayCount={data.bayCount}
          branches={data.branches}
          selectedBranchId={selectedBranchId}
          onBranchChange={setSelectedBranchId}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        <KpiCards
          shiftReport={shiftReport}
          trendDelta={trendDelta}
          occupiedBays={occupiedBays}
          bayCount={data.bayCount}
          waitingQueueLength={data.waitingQueue.length}
          bays={data.branchSections?.flatMap((section) => section.bays) ?? data.bays}
          waitingQueue={data.waitingQueue}
          onOpenWorkOrder={handleOpenDetail}
          t={t}
        />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent">
          {viewMode === "grid" &&
            (searchedBranchSections ? (
              <div className="flex-1 min-h-full overflow-y-auto p-5">
                {searchedBranchSections.map((section) => (
                  <div key={section.branchId} className="mb-6 last:mb-0">
                    {searchedBranchSections.length > 1 && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-semibold text-foreground/80">{section.branchName}</span>
                      </div>
                    )}
                    <GridView
                      bays={section.bays}
                      pendingWoIds={pendingWoIds}
                      onStatusChange={handleStatusClick}
                      onRemoveFromBay={handleRemoveFromBay}
                      onOpenDetail={handleOpenDetail}
                      onAssignClick={handleEmptyBayClick}
                      onRemoveHelper={handleRemoveHelper}
                      orgId={orgInfo?.orgId}
                      mechanics={data.mechanics ?? []}
                      onAssignMechanic={handleAssignMechanic}
                      onRemoveMechanic={handleRemoveMechanic}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 min-h-full overflow-y-auto p-5">
                <GridView
                  bays={searchedBays}
                  pendingWoIds={pendingWoIds}
                  onStatusChange={handleStatusClick}
                  onRemoveFromBay={handleRemoveFromBay}
                  onOpenDetail={handleOpenDetail}
                  onAssignClick={handleEmptyBayClick}
                  onRemoveHelper={handleRemoveHelper}
                  orgId={orgInfo?.orgId}
                  mechanics={data.mechanics ?? []}
                  onAssignMechanic={handleAssignMechanic}
                  onRemoveMechanic={handleRemoveMechanic}
                />
              </div>
            ))}
          {viewMode === "kanban" &&
            (searchedBranchSections ? (
              <div className="flex-1 min-h-0 overflow-y-auto p-5">
                {searchedBranchSections.map((section) => (
                  <div key={section.branchId} className="mb-6 last:mb-0">
                    {searchedBranchSections.length > 1 && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-semibold text-foreground/80">{section.branchName}</span>
                      </div>
                    )}
                    <KanbanView
                      searchedBays={section.bays}
                      assignableBays={section.bays}
                      queue={filteredQueue}
                      pendingWoIds={pendingWoIds}
                      onStatusChange={handleStatusClick}
                      onRemoveFromBay={handleRemoveFromBay}
                      onOpenDetail={handleOpenDetail}
                      onAssignClick={handleEmptyBayClick}
                      onNoEmptyBays={() => toast.setToast({ message: "No empty bays available", variant: "error" })}
                      onQueueItemClick={handleQueueItemClick}
                      onRemoveHelper={handleRemoveHelper}
                      t={t}
                      orgId={orgInfo?.orgId}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto p-5">
                <KanbanView
                  searchedBays={searchedBays}
                  assignableBays={data.bays}
                  queue={filteredQueue}
                  pendingWoIds={pendingWoIds}
                  onStatusChange={handleStatusClick}
                  onRemoveFromBay={handleRemoveFromBay}
                  onOpenDetail={handleOpenDetail}
                  onAssignClick={handleEmptyBayClick}
                  onNoEmptyBays={() => toast.setToast({ message: "No empty bays available", variant: "error" })}
                  onQueueItemClick={handleQueueItemClick}
                  onRemoveHelper={handleRemoveHelper}
                  t={t}
                  orgId={orgInfo?.orgId}
                />
              </div>
            ))}
          {viewMode === "list" &&
            (searchedBranchSections ? (
              <div className="flex-1 min-h-0 overflow-y-auto p-5">
                {searchedBranchSections.map((section) => (
                  <div key={section.branchId} className="mb-6 last:mb-0">
                    {searchedBranchSections.length > 1 && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-semibold text-foreground/80">{section.branchName}</span>
                      </div>
                    )}
                    <ListView bays={section.bays} onOpenDetail={handleOpenDetail} onAssignClick={handleEmptyBayClick} orgId={orgInfo?.orgId} t={t} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto p-5">
                <ListView bays={searchedBays} onOpenDetail={handleOpenDetail} onAssignClick={handleEmptyBayClick} orgId={orgInfo?.orgId} t={t} />
              </div>
            ))}
        </div>
      </div>

      {/* ── Dialogs & Modals ─────────────────────────────────── */}
      {pending.pending?.type === "status" && (
        <StatusNotesModal
          woId={pending.pending.woId}
          newStatus={pending.pending.status}
          onConfirm={handleStatusModalConfirm}
          onCancel={pending.clearPending}
        />
      )}

      {pending.pending?.type === "postService" && pendingPostServiceBay && (
        <PostServiceDialog
          open
          onOpenChange={(open) => { if (!open) pending.clearPending(); }}
          woId={pending.pending.woId}
          vehicleId={pending.pending.vehicleId}
          vehiclePlate={pending.pending.vehiclePlate}
          currentOdometer={pending.pending.currentOdometer}
          bayData={pendingPostServiceBay}
          newStatus={pending.pending.newStatus}
          grandTotal={pending.pending.totalCost}
          paymentMethodFees={paymentMethodFees}
          transferBanks={transferBanks}
          onConfirm={handlePostServiceConfirm}
        />
      )}

      {pending.pending?.type === "pickupComplete" && (
        <PickupCompleteDialog
          open
          onOpenChange={(open) => { if (!open) pending.clearPending(); }}
          woId={pending.pending.woId}
          vehiclePlate={pending.pending.vehiclePlate}
          totalCost={pending.pending.totalCost}
          onConfirm={handlePickupCompleteConfirm}
        />
      )}

      <ShiftReportDialog
        open={dialogs.open.shiftReport}
        onOpenChange={(v) => dialogs.set("shiftReport", v)}
      />

      <VehicleRegistrationDialog
        open={dialogs.open.vehicleReg}
        onOpenChange={(v) => dialogs.set("vehicleReg", v)}
        onQueued={() => {
          dialogs.hide("vehicleReg");
          toast.setToast({ message: "Vehicle registered", variant: "info" });
          void fetchData();
        }}
        branchId={branchFilter}
      />

      {dialogs.open.assign && dialogs.assignBay !== null && (
        <AssignDialog
          key={dialogs.assignBay}
          open={dialogs.open.assign}
          onOpenChange={(open) => { if (!open) dialogs.closeAssign(); }}
          bayNumber={dialogs.assignBay}
          queue={data.waitingQueue as (WorkOrder & { vehicle: Vehicle | null })[]}
          mechanics={data.mechanics.map((m: { id: string; full_name: string | null }) => ({
            id: m.id,
            full_name: m.full_name,
          }))}
          onAssign={handleAssign}
        />
      )}

      <ErrorBoundary>
        <WorkOrderDetailDrawer
          workOrderId={detailWoId}
          open={detailDrawerOpen}
          onOpenChange={(open) => { if (!open) handleCloseDetail(); }}
          onRefresh={() => fetchData()}
          initialAction={drawerInitialAction}
        />
      </ErrorBoundary>

      {toast.toast && (
        <ToastMessage
          message={toast.toast.message}
          variant={toast.toast.variant}
          onDismiss={toast.dismiss}
        />
      )}

      {/* ── Drag Overlay ── */}
      <DragOverlay dropAnimation={null}>
        {activeDrag &&
          (activeDrag.type === "vehicle" && activeDrag.previewBay ? (
            <div className="origin-top-left rotate-[1deg] scale-[1.02]">
              <BayCardDragPreview bay={activeDrag.previewBay} />
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border-2 border-primary/60 bg-card px-3 py-2 text-sm font-semibold shadow-xl">
              <GripVertical className="size-4 text-muted-foreground/40" />
              {activeDrag.label}
            </div>
          ))}
      </DragOverlay>
    </DndContext>
  );
}
