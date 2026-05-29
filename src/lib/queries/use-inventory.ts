import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastRetry } from "@/lib/toast-utils";
import type {
  InventoryBalanceWithAvgCost,
  InventoryMovement,
  PartsCatalogItem,
  PartsCars,
  PartsCarParts,
  PurchaseOrder,
  PurchaseOrderItem,
  StockThreshold,
  Supplier,
} from "@/lib/types";
import { createOrgQuery } from "./factory";
import { inventoryKeys } from "./keys";

// ── Module-level fetchers ────────────────────────────────────

const fetchPartsCatalog = createOrgQuery<PartsCatalogItem[]>(
  "/inventory/parts",
  { unwrap: "paginated" },
);

const fetchInventoryBalances = createOrgQuery<InventoryBalanceWithAvgCost[]>(
  "/inventory/balances",
  { unwrap: "paginated" },
);

const fetchInventoryMovements = createOrgQuery<InventoryMovement[]>(
  "/inventory/movements",
  { unwrap: "paginated" },
);

const fetchSuppliers = createOrgQuery<Supplier[]>("/inventory/suppliers", {
  unwrap: "paginated",
});

const fetchStockThresholds = createOrgQuery<StockThreshold[]>(
  "/inventory/thresholds",
  { unwrap: "paginated" },
);

const fetchPartsCars = createOrgQuery<PartsCars[]>("/inventory/parts-cars", {
  unwrap: "paginated",
});

// ── Shared type ──────────────────────────────────────────────

export type PurchaseOrderWithSupplier = PurchaseOrder & {
  supplier?: { name: string } | null;
};

const fetchPurchaseOrders = createOrgQuery<PurchaseOrderWithSupplier[]>(
  "/inventory/purchase-orders",
  { unwrap: "paginated" },
);

// ── Query hooks ──────────────────────────────────────────────

export function usePartsCatalog(orgId: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.parts(orgId ?? ""),
    queryFn: () => fetchPartsCatalog(orgId ?? ""),
    enabled: !!orgId,
    staleTime: 60_000,
  });
}

export function useInventoryBalances(orgId: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.balances(orgId ?? ""),
    queryFn: () => fetchInventoryBalances(orgId ?? ""),
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
    queryFn: () =>
      fetchInventoryMovements(orgId ?? "", {
        params: type ? { movement_type: type } : undefined,
      }),
    enabled: !!orgId,
  });
}

export function useSuppliers(orgId: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.suppliers(orgId ?? ""),
    queryFn: () => fetchSuppliers(orgId ?? ""),
    enabled: !!orgId,
  });
}

export function usePurchaseOrders(orgId: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.purchaseOrders(orgId ?? ""),
    queryFn: () => fetchPurchaseOrders(orgId ?? ""),
    enabled: !!orgId,
    staleTime: 30_000,
  });
}

export function usePurchaseOrderItems(
  orgId: string | undefined,
  poId: string | undefined,
) {
  const fetchPOItems = createOrgQuery<
    (PurchaseOrderItem & { part_name: string })[]
  >(`/inventory/purchase-orders/${poId}/items`, { unwrap: "paginated" });

  return useQuery({
    queryKey: inventoryKeys.purchaseOrderItems(poId ?? ""),
    queryFn: () => fetchPOItems(orgId ?? ""),
    enabled: !!orgId && !!poId,
    staleTime: 30_000,
  });
}

export function useStockThresholds(orgId: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.thresholds(orgId ?? ""),
    queryFn: () => fetchStockThresholds(orgId ?? ""),
    enabled: !!orgId,
    staleTime: 60_000,
  });
}

// ── Parts Cars ────────────────────────────────────────────────

export function usePartsCars(orgId: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.partsCars(orgId ?? ""),
    queryFn: () => fetchPartsCars(orgId ?? ""),
    enabled: !!orgId,
    staleTime: 30_000,
  });
}

export function usePartsCar(
  orgId: string | undefined,
  carId: string | undefined,
) {
  const fetchPartCar = createOrgQuery<PartsCars>(
    `/inventory/parts-cars/${carId}`,
  );

  return useQuery({
    queryKey: inventoryKeys.partsCar(orgId ?? "", carId ?? ""),
    queryFn: () => fetchPartCar(orgId ?? ""),
    enabled: !!orgId && !!carId,
  });
}

export function usePartsCarParts(
  orgId: string | undefined,
  carId: string | undefined,
) {
  const fetchCarParts = createOrgQuery<PartsCarParts[]>(
    `/inventory/parts-cars/${carId}/parts`,
    { unwrap: "paginated" },
  );

  return useQuery({
    queryKey: inventoryKeys.partsCarParts(orgId ?? "", carId ?? ""),
    queryFn: () => fetchCarParts(orgId ?? ""),
    enabled: !!orgId && !!carId,
  });
}

