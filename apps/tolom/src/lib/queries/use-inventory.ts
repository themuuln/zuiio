import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useOrgMutation } from "@zuiio/query";
import type {
  GlobalPartCatalog,
  InventoryBalanceWithAvgCost,
  InventoryMovement,
  InventoryTurnover,
  PartsCarParts,
  PartsCars,
  PartsCatalogItem,
  PurchaseOrder,
  PurchaseOrderItem,
  SlowMovingItem,
  StockThreshold,
  Supplier,
  UpdatePartParams,
  UsageTrend,
} from "@/lib/types";
import { createOrgQuery } from "./factory";
import { globalCatalogKeys, inventoryKeys } from "./keys";

// ── Global Catalog Fetcher ───────────────────────────────────

async function fetchGlobalPartsCatalog(): Promise<GlobalPartCatalog[]> {
  const res = await fetch("/api/global-catalog/parts");
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.data ?? [];
}

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

export function usePartsCatalog(
  orgId: string | undefined,
  _branchId?: string | null,
) {
  return useQuery({
    queryKey: inventoryKeys.parts(orgId ?? ""),
    queryFn: () => fetchPartsCatalog(orgId ?? ""),
    enabled: !!orgId,
    staleTime: 300_000, // 5 min — catalog rarely changes after setup
  });
}

