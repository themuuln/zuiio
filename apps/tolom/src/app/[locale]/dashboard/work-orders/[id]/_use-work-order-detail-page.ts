"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useRouter } from "@/lib/i18n/navigation";
import { workOrderKeys } from "@/lib/queries/keys";
import { usePartsCatalog } from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useLastVisitData } from "@/lib/queries/use-price-memory";
import {
  useRefundList,
  useStoreCreditBalance,
} from "@/lib/queries/use-refunds";
import {
  useAttachments,
  useDeleteAttachment,
} from "@/lib/queries/use-work-order-attachments";
import {
  fetchServicePriceHistory,
  useAddPart,
  useAddService,
  useAssignMechanic,
  useCreateInvoice,
  useInvoicePayments,
  useMechanicsList,
  usePartPriceHistory,
  useRecordPayment,
  useRemovePart,
  useRemoveService,
  useServiceCatalog,
  useUpdateWorkOrderStatus,
  useWorkOrderDetail,
} from "@/lib/queries/use-work-order-detail";
import { reportServerError } from "@/lib/sentry-report-server";
import type { WorkOrderDetail } from "@/lib/types";

export const STATUSES = [
  "New",
  "Diagnosing",
  "In Progress",
  "Ready for Pickup",
  "Completed",
  "Cancelled",
] as const;

const paymentSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  method: z.string().min(1, "Payment method is required"),
  reference: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;

