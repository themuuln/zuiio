"use client";

import { AlertTriangle, ArrowLeft, FileText, Plus, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/breadcrumb";
import { ExportButton } from "@/components/export-button";
import { MechanicSelect } from "@/components/mechanic-select";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  useMechanicsList,
  usePartPriceHistory,
  useRemovePart,
  useRemoveService,
  useServiceCatalog,
  useUpdateWorkOrderStatus,
  useWorkOrderDetail,
} from "@/lib/queries/use-work-order-detail";
import type { ServiceCatalog } from "@/lib/types";
import { cn, formatMNT } from "@/lib/utils";

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

  const saving =
    updateStatus.isPending ||
    assignMechanicMutation.isPending ||
    addService.isPending ||
    removeService.isPending ||
    addPart.isPending ||
    removePart.isPending;

  useEffect(() => {
    if (!orgLoading && !orgId && !orgError) {
      router.push(
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
          window.open(`/invoice/${data.public_token}`, "_blank");
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
      <div className="flex flex-col gap-6">
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
      <div className="flex flex-col gap-6">
        <Button variant="ghost" onClick={() => router.back()} className="w-fit">
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

  return (
    <div className="flex max-w-5xl flex-col gap-6 tablet:gap-8 tablet:px-4">
      <Breadcrumb
        items={[
          { label: "Work Orders", href: "/dashboard/work-orders" },
          { label: `WO #${wo.id.slice(0, 8)}` },
        ]}
      />

      {/* Header */}
      <div className="flex items-center gap-4 tablet:gap-5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          aria-label="Back"
          className="tablet:size-12"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">
              WO #{wo.id.slice(0, 8)}
            </h1>
            <StatusBadge status={wo.status as WorkOrderStatus} />
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
                className="min-h-[44px]"
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
                  {catalog
                    .filter((s) =>
                      s.name
                        .toLowerCase()
                        .includes(serviceSearch.toLowerCase()),
                    )
                    .map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          addServiceLine(s);
                          setShowAddService(false);
                          setServiceSearch("");
                        }}
                        className="flex items-center justify-between p-3 text-left hover:bg-muted transition-colors min-h-[44px]"
                      >
                        <span className="text-sm font-medium">{s.name}</span>
                        <span className="text-sm tabular-nums">
                          {formatMNT(s.default_price ?? 0)}
                        </span>
                      </button>
                    ))}
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
                    <StatusBadge status={h.status as WorkOrderStatus} />
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
            <div className="flex justify-between text-lg font-bold">
              <span>{t("grandTotal")}</span>
              <span className="tabular-nums">
                {formatMNT(Number(wo.total))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
