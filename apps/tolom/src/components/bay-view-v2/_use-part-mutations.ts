"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useOrgMutation } from "@zuiio/query";
import { bayViewKeys, workOrderKeys } from "@/lib/queries/keys";
import type { WorkOrderDetail, WorkOrderPart } from "@/lib/types";
import type { CatalogPartItem } from "./_drawer-types";

// ─── Params ────────────────────────────────────────────────────────────

interface UsePartMutationsParams {
  workOrderId: string | null;
  orgIdRef: React.MutableRefObject<string | null>;
  orgId: string | undefined;
  branchId: string | undefined;
  wo: WorkOrderDetail | null;
  setWo: React.Dispatch<React.SetStateAction<WorkOrderDetail | null>>;
  onRefresh: () => void;
}

// Variant fields exist at runtime on work_order_parts records but are not
// in the generated Supabase types.
type PartWithVariants = WorkOrderPart & {
  catalog_item_variant_id?: string | null;
  variant_label?: string | null;
};

// ─── Hook ──────────────────────────────────────────────────────────────

export function usePartMutations({
  workOrderId,
  orgIdRef,
  orgId,
  branchId,
  wo,
  setWo,
  onRefresh,
}: UsePartMutationsParams) {
  // ── State ──

  const [partSearch, setPartSearch] = useState("");
  const [showAddPart, setShowAddPart] = useState(false);
  const [addingPartIds, setAddingPartIds] = useState<Set<string>>(new Set());

  // ── Mutation hooks ──

  const createPartMutation = useOrgMutation<
    WorkOrderPart,
    {
      part_id: string | null;
      part_name: string;
      quantity: number;
      unit_price: number;
      catalog_item_variant_id?: string | null;
      variant_label?: string | null;
    }
  >({
    endpoint: () =>
      `/api/organizations/${orgIdRef.current}/work-orders/${workOrderId}/parts`,
    method: "POST",
    queryKey: workOrderKeys.all(orgId ?? ""),
    invalidateKeys: branchId
      ? ([bayViewKeys.data(branchId)] as const)
      : undefined,
  });

  const deletePartMutation = useOrgMutation<
    unknown,
    { partId: string }
  >({
    endpoint: (vars) =>
      `/api/organizations/${orgIdRef.current}/work-orders/${workOrderId}/parts?partId=${vars.partId}`,
    method: "DELETE",
    queryKey: workOrderKeys.all(orgId ?? ""),
    invalidateKeys: branchId
      ? ([bayViewKeys.data(branchId)] as const)
      : undefined,
  });

  const updatePartMutation = useOrgMutation<
    unknown,
    { partId: string; body: Record<string, unknown> }
  >({
    endpoint: (vars) =>
      `/api/organizations/${orgIdRef.current}/work-orders/${workOrderId}/parts?partId=${vars.partId}`,
    method: "PATCH",
    queryKey: workOrderKeys.all(orgId ?? ""),
    invalidateKeys: branchId
      ? ([bayViewKeys.data(branchId)] as const)
      : undefined,
  });

  // ── Optimistic add ──

  function addPart(item: CatalogPartItem) {
    const tempId = `temp-${Math.random().toString(36).slice(2, 11)}`;
    const price = Number(item.last_price ?? item.default_price ?? 0);
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
            unit_price: price,
            final_price: price,
            discount_amount: 0,
            discount_percentage: 0,
            unit_cost: 0,
            last_sold_price: item.last_price ?? null,
            notes: null,
            part_number: null,
            work_order_id: workOrderId,
            organization_id: null,
            created_by: null,
            created_at: new Date().toISOString(),
            name_mn: item.name_mn ?? null,
            catalog_item_variant_id: (item as Record<string, unknown>)
              .variant_id as string | null | undefined ?? null,
            variant_label: (item as Record<string, unknown>)
              .variant_label as string | null | undefined ?? null,
          } satisfies WorkOrderPart & { name_mn?: string | null },
        ],
      };
    });
    setPartSearch("");
    setShowAddPart(false);
  }

  // ── Confirm add (API call, replace temp with real) ──

  async function confirmAddPart(partId: string, price: number) {
    const orgIdCurrent = orgIdRef.current;
    if (!orgIdCurrent || !workOrderId) return;
    const part = wo?.parts?.find((p) => p.id === partId);
    if (!part) return;

    const partWithVariants = part as PartWithVariants;
    try {
      const newPart = await createPartMutation.mutateAsync({
        part_id: partWithVariants.part_id ?? null,
        part_name: part.part_name,
        quantity: part.quantity ?? 1,
        unit_price: price,
        catalog_item_variant_id:
          partWithVariants.catalog_item_variant_id ?? null,
        variant_label: partWithVariants.variant_label ?? null,
      });
      setWo((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          parts: (prev.parts ?? []).map((p) =>
            p.id === partId ? newPart : p,
          ),
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

  // ── Remove ──

  async function removePart(partId: string) {
    const orgIdCurrent = orgIdRef.current;
    const part = wo?.parts?.find((p) => p.id === partId);
    if (!orgIdCurrent || !workOrderId || !part) return;

    if (partId.startsWith("temp-")) {
      setWo((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          parts: (prev.parts ?? []).filter((p) => p.id !== partId),
        };
      });
      return;
    }

    const partWithVariants = part as PartWithVariants;
    const partData = {
      part_name: part.part_name,
      quantity: partWithVariants.quantity ?? 1,
      unit_price: Number(
        partWithVariants.final_price ?? partWithVariants.unit_price ?? 0,
      ),
    };

    setWo((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        parts: (prev.parts ?? []).filter((p) => p.id !== partId),
      };
    });

    try {
      await deletePartMutation.mutateAsync({ partId });

      toast("Part removed", {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              const restoredPart = await createPartMutation.mutateAsync({
                part_id: partWithVariants.part_id ?? null,
                part_name: partData.part_name,
                quantity: partData.quantity,
                unit_price: partData.unit_price,
                catalog_item_variant_id:
                  partWithVariants.catalog_item_variant_id ?? null,
                variant_label: partWithVariants.variant_label ?? null,
              });
              if (restoredPart) {
                setWo((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    parts: [...(prev.parts ?? []), restoredPart],
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
      setWo((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          parts: [...(prev.parts ?? []), part],
        };
      });
    }
  }

  // ── Price edit ──

  async function handlePartPriceSave(partId: string, price: number) {
    if (partId.startsWith("temp-")) {
      await confirmAddPart(partId, price);
      return;
    }

    const orgIdCurrent = orgIdRef.current;
    if (!orgIdCurrent || !workOrderId) return;
    const numVal = price;
    if (Number.isNaN(numVal) || numVal < 0) {
      toast.error("Invalid price");
      return;
    }

    const originalPart = wo?.parts?.find((p) => p.id === partId);
    const oldPrice = originalPart ? Number(originalPart.final_price) : null;

    setWo((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        parts: (prev.parts ?? []).map((p) =>
          p.id === partId ? { ...p, final_price: numVal } : p,
        ),
      };
    });

    try {
      await updatePartMutation.mutateAsync({
        partId,
        body: { final_price: numVal },
      });
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
            parts: (prev.parts ?? []).map((p) =>
              p.id === partId ? { ...p, final_price: oldPrice } : p,
            ),
          };
        });
      }
    }
  }

  // ── Quantity edit ──

  async function handlePartQtySave(partId: string, qty: number) {
    if (partId.startsWith("temp-")) {
      const part = wo?.parts?.find((p) => p.id === partId);
      const price = part
        ? Number(part.final_price ?? part.unit_price ?? 0)
        : 0;
      await confirmAddPart(partId, price);
      return;
    }

    const orgIdCurrent = orgIdRef.current;
    if (!orgIdCurrent || !workOrderId) return;
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
      await updatePartMutation.mutateAsync({
        partId,
        body: { quantity: numVal },
      });
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

  // ── Discount edit ──

  async function handlePartDiscountSave(
    partId: string,
    discountAmount: number,
    discountPercent: number,
  ) {
    const orgIdCurrent = orgIdRef.current;
    if (!orgIdCurrent || !workOrderId) return;

    const originalPart = wo?.parts?.find((p) => p.id === partId);
    const oldAmount = originalPart?.discount_amount ?? 0;
    const oldPercent = originalPart?.discount_percentage ?? 0;

    setWo((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        parts: (prev.parts ?? []).map((p) =>
          p.id === partId
            ? {
                ...p,
                discount_amount: discountAmount,
                discount_percentage: discountPercent,
                final_price: Math.max(
                  0,
                  Number(p.unit_price ?? 0) * Number(p.quantity ?? 1) -
                    discountAmount,
                ),
              }
            : p,
        ),
      };
    });

    try {
      await updatePartMutation.mutateAsync({
        partId,
        body: {
          discount_amount: discountAmount,
          discount_percentage: discountPercent,
        },
      });
      toast.dismiss();
      toast.success("Discount updated");
      onRefresh();
    } catch {
      setWo((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          parts: (prev.parts ?? []).map((p) =>
            p.id === partId
              ? {
                  ...p,
                  discount_amount: oldAmount,
                  discount_percentage: oldPercent,
                  final_price:
                    Number(p.unit_price ?? 0) * Number(p.quantity ?? 1) -
                    Number(oldAmount),
                }
              : p,
          ),
        };
      });
      toast.error("Failed to update discount");
    }
  }

  // ── Return ──

  return {
    partSearch,
    setPartSearch,
    showAddPart,
    setShowAddPart,
    addingPartIds,
    addPart,
    removePart,
    handlePartPriceSave,
    handlePartQtySave,
    handlePartDiscountSave,
  };
}