export function useWorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { push, back } = router;
  const woId = params.id as string;
  const t = useTranslations("workOrderDetail") as (key: string, values?: Record<string, string | number>) => string;
  const queryClient = useQueryClient();

  // ── Local state ──
  const [serviceSearch, setServiceSearch] = useState("");
  const [showAddService, setShowAddService] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "service" | "part";
    id: string;
    name: string;
  } | null>(null);
  const [newPart, setNewPart] = useState({
    part_name: "",
    quantity: 1,
    unit_price: 0,
  });
  const [showAddPart, setShowAddPart] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);
  const [statusNotes, setStatusNotes] = useState("");
  const [lossReasonText, setLossReasonText] = useState("");
  const [existingInvoiceId, setExistingInvoiceId] = useState<string | null>(
    null,
  );
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [receiptRefund, setReceiptRefund] = useState<{
    id: string;
    amount: number;
    method: string;
    reason: string | null;
    reference: string | null;
    notes: string | null;
    refunded_at: string;
  } | null>(null);
  const [showRepeatDialog, setShowRepeatDialog] = useState(false);

  // ── Queries ──
  const {
    data: orgData,
    isPending: orgLoading,
    error: orgError,
  } = useCurrentOrg();
  const orgId = orgData?.orgId;
  const orgName = orgData?.orgName;

  const {
    data: wo,
    isPending: woLoading,
    error: woError,
    refetch: refetchWo,
  } = useWorkOrderDetail(orgId, woId);

  const { data: catalog = [] } = useServiceCatalog(orgId);
  const { data: partsCatalog = [] } = usePartsCatalog(orgId);
  const { data: mechanics = [] } = useMechanicsList(orgId);
  const { data: partPriceHistoryData } = usePartPriceHistory(
    orgId,
    newPart.part_name,
    wo?.vehicle?.make,
  );
  const { data: invoicePaymentsData } = useInvoicePayments(
    orgId,
    existingInvoiceId,
  );
  const { data: invoiceRefundsData } = useRefundList(orgId);
  const { data: storeCreditBalance = 0 } = useStoreCreditBalance(
    orgId,
    wo?.customer_id ?? undefined,
  );
  const { data: attachments = [] } = useAttachments(orgId, woId);
  const { data: lastVisit } = useLastVisitData(
    orgId,
    wo?.vehicle_id ?? undefined,
  );

  // ── Mutations ──
  const updateStatus = useUpdateWorkOrderStatus(orgId);
  const assignMechanicMutation = useAssignMechanic(orgId);
  const addService = useAddService(orgId);
  const removeService = useRemoveService(orgId);
  const addPart = useAddPart(orgId);
  const removePart = useRemovePart(orgId);
  const createInvoice = useCreateInvoice(orgId);
  const recordPayment = useRecordPayment(orgId);
  const deleteAttachment = useDeleteAttachment(orgId, woId);

  const detailKey = workOrderKeys.detail(orgId ?? "", woId);

  const saving =
    updateStatus.isPending ||
    assignMechanicMutation.isPending ||
    addService.isPending ||
    removeService.isPending ||
    addPart.isPending ||
    removePart.isPending ||
    deleteAttachment.isPending;

  // ── Derived data ──
  const servicesTotal = (wo?.services ?? []).reduce(
    (sum, s) => sum + Number(s.final_price),
    0,
  );
  const partsTotal = (wo?.parts ?? []).reduce(
    (sum, p) => sum + Number(p.final_price),
    0,
  );
  const payments = invoicePaymentsData?.payments ?? [];
  const totalPaid = invoicePaymentsData?.total_paid ?? 0;
  const balanceDue =
    invoicePaymentsData?.balance_due ?? servicesTotal + partsTotal;
  const invoiceStatus = invoicePaymentsData?.status ?? "";

  const invoiceRefunds = (invoiceRefundsData ?? []).filter(
    (r) => r.invoice_id === existingInvoiceId && r.status === "completed",
  );
  const totalRefunded = invoiceRefunds.reduce(
    (sum, r) => sum + Number(r.amount),
    0,
  );
  const maxRefundable = totalPaid - totalRefunded;

  const servicesCost = (wo?.services ?? []).reduce(
    (sum, s) => sum + Number(s.unit_cost ?? 0) * s.quantity,
    0,
  );
  const partsCost = (wo?.parts ?? []).reduce(
    (sum, p) => sum + Number(p.unit_cost ?? 0) * p.quantity,
    0,
  );
  const totalCost = servicesCost + partsCost;
  const grossProfit = servicesTotal + partsTotal - totalCost;
  const marginPercent =
    servicesTotal + partsTotal > 0
      ? (grossProfit / (servicesTotal + partsTotal)) * 100
      : 0;

  const loading = orgLoading || woLoading;

  let error: string | null = null;
  if (orgError) {
    error = orgError.message;
  } else if (!orgLoading && !orgId) {
    error = t("noOrganization");
  } else if (woError) {
    error = woError.message;
  }

  // ── Side effects ──
  useEffect(() => {
    if (!orgLoading && !orgId && !orgError) {
      push("/auth/select-organization?returnUrl=/dashboard/work-orders");
    }
  }, [orgLoading, orgId, orgError, push]);

  useEffect(() => {
    if (partPriceHistoryData?.[0] && newPart.unit_price === 0) {
      setNewPart((prev) => ({
        ...prev,
        unit_price: partPriceHistoryData[0],
      }));
    }
  }, [partPriceHistoryData, newPart.unit_price]);

  // ── Handlers ──
  const handleChangeStatus = (newStatus: string, lossReason?: string) => {
    if (
      (newStatus === "Completed" || newStatus === "Cancelled") &&
      confirmStatus !== newStatus
    ) {
      setConfirmStatus(newStatus);
      setStatusNotes("");
      setLossReasonText("");
      return;
    }
    setConfirmStatus(null);
    setStatusNotes("");
    setLossReasonText("");
    updateStatus.mutate({
      woId,
      status: newStatus,
      notes: statusNotes || undefined,
      loss_reason: lossReason || undefined,
    });
  };

  const handleAssignMechanic = (mechanicId: string) => {
    assignMechanicMutation.mutate({ woId, mechanicId });
  };

  const handleAddService = async (svc: {
    id: string;
    name: string;
    default_price?: number;
  }) => {
    if (!orgId || !woId) return;
    let unitPrice = svc.default_price ?? 0;
    try {
      const prices = await fetchServicePriceHistory(
        orgId,
        svc.id,
        wo?.vehicle?.make,
        wo?.vehicle?.model,
      );
      unitPrice = prices[0] ?? svc.default_price ?? 0;
    } catch (error) {
      reportServerError("Unexpected error", error);
      // fallback
    }
    const prev = queryClient.getQueryData<WorkOrderDetail>(detailKey);
    const tempId = `temp-${Date.now()}`;
    queryClient.setQueryData<WorkOrderDetail>(detailKey, (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        services: [
          ...(prev.services ?? []),
          {
            id: tempId,
            service_catalog_id: svc.id,
            service_name: svc.name,
            quantity: 1,
            unit_price: unitPrice,
            final_price: unitPrice,
            discount_amount: 0,
            discount_percentage: 0,
            unit_cost: 0,
            last_sold_price: null,
            notes: null,
            description: null,
            mechanic_id: null,
            work_order_id: woId,
            organization_id: orgId,
            created_by: null,
            created_at: new Date().toISOString(),
          } as WorkOrderDetail["services"][number],
        ],
      };
    });
    addService.mutate(
      {
        woId,
        body: {
          service_catalog_id: svc.id,
          service_name: svc.name,
          quantity: 1,
          unit_price: unitPrice,
        },
      },
      {
        onError: () => {
          if (prev) {
            queryClient.setQueryData<WorkOrderDetail>(detailKey, prev);
          }
        },
      },
    );
  };

  const handleAddPart = () => {
    if (!orgId || !woId || !newPart.part_name.trim()) return;
    const unitPrice =
      newPart.unit_price || (partPriceHistoryData ?? [])[0] || 0;
    const prev = queryClient.getQueryData<WorkOrderDetail>(detailKey);
    const tempId = `temp-${Date.now()}`;
    queryClient.setQueryData<WorkOrderDetail>(detailKey, (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        parts: [
          ...(prev.parts ?? []),
          {
            id: tempId,
            part_name: newPart.part_name.trim(),
            quantity: newPart.quantity,
            unit_price: unitPrice,
            final_price: unitPrice * newPart.quantity,
            unit_cost: 0,
            discount_amount: 0,
            discount_percentage: 0,
            last_sold_price: null,
            notes: null,
            part_number: null,
            part_id: null,
            work_order_id: woId,
            organization_id: orgId,
            created_by: null,
            created_at: new Date().toISOString(),
          } as WorkOrderDetail["parts"][number],
        ],
      };
    });
    addPart.mutate(
      {
        woId,
        body: {
          part_name: newPart.part_name.trim(),
          quantity: newPart.quantity,
          unit_price: unitPrice,
        },
      },
      {
        onSuccess: () => {
          setNewPart({ part_name: "", quantity: 1, unit_price: 0 });
          setShowAddPart(false);
        },
        onError: () => {
          if (prev) {
            queryClient.setQueryData<WorkOrderDetail>(detailKey, prev);
          }
        },
      },
    );
  };

  const handleRemoveLine = (type: "service" | "part", id: string) => {
    const prev = queryClient.getQueryData<WorkOrderDetail>(detailKey);
    if (type === "service") {
      queryClient.setQueryData<WorkOrderDetail>(detailKey, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          services: (prev.services ?? []).filter((s) => s.id !== id),
        };
      });
      removeService.mutate(
        { woId, serviceId: id },
        {
          onError: () => {
            if (prev) {
              queryClient.setQueryData<WorkOrderDetail>(detailKey, prev);
            }
          },
        },
      );
      queryClient.setQueryData<WorkOrderDetail>(detailKey, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          parts: (prev.parts ?? []).filter((p) => p.id !== id),
        };
      });
      removePart.mutate(
        { woId, partId: id },
        {
          onError: () => {
            if (prev) {
              queryClient.setQueryData<WorkOrderDetail>(detailKey, prev);
            }
          },
        },
      );
    }
  };

  const handleRepeatFromLastVisit = async () => {
    if (!orgId || !woId || !lastVisit) return;
    setShowRepeatDialog(false);
    const svcNames = lastVisit.services.map((s) => s.service_name);
    const partNames = lastVisit.parts.map((p) => p.part_name);
    let hasError = false;
    for (const svc of lastVisit.services) {
      try {
        await addService.mutateAsync({
          woId,
          body: {
            service_catalog_id: svc.service_catalog_id ?? "",
            service_name: svc.service_name,
            quantity: svc.quantity,
            unit_price: svc.unit_price,
          },
        });
      } catch (error) {
        reportServerError("Unexpected error", error);
        hasError = true;
      }
    }
    for (const part of lastVisit.parts) {
      try {
        await addPart.mutateAsync({
          woId,
          body: {
            part_name: part.part_name,
            quantity: part.quantity,
            unit_price: part.unit_price,
          },
        });
      } catch (error) {
        reportServerError("Unexpected error", error);
        hasError = true;
      }
    }
    if (hasError) {
      toast.warning(t("repeatPartialWarning"));
    } else {
      toast.success(
        t("repeatSuccess", {
          services: svcNames.length,
          parts: partNames.length,
        }),
      );
    }
  };

  const handleGenerateInvoice = () => {
    if (!orgId || !woId) return;
    createInvoice.mutate(
      { woId },
      {
        onSuccess: (data) => {
          setExistingInvoiceId(data.id);
          push(`/invoice/${data.public_token}`);
        },
      },
    );
  };

  const handlePaymentSubmit = async (data: PaymentFormValues) => {
    if (!orgId || !existingInvoiceId) {
      toast.error(t("invalidPaymentAmount"));
      return;
    }
    recordPayment.mutate(
      {
        invoiceId: existingInvoiceId,
        amount: data.amount,
        method: data.method,
        reference: data.reference || undefined,
        notes: data.notes || undefined,
      },
      {
        onSuccess: () => {
          setShowPaymentDialog(false);
          toast.success(t("paymentRecorded"));
        },
        onError: (err: Error) => {
          toast.error(err.message || t("failedToRecordPayment"));
        },
      },
    );
  };

  const paymentForm = {
    schema: paymentSchema,
    defaultValues: {
      amount: 0,
      method: "cash" as const,
      reference: "",
      notes: "",
    },
  };

  // ── Export columns ──
  const serviceExportColumns = useMemo(
    () => [
      { key: "service_name" as const, label: t("service") },
      { key: "quantity" as const, label: t("qty") },
      {
        key: "unit_price" as const,
        label: t("unitPrice"),
        format: "currency" as const,
      },
      {
        key: "discount_amount" as const,
        label: t("discount"),
        format: "currency" as const,
      },
      {
        key: "final_price" as const,
        label: t("finalPrice"),
        format: "currency" as const,
      },
    ],
    [t],
  );

  const partExportColumns = useMemo(
    () => [
      { key: "part_name" as const, label: t("part") },
      { key: "quantity" as const, label: t("qty") },
      {
        key: "unit_price" as const,
        label: t("unitPrice"),
        format: "currency" as const,
      },
      {
        key: "final_price" as const,
        label: t("finalPrice"),
        format: "currency" as const,
      },
    ],
    [t],
  );

  return {
    // Data
    orgId,
    orgName,
    woId,
    wo,
    catalog,
    partsCatalog,
    mechanics,
    payments,
    attachments,
    lastVisit,
    storeCreditBalance,
    invoicePaymentsData,
    invoiceRefundsData,
    partPriceHistoryData,

    // Derived
    servicesTotal,
    partsTotal,
    totalPaid,
    balanceDue,
    invoiceStatus,
    invoiceRefunds,
    totalRefunded,
    maxRefundable,
    servicesCost,
    partsCost,
    totalCost,
    grossProfit,
    marginPercent,

    // State
    serviceSearch,
    showAddService,
    deleteConfirm,
    newPart,
    showAddPart,
    confirmStatus,
    statusNotes,
    lossReasonText,
    existingInvoiceId,
    showPaymentDialog,
    showRefundDialog,
    receiptRefund,
    showRepeatDialog,
    saving,
    loading,
    error,

    // Setters
    setServiceSearch,
    setShowAddService,
    setDeleteConfirm,
    setNewPart,
    setShowAddPart,
    setConfirmStatus,
    setStatusNotes,
    setLossReasonText,
    setExistingInvoiceId,
    setShowPaymentDialog,
    setShowRefundDialog,
    setReceiptRefund,
    setShowRepeatDialog,

    // Handlers
    handleChangeStatus,
    handleAssignMechanic,
    handleAddService,
    handleAddPart,
    handleRemoveLine,
    handleRepeatFromLastVisit,
    handleGenerateInvoice,
    handlePaymentSubmit,
    refetchWo,
    back,

    // Meta
    t,
    paymentForm,
    serviceExportColumns,
    partExportColumns,
    detailKey,
    queryClient,
    createInvoice,
    recordPayment,
    deleteAttachment,
  };
}
