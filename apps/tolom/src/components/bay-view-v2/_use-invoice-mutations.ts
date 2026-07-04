"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useOrgMutation } from "@zuiio/query";
import { bayViewKeys, workOrderKeys } from "@/lib/queries/keys";
import type { ResolvedTransferBank } from "@/lib/payments/org-bank-accounts";
import {
  getWorkOrderParts,
  getWorkOrderServicesWithIntervals,
  savePostServiceData,
} from "@/lib/services/post-service-service";
import type { WorkOrderDetail } from "@/lib/types";
import { createInvoiceAndRecordPayment } from "./_payment-helpers";
import type { PaymentMethodFees } from "./_payment-fees";
import type { PostServiceFormData } from "./_schema";

// ─── Params ────────────────────────────────────────────────────────────

interface UseInvoiceMutationsParams {
  workOrderId: string | null;
  orgIdRef: React.MutableRefObject<string | null>;
  orgId: string | undefined;
  branchId: string | undefined;
  wo: WorkOrderDetail | null;
  setWo: React.Dispatch<React.SetStateAction<WorkOrderDetail | null>>;
  fetchWo: (silent?: boolean, orgIdOverride?: string) => Promise<void>;
  onRefresh: () => void;
  paymentMethodFees: PaymentMethodFees;
  transferBanks: ResolvedTransferBank[];
}

// ─── Hook ──────────────────────────────────────────────────────────────

export function useInvoiceMutations({
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
}: UseInvoiceMutationsParams) {
  // ── Invoice state ──

  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [invoicePublicToken, setInvoicePublicToken] = useState<string | null>(
    wo?.invoice_public_token ?? null,
  );

  useEffect(() => {
    setInvoicePublicToken(wo?.invoice_public_token ?? null);
  }, [wo?.invoice_public_token]);

  // ── Post-service form state ──

  const [showPostServiceForm, setShowPostServiceForm] = useState(false);
  const [postFormServices, setPostFormServices] = useState<
    Array<{
      id: string;
      service_name: string;
      service_catalog_id: string | null;
      catalog_interval_months: number | null;
      catalog_interval_km: number | null;
    }>
  >([]);
  const [postFormParts, setPostFormParts] = useState<
    Array<{
      id: string;
      part_name: string;
      part_number: string | null;
      quantity: number;
      unit_price: number;
      final_price: number;
    }>
  >([]);

  // ── Mutation hooks ──

  const createInvoiceMutation = useOrgMutation<
    { invoice_number: string; public_token: string },
    { work_order_id: string }
  >({
    endpoint: () => `/api/organizations/${orgIdRef.current}/invoices`,
    method: "POST",
    queryKey: workOrderKeys.all(orgId ?? ""),
    invalidateKeys: branchId
      ? ([bayViewKeys.data(branchId)] as const)
      : undefined,
  });

  const statusMutation = useOrgMutation<
    unknown,
    { status: string; notes?: string }
  >({
    endpoint: (vars) =>
      `/api/organizations/${orgIdRef.current}/work-orders/${workOrderId}`,
    method: "PATCH",
    queryKey: workOrderKeys.all(orgId ?? ""),
    invalidateKeys: branchId
      ? ([bayViewKeys.data(branchId)] as const)
      : undefined,
    onSuccess: (_data, _vars) => {
      fetchWo(true);
      onRefresh();
    },
  });

  // ── Computed ──

  const canInvoice: boolean =
    wo?.status === "Completed" || wo?.status === "Ready for Pickup";

  // ── Generate invoice ──

  async function generateInvoice() {
    const orgIdCurrent = orgIdRef.current;
    if (!orgIdCurrent || !workOrderId) return;
    setCreatingInvoice(true);
    try {
      const result = await createInvoiceMutation.mutateAsync({
        work_order_id: workOrderId,
      });
      toast.dismiss();
      toast.success(`Invoice ${result.invoice_number} created`);
      setInvoicePublicToken(result.public_token);
      window.open(`/invoice/${result.public_token}`, "_blank");
    } catch {
      toast.error("Failed to create invoice");
    } finally {
      setCreatingInvoice(false);
    }
  }

  // ── Ready for Pickup (opens post-service form) ──

  async function handleReadyForPickup() {
    if (workOrderId && wo?.vehicle_id) {
      setShowPostServiceForm(true);
      getWorkOrderServicesWithIntervals(workOrderId)
        .then(setPostFormServices)
        .catch(() => {});
      getWorkOrderParts(workOrderId)
        .then(setPostFormParts)
        .catch(() => {});
    } else {
      // Use status hook's changeStatus — but we can't call it directly.
      // The barrel orchestrates cross-hook calls; this path fires a status
      // update inlined here so the post-service flow stays self-contained.
      const orgIdCurrent = orgIdRef.current;
      if (!orgIdCurrent || !workOrderId) return;
      const prevWo = wo;
      setWo((prev) =>
        prev
          ? ({ ...prev, status: "Ready for Pickup" } as WorkOrderDetail)
          : prev,
      );

      try {
        await statusMutation.mutateAsync({ status: "Ready for Pickup" });
      } catch {
        if (prevWo) setWo(prevWo);
      }
    }
  }

  // ── Post-service form submit ──

  const handleCancelPostService = () => {
    setShowPostServiceForm(false);
    setPostFormServices([]);
    setPostFormParts([]);
  };

  async function handlePostServiceFormSubmit(data: PostServiceFormData) {
    if (!workOrderId || !wo?.vehicle_id) return;

    const prevWo = wo;

    setWo((prev) =>
      prev
        ? ({ ...prev, status: "Ready for Pickup" } as WorkOrderDetail)
        : prev,
    );
    setShowPostServiceForm(false);
    setPostFormServices([]);
    setPostFormParts([]);

    try {
      await savePostServiceData({
        workOrderId,
        vehicleId: wo.vehicle_id as string,
        odometerReading: data.odometerReading,
        recommendations: data.recommendations,
        mechanicNotes: data.mechanicNotes,
      });

      await statusMutation.mutateAsync({
        status: "Ready for Pickup",
        notes: data.mechanicNotes || undefined,
      });

      const orgIdCurrent = orgIdRef.current;
      const grandTotal =
        (prevWo?.services?.reduce(
          (s, svc) => s + Number(svc.final_price),
          0,
        ) ?? 0) +
        (prevWo?.parts?.reduce((s, p) => s + Number(p.final_price), 0) ??
          0);

      if (orgIdCurrent && grandTotal > 0) {
        try {
          await createInvoiceAndRecordPayment(
            orgIdCurrent,
            workOrderId,
            data.paymentMethod,
            paymentMethodFees[data.paymentMethod] ?? 0,
            transferBanks,
            data.transferBankId,
          );
        } catch (err) {
          toast.warning(
            err instanceof Error
              ? err.message
              : "Ready — but payment could not be recorded",
          );
        }
      }

      fetchWo(true);
      toast.dismiss();
      toast.success("Ready for Pickup — recommendations saved");
      onRefresh();
    } catch {
      if (prevWo) setWo(prevWo);
      toast.error("Failed to save post-service data");
    }
  }

  // ── Return ──

  return {
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
  };
}
