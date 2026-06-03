"use client";

import { DndContext, DragOverlay, useSensor, useSensors } from "@dnd-kit/core";
import { Building2, GripVertical, List, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePolling } from "@/hooks/use-polling";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { useFuzzySearch } from "@/lib/hooks/use-fuzzy-search";
import type { BayViewData, ShiftReport } from "@/lib/services/bay-view-service";
import {
  assignVehicleToBay,
  getBayViewDataFresh,
  getShiftReport,
} from "@/lib/services/bay-view-service";
import { useSelectedBranchId, useSetSelectedBranchId } from "@/lib/stores";
import type { Vehicle, WorkOrder } from "@/lib/types";
import { formatPlateNumber } from "@/lib/utils";
import { useBayActionHandlers } from "./_bay-action-handlers";
import { useBayDragHandlers } from "./_bay-drag-handlers";
import { BayViewErrorState } from "./_error-state";
import { GridView } from "./_grid-view";
import { KanbanView } from "./_kanban-view";
import { KpiCards } from "./_kpi-cards";
import { ListView } from "./_list-view";
import { BayViewLoadingSkeleton } from "./_loading-skeleton";
import { Toolbar } from "./_toolbar";
import {
  type ActiveDragState,
  GuardedPointerSensor,
  GuardedTouchSensor,
  type ToastState,
  type ViewMode,
} from "./_types";
import { AssignDialog } from "./assign-dialog";
import { BayCardDragPreview } from "./bay-card";
import { MechanicPanel } from "./mechanic-panel";
import { MechanicRegistrationDialog } from "./mechanic-registration-dialog";
import type { PickupCompleteData } from "./pickup-complete-dialog";
import { PickupCompleteDialog } from "./pickup-complete-dialog";
import { PinSettingsDialog } from "./pin-settings-dialog";
import type { PostServiceFormData } from "./post-service-dialog";
import { PostServiceDialog } from "./post-service-dialog";
import { QueuePanel } from "./queue-panel";
import { ShiftReportDialog } from "./shift-report-dialog";
import { StatusNotesModal } from "./status-notes-modal";
import { ToastMessage } from "./toast-message";
import { VehicleRegistrationDialog } from "./vehicle-registration-dialog";
import { WorkOrderDetailDrawer } from "./work-order-detail-drawer";

