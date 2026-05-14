"use client";

import { AlertTriangle, ArrowLeft, FileText, Plus, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/breadcrumb";
import { ExportButton } from "@/components/export-button";
import { MechanicSelect } from "@/components/mechanic-select";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { WorkOrderPart, WorkOrderService } from "@/lib/database.types";
import type { ExportColumn } from "@/lib/export";
import { useRouter } from "@/lib/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ServiceCatalog, WorkOrderDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUSES = [
  "New",
  "Diagnosing",
  "In Progress",
  "Ready for Pickup",
  "Completed",
  "Cancelled",
] as const;

function formatMNT(value: number): string {
  return `₮${new Intl.NumberFormat("mn-MN", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)}`;
}

export default function WorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const woId = params.id as string;
  const t = useTranslations("workOrderDetail");

  const [wo, setWo] = useState<WorkOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Add service
  const [catalog, setCatalog] = useState<ServiceCatalog[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [showAddService, setShowAddService] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "service" | "part";
    id: string;
    name: string;
  } | null>(null);

  // Add part
  const [newPart, setNewPart] = useState({
    part_name: "",
    quantity: 1,
    unit_price: 0,
  });
  const [showAddPart, setShowAddPart] = useState(false);
  const [partPriceHistory, setPartPriceHistory] = useState<number[]>([]);

  // Mechanics
  const [mechanics, setMechanics] = useState<
    { id: string; full_name: string }[]
  >([]);

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

  useEffect(() => {
    fetch("/api/organizations")
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.id) {
          setOrgId(d.data.id);
          const id = d.data.id;
          Promise.all([
            fetch(`/api/organizations/${id}/services`).then((r) => r.json()),
            fetch(`/api/organizations/${id}/reports?type=mechanics`).then((r) =>
              r.json(),
            ),
          ])
            .then(([cat, mech]) => {
              if (cat.data) setCatalog(cat.data);
              if (mech.data) setMechanics(mech.data);
            })
            .catch(() => {});
        } else {
          setError("No organization found");
          router.push(
            "/auth/select-organization?returnUrl=/dashboard/work-orders",
          );
        }
      })
      .catch(() => setError("Failed to load organization"))
      .finally(() => setLoading(false));
  }, [router]);

  const fetchWo = useCallback(async () => {
    if (!orgId || !woId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${woId}`,
      );
      const json = await res.json();
      if (json.error) setError(json.error.message);
      else setWo(json.data);
    } catch {
      toast.error("Failed to load work order. Retrying...");
    } finally {
      setLoading(false);
    }
  }, [orgId, woId]);

  useEffect(() => {
    fetchWo();
  }, [fetchWo]);

  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);
  const [statusNotes, setStatusNotes] = useState("");

  const changeStatus = async (newStatus: string) => {
    if (!orgId || !woId) return;

    // Require confirmation for Completed/Cancelled
    if (
      (newStatus === "Completed" || newStatus === "Cancelled") &&
      confirmStatus !== newStatus
    ) {
      setConfirmStatus(newStatus);
      setStatusNotes("");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${woId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            notes: statusNotes || undefined,
          }),
        },
      );
      const json = await res.json();
      if (json.error) setError(json.error.message);
      else {
        setWo(json.data);
        toast.success(`Status changed to ${newStatus}`);
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setSaving(false);
      setConfirmStatus(null);
      setStatusNotes("");
    }
  };

  const assignMechanic = async (mechanicId: string) => {
    if (!orgId || !woId) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${woId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mechanic_id: mechanicId || null }),
        },
      );
      const json = await res.json();
      if (json.error) setError(json.error.message);
      else {
        setWo(json.data);
        toast.success("Mechanic assigned");
      }
    } catch {
      toast.error("Failed to assign mechanic");
    } finally {
      setSaving(false);
    }
  };

  const addServiceLine = async (svc: ServiceCatalog) => {
    if (!orgId || !woId) return;
    try {
      const supabase = createClient();
      const { data: history } = await supabase
        .from("service_price_history")
        .select("unit_price")
        .eq("organization_id", orgId)
        .eq("service_catalog_id", svc.id)
        .eq("vehicle_make", wo?.vehicle?.make ?? "")
        .eq("vehicle_model", wo?.vehicle?.model ?? "")
        .order("created_at", { ascending: false })
        .limit(3);
      const lastPrices = (history ?? [])
        .map((row) => Number(row.unit_price ?? 0))
        .filter(Boolean);
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${woId}/services`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service_catalog_id: svc.id,
            service_name: svc.name,
            quantity: 1,
            unit_price: lastPrices[0] ?? svc.default_price ?? 0,
          }),
        },
      );
      const json = await res.json();
      if (json.error) setError(json.error.message);
      else fetchWo();
    } catch {
      toast.error("Failed to add service");
    }
  };

  const removeServiceLine = async (serviceId: string) => {
    if (!orgId || !woId) return;
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${woId}/services`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: serviceId }),
        },
      );
      const json = await res.json();
      if (json.error) setError(json.error.message);
      else fetchWo();
    } catch {
      toast.error("Failed to remove service");
    }
  };

  const addPartLine = async () => {
    if (!orgId || !woId || !newPart.part_name.trim()) return;
    try {
      const unitPrice = newPart.unit_price || partPriceHistory[0] || 0;
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${woId}/parts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...newPart, unit_price: unitPrice }),
        },
      );
      const json = await res.json();
      if (json.error) setError(json.error.message);
      else {
        fetchWo();
        setNewPart({ part_name: "", quantity: 1, unit_price: 0 });
        setShowAddPart(false);
      }
    } catch {
      toast.error("Failed to add part");
    }
  };

  useEffect(() => {
    if (
      !orgId ||
      !newPart.part_name.trim() ||
      newPart.part_name.trim().length < 2
    ) {
      setPartPriceHistory([]);
      return;
    }
    const supabase = createClient();
    supabase
      .from("part_price_history")
      .select("unit_price")
      .eq("organization_id", orgId)
      .ilike("part_name", newPart.part_name.trim())
      .eq("vehicle_make", wo?.vehicle?.make ?? "")
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        const prices = (data ?? [])
          .map((row) => Number(row.unit_price ?? 0))
          .filter(Boolean);
        setPartPriceHistory(prices);
        if (prices[0] && newPart.unit_price === 0) {
          setNewPart((part) => ({ ...part, unit_price: prices[0] }));
        }
      });
  }, [orgId, newPart.part_name, newPart.unit_price, wo?.vehicle?.make]);

  const removePartLine = async (partId: string) => {
    if (!orgId || !woId) return;
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${woId}/parts`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: partId }),
        },
      );
      const json = await res.json();
      if (json.error) setError(json.error.message);
      else fetchWo();
    } catch {
      toast.error("Failed to remove part");
    }
  };

  // ── Invoice Generation ──────────────────────────────
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [existingInvoiceId, setExistingInvoiceId] = useState<string | null>(
    null,
  );

  const generateInvoice = async () => {
    if (!orgId || !woId) return;
    setCreatingInvoice(true);
    try {
      const res = await fetch(`/api/organizations/${orgId}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ work_order_id: woId }),
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message);
      } else {
        toast.success(`Invoice ${json.data.invoice_number} created`);
        setExistingInvoiceId(json.data.id);
        // Open the public invoice page
        window.open(`/invoice/${json.data.public_token}`, "_blank");
      }
    } catch {
      toast.error("Failed to create invoice");
    } finally {
      setCreatingInvoice(false);
    }
  };

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
            <Button onClick={fetchWo} variant="outline">
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
            <StatusBadge status={wo.status} />
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
                {partPriceHistory.length > 0 && (
                  <p className="mt-1 text-[11px] text-amber-600">
                    {t("lastPrices", {
                      prices: partPriceHistory
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
                  onClick={async () => {
                    if (deleteConfirm.type === "service") {
                      await removeServiceLine(deleteConfirm.id);
                      toast.success("Service removed");
                    } else {
                      await removePartLine(deleteConfirm.id);
                      toast.success("Part removed");
                    }
                    setDeleteConfirm(null);
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
                    {i < wo.status_history?.length - 1 && (
                      <div className="w-px h-4 bg-border" />
                    )}
                  </div>
                  <div>
                    <StatusBadge status={h.status} />
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
                disabled={creatingInvoice}
                className="shrink-0"
              >
                <FileText className="size-4" />
                {creatingInvoice
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
