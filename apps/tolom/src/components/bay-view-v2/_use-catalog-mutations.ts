"use client";

import { useOrgMutation } from "@zuiio/query";
import { useState } from "react";
import { toast } from "sonner";
import { bayViewKeys, workOrderKeys } from "@/lib/queries/keys";
import { reportServerError } from "@/lib/sentry-report-server";
import type {
  WorkOrderDetail,
  WorkOrderPart,
  WorkOrderService,
} from "@/lib/types";
import type { CatalogPartItem, CatalogServiceItem } from "./_drawer-types";

// ─── Types ──────────────────────────────────────────────────────────────

type EntityKind = "service" | "part";
type CollectionKey = "services" | "parts";

type ItemWithVariants = (WorkOrderService | WorkOrderPart) & {
  catalog_item_variant_id?: string | null;
  variant_label?: string | null;
};

type Item = Record<string, unknown>;

interface SharedParams {
  workOrderId: string | null;
  orgIdRef: React.MutableRefObject<string | null>;
  orgId: string | undefined;
  branchId: string | undefined;
  wo: WorkOrderDetail | null;
  setWo: React.Dispatch<React.SetStateAction<WorkOrderDetail | null>>;
  onRefresh: () => void;
}

interface ServiceRet {
  serviceSearch: string;
  setServiceSearch: React.Dispatch<React.SetStateAction<string>>;
  showAddService: boolean;
  setShowAddService: React.Dispatch<React.SetStateAction<boolean>>;
  addingServiceIds: Set<string>;
  confirmingServiceIds: Set<string>;
  addService: (item: CatalogServiceItem) => void;
  removeService: (id: string) => Promise<void>;
  handleServicePriceSave: (id: string, price: number) => Promise<void>;
  handleServiceQtySave: (id: string, qty: number) => Promise<void>;
  handleServiceDiscountSave: (
    id: string,
    amount: number,
    percent: number,
  ) => Promise<void>;
  lastAddedServiceId: string | null;
}

interface PartRet {
  partSearch: string;
  setPartSearch: React.Dispatch<React.SetStateAction<string>>;
  showAddPart: boolean;
  setShowAddPart: React.Dispatch<React.SetStateAction<boolean>>;
  addingPartIds: Set<string>;
  addPart: (item: CatalogPartItem) => void;
  removePart: (id: string) => Promise<void>;
  handlePartPriceSave: (id: string, price: number) => Promise<void>;
  handlePartQtySave: (id: string, qty: number) => Promise<void>;
  handlePartDiscountSave: (
    id: string,
    amount: number,
    percent: number,
  ) => Promise<void>;
  lastAddedPartId: string | null;
}

type Ret<T extends EntityKind> = T extends "service" ? ServiceRet : PartRet;

// ─── Helpers ────────────────────────────────────────────────────────────

function col(entity: EntityKind): CollectionKey {
  return entity === "service" ? "services" : "parts";
}
function apiPath(entity: EntityKind): string {
  return entity === "service" ? "services" : "parts";
}
function idParam(entity: EntityKind): string {
  return entity === "service" ? "serviceId" : "partId";
}
function label(entity: EntityKind): string {
  return entity === "service" ? "service" : "part";
}
function Label(entity: EntityKind): string {
  return entity === "service" ? "Service" : "Part";
}
function idField(entity: EntityKind): string {
  return entity === "service" ? "service_catalog_id" : "part_id";
}
function nameField(entity: EntityKind): string {
  return entity === "service" ? "service_name" : "part_name";
}

function updateCol(
  setWo: SharedParams["setWo"],
  colKey: CollectionKey,
  fn: (items: Item[]) => Item[],
) {
  setWo((prev) => {
    if (!prev) return prev;
    return {
      ...prev,
      [colKey]: fn((prev[colKey] as Item[] | undefined) ?? []),
    } as WorkOrderDetail;
  });
}

function calculateFinalPrice(
  unitPrice: number,
  quantity: number,
  discountAmount: unknown,
  discountPercentage: unknown,
): number {
  const subtotal = unitPrice * quantity;
  const amount = Number(discountAmount ?? 0);
  const percentage = Number(discountPercentage ?? 0);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const safePercentage = Number.isFinite(percentage) ? percentage : 0;
  const percentageDiscount =
    safePercentage > 0 ? subtotal * (safePercentage / 100) : 0;

  return Math.max(0, subtotal - percentageDiscount - safeAmount);
}

