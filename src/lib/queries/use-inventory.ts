import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  InventoryBalance,
  InventoryMovement,
  PartsCatalogItem,
  PartsCars,
  PartsCarParts,
  PurchaseOrder,
  PurchaseOrderItem,
  StockThreshold,
  Supplier,
} from "@/lib/types";
import { inventoryKeys } from "./keys";

export function usePartsCatalog(orgId: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.parts(orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/inventory/parts`);
      if (!res.ok) throw new Error("Failed to load parts");
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return (json.data ?? []) as PartsCatalogItem[];
    },
    enabled: !!orgId,
    staleTime: 60_000,
  });
}

export function useInventoryBalances(orgId: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.balances(orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/inventory/balances`);
      if (!res.ok) throw new Error("Failed to load balances");
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return (json.data ?? []) as InventoryBalance[];
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });
}

export function useInventoryMovements(
  orgId: string | undefined,
  type?: string,
) {
  return useQuery({
    queryKey: [...inventoryKeys.movements(orgId ?? ""), type ?? "all"],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type) params.set("movement_type", type);
      const url = `/api/organizations/${orgId}/inventory/movements${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load movements");
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return (json.data ?? []) as InventoryMovement[];
    },
    enabled: !!orgId,
  });
}

export function useCreateMovement(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      part_id: string;
      movement_type: string;
      quantity: number;
      unit_cost?: number;
      unit_price?: number;
      reference_type?: string;
      reference_id?: string;
      notes?: string;
    }) => {
      const res = await fetch(`/api/organizations/${orgId}/inventory/movements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as InventoryMovement;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.movements(orgId ?? "") });
      qc.invalidateQueries({ queryKey: inventoryKeys.balances(orgId ?? "") });
      qc.invalidateQueries({ queryKey: inventoryKeys.parts(orgId ?? "") });
    },
  });
}

export function useSuppliers(orgId: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.suppliers(orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/inventory/suppliers`);
      if (!res.ok) throw new Error("Failed to load suppliers");
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return (json.data ?? []) as Supplier[];
    },
    enabled: !!orgId,
  });
}

export function useCreateSupplier(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      name: string;
      contact_person?: string;
      phone?: string;
      email?: string;
      address?: string;
      tax_id?: string;
      payment_terms?: string;
      notes?: string;
    }) => {
      const res = await fetch(`/api/organizations/${orgId}/inventory/suppliers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as Supplier;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.suppliers(orgId ?? "") });
    },
  });
}

export function useUpdateSupplier(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Partial<Supplier>;
    }) => {
      const res = await fetch(
        `/api/organizations/${orgId}/inventory/suppliers?supplierId=${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as Supplier;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.suppliers(orgId ?? "") });
    },
  });
}

export function useDeleteSupplier(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(
        `/api/organizations/${orgId}/inventory/suppliers?supplierId=${id}`,
        {
          method: "DELETE",
        },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.suppliers(orgId ?? "") });
    },
  });
}

export type PurchaseOrderWithSupplier = PurchaseOrder & {
  supplier?: { name: string } | null;
};

export function usePurchaseOrders(orgId: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.purchaseOrders(orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/inventory/purchase-orders`,
      );
      if (!res.ok) throw new Error("Failed to load purchase orders");
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return (json.data ?? []) as PurchaseOrderWithSupplier[];
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });
}

export function usePurchaseOrderItems(orgId: string | undefined, poId: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.purchaseOrderItems(poId ?? ""),
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/inventory/purchase-orders/${poId}/items`,
      );
      if (!res.ok) throw new Error("Failed to load PO items");
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return (json.data ?? []) as (PurchaseOrderItem & { part_name: string })[];
    },
    enabled: !!orgId && !!poId,
    staleTime: 30_000,
  });
}

export function useCreatePurchaseOrder(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      supplier_id?: string;
      order_number: string;
      notes?: string;
      items: Array<{
        part_id: string;
        quantity_ordered: number;
        unit_cost: number;
        notes?: string;
      }>;
    }) => {
      const res = await fetch(
        `/api/organizations/${orgId}/inventory/purchase-orders`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as PurchaseOrder;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: inventoryKeys.purchaseOrders(orgId ?? ""),
      });
    },
  });
}

export function useUpdatePurchaseOrder(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Partial<PurchaseOrder>;
    }) => {
      const res = await fetch(
        `/api/organizations/${orgId}/inventory/purchase-orders?poId=${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as PurchaseOrder;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: inventoryKeys.purchaseOrders(orgId ?? ""),
      });
    },
  });
}

