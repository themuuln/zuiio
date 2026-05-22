"use client";

import { AlertTriangle, ArrowLeft, Camera, FileText, Mail, Phone, Plus, Trash2, Wallet } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ExportButton } from "@/components/export-button";
import { MechanicSelect } from "@/components/mechanic-select";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { WorkOrderPart, WorkOrderService, WorkOrderStatus } from "@/lib/database.types";
import type { ExportColumn } from "@/lib/export";
import { useRouter } from "@/lib/i18n/navigation";
import { useCurrentOrg } from "@/lib/queries/use-organization";
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
import {
  useAttachments,
  useDeleteAttachment,
} from "@/lib/queries/use-work-order-attachments";
import WorkOrderPhotoUpload from "@/components/work-order-photo-upload";
import type { WorkOrderAttachment } from "@/lib/types";
import type { ServiceCatalog } from "@/lib/types";
import { cn, formatMNT } from "@/lib/utils";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { ContactCard } from "@/components/sidebar-tabs/contact-card";
import { RecentList } from "@/components/sidebar-tabs/recent-list";

const STATUSES = [
  "New",
  "Diagnosing",
  "In Progress",
  "Ready for Pickup",
  "Completed",
  "Cancelled",
] as const;

export default function WorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { push, back } = router;
  const woId = params.id as string;
  const t = useTranslations("workOrderDetail");

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

  const [existingInvoiceId, setExistingInvoiceId] = useState<string | null>(
    null,
  );
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const { data: orgData, isLoading: orgLoading, error: orgError } =
    useCurrentOrg();
  const orgId = orgData?.orgId;

  const {
    data: wo,
    isLoading: woLoading,
    error: woError,
    refetch: refetchWo,
  } = useWorkOrderDetail(orgId, woId);
  const { data: catalog = [] } = useServiceCatalog(orgId);
  const { data: mechanics = [] } = useMechanicsList(orgId);

  const { data: partPriceHistoryData } = usePartPriceHistory(
    orgId,
    newPart.part_name,
    wo?.vehicle?.make,
  );

  const updateStatus = useUpdateWorkOrderStatus(orgId);
  const assignMechanicMutation = useAssignMechanic(orgId);
  const addService = useAddService(orgId);
  const removeService = useRemoveService(orgId);
  const addPart = useAddPart(orgId);
  const removePart = useRemovePart(orgId);
  const createInvoice = useCreateInvoice(orgId);
  const { data: invoicePaymentsData } = useInvoicePayments(orgId, existingInvoiceId);
  const recordPayment = useRecordPayment(orgId);

  const { data: attachments = [] } = useAttachments(orgId, woId);
  const deleteAttachment = useDeleteAttachment(orgId, woId);

  const sidebar = useRightSidebar();

  const saving =
    updateStatus.isPending ||
    assignMechanicMutation.isPending ||
    addService.isPending ||
    removeService.isPending ||
    addPart.isPending ||
    removePart.isPending ||
    deleteAttachment.isPending;

  useEffect(() => {
    if (!orgLoading && !orgId && !orgError) {
      push(
        "/auth/select-organization?returnUrl=/dashboard/work-orders",
      );
    }
  }, [orgLoading, orgId, orgError, router]);

  useEffect(() => {
    if (
      partPriceHistoryData?.[0] &&
      newPart.unit_price === 0
    ) {
      setNewPart((part) => ({ ...part, unit_price: partPriceHistoryData[0] }));
    }
  }, [partPriceHistoryData, newPart.unit_price]);

  useEffect(() => {
    if (!wo) return;

    sidebar.setOpen(true);
    sidebar.setActiveTab("vehicle");

    sidebar.registerTab(
      "vehicle",
      "Vehicle",
      <ContactCard
        title="Vehicle"
        items={[
          { label: "Plate Number", value: wo.vehicle?.plate_number, copyable: true },
          { label: "Make / Model", value: [wo.vehicle?.make, wo.vehicle?.model].filter(Boolean).join(" ") },
          { label: "Year", value: wo.vehicle?.year?.toString() },
          { label: "VIN", value: wo.vehicle?.vin, copyable: true },
        ]}
      />,
    );

    sidebar.registerTab(
      "customer",
      "Customer",
      <ContactCard
        title="Customer"
        items={[
          { label: "Name", value: [wo.customer?.first_name, wo.customer?.last_name].filter(Boolean).join(" "), copyable: true },
          { label: "Phone", value: wo.customer?.phone, icon: Phone, copyable: true },
          { label: "Email", value: wo.customer?.email, icon: Mail, copyable: true },
        ]}
      />,
    );

    sidebar.registerTab(
      "timeline",
      "Timeline",
      <RecentList
        title="Status History"
        items={(wo.status_history ?? []).map((h) => ({
          id: h.id,
          primary: h.status,
          secondary: h.notes ?? undefined,
          timestamp: new Date(h.created_at).toLocaleString(),
        }))}
        emptyMessage="No status changes"
      />,
    );

    return () => {
      sidebar.unregisterTab("vehicle");
      sidebar.unregisterTab("customer");
      sidebar.unregisterTab("timeline");
      sidebar.setOpen(false);
    };
  }, [wo]);

  const serviceExportColumns: ExportColumn<WorkOrderService>[] = useMemo(
    () => [
      { key: "service_name", label: "Service" },
      { key: "quantity", label: "Qty" },
      { key: "unit_price", label: "Unit Price", format: "currency" },
      { key: "discount_amount", label: "Discount", format: "currency" },
      { key: "final_price", label: "Final Price", format: "currency" },
    ],
    [],
  );

  const partExportColumns: ExportColumn<WorkOrderPart>[] = useMemo(
    () => [
      { key: "part_name", label: "Part" },
      { key: "quantity", label: "Qty" },
      { key: "unit_price", label: "Unit Price", format: "currency" },
      { key: "final_price", label: "Final Price", format: "currency" },
    ],
    [],
  );

  const changeStatus = (newStatus: string) => {
    if (
      (newStatus === "Completed" || newStatus === "Cancelled") &&
      confirmStatus !== newStatus
    ) {
      setConfirmStatus(newStatus);
      setStatusNotes("");
      return;
    }

    updateStatus.mutate(
      { woId, status: newStatus, notes: statusNotes || undefined },
      {
        onSuccess: () => {
          setConfirmStatus(null);
          setStatusNotes("");
          toast.success(`Status changed to ${newStatus}`);
        },
      },
    );
  };

  const assignMechanic = (mechanicId: string) => {
    assignMechanicMutation.mutate({ woId, mechanicId });
  };

  const addServiceLine = async (svc: ServiceCatalog) => {
    if (!orgId || !woId) return;
    try {
      const prices = await fetchServicePriceHistory(
        orgId,
        svc.id,
        wo?.vehicle?.make,
        wo?.vehicle?.model,
      );
      addService.mutate({
        woId,
        body: {
          service_catalog_id: svc.id,
          service_name: svc.name,
          quantity: 1,
          unit_price: prices[0] ?? svc.default_price ?? 0,
        },
      });
    } catch {
      toast.error("Failed to add service");
    }
  };

  const addPartLine = () => {
    if (!orgId || !woId || !newPart.part_name.trim()) return;
    const unitPrice =
      newPart.unit_price || (partPriceHistoryData ?? [])[0] || 0;
    addPart.mutate(
      {
        woId,
        body: { ...newPart, unit_price: unitPrice },
      },
      {
        onSuccess: () => {
          setNewPart({ part_name: "", quantity: 1, unit_price: 0 });
          setShowAddPart(false);
        },
      },
    );
  };

  const generateInvoice = () => {
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

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !existingInvoiceId || paymentAmount <= 0) return;
    recordPayment.mutate(
      {
        invoiceId: existingInvoiceId,
        amount: paymentAmount,
        method: paymentMethod,
        reference: paymentReference || undefined,
        notes: paymentNotes || undefined,
      },
      {
        onSuccess: () => {
          setShowPaymentDialog(false);
          setPaymentAmount(0);
          setPaymentMethod("cash");
          setPaymentReference("");
          setPaymentNotes("");
          toast.success("Payment recorded");
        },
      },
    );
  };

  const loading = orgLoading || woLoading;

  let error: string | null = null;
  if (orgError) {
    error = orgError.message;
  } else if (!orgLoading && !orgId) {
    error = "No organization found";
  } else if (woError) {
    error = woError.message;
  }

  if (loading) {
    return (
      <div className="tablet-touch flex flex-col gap-6">
        <Skeleton className="h-8 w-32" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !wo) {
    return (
      <div className="tablet-touch flex flex-col gap-6">
        <Button variant="ghost" onClick={() => back()} className="w-fit">
          <ArrowLeft className="size-4" /> Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-muted-foreground">
              {error ?? t("workOrderNotFound")}
            </p>
            <Button onClick={() => refetchWo()} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const servicesTotal = (wo.services ?? []).reduce(
    (sum, s) => sum + Number(s.final_price),
    0,
  );
  const partsTotal = (wo.parts ?? []).reduce(
    (sum, p) => sum + Number(p.final_price),
    0,
  );
  const _grandTotal = servicesTotal + partsTotal;

  const payments = invoicePaymentsData?.payments ?? [];
  const totalPaid = invoicePaymentsData?.total_paid ?? 0;
  const balanceDue = invoicePaymentsData?.balance_due ?? _grandTotal;
  const invoiceStatus = invoicePaymentsData?.status ?? "";

  const servicesCost = (wo.services ?? []).reduce(
    (sum, s) => sum + Number(s.unit_cost ?? 0) * s.quantity, 0);
  const partsCost = (wo.parts ?? []).reduce(
    (sum, p) => sum + Number(p.unit_cost ?? 0) * p.quantity, 0);
  const totalCost = servicesCost + partsCost;
  const grossProfit = (servicesTotal + partsTotal) - totalCost;
  const marginPercent = (servicesTotal + partsTotal) > 0
    ? (grossProfit / (servicesTotal + partsTotal)) * 100
    : 0;

    return (
      <div className="tablet-touch flex max-w-5xl flex-col gap-6 tablet:gap-6 tablet:px-4">
      {/* Header */}
      <div className="flex items-center gap-4 tablet:gap-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => back()}
          aria-label="Back"
          className="tablet:size-12"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">
              WO #{wo.id.slice(0, 8)}
            </h1>
            <StatusBadge status={wo.status as unknown as WorkOrderStatus} />
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(wo.created_at).toLocaleDateString()}
            {wo.customer
              ? ` \u00B7 ${wo.customer.first_name} ${wo.customer.last_name ?? ""}`
              : ""}
            {wo.vehicle ? ` \u00B7 ${wo.vehicle.plate_number}` : ""}
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Status Change */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("status")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map((s) => (
              <Button
                key={s}
                variant={wo.status === s ? "default" : "outline"}
                size="sm"
                onClick={() => changeStatus(s)}
                disabled={saving || wo.status === s}
                className="min-h-[var(--ui-touch-target)]"
              >
                {s}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Change Confirmation Dialog */}
      {confirmStatus && (
        <Card className="border-amber-200/50 bg-amber-50/30 dark:border-amber-800/30 dark:bg-amber-950/10">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-500" />
                <div>
                  <p className="font-medium text-sm">
                    {t("changeStatusTo", { status: confirmStatus })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {confirmStatus === "Completed"
                      ? t("markComplete")
                      : t("markCancelled")}
                  </p>
                </div>
              </div>
              <Input
                placeholder={t("addNotesOptional")}
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                className="h-11"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setConfirmStatus(null);
                    setStatusNotes("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant={
                    confirmStatus === "Cancelled" ? "destructive" : "default"
                  }
                  disabled={saving}
                  onClick={() => changeStatus(confirmStatus)}
                >
                  {saving
                    ? t("updating")
                    : t("confirm", { status: confirmStatus })}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer & Vehicle Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("customerAndVehicle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {wo.customer && (
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">
                  {wo.customer.first_name} {wo.customer.last_name ?? ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {wo.customer.phone || wo.customer.email || "\u2014"}
                </p>
              </div>
            </div>
          )}
          {wo.vehicle && (
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">{wo.vehicle.plate_number}</p>
                <p className="text-xs text-muted-foreground">
                  {[wo.vehicle.make, wo.vehicle.model, wo.vehicle.year]
                    .filter(Boolean)
                    .join(" ") || "\u2014"}
                </p>
              </div>
            </div>
          )}
          {!wo.customer && !wo.vehicle && (
            <p className="text-sm text-muted-foreground">
              {t("noCustomerOrVehicle")}
            </p>
          )}

          {/* Complaint & Diagnosis Label */}
          {(wo.complaint || (wo as any).diagnosis_label) && (
            <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
              {wo.complaint && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">
                    {t("complaint")}
                  </p>
                  <p className="text-sm">{wo.complaint}</p>
                </div>
              )}
              {(wo as any).diagnosis_label && (
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t("diagnosis")}
                  </p>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: (wo as any).diagnosis_label?.color ? `${(wo as any).diagnosis_label.color}20` : undefined,
                      color: (wo as any).diagnosis_label.color ?? undefined,
                    }}
                  >
                    {(wo as any).diagnosis_label.color && (
                      <span
                        className="size-2 rounded-full"
                        style={{
                          backgroundColor: (wo as any).diagnosis_label.color,
                        }}
                      />
                    )}
                    {(wo as any).diagnosis_label.name_mn ??
                      (wo as any).diagnosis_label.name}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mechanic Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("mechanic")}</CardTitle>
        </CardHeader>
        <CardContent>
          <MechanicSelect
            value={wo.mechanic_id ?? ""}
            onChange={assignMechanic}
            mechanics={mechanics}
            disabled={saving}
            showJobCount
          />
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t("services")}</CardTitle>
          <div className="flex items-center gap-2">
            <ExportButton
              data={wo.services ?? []}
              columns={serviceExportColumns}
              filename={`wo-${woId.slice(0, 8)}-services.xlsx`}
              sheetName="Services"
              label="Export Services"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddService(!showAddService)}
            >
              <Plus className="size-4" /> {t("add")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {showAddService && (
            <div className="flex flex-col gap-2 mb-2">
              <Input
                placeholder="Search services..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="h-11"
              />
              {serviceSearch.trim() && (
                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto border rounded-lg">
                  {catalog.flatMap((s) =>
                    s.name
                      .toLowerCase()
                      .includes(serviceSearch.toLowerCase())
                      ? [
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              addServiceLine(s);
                              setShowAddService(false);
                              setServiceSearch("");
                            }}
                            data-slot="touch-target"
                            className="flex items-center justify-between p-3 text-left hover:bg-muted transition-colors"
                          >
                            <span className="text-sm font-medium">{s.name}</span>
                            <span className="text-sm tabular-nums">
                              {formatMNT(s.default_price ?? 0)}
                            </span>
                          </button>,
                        ]
                      : [],
                  )}
                </div>
              )}
            </div>
          )}
          {(wo.services ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t("noServicesAdded")}
            </p>
          ) : (
            (wo.services ?? []).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {s.service_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.quantity} x {formatMNT(Number(s.unit_price))}
                    {Number(s.discount_amount) > 0
                      ? ` (-${formatMNT(Number(s.discount_amount))})`
                      : ""}
                  </p>
                  {s.last_sold_price && (
                    <p className="text-xs text-amber-600">
                      {t("lastSoldShort", {
                        price: formatMNT(Number(s.last_sold_price)),
                      })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-medium tabular-nums">
                    {formatMNT(Number(s.final_price))}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11 text-destructive"
                    onClick={() =>
                      setDeleteConfirm({
                        type: "service",
                        id: s.id,
                        name: s.service_name,
                      })
                    }
                    aria-label="Remove service"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Parts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t("parts")}</CardTitle>
          <div className="flex items-center gap-2">
            <ExportButton
              data={wo.parts ?? []}
              columns={partExportColumns}
              filename={`wo-${woId.slice(0, 8)}-parts.xlsx`}
              sheetName="Parts"
              label="Export Parts"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddPart(!showAddPart)}
            >
              <Plus className="size-4" /> {t("add")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {showAddPart && (
            <div className="flex items-end gap-2 mb-2 flex-wrap">
              <div className="flex-1 min-w-[160px]">
                <Input
                  placeholder={t("partName")}
                  value={newPart.part_name}
                  onChange={(e) =>
                    setNewPart((p) => ({ ...p, part_name: e.target.value }))
                  }
                  className="h-11"
                />
              </div>
              <div className="w-20">
                <Input
                  type="number"
                  placeholder={t("qty")}
                  value={newPart.quantity}
                  onChange={(e) =>
                    setNewPart((p) => ({
                      ...p,
                      quantity: Number(e.target.value) || 1,
                    }))
                  }
                  className="h-11"
                />
              </div>
              <div className="w-28">
                <Input
                  type="number"
                  placeholder={t("unitPrice")}
                  value={newPart.unit_price || ""}
                  onChange={(e) =>
                    setNewPart((p) => ({
                      ...p,
                      unit_price: Number(e.target.value) || 0,
                    }))
                  }
                  className="h-11"
                />
                {(partPriceHistoryData ?? []).length > 0 && (
                  <p className="mt-1 text-[11px] text-amber-600">
                    {t("lastPrices", {
                      prices: (partPriceHistoryData ?? [])
                        .map((price) => formatMNT(price))
                        .join(" | "),
                    })}
                  </p>
                )}
              </div>
              <Button
                size="lg"
                onClick={addPartLine}
                disabled={!newPart.part_name.trim()}
              >
                {t("add")}
              </Button>
            </div>
          )}
          {(wo.parts ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t("noPartsAdded")}
            </p>
          ) : (
            (wo.parts ?? []).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium">{p.part_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.quantity} x {formatMNT(Number(p.unit_price))}
                  </p>
                  {p.last_sold_price && (
                    <p className="text-xs text-amber-600">
                      {t("lastSoldShort", {
                        price: formatMNT(Number(p.last_sold_price)),
                      })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium tabular-nums">
                    {formatMNT(Number(p.final_price))}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11 text-destructive"
                    onClick={() =>
                      setDeleteConfirm({
                        type: "part",
                        id: p.id,
                        name: p.part_name,
                      })
                    }
                    aria-label="Remove part"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
                <div>
                  <p className="font-medium text-sm">
                    {t("removeConfirm", { item: deleteConfirm.type })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>{deleteConfirm.name}</strong> will be removed from
                    this work order. This can be undone by re-adding it.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirm(null)}
                >
                  {t("keep")}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (deleteConfirm.type === "service") {
                      removeService.mutate(
                        { woId, serviceId: deleteConfirm.id },
                        {
                          onSuccess: () => {
                            toast.success("Service removed");
                            setDeleteConfirm(null);
                          },
                        },
                      );
                    } else {
                      removePart.mutate(
                        { woId, partId: deleteConfirm.id },
                        {
                          onSuccess: () => {
                            toast.success("Part removed");
                            setDeleteConfirm(null);
                          },
                        },
                      );
                    }
                  }}
                >
                  {t("remove")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status History */}
      {wo.status_history && wo.status_history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("statusHistory")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {wo.status_history.map((h, i) => (
                <div key={h.id} className="flex items-center gap-3 text-sm">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "size-2.5 rounded-full",
                        i === 0 ? "bg-primary" : "bg-muted-foreground/30",
                      )}
                    />
                    {i < (wo.status_history?.length ?? 0) - 1 && (
                      <div className="w-px h-4 bg-border" />
                    )}
                  </div>
                  <div>
                    <StatusBadge status={h.status as unknown as WorkOrderStatus} />
                    <span className="ml-2 text-xs text-muted-foreground">
                      {new Date(h.created_at).toLocaleString()}
                    </span>
                    {h.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {h.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photos & Documents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="size-4" />
            {t("photos")}
          </CardTitle>
          <WorkOrderPhotoUpload orgId={orgId} workOrderId={woId} />
        </CardHeader>
        <CardContent>
          {attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t("noPhotos")}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {attachments.map((att: WorkOrderAttachment) => (
                <div
                  key={att.id}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                >
                  {att.file_type === "photo" ? (
                    <a
                      href={att.public_url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block size-full"
                    >
                      <img
                        src={att.public_url ?? ""}
                        alt={att.file_name}
                        className="size-full object-cover"
                      />
                    </a>
                  ) : (
                    <a
                      href={att.public_url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex size-full flex-col items-center justify-center gap-1 p-2"
                    >
                      <FileText className="size-8 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground text-center leading-tight line-clamp-2">
                        {att.file_name}
                      </span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Remove this photo?")) {
                        deleteAttachment.mutate(att.id);
                      }
                    }}
                    className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-background/80 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
                    aria-label="Remove photo"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Generation */}
      {(wo.status === "Completed" || wo.status === "Ready for Pickup") && (
        <Card className="border-green-200/50 bg-green-50/30 dark:border-green-800/30 dark:bg-green-950/10">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 size-5 shrink-0 text-green-600" />
                <div>
                  <p className="font-medium text-sm">{t("invoiceReady")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {existingInvoiceId
                      ? t("invoiceReadyDesc")
                      : t("generateInvoiceDesc")}
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                onClick={generateInvoice}
                disabled={createInvoice.isPending}
                className="shrink-0"
              >
                <FileText className="size-4" />
                {createInvoice.isPending
                  ? t("generating")
                  : existingInvoiceId
                    ? t("viewInvoice")
                    : t("generateInvoice")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Record Payment */}
      {existingInvoiceId && (
        <Card className="border-green-200/50 bg-green-50/30 dark:border-green-800/30 dark:bg-green-950/10">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="size-5 text-green-600" />
                <p className="font-medium text-sm">Payment Status</p>
              </div>
              <Badge variant={invoiceStatus === "paid" ? "default" : invoiceStatus === "partial" ? "secondary" : "outline"}>
                {invoiceStatus || "pending"}
              </Badge>
            </div>

            {/* Payment history list */}
            {payments.length > 0 && (
              <div className="space-y-1.5">
                {payments.map((p: { id: string; method: string; paid_at: string; amount: number; reference?: string | null }) => (
                  <div key={p.id} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {p.method} · {new Date(p.paid_at).toLocaleDateString()}
                      {p.reference ? ` (${p.reference})` : ""}
                    </span>
                    <span className="font-medium">{formatMNT(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between text-sm border-t pt-2">
              <span>Total Paid</span>
              <span className="font-medium">{formatMNT(totalPaid)}</span>
            </div>
            {balanceDue > 0 && (
              <div className="flex justify-between text-sm">
                <span>Balance Due</span>
                <span className="font-medium text-destructive">{formatMNT(balanceDue)}</span>
              </div>
            )}

            {balanceDue > 0 && (
              <Button
                onClick={() => {
                  setPaymentAmount(balanceDue);
                  setShowPaymentDialog(true);
                }}
                size="sm"
                className="w-full"
              >
                <Wallet className="size-4" /> Record Payment
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Totals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("totals")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("services")}</span>
              <span className="font-medium tabular-nums">
                {formatMNT(servicesTotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("parts")}</span>
              <span className="font-medium tabular-nums">
                {formatMNT(partsTotal)}
              </span>
            </div>
            {Number(wo.discount_total) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discounts</span>
                <span className="font-medium tabular-nums text-destructive">
                  -{formatMNT(Number(wo.discount_total))}
                </span>
              </div>
            )}
            <hr className="border-border" />
            <div className="flex justify-between text-lg font-semibold">
              <span>{t("grandTotal")}</span>
              <span className="tabular-nums">
                {formatMNT(Number(wo.total))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profit / Cost Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profit &amp; Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Services Cost</span>
              <span className="font-medium tabular-nums">
                {formatMNT(servicesCost)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Parts Cost</span>
              <span className="font-medium tabular-nums">
                {formatMNT(partsCost)}
              </span>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Revenue</span>
              <span className="font-medium tabular-nums">
                {formatMNT(servicesTotal + partsTotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Cost</span>
              <span className="font-medium tabular-nums">
                {formatMNT(totalCost)}
              </span>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between text-base font-semibold">
              <span className={grossProfit >= 0 ? "text-emerald-600" : "text-destructive"}>
                {grossProfit >= 0 ? "Gross Profit" : "Loss"}
              </span>
              <span className={cn("tabular-nums", grossProfit >= 0 ? "text-emerald-600" : "text-destructive")}>
                {formatMNT(grossProfit)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Margin</span>
              <span className={cn("font-medium tabular-nums", marginPercent >= 0 ? "text-emerald-600" : "text-destructive")}>
                {marginPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={paymentAmount || ""}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                min={1}
                max={balanceDue}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Payment Method</Label>
              <select
                id="method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="flex h-11 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference (optional)</Label>
              <Input
                id="reference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Transaction ID / card last 4"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Any notes"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={recordPayment.isPending}>
                {recordPayment.isPending ? "Recording..." : "Record Payment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