// ─── Hook ───────────────────────────────────────────────────────────────

export function useCatalogMutations<T extends EntityKind>(
  params: SharedParams & { entity: T },
): Ret<T> {
  const {
    entity,
    workOrderId,
    orgIdRef,
    orgId,
    branchId,
    wo,
    setWo,
    onRefresh,
  } = params;
  const ck = col(entity);
  const ap = apiPath(entity);
  const ip = idParam(entity);
  const lb = label(entity);
  const Lb = Label(entity);
  const idf = idField(entity);
  const nf = nameField(entity);
  const isSvc = entity === "service";

  // ── State ──
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const [confirmingIds, setConfirmingIds] = useState<Set<string>>(new Set());
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  // ── Mutations ──
  const createMutation = useOrgMutation<WorkOrderService | WorkOrderPart, Item>(
    {
      endpoint: () =>
        `/api/organizations/${orgIdRef.current}/work-orders/${workOrderId}/${ap}`,
      method: "POST",
      queryKey: workOrderKeys.all(orgId ?? ""),
      invalidateKeys: branchId
        ? ([bayViewKeys.data(branchId)] as const)
        : undefined,
    },
  );

  const deleteMutation = useOrgMutation<unknown, Item>({
    endpoint: (vars) =>
      `/api/organizations/${orgIdRef.current}/work-orders/${workOrderId}/${ap}?${ip}=${vars[ip]}`,
    method: "DELETE",
    queryKey: workOrderKeys.all(orgId ?? ""),
    invalidateKeys: branchId
      ? ([bayViewKeys.data(branchId)] as const)
      : undefined,
  });

  const updateMutation = useOrgMutation<unknown, { id: string; body: Item }>({
    endpoint: (vars) =>
      `/api/organizations/${orgIdRef.current}/work-orders/${workOrderId}/${ap}?${ip}=${vars.id}`,
    method: "PATCH",
    queryKey: workOrderKeys.all(orgId ?? ""),
    invalidateKeys: branchId
      ? ([bayViewKeys.data(branchId)] as const)
      : undefined,
    bodyFn: (vars) => vars.body,
  });

  function items(): Item[] {
    return (wo?.[ck] as Item[] | undefined) ?? [];
  }
  function find(id: string): Item | undefined {
    return items().find((i) => i.id === id);
  }

  // ── Confirm add ──
  async function confirmAdd(id: string, price: number, qtyOverride?: number) {
    const orgIdCurrent = orgIdRef.current;
    if (!orgIdCurrent || !workOrderId) return;
    const found = find(id) as (ItemWithVariants & Item) | undefined;
    if (!found) return;
    if (isSvc) setConfirmingIds((prev) => new Set([...prev, id]));

    try {
      const body: Item = {
        [nf]: found[nf],
        quantity: qtyOverride ?? found.quantity ?? 1,
        unit_price: price,
        catalog_item_variant_id: found.catalog_item_variant_id ?? null,
        variant_label: found.variant_label ?? null,
        [idf]: found[idf] ?? null,
      };
      const newItem = await createMutation.mutateAsync(body);
      updateCol(setWo, ck, (all) =>
        all.map((i) => (i.id === id ? newItem : i)),
      );
      toast.dismiss();
      toast.success(`Added ${lb}: ${found[nf]}`);
      onRefresh();
      setAddingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (error) {
      reportServerError("Unexpected error", error);
      toast.error(`Failed to add ${lb}`);
      updateCol(setWo, ck, (all) => all.filter((i) => i.id !== id));
      setAddingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } finally {
      if (isSvc)
        setConfirmingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
    }
  }

  // ── Add ──
  function addItem(item: CatalogServiceItem | CatalogPartItem) {
    const ri = item as Item;
    const tempId = `temp-${Math.random().toString(36).slice(2, 11)}`;
    const price = Number(item.last_price ?? item.default_price ?? 0);
    setAddingIds((prev) => new Set([...prev, tempId]));

    const base: Item = {
      id: tempId,
      quantity: 1,
      unit_price: price,
      final_price: price,
      discount_amount: 0,
      discount_percentage: 0,
      unit_cost: 0,
      last_sold_price: ri.last_price ?? null,
      notes: null,
      work_order_id: workOrderId!,
      organization_id: null,
      created_by: null,
      created_at: new Date().toISOString(),
      name_mn: ri.name_mn ?? null,
      catalog_item_variant_id:
        (ri.variant_id as string | null | undefined) ?? null,
      variant_label: (ri.variant_label as string | null | undefined) ?? null,
      [nf]: ri.name,
      [idf]: ri._source === "global" ? null : ri.id,
    };

    if (isSvc) {
      Object.assign(base, { description: null, mechanic_id: null });
    } else {
      Object.assign(base, { part_number: null });
    }

    updateCol(setWo, ck, (all) => [...all, base]);
    setLastAddedId(tempId);
    setSearch("");
    setShowAdd(false);
  }

  // ── Remove ──
  async function removeItem(id: string) {
    const orgIdCurrent = orgIdRef.current;
    const found = find(id) as (ItemWithVariants & Item) | undefined;
    if (!orgIdCurrent || !workOrderId || !found) return;

    if (id.startsWith("temp-")) {
      updateCol(setWo, ck, (all) => all.filter((i) => i.id !== id));
      return;
    }

    const saveData: Item = {
      [nf]: found[nf],
      quantity: found.quantity ?? 1,
      unit_price: Number(found.final_price ?? found.unit_price ?? 0),
    };

    updateCol(setWo, ck, (all) => all.filter((i) => i.id !== id));

    try {
      await deleteMutation.mutateAsync({ [ip]: id });
      toast(`${Lb} removed`, {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              const restoreBody: Item = {
                ...saveData,
                catalog_item_variant_id: found.catalog_item_variant_id ?? null,
                variant_label: found.variant_label ?? null,
                [idf]: found[idf] ?? null,
              };
              const restored = await createMutation.mutateAsync(restoreBody);
              if (restored) {
                updateCol(setWo, ck, (all) =>
                  all.filter((i) => i.id !== id).concat([restored]),
                );
                onRefresh();
              }
            } catch (error) {
              reportServerError("Unexpected error", error);
              toast.error(`Failed to restore ${lb}`);
            }
          },
        },
        duration: 5000,
      });
      onRefresh();
    } catch (error) {
      reportServerError("Unexpected error", error);
      toast.error(`Failed to remove ${lb}`);
      updateCol(setWo, ck, (all) => all.concat([found as unknown as Item]));
    }
  }

  // ── Price ──
  async function handlePriceSave(id: string, price: number) {
    if (id.startsWith("temp-")) {
      // Optimistic update so UI reflects the new price immediately
      updateCol(setWo, ck, (all) =>
        all.map((i) =>
          i.id === id
            ? {
                ...i,
                unit_price: price,
                final_price: calculateFinalPrice(
                  price,
                  Number(i.quantity ?? 1),
                  i.discount_amount,
                  i.discount_percentage,
                ),
              }
            : i,
        ),
      );
      await confirmAdd(id, price);
      return;
    }
    const orgIdCurrent = orgIdRef.current;
    if (!orgIdCurrent || !workOrderId) return;
    const numVal = price;
    if (Number.isNaN(numVal) || numVal < 0) {
      toast.error("Invalid price");
      return;
    }

    const original = find(id);
    const oldUnitPrice = original ? Number(original.unit_price) : null;
    const oldFinalPrice = original ? Number(original.final_price) : null;
    const quantity = original ? Number(original.quantity ?? 1) : 1;
    const newFinalPrice = calculateFinalPrice(
      numVal,
      quantity,
      original?.discount_amount,
      original?.discount_percentage,
    );

    updateCol(setWo, ck, (all) =>
      all.map((i) =>
        i.id === id
          ? { ...i, unit_price: numVal, final_price: newFinalPrice }
          : i,
      ),
    );

    try {
      await updateMutation.mutateAsync({ id, body: { unit_price: numVal } });
      toast.dismiss();
      toast.success("Price updated");
      onRefresh();
    } catch (error) {
      reportServerError("Unexpected error", error);
      toast.error("Failed to update price");
      if (oldUnitPrice !== null || oldFinalPrice !== null) {
        updateCol(setWo, ck, (all) =>
          all.map((i) =>
            i.id === id
              ? {
                  ...i,
                  unit_price: oldUnitPrice ?? i.unit_price,
                  final_price: oldFinalPrice ?? i.final_price,
                }
              : i,
          ),
        );
      }
    }
  }

  // ── Quantity ──
  async function handleQtySave(id: string, qty: number) {
    if (id.startsWith("temp-")) {
      const f = find(id);
      const price = f ? Number(f.final_price ?? f.unit_price ?? 0) : 0;
      // Optimistic update so UI reflects the change immediately
      updateCol(setWo, ck, (all) =>
        all.map((i) => (i.id === id ? { ...i, quantity: qty } : i)),
      );
      await confirmAdd(id, price, qty);
      return;
    }
    const orgIdCurrent = orgIdRef.current;
    if (!orgIdCurrent || !workOrderId) return;
    const numVal = qty;
    if (Number.isNaN(numVal) || numVal < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    const original = find(id);
    const oldQty = original ? Number(original.quantity) : null;
    const oldFinalPrice = original ? Number(original.final_price) : null;
    const unitPrice = original ? Number(original.unit_price) : 0;
    const newFinalPrice = calculateFinalPrice(
      unitPrice,
      numVal,
      original?.discount_amount,
      original?.discount_percentage,
    );

    updateCol(setWo, ck, (all) =>
      all.map((i) =>
        i.id === id
          ? { ...i, quantity: numVal, final_price: newFinalPrice }
          : i,
      ),
    );

    try {
      await updateMutation.mutateAsync({ id, body: { quantity: numVal } });
      toast.dismiss();
      toast.success("Quantity updated");
      onRefresh();
    } catch (error) {
      reportServerError("Unexpected error", error);
      toast.error("Failed to update quantity");
      updateCol(setWo, ck, (all) =>
        all.map((i) =>
          i.id === id
            ? { ...i, quantity: oldQty ?? 1, final_price: oldFinalPrice ?? 0 }
            : i,
        ),
      );
    }
  }

  // ── Discount ──
  async function handleDiscountSave(
    id: string,
    discountAmount: number,
    discountPercent: number,
  ) {
    const orgIdCurrent = orgIdRef.current;
    if (!orgIdCurrent || !workOrderId) return;

    const original = find(id);
    const oldAmount = original?.discount_amount ?? 0;
    const oldPercent = original?.discount_percentage ?? 0;

    updateCol(setWo, ck, (all) =>
      all.map((i) => {
        if (i.id !== id) return i;
        const up = Number(i.unit_price ?? 0);
        const q = Number(i.quantity ?? 1);
        const finalPrice = calculateFinalPrice(
          up,
          q,
          discountAmount,
          discountPercent,
        );
        return {
          ...i,
          discount_amount: discountAmount,
          discount_percentage: discountPercent,
          final_price: finalPrice,
        };
      }),
    );

    try {
      await updateMutation.mutateAsync({
        id,
        body: {
          discount_amount: discountAmount,
          discount_percentage: discountPercent,
        },
      });
      toast.dismiss();
      toast.success("Discount updated");
      onRefresh();
    } catch (error) {
      reportServerError("Unexpected error", error);
      updateCol(setWo, ck, (all) =>
        all.map((i) => {
          if (i.id !== id) return i;
          return {
            ...i,
            discount_amount: oldAmount,
            discount_percentage: oldPercent,
            final_price:
              Number(i.unit_price ?? 0) * Number(i.quantity ?? 1) -
              Number(oldAmount),
          };
        }),
      );
      toast.error("Failed to update discount");
    }
  }

  // ── Return ──
  if (isSvc) {
    return {
      serviceSearch: search,
      setServiceSearch: setSearch,
      showAddService: showAdd,
      setShowAddService: setShowAdd,
      addingServiceIds: addingIds,
      confirmingServiceIds: confirmingIds,
      addService: addItem as (item: CatalogServiceItem) => void,
      removeService: removeItem,
      handleServicePriceSave: handlePriceSave,
      handleServiceQtySave: handleQtySave,
      handleServiceDiscountSave: handleDiscountSave,
      lastAddedServiceId: lastAddedId,
    } as Ret<T>;
  }

  return {
    partSearch: search,
    setPartSearch: setSearch,
    showAddPart: showAdd,
    setShowAddPart: setShowAdd,
    addingPartIds: addingIds,
    addPart: addItem as (item: CatalogPartItem) => void,
    removePart: removeItem,
    handlePartPriceSave: handlePriceSave,
    handlePartDiscountSave: handleDiscountSave,
    lastAddedPartId: lastAddedId,
  } as Ret<T>;
}
