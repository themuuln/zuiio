"use client";

import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import {
  useAddHelperToWorkOrder,
  useAssignCustomerToWorkOrder,
  useAssignMechanicToWorkOrder,
  useAssignVehicleToBay,
  useBatchCompleteMutation,
  useRemoveHelperFromWorkOrder,
  useRemoveMechanicFromWorkOrder,
  useRemoveVehicleFromBay,
  useSwapBays,
  useUpdateBayCount,
  useUpdateBayViewStatus,
} from "@/lib/queries/use-bay-view";
import type { BayViewData, BayViewWorkOrder } from "@/lib/services/bay-view-service";
import type { Vehicle } from "@/lib/types";
import { formatPlateNumber } from "@/lib/utils";
import type { ActiveDragState } from "./_types";
import { useBayDragHandlers } from "./_bay-drag-handlers";
import type { BayViewPendingState } from "./_use-bay-view-pending";
import type { BayViewDialogsState } from "./_use-bay-view-dialogs";
import type { PaymentMethodFees } from "./_payment-fees";
import type { PickupCompleteData } from "./pickup-complete-dialog";
import type { ResolvedTransferBank } from "@/lib/payments/org-bank-accounts";
import type { PostServiceFormData } from "./post-service-dialog";
import { STATUS_TRANSLATION_KEYS } from "./_constants";
import { reportServerError } from "@/lib/sentry-report-server";

export interface BayViewMutationsParams {
  branchFilter: string | undefined;
  orgId: string | undefined;
  data: BayViewData | null;
  pendingWoIds: Record<string, boolean>;
  markPending: (...ids: string[]) => void;
  clearPending: (...ids: string[]) => void;
  setActiveDrag: Dispatch<SetStateAction<ActiveDragState | null>>;
  fetchData: () => Promise<void>;
  t: (key: string, params?: Record<string, string | number | Date>) => string;
  paymentMethodFees: PaymentMethodFees;
  transferBanks: ResolvedTransferBank[];
  dialogs: BayViewDialogsState;
  pending: BayViewPendingState;
}

