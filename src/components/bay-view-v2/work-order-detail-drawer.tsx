"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useRouter } from "@/lib/i18n/navigation";
import {
  getWorkOrderServicesWithIntervals,
  saveCompletionData,
  savePostServiceData,
} from "@/lib/services/post-service-service";
import type {
  GlobalPartCatalog,
  GlobalServiceCatalog,
  PartsCatalogItem,
  ServiceCatalog,
  WorkOrderDetail,
} from "@/lib/types";
import { DrawerCelebration } from "./_drawer-celebration";
import { DrawerFooter } from "./_drawer-footer";
import { DrawerHeaderSection } from "./_drawer-header";
import { DrawerLoading, DrawerSkeleton } from "./_drawer-loading";
import { UnsavedWarning } from "./_drawer-unsaved-warning";
import { NotesSection } from "./_notes-section";
import { PartsSection } from "./_parts-section";
import { ServicesSection } from "./_services-section";
import { StatusTimeline } from "./_status-timeline";
import { TotalsSummary } from "./_totals-summary";
import type { PickupCompleteData } from "./pickup-complete-form";
import { PickupCompleteForm } from "./pickup-complete-form";
import type { PostServiceFormData } from "./post-service-form";
import { PostServiceForm } from "./post-service-form";

// Extended types that accept both org and global catalog items
type CatalogServiceItem = Partial<ServiceCatalog> & {
  id: string;
  name: string;
  name_mn?: string | null;
  default_price: number;
  _source?: "org" | "global";
};
type CatalogPartItem = Partial<PartsCatalogItem> & {
  id: string;
  name: string;
  name_mn?: string | null;
  default_price: number;
  _source?: "org" | "global";
};

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
  const { push } = useRouter();
  const [wo, setWo] = useState<WorkOrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Add service state
  const [catalog, setCatalog] = useState<CatalogServiceItem[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [showAddService, setShowAddService] = useState(false);
  const [addingServiceId, setAddingServiceId] = useState<string | null>(null);
  const [pendingServicePreview, setPendingServicePreview] = useState<{
    name: string;
    price: number;
  } | null>(null);

  // Add part state
  const [newPartName, setNewPartName] = useState("");
  const [newPartQty, setNewPartQty] = useState(1);
  const [newPartPrice, setNewPartPrice] = useState(0);
  const [addingPart, setAddingPart] = useState(false);
  const [pendingPartPreview, setPendingPartPreview] = useState<{
    name: string;
    quantity: number;
    unitPrice: number;
  } | null>(null);
  const [partsCatalog, setPartsCatalog] = useState<CatalogPartItem[]>([]);
  const [partSearch, setPartSearch] = useState("");

  // Inline price edit state
  const [editingServicePriceId, setEditingServicePriceId] = useState<
    string | null
  >(null);
  const [editingServicePriceVal, setEditingServicePriceVal] = useState("");
  const [editingPartPriceId, setEditingPartPriceId] = useState<string | null>(
    null,
  );
  const [editingPartPriceVal, setEditingPartPriceVal] = useState("");

  // Post-service form state
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

  // Pickup complete form state
  const [showPickupForm, setShowPickupForm] = useState(false);

  // Status change confirmation
  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);
  const [statusNotes, setStatusNotes] = useState("");

  // Org ID — extract from WO data
  const orgIdRef = useRef<string | null>(null);

  // Catalog refresh ref — track if catalog was fetched in current session
  const catalogFetchedRef = useRef(false);

  // Layout-preserving loading
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Unsaved changes guard
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Completion celebration
  const [showCelebration, setShowCelebration] = useState(false);

  // Fetch work order detail
  const fetchWo = useCallback(
    async (silent = false, orgIdOverride?: string) => {
      const orgId = orgIdOverride ?? orgIdRef.current;
      if (!workOrderId || !orgId) return;
      if (!silent) setLoading(true);
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
    },
    [workOrderId],
  );

  // Fetch catalog on first open, silently refetch on reopen
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const abort = new AbortController();
    const signal = abort.signal;
    fetch("/api/profile", { signal })
      .then((r) => r.json())
      .then((d) => {
        if (signal.aborted) return;
        const id = d?.organizationId ?? d?.data?.organizationId;
        if (id) {
          orgIdRef.current = id;
          fetchWo();
          // Fetch org-specific and global catalogs in parallel
          Promise.all([
            fetch(`/api/organizations/${id}/services`, { signal }).then((r) =>
              r.json(),
            ),
            fetch(`/api/organizations/${id}/inventory/parts`, { signal }).then(
              (r) => r.json(),
            ),
            fetch("/api/global-catalog/services", { signal }).then((r) =>
              r.json(),
            ),
            fetch("/api/global-catalog/parts", { signal }).then((r) =>
              r.json(),
            ),
          ])
            .then(
              ([
                orgServicesRes,
                orgPartsRes,
                globalServicesRes,
                globalPartsRes,
              ]) => {
                if (signal.aborted) return;

                // Merge services: org first, then global (deduplicated by name)
                const orgServices: CatalogServiceItem[] =
                  orgServicesRes.data ?? [];
                const globalServices: GlobalServiceCatalog[] =
                  globalServicesRes.data ?? [];
                const seenNames = new Set(
                  orgServices.map((s) => s.name.toLowerCase()),
                );
                const mergedServices: CatalogServiceItem[] = [
                  ...orgServices,
                  ...globalServices
                    .filter((gs) => !seenNames.has(gs.name.toLowerCase()))
                    .map((gs) => ({
                      id: gs.id,
                      name: gs.name,
                      name_mn: gs.name_mn,
                      category: gs.category,
                      description: gs.description,
                      default_price: 0,
                      is_active: true,
                      estimated_duration_minutes: gs.estimated_duration_minutes,
                      interval_km: null,
                      interval_months: null,
                      // Mark as global so add handler knows not to use ID as catalog_id
                      _source: "global" as const,
                    })),
                ];
                setCatalog(mergedServices);

                // Merge parts: org first, then global (deduplicated by name)
                const orgParts: CatalogPartItem[] =
                  orgPartsRes.data?.data ?? orgPartsRes.data ?? [];
                const globalParts: GlobalPartCatalog[] =
                  globalPartsRes.data ?? [];
                const seenPartNames = new Set(
                  orgParts.map((p) => p.name.toLowerCase()),
                );
                const mergedParts: CatalogPartItem[] = [
                  ...orgParts,
                  ...globalParts
                    .filter((gp) => !seenPartNames.has(gp.name.toLowerCase()))
                    .map((gp) => ({
                      id: gp.id,
                      name: gp.name,
                      name_mn: gp.name_mn,
                      category: gp.category,
                      description: gp.description,
                      part_number: gp.part_number,
                      default_price: 0,
                      is_active: true,
                      _source: "global" as const,
                    })),
                ];
                setPartsCatalog(mergedParts);
              },
            )
            .catch((err) => {
              if (!signal.aborted)
                console.error("Failed to load catalogs:", err);
            });
          fetch(`/api/organizations/${id}/reports?type=mechanics`, { signal })
            .then((r) => r.json())
            .then((d) => {
              if (!signal.aborted && d.data) setMechanics(d.data);
            })
            .catch((err) => {
              if (!signal.aborted)
                console.error("Failed to load mechanics:", err);
            });
        }
      })
      .catch((err) => {
        if (!signal.aborted) console.error("Failed to fetch profile:", err);
      });
    if (!catalogFetchedRef.current) {
      catalogFetchedRef.current = true;
    }
    return () => abort.abort();
  }, [open, fetchWo]);

  // Track first successful load for layout-preserving loading
  useEffect(() => {
    if (wo) setHasLoadedOnce(true);
  }, [wo]);

  // Reset state on close for clean reopen
  useEffect(() => {
    if (!open) {
      orgIdRef.current = null;
      setWo(null);
      setError(null);
      setLoading(false);
    }
  }, [open]);

  // ── Status change ────────────────────────────────────────

  async function changeStatus(newStatus: string) {
    const orgId = orgIdRef.current;
    if (!orgId || !workOrderId) return;

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

  const [mechanics, setMechanics] = useState<
    { id: string; full_name: string }[]
  >([]);

  async function assignMechanic(mechanicId: string) {
    const orgId = orgIdRef.current;
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

  async function addService(svc: CatalogServiceItem) {
    const orgId = orgIdRef.current;
    if (!orgId || !workOrderId || addingServiceId) return;
    setAddingServiceId(svc.id);
    setPendingServicePreview({
      name: svc.name,
      price: Number(svc.default_price ?? 0),
    });
    setServiceSearch("");
    setShowAddService(false);
    try {
      // For global services, don't send service_catalog_id (FK would fail)
      const isGlobal = svc._source === "global";
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${workOrderId}/services`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service_catalog_id: isGlobal ? null : svc.id,
            service_name: svc.name,
            quantity: 1,
            unit_price: svc.default_price ?? 0,
          }),
        },
      );
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message ?? "Failed to add service");
        return;
      }
      // Append new service directly to wo state — avoids stale cache from refetch
      const newService = json.data;
      setWo((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          services: [...(prev.services ?? []), newService],
        };
      });
      toast.success(`Added service: ${svc.name}`);
      onRefresh();
    } catch {
      toast.error("Failed to add service");
    } finally {
      setAddingServiceId(null);
      setPendingServicePreview(null);
    }
  }

  async function removeService(serviceId: string) {
    const orgId = orgIdRef.current;
    if (!orgId || !workOrderId) return;
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${workOrderId}/services?serviceId=${serviceId}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message ?? "Failed to remove service");
        return;
      }
      // Remove service directly from wo state — avoids stale cache from refetch
      setWo((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          services: (prev.services ?? []).filter((s) => s.id !== serviceId),
        };
      });
      onRefresh();
    } catch {
      toast.error("Failed to remove service");
    }
  }

  // ── Parts ────────────────────────────────────────────────

  async function addPartLine() {
    const orgId = orgIdRef.current;
    const trimmedPartName = newPartName.trim();
    if (!orgId || !workOrderId || !trimmedPartName || addingPart) return;
    setAddingPart(true);
    setPendingPartPreview({
      name: trimmedPartName,
      quantity: newPartQty,
      unitPrice: newPartPrice,
    });
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${workOrderId}/parts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            part_name: trimmedPartName,
            quantity: newPartQty,
            unit_price: newPartPrice,
          }),
        },
      );
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message ?? "Failed to add part");
        return;
      }
      // Append new part directly to wo state — avoids stale cache from refetch
      const newPart = json.data;
      setWo((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          parts: [...(prev.parts ?? []), newPart],
        };
      });
      toast.success(`Added part: ${trimmedPartName}`);
      onRefresh();
      setNewPartName("");
      setNewPartQty(1);
      setNewPartPrice(0);
      setShowAddPart(false);
    } catch {
      toast.error("Failed to add part");
    } finally {
      setAddingPart(false);
      setPendingPartPreview(null);
    }
  }

  const [showAddPart, setShowAddPart] = useState(false);

  async function removePart(partId: string) {
    const orgId = orgIdRef.current;
    if (!orgId || !workOrderId) return;
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${workOrderId}/parts?partId=${partId}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message ?? "Failed to remove part");
        return;
      }
      // Remove part directly from wo state — avoids stale cache from refetch
      setWo((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          parts: (prev.parts ?? []).filter((p) => p.id !== partId),
        };
      });
      onRefresh();
    } catch {
      toast.error("Failed to remove part");
    }
  }

  async function handleServicePriceSave(serviceId: string) {
    const orgId = orgIdRef.current;
    if (!orgId || !workOrderId) return;
    const numVal = Number(editingServicePriceVal);
    if (Number.isNaN(numVal) || numVal < 0) {
      toast.error("Invalid price");
      return;
    }

    // Capture the original price for rollback in case of failure
    const originalService = wo?.services?.find((s) => s.id === serviceId);
    const oldPrice = originalService
      ? Number(originalService.final_price)
      : null;

    // Apply optimistic update immediately
    setWo((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        services: (prev.services ?? []).map((service) =>
          service.id === serviceId
            ? { ...service, final_price: numVal }
            : service,
        ),
      };
    });

    setEditingServicePriceId(null);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${workOrderId}/services?serviceId=${serviceId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ final_price: numVal }),
        },
      );
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message ?? "Failed to update price");
        // Rollback optimistic update
        if (oldPrice !== null) {
          setWo((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              services: (prev.services ?? []).map((service) =>
                service.id === serviceId
                  ? { ...service, final_price: oldPrice }
                  : service,
              ),
            };
          });
        }
        return;
      }
      toast.success("Price updated");
      onRefresh();
    } catch {
      toast.error("Failed to update price");
      // Rollback optimistic update
      if (oldPrice !== null) {
        setWo((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            services: (prev.services ?? []).map((service) =>
              service.id === serviceId
                ? { ...service, final_price: oldPrice }
                : service,
            ),
          };
        });
      }
    }
  }

  async function handlePartPriceSave(partId: string) {
    const orgId = orgIdRef.current;
    if (!orgId || !workOrderId) return;
    const numVal = Number(editingPartPriceVal);
    if (Number.isNaN(numVal) || numVal < 0) {
      toast.error("Invalid price");
      return;
    }

    // Capture the original price for rollback in case of failure
    const originalPart = wo?.parts?.find((p) => p.id === partId);
    const oldPrice = originalPart ? Number(originalPart.final_price) : null;

    // Apply optimistic update immediately
    setWo((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        parts: (prev.parts ?? []).map((part) =>
          part.id === partId ? { ...part, final_price: numVal } : part,
        ),
      };
    });

    setEditingPartPriceId(null);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${workOrderId}/parts?partId=${partId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ final_price: numVal }),
        },
      );
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message ?? "Failed to update price");
        // Rollback optimistic update
        if (oldPrice !== null) {
          setWo((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              parts: (prev.parts ?? []).map((part) =>
                part.id === partId ? { ...part, final_price: oldPrice } : part,
              ),
            };
          });
        }
        return;
      }
      toast.success("Price updated");
      onRefresh();
    } catch {
      toast.error("Failed to update price");
      // Rollback optimistic update
      if (oldPrice !== null) {
        setWo((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            parts: (prev.parts ?? []).map((part) =>
              part.id === partId ? { ...part, final_price: oldPrice } : part,
            ),
          };
        });
      }
    }
  }

  // ── Invoice ──────────────────────────────────────────────

  const [creatingInvoice, setCreatingInvoice] = useState(false);

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
        toast.success(`Invoice ${json.data.invoice_number} created`);
        push(`/invoice/${json.data.public_token}`);
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

  // ── Post-service form handlers ────────────────────────────

  async function handleReadyForPickup() {
    if (!workOrderId || !wo?.vehicle_id) {
      // Fallback: direct status change
      changeStatus("Ready for Pickup");
      return;
    }

    try {
      const services = await getWorkOrderServicesWithIntervals(workOrderId);
      setPostFormServices(services);
      setShowPostServiceForm(true);
    } catch {
      changeStatus("Ready for Pickup");
    }
  }

  async function handlePostServiceFormSubmit(data: PostServiceFormData) {
    if (!workOrderId || !wo?.vehicle_id) return;
    setSaving(true);

    try {
      await savePostServiceData({
        workOrderId,
        vehicleId: wo.vehicle_id as string,
        odometerReading: data.odometerReading,
        recommendations: data.recommendations,
        mechanicNotes: data.mechanicNotes,
      });

      // Then update status
      const orgId = orgIdRef.current;
      if (!orgId) return;
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${workOrderId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "Ready for Pickup",
            notes: data.mechanicNotes || undefined,
          }),
        },
      );
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message ?? "Failed to update status");
      } else {
        setWo(json.data);
        toast.success("Ready for Pickup — recommendations saved");
        onRefresh();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save post-service data",
      );
    } finally {
      setSaving(false);
      setShowPostServiceForm(false);
      setPostFormServices([]);
    }
  }

  async function handlePickupSubmit(data: PickupCompleteData) {
    const orgId = orgIdRef.current;
    if (!orgId || !workOrderId || !wo?.vehicle_id) return;
    setSaving(true);

    try {
      await saveCompletionData({
        workOrderId,
        vehicleId: wo.vehicle_id as string,
        odometerReading: null,
        customerSatisfaction: data.customerSatisfaction,
        customerFeedback: data.customerFeedback,
        nextAppointmentDate: data.nextAppointmentDate,
      });

      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${workOrderId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Completed" }),
        },
      );
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message ?? "Failed to complete");
      } else {
        setWo(json.data);
        toast.success("Work order completed");
        setShowPickupForm(false);
        setShowCelebration(true);
        setTimeout(() => {
          setShowCelebration(false);
          onOpenChange(false);
        }, 1500);
        onRefresh();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to complete work order",
      );
    } finally {
      setSaving(false);
    }
  }

  // ── Available status transitions ────────────────────────

  const canCancel: boolean =
    !!wo?.status && !["Completed", "Cancelled"].includes(wo.status ?? "");
  const canInvoice: boolean =
    wo?.status === "Completed" || wo?.status === "Ready for Pickup";

  // ── Computed ────────────────────────────────────────────

  const isDirty = (showAddPart && newPartName.trim() !== "") || showAddService;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      const hasPriceEdit =
        editingServicePriceId !== null || editingPartPriceId !== null;

      // Save any in-progress price edits silently (triggers onBlur → save)
      if (hasPriceEdit) {
        setEditingServicePriceId(null);
        setEditingPartPriceId(null);
      }

      // Show unsaved warning for add-part form / add-service search
      if (isDirty) {
        setShowUnsavedWarning(true);
        return;
      }

      // If price edit was the only dirty state, close after save fires
      if (hasPriceEdit) {
        setTimeout(() => onOpenChange(false), 100);
        return;
      }
    }
    onOpenChange(nextOpen);
  }

  function handleDiscard() {
    setShowAddPart(false);
    setShowAddService(false);
    setNewPartName("");
    setShowUnsavedWarning(false);
    onOpenChange(false);
  }

  // ── Render ──────────────────────────────────────────────

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="flex max-h-[90vh] md:max-h-[85vh] w-full md:max-w-4xl lg:max-w-5xl xl:max-w-6xl flex-col gap-0 p-0 mx-auto md:bottom-4 md:rounded-xl md:border border-border/80 shadow-2xl">
        <DrawerHeaderSection
          wo={wo}
          loading={loading}
          mechanics={mechanics}
          saving={saving}
          onAssignMechanic={assignMechanic}
          onClose={() => handleOpenChange(false)}
          t={t}
        />

        <DrawerLoading
          loading={loading}
          hasLoadedOnce={hasLoadedOnce}
          error={error}
          onRetry={() => fetchWo()}
        />

        {/* Content — always rendered after first load (skeleton when refetching) */}
        {hasLoadedOnce && (
          <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
            <DrawerSkeleton
              loading={loading}
              error={error}
              onRetry={() => fetchWo()}
            >
              {wo ? (
                <>
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="px-3 py-2">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        <div className="lg:col-span-2">
                          <div className="flex flex-col gap-3">
                            <ServicesSection
                              services={wo.services ?? []}
                              catalog={catalog as any}
                              serviceSearch={serviceSearch}
                              showAddService={showAddService}
                              addingServiceId={addingServiceId}
                              pendingServicePreview={pendingServicePreview}
                              editingPriceId={editingServicePriceId}
                              editingPriceVal={editingServicePriceVal}
                              onServiceSearchChange={setServiceSearch}
                              onToggleAddService={() =>
                                setShowAddService(!showAddService)
                              }
                              onAddService={addService as any}
                              onRemoveService={removeService}
                              onEditPriceStart={(id, val) => {
                                setEditingServicePriceId(id);
                                setEditingServicePriceVal(val);
                              }}
                              onEditPriceChange={setEditingServicePriceVal}
                              onEditPriceSave={handleServicePriceSave}
                              onEditPriceCancel={() =>
                                setEditingServicePriceId(null)
                              }
                              t={t}
                            />

                            <PartsSection
                              parts={wo.parts ?? []}
                              partsCatalog={partsCatalog as any}
                              partSearch={partSearch}
                              newPartName={newPartName}
                              newPartQty={newPartQty}
                              newPartPrice={newPartPrice}
                              showAddPart={showAddPart}
                              addingPart={addingPart}
                              pendingPartPreview={pendingPartPreview}
                              editingPriceId={editingPartPriceId}
                              editingPriceVal={editingPartPriceVal}
                              onPartSearchChange={setPartSearch}
                              onNewPartNameChange={setNewPartName}
                              onNewPartQtyChange={setNewPartQty}
                              onNewPartPriceChange={setNewPartPrice}
                              onToggleAddPart={() =>
                                setShowAddPart(!showAddPart)
                              }
                              onAddPart={addPartLine}
                              onRemovePart={removePart}
                              onEditPriceStart={(id, val) => {
                                setEditingPartPriceId(id);
                                setEditingPartPriceVal(val);
                              }}
                              onEditPriceChange={setEditingPartPriceVal}
                              onEditPriceSave={handlePartPriceSave}
                              onEditPriceCancel={() =>
                                setEditingPartPriceId(null)
                              }
                              t={t}
                            />

                            <NotesSection
                              complaint={wo.complaint}
                              diagnosis={wo.diagnosis}
                              notes={wo.notes}
                              t={t}
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 lg:sticky lg:top-3 self-start">
                          <StatusTimeline
                            statusHistory={wo.status_history ?? []}
                            t={t}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mx-3 mb-3">
                    <TotalsSummary
                      servicesTotal={servicesTotal}
                      partsTotal={partsTotal}
                      grandTotal={Number(wo.total)}
                      t={t}
                    />
                  </div>

                  <DrawerFooter
                    wo={wo}
                    saving={saving}
                    confirmStatus={confirmStatus}
                    statusNotes={statusNotes}
                    creatingInvoice={creatingInvoice}
                    canCancel={canCancel}
                    canInvoice={canInvoice}
                    onChangeStatus={changeStatus}
                    onConfirmCancel={() => {
                      setConfirmStatus(null);
                      setStatusNotes("");
                    }}
                    onStatusNotesChange={setStatusNotes}
                    onMarkReady={handleReadyForPickup}
                    onComplete={() => setShowPickupForm(true)}
                    onCreateInvoice={generateInvoice}
                    t={t}
                  />
                </>
              ) : null}
            </DrawerSkeleton>
          </div>
        )}
        {/* Post-service form overlay inside drawer */}
        {showPostServiceForm && wo && (
          <PostServiceForm
            woId={workOrderId ?? ""}
            vehicleId={(wo.vehicle_id as string) ?? ""}
            vehiclePlate={
              (wo.vehicle as { plate_number?: string })?.plate_number ?? ""
            }
            currentOdometer={
              (wo.vehicle as { odometer?: number | null })?.odometer ?? null
            }
            services={postFormServices}
            newStatus="Ready for Pickup"
            onConfirm={handlePostServiceFormSubmit}
            onCancel={() => {
              setShowPostServiceForm(false);
              setPostFormServices([]);
            }}
          />
        )}

        {/* Pickup complete form overlay inside drawer */}
        {showPickupForm && wo && (
          <PickupCompleteForm
            woId={workOrderId ?? ""}
            vehiclePlate={
              (wo.vehicle as { plate_number?: string })?.plate_number ?? ""
            }
            totalCost={Number(wo.total ?? 0)}
            onConfirm={handlePickupSubmit}
            onCancel={() => setShowPickupForm(false)}
          />
        )}

        <UnsavedWarning
          show={showUnsavedWarning}
          onDiscard={handleDiscard}
          onKeepEditing={() => setShowUnsavedWarning(false)}
        />

        <DrawerCelebration show={showCelebration} message="Completed!" />
      </DrawerContent>
    </Drawer>
  );
}
