"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getWorkOrderServicesWithIntervals,
  savePostServiceData,
} from "@/lib/services/post-service-service";
import type {
  WorkOrderDetail,
  WorkOrderPart,
  WorkOrderService,
} from "@/lib/types";

import type { CatalogPartItem, CatalogServiceItem } from "./_drawer-types";
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
  const [addingServiceIds, setAddingServiceIds] = useState<Set<string>>(
    new Set(),
  );
  const [confirmingServiceIds, setConfirmingServiceIds] = useState<Set<string>>(
    new Set(),
  );

  // ── Part state ──

  const [partSearch, setPartSearch] = useState("");
  const [showAddPart, setShowAddPart] = useState(false);
  const [addingPartIds, setAddingPartIds] = useState<Set<string>>(new Set());

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
        toast.dismiss();
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
    const tempId = `temp-${Math.random().toString(36).slice(2, 11)}`;
    const defaultPrice = Number(svc.default_price ?? 0);
    setAddingServiceIds((prev) => new Set([...prev, tempId]));
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
            discount_amount: 0,
            discount_percentage: 0,
            unit_cost: 0,
            last_sold_price: null,
            notes: null,
            description: null,
            mechanic_id: null,
            work_order_id: workOrderId,
            organization_id: null,
            created_by: null,
            created_at: new Date().toISOString(),
          } as WorkOrderService,
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
    setConfirmingServiceIds((prev) => new Set([...prev, serviceId]));
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
        setAddingServiceIds((prev) => {
          const next = new Set(prev);
          next.delete(serviceId);
          return next;
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
      toast.dismiss();
      toast.success(`Added service: ${svc.service_name}`);
      onRefresh();
      setAddingServiceIds((prev) => {
        const next = new Set(prev);
        next.delete(serviceId);
        return next;
      });
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
      setAddingServiceIds((prev) => {
        const next = new Set(prev);
        next.delete(serviceId);
        return next;
      });
    } finally {
      setConfirmingServiceIds((prev) => {
        const next = new Set(prev);
        next.delete(serviceId);
        return next;
      });
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

  // Optimistic add: part appears immediately with editable price
  function addPart(item: CatalogPartItem) {
    const tempId = `temp-${Math.random().toString(36).slice(2, 11)}`;
    const defaultPrice = Number(item.default_price ?? 0);
    setAddingPartIds((prev) => new Set([...prev, tempId]));
    setWo((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        parts: [
          ...(prev.parts ?? []),
          {
            id: tempId,
            part_name: item.name,
            part_id: item._source === "global" ? null : item.id,
            quantity: 1,
            unit_price: defaultPrice,
            final_price: defaultPrice,
            discount_amount: 0,
            discount_percentage: 0,
            unit_cost: 0,
            last_sold_price: null,
            notes: null,
            part_number: null,
            work_order_id: workOrderId,
            organization_id: null,
            created_by: null,
            created_at: new Date().toISOString(),
          } as WorkOrderPart,
        ],
      };
    });
    setPartSearch("");
    setShowAddPart(false);
  }

  // Confirm: send API request, replace temp with real data
  async function confirmAddPart(partId: string, price: number) {
    const orgId = orgIdRef.current;
    if (!orgId || !workOrderId) return;
    const part = wo?.parts?.find((p) => p.id === partId);
    if (!part) return;
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${workOrderId}/parts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            part_id: (part as any).part_id ?? null,
            part_name: part.part_name,
            quantity: part.quantity ?? 1,
            unit_price: price,
          }),
        },
      );
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message ?? "Failed to add part");
        // Rollback: remove temp part
        setWo((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            parts: (prev.parts ?? []).filter((p) => p.id !== partId),
          };
        });
        setAddingPartIds((prev) => {
          const next = new Set(prev);
          next.delete(partId);
          return next;
        });
        return;
      }
      // Replace temp with real server data
      const newPart = json.data;
      setWo((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          parts: (prev.parts ?? []).map((p) => (p.id === partId ? newPart : p)),
        };
      });
      toast.dismiss();
      toast.success(`Added part: ${part.part_name}`);
      onRefresh();
      setAddingPartIds((prev) => {
        const next = new Set(prev);
        next.delete(partId);
        return next;
      });
    } catch {
      toast.error("Failed to add part");
      // Rollback
      setWo((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          parts: (prev.parts ?? []).filter((p) => p.id !== partId),
        };
      });
      setAddingPartIds((prev) => {
        const next = new Set(prev);
        next.delete(partId);
        return next;
      });
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
      toast.dismiss();
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

  async function handlePartPriceSave(partId: string, price: number) {
    // Temp parts: confirm the add via API
    if (partId.startsWith("temp-")) {
      await confirmAddPart(partId, price);
      return;
    }

    const orgId = orgIdRef.current;
    if (!orgId || !workOrderId) return;
    const numVal = price;
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
      toast.dismiss();
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

  // ── Quantity editing ──

  async function handleServiceQtySave(serviceId: string, qty: number) {
    const orgId = orgIdRef.current;
    if (!orgId || !workOrderId) return;
    const numVal = qty;
    if (Number.isNaN(numVal) || numVal < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    const originalService = wo?.services?.find((s) => s.id === serviceId);
    const oldQty = originalService ? Number(originalService.quantity) : null;
    const oldFinalPrice = originalService
      ? Number(originalService.final_price)
      : null;

    // Optimistic: compute new final_price from unit_price * newQty
    const unitPrice = originalService ? Number(originalService.unit_price) : 0;
    const newFinalPrice = unitPrice * numVal;

    setWo((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        services: (prev.services ?? []).map((s) =>
          s.id === serviceId
            ? { ...s, quantity: numVal, final_price: newFinalPrice }
            : s,
        ),
      };
    });

    try {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${workOrderId}/services?serviceId=${serviceId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: numVal }),
        },
      );
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message ?? "Failed to update quantity");
        setWo((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            services: (prev.services ?? []).map((s) =>
              s.id === serviceId
                ? {
                    ...s,
                    quantity: oldQty ?? 1,
                    final_price: oldFinalPrice ?? 0,
                  }
                : s,
            ),
          };
        });
        return;
      }
      toast.dismiss();
      toast.success("Quantity updated");
      onRefresh();
    } catch {
      toast.error("Failed to update quantity");
      setWo((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          services: (prev.services ?? []).map((s) =>
            s.id === serviceId
              ? {
                  ...s,
                  quantity: oldQty ?? 1,
                  final_price: oldFinalPrice ?? 0,
                }
              : s,
          ),
        };
      });
    }
  }

  async function handlePartQtySave(partId: string, qty: number) {
    // Temp parts: confirm the add via API with current price, then update qty
    if (partId.startsWith("temp-")) {
      const part = wo?.parts?.find((p) => p.id === partId);
      const price = part ? Number(part.final_price ?? part.unit_price ?? 0) : 0;
      await confirmAddPart(partId, price);
      return;
    }

    const orgId = orgIdRef.current;
    if (!orgId || !workOrderId) return;
    const numVal = qty;
    if (Number.isNaN(numVal) || numVal < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    const originalPart = wo?.parts?.find((p) => p.id === partId);
    const oldQty = originalPart ? Number(originalPart.quantity) : null;
    const oldFinalPrice = originalPart
      ? Number(originalPart.final_price)
      : null;

    const unitPrice = originalPart ? Number(originalPart.unit_price) : 0;
    const newFinalPrice = unitPrice * numVal;

    setWo((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        parts: (prev.parts ?? []).map((p) =>
          p.id === partId
            ? { ...p, quantity: numVal, final_price: newFinalPrice }
            : p,
        ),
      };
    });

    try {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${workOrderId}/parts?partId=${partId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: numVal }),
        },
      );
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message ?? "Failed to update quantity");
        setWo((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            parts: (prev.parts ?? []).map((p) =>
              p.id === partId
                ? {
                    ...p,
                    quantity: oldQty ?? 1,
                    final_price: oldFinalPrice ?? 0,
                  }
                : p,
            ),
          };
        });
        return;
      }
      toast.dismiss();
      toast.success("Quantity updated");
      onRefresh();
    } catch {
      toast.error("Failed to update quantity");
      setWo((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          parts: (prev.parts ?? []).map((p) =>
            p.id === partId
              ? {
                  ...p,
                  quantity: oldQty ?? 1,
                  final_price: oldFinalPrice ?? 0,
                }
              : p,
          ),
        };
      });
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
        toast.dismiss();
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

  // ── Customer assignment ──

  async function assignCustomer(customerId: string | null) {
    const orgId = orgIdRef.current;
    if (!orgId || !workOrderId) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${workOrderId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customer_id: customerId }),
        },
      );
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message ?? "Failed to assign customer");
      } else {
        await fetchWo(true);
        onRefresh();
        toast.dismiss();
        if (customerId) {
          toast.success("Customer assigned");
        }
      }
    } catch {
      toast.error("Failed to assign customer");
    } finally {
      setSaving(false);
    }
  }

  // ── Status transitions ──

  const canCancel: boolean =
    !!wo?.status && !["Completed", "Cancelled"].includes(wo.status ?? "");
  const canInvoice: boolean =
    wo?.status === "Completed" || wo?.status === "Ready for Pickup";

  // ── Computed ──

  const isDirty = showAddService || showAddPart;

  // ── Drawer close handlers ──

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isDirty) {
      setShowUnsavedWarning(true);
      return;
    }
    onOpenChange(nextOpen);
  }

  function handleSaveAndClose() {
    setShowAddPart(false);
    setShowAddService(false);
    setShowUnsavedWarning(false);
    onOpenChange(false);
  }

  function handleDiscard() {
    setShowAddPart(false);
    setShowAddService(false);
    setShowUnsavedWarning(false);
    onOpenChange(false);
  }

  return {
    // State
    saving,
    isConfirming: confirmingServiceIds.size > 0,
    serviceSearch,
    setServiceSearch,
    showAddService,
    setShowAddService,
    addingServiceIds,
    showAddPart,
    setShowAddPart,
    addingPartIds,
    partSearch,
    setPartSearch,
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
    assignCustomer,
    addService,
    removeService,
    handleServicePriceSave,
    handleServiceQtySave,
    addPart,
    removePart,
    handlePartPriceSave,
    handlePartQtySave,
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
