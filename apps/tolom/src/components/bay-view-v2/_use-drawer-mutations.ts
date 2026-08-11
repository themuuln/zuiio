"use client";

/**
 * Barrel: orchestrates domain mutation hooks into the single
 * `useDrawerMutations` return shape that consumers expect.
 *
 * Domain hooks handle focused concerns:
 *   - _use-service-mutations  – add/remove/discount services
 *   - _use-part-mutations     – add/remove/discount parts
 *   - _use-status-mutations   – status transitions
 *   - _use-invoice-mutations  – invoice / payment / ready-for-pickup
 */

import { useOrgMutation } from "@zuiio/query";
import { useState } from "react";
import { toast } from "sonner";
import type { ResolvedTransferBank } from "@/lib/payments/org-bank-accounts";
import { bayViewKeys, workOrderKeys } from "@/lib/queries/keys";
import { drawerDetailKeys } from "@/lib/queries/use-drawer-queries";
import { reportServerError } from "@/lib/sentry-report-server";
import type { Customer, WorkOrderDetail } from "@/lib/types";
import type { PaymentMethodFees } from "./_payment-fees";
import { useCatalogMutations } from "./_use-catalog-mutations";
import { useInvoiceMutations } from "./_use-invoice-mutations";
import { useStatusMutations } from "./_use-status-mutations";

// ─── Params ────────────────────────────────────────────────────────────

interface UseDrawerMutationsParams {
  workOrderId: string | null;
  orgIdRef: React.MutableRefObject<string | null>;
  orgId: string | undefined;
  wo: WorkOrderDetail | null;
  setWo: React.Dispatch<React.SetStateAction<WorkOrderDetail | null>>;
  fetchWo: (silent?: boolean, orgIdOverride?: string) => Promise<void>;
  onRefresh: () => void;
  onOpenChange: (open: boolean) => void;
  paymentMethodFees: PaymentMethodFees;
  transferBanks: ResolvedTransferBank[];
  /** Branch filter used for bay view cache key (for optimistic updates) */
  branchId?: string;
  /**
   * Mutation hooks for mechanic/customer assignment.
   * Passed from the parent component to use React Query mutations
   * instead of raw fetch() for these operations.
   */
  assignMechanicMutation?: {
    mutateAsync: (vars: { woId: string; mechanicId: string }) => Promise<void>;
    isPending?: boolean;
  };
  assignCustomerMutation?: {
    mutateAsync: (vars: {
      woId: string;
      customerId: string | null;
      customerName?: string | null;
    }) => Promise<void>;
    isPending?: boolean;
  };
}

// ─── Hook ──────────────────────────────────────────────────────────────