// ── Mutation hooks (unchanged) ──────────────────────────────

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
      const res = await fetch(
        `/api/organizations/${orgId}/inventory/movements`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
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

export function useCreateSupplier(orgId: string | undefined) {
  const qc = useQueryClient();
  const mutation = useMutation({
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
      const res = await fetch(
        `/api/organizations/${orgId}/inventory/suppliers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as Supplier;
    },
    onMutate: async (body) => {
      const key = inventoryKeys.suppliers(orgId ?? "");
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Supplier[]>(key);
      if (previous) {
        const optimistic: Supplier = {
          id: `temp-${Date.now()}`,
          organization_id: orgId ?? "",
          branch_id: null,
          name: body.name,
          contact_person: body.contact_person ?? null,
          phone: body.phone ?? null,
          email: body.email ?? null,
          address: body.address ?? null,
          tax_id: body.tax_id ?? null,
          payment_terms: body.payment_terms ?? null,
          notes: body.notes ?? null,
          is_active: true,
          created_by: null,
          updated_by: null,
          deleted_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        qc.setQueryData<Supplier[]>(key, [...previous, optimistic]);
      }
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous)
        qc.setQueryData<Supplier[]>(
          inventoryKeys.suppliers(orgId ?? ""),
          context.previous,
        );
      toastRetry(err.message, () => mutation.mutateAsync(variables));
    },
    onSuccess: () => toast.success("Supplier created"),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.suppliers(orgId ?? "") });
    },
  });
  return mutation;
}

export function useUpdateSupplier(orgId: string | undefined) {
  const qc = useQueryClient();
  const mutation = useMutation({
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
    onMutate: async ({ id, body }) => {
      const key = inventoryKeys.suppliers(orgId ?? "");
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Supplier[]>(key);
      if (previous) {
        qc.setQueryData<Supplier[]>(
          key,
          previous.map((s) =>
            s.id === id
              ? { ...s, ...body, updated_at: new Date().toISOString() }
              : s,
          ),
        );
      }
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous)
        qc.setQueryData<Supplier[]>(
          inventoryKeys.suppliers(orgId ?? ""),
          context.previous,
        );
      toastRetry(err.message, () => mutation.mutateAsync(variables));
    },
    onSuccess: () => toast.success("Supplier updated"),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.suppliers(orgId ?? "") });
    },
  });
  return mutation;
}

export function useDeleteSupplier(orgId: string | undefined) {
  const qc = useQueryClient();
  const mutation = useMutation({
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
    onMutate: async (id) => {
      const key = inventoryKeys.suppliers(orgId ?? "");
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Supplier[]>(key);
      if (previous) {
        qc.setQueryData<Supplier[]>(
          key,
          previous.filter((s) => s.id !== id),
        );
      }
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous)
        qc.setQueryData<Supplier[]>(
          inventoryKeys.suppliers(orgId ?? ""),
          context.previous,
        );
      toastRetry(err.message, () => mutation.mutateAsync(variables));
    },
    onSuccess: () => toast.success("Supplier deleted"),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.suppliers(orgId ?? "") });
    },
  });
  return mutation;
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
        throw new Error(
          json.error?.message ?? "Failed to complete disassembly",
        );
      }
      const json = await res.json();
      return json.data as PartsCars;
    },
    onSuccess: (_data, carId) => {
      qc.invalidateQueries({ queryKey: inventoryKeys.partsCars(orgId ?? "") });
      qc.invalidateQueries({
        queryKey: inventoryKeys.partsCar(orgId ?? "", carId),
      });
    },
  });
}

export function usePublishPartsCarToCatalog(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (carId: string) => {
      const res = await fetch(
        `/api/organizations/${orgId}/inventory/parts-cars/${carId}/publish`,
        { method: "POST" },
      );
      if (!res.ok) {
        const json = await res.json();
        throw new Error(
          json.error?.message ?? "Failed to publish parts to catalog",
        );
      }
      const json = await res.json();
      return json.data as { publishedCount: number; catalogIds: string[] };
    },
    onSuccess: (_data, carId) => {
      qc.invalidateQueries({ queryKey: inventoryKeys.partsCars(orgId ?? "") });
      qc.invalidateQueries({
        queryKey: inventoryKeys.partsCar(orgId ?? "", carId),
      });
      qc.invalidateQueries({
        queryKey: inventoryKeys.partsCarParts(orgId ?? "", carId),
      });
      qc.invalidateQueries({ queryKey: inventoryKeys.parts(orgId ?? "") });
      qc.invalidateQueries({ queryKey: inventoryKeys.balances(orgId ?? "") });
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

export function useUpdatePartsCar(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: string } & Record<string, unknown>) => {
      const res = await fetch(
        `/api/organizations/${orgId}/inventory/parts-cars/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message ?? "Failed to update parts car");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.partsCars(orgId ?? "") });
    },
  });
}

export function useDeletePartsCar(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(
        `/api/organizations/${orgId}/inventory/parts-cars/${id}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message ?? "Failed to delete parts car");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.partsCars(orgId ?? "") });
    },
  });
}
