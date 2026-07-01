"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useQuery } from "@tanstack/react-query";
import { GripVertical } from "lucide-react";
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
  useSwapBays,
  useUpdateBayCount,
  useUpdateBayViewStatus,
} from "@/lib/queries/use-bay-view";
import { useOrgSettings } from "@/lib/queries/use-org-settings";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useProfile } from "@/lib/queries/use-profile";
import type { ShiftReport } from "@/lib/services/bay-view-service";
import {
  getBayViewDataFresh,
  getShiftReport,
} from "@/lib/services/bay-view-service.actions";
import { useSelectedBranchId, useSetSelectedBranchId } from "@/lib/stores";
import type { Vehicle, WorkOrder } from "@/lib/types";
import { formatPlateNumber } from "@/lib/utils";
import { useBayDragHandlers } from "./_bay-drag-handlers";
import { EmptyBayActionDrawer } from "./_empty-bay-action-drawer";
import { BayViewErrorState } from "./_error-state";
import { KpiCards } from "./_kpi-cards";
import { BayViewPageSkeleton } from "./_page-skeleton";
import { resolvePaymentMethodFees } from "./_payment-fees";
import { BayViewTickProvider } from "./_tick-context";
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
import { useBayViewSidebar } from "./_use-bay-view-sidebar";
import { BayViewViews } from "./_view-renderer";
import { AssignDialog } from "./assign-dialog";
import { BayCardDragPreview } from "./bay-card";
import type { PickupCompleteData } from "./pickup-complete-dialog";
import { PickupCompleteDialog } from "./pickup-complete-dialog";
import type { PostServiceFormData } from "./post-service-dialog";
import { PostServiceDialog } from "./post-service-dialog";
import { ShiftReportDialog } from "./shift-report-dialog";
import { StatusNotesModal } from "./status-notes-modal";
import { VehicleRegistrationDrawer } from "./vehicle-registration-drawer";
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

  const bayQuery = useQuery({
    queryKey: bayViewKeys.data(branchFilter),
    queryFn: () => getBayViewDataFresh(branchFilter),
    staleTime: 60_000,
    refetchInterval: 300_000,
  });

  const shiftQuery = useQuery({
    queryKey: bayViewKeys.shiftReport(branchFilter),
    queryFn: () => getShiftReport(branchFilter),
    staleTime: 60_000,
    refetchInterval: 300_000,
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
  const addHelperMutation = useAddHelperToWorkOrder(
    branchFilter,
    orgInfo?.orgId,
  );
  const removeHelperMutation = useRemoveHelperFromWorkOrder(
    branchFilter,
    orgInfo?.orgId,
  );
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

  // ── Swap bays mutation ──────────────────────────────────────
  const swapMutation = useSwapBays(branchFilter);

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
      onSwapBays: (woId, srcBay, targetWoId, targetBay) =>
        swapMutation.mutateAsync({
          woIdA: woId,
          bayNumberA: srcBay,
          woIdB: targetWoId,
          bayNumberB: targetBay,
        }),
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

    // Clean up URL if this WO is currently open in the drawer
    if (detailWoId === p.woId) {
      setDetailDrawerOpen(false);
      setDetailWoId(null);
      setDrawerInitialAction(null);
      const params = new URLSearchParams(window.location.search);
      params.delete("woId");
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }

  function handleOpenDetail(
    woId: string,
    initialAction?: "add-service" | "add-part",
  ) {
    setDetailWoId(woId);
    setDrawerInitialAction(initialAction ?? null);
    setDetailDrawerOpen(true);
    const params = new URLSearchParams(window.location.search);
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
  const handleEmptyBayClick = (bayNumber: number) => {
    // Always show the action chooser drawer first (register & assign,
    // register only, or pick from queue)
    setEmptyBayBayNumber(bayNumber);
  };

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
    [
      dialogs.assignBay,
      assignMutation,
      assignMechanicMutation,
      dialogs.closeAssign,
    ],
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

    // Clean up URL if the currently open drawer WO was completed
    if (detailWoId && succeeded > 0 && readyWos.includes(detailWoId)) {
      const params = new URLSearchParams(window.location.search);
      params.delete("woId");
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }

  // ── Sidebar tabs ─────────────────────────────────────────────
  useBayViewSidebar(
    data,
    filteredQueue,
    pendingWoIds,
    availableBays,
    handleQuickAssign,
    handleQueueItemClick,
    handleQuickAssignToBay,
  );

  // ── Realtime subscriptions ─────────────────────────────────
  const realtimeTables = useMemo(
    () => [
      {
        table: "work_orders" as const,
        queryKey: bayViewKeys.data(branchFilter),
        filter: branchFilter
          ? `organization_id=eq.${orgInfo?.orgId},branch_id=eq.${branchFilter}`
          : `organization_id=eq.${orgInfo?.orgId}`,
      },
      {
        table: "work_order_helpers" as const,
        queryKey: bayViewKeys.data(branchFilter),
        filter: `organization_id=eq.${orgInfo?.orgId}`,
      },
      {
        table: "mechanic_assignments" as const,
        queryKey: bayViewKeys.data(branchFilter),
        filter: `organization_id=eq.${orgInfo?.orgId}`,
      },
    ],
    [branchFilter, orgInfo?.orgId],
  );
  useRealtimeMulti({
    enabled: !!orgInfo?.orgId,
    tables: realtimeTables,
  });

  // ── Remove helper ────────────────────────────────────────────
  const handleRemoveHelper = useCallback(
    async (woId: string, mechId: string) => {
      markPending(woId);
      try {
        await removeHelperMutation.mutateAsync({ woId, mechanicId: mechId });
      } finally {
        clearPending(woId);
      }
    },
    [removeHelperMutation, markPending, clearPending],
  );

  // ── Add helper ───────────────────────────────────────────────
  const handleAddHelper = useCallback(
    async (woId: string, mechanicId: string) => {
      markPending(woId);
      try {
        await addHelperMutation.mutateAsync({ woId, mechanicId });
      } finally {
        clearPending(woId);
      }
    },
    [addHelperMutation, markPending, clearPending],
  );

  // ── Reorder mechanics ────────────────────────────────────────
  const handleReorderMechanics = useCallback(
    async (woId: string, orderedMechanicIds: string[]) => {
      const [newLeadId, ...helperIds] = orderedMechanicIds;
      if (!newLeadId) return;

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
        toast.dismiss();
        toast.error("Failed to reorder mechanics");
      }
    },
    [orgInfo?.orgId],
  );

  // ── Assign mechanic (quick assign from BayCard) ──────────────
  const handleAssignMechanic = useCallback(
    async (woId: string, mechanicId: string) => {
      markPending(woId);
      try {
        await assignMechanicMutation.mutateAsync({ woId, mechanicId });
      } finally {
        clearPending(woId);
      }
    },
    [assignMechanicMutation, markPending, clearPending],
  );

  // ── Remove mechanic (quick remove from BayCard) ──────────────
  const handleRemoveMechanic = useCallback(
    async (woId: string) => {
      markPending(woId);
      try {
        await removeMechanicMutation.mutateAsync({ woId });
      } finally {
        clearPending(woId);
      }
    },
    [removeMechanicMutation, markPending, clearPending],
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

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <BayViewTickProvider>
        <div className="flex h-full flex-1 flex-col overflow-hidden">
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
              data.branchSections?.flatMap((section) => section.bays) ??
              data.bays
            }
            waitingQueue={data.waitingQueue}
            onOpenWorkOrder={handleOpenDetail}
            t={t}
          />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent">
            <BayViewViews
              viewMode={viewMode}
              searchedBranchSections={searchedBranchSections}
              searchedBays={searchedBays}
              filteredQueue={filteredQueue}
              pendingWoIds={pendingWoIds}
              readyWosCount={readyWosCount}
              batchCompletePending={batchCompletePending}
              onStatusChange={handleStatusClick}
              onRemoveFromBay={handleRemoveFromBay}
              onOpenDetail={handleOpenDetail}
              onAssignClick={handleEmptyBayClick}
              onQueueItemClick={handleQueueItemClick}
              onRemoveHelper={handleRemoveHelper}
              onAssignMechanic={handleAssignMechanic}
              onRemoveMechanic={handleRemoveMechanic}
              onAddHelper={handleAddHelper}
              onReorderMechanics={handleReorderMechanics}
              orgId={orgInfo?.orgId}
              mechanics={data?.mechanics ?? []}
              t={t}
            />
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

        <EmptyBayActionDrawer
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
                const params = new URLSearchParams(window.location.search);
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
        <VehicleRegistrationDrawer
          open={dialogs.open.vehicleReg}
          onOpenChange={(v) => {
            dialogs.set("vehicleReg", v);
            if (!v) setDirectAssignBayNumber(null);
          }}
          onQueued={() => {
            dialogs.hide("vehicleReg");
            toast.dismiss();
            toast.success("Added to waiting queue");
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
          }}
          assignBayNumber={directAssignBayNumber ?? undefined}
          branchId={branchFilter}
        />
      </BayViewTickProvider>
    </DndContext>
  );
}
