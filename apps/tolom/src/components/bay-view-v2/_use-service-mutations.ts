"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { WorkOrderDetail, WorkOrderService } from "@/lib/types";
import type { CatalogServiceItem } from "./_drawer-types";

// ─── Params ────────────────────────────────────────────────────────────

interface UseServiceMutationsParams {
  workOrderId: string | null;
  orgIdRef: React.MutableRefObject<string | null>;
  wo: WorkOrderDetail | null;
  setWo: React.Dispatch<React.SetStateAction<WorkOrderDetail | null>>;
  onRefresh: () => void;
}

// Variant fields exist at runtime on work_order_services records but are
// not in the generated Supabase types.
type ServiceWithVariants = WorkOrderService & {
  catalog_item_variant_id?: string | null;
  variant_label?: string | null;
};

// ─── Hook ──────────────────────────────────────────────────────────────

export function useServiceMutations({
  workOrderId,
  orgIdRef,
  wo,
  setWo,
  onRefresh,
}: UseServiceMutationsParams) {
  // ── State ──

  const [serviceSearch, setServiceSearch] = useState("");
  const [showAddService, setShowAddService] = useState(false);
  const [addingServiceIds, setAddingServiceIds] = useState<Set<string>>(
    new Set(),
  );
  const [confirmingServiceIds, setConfirmingServiceIds] = useState<
    Set<string>
  >(new Set());

  // ── Optimistic add ──

  function addService(svc: CatalogServiceItem) {
    const tempId = `temp-${Math.random().toString(36).slice(2, 11)}`;
    const price = Number(svc.last_price ?? svc.default_price ?? 0);
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
            unit_price: price,
            final_price: price,
            discount_amount: 0,
            discount_percentage: 0,
            unit_cost: 0,
            last_sold_price: svc.last_price ?? null,
            notes: null,
            description: null,
            mechanic_id: null,
            work_order_id: workOrderId,
            organization_id: null,
            created_by: null,
            created_at: new Date().toISOString(),
            name_mn: svc.name_mn ?? null,
            catalog_item_variant_id: (svc as Record<string, unknown>)
              .variant_id as string | null | undefined ?? null,
            variant_label: (svc as Record<string, unknown>)
              .variant_label as string | null | undefined ?? null,
          } satisfies WorkOrderService & { name_mn?: string | null },
        ],
      };
    });
    setServiceSearch("");
    setShowAddService(false);
  }

  // ── Confirm add (API call, replace temp with real) ──

  async function confirmAddService(serviceId: string, price: number) {
    const orgId = orgIdRef.current;
    if (!orgId || !workOrderId) return;
    const svc = wo?.services?.find((s) => s.id === serviceId);
    if (!svc) return;
    setConfirmingServiceIds((prev) => new Set([...prev, serviceId]));
    try {
      const svcWithVariants = svc as ServiceWithVariants;
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${workOrderId}/services`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service_catalog_id: svcWithVariants.service_catalog_id ?? null,
            service_name: svc.service_name,
            quantity: svc.quantity ?? 1,
            unit_price: price,
            catalog_item_variant_id:
              svcWithVariants.catalog_item_variant_id ?? null,
            variant_label: svcWithVariants.variant_label ?? null,
          }),
        },
      );
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message ?? "Failed to add service");
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

  // ── Remove ──

  async function removeService(serviceId: string) {
    const orgId = orgIdRef.current;
    const service = wo?.services?.find((s) => s.id === serviceId);
    if (!orgId || !workOrderId || !service) return;

    if (serviceId.startsWith("temp-")) {
      setWo((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          services: (prev.services ?? []).filter((s) => s.id !== serviceId),
        };
      });
      return;
    }

    const svcWithVariants = service as ServiceWithVariants;
    const serviceData = {
      service_catalog_id: svcWithVariants.service_catalog_id ?? null,
      service_name: service.service_name,
      quantity: svcWithVariants.quantity ?? 1,
      unit_price: Number(
        svcWithVariants.final_price ?? svcWithVariants.unit_price ?? 0,
      ),
    };

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
        setWo((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            services: [...(prev.services ?? []), service],
          };
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
      setWo((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          services: [...(prev.services ?? []), service],
        };
      });
    }
  }

  // ── Price edit ──

  async function handleServicePriceSave(serviceId: string, price: number) {
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

    setWo((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        services: (prev.services ?? []).map((s) =>
          s.id === serviceId ? { ...s, final_price: numVal } : s,
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
              services: (prev.services ?? []).map((s) =>
                s.id === serviceId ? { ...s, final_price: oldPrice } : s,
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
            services: (prev.services ?? []).map((s) =>
              s.id === serviceId ? { ...s, final_price: oldPrice } : s,
            ),
          };
        });
      }
    }
  }

  // ── Quantity edit ──

  async function handleServiceQtySave(serviceId: string, qty: number) {
    if (serviceId.startsWith("temp-")) {
      const svc = wo?.services?.find((s) => s.id === serviceId);
      const price = svc
        ? Number(svc.final_price ?? svc.unit_price ?? 0)
        : 0;
      await confirmAddService(serviceId, price);
      return;
    }

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

  // ── Discount edit ──

  async function handleServiceDiscountSave(
    serviceId: string,
    discountAmount: number,
    discountPercent: number,
  ) {
    const orgId = orgIdRef.current;
    if (!orgId || !workOrderId) return;

    const originalService = wo?.services?.find((s) => s.id === serviceId);
    const oldAmount = originalService?.discount_amount ?? 0;
    const oldPercent = originalService?.discount_percentage ?? 0;

    setWo((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        services: (prev.services ?? []).map((s) =>
          s.id === serviceId
            ? {
                ...s,
                discount_amount: discountAmount,
                discount_percentage: discountPercent,
                final_price: Math.max(
                  0,
                  Number(s.unit_price ?? 0) * Number(s.quantity ?? 1) -
                    discountAmount,
                ),
              }
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
          body: JSON.stringify({
            discount_amount: discountAmount,
            discount_percentage: discountPercent,
          }),
        },
      );
      const json = await res.json();
      if (json.error) {
        setWo((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            services: (prev.services ?? []).map((s) =>
              s.id === serviceId
                ? {
                    ...s,
                    discount_amount: oldAmount,
                    discount_percentage: oldPercent,
                    final_price:
                      Number(s.unit_price ?? 0) *
                        Number(s.quantity ?? 1) -
                      Number(oldAmount),
                  }
                : s,
            ),
          };
        });
        toast.error(json.error.message ?? "Failed to update discount");
        return;
      }
      toast.dismiss();
      toast.success("Discount updated");
      onRefresh();
    } catch {
      setWo((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          services: (prev.services ?? []).map((s) =>
            s.id === serviceId
              ? {
                  ...s,
                  discount_amount: oldAmount,
                  discount_percentage: oldPercent,
                  final_price:
                    Number(s.unit_price ?? 0) * Number(s.quantity ?? 1) -
                    Number(oldAmount),
                }
              : s,
          ),
        };
      });
      toast.error("Failed to update discount");
    }
  }

  // ── Return ──

  return {
    serviceSearch,
    setServiceSearch,
    showAddService,
    setShowAddService,
    addingServiceIds,
    confirmingServiceIds,
    addService,
    removeService,
    handleServicePriceSave,
    handleServiceQtySave,
    handleServiceDiscountSave,
  };
}