export function useGlobalPartsCatalog() {
  return useQuery({
    queryKey: globalCatalogKeys.parts(),
    queryFn: fetchGlobalPartsCatalog,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePartCategories(orgId: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.categories(orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/inventory/part-categories`,
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as { id: string; name: string }[];
    },
    enabled: !!orgId,
    staleTime: 5 * 60_000,
  });
}

export function useCreatePartCategory(orgId: string | undefined) {
  return useOrgMutation<unknown, string>({
    endpoint: `/api/organizations/${orgId}/inventory/part-categories`,
    method: "POST",
    queryKey: inventoryKeys.categories(orgId ?? ""),
  });
}

export function useInventoryBalances(
  orgId: string | undefined,
  branchId?: string | null,
) {
  return useQuery({
    queryKey: inventoryKeys.balances(orgId ?? "", branchId),
    queryFn: () =>
      fetchInventoryBalances(orgId ?? "", {
        params: branchId ? { branch_id: branchId } : { fast: "true" },
      }),
    enabled: !!orgId,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useInventoryMovements(
  orgId: string | undefined,
  type?: string,
  branchId?: string | null,
) {
  return useQuery({
    queryKey: [
      ...inventoryKeys.movements(orgId ?? "", branchId),
      type ?? "all",
    ],
    queryFn: () =>
      fetchInventoryMovements(orgId ?? "", {
        params: {
          ...(type ? { movement_type: type } : {}),
          ...(branchId ? { branch_id: branchId } : {}),
        },
      }),
    enabled: !!orgId,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useSuppliers(orgId: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.suppliers(orgId ?? ""),
    queryFn: () => fetchSuppliers(orgId ?? ""),
    enabled: !!orgId,
    staleTime: 5 * 60_000,
  });
}

export function usePurchaseOrders(
  orgId: string | undefined,
  branchId?: string | null,
) {
  return useQuery({
    queryKey: inventoryKeys.purchaseOrders(orgId ?? "", branchId),
    queryFn: () =>
      fetchPurchaseOrders(orgId ?? "", {
        params: branchId ? { branch_id: branchId } : undefined,
      }),
    enabled: !!orgId,
    placeholderData: keepPreviousData,
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

export function useStockThresholds(
  orgId: string | undefined,
  branchId?: string | null,
) {
  return useQuery({
    queryKey: inventoryKeys.thresholds(orgId ?? "", branchId),
    queryFn: () =>
      fetchStockThresholds(orgId ?? "", {
        params: branchId ? { branch_id: branchId } : undefined,
      }),
    enabled: !!orgId,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

// ── Parts Cars ────────────────────────────────────────────────

export function usePartsCars(orgId: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.partsCars(orgId ?? ""),
    queryFn: () => fetchPartsCars(orgId ?? ""),
    enabled: !!orgId,
    placeholderData: keepPreviousData,
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
    staleTime: 30_000,
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
    staleTime: 30_000,
  });
}

// ── Inventory Report Hooks ──────────────────────────────────

export function useInventoryTurnover(
  orgId: string | undefined,
  branchId?: string | null,
) {
  return useQuery({
    queryKey: inventoryKeys.turnover(orgId ?? "", branchId),
    queryFn: () =>
      createOrgQuery<InventoryTurnover>("/inventory/reports/turnover")(
        orgId ?? "",
        { params: branchId ? { branch_id: branchId } : undefined },
      ),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUsageTrends(
  orgId: string | undefined,
  branchId?: string | null,
) {
  return useQuery({
    queryKey: inventoryKeys.usageTrends(orgId ?? "", branchId),
    queryFn: () =>
      createOrgQuery<UsageTrend[]>("/inventory/reports/usage-trends")(
        orgId ?? "",
        { params: branchId ? { branch_id: branchId } : undefined },
      ),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSlowMovingStock(
  orgId: string | undefined,
  branchId?: string | null,
) {
  return useQuery({
    queryKey: inventoryKeys.slowMoving(orgId ?? "", branchId),
    queryFn: () =>
      createOrgQuery<SlowMovingItem[]>("/inventory/reports/slow-moving")(
        orgId ?? "",
        { params: branchId ? { branch_id: branchId } : undefined },
      ),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Mutation hooks ──────────────────────────────────────────

export function useCreateMovement(orgId: string | undefined) {
  return useOrgMutation<
    InventoryMovement,
    {
      part_id: string;
      movement_type: string;
      quantity: number;
      unit_cost?: number;
      unit_price?: number;
      reference_type?: string;
      reference_id?: string;
      notes?: string;
    }
  >({
    endpoint: `/api/organizations/${orgId}/inventory/movements`,
    method: "POST",
    queryKey: inventoryKeys.movements(orgId ?? ""),
    invalidateKeys: [
      inventoryKeys.balances(orgId ?? ""),
      inventoryKeys.parts(orgId ?? ""),
    ],
  });
}

export function useCreateSupplier(orgId: string | undefined) {
  return useOrgMutation<
    Supplier,
    {
      name: string;
      contact_person?: string;
      phone?: string;
      email?: string;
      address?: string;
      tax_id?: string;
      payment_terms?: string;
      notes?: string;
    }
  >({
    endpoint: `/api/organizations/${orgId}/inventory/suppliers`,
    method: "POST",
    queryKey: inventoryKeys.suppliers(orgId ?? ""),
    optimisticUpdate: (cached, body) => {
      const optimistic: Supplier = {
        id: `temp-${Date.now()}`,
        organization_id: orgId ?? "",
        branch_id: null,
        name: body.name,
        lead_time_days: null,
        min_order_quantity: null,
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
      return [...cached, optimistic];
    },
    successMessage: "Supplier created",
  });
}

export function useUpdateSupplier(orgId: string | undefined) {
  return useOrgMutation<Supplier, { id: string; body: Partial<Supplier> }>({
    endpoint: ({ id }) =>
      `/api/organizations/${orgId}/inventory/suppliers?supplierId=${id}`,
    method: "PATCH",
    queryKey: inventoryKeys.suppliers(orgId ?? ""),
    optimisticUpdate: (cached, { id, body }) =>
      cached.map((s) =>
        s.id === id
          ? { ...s, ...body, updated_at: new Date().toISOString() }
          : s,
      ),
    successMessage: "Supplier updated",
  });
}

export function useDeleteSupplier(orgId: string | undefined) {
  return useOrgMutation<Supplier, string>({
    endpoint: (id) =>
      `/api/organizations/${orgId}/inventory/suppliers?supplierId=${id}`,
    method: "DELETE",
    queryKey: inventoryKeys.suppliers(orgId ?? ""),
    optimisticUpdate: (cached, id) => cached.filter((s) => s.id !== id),
    successMessage: "Supplier deleted",
  });
}

export function useUpdatePart(orgId: string | undefined) {
  return useOrgMutation<
    PartsCatalogItem,
    { id: string; body: UpdatePartParams }
  >({
    endpoint: ({ id }) => `/api/organizations/${orgId}/inventory/parts/${id}`,
    method: "PATCH",
    queryKey: inventoryKeys.parts(orgId ?? ""),
    invalidateKeys: [inventoryKeys.balances(orgId ?? "")],
    optimisticUpdate: (cached, { id, body }) =>
      cached.map((p) =>
        p.id === id
          ? { ...p, ...body, updated_at: new Date().toISOString() }
          : p,
      ),
    successMessage: "Part updated",
  });
}
export function useDeletePart(orgId: string | undefined) {
  return useOrgMutation<PartsCatalogItem, string>({
    endpoint: (id) => `/api/organizations/${orgId}/inventory/parts/${id}`,
    method: "DELETE",
    queryKey: inventoryKeys.parts(orgId ?? ""),
    invalidateKeys: [inventoryKeys.balances(orgId ?? "")],
    optimisticUpdate: (cached, id) => cached.filter((p) => p.id !== id),
    successMessage: "Part deleted",
  });
}

export function useCreatePurchaseOrder(orgId: string | undefined) {
  return useOrgMutation<
    PurchaseOrder,
    {
      supplier_id?: string;
      order_number: string;
      notes?: string;
      items: Array<{
        part_id: string;
        quantity_ordered: number;
        unit_cost: number;
        notes?: string;
      }>;
    }
  >({
    endpoint: `/api/organizations/${orgId}/inventory/purchase-orders`,
    method: "POST",
    queryKey: inventoryKeys.purchaseOrders(orgId ?? ""),
  });
}

export function useUpdatePurchaseOrder(orgId: string | undefined) {
  return useOrgMutation<
    PurchaseOrder,
    { id: string; body: Partial<PurchaseOrder> }
  >({
    endpoint: ({ id }) =>
      `/api/organizations/${orgId}/inventory/purchase-orders?poId=${id}`,
    method: "PATCH",
    queryKey: inventoryKeys.purchaseOrders(orgId ?? ""),
  });
}

export function useReceivePurchaseOrder(orgId: string | undefined) {
  return useOrgMutation<PurchaseOrder, string>({
    endpoint: (poId) =>
      `/api/organizations/${orgId}/inventory/purchase-orders/${poId}/receive`,
    method: "POST",
    queryKey: inventoryKeys.purchaseOrders(orgId ?? ""),
    invalidateKeys: [
      inventoryKeys.balances(orgId ?? ""),
      inventoryKeys.parts(orgId ?? ""),
      inventoryKeys.movements(orgId ?? ""),
    ],
  });
}

export function useReceiveByBarcode(
  orgId: string | undefined,
  poId: string | undefined,
) {
  return useOrgMutation<PurchaseOrderItem, { poId: string; barcode: string }>({
    endpoint: (vars) =>
      `/api/organizations/${orgId}/inventory/purchase-orders/${vars.poId}/receive-barcode`,
    method: "POST",
    queryKey: inventoryKeys.purchaseOrders(orgId ?? ""),
    invalidateKeys: [
      inventoryKeys.purchaseOrderItems(poId ?? ""),
      inventoryKeys.purchaseOrders(orgId ?? ""),
      inventoryKeys.balances(orgId ?? ""),
      inventoryKeys.parts(orgId ?? ""),
      inventoryKeys.movements(orgId ?? ""),
    ],
    bodyFn: (vars) => ({ barcode: vars.barcode }),
  });
}

export function useCreatePartsCar(orgId: string | undefined) {
  return useOrgMutation<
    PartsCars,
    {
      make: string;
      model: string;
      year?: number;
      vin?: string;
      license_plate?: string;
      purchase_cost?: number;
      currency?: string;
      arrival_date?: string;
      notes?: string;
    }
  >({
    endpoint: `/api/organizations/${orgId}/inventory/parts-cars`,
    method: "POST",
    queryKey: inventoryKeys.partsCars(orgId ?? ""),
  });
}

export function useStartDisassembly(orgId: string | undefined) {
  return useOrgMutation<PartsCars, string>({
    endpoint: (carId) =>
      `/api/organizations/${orgId}/inventory/parts-cars/${carId}`,
    method: "PATCH",
    queryKey: inventoryKeys.partsCars(orgId ?? ""),
  });
}

export function useCompleteDisassembly(orgId: string | undefined) {
  const qc = useQueryClient();
  return useOrgMutation<PartsCars, string>({
    endpoint: (carId) =>
      `/api/organizations/${orgId}/inventory/parts-cars/${carId}/complete`,
    method: "POST",
    queryKey: inventoryKeys.partsCars(orgId ?? ""),
    onSuccess: (_data, carId) => {
      qc.invalidateQueries({
        queryKey: inventoryKeys.partsCar(orgId ?? "", carId),
      });
    },
  });
}

export function usePublishPartsCarToCatalog(orgId: string | undefined) {
  const qc = useQueryClient();
  return useOrgMutation<
    { publishedCount: number; catalogIds: string[] },
    string
  >({
    endpoint: (carId) =>
      `/api/organizations/${orgId}/inventory/parts-cars/${carId}/publish`,
    method: "POST",
    queryKey: inventoryKeys.partsCars(orgId ?? ""),
    invalidateKeys: [
      inventoryKeys.parts(orgId ?? ""),
      inventoryKeys.balances(orgId ?? ""),
    ],
    onSuccess: (_data, carId) => {
      qc.invalidateQueries({
        queryKey: inventoryKeys.partsCar(orgId ?? "", carId),
      });
      qc.invalidateQueries({
        queryKey: inventoryKeys.partsCarParts(orgId ?? "", carId),
      });
    },
  });
}

export function useAddPartsCarPart(orgId: string | undefined) {
  return useOrgMutation<
    PartsCarParts,
    {
      carId: string;
      name: string;
      part_id?: string;
      location_group?: string;
      quantity?: number;
      condition?: string;
      estimated_price?: number;
      notes?: string;
    }
  >({
    endpoint: (vars) =>
      `/api/organizations/${orgId}/inventory/parts-cars/${vars.carId}/parts`,
    method: "POST",
    queryKey: inventoryKeys.partsCars(orgId ?? ""),
  });
}

export function useRemovePartsCarPart(orgId: string | undefined) {
  return useOrgMutation<
    unknown,
    {
      carId: string;
      partId: string;
    }
  >({
    endpoint: (vars) =>
      `/api/organizations/${orgId}/inventory/parts-cars/${vars.carId}/parts/${vars.partId}`,
    method: "DELETE",
    queryKey: inventoryKeys.partsCars(orgId ?? ""),
  });
}

export function useUpdatePartsCar(orgId: string | undefined) {
  return useOrgMutation<unknown, { id: string } & Record<string, unknown>>({
    endpoint: ({ id }) =>
      `/api/organizations/${orgId}/inventory/parts-cars/${id}`,
    method: "PATCH",
    queryKey: inventoryKeys.partsCars(orgId ?? ""),
  });
}

export function useDeletePartsCar(orgId: string | undefined) {
  return useOrgMutation<unknown, string>({
    endpoint: (id) => `/api/organizations/${orgId}/inventory/parts-cars/${id}`,
    method: "DELETE",
    queryKey: inventoryKeys.partsCars(orgId ?? ""),
  });
}

export function useVehicleModelParts(
  orgId: string | undefined,
  partId: string | undefined,
) {
  return useQuery({
    queryKey: inventoryKeys.vehicleModelParts(orgId ?? "", partId ?? ""),
    queryFn: async () => {
      if (!orgId || !partId) return [];
      const res = await fetch(
        `/api/organizations/${orgId}/inventory/parts/${partId}/vehicle-models`,
      );
      if (!res.ok) throw new Error("Failed to fetch vehicle fitment");
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!orgId && !!partId,
  });
}

export function useSupplierPriceHistory(
  orgId: string | undefined,
  partId: string | undefined,
) {
  return useQuery({
    queryKey: inventoryKeys.supplierPriceHistory(orgId ?? "", partId ?? ""),
    queryFn: async () => {
      if (!orgId || !partId) return [];
      const res = await fetch(
        `/api/organizations/${orgId}/inventory/parts/${partId}/purchase-history`,
      );
      if (!res.ok) throw new Error("Failed to fetch purchase history");
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!orgId && !!partId,
  });
}
