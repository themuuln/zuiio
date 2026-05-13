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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { ServiceCatalog, WorkOrderDetail } from "@/lib/types";
import { cn } from "@/lib/utils";
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
                      {wo.vehicle?.plate_number ?? "Work Order"}
                    </span>
                  ) : (
                    "Work Order"
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
                aria-label="Close"
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
            <ScrollArea className="flex-1">
              <div className="px-4 py-3 space-y-4">
                {/* ── Services Section ── */}
                <section className="rounded-xl border border-border/60 bg-card/40 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center size-6 rounded-lg bg-blue-500/10">
                        <Wrench className="size-3.5 text-blue-500" />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Services
                      </span>
                      {(wo.services?.length ?? 0) > 0 && (
                        <span className="rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 text-[10px] font-bold">
                          {wo.services?.length}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddService(!showAddService)}
                      className="h-7 text-xs gap-1"
                    >
                      <Plus className="size-3" />
                      Add
                    </Button>
                  </div>

                  {/* Service search dropdown */}
                  {showAddService && (
                    <div className="relative mb-3">
                      <Input
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        placeholder="Search services..."
                        className="h-9 text-sm"
                        autoFocus
                      />
                      {serviceSearch && (
                        <div className="absolute top-full left-0 right-0 z-10 mt-1 border rounded-lg bg-background shadow-lg max-h-48 overflow-y-auto">
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
                                    "flex items-center justify-between w-full px-3 py-2.5 text-left transition-colors hover:bg-muted/50",
                                    added && "opacity-40",
                                  )}
                                >
                                  <span className="text-sm font-medium truncate mr-2">
                                    {svc.name}
                                  </span>
                                  <span className="text-sm tabular-nums font-medium shrink-0">
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
                            <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                              No services match
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Service list */}
                  {(wo.services ?? []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground/50 rounded-lg border border-dashed border-border/60">
                      <Wrench className="size-6 mb-2 opacity-60" />
                      <p className="text-xs font-medium">No services yet</p>
                      <p className="text-[10px] mt-0.5">
                        Tap <strong>Add</strong> to add line items
                      </p>
                    </div>
                  ) : (
                    <div className="-mx-1">
                      {/* Header row */}
                      <div className="flex items-center gap-3 px-1 mb-1 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                        <div className="flex-1">Service</div>
                        <div className="w-16 text-right">Qty</div>
                        <div className="w-24 text-right">Price</div>
                        <div className="w-8" />
                      </div>
                      <div className="space-y-0.5">
                        {wo.services?.map((svc) => (
                          <div
                            key={svc.id}
                            className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/40 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {svc.service_name}
                              </p>
                            </div>
                            <div className="w-16 text-right text-sm text-muted-foreground tabular-nums">
                              {svc.quantity}
                            </div>
                            <div className="w-24 text-right text-sm font-semibold tabular-nums">
                              {formatMNT(Number(svc.final_price))}
                            </div>
                            <div className="w-8 flex justify-center">
                              <button
                                type="button"
                                onClick={() => removeService(svc.id)}
                                className="p-1 rounded-md text-destructive/60 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Remove service"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                {/* ── Parts Section ── */}
                <section className="rounded-xl border border-border/60 bg-card/40 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center size-6 rounded-lg bg-amber-500/10">
                        <span className="text-xs font-bold text-amber-600">P</span>
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Parts
                      </span>
                      {(wo.parts?.length ?? 0) > 0 && (
                        <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 text-[10px] font-bold">
                          {wo.parts?.length}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddPart(!showAddPart)}
                      className="h-7 text-xs gap-1"
                    >
                      <Plus className="size-3" />
                      Add
                    </Button>
                  </div>

                  {/* Add part form */}
                  {showAddPart && (
                    <div className="flex flex-col gap-2 p-3 mb-3 rounded-lg border border-border bg-muted/30">
                      <Input
                        value={newPartName}
                        onChange={(e) => setNewPartName(e.target.value)}
                        placeholder="Part name"
                        className="h-9 text-sm"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={newPartQty}
                          onChange={(e) =>
                            setNewPartQty(Number(e.target.value) || 1)
                          }
                          placeholder="Qty"
                          className="h-9 w-16 text-center text-sm"
                        />
                        <Input
                          type="number"
                          value={newPartPrice || ""}
                          onChange={(e) =>
                            setNewPartPrice(Number(e.target.value) || 0)
                          }
                          placeholder="Unit price"
                          className="h-9 flex-1 text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={addPartLine}
                          disabled={!newPartName.trim()}
                          className="h-9 px-3"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Parts list */}
                  {(wo.parts ?? []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground/50 rounded-lg border border-dashed border-border/60">
                      <p className="text-xs font-medium">No parts yet</p>
                      <p className="text-[10px] mt-0.5">
                        Tap <strong>Add</strong> to add parts
                      </p>
                    </div>
                  ) : (
                    <div className="-mx-1">
                      {/* Header row */}
                      <div className="flex items-center gap-3 px-1 mb-1 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                        <div className="flex-1">Part</div>
                        <div className="w-16 text-right">Qty</div>
                        <div className="w-24 text-right">Total</div>
                        <div className="w-8" />
                      </div>
                      <div className="space-y-0.5">
                        {wo.parts?.map((part) => (
                          <div
                            key={part.id}
                            className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/40 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {part.part_name}
                              </p>
                              <p className="text-[10px] text-muted-foreground/60">
                                {formatMNT(Number(part.unit_price))}/ea
                              </p>
                            </div>
                            <div className="w-16 text-right text-sm text-muted-foreground tabular-nums">
                              {part.quantity}
                            </div>
                            <div className="w-24 text-right text-sm font-semibold tabular-nums">
                              {formatMNT(Number(part.final_price))}
                            </div>
                            <div className="w-8 flex justify-center">
                              <button
                                type="button"
                                onClick={() => removePart(part.id)}
                                className="p-1 rounded-md text-destructive/60 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Remove part"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                {/* ── Totals Summary (prominent) ── */}
                <section className="rounded-xl bg-gradient-to-br from-primary/5 to-primary/[0.02] border border-primary/10 p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Services</span>
                      <span className="font-medium tabular-nums">
                        {formatMNT(servicesTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Parts</span>
                      <span className="font-medium tabular-nums">
                        {formatMNT(partsTotal)}
                      </span>
                    </div>
                    <Separator className="bg-primary/10" />
                    <div className="flex justify-between text-base font-bold">
                      <span>Grand Total</span>
                      <span className="tabular-nums text-primary">
                        {formatMNT(Number(wo.total))}
                      </span>
                    </div>
                  </div>
                </section>

                {/* ── Status Timeline ── */}
                <section className="rounded-xl border border-border/60 bg-card/40 p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center justify-center size-6 rounded-lg bg-purple-500/10">
                      <History className="size-3.5 text-purple-500" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status Timeline
                    </span>
                  </div>

                  {(wo.status_history ?? []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground/50">
                      <History className="size-6 mb-2 opacity-60" />
                      <p className="text-xs">No history yet</p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {wo.status_history?.map((h, idx) => {
                        const isLast =
                          idx === (wo.status_history?.length ?? 0) - 1;
                        return (
                          <div
                            key={h.id}
                            className="relative flex gap-3 pb-4 last:pb-0"
                          >
                            {!isLast && (
                              <div className="absolute left-[13px] top-6 bottom-0 w-px bg-gradient-to-b from-border to-transparent" />
                            )}
                            <div className="relative z-10 mt-1.5 shrink-0">
                              <div
                                className={cn(
                                  "size-[26px] rounded-full ring-[3px] ring-background flex items-center justify-center shadow-sm",
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
                                  <CheckCircle2 className="size-3.5 text-white" />
                                ) : (
                                  <div className="size-2.5 rounded-full bg-white/80" />
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
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
                                <p className="text-xs text-muted-foreground mt-1.5 bg-muted/30 rounded-lg px-2.5 py-1.5 border border-border/40">
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
                <section className="rounded-xl border border-border/60 bg-card/40 p-4">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Complaint & Notes
                  </span>
                  <div className="mt-3 space-y-3">
                    {wo.complaint && (
                      <div>
                        <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                          Complaint
                        </span>
                        <p className="text-sm mt-1 p-3 rounded-lg bg-muted/40 border border-border/50">
                          {wo.complaint}
                        </p>
                      </div>
                    )}
                    {wo.diagnosis && (
                      <div>
                        <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                          Diagnosis
                        </span>
                        <p className="text-sm mt-1 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40">
                          {wo.diagnosis}
                        </p>
                      </div>
                    )}
                    {wo.notes && (
                      <div>
                        <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                          Internal Notes
                        </span>
                        <p className="text-sm mt-1 p-3 rounded-lg bg-muted/40 border border-border/50">
                          {wo.notes}
                        </p>
                      </div>
                    )}
                    {!wo.complaint && !wo.diagnosis && !wo.notes && (
                      <p className="text-xs text-muted-foreground/50 italic">
                        No notes recorded
                      </p>
                    )}
                  </div>
                </section>

                {/* Spacer for footer */}
                <div className="h-2" />
              </div>
            </ScrollArea>

            {/* ── Footer: Status actions + mechanic ── */}
            <div className="shrink-0 border-t border-border bg-background px-4 py-3 space-y-3">
              {/* Status change confirmation */}
              {confirmStatus && (
                <div className="rounded-xl border border-amber-200/60 bg-amber-50/40 dark:border-amber-800/30 dark:bg-amber-950/10 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                    <div>
                      <p className="text-xs font-medium">
                        Change to <strong>{confirmStatus}</strong>?
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                        {confirmStatus === "Completed"
                          ? "This will mark the work order as complete and calculate final totals."
                          : "This will cancel the work order. Cannot be undone."}
                      </p>
                    </div>
                  </div>
                  <Input
                    placeholder="Add notes about this change (optional)"
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setConfirmStatus(null);
                        setStatusNotes("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        confirmStatus === "Cancelled" ? "destructive" : "default"
                      }
                      disabled={saving}
                      onClick={() => changeStatus(confirmStatus)}
                      className="min-w-[100px]"
                    >
                      {saving ? "Updating..." : `Confirm ${confirmStatus}`}
                    </Button>
                  </div>
                </div>
              )}

              {/* Primary status flow action */}
              <div className="flex gap-2">
                {wo.status === "New" && (
                  <Button
                    className="flex-1 h-10 text-sm font-semibold"
                    onClick={() => changeStatus("Diagnosing")}
                    disabled={saving}
                  >
                    <ArrowRight className="size-4" />
                    Start Diagnosing
                  </Button>
                )}
                {wo.status === "Diagnosing" && (
                  <Button
                    className="flex-1 h-10 text-sm font-semibold"
                    onClick={() => changeStatus("In Progress")}
                    disabled={saving}
                  >
                    <ArrowRight className="size-4" />
                    Start Work
                  </Button>
                )}
                {wo.status === "In Progress" && (
                  <Button
                    className="flex-1 h-10 text-sm font-semibold"
                    onClick={() => changeStatus("Ready for Pickup")}
                    disabled={saving}
                  >
                    <CheckCircle2 className="size-4" />
                    Mark Ready for Pickup
                  </Button>
                )}
                {wo.status === "Ready for Pickup" && (
                  <Button
                    className="flex-1 h-10 text-sm font-semibold"
                    onClick={() => changeStatus("Completed")}
                    disabled={saving}
                  >
                    <CheckCircle2 className="size-4" />
                    Complete & Close
                  </Button>
                )}
              </div>

              {/* Secondary actions */}
              <div className="flex items-center gap-2">
                {/* Cancel */}
                {canCancel && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeStatus("Cancelled")}
                    disabled={saving}
                    className="h-9 text-xs text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50"
                  >
                    <X className="size-3.5" />
                    Cancel Work Order
                  </Button>
                )}

                {/* Invoice */}
                {canInvoice && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs"
                    onClick={generateInvoice}
                    disabled={creatingInvoice}
                  >
                    <FileText className="size-3.5" />
                    {creatingInvoice ? "Creating..." : "Generate Invoice"}
                  </Button>
                )}

                <div className="flex-1" />

                {/* Mechanic selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wider">
                    Mech:
                  </span>
                  <select
                    value={wo.mechanic_id ?? ""}
                    onChange={(e) => assignMechanic(e.target.value)}
                    disabled={saving}
                    className="h-8 rounded-lg border border-border bg-muted/30 px-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 hover:border-muted-foreground/30 transition-colors"
                  >
                    <option value="">Unassigned</option>
                    {mechanics.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