export function useReceivePurchaseOrder(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (poId: string) => {
      const res = await fetch(
        `/api/organizations/${orgId}/inventory/purchase-orders/${poId}/receive`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as PurchaseOrder;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: inventoryKeys.purchaseOrders(orgId ?? ""),
      });
      qc.invalidateQueries({ queryKey: inventoryKeys.balances(orgId ?? "") });
      qc.invalidateQueries({ queryKey: inventoryKeys.parts(orgId ?? "") });
      qc.invalidateQueries({ queryKey: inventoryKeys.movements(orgId ?? "") });
    },
  });
}

export function useStockThresholds(orgId: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.thresholds(orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/inventory/thresholds`,
      );
      if (!res.ok) throw new Error("Failed to load thresholds");
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return (json.data ?? []) as StockThreshold[];
    },
    enabled: !!orgId,
    staleTime: 60_000,
  });
}

// ── Parts Cars ────────────────────────────────────────────────

export function usePartsCars(orgId: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.partsCars(orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/inventory/parts-cars`,
      );
      if (!res.ok) throw new Error("Failed to load parts cars");
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return (json.data ?? []) as PartsCars[];
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });
}

export function usePartsCar(orgId: string | undefined, carId: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.partsCar(orgId ?? "", carId ?? ""),
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/inventory/parts-cars/${carId}`,
      );
      if (!res.ok) throw new Error("Failed to load parts car");
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as PartsCars;
    },
    enabled: !!orgId && !!carId,
  });
}

export function usePartsCarParts(orgId: string | undefined, carId: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.partsCarParts(orgId ?? "", carId ?? ""),
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/inventory/parts-cars/${carId}/parts`,
      );
      if (!res.ok) throw new Error("Failed to load parts car parts");
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return (json.data ?? []) as PartsCarParts[];
    },
    enabled: !!orgId && !!carId,
  });
}

export function useCreatePartsCar(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      make: string;
      model: string;
      year?: number;
      vin?: string;
      license_plate?: string;
      purchase_cost?: number;
      currency?: string;
      arrival_date?: string;
      notes?: string;
    }) => {
      const res = await fetch(
        `/api/organizations/${orgId}/inventory/parts-cars`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message ?? "Failed to create parts car");
      }
      const json = await res.json();
      return json.data as PartsCars;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.partsCars(orgId ?? "") });
    },
  });
}

export function useStartDisassembly(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (carId: string) => {
      const res = await fetch(
        `/api/organizations/${orgId}/inventory/parts-cars/${carId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "disassembling" }),
        },
      );
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message ?? "Failed to start disassembly");
      }
      const json = await res.json();
      return json.data as PartsCars;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.partsCars(orgId ?? "") });
    },
  });
}

export function useCompleteDisassembly(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (carId: string) => {
      const res = await fetch(
        `/api/organizations/${orgId}/inventory/parts-cars/${carId}/complete`,
        { method: "POST" },
      );
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message ?? "Failed to complete disassembly");
      }
      const json = await res.json();
      return json.data as PartsCars;
    },
    onSuccess: (_data, carId) => {
      qc.invalidateQueries({ queryKey: inventoryKeys.partsCars(orgId ?? "") });
      qc.invalidateQueries({ queryKey: inventoryKeys.partsCar(orgId ?? "", carId) });
    },
  });
}

export function useAddPartsCarPart(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      carId,
      ...body
    }: {
      carId: string;
      name: string;
      part_id?: string;
      location_group?: string;
      quantity?: number;
      condition?: string;
      estimated_price?: number;
      notes?: string;
    }) => {
      const res = await fetch(
        `/api/organizations/${orgId}/inventory/parts-cars/${carId}/parts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message ?? "Failed to add part");
      }
      const json = await res.json();
      return json.data as PartsCarParts;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: inventoryKeys.partsCarParts(orgId ?? "", variables.carId),
      });
    },
  });
}

export function useRemovePartsCarPart(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      carId,
      partId,
    }: {
      carId: string;
      partId: string;
    }) => {
      const res = await fetch(
        `/api/organizations/${orgId}/inventory/parts-cars/${carId}/parts/${partId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message ?? "Failed to remove part");
      }
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: inventoryKeys.partsCarParts(orgId ?? "", variables.carId),
      });
    },
  });
}
