"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getWorkOrderServicesWithIntervals,
  savePostServiceData,
} from "@/lib/services/post-service-service";
import type { WorkOrderDetail } from "@/lib/types";

import type { CatalogServiceItem } from "./_drawer-types";
import type { PostServiceFormData } from "./_schema";

interface UseDrawerMutationsParams {
  workOrderId: string | null;
  orgIdRef: React.MutableRefObject<string | null>;
  wo: WorkOrderDetail | null;
  setWo: React.Dispatch<React.SetStateAction<WorkOrderDetail | null>>;
  fetchWo: (silent?: boolean, orgIdOverride?: string) => Promise<void>;
  onRefresh: () => void;
  onOpenChange: (open: boolean) => void;
}

export function useDrawerMutations({
  workOrderId,
  orgIdRef,
  wo,
  setWo,
  fetchWo,
  onRefresh,
  onOpenChange,
}: UseDrawerMutationsParams) {
  // ── Service state ──

  const [serviceSearch, setServiceSearch] = useState("");
  const [showAddService, setShowAddService] = useState(false);
  const [addingServiceId, setAddingServiceId] = useState<string | null>(null);

  // ── Part state ──

  const [newPartName, setNewPartName] = useState("");
  const [newPartQty, setNewPartQty] = useState(1);
  const [newPartPrice, setNewPartPrice] = useState(0);
  const [addingPart, setAddingPart] = useState(false);
  const [pendingPartPreview, setPendingPartPreview] = useState<{
    name: string;
    quantity: number;
    unitPrice: number;
  } | null>(null);
  const [partSearch, setPartSearch] = useState("");
  const [showAddPart, setShowAddPart] = useState(false);

  // ── Price editing state ──

  const [editingServicePriceId, setEditingServicePriceId] = useState<
    string | null
  >(null);
  const [editingServicePriceVal, setEditingServicePriceVal] = useState("");
  const [editingPartPriceId, setEditingPartPriceId] = useState<string | null>(
    null,
  );
  const [editingPartPriceVal, setEditingPartPriceVal] = useState("");

  // ── Saving / busy state ──

  const [saving, setSaving] = useState(false);

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

  // ── Status change confirmation ──

  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);
  const [statusNotes, setStatusNotes] = useState("");

  // ── Invoice ──

  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [invoicePublicToken, setInvoicePublicToken] = useState<string | null>(
    wo?.invoice_public_token ?? null,
  );

  // Sync invoice token from work order data (handles async load)
  useEffect(() => {
    setInvoicePublicToken(wo?.invoice_public_token ?? null);
  }, [wo?.invoice_public_token]);

  // ── Unsaved changes guard / celebration ──

  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [showCelebration, _setShowCelebration] = useState(false);

  // ── Status change ──

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
        await fetchWo(true);
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

  // ── Mechanic assignment ──

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
        await fetchWo(true);
        onRefresh();
      }
    } catch {
      toast.error("Failed to assign mechanic");
    } finally {
      setSaving(false);
    }
  }

  // ── Services ──

  // Optimistic add: service appears immediately with editable price
  function addService(svc: CatalogServiceItem) {
    const tempId = `temp-${crypto.randomUUID()}`;
    const defaultPrice = Number(svc.default_price ?? 0);
    setAddingServiceId(tempId);
    setEditingServicePriceId(tempId);
    setEditingServicePriceVal(String(defaultPrice));
    setWo((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        services: [
          ...(prev.services ?? []),
          {
            id: tempId,
            service_name: svc.name,
            service_catalog_id: svc._source === "global" ? null : svc.id,
            quantity: 1,
            unit_price: defaultPrice,
            final_price: defaultPrice,
            created_at: new Date().toISOString(),
          } as any,
        ],
      };
    });
    setServiceSearch("");
    setShowAddService(false);
  }

  // Confirm: send API request, replace temp with real data
  async function confirmAddService(serviceId: string, price: number) {
    const orgId = orgIdRef.current;
    if (!orgId || !workOrderId) return;
    const svc = wo?.services?.find((s) => s.id === serviceId);
    if (!svc) return;
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${workOrderId}/services`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service_catalog_id: (svc as any).service_catalog_id ?? null,
            service_name: svc.service_name,
            quantity: svc.quantity ?? 1,
            unit_price: price,
          }),
        },
      );
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message ?? "Failed to add service");
        // Rollback: remove temp service
        setWo((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            services: (prev.services ?? []).filter((s) => s.id !== serviceId),
          };
        });
        return;
      }
      // Replace temp with real server data
      const newService = json.data;
      setWo((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          services: (prev.services ?? []).map((s) =>
            s.id === serviceId ? newService : s,
          ),
        };
      });
      toast.success(`Added service: ${svc.service_name}`);
      onRefresh();
    } catch {
      toast.error("Failed to add service");
      // Rollback
      setWo((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          services: (prev.services ?? []).filter((s) => s.id !== serviceId),
        };
      });
    } finally {
      setAddingServiceId(null);
      setEditingServicePriceId(null);
    }
  }

  async function removeService(serviceId: string) {
    const orgId = orgIdRef.current;
    const service = wo?.services?.find((s) => s.id === serviceId);
    if (!orgId || !workOrderId || !service) return;

    const serviceData = {
      service_catalog_id: (service as any).service_catalog_id ?? null,
      service_name: service.service_name,
      quantity: (service as any).quantity ?? 1,
      unit_price: Number(
        (service as any).final_price ?? (service as any).unit_price ?? 0,
      ),
    };

    // Optimistically remove from UI
    setWo((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        services: (prev.services ?? []).filter((s) => s.id !== serviceId),
      };
    });

    try {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${workOrderId}/services?serviceId=${serviceId}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message ?? "Failed to remove service");
        // Rollback
        setWo((prev) => {
          if (!prev) return prev;
          return { ...prev, services: [...(prev.services ?? []), service] };
        });
        return;
      }

      toast("Service removed", {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              const addRes = await fetch(
                `/api/organizations/${orgId}/work-orders/${workOrderId}/services`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(serviceData),
                },
              );
              const addJson = await addRes.json();
              if (addJson.data) {
                setWo((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    services: [...(prev.services ?? []), addJson.data],
                  };
                });
                onRefresh();
              }
            } catch {
              toast.error("Failed to restore service");
            }
          },
        },
        duration: 5000,
      });
      onRefresh();
    } catch {
      toast.error("Failed to remove service");
      // Rollback
      setWo((prev) => {
        if (!prev) return prev;
        return { ...prev, services: [...(prev.services ?? []), service] };
      });
    }
  }

  // ── Parts ──

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

  async function removePart(partId: string) {
    const orgId = orgIdRef.current;
    const part = wo?.parts?.find((p) => p.id === partId);
    if (!orgId || !workOrderId || !part) return;

    const partData = {
      part_name: part.part_name,
      quantity: (part as any).quantity ?? 1,
      unit_price: Number(
        (part as any).final_price ?? (part as any).unit_price ?? 0,
      ),
    };

    // Optimistically remove from UI
    setWo((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        parts: (prev.parts ?? []).filter((p) => p.id !== partId),
      };
    });

    try {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${workOrderId}/parts?partId=${partId}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message ?? "Failed to remove part");
        // Rollback
        setWo((prev) => {
          if (!prev) return prev;
          return { ...prev, parts: [...(prev.parts ?? []), part] };
        });
        return;
      }

      toast("Part removed", {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              const addRes = await fetch(
                `/api/organizations/${orgId}/work-orders/${workOrderId}/parts`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(partData),
                },
              );
              const addJson = await addRes.json();
              if (addJson.data) {
                setWo((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    parts: [...(prev.parts ?? []), addJson.data],
                  };
                });
                onRefresh();
              }
            } catch {
              toast.error("Failed to restore part");
            }
          },
        },
        duration: 5000,
      });
      onRefresh();
    } catch {
      toast.error("Failed to remove part");
      // Rollback
      setWo((prev) => {
        if (!prev) return prev;
        return { ...prev, parts: [...(prev.parts ?? []), part] };
      });
    }
  }

  // ── Price editing ──

  async function handleServicePriceSave(serviceId: string, price: number) {
    // Temp services: confirm the add via API
    if (serviceId.startsWith("temp-")) {
      await confirmAddService(serviceId, price);
      return;
    }

    const orgId = orgIdRef.current;
    if (!orgId || !workOrderId) return;
    const numVal = price;
    if (Number.isNaN(numVal) || numVal < 0) {
      toast.error("Invalid price");
      return;
    }

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

  // ── Invoice ──

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
        setInvoicePublicToken(json.data.public_token);
        window.open(`/invoice/${json.data.public_token}`, "_blank");
      }
    } catch {
      toast.error("Failed to create invoice");
    } finally {
      setCreatingInvoice(false);
    }
  }

  // ── Post-service form ──

  const handleCancelPostService = () => {
    setShowPostServiceForm(false);
    setPostFormServices([]);
  };

  async function handleReadyForPickup() {
    if (!workOrderId || !wo?.vehicle_id) {
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
        await fetchWo(true);
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

  // ── Status transitions ──

  const canCancel: boolean =
    !!wo?.status && !["Completed", "Cancelled"].includes(wo.status ?? "");
  const canInvoice: boolean =
    wo?.status === "Completed" || wo?.status === "Ready for Pickup";

  // ── Computed ──

  const isDirty = (showAddPart && newPartName.trim() !== "") || showAddService;

  // ── Drawer close handlers ──

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      const hasPriceEdit =
        editingServicePriceId !== null || editingPartPriceId !== null;

      if (hasPriceEdit) {
        setEditingServicePriceId(null);
        setEditingPartPriceId(null);
      }

      if (isDirty) {
        setShowUnsavedWarning(true);
        return;
      }

      if (hasPriceEdit) {
        setTimeout(() => onOpenChange(false), 100);
        return;
      }
    }
    onOpenChange(nextOpen);
  }

  function handleSaveAndClose() {
    if (showAddPart && newPartName.trim()) {
      addPartLine();
    }
    setShowAddPart(false);
    setShowAddService(false);
    setNewPartName("");
    setShowUnsavedWarning(false);
    onOpenChange(false);
  }

  function handleDiscard() {
    setShowAddPart(false);
    setShowAddService(false);
    setNewPartName("");
    setShowUnsavedWarning(false);
    onOpenChange(false);
  }

  return {
    // State
    saving,
    serviceSearch,
    setServiceSearch,
    showAddService,
    setShowAddService,
    addingServiceId,
    editingServicePriceId,
    setEditingServicePriceId,
    editingServicePriceVal,
    setEditingServicePriceVal,
    newPartName,
    setNewPartName,
    newPartQty,
    setNewPartQty,
    newPartPrice,
    setNewPartPrice,
    showAddPart,
    setShowAddPart,
    addingPart,
    pendingPartPreview,
    partSearch,
    setPartSearch,
    editingPartPriceId,
    setEditingPartPriceId,
    editingPartPriceVal,
    setEditingPartPriceVal,
    confirmStatus,
    setConfirmStatus,
    statusNotes,
    setStatusNotes,
    creatingInvoice,
    invoicePublicToken,
    showPostServiceForm,
    postFormServices,
    showUnsavedWarning,
    setShowUnsavedWarning,
    showCelebration,
    // Handlers
    addService,
    removeService,
    handleServicePriceSave,
    addPartLine,
    removePart,
    handlePartPriceSave,
    assignMechanic,
    changeStatus,
    generateInvoice,
    handleReadyForPickup,
    handlePostServiceFormSubmit,
    handleCancelPostService,
    handleOpenChange,
    handleSaveAndClose,
    handleDiscard,
    // Computed
    canCancel,
    canInvoice,
    isDirty,
  };
}
