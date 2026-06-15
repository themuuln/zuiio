"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, GripVertical, List, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
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
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { useFuzzySearch } from "@/lib/hooks/use-fuzzy-search";
import { useRealtimeMulti } from "@/lib/hooks/use-realtime-multi";
import {
  normalizeOrgTransferBankAccounts,
  resolveOrgTransferBanks,
} from "@/lib/payments/org-bank-accounts";
import { bayViewKeys } from "@/lib/queries/keys";
import {
  useAddHelperToWorkOrder,
  useAssignCustomerToWorkOrder,
  useAssignMechanicToWorkOrder,
  useAssignVehicleToBay,
  useRemoveHelperFromWorkOrder,
  useRemoveMechanicFromWorkOrder,
  useRemoveVehicleFromBay,
  useUpdateBayCount,
  useUpdateBayViewStatus,
} from "@/lib/queries/use-bay-view";
import { useOrgSettings } from "@/lib/queries/use-org-settings";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useProfile } from "@/lib/queries/use-profile";
import type { BayViewData, ShiftReport } from "@/lib/services/bay-view-service";
import {
  getBayViewDataFresh,
  getShiftReport,
} from "@/lib/services/bay-view-service.actions";
import { useSelectedBranchId, useSetSelectedBranchId } from "@/lib/stores";
import type { Vehicle, WorkOrder } from "@/lib/types";
import { formatPlateNumber } from "@/lib/utils";
import { useBayDragHandlers } from "./_bay-drag-handlers";
import { EmptyBayActionDialog } from "./_empty-bay-action-dialog";
import { BayViewErrorState } from "./_error-state";
import { GridView } from "./_grid-view";
import { KanbanView } from "./_kanban-view";
import { KpiCards } from "./_kpi-cards";
import { ListView } from "./_list-view";
import { BayViewPageSkeleton } from "./_page-skeleton";
import { resolvePaymentMethodFees } from "./_payment-fees";
import { Toolbar } from "./_toolbar";
import {
  type ActiveDragState,
  GuardedPointerSensor,
  GuardedTouchSensor,
  type ViewMode,
} from "./_types";
import { useBayCountMutation } from "./_use-bay-count-mutation";
import { useBayViewDialogs } from "./_use-bay-view-dialogs";
import { useBayViewPending } from "./_use-bay-view-pending";
import { AssignDialog } from "./assign-dialog";
import { BayCardDragPreview } from "./bay-card";
import { MechanicPanel } from "./mechanic-panel";
import type { PickupCompleteData } from "./pickup-complete-dialog";
import { PickupCompleteDialog } from "./pickup-complete-dialog";
import type { PostServiceFormData } from "./post-service-dialog";
import { PostServiceDialog } from "./post-service-dialog";
import { QueuePanel } from "./queue-panel";
import { ShiftReportDialog } from "./shift-report-dialog";
import { StatusNotesModal } from "./status-notes-modal";
import { VehicleRegistrationDialog } from "./vehicle-registration-dialog";
import { WorkOrderDetailDrawer } from "./work-order-detail-drawer";