export function useBayViewMutations(params: BayViewMutationsParams) {
  const {
    branchFilter,
    orgId,
    data,
    pendingWoIds,
    markPending,
    clearPending,
    setActiveDrag,
    fetchData,
    t,
    paymentMethodFees,
    transferBanks,
    dialogs,
    pending: pendingState,
  } = params;

  const {
    detailWoId,
    setDetailWoId,
    setDrawerInitialAction,
    openDetail,
    closeDetail,
    setEmptyBayBayNumber,
    emptyBayBayNumber,
    directAssignBayNumber,
    setDirectAssignBayNumber,
  } = params.dialogs;

  // ── Mutation hooks ────────────────────────────────────────────
  const updateStatusMutation = useUpdateBayViewStatus(branchFilter);
  const assignMutation = useAssignVehicleToBay(branchFilter);
  const removeMutation = useRemoveVehicleFromBay(branchFilter);
  const updateBayCountMutation = useUpdateBayCount(branchFilter);
  const assignMechanicMutation = useAssignMechanicToWorkOrder(branchFilter);
  const removeMechanicMutation = useRemoveMechanicFromWorkOrder(branchFilter);
  const addHelperMutation = useAddHelperToWorkOrder(branchFilter, orgId);
  const removeHelperMutation = useRemoveHelperFromWorkOrder(
    branchFilter,
    orgId,
  );
  const assignCustomerMutation = useAssignCustomerToWorkOrder(
    branchFilter,
    orgId,
  );
  const batchCompleteMutation = useBatchCompleteMutation(branchFilter);
  const swapMutation = useSwapBays(branchFilter);

  // ── Reorder queue ───────────────────────────────────────────
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

  // ── Status intercept ─────────────────────────────────────────
  const handleStatusClick = useCallback(
    (woId: string, status: string) => {
      const wo = data?.bays.find((b) => b.workOrder?.id === woId)?.workOrder;
      if (!wo) {
        pendingState.requestStatusChange(woId, status);
        return;
      }
      if (status === "Completed") {
        pendingState.requestPickupComplete(
          woId,
          wo.vehicle?.id ?? "",
          formatPlateNumber(wo.vehicle?.plate_number ?? ""),
          status,
          Number(wo.total),
        );
        return;
      }
      if (status === "Ready for Pickup" && wo.vehicle?.id) {
        pendingState.requestPostService(
          woId,
          wo.vehicle.id,
          formatPlateNumber(wo.vehicle.plate_number ?? ""),
          wo.vehicle.odometer ?? null,
          status,
          Number(wo.total),
        );
        return;
      }
      // Other forward transitions go direct — optimistic, no modal.
      // Show an undo toast so mechanics can revert a misclick.
      if (status === "Diagnosing" || status === "In Progress") {
        const previousStatus = wo.status;
        updateStatusMutation.mutateAsync({ woId, status }).then(() => {
          toast.dismiss();
          toast(
            t("statusUpdatedWithUndo", {
              status: t(STATUS_TRANSLATION_KEYS[status] ?? status),
            }),
            {
              action: {
                label: t("undo"),
                onClick: () =>
                  updateStatusMutation.mutate({
                    woId,
                    status: previousStatus as string,
                  }),
              },
              duration: 5000,
            },
          );
        })
        .catch((err) => {
          reportServerError("Failed to update status", err);
          toast.error("Failed to update status");
        });
        return;
      }
      pendingState.requestStatusChange(woId, status);
    },
    [data, updateStatusMutation, t, pendingState],
  );

  const handleStatusModalConfirm = useCallback(
    async (woId: string, status: string, notes?: string) => {
      updateStatusMutation.mutate({ woId, status, notes });
      pendingState.clearPending();
    },
    [updateStatusMutation, pendingState],
  );

  // ── Post-service confirm ─────────────────────────────────────
  const handlePostServiceConfirm = useCallback(
    async (postData: PostServiceFormData) => {
      const p = pendingState.pending;
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

      if (orgId && p.totalCost > 0) {
        const { createInvoiceAndRecordPayment } = await import("./_helpers");
        try {
          await createInvoiceAndRecordPayment(
            orgId,
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

      pendingState.clearPending();
    },
    [
      pendingState,
      updateStatusMutation,
      orgId,
      paymentMethodFees,
      transferBanks,
    ],
  );

  // ── Pickup complete confirm ──────────────────────────────────
  const handlePickupCompleteConfirm = useCallback(
    async (pickupData: PickupCompleteData) => {
      const p = pendingState.pending;
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
      pendingState.clearPending();

      if (detailWoId === p.woId) {
        closeDetail();
        const params = new URLSearchParams(window.location.search);
        params.delete("woId");
        window.history.replaceState(null, "", `?${params.toString()}`);
      }
    },
    [pendingState, updateStatusMutation, detailWoId, closeDetail],
  );
  // ── Detail drawer ────────────────────────────────────────────
  const handleOpenDetail = useCallback(
    (woId: string, initialAction?: "add-service" | "add-part") => {
      openDetail(woId, initialAction);
      const params = new URLSearchParams(window.location.search);
      params.set("woId", woId);
      window.history.replaceState(null, "", `?${params.toString()}`);
    },
    [openDetail],
  );

  const handleRemoveFromBay = useCallback(
    (woId: string) => {
      removeMutation.mutate({ woId });
    },
    [removeMutation],
  );

  const handleQueueItemClick = useCallback(
    (wo: BayViewWorkOrder & { vehicle: Vehicle | null }) => {
      const id = wo.id;
      openDetail(id);
      const params = new URLSearchParams(window.location.search);
      params.set("woId", id);
      window.history.replaceState(null, "", `?${params.toString()}`);
    },
    [openDetail],
  );

  // ── Empty bay ────────────────────────────────────────────────
  const handleEmptyBayClick = useCallback(
    (bayNumber: number) => {
      setEmptyBayBayNumber(bayNumber);
    },
    [setEmptyBayBayNumber],
  );

  const handleEmptyBayQueueSelect = useCallback(
    (workOrderId: string) => {
      if (emptyBayBayNumber === null) return;
      const bayNumber = emptyBayBayNumber;
      setEmptyBayBayNumber(null);
      assignMutation.mutate({ workOrderId, bayNumber });
    },
    [emptyBayBayNumber, assignMutation, setEmptyBayBayNumber],
  );

  const handleRegisterAndAssign = useCallback(
    (bayNumber: number) => {
      setEmptyBayBayNumber(null);
      setDirectAssignBayNumber(bayNumber);
      dialogs.set("vehicleReg", true);
    },
    [setEmptyBayBayNumber, setDirectAssignBayNumber, dialogs],
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
  const handleBatchComplete = useCallback(async () => {
    if (!data) return;
    const readyWos = data.bays
      .filter((b) => b.workOrder?.status === "Ready for Pickup")
      .map((b) => b.workOrder?.id)
      .filter((id): id is string => !!id);

    if (readyWos.length === 0) return;

    const result = await batchCompleteMutation.mutateAsync(readyWos);

    // Clean up URL if the currently open drawer WO was completed
    if (detailWoId && result.succeeded > 0 && readyWos.includes(detailWoId)) {
      const params = new URLSearchParams(window.location.search);
      params.delete("woId");
      window.history.replaceState(null, "", `?${params.toString()}`);
    }
  }, [data, batchCompleteMutation, detailWoId]);
  const handleRemoveHelper = useCallback(
    async (woId: string, mechId: string) => {
      markPending(woId);
      try {
        await removeHelperMutation.mutateAsync({
          woId,
          mechanicId: mechId,
        });
      } finally {
        clearPending(woId);
      }
    },
    [removeHelperMutation, markPending, clearPending],
  );

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

  const handleReorderMechanics = useCallback(
    async (woId: string, orderedMechanicIds: string[]) => {
      const [newLeadId, ...helperIds] = orderedMechanicIds;
      if (!newLeadId) return;

      markPending(woId);
      try {
        await assignMechanicMutation.mutateAsync({
          woId,
          mechanicId: newLeadId,
        });

        if (helperIds.length > 0) {
          const { reorderWorkOrderHelpers } = await import(
            "@/lib/services/bay-view-service.actions"
          );
          await reorderWorkOrderHelpers(woId, helperIds);
        }

        await fetchData();
        toast.dismiss();
        toast.success("Mechanics reordered");
      } catch {
        toast.dismiss();
        toast.error("Failed to reorder mechanics");
      } finally {
        clearPending(woId);
      }
    },
    [assignMechanicMutation, fetchData, markPending, clearPending],
  );

  // ── Quick assign/remove mechanic ──────────────────────────────
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

  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      rawDragStart(event);
      // event.active.data.current is Record<string, any> from dnd-kit
      const activeData = event.active.data.current;
      if (activeData?.type === "vehicle" && activeData.workOrderId) {
        const id = String(activeData.workOrderId);
        const wo =
          data?.waitingQueue.find((w) => w.id === id) ??
          data?.bays.find((b) => b.workOrder?.id === id)?.workOrder;
        const previewBay =
          data?.bays.find((b) => b.workOrder?.id === id) ?? null;
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
        const mechId = String(activeData.mechanicId);
        const mech = data?.mechanics.find((m) => m.id === mechId);
        if (mech?.full_name) {
          setActiveDrag({ type: "mechanic", label: mech.full_name });
        }
      }
    },
    [data, rawDragStart, setActiveDrag],
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      rawDragEnd(event);
    },
    [rawDragEnd],
  );

  const onDragCancel = useCallback(() => {
    setActiveDrag(null);
  }, [setActiveDrag]);

  return {
    // Handler callbacks
    handleStatusModalConfirm,
    handlePostServiceConfirm,
    handlePickupCompleteConfirm,
    handleOpenDetail,
    handleRemoveFromBay,
    handleQueueItemClick,
    handleEmptyBayClick,
    handleEmptyBayQueueSelect,
    handleRegisterAndAssign,
    handleAssignToBay,
    handleBatchComplete,
    handleRemoveHelper,
    handleAddHelper,
    handleReorderMechanics,
    handleAssignMechanic,
    handleRemoveMechanic,
    handleReorderQueue,
    handleStatusClick,
    // Drag
    onDragStart,
    onDragEnd,
    onDragCancel,
    // Mutation refs (needed by JSX)
    assignMechanicMutation,
    assignCustomerMutation,
    updateStatusMutation,
    batchCompleteMutation,
    updateBayCountMutation,
    assignMutation,
    removeMutation,
  };
}