export function useDrawerMutations({
  workOrderId,
  orgIdRef,
  orgId,
  wo,
  setWo,
  fetchWo,
  onRefresh,
  onOpenChange,
  paymentMethodFees,
  transferBanks,
  branchId,
  assignMechanicMutation,
  assignCustomerMutation,
}: UseDrawerMutationsParams) {
  // ── Domain hooks ──────────────────────────────────────────────────

  const {
    serviceSearch,
    setServiceSearch,
    showAddService,
    setShowAddService,
    addingServiceIds,
    confirmingServiceIds,
    addService,
    removeService,
    handleServicePriceSave,
    handleServiceQtySave,
    handleServiceDiscountSave,
    lastAddedServiceId,
  } = useCatalogMutations({
    entity: "service",
    workOrderId,
    orgIdRef,
    orgId,
    branchId,
    wo,
    setWo,
    onRefresh,
  });

  const {
    partSearch,
    setPartSearch,
    showAddPart,
    setShowAddPart,
    addingPartIds,
    addPart,
    removePart,
    handlePartPriceSave,
    handlePartQtySave,
    handlePartDiscountSave,
    lastAddedPartId,
  } = useCatalogMutations({
    entity: "part",
    workOrderId,
    orgIdRef,
    orgId,
    branchId,
    wo,
    setWo,
    onRefresh,
  });

  const {
    confirmStatus,
    setConfirmStatus,
    statusNotes,
    setStatusNotes,
    changeStatus,
    handleStatusConfirm,
    canCancel,
  } = useStatusMutations({
    workOrderId,
    orgIdRef,
    orgId,
    branchId,
    wo,
    setWo,
    onRefresh,
  });

  const {
    creatingInvoice,
    setCreatingInvoice,
    invoicePublicToken,
    setInvoicePublicToken,
    showPostServiceForm,
    setShowPostServiceForm,
    postFormServices,
    setPostFormServices,
    postFormParts,
    setPostFormParts,
    generateInvoice,
    handleReadyForPickup,
    handlePostServiceFormSubmit,
    handleCancelPostService,
    canInvoice,
  } = useInvoiceMutations({
    workOrderId,
    orgIdRef,
    orgId,
    branchId,
    wo,
    setWo,
    fetchWo,
    onRefresh,
    paymentMethodFees,
    transferBanks,
  });

  // ── Fallback mutations (used when pre-built hooks not provided) ──

  const patchWorkOrderMutation = useOrgMutation<
    unknown,
    Record<string, unknown>
  >({
    endpoint: () =>
      `/api/organizations/${orgIdRef.current}/work-orders/${workOrderId}`,
    method: "PATCH",
    queryKey: workOrderKeys.all(orgId ?? ""),
    optimisticQueryKey:
      orgId && workOrderId
        ? drawerDetailKeys.all(orgId, workOrderId)
        : undefined,
    invalidateKeys: branchId
      ? ([bayViewKeys.data(branchId)] as const)
      : undefined,
    onSuccess: () => {
      onRefresh();
    },
  });

  // ── Loading state (computed from mutation pending) ─────────────────

  const saving =
    assignMechanicMutation?.isPending ||
    assignCustomerMutation?.isPending ||
    patchWorkOrderMutation.isPending;

  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // ── Mechanic assignment ──

  async function assignMechanic(mechanicId: string, fullName?: string | null) {
    const orgIdCurrent = orgIdRef.current;
    if (!orgIdCurrent || !workOrderId) return;
    const prevWo = wo;

    // Optimistic: update drawer state immediately
    setWo((prev) => {
      if (!prev) return prev;
      if (!mechanicId) {
        return {
          ...prev,
          mechanic_id: null,
          mechanic: null,
        } as WorkOrderDetail;
      }
      return {
        ...prev,
        mechanic_id: mechanicId,
        mechanic: { id: mechanicId, full_name: fullName ?? null },
      } as WorkOrderDetail;
    });

    try {
      if (assignMechanicMutation) {
        await assignMechanicMutation.mutateAsync({
          woId: workOrderId,
          mechanicId,
        });
      } else {
        await patchWorkOrderMutation.mutateAsync({
          mechanic_id: mechanicId || null,
        });
      }
      onRefresh();
      toast.success(mechanicId ? "Mechanic assigned" : "Mechanic removed");
    } catch (err) {
      reportServerError("Unexpected error", err);
      if (prevWo) setWo(prevWo);
      toast.error(
        err instanceof Error ? err.message : "Failed to assign mechanic",
      );
    }
  }

  // ── Customer assignment ──

  async function assignCustomer(
    customerId: string | null,
    customerName?: string | null,
    customer?: Customer | null,
  ) {
    const orgIdCurrent = orgIdRef.current;
    if (!orgIdCurrent || !workOrderId) return;
    const prevWo = wo;

    setWo((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        customer_id: customerId,
        customer: customerId
          ? ({
              ...(prev.customer ?? {}),
              ...(customer ?? {}),
              id: customerId,
            } as WorkOrderDetail["customer"])
          : null,
      } as WorkOrderDetail;
    });

    try {
      if (assignCustomerMutation) {
        await assignCustomerMutation.mutateAsync({
          woId: workOrderId,
          customerId,
          customerName,
        });
      } else {
        await patchWorkOrderMutation.mutateAsync({
          customer_id: customerId,
        });
      }
      onRefresh();
      if (customerId) {
        toast.success("Customer assigned");
      }
    } catch (err) {
      reportServerError("Unexpected error", err);
      if (prevWo) setWo(prevWo);
      toast.error(
        err instanceof Error ? err.message : "Failed to assign customer",
      );
    }
  }

  // ── Computed ──

  const isDirty = showAddService || showAddPart;

  // ── Drawer close handlers ──

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isDirty) {
      setShowUnsavedWarning(true);
      return;
    }
    onOpenChange(nextOpen);
  }

  function handleSaveAndClose() {
    setShowAddPart(false);
    setShowAddService(false);
    setShowUnsavedWarning(false);
    onOpenChange(false);
  }

  function handleDiscard() {
    setShowAddPart(false);
    setShowAddService(false);
    setShowUnsavedWarning(false);
    onOpenChange(false);
  }

  // ── Aliases for backward compatibility ──

  const handleAddService = addService;
  const handleRemoveService = removeService;
  const handlePostServiceConfirm = handlePostServiceFormSubmit;

  // ── Return ──

  return {
    // Local state
    saving,
    isConfirming: confirmingServiceIds.size > 0,
    showUnsavedWarning,
    setShowUnsavedWarning,
    // Service state
    serviceSearch,
    setServiceSearch,
    showAddService,
    setShowAddService,
    addingServiceIds,
    confirmingServiceIds,
    // Part state
    partSearch,
    setPartSearch,
    showAddPart,
    setShowAddPart,
    addingPartIds,
    // Post-service form state
    showPostServiceForm,
    setShowPostServiceForm,
    postFormServices,
    setPostFormServices,
    postFormParts,
    setPostFormParts,
    // Status state
    confirmStatus,
    setConfirmStatus,
    statusNotes,
    setStatusNotes,
    // Invoice state
    creatingInvoice,
    setCreatingInvoice,
    invoicePublicToken,
    setInvoicePublicToken,
    // Handlers — service
    addService,
    handleAddService,
    removeService,
    handleRemoveService,
    handleServicePriceSave,
    handleServiceQtySave,
    handleServiceDiscountSave,
    // Handlers — part
    addPart,
    removePart,
    handlePartPriceSave,
    handlePartQtySave,
    handlePartDiscountSave,
    // Handlers — assignment
    assignMechanic,
    assignCustomer,
    // Handlers — status
    changeStatus,
    handleStatusConfirm,
    // Handlers — invoice / payment
    generateInvoice,
    handleReadyForPickup,
    handlePostServiceFormSubmit,
    handlePostServiceConfirm,
    handleCancelPostService,
    // Handlers — drawer
    handleOpenChange,
    handleSaveAndClose,
    handleDiscard,
    // Computed
    canCancel,
    canInvoice,
    isDirty,
    // Auto-focus for newly added items
    lastAddedServiceId,
    lastAddedPartId,
  };
}