export function BayViewV2Client() {
  const t = useTranslations("bayView");
  const selectedBranchId = useSelectedBranchId();
  const setSelectedBranchId = useSetSelectedBranchId();
  const branchFilter =
    selectedBranchId === "all" ? undefined : selectedBranchId;
  const [data, setData] = useState<BayViewData | null>(null);
  const [shiftReport, setShiftReport] = useState<ShiftReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null);
  const [pendingWoIds, setPendingWoIds] = useState<Record<string, boolean>>({});
  const searchParams = useSearchParams();
  const router = useRouter();
  const woIdFromUrl = searchParams.get("woId");
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(!!woIdFromUrl);
  const [detailWoId, setDetailWoId] = useState<string | null>(woIdFromUrl);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    woId: string;
    status: string;
  } | null>(null);
  const [currentProfile, setCurrentProfile] = useState<{
    id: string;
    full_name: string | null;
  } | null>(null);
  const [myJobsOnly, setMyJobsOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [assignBay, setAssignBay] = useState<number | null>(null);
  const handleAssignOpenChange = useCallback((open: boolean) => {
    if (!open) setAssignBay(null);
  }, []);
  const bayCountMutationInFlightRef = useRef(false);
  const [bayCountPending, setBayCountPending] = useState(false);
  const [bayCountInputValue, setBayCountInputValue] = useState<number | string>(
    "",
  );
  const bayCountDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [baySearchQuery, setBaySearchQuery] = useState("");
  const prevShiftReportRef = useRef<ShiftReport | null>(null);
  const fetchGenerationRef = useRef(0);

  // Polling is set up after fetchData is declared below

  // Dialog open states
  const [showShiftReport, setShowShiftReport] = useState(false);
  const [showPinSettings, setShowPinSettings] = useState(false);
  const [showVehicleReg, setShowVehicleReg] = useState(false);
  const [showMechanicReg, setShowMechanicReg] = useState(false);

  // Post-service / pickup intercept state
  const [pendingPostService, setPendingPostService] = useState<{
    woId: string;
    vehicleId: string;
    vehiclePlate: string;
    currentOdometer: number | null;
    newStatus: string;
    totalCost: number;
  } | null>(null);

  const [pendingPickupComplete, setPendingPickupComplete] = useState<{
    woId: string;
    vehicleId: string;
    vehiclePlate: string;
    newStatus: string;
    totalCost: number;
  } | null>(null);

  const [batchCompletePending, setBatchCompletePending] = useState(false);
  const [batchCompleteDialogOpen, setBatchCompleteDialogOpen] = useState(false);

  const readyWosCount = useMemo(
    () =>
      data?.bays.filter((b) => b.workOrder?.status === "Ready for Pickup")
        .length ?? 0,
    [data],
  );

  async function handleBatchComplete() {
    if (!data || batchCompletePending) return;
    setBatchCompletePending(true);
    const readyWos = data.bays
      .filter((b) => b.workOrder?.status === "Ready for Pickup")
      .map((b) => b.workOrder!.id);

    const { updateWorkOrderStatus } = await import(
      "@/lib/services/bay-view-service"
    );

    const results = await Promise.allSettled(
      readyWos.map((woId) => updateWorkOrderStatus(woId, "Completed")),
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    if (succeeded === readyWos.length) {
      setToast({
        message: t("batchCompleteSuccess", { count: succeeded }),
        variant: "info",
      });
    } else if (failed === readyWos.length) {
      setToast({
        message: t("batchCompleteError"),
        variant: "error",
      });
    } else {
      setToast({
        message: t("batchCompletePartial", {
          successCount: succeeded,
          totalCount: readyWos.length,
          failCount: failed,
        }),
        variant: "error",
      });
    }

    setBatchCompletePending(false);
    await fetchData(false);
  }

  const { registerTab, unregisterTab } = useRightSidebar();
  const [toast, setToast] = useState<ToastState | null>(null);
  const handleDismissToast = useCallback(() => setToast(null), []);
  const bayCountValueRef = useRef(data?.bayCount ?? 0);

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

  const fetchData = useCallback(
    async (showLoader = false) => {
      const gen = ++fetchGenerationRef.current;
      if (showLoader) setLoading(true);
      try {
        setError(null);
        const [result, report] = await Promise.all([
          getBayViewDataFresh(branchFilter),
          getShiftReport(branchFilter).catch(() => null),
        ]);
        // Ignore stale responses from older fetch generations (e.g., when
        // the user switches branches before the previous fetch completes)
        if (gen !== fetchGenerationRef.current) return;
        setData(result);
        if (report) setShiftReport(report);
      } catch (err) {
        if (gen !== fetchGenerationRef.current) return;
        setError(err instanceof Error ? err.message : "Failed to load");
      }
      if (gen === fetchGenerationRef.current) {
        setLoading(false);
      }
    },
    [branchFilter],
  );

  const pollingCb = useCallback(() => fetchData(false), [fetchData]);
  const polling = usePolling(pollingCb, 30000);

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
        }
      })
      .catch(() => {});

    return () => {
      abort.abort();
    };
  }, [fetchData]);

  useEffect(() => {
    if (data) bayCountValueRef.current = data.bayCount;
  }, [data]);

  useEffect(() => {
    if (data) setBayCountInputValue(data.bayCount);
  }, [data]);

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
    onStatusChange: handleStatusClick,
    markPending,
    clearPending,
    fetchData,
    setToast,
  });

  function onDragStart(event: Parameters<typeof handleDragStart>[0]) {
    handleDragStart(event);
    const activeData = event.active.data.current;
    if (activeData?.type === "vehicle" && activeData.workOrderId) {
      const id = activeData.workOrderId;
      const wo =
        data?.waitingQueue.find((w) => w.id === id) ??
        data?.bays.find((b) => b.workOrder?.id === id)?.workOrder;
      const previewBay = data?.bays.find((b) => b.workOrder?.id === id) ?? null;
      const plate = wo?.vehicle?.plate_number;
      if (plate) {
        setActiveDrag({
          type: "vehicle",
          label: formatPlateNumber(plate),
          previewBay,
        });
      }
    } else if (
      (activeData?.type === "mechanic" && activeData.mechanicId) ||
      (activeData?.type === "mechanic-assigned" && activeData.mechanicId)
    ) {
      const mechId = activeData.mechanicId;
      const mech = data?.mechanics.find((m) => m.id === mechId);
      if (mech?.full_name) {
        setActiveDrag({
          type: "mechanic",
          label: mech.full_name,
        });
      }
    }
  }

  function onDragEnd(event: Parameters<typeof handleDragEnd>[0]) {
    handleDragEnd(event);
  }

  function onDragCancel() {
    setActiveDrag(null);
  }

  const {
    handleStatusClick: rawHandleStatusClick,
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

  const applyBayCountChange = useCallback(
    async (next: number) => {
      if (next === data?.bayCount) return;
      if (bayCountMutationInFlightRef.current) return;
      if (bayCountDebounceRef.current) {
        clearTimeout(bayCountDebounceRef.current);
        bayCountDebounceRef.current = null;
      }
      bayCountMutationInFlightRef.current = true;
      bayCountValueRef.current = next;
      setBayCountPending(true);
      let caught: unknown = null;
      try {
        await handleBayCountChange(next);
        await fetchData(false);
      } catch (err) {
        caught = err;
      }
      bayCountMutationInFlightRef.current = false;
      setBayCountPending(false);
      if (caught) throw caught;
    },
    [data?.bayCount, fetchData, handleBayCountChange],
  );

  // Intercept status clicks — open PickupCompleteDialog for "Completed"
  function handleStatusClick(woId: string, status: string) {
    // Find the work order in current data
    const wo = data?.bays.find((b) => b.workOrder?.id === woId)?.workOrder;
    if (!wo) {
      rawHandleStatusClick(woId, status);
      return;
    }

    // Completed — show pickup completion dialog for customer feedback
    if (status === "Completed") {
      setPendingPickupComplete({
        woId,
        vehicleId: wo.vehicle?.id ?? "",
        vehiclePlate: formatPlateNumber(wo.vehicle?.plate_number ?? ""),
        newStatus: status,
        totalCost: Number(wo.total),
      });
      return;
    }

    // All other statuses (including "Ready for Pickup"): open status notes modal
    // Post-service data can be filled later from the detail drawer
    rawHandleStatusClick(woId, status);
  }

  async function handleStatusModalConfirm(
    woId: string,
    status: string,
    notes?: string,
  ) {
    handleStatusChangeConfirm(woId, status, notes);
  }

  // Handle PostServiceDialog confirm — save post-service data then update status
  async function handlePostServiceConfirm(data: PostServiceFormData) {
    if (!pendingPostService) return;
    const { woId, vehicleId } = pendingPostService;

    const { savePostServiceData } = await import(
      "@/lib/services/post-service-service"
    );
    await savePostServiceData({
      workOrderId: woId,
      vehicleId,
      odometerReading: data.odometerReading,
      recommendations: data.recommendations,
      mechanicNotes: data.mechanicNotes,
    });

    // Now change the status
    await handleStatusChangeConfirm(woId, pendingPostService.newStatus);
    setPendingPostService(null);
  }

  // Handle PickupCompleteDialog confirm — save completion data then update status
  async function handlePickupCompleteConfirm(data: PickupCompleteData) {
    if (!pendingPickupComplete) return;
    const { woId, vehicleId } = pendingPickupComplete;

    const { saveCompletionData } = await import(
      "@/lib/services/post-service-service"
    );
    await saveCompletionData({
      workOrderId: woId,
      vehicleId,
      customerSatisfaction: data.customerSatisfaction,
      customerFeedback: data.customerFeedback,
      nextAppointmentDate: data.nextAppointmentDate,
    });

    // Now change the status
    await handleStatusChangeConfirm(woId, pendingPickupComplete.newStatus);
    setPendingPickupComplete(null);
  }

  function handleOpenDetail(woId: string) {
    setDetailWoId(woId);
    setDetailDrawerOpen(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set("woId", woId);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  const availableBays = useMemo(
    () => data?.bays.filter((b) => !b.workOrder).map((b) => b.bayNumber) ?? [],
    [data],
  );

  const handleQuickAssignToBay = useCallback(
    async (workOrderId: string, bayNumber: number) => {
      markPending(workOrderId);
      try {
        await assignVehicleToBay(workOrderId, bayNumber);
        setToast({
          message: `${t("assignedToBay")} ${bayNumber}`,
          variant: "info",
        });
        await fetchData(false);
      } catch {
        setToast({ message: t("failedToAssign"), variant: "error" });
      }
      clearPending(workOrderId);
    },
    [t, markPending, clearPending, fetchData],
  );

  const handleQueueItemClick = useCallback(
    (wo: WorkOrder & { vehicle: Vehicle | null }) => {
      const id = wo.id;
      setDetailWoId(id);
      setDetailDrawerOpen(true);
      const params = new URLSearchParams(window.location.search);
      params.set("woId", id);
      window.history.replaceState(null, "", `?${params.toString()}`);
    },
    [],
  );

  const handleQuickAssign = useCallback(
    async (workOrderId: string) => {
      markPending(workOrderId);
      try {
        const bay = data?.bays.find((b) => !b.workOrder);
        if (bay) {
          await assignVehicleToBay(workOrderId, bay.bayNumber);
          setToast({
            message: `${t("assignedToBay")} ${bay.bayNumber}`,
            variant: "info",
          });
          await fetchData(false);
        }
      } catch {
        setToast({ message: t("failedToAssign"), variant: "error" });
      }
      clearPending(workOrderId);
    },
    [data, t, markPending, clearPending, fetchData],
  );

  const handleAssignToBay = useCallback(
    async (workOrderId: string, mechanicId?: string) => {
      if (assignBay === null) return;
      markPending(workOrderId);
      try {
        await assignVehicleToBay(workOrderId, assignBay);
        if (mechanicId) {
          const { assignMechanicToWorkOrder } = await import(
            "@/lib/services/bay-view-service"
          );
          await assignMechanicToWorkOrder(workOrderId, mechanicId);
        }
        setToast({
          message: `${t("assignedToBay")} ${assignBay}`,
          variant: "info",
        });
        await fetchData(false);
      } catch {
        setToast({ message: t("failedToAssign"), variant: "error" });
      }
      clearPending(workOrderId);
    },
    [assignBay, t, markPending, clearPending, fetchData],
  );

  const userIsMechanic =
    currentProfile && data?.mechanics.some((m) => m.id === currentProfile.id);

  const filteredBays = useMemo(
    () =>
      myJobsOnly
        ? (data?.bays.map((bay) => {
            if (!bay.workOrder) return bay;
            const isMain = bay.workOrder.mechanic?.id === currentProfile?.id;
            const isHelper = (
              bay.workOrder as unknown as Record<string, unknown>
            ).helpers
              ? (
                  (bay.workOrder as unknown as Record<string, unknown>)
                    .helpers as { id: string }[]
                ).some((h) => h.id === currentProfile?.id)
              : false;
            return {
              ...bay,
              workOrder: isMain || isHelper ? bay.workOrder : null,
            };
          }) ?? [])
        : (data?.bays ?? []),
    [data, myJobsOnly, currentProfile?.id],
  );

  const filteredQueue = useMemo(() => data?.waitingQueue ?? [], [data]);

  // Track previous shift report for trend comparison
  useEffect(() => {
    if (shiftReport) {
      prevShiftReportRef.current = shiftReport;
    }
  }, [shiftReport]);

  // Pause auto-refresh when any dialog/drawer is open
  useEffect(() => {
    const anyDialogOpen =
      showShiftReport ||
      showPinSettings ||
      showVehicleReg ||
      showMechanicReg ||
      !!pendingPostService ||
      !!pendingPickupComplete ||
      !!pendingStatusChange ||
      assignBay !== null ||
      detailDrawerOpen;
    if (anyDialogOpen) {
      polling.pause();
    } else {
      polling.resume();
    }
  }, [
    showShiftReport,
    showPinSettings,
    showVehicleReg,
    showMechanicReg,
    pendingPostService,
    pendingPickupComplete,
    pendingStatusChange,
    assignBay,
    detailDrawerOpen,
    polling.pause,
    polling.resume,
  ]);

  // Search across all branch sections when in "All" mode
  const searchedBranchSections = useMemo(() => {
    if (!data?.branchSections) return undefined;
    if (!baySearchQuery.trim()) return data.branchSections;
    const q = baySearchQuery.toLowerCase();
    return data.branchSections.map((section) => ({
      ...section,
      bays: section.bays.filter((b) => {
        const wo = b.workOrder;
        if (!wo?.vehicle) return false;
        return (
          wo.vehicle.plate_number?.toLowerCase().includes(q) ||
          wo.vehicle.make?.toLowerCase().includes(q) ||
          wo.vehicle.model?.toLowerCase().includes(q)
        );
      }),
    }));
  }, [data?.branchSections, baySearchQuery]);

  const searchedBays = useFuzzySearch(filteredBays, baySearchQuery, {
    keys: [
      "workOrder.vehicle.plate_number" as string,
      "workOrder.vehicle.make" as string,
      "workOrder.vehicle.model" as string,
      "workOrder.customer_name" as string,
      "workOrder.mechanic.full_name" as string,
      "workOrder.status" as string,
    ],
    threshold: 0.4,
  });

  useEffect(() => {
    if (!data) return;
    registerTab(
      "queue",
      t("waitingQueue"),
      <QueuePanel
        items={filteredQueue}
        pendingWoIds={pendingWoIds}
        onQuickAssign={handleQuickAssign}
        mechanics={data.mechanics}
        onItemClick={handleQueueItemClick}
        availableBays={availableBays}
        onAssignToBay={handleQuickAssignToBay}
      />,
      <List className="size-4" />,
    );
    registerTab(
      "mechanics",
      t("mechanics"),
      <MechanicPanel mechanics={data.mechanics} />,
      <Users className="size-4" />,
    );
    return () => {
      unregisterTab("queue");
      unregisterTab("mechanics");
    };
  }, [
    data,
    filteredQueue,
    pendingWoIds,
    handleQuickAssign,
    handleQueueItemClick,
    registerTab,
    t,
    unregisterTab,
    availableBays,
    handleQuickAssignToBay,
  ]);

  if (loading && !data) {
    return <BayViewLoadingSkeleton />;
  }

  if (error || !data) {
    return <BayViewErrorState error={error} t={t} fetchData={fetchData} />;
  }

  const occupiedBays = data.bays.filter((b) => b.workOrder).length;
  const pendingPostServiceBay = pendingPostService
    ? (data.bays.find((b) => b.workOrder?.id === pendingPostService.woId) ??
      null)
    : null;

  // Trend delta computation for KPI cards (compare current vs previous poll)
  const prevShiftReport = prevShiftReportRef.current;
  const trendDelta =
    shiftReport && prevShiftReport
      ? {
          bayUtilization:
            shiftReport.bayUtilization - prevShiftReport.bayUtilization,
          activeJobs: shiftReport.activeJobs - prevShiftReport.activeJobs,
          completedToday:
            shiftReport.completedToday - prevShiftReport.completedToday,
          revenueToday: shiftReport.revenueToday - prevShiftReport.revenueToday,
        }
      : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className="flex h-full flex-col bg-muted/20 overflow-hidden rounded-2xl border border-border/40 shadow-sm">
        {/* Sleek Controls Toolbar */}
        <Toolbar
          viewMode={viewMode}
          setViewMode={setViewMode}
          userIsMechanic={userIsMechanic}
          myJobsOnly={myJobsOnly}
          setMyJobsOnly={setMyJobsOnly}
          fetchData={fetchData}
          baySearchQuery={baySearchQuery}
          setBaySearchQuery={setBaySearchQuery}
          readyWosCount={readyWosCount}
          t={t}
          batchCompletePending={batchCompletePending}
          setBatchCompleteDialogOpen={setBatchCompleteDialogOpen}
          setShowVehicleReg={setShowVehicleReg}
          setShowMechanicReg={setShowMechanicReg}
          setShowShiftReport={setShowShiftReport}
          setShowPinSettings={setShowPinSettings}
          bayCountMutationInFlightRef={bayCountMutationInFlightRef}
          bayCountDebounceRef={bayCountDebounceRef}
          bayCountPending={bayCountPending}
          bayCountInputValue={bayCountInputValue}
          setBayCountInputValue={setBayCountInputValue}
          applyBayCountChange={applyBayCountChange}
          bayCount={data.bayCount}
          branches={data.branches}
          selectedBranchId={selectedBranchId}
          onBranchChange={(id) => {
            setSelectedBranchId(id);
          }}
        />

        <KpiCards
          shiftReport={shiftReport}
          trendDelta={trendDelta}
          occupiedBays={occupiedBays}
          bayCount={data.bayCount}
          waitingQueueLength={data.waitingQueue.length}
          t={t}
        />

        {/* Scrollable View Content */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/5">
          {viewMode === "grid" &&
            (searchedBranchSections ? (
              <div className="flex-1 overflow-y-auto p-4">
                {searchedBranchSections.map((section) => (
                  <div key={section.branchId} className="mb-6 last:mb-0">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="size-4 text-muted-foreground/60" />
                      <span className="text-sm font-semibold text-foreground/80">
                        {section.branchName}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50 bg-muted px-1.5 py-0.5 font-mono">
                        {section.bays.filter((b) => b.workOrder).length}/
                        {section.bayCount} bays
                      </span>
                    </div>
                    <GridView
                      bays={section.bays}
                      pendingWoIds={pendingWoIds}
                      onStatusChange={handleStatusClick}
                      onRemoveFromBay={handleRemoveFromBay}
                      onOpenDetail={handleOpenDetail}
                      onAssignClick={(n) => setAssignBay(n)}
                      onRemoveHelper={async (woId, mechId) => {
                        try {
                          const { removeHelperFromWorkOrder } = await import(
                            "@/lib/services/bay-view-service"
                          );
                          await removeHelperFromWorkOrder(woId, mechId);
                          await fetchData(false);
                        } catch {
                          setToast({
                            message: "Failed to remove helper",
                            variant: "error",
                          });
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <GridView
                bays={searchedBays}
                pendingWoIds={pendingWoIds}
                onStatusChange={handleStatusClick}
                onRemoveFromBay={handleRemoveFromBay}
                onOpenDetail={handleOpenDetail}
                onAssignClick={(n) => setAssignBay(n)}
                onRemoveHelper={async (woId, mechId) => {
                  try {
                    const { removeHelperFromWorkOrder } = await import(
                      "@/lib/services/bay-view-service"
                    );
                    await removeHelperFromWorkOrder(woId, mechId);
                    await fetchData(false);
                  } catch {
                    setToast({
                      message: "Failed to remove helper",
                      variant: "error",
                    });
                  }
                }}
              />
            ))}

          {viewMode === "kanban" &&
            (searchedBranchSections ? (
              <div className="flex-1 overflow-y-auto p-4">
                {searchedBranchSections.map((section) => (
                  <div key={section.branchId} className="mb-6 last:mb-0">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="size-4 text-muted-foreground/60" />
                      <span className="text-sm font-semibold text-foreground/80">
                        {section.branchName}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50 bg-muted px-1.5 py-0.5 font-mono">
                        {section.bays.filter((b) => b.workOrder).length}/
                        {section.bayCount} bays
                      </span>
                    </div>
                    <KanbanView
                      searchedBays={section.bays}
                      assignableBays={section.bays}
                      queue={filteredQueue}
                      pendingWoIds={pendingWoIds}
                      onStatusChange={handleStatusClick}
                      onRemoveFromBay={handleRemoveFromBay}
                      onOpenDetail={handleOpenDetail}
                      onAssignClick={(n) => setAssignBay(n)}
                      onNoEmptyBays={() =>
                        setToast({
                          message: "No empty bays available",
                          variant: "error",
                        })
                      }
                      onQueueItemClick={handleQueueItemClick}
                      onRemoveHelper={async (woId, mechId) => {
                        try {
                          const { removeHelperFromWorkOrder } = await import(
                            "@/lib/services/bay-view-service"
                          );
                          await removeHelperFromWorkOrder(woId, mechId);
                          await fetchData(false);
                        } catch {
                          setToast({
                            message: "Failed to remove helper",
                            variant: "error",
                          });
                        }
                      }}
                      t={t}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <KanbanView
                searchedBays={searchedBays}
                assignableBays={data.bays}
                queue={filteredQueue}
                pendingWoIds={pendingWoIds}
                onStatusChange={handleStatusClick}
                onRemoveFromBay={handleRemoveFromBay}
                onOpenDetail={handleOpenDetail}
                onAssignClick={(n) => setAssignBay(n)}
                onNoEmptyBays={() =>
                  setToast({
                    message: "No empty bays available",
                    variant: "error",
                  })
                }
                onQueueItemClick={handleQueueItemClick}
                onRemoveHelper={async (woId, mechId) => {
                  try {
                    const { removeHelperFromWorkOrder } = await import(
                      "@/lib/services/bay-view-service"
                    );
                    await removeHelperFromWorkOrder(woId, mechId);
                    await fetchData(false);
                  } catch {
                    setToast({
                      message: "Failed to remove helper",
                      variant: "error",
                    });
                  }
                }}
                t={t}
              />
            ))}

          {viewMode === "list" &&
            (searchedBranchSections ? (
              <div className="flex-1 overflow-y-auto p-4">
                {searchedBranchSections.map((section) => (
                  <div key={section.branchId} className="mb-6 last:mb-0">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="size-4 text-muted-foreground/60" />
                      <span className="text-sm font-semibold text-foreground/80">
                        {section.branchName}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50 bg-muted px-1.5 py-0.5 font-mono">
                        {section.bays.filter((b) => b.workOrder).length}/
                        {section.bayCount} bays
                      </span>
                    </div>
                    <ListView
                      bays={section.bays}
                      onOpenDetail={handleOpenDetail}
                      onAssignClick={(n) => setAssignBay(n)}
                      t={t}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <ListView
                bays={searchedBays}
                onOpenDetail={handleOpenDetail}
                onAssignClick={(n) => setAssignBay(n)}
                t={t}
              />
            ))}
        </div>
      </div>

      {pendingStatusChange && (
        <StatusNotesModal
          woId={pendingStatusChange.woId}
          newStatus={pendingStatusChange.status}
          onConfirm={handleStatusModalConfirm}
          onCancel={() => setPendingStatusChange(null)}
        />
      )}

      {pendingPostService && pendingPostServiceBay && (
        <PostServiceDialog
          open={!!pendingPostService}
          onOpenChange={(open) => {
            if (!open) setPendingPostService(null);
          }}
          woId={pendingPostService.woId}
          vehicleId={pendingPostService.vehicleId}
          vehiclePlate={pendingPostService.vehiclePlate}
          currentOdometer={pendingPostService.currentOdometer}
          bayData={pendingPostServiceBay}
          newStatus={pendingPostService.newStatus}
          onConfirm={handlePostServiceConfirm}
        />
      )}

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

      <AlertDialog
        open={batchCompleteDialogOpen}
        onOpenChange={setBatchCompleteDialogOpen}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("batchCompleteConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("batchCompleteConfirmDesc", { count: readyWosCount })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setBatchCompleteDialogOpen(false);
                await handleBatchComplete();
              }}
              disabled={batchCompletePending}
            >
              {batchCompletePending
                ? t("batchCompleteProcessing")
                : t("batchComplete", { count: readyWosCount })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AssignDialog
        key={assignBay ?? "closed"}
        open={assignBay !== null}
        onOpenChange={handleAssignOpenChange}
        bayNumber={assignBay ?? 0}
        queue={data.waitingQueue}
        mechanics={data.mechanics}
        onAssign={handleAssignToBay}
        branchId={branchFilter}
      />

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

      <ErrorBoundary>
        <WorkOrderDetailDrawer
          workOrderId={detailWoId}
          open={detailDrawerOpen}
          onOpenChange={(open) => {
            setDetailDrawerOpen(open);
            if (!open) {
              setDetailWoId(null);
              const params = new URLSearchParams(searchParams.toString());
              params.delete("woId");
              router.replace(`?${params.toString()}`, { scroll: false });
            }
          }}
          onRefresh={() => fetchData(false)}
        />
      </ErrorBoundary>

      {/* Admin dialogs */}
      <ShiftReportDialog
        open={showShiftReport}
        onOpenChange={setShowShiftReport}
      />
      <PinSettingsDialog
        open={showPinSettings}
        onOpenChange={setShowPinSettings}
      />
      <VehicleRegistrationDialog
        open={showVehicleReg}
        onOpenChange={setShowVehicleReg}
        onQueued={() => {
          setShowVehicleReg(false);
          setToast({ message: "Added to waiting queue", variant: "info" });
          void fetchData(false);
        }}
        branchId={branchFilter}
      />
      <MechanicRegistrationDialog
        open={showMechanicReg}
        onOpenChange={setShowMechanicReg}
        onRegistered={async (email, fullName, phone) => {
          setShowMechanicReg(false);
          try {
            const { registerMechanic } = await import(
              "@/lib/services/bay-view-actions"
            );
            await registerMechanic({ email, fullName, phone });
            // Refetch to pick up the new mechanic with full shape
            void fetchData(false);
            setToast({
              message: t("mechanicRegistered", { name: fullName }),
              variant: "info",
            });
          } catch (err) {
            setToast({
              message:
                err instanceof Error
                  ? err.message
                  : "Failed to register mechanic",
              variant: "error",
            });
          }
        }}
      />

      {toast && (
        <ToastMessage
          message={toast.message}
          variant={toast.variant}
          onDismiss={handleDismissToast}
        />
      )}
    </DndContext>
  );
}
