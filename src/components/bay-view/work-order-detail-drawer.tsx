"use client";

import {
  AlertTriangle,
  ArrowRight,
  Car,
  CheckCircle2,
  FileText,
  History,
  Loader2,
  Plus,
  Trash2,
  User,
  Wrench,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { ServiceCatalog, WorkOrderDetail } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MechanicSelect } from "@/components/mechanic-select";
import { StatusPill } from "./status-pill";

// ── Helpers ──────────────────────────────────────────────────

function formatMNT(value: number): string {
  return `₮${new Intl.NumberFormat("mn-MN", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)}`;
}

const STATUSES = [
  "New",
  "Diagnosing",
  "In Progress",
  "Ready for Pickup",
  "Completed",
  "Cancelled",
] as const;

// ── Props ────────────────────────────────────────────────────

interface Props {
  workOrderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

// ── Drawer ───────────────────────────────────────────────────

export function WorkOrderDetailDrawer({
  workOrderId,
  open,
  onOpenChange,
  onRefresh,
}: Props) {
  const t = useTranslations("bayView");
  const [wo, setWo] = useState<WorkOrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Add service state
  const [catalog, setCatalog] = useState<ServiceCatalog[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [showAddService, setShowAddService] = useState(false);

  // Add part state
  const [newPartName, setNewPartName] = useState("");
  const [newPartQty, setNewPartQty] = useState(1);
  const [newPartPrice, setNewPartPrice] = useState(0);

  // Status change confirmation
  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);
  const [statusNotes, setStatusNotes] = useState("");

  // Org ID — extract from WO data
  const [orgId, setOrgId] = useState<string | null>(null);

  // Fetch catalog on first open
  useEffect(() => {
    if (!open || catalog.length > 0) return;
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        const id = d?.organizationId ?? d?.data?.organizationId;
        if (id) {
          setOrgId(id);
          fetch(`/api/organizations/${id}/services`)
            .then((r) => r.json())
            .then((res) => {
              if (res.data) setCatalog(res.data);
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [open, catalog.length]);

  // Fetch work order detail
  const fetchWo = useCallback(async () => {
    if (!workOrderId || !orgId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${workOrderId}`,
      );
      const json = await res.json();
      if (json.error) {
        setError(json.error.message ?? "Failed to load work order");
      } else {
        setWo(json.data);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [workOrderId, orgId]);

  useEffect(() => {
    if (open && workOrderId) fetchWo();
  }, [open, workOrderId, fetchWo]);

  // ── Status change ────────────────────────────────────────

  async function changeStatus(newStatus: string) {
    if (!orgId || !workOrderId) return;

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
        `/api/organizations/${orgId}/work-orders/${workOrderId}`,
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
      if (json.error) {
        toast.error(json.error.message ?? "Failed to update status");
      } else {
        setWo(json.data);
        toast.success(`Status changed to ${newStatus}`);
        onRefresh();
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setSaving(false);
      setConfirmStatus(null);
      setStatusNotes("");
    }
  }

  // ── Mechanic assignment ──────────────────────────────────

  const [mechanics, setMechanics] = useState<{ id: string; full_name: string }[]>([]);

  useEffect(() => {
    if (!orgId || mechanics.length > 0) return;
    fetch(`/api/organizations/${orgId}/reports?type=mechanics`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setMechanics(d.data);
      })
      .catch(() => {});
  }, [orgId, mechanics.length]);

  async function assignMechanic(mechanicId: string) {
    if (!orgId || !workOrderId) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${workOrderId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mechanic_id: mechanicId || null }),
        },
      );
      const json = await res.json();
      if (json.error) toast.error(json.error.message);
      else {
        setWo(json.data);
        onRefresh();
      }
    } catch {
      toast.error("Failed to assign mechanic");
    } finally {
      setSaving(false);
    }
  }

  // ── Services ─────────────────────────────────────────────

  async function addService(svc: ServiceCatalog) {
    if (!orgId || !workOrderId) return;
    try {
      await fetch(
        `/api/organizations/${orgId}/work-orders/${workOrderId}/services`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service_catalog_id: svc.id,
            service_name: svc.name,
            quantity: 1,
            unit_price: svc.default_price ?? 0,
          }),
        },
      );
      fetchWo();
      onRefresh();
    } catch {
      toast.error("Failed to add service");
    }
  }

  async function removeService(serviceId: string) {
    if (!orgId || !workOrderId) return;
    try {
      await fetch(
        `/api/organizations/${orgId}/work-orders/${workOrderId}/services`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: serviceId }),
        },
      );
      fetchWo();
      onRefresh();
    } catch {
      toast.error("Failed to remove service");
    }
  }

  // ── Parts ────────────────────────────────────────────────

  async function addPartLine() {
    if (!orgId || !workOrderId || !newPartName.trim()) return;
    try {
      await fetch(
        `/api/organizations/${orgId}/work-orders/${workOrderId}/parts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            part_name: newPartName.trim(),
            quantity: newPartQty,
            unit_price: newPartPrice,
          }),
        },
      );
      fetchWo();
      onRefresh();
      setNewPartName("");
      setNewPartQty(1);
      setNewPartPrice(0);
      setShowAddPart(false);
    } catch {
      toast.error("Failed to add part");
    }
  }

  const [showAddPart, setShowAddPart] = useState(false);

  async function removePart(partId: string) {
    if (!orgId || !workOrderId) return;
    try {
      await fetch(
        `/api/organizations/${orgId}/work-orders/${workOrderId}/parts`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: partId }),
        },
      );
      fetchWo();
      onRefresh();
    } catch {
      toast.error("Failed to remove part");
    }
  }

  // ── Invoice ──────────────────────────────────────────────

  const [creatingInvoice, setCreatingInvoice] = useState(false);

  async function generateInvoice() {
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
        toast.success(`Invoice ${json.data.invoice_number} created`);
        window.open(`/invoice/${json.data.public_token}`, "_blank");
      }
    } catch {
      toast.error("Failed to create invoice");
    } finally {
      setCreatingInvoice(false);
    }
  }

  // ── Compute totals ─────────────────────────────────────

  const servicesTotal =
    wo?.services?.reduce((s, svc) => s + Number(svc.final_price), 0) ?? 0;
  const partsTotal =
    wo?.parts?.reduce((s, p) => s + Number(p.final_price), 0) ?? 0;

  // ── Available status transitions ────────────────────────

  const canComplete =
    wo?.status === "In Progress" || wo?.status === "Ready for Pickup";
  const canCancel = wo?.status && !["Completed", "Cancelled"].includes(wo.status);
  const canInvoice = wo?.status === "Completed" || wo?.status === "Ready for Pickup";

  // ── Render ──────────────────────────────────────────────

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-3xl lg:max-w-[60%] p-0 gap-0"
        showCloseButton={false}
      >
        {/* Header — vehicle summary card */}
        <SheetHeader className="px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center size-10 shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
                {loading ? (
                  <Loader2 className="size-5 animate-spin text-primary" />
                ) : (
                  <Car className="size-5 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <SheetTitle className="text-base">
                  {wo ? (
                    <span className="truncate block">
                      {wo.vehicle?.plate_number ?? t("workOrder")}
                    </span>
                  ) : (
                    t("workOrder")
                  )}
                </SheetTitle>
                {wo && (
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span className="font-mono">WO#{wo.id.slice(0, 8)}</span>
                    {wo.created_at && (
                      <>
                        <span className="text-muted-foreground/30">·</span>
                        <span>{new Date(wo.created_at).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {wo?.status && <StatusPill status={wo.status} />}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-md p-1.5 hover:bg-muted transition-colors"
                aria-label={t("close")}
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Vehicle / Customer / Mechanic details */}
          {wo && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm bg-muted/30 rounded-xl px-3.5 py-2.5 border border-border/50">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground/60">
                  {wo.vehicle?.make}
                </span>
                <span className="font-medium">
                  {wo.vehicle?.model}
                </span>
                {wo.vehicle?.year && (
                  <span className="text-muted-foreground/50 text-xs">
                    · {wo.vehicle.year}
                  </span>
                )}
              </div>
              {wo.customer && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <User className="size-3" />
                  <span>
                    {wo.customer.first_name} {wo.customer.last_name ?? ""}
                  </span>
                  {wo.customer.phone && (
                    <span className="text-muted-foreground/50 text-xs">
                      {wo.customer.phone}
                    </span>
                  )}
                </div>
              )}
              {wo.mechanic && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Wrench className="size-3" />
                  <span>{wo.mechanic.full_name ?? "Assigned"}</span>
                </div>
              )}
            </div>
          )}
        </SheetHeader>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 px-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchWo}>
              Retry
            </Button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && wo && (
          <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
            {/* ── All sections stacked in card wrappers ── */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="px-3 py-2 space-y-3">
                {/* ── Services Section ── */}
                <section className="rounded-lg border border-border/60 bg-card/40 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center justify-center size-5 rounded-md bg-blue-500/10">
                        <Wrench className="size-3 text-blue-500" />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t("services")}
                      </span>
                      {(wo.services?.length ?? 0) > 0 && (
                        <span className="rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 text-[10px] font-bold">
                          {wo.services?.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Service search dropdown */}
                  {showAddService && (
                    <div className="relative mb-2">
                      <Input
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        placeholder={t("searchServices")}
                        className="h-8 text-xs"
                        autoFocus
                      />
                      {serviceSearch && (
                        <div className="absolute top-full left-0 right-0 z-10 mt-1 border rounded-lg bg-background shadow-lg max-h-40 overflow-y-auto">
                          {catalog
                            .filter((s) =>
                              s.name
                                .toLowerCase()
                                .includes(serviceSearch.toLowerCase()),
                            )
                            .slice(0, 8)
                            .map((svc) => {
                              const added = wo.services?.some(
                                (s) => s.service_catalog_id === svc.id,
                              );
                              return (
                                <button
                                  type="button"
                                  key={svc.id}
                                  onClick={() => {
                                    if (!added) {
                                      addService(svc);
                                      setServiceSearch("");
                                      setShowAddService(false);
                                    }
                                  }}
                                  disabled={added}
                                  className={cn(
                                    "flex items-center justify-between w-full px-2.5 py-2 text-left transition-colors hover:bg-muted/50 text-xs",
                                    added && "opacity-40",
                                  )}
                                >
                                  <span className="font-medium truncate mr-2">
                                    {svc.name}
                                  </span>
                                  <span className="tabular-nums font-medium shrink-0">
                                    {formatMNT(Number(svc.default_price))}
                                  </span>
                                </button>
                              );
                            })}
                          {catalog.filter((s) =>
                            s.name
                              .toLowerCase()
                              .includes(serviceSearch.toLowerCase()),
                          ).length === 0 && (
                            <div className="px-3 py-3 text-xs text-muted-foreground text-center">
                              {t("noMatchService")}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Service list */}
                  {(wo.services ?? []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-4 text-muted-foreground/50 rounded-lg border border-dashed border-border/60">
                      <Wrench className="size-5 mb-1.5 opacity-60" />
                      <p className="text-[11px] font-medium">{t("noServicesYet")}</p>
                    </div>
                  ) : (
                    <div className="-mx-0.5">
                      {/* Header row */}
                      <div className="flex items-center gap-2 px-1 mb-0.5 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                        <div className="flex-1">{t("service")}</div>
                        <div className="w-14 text-right">{t("qty")}</div>
                        <div className="w-20 text-right">{t("price")}</div>
                        <div className="w-7" />
                      </div>
                      <div className="space-y-px">
                        {wo.services?.map((svc) => (
                          <div
                            key={svc.id}
                            className="group flex items-center gap-2 rounded-md px-1.5 py-1.5 hover:bg-muted/40 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {svc.service_name}
                              </p>
                            </div>
                            <div className="w-14 text-right text-xs text-muted-foreground tabular-nums">
                              {svc.quantity}
                            </div>
                            <div className="w-20 text-right text-xs font-semibold tabular-nums">
                              {formatMNT(Number(svc.final_price))}
                            </div>
                            <div className="w-7 flex justify-center">
                              <button
                                type="button"
                                onClick={() => removeService(svc.id)}
                                className="p-0.5 rounded-md text-destructive/60 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Remove service"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Full-width Add button */}
                  <button
                    type="button"
                    onClick={() => setShowAddService(!showAddService)}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-muted-foreground/25 py-2 text-xs font-medium text-muted-foreground/60 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    <Plus className="size-4" />
                    {t("addService")}
                  </button>
                </section>

                {/* ── Parts Section ── */}
                <section className="rounded-lg border border-border/60 bg-card/40 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center justify-center size-5 rounded-md bg-amber-500/10">
                        <span className="text-[10px] font-bold text-amber-600">P</span>
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t("parts")}
                      </span>
                      {(wo.parts?.length ?? 0) > 0 && (
                        <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 text-[10px] font-bold">
                          {wo.parts?.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add part form */}
                  {showAddPart && (
                    <div className="flex flex-col gap-1.5 p-2 mb-2 rounded-lg border border-border bg-muted/30">
                      <Input
                        value={newPartName}
                        onChange={(e) => setNewPartName(e.target.value)}
                        placeholder={t("partName")}
                        className="h-8 text-xs"
                        autoFocus
                      />
                      <div className="flex gap-1.5">
                        <Input
                          type="number"
                          value={newPartQty}
                          onChange={(e) =>
                            setNewPartQty(Number(e.target.value) || 1)
                          }
                          placeholder={t("qty")}
                          className="h-8 w-14 text-center text-xs"
                        />
                        <Input
                          type="number"
                          value={newPartPrice || ""}
                          onChange={(e) =>
                            setNewPartPrice(Number(e.target.value) || 0)
                          }
                          placeholder={t("unitPrice")}
                          className="h-8 flex-1 text-xs"
                        />
                        <Button
                          size="sm"
                          onClick={addPartLine}
                          disabled={!newPartName.trim()}
                          className="h-8 px-2 text-xs"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Parts list */}
                  {(wo.parts ?? []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-4 text-muted-foreground/50 rounded-lg border border-dashed border-border/60">
                      <p className="text-[11px] font-medium">{t("noPartsYet")}</p>
                    </div>
                  ) : (
                    <div className="-mx-0.5">
                      {/* Header row */}
                      <div className="flex items-center gap-2 px-1 mb-0.5 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                        <div className="flex-1">{t("part")}</div>
                        <div className="w-14 text-right">{t("qty")}</div>
                        <div className="w-20 text-right">{t("total")}</div>
                        <div className="w-7" />
                      </div>
                      <div className="space-y-px">
                        {wo.parts?.map((part) => (
                          <div
                            key={part.id}
                            className="group flex items-center gap-2 rounded-md px-1.5 py-1.5 hover:bg-muted/40 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {part.part_name}
                              </p>
                              <p className="text-[10px] text-muted-foreground/60">
                                {formatMNT(Number(part.unit_price))}{t("perUnit")}
                              </p>
                            </div>
                            <div className="w-14 text-right text-xs text-muted-foreground tabular-nums">
                              {part.quantity}
                            </div>
                            <div className="w-20 text-right text-xs font-semibold tabular-nums">
                              {formatMNT(Number(part.final_price))}
                            </div>
                            <div className="w-7 flex justify-center">
                              <button
                                type="button"
                                onClick={() => removePart(part.id)}
                                className="p-0.5 rounded-md text-destructive/60 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Remove part"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Full-width Add button */}
                  <button
                    type="button"
                    onClick={() => setShowAddPart(!showAddPart)}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-muted-foreground/25 py-2 text-xs font-medium text-muted-foreground/60 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    <Plus className="size-4" />
                    {t("addPart")}
                  </button>
                </section>

                {/* ── Totals Summary (prominent) ── */}
                <section className="rounded-lg bg-gradient-to-br from-primary/5 to-primary/[0.02] border border-primary/10 p-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{t("services")}</span>
                      <span className="font-medium tabular-nums">
                        {formatMNT(servicesTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{t("parts")}</span>
                      <span className="font-medium tabular-nums">
                        {formatMNT(partsTotal)}
                      </span>
                    </div>
                    <Separator className="bg-primary/10" />
                    <div className="flex justify-between text-sm font-bold">
                      <span>{t("grandTotal")}</span>
                      <span className="tabular-nums text-primary">
                        {formatMNT(Number(wo.total))}
                      </span>
                    </div>
                  </div>
                </section>

                {/* ── Status Timeline ── */}
                <section className="rounded-lg border border-border/60 bg-card/40 p-3">
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="flex items-center justify-center size-5 rounded-md bg-purple-500/10">
                      <History className="size-3 text-purple-500" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t("statusTimeline")}
                    </span>
                  </div>

                  {(wo.status_history ?? []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-4 text-muted-foreground/50">
                      <History className="size-5 mb-1.5 opacity-60" />
                      <p className="text-xs">{t("noHistoryYet")}</p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {wo.status_history?.map((h, idx) => {
                        const isLast =
                          idx === (wo.status_history?.length ?? 0) - 1;
                        return (
                          <div
                            key={h.id}
                            className="relative flex gap-2 pb-3 last:pb-0"
                          >
                            {!isLast && (
                              <div className="absolute left-[10px] top-5 bottom-0 w-px bg-gradient-to-b from-border to-transparent" />
                            )}
                            <div className="relative z-10 mt-1 shrink-0">
                              <div
                                className={cn(
                                  "size-5 rounded-full ring-2 ring-background flex items-center justify-center",
                                  h.status === "Completed"
                                    ? "bg-green-500"
                                    : h.status === "Cancelled"
                                      ? "bg-red-400"
                                      : h.status === "In Progress" || h.status === "Ready for Pickup"
                                        ? "bg-amber-500"
                                        : "bg-blue-500",
                                )}
                              >
                                {h.status === "Completed" || h.status === "Ready for Pickup" ? (
                                  <CheckCircle2 className="size-3 text-white" />
                                ) : (
                                  <div className="size-2 rounded-full bg-white/80" />
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <StatusPill status={h.status} />
                                <span className="text-[10px] text-muted-foreground/60 shrink-0 font-mono">
                                  {new Date(h.created_at).toLocaleDateString([], {
                                    month: "short",
                                    day: "numeric",
                                  })}{" "}
                                  {new Date(h.created_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              {h.notes && (
                                <p className="text-xs text-muted-foreground mt-1 bg-muted/30 rounded-md px-2 py-1 border border-border/40">
                                  {h.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* ── Notes Section ── */}
                <section className="rounded-lg border border-border/60 bg-card/40 p-3">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("complaintAndNotes")}
                  </span>
                  <div className="mt-2 space-y-2">
                    {wo.complaint && (
                      <div>
                        <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                          {t("complaint")}
                        </span>
                        <p className="text-xs mt-0.5 p-2 rounded-md bg-muted/40 border border-border/50">
                          {wo.complaint}
                        </p>
                      </div>
                    )}
                    {wo.diagnosis && (
                      <div>
                        <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                          {t("diagnosis")}
                        </span>
                        <p className="text-xs mt-0.5 p-2 rounded-md bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40">
                          {wo.diagnosis}
                        </p>
                      </div>
                    )}
                    {wo.notes && (
                      <div>
                        <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                          {t("internalNotes")}
                        </span>
                        <p className="text-xs mt-0.5 p-2 rounded-md bg-muted/40 border border-border/50">
                          {wo.notes}
                        </p>
                      </div>
                    )}
                    {!wo.complaint && !wo.diagnosis && !wo.notes && (
                      <p className="text-[11px] text-muted-foreground/50 italic">
                        {t("noNotesRecorded")}
                      </p>
                    )}
                  </div>
                </section>

                {/* Spacer for footer */}
                <div className="h-2" />
              </div>
            </div>

            {/* ── Footer: Status actions + mechanic ── */}
            <div className="shrink-0 border-t border-border bg-background px-3 py-2 space-y-2">
              {/* Status change confirmation */}
              {confirmStatus && (
                <div className="rounded-lg border border-amber-200/60 bg-amber-50/40 dark:border-amber-800/30 dark:bg-amber-950/10 p-2 space-y-1.5">
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                    <div>
                      <p className="text-[11px] font-medium">
                        {t("statusNotesGenericTitle", { status: confirmStatus })}?
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                        {confirmStatus === "Completed"
                          ? t("confirmComplete")
                          : t("confirmCancel")}
                      </p>
                    </div>
                  </div>
                  <Input
                    placeholder={t("addNotesOptional")}
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <div className="flex gap-1.5 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setConfirmStatus(null);
                        setStatusNotes("");
                      }}
                      className="h-7 text-xs"
                    >
                      {t("cancel")}
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        confirmStatus === "Cancelled" ? "destructive" : "default"
                      }
                      disabled={saving}
                      onClick={() => changeStatus(confirmStatus)}
                      className="h-7 text-xs min-w-[90px]"
                    >
                      {saving ? t("updating") : t("confirm")}
                    </Button>
                  </div>
                </div>
              )}

              {/* Primary status flow action */}
              <div className="flex gap-1.5">
                {wo.status === "New" && (
                  <Button
                    className="flex-1 h-9 text-xs font-semibold"
                    onClick={() => changeStatus("Diagnosing")}
                    disabled={saving}
                  >
                    <ArrowRight className="size-3.5" />
                    {t("startDiagnosing")}
                  </Button>
                )}
                {wo.status === "Diagnosing" && (
                  <Button
                    className="flex-1 h-9 text-xs font-semibold"
                    onClick={() => changeStatus("In Progress")}
                    disabled={saving}
                  >
                    <ArrowRight className="size-3.5" />
                    {t("startWork")}
                  </Button>
                )}
                {wo.status === "In Progress" && (
                  <Button
                    className="flex-1 h-9 text-xs font-semibold"
                    onClick={() => changeStatus("Ready for Pickup")}
                    disabled={saving}
                  >
                    <CheckCircle2 className="size-3.5" />
                    {t("markReady")}
                  </Button>
                )}
                {wo.status === "Ready for Pickup" && (
                  <Button
                    className="flex-1 h-9 text-xs font-semibold"
                    onClick={() => changeStatus("Completed")}
                    disabled={saving}
                  >
                    <CheckCircle2 className="size-3.5" />
                    {t("complete")}
                  </Button>
                )}
              </div>

              {/* Secondary actions */}
              <div className="flex items-center gap-1.5">
                {/* Cancel */}
                {canCancel && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeStatus("Cancelled")}
                    disabled={saving}
                    className="h-7 text-[10px] text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50"
                  >
                    <X className="size-3" />
                    {t("cancel")}
                  </Button>
                )}

                {/* Invoice */}
                {canInvoice && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px]"
                    onClick={generateInvoice}
                    disabled={creatingInvoice}
                  >
                    <FileText className="size-3" />
                    {creatingInvoice ? t("creating") : t("invoice")}
                  </Button>
                )}

                <div className="flex-1" />

                {/* Mechanic selector */}
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-muted-foreground/60 font-medium uppercase">
                    {t("mech")}
                  </span>
                  <MechanicSelect
                    value={wo.mechanic_id ?? ""}
                    onChange={assignMechanic}
                    mechanics={mechanics}
                    disabled={saving}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