export function BayViewV2Client() {
  const t = useTranslations("bayView");
  const selectedBranchId = useSelectedBranchId();
  const setSelectedBranchId = useSetSelectedBranchId();
  const branchFilter =
    selectedBranchId === "all" ? undefined : selectedBranchId;
  const { data: orgInfo } = useCurrentOrg();
  const { settings: orgSettings } = useOrgSettings(orgInfo?.orgId);
  const paymentMethodFees = resolvePaymentMethodFees(
    orgSettings?.payment_method_fees,
  );
  const transferBanks = resolveOrgTransferBanks(
    normalizeOrgTransferBankAccounts(orgSettings?.transfer_bank_accounts),
  );
  const searchParams = useSearchParams();
  const router = useRouter();

  // ── React Query ──────────────────────────────────────────────
  const queryClient = useQueryClient();
  const [isPollingPaused, setIsPollingPaused] = useState(false);

  const bayQuery = useQuery({
    queryKey: bayViewKeys.data(branchFilter),
    queryFn: () => getBayViewDataFresh(branchFilter),
    refetchInterval: isPollingPaused ? false : 30_000,
    staleTime: 15_000,
  });

  const shiftQuery = useQuery({
    queryKey: bayViewKeys.shiftReport(branchFilter),
    queryFn: () => getShiftReport(branchFilter),
    refetchInterval: isPollingPaused ? false : 30_000,
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

  // ── Mutations ──────────────────────────────────────────────
  const updateStatusMutation = useUpdateBayViewStatus(branchFilter);
  const assignMutation = useAssignVehicleToBay(branchFilter);
  const removeMutation = useRemoveVehicleFromBay(branchFilter);
  const updateBayCountMutation = useUpdateBayCount(branchFilter);
  const assignMechanicMutation = useAssignMechanicToWorkOrder(branchFilter);
  const removeMechanicMutation = useRemoveMechanicFromWorkOrder(branchFilter);
  const addHelperMutation = useAddHelperToWorkOrder(branchFilter);
  const removeHelperMutation = useRemoveHelperFromWorkOrder(branchFilter);
  const assignCustomerMutation = useAssignCustomerToWorkOrder(
    branchFilter,
    orgInfo?.orgId,
  );

  // ── Extracted hooks ──────────────────────────────────────────
  const dialogs = useBayViewDialogs();
  const pending = useBayViewPending();
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
  const [emptyBayBayNumber, setEmptyBayBayNumber] = useState<number | null>(
    null,
  );
  const [directAssignBayNumber, setDirectAssignBayNumber] = useState<
    number | null
  >(null);
  const woIdFromUrl = searchParams.get("woId");
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(!!woIdFromUrl);
  const [detailWoId, setDetailWoId] = useState<string | null>(woIdFromUrl);
  const [drawerInitialAction, setDrawerInitialAction] = useState<
    "add-service" | "add-part" | null
  >(null);
  const [currentProfile, setCurrentProfile] = useState<{
    id: string;
    full_name: string | null;
  } | null>(null);
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
      setCurrentProfile({
        id: profileData.id,
        full_name: profileData.fullName ?? null,
      });
    }
  }, [profileData?.id, profileData?.fullName]);

  // ── Sensors ──────────────────────────────────────────────────
  const pointerSensor = useSensor(GuardedPointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(GuardedTouchSensor, {
    activationConstraint: { delay: 300, tolerance: 20 },
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor);

  // ── Swap bays callback ──────────────────────────────────────
  const handleSwapBays = useCallback(
    async (
      woId: string,
      srcBay: number,
      targetWoId: string,
      targetBay: number,
    ) => {
      const { swapBayNumbers } = await import(
        "@/lib/services/bay-view-service.actions"
      );
      await swapBayNumbers(woId, srcBay, targetWoId, targetBay);
      await fetchData();
    },
    [fetchData],
  );

  // ── Reorder queue callback ─────────────────────────────────
  const handleReorderQueue = useCallback(
    async (updates: { id: string; queue_order: number }[]) => {
      const { reorderQueue } = await import(
        "@/lib/services/bay-view-service.actions"
      );
      await reorderQueue(updates);
      await fetchData();
    },
    [fetchData],
  );

  // ── Drag handlers ────────────────────────────────────────────
  const { handleDragStart: rawDragStart, handleDragEnd: rawDragEnd } =
    useBayDragHandlers({
      data,
      setActiveDrag,
      onStatusChange: handleStatusClick,
      assignMechanic: (vars) => assignMechanicMutation.mutate(vars),
      removeMechanic: (vars) => removeMechanicMutation.mutate(vars),
      addHelper: (vars) => addHelperMutation.mutate(vars),
      assignToBay: (vars) => assignMutation.mutate(vars),
      removeFromBay: (vars) => removeMutation.mutate(vars),
      onSwapBays: handleSwapBays,
      onReorderQueue: handleReorderQueue,
      markPending,
      clearPending,
    });

  function onDragStart(event: Parameters<typeof rawDragStart>[0]) {
    rawDragStart(event);
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
        setActiveDrag({ type: "mechanic", label: mech.full_name });
      }
    }
  }

  function onDragEnd(event: Parameters<typeof rawDragEnd>[0]) {
    rawDragEnd(event);
  }

  function onDragCancel() {
    setActiveDrag(null);
  }

  // ── Status intercept ─────────────────────────────────────────
  const rawHandleStatusClick = useCallback(
    (woId: string, status: string) => {
      pending.requestStatusChange(woId, status);
    },
    [pending],
  );

  function handleStatusClick(woId: string, status: string) {
    const wo = data?.bays.find((b) => b.workOrder?.id === woId)?.workOrder;
    if (!wo) {
      rawHandleStatusClick(woId, status);
      return;
    }
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
    // Other forward transitions go direct — optimistic, no modal
    if (status === "Diagnosing" || status === "In Progress") {
      updateStatusMutation.mutate({ woId, status });
      return;
    }
    rawHandleStatusClick(woId, status);
  }

  async function handleStatusModalConfirm(
    woId: string,
    status: string,
    notes?: string,
  ) {
    updateStatusMutation.mutate({ woId, status, notes });
    pending.clearPending();
  }

  async function handlePostServiceConfirm(postData: PostServiceFormData) {
    const p = pending.pending;
    if (p?.type !== "postService") return;
    const { savePostServiceData } = await import(
      "@/lib/services/post-service-service"
    );
    await savePostServiceData({
      workOrderId: p.woId,
      vehicleId: p.vehicleId,
      odometerReading: postData.odometerReading,
      recommendations: postData.recommendations,
      mechanicNotes: postData.mechanicNotes,
    });
    updateStatusMutation.mutate({ woId: p.woId, status: p.newStatus });

    if (orgInfo?.orgId && p.totalCost > 0) {
      const { createInvoiceAndRecordPayment } = await import("./_helpers");
      try {
        await createInvoiceAndRecordPayment(
          orgInfo.orgId,
          p.woId,
          postData.paymentMethod,
          paymentMethodFees[postData.paymentMethod] ?? 0,
          transferBanks,
          postData.transferBankId,
        );
      } catch (err) {
        toast.dismiss();
        toast.error(
          err instanceof Error
            ? err.message
            : "Ready — but payment could not be recorded",
        );
      }
    }

    pending.clearPending();
  }

  async function handlePickupCompleteConfirm(pickupData: PickupCompleteData) {
    const p = pending.pending;
    if (p?.type !== "pickupComplete") return;
    const { saveCompletionData } = await import(
      "@/lib/services/post-service-service"
    );
    await saveCompletionData({
      workOrderId: p.woId,
      vehicleId: p.vehicleId,
      customerSatisfaction: pickupData.customerSatisfaction,
      customerFeedback: pickupData.customerFeedback,
      nextAppointmentDate: pickupData.nextAppointmentDate,
    });
    updateStatusMutation.mutate({ woId: p.woId, status: p.newStatus });
    pending.clearPending();
  }

  function handleOpenDetail(
    woId: string,
    initialAction?: "add-service" | "add-part",
  ) {
    setDetailWoId(woId);
    setDrawerInitialAction(initialAction ?? null);
    setDetailDrawerOpen(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set("woId", woId);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  // ── Derived data ─────────────────────────────────────────────
  const readyWosCount = useMemo(
    () =>
      data?.bays.filter((b) => b.workOrder?.status === "Ready for Pickup")
        .length ?? 0,
    [data],
  );

  const availableBays = useMemo(
    () => data?.bays.filter((b) => !b.workOrder).map((b) => b.bayNumber) ?? [],
    [data],
  );

  const userIsMechanic =
    currentProfile && data?.mechanics.some((m) => m.id === currentProfile.id);

  const filteredBays = useMemo(() => {
    const bays = myJobsOnly
      ? (data?.bays.map((bay) => {
          if (!bay.workOrder) return bay;
          const isMain = bay.workOrder.mechanic?.id === currentProfile?.id;
          const isHelper = (bay.workOrder as unknown as Record<string, unknown>)
            .helpers
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
      : (data?.bays ?? []);

    // Apply status filter
    if (statusFilter) {
      return bays.filter(
        (bay) => !bay.workOrder || bay.workOrder.status === statusFilter,
      );
    }
    return bays;
  }, [data, myJobsOnly, currentProfile?.id, statusFilter]);

  const filteredQueue = useMemo(() => data?.waitingQueue ?? [], [data]);

  const prevShiftReportRef = useRef<ShiftReport | null>(null);
  useEffect(() => {
    if (shiftReport) prevShiftReportRef.current = shiftReport;
  }, [shiftReport]);

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
          revenuePerLaborHour:
            shiftReport.revenuePerLaborHour -
            prevShiftReport.revenuePerLaborHour,
        }
      : null;

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

  // ── Empty bay click handler ──────────────────────────────────
  const handleEmptyBayClick = useCallback(
    (bayNumber: number) => {
      const queue = data?.waitingQueue ?? [];
      if (queue.length === 0) {
        // No queue items: open registration dialog directly
        dialogs.set("vehicleReg", true);
      } else {
        // Queue has items: show the action chooser dialog
        setEmptyBayBayNumber(bayNumber);
      }
    },
    [data?.waitingQueue, dialogs],
  );

  const handleEmptyBayQueueSelect = useCallback(
    (workOrderId: string) => {
      const bayNumber = emptyBayBayNumber;
      if (bayNumber === null) return;
      setEmptyBayBayNumber(null);
      assignMutation.mutate({ workOrderId, bayNumber });
    },
    [emptyBayBayNumber, assignMutation],
  );

  // ── Register & assign directly to bay ─────────────────────────
  const handleRegisterAndAssign = useCallback(
    (bayNumber: number) => {
      setEmptyBayBayNumber(null);
      setDirectAssignBayNumber(bayNumber);
      dialogs.set("vehicleReg", true);
    },
    [dialogs],
  );

  // ── Quick assign handlers ────────────────────────────────────
  const handleQuickAssignToBay = useCallback(
    (workOrderId: string, bayNumber: number) => {
      assignMutation.mutate({ workOrderId, bayNumber });
    },
    [assignMutation],
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
    (workOrderId: string) => {
      const bay = data?.bays.find((b) => !b.workOrder);
      if (!bay) {
        toast.dismiss();
        toast.error("No empty bay available");
        return;
      }
      assignMutation.mutate({ workOrderId, bayNumber: bay.bayNumber });
    },
    [data?.bays, assignMutation],
  );

  const handleRemoveFromBay = useCallback(
    (woId: string) => {
      removeMutation.mutate({ woId });
    },
    [removeMutation],
  );

  const handleAssignToBay = useCallback(
    async (workOrderId: string, mechanicId?: string) => {
      if (dialogs.assignBay === null) return;
      assignMutation.mutate({
        workOrderId,
        bayNumber: dialogs.assignBay,
      });
      if (mechanicId) {
        assignMechanicMutation.mutate({
          woId: workOrderId,
          mechanicId,
        });
      }
      dialogs.closeAssign();
    },
    [dialogs.assignBay, assignMutation, assignMechanicMutation],
  );

  // ── Batch complete ───────────────────────────────────────────
  const [batchCompletePending, setBatchCompletePending] = useState(false);

  async function handleBatchComplete() {
    if (!data || batchCompletePending) return;
    setBatchCompletePending(true);
    const readyWos = data.bays
      .filter((b) => b.workOrder?.status === "Ready for Pickup")
      .map((b) => b.workOrder?.id);

    const { updateWorkOrderStatus } = await import(
      "@/lib/services/bay-view-service.actions"
    );
    const results = await Promise.allSettled(
      readyWos
        .filter((id): id is string => !!id)
        .map((woId) => updateWorkOrderStatus(woId, "Completed")),
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    if (succeeded === readyWos.length) {
      toast.dismiss();
      toast.success(t("batchCompleteSuccess", { count: succeeded }));
    } else if (failed === readyWos.length) {
      toast.dismiss();
      toast.error(t("batchCompleteError"));
    } else {
      toast.dismiss();
      toast.error(
        t("batchCompletePartial", {
          successCount: succeeded,
          totalCount: readyWos.length,
          failCount: failed,
        }),
      );
    }
    setBatchCompletePending(false);
    await fetchData();
  }

  // ── Sidebar tabs ─────────────────────────────────────────────
  const { registerTab, updateTabContent, unregisterTab } = useRightSidebar();

  // Register sidebar tabs once on mount, unregister on unmount only.
  // Content updates are handled by the separate effect below — mixing
  // cleanup + re-register in the same effect causes a render loop
  // because unregisterTab mutates state, triggering re-renders.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    t,
    registerTab,
    handleQuickAssign,
    pendingWoIds,
    handleQueueItemClick,
    data,
    handleQuickAssignToBay,
    filteredQueue,
    availableBays,
  ]);

  useEffect(() => {
    return () => {
      unregisterTab("queue");
      unregisterTab("mechanics");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unregisterTab]);

  // Use refs for callbacks to avoid effect re-fires that cause render loops.
  const handleQuickAssignRef = useRef(handleQuickAssign);
  handleQuickAssignRef.current = handleQuickAssign;
  const handleQueueItemClickRef = useRef(handleQueueItemClick);
  handleQueueItemClickRef.current = handleQueueItemClick;
  const handleQuickAssignToBayRef = useRef(handleQuickAssignToBay);
  handleQuickAssignToBayRef.current = handleQuickAssignToBay;

  useEffect(() => {
    if (!data) return;
    updateTabContent(
      "queue",
      <QueuePanel
        items={filteredQueue}
        pendingWoIds={pendingWoIds}
        onQuickAssign={(...args) => handleQuickAssignRef.current(...args)}
        mechanics={data.mechanics}
        onItemClick={(...args) => handleQueueItemClickRef.current(...args)}
        availableBays={availableBays}
        onAssignToBay={(...args) => handleQuickAssignToBayRef.current(...args)}
      />,
    );
    updateTabContent("mechanics", <MechanicPanel mechanics={data.mechanics} />);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, filteredQueue, pendingWoIds, availableBays, updateTabContent]);

  // ── Realtime subscriptions ─────────────────────────────────
  useRealtimeMulti({
    enabled: !!orgInfo?.orgId,
    tables: [
      {
        table: "work_orders",
        queryKey: bayViewKeys.data(branchFilter),
        filter: branchFilter
          ? `organization_id=eq.${orgInfo?.orgId},branch_id=eq.${branchFilter}`
          : `organization_id=eq.${orgInfo?.orgId}`,
      },
      {
        table: "work_order_helpers",
        queryKey: bayViewKeys.data(branchFilter),
        filter: `organization_id=eq.${orgInfo?.orgId}`,
      },
      {
        table: "mechanic_assignments",
        queryKey: bayViewKeys.data(branchFilter),
        filter: `organization_id=eq.${orgInfo?.orgId}`,
      },
    ],
  });

  // ── Polling pause ────────────────────────────────────────────
  useEffect(() => {
    const anyDialogOpen =
      dialogs.open.shiftReport ||
      dialogs.open.vehicleReg ||
      pending.pending !== null ||
      dialogs.open.assign ||
      detailDrawerOpen;
    setIsPollingPaused(anyDialogOpen);
  }, [
    dialogs.open.shiftReport,
    dialogs.open.vehicleReg,
    pending.pending,
    dialogs.open.assign,
    detailDrawerOpen,
  ]);

  // ── Remove helper ────────────────────────────────────────────
  const handleRemoveHelper = useCallback(
    async (woId: string, mechId: string) => {
      removeHelperMutation.mutate({ woId, mechanicId: mechId });
    },
    [removeHelperMutation],
  );

  // ── Add helper ───────────────────────────────────────────────
  const handleAddHelper = useCallback(
    async (woId: string, mechanicId: string) => {
      addHelperMutation.mutate({ woId, mechanicId });
    },
    [addHelperMutation],
  );

  // ── Reorder mechanics ────────────────────────────────────────
  const handleReorderMechanics = useCallback(
    async (woId: string, orderedMechanicIds: string[]) => {
      const [newLeadId, ...helperIds] = orderedMechanicIds;
      if (!newLeadId) return;

      // Optimistic: update the cache immediately via the bay view cache
      queryClient.setQueryData<BayViewData>(
        bayViewKeys.data(branchFilter),
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            bays: prev.bays.map((bay) => {
              if (bay.workOrder?.id !== woId) return bay;
              const mechanics = prev.mechanics;
              const newLead = mechanics.find((m) => m.id === newLeadId) ?? null;
              // Build new helpers list preserving profile data
              const newHelpers = helperIds
                .map((id) => {
                  const existing = bay.workOrder?.helpers.find(
                    (h) => h.id === id,
                  );
                  if (existing) return existing;
                  const profile = mechanics.find((m) => m.id === id);
                  return profile
                    ? {
                        id: profile.id,
                        full_name: profile.full_name,
                        avatar_url: profile.avatar_url,
                      }
                    : null;
                })
                .filter(Boolean) as {
                id: string;
                full_name: string | null;
                avatar_url: string | null;
              }[];

              return {
                ...bay,
                workOrder: bay.workOrder
                  ? {
                      ...bay.workOrder,
                      mechanic: newLead,
                      helpers: newHelpers,
                    }
                  : null,
              };
            }),
          };
        },
      );

      try {
        // PATCH the work order to update the lead mechanic
        const leadRes = await fetch(
          `/api/organizations/${orgInfo?.orgId}/work-orders/${woId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mechanic_id: newLeadId }),
          },
        );
        const leadJson = await leadRes.json();
        if (leadJson.error) throw new Error(leadJson.error.message);

        // PUT the helpers with new order
        if (helperIds.length > 0) {
          const helpersRes = await fetch(
            `/api/organizations/${orgInfo?.orgId}/work-orders/${woId}/helpers`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ mechanic_ids: helperIds }),
            },
          );
          const helpersJson = await helpersRes.json();
          if (helpersJson.error) throw new Error(helpersJson.error.message);
        }

        toast.dismiss();
        toast.success("Mechanics reordered");
      } catch {
        // Rollback on failure — invalidate so fresh data is fetched
        queryClient.invalidateQueries({
          queryKey: bayViewKeys.data(branchFilter),
        });
        toast.dismiss();
        toast.error("Failed to reorder mechanics");
      }
    },
    [orgInfo?.orgId, branchFilter, queryClient],
  );

  // ── Assign mechanic (quick assign from BayCard) ──────────────
  const handleAssignMechanic = useCallback(
    async (woId: string, mechanicId: string) => {
      assignMechanicMutation.mutate({ woId, mechanicId });
    },
    [assignMechanicMutation],
  );

  // ── Remove mechanic (quick remove from BayCard) ──────────────
  const handleRemoveMechanic = useCallback(
    async (woId: string) => {
      removeMechanicMutation.mutate({ woId });
    },
    [removeMechanicMutation],
  );

  // ── Loading / error ──────────────────────────────────────────
  if (loading && !data) return <BayViewPageSkeleton />;
  if (error || !data)
    return <BayViewErrorState error={error} t={t} fetchData={fetchData} />;

  const occupiedBays = data.bays.filter((b) => b.workOrder).length;
  const pendingPostServiceBay =
    pending.pending?.type === "postService"
      ? (data.bays.find((b) => b.workOrder?.id === pending.pending?.woId) ??
        null)
      : null;

  // ── View renderers ───────────────────────────────────────────
  const renderBranchHeader = (section: {
    branchId: string;
    branchName: string;
    bayCount: number;
    bays: typeof data.bays;
  }) => (
    <div className="flex items-center gap-2 mb-3">
      <Building2 className="size-4 text-muted-foreground/60" />
      <span className="text-sm font-semibold text-foreground/80">
        {section.branchName}
      </span>
      <span className="text-xs text-muted-foreground/50 bg-muted/60 px-2 py-0.5 rounded-md font-mono">
        {section.bays.filter((b) => b.workOrder).length}/{section.bayCount} bays
      </span>
    </div>
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className="flex h-full flex-1 flex-col overflow-hidden bg-background rounded-2xl border border-border/30 shadow-sm">
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
          setBatchCompleteDialogOpen={(v) => dialogs.set("batchComplete", v)}
          setShowVehicleReg={(v) => dialogs.set("vehicleReg", v)}
          setShowShiftReport={(v) => dialogs.set("shiftReport", v)}
          bayCountMutationInFlightRef={{ current: false }}
          bayCountDebounceRef={{ current: null }}
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
          bays={
            data.branchSections?.flatMap((section) => section.bays) ?? data.bays
          }
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
                    {searchedBranchSections.length > 1 &&
                      renderBranchHeader(section)}
                    <GridView
                      bays={section.bays}
                      pendingWoIds={pendingWoIds}
                      onStatusChange={handleStatusClick}
                      onRemoveFromBay={handleRemoveFromBay}
                      onOpenDetail={handleOpenDetail}
                      onAssignClick={handleEmptyBayClick}
                      onRemoveHelper={handleRemoveHelper}
                      orgId={orgInfo?.orgId}
                      mechanics={data?.mechanics ?? []}
                      onAssignMechanic={handleAssignMechanic}
                      onRemoveMechanic={handleRemoveMechanic}
                      onAddHelper={handleAddHelper}
                      onReorderMechanics={handleReorderMechanics}
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
                  mechanics={data?.mechanics ?? []}
                  onAssignMechanic={handleAssignMechanic}
                  onRemoveMechanic={handleRemoveMechanic}
                  onAddHelper={handleAddHelper}
                  onReorderMechanics={handleReorderMechanics}
                />
              </div>
            ))}

          {viewMode === "kanban" &&
            (searchedBranchSections ? (
              <div className="flex-1 min-h-0 overflow-y-auto p-5">
                {searchedBranchSections.map((section) => (
                  <div key={section.branchId} className="mb-6 last:mb-0">
                    {searchedBranchSections.length > 1 &&
                      renderBranchHeader(section)}
                    <KanbanView
                      searchedBays={section.bays}
                      assignableBays={section.bays}
                      queue={filteredQueue}
                      pendingWoIds={pendingWoIds}
                      onStatusChange={handleStatusClick}
                      onRemoveFromBay={handleRemoveFromBay}
                      onOpenDetail={handleOpenDetail}
                      onAssignClick={handleEmptyBayClick}
                      onNoEmptyBays={() => {
                        toast.dismiss();
                        toast.error("No empty bays available");
                      }}
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
                  onNoEmptyBays={() => {
                    toast.dismiss();
                    toast.error("No empty bays available");
                  }}
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
                    {searchedBranchSections.length > 1 &&
                      renderBranchHeader(section)}
                    <ListView
                      bays={section.bays}
                      onOpenDetail={handleOpenDetail}
                      onAssignClick={handleEmptyBayClick}
                      orgId={orgInfo?.orgId}
                      t={t}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto p-5">
                <ListView
                  bays={searchedBays}
                  onOpenDetail={handleOpenDetail}
                  onAssignClick={handleEmptyBayClick}
                  orgId={orgInfo?.orgId}
                  t={t}
                />
              </div>
            ))}
        </div>
      </div>

      {/* ── Dialogs ──────────────────────────────────────────── */}
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
          onOpenChange={(open) => {
            if (!open) pending.clearPending();
          }}
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
          onOpenChange={(open) => {
            if (!open) pending.clearPending();
          }}
          woId={pending.pending.woId}
          vehiclePlate={pending.pending.vehiclePlate}
          totalCost={pending.pending.totalCost}
          onConfirm={handlePickupCompleteConfirm}
        />
      )}

      <AlertDialog
        open={dialogs.open.batchComplete}
        onOpenChange={(v) => dialogs.set("batchComplete", v)}
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
                dialogs.hide("batchComplete");
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
        key={dialogs.assignBay ?? "closed"}
        open={dialogs.open.assign}
        onOpenChange={(open) => {
          if (!open) dialogs.closeAssign();
        }}
        bayNumber={dialogs.assignBay ?? 0}
        queue={data.waitingQueue}
        mechanics={data.mechanics}
        onAssign={handleAssignToBay}
        branchId={branchFilter}
      />

      <EmptyBayActionDialog
        open={emptyBayBayNumber !== null}
        onOpenChange={(open) => {
          if (!open) setEmptyBayBayNumber(null);
        }}
        bayNumber={emptyBayBayNumber ?? 0}
        queue={data.waitingQueue}
        onSelectRegister={() => {
          setEmptyBayBayNumber(null);
          dialogs.set("vehicleReg", true);
        }}
        onSelectRegisterAndAssign={() => {
          handleRegisterAndAssign(emptyBayBayNumber ?? 0);
        }}
        onSelectQueueItem={handleEmptyBayQueueSelect}
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
              setDrawerInitialAction(null);
              const params = new URLSearchParams(searchParams.toString());
              params.delete("woId");
              router.replace(`?${params.toString()}`, { scroll: false });
            }
          }}
          onRefresh={fetchData}
          initialAction={drawerInitialAction}
          branchFilter={branchFilter}
          assignMechanicMutation={assignMechanicMutation}
          assignCustomerMutation={assignCustomerMutation}
        />
      </ErrorBoundary>

      <ShiftReportDialog
        open={dialogs.open.shiftReport}
        onOpenChange={(v) => dialogs.set("shiftReport", v)}
      />
      <VehicleRegistrationDialog
        open={dialogs.open.vehicleReg}
        onOpenChange={(v) => {
          dialogs.set("vehicleReg", v);
          if (!v) setDirectAssignBayNumber(null);
        }}
        onQueued={() => {
          dialogs.hide("vehicleReg");
          toast.dismiss();
          toast.success("Added to waiting queue");
          void fetchData();
        }}
        onAssigned={() => {
          dialogs.hide("vehicleReg");
          setDirectAssignBayNumber(null);
          toast.dismiss();
          toast.success(
            t("assignedDirectlyToBay", {
              bayNumber: directAssignBayNumber ?? 0,
            }),
          );
          void fetchData();
        }}
        assignBayNumber={directAssignBayNumber ?? undefined}
        branchId={branchFilter}
      />
    </DndContext>
  );
}
