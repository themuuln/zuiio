"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ResolvedTransferBank } from "@/lib/payments/org-bank-accounts";
import {
  getWorkOrderParts,
  getWorkOrderServicesWithIntervals,
  savePostServiceData,
} from "@/lib/services/post-service-service";
import type { WorkOrderDetail } from "@/lib/types";
import { createInvoiceAndRecordPayment } from "./_helpers";
import type { PaymentMethodFees } from "./_payment-fees";
import type { PostServiceFormData } from "./_schema";

// ─── Params ────────────────────────────────────────────────────────────

interface UseInvoiceMutationsParams {
  workOrderId: string | null;
  orgIdRef: React.MutableRefObject<string | null>;
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

  // ── Computed ──

  const canInvoice: boolean =
    wo?.status === "Completed" || wo?.status === "Ready for Pickup";

  // ── Generate invoice ──

  async function generateInvoice() {
    const orgId = orgIdRef.current;
    if (!orgId || !workOrderId) return;
    setCreatingInvoice(true);
    try {
      const res = await fetch(`/api/organizations/${orgId}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ work_order_id: workOrderId }),
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message);
      } else {
        toast.dismiss();
        toast.success(`Invoice ${json.data.invoice_number} created`);
        setInvoicePublicToken(json.data.public_token);
        window.open(`/invoice/${json.data.public_token}`, "_blank");
      }
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
      const orgId = orgIdRef.current;
      if (!orgId || !workOrderId) return;
      const prevWo = wo;
      setWo((prev) =>
        prev
          ? ({ ...prev, status: "Ready for Pickup" } as WorkOrderDetail)
          : prev,
      );

      fetch(
        `/api/organizations/${orgId}/work-orders/${workOrderId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Ready for Pickup" }),
        },
      )
        .then((r) => r.json())
        .then((json) => {
          if (json.error) {
            if (prevWo) setWo(prevWo);
            toast.error(
              json.error.message ?? "Failed to update status",
            );
          } else {
            fetchWo(true);
            onRefresh();
          }
        })
        .catch(() => {
          if (prevWo) setWo(prevWo);
          toast.error("Failed to update status");
        });
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

    Promise.all([
      savePostServiceData({
        workOrderId,
        vehicleId: wo.vehicle_id as string,
        odometerReading: data.odometerReading,
        recommendations: data.recommendations,
        mechanicNotes: data.mechanicNotes,
      }),
      orgIdRef.current
        ? fetch(
            `/api/organizations/${orgIdRef.current}/work-orders/${workOrderId}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status: "Ready for Pickup",
                notes: data.mechanicNotes || undefined,
              }),
            },
          ).then((r) => r.json())
        : Promise.reject(new Error("No org ID")),
    ])
      .then(async ([_, statusJson]) => {
        if (statusJson.error) {
          if (prevWo) setWo(prevWo);
          toast.error(
            statusJson.error.message ?? "Failed to update status",
          );
          return;
        }

        const orgId = orgIdRef.current;
        const grandTotal =
          (prevWo?.services?.reduce(
            (s, svc) => s + Number(svc.final_price),
            0,
          ) ?? 0) +
          (prevWo?.parts?.reduce((s, p) => s + Number(p.final_price), 0) ??
            0);

        if (orgId && grandTotal > 0) {
          try {
            await createInvoiceAndRecordPayment(
              orgId,
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
      })
      .catch(() => {
        if (prevWo) setWo(prevWo);
        toast.error("Failed to save post-service data");
      });
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
