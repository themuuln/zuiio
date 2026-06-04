import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { useMutationQueue } from "@/lib/offline/mutation-queue-provider";
import { toastRetry } from "@/lib/toast-utils";
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
  branchId?: string | null,
) {
  return useQuery({
    queryKey: inventoryKeys.parts(orgId ?? "", branchId),
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
  });
}

export function useCreatePartCategory(orgId: string | undefined) {
  const qc = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!orgId) throw new Error("No organization ID");

      if (isOnline) {
        const res = await fetch(
          `/api/organizations/${orgId}/inventory/part-categories`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
          },
        );
        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error?.message ?? "Failed to create category");
        }
        return json.data as { id: string; name: string };
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/inventory/part-categories`,
        method: "POST",
        body: { name },
        queryKeysToInvalidate: [[...inventoryKeys.categories(orgId)]],
      });
      return { queued: true } as unknown as { id: string; name: string };
    },
    onSuccess: (data) => {
      const d = data as unknown as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        if (orgId) {
          qc.invalidateQueries({
            queryKey: inventoryKeys.categories(orgId),
          });
        }
      }
    },
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
        params: branchId ? { branch_id: branchId } : undefined,
      }),
    enabled: !!orgId,
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
  });
}

export function useSuppliers(orgId: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.suppliers(orgId ?? ""),
    queryFn: () => fetchSuppliers(orgId ?? ""),
    enabled: !!orgId,
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

// ── Mutation hooks (unchanged) ──────────────────────────────

export function useCreateMovement(orgId: string | undefined) {
  const qc = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();
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
      if (isOnline) {
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
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/inventory/movements`,
        method: "POST",
        body,
        queryKeysToInvalidate: [
          [...inventoryKeys.movements(orgId ?? "")],
          [...inventoryKeys.balances(orgId ?? "")],
          [...inventoryKeys.parts(orgId ?? "")],
        ],
      });
      return { queued: true } as unknown as InventoryMovement;
    },
    onSuccess: (data) => {
      const d = data as unknown as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        qc.invalidateQueries({
          queryKey: inventoryKeys.movements(orgId ?? ""),
        });
        qc.invalidateQueries({ queryKey: inventoryKeys.balances(orgId ?? "") });
        qc.invalidateQueries({ queryKey: inventoryKeys.parts(orgId ?? "") });
      }
    },
  });
}

export function useCreateSupplier(orgId: string | undefined) {
  const qc = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();
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
      if (isOnline) {
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
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/inventory/suppliers`,
        method: "POST",
        body,
        queryKeysToInvalidate: [[...inventoryKeys.suppliers(orgId ?? "")]],
      });
      return { queued: true } as unknown as Supplier;
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
    onSuccess: (data) => {
      const d = data as unknown as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        toast.success("Supplier created");
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.suppliers(orgId ?? "") });
    },
  });
  return mutation;
}

export function useUpdateSupplier(orgId: string | undefined) {
  const qc = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();
  const mutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Partial<Supplier>;
    }) => {
      if (isOnline) {
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
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/inventory/suppliers?supplierId=${id}`,
        method: "PATCH",
        body,
        queryKeysToInvalidate: [[...inventoryKeys.suppliers(orgId ?? "")]],
      });
      return { queued: true } as unknown as Supplier;
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
    onSuccess: (data) => {
      const d = data as unknown as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        toast.success("Supplier updated");
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.suppliers(orgId ?? "") });
    },
  });
  return mutation;
}

export function useDeleteSupplier(orgId: string | undefined) {
  const qc = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();
  const mutation = useMutation({
    mutationFn: async (id: string) => {
      if (isOnline) {
        const res = await fetch(
          `/api/organizations/${orgId}/inventory/suppliers?supplierId=${id}`,
          {
            method: "DELETE",
          },
        );
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        return json.data;
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/inventory/suppliers?supplierId=${id}`,
        method: "DELETE",
        body: undefined,
        queryKeysToInvalidate: [[...inventoryKeys.suppliers(orgId ?? "")]],
      });
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
    onSuccess: (data) => {
      const d = data as unknown as Record<string, unknown> | undefined;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        toast.success("Supplier deleted");
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.suppliers(orgId ?? "") });
    },
  });
  return mutation;
}

export function useUpdatePart(orgId: string | undefined) {
  const qc = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();
  const mutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: UpdatePartParams;
    }) => {
      if (!orgId) throw new Error("No organization ID");

      if (isOnline) {
        const res = await fetch(
          `/api/organizations/${orgId}/inventory/parts/${id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
        );
        let json: Record<string, unknown>;
        try {
          json = await res.json();
        } catch {
          throw new Error(
            `Server returned ${res.status} ${res.statusText}. Please try again.`,
          );
        }
        const apiError2 = json.error as { message?: string } | undefined;
        if (apiError2) throw new Error(apiError2.message ?? "Request failed");
        return json.data as PartsCatalogItem;
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/inventory/parts/${id}`,
        method: "PATCH",
        body,
        queryKeysToInvalidate: [[...inventoryKeys.parts(orgId)]],
      });
      return { queued: true } as unknown as PartsCatalogItem;
    },
    onMutate: async ({ id, body }) => {
      const key = inventoryKeys.parts(orgId ?? "");
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<PartsCatalogItem[]>(key);
      if (previous) {
        qc.setQueryData<PartsCatalogItem[]>(
          key,
          previous.map((p) =>
            p.id === id
              ? { ...p, ...body, updated_at: new Date().toISOString() }
              : p,
          ),
        );
      }
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous)
        qc.setQueryData<PartsCatalogItem[]>(
          inventoryKeys.parts(orgId ?? ""),
          context.previous,
        );
      toastRetry(err.message, () => mutation.mutateAsync(variables));
    },
    onSuccess: (data) => {
      const d = data as unknown as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        toast.success("Part updated");
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.parts(orgId ?? "") });
      qc.invalidateQueries({
        queryKey: inventoryKeys.balances(orgId ?? ""),
      });
    },
  });
  return mutation;
}

export function useCreatePurchaseOrder(orgId: string | undefined) {
  const qc = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();
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
      if (isOnline) {
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
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/inventory/purchase-orders`,
        method: "POST",
        body,
        queryKeysToInvalidate: [[...inventoryKeys.purchaseOrders(orgId ?? "")]],
      });
      return { queued: true } as unknown as PurchaseOrder;
    },
    onSuccess: (data) => {
      const d = data as unknown as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        qc.invalidateQueries({
          queryKey: inventoryKeys.purchaseOrders(orgId ?? ""),
        });
      }
    },
  });
}

export function useUpdatePurchaseOrder(orgId: string | undefined) {
  const qc = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Partial<PurchaseOrder>;
    }) => {
      if (isOnline) {
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
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/inventory/purchase-orders?poId=${id}`,
        method: "PATCH",
        body,
        queryKeysToInvalidate: [[...inventoryKeys.purchaseOrders(orgId ?? "")]],
      });
      return { queued: true } as unknown as PurchaseOrder;
    },
    onSuccess: (data) => {
      const d = data as unknown as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        qc.invalidateQueries({
          queryKey: inventoryKeys.purchaseOrders(orgId ?? ""),
        });
      }
    },
  });
}

export function useReceivePurchaseOrder(orgId: string | undefined) {
  const qc = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();
  return useMutation({
    mutationFn: async (poId: string) => {
      if (isOnline) {
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
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/inventory/purchase-orders/${poId}/receive`,
        method: "POST",
        body: {},
        queryKeysToInvalidate: [
          [...inventoryKeys.purchaseOrders(orgId ?? "")],
          [...inventoryKeys.balances(orgId ?? "")],
          [...inventoryKeys.parts(orgId ?? "")],
          [...inventoryKeys.movements(orgId ?? "")],
        ],
      });
      return { queued: true } as unknown as PurchaseOrder;
    },
    onSuccess: (data) => {
      const d = data as unknown as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        qc.invalidateQueries({
          queryKey: inventoryKeys.purchaseOrders(orgId ?? ""),
        });
        qc.invalidateQueries({ queryKey: inventoryKeys.balances(orgId ?? "") });
        qc.invalidateQueries({ queryKey: inventoryKeys.parts(orgId ?? "") });
        qc.invalidateQueries({
          queryKey: inventoryKeys.movements(orgId ?? ""),
        });
      }
    },
  });
}

export function useCreatePartsCar(orgId: string | undefined) {
  const qc = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();
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
      if (isOnline) {
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
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/inventory/parts-cars`,
        method: "POST",
        body,
        queryKeysToInvalidate: [[...inventoryKeys.partsCars(orgId ?? "")]],
      });
      return { queued: true } as unknown as PartsCars;
    },
    onSuccess: (data) => {
      const d = data as unknown as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        qc.invalidateQueries({
          queryKey: inventoryKeys.partsCars(orgId ?? ""),
        });
      }
    },
  });
}

export function useStartDisassembly(orgId: string | undefined) {
  const qc = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();
  return useMutation({
    mutationFn: async (carId: string) => {
      if (isOnline) {
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
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/inventory/parts-cars/${carId}`,
        method: "PATCH",
        body: { status: "disassembling" },
        queryKeysToInvalidate: [[...inventoryKeys.partsCars(orgId ?? "")]],
      });
      return { queued: true } as unknown as PartsCars;
    },
    onSuccess: (data) => {
      const d = data as unknown as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        qc.invalidateQueries({
          queryKey: inventoryKeys.partsCars(orgId ?? ""),
        });
      }
    },
  });
}

export function useCompleteDisassembly(orgId: string | undefined) {
  const qc = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();
  return useMutation({
    mutationFn: async (carId: string) => {
      if (isOnline) {
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
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/inventory/parts-cars/${carId}/complete`,
        method: "POST",
        body: {},
        queryKeysToInvalidate: [[...inventoryKeys.partsCars(orgId ?? "")]],
      });
      return { queued: true } as unknown as PartsCars;
    },
    onSuccess: (data, carId) => {
      const d = data as unknown as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        qc.invalidateQueries({
          queryKey: inventoryKeys.partsCars(orgId ?? ""),
        });
        qc.invalidateQueries({
          queryKey: inventoryKeys.partsCar(orgId ?? "", carId),
        });
      }
    },
  });
}

export function usePublishPartsCarToCatalog(orgId: string | undefined) {
  const qc = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();
  return useMutation({
    mutationFn: async (carId: string) => {
      if (isOnline) {
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
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/inventory/parts-cars/${carId}/publish`,
        method: "POST",
        body: {},
        queryKeysToInvalidate: [[...inventoryKeys.partsCars(orgId ?? "")]],
      });
      return { queued: true } as unknown as {
        publishedCount: number;
        catalogIds: string[];
      };
    },
    onSuccess: (data, carId) => {
      const d = data as unknown as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        qc.invalidateQueries({
          queryKey: inventoryKeys.partsCars(orgId ?? ""),
        });
        qc.invalidateQueries({
          queryKey: inventoryKeys.partsCar(orgId ?? "", carId),
        });
        qc.invalidateQueries({
          queryKey: inventoryKeys.partsCarParts(orgId ?? "", carId),
        });
        qc.invalidateQueries({ queryKey: inventoryKeys.parts(orgId ?? "") });
        qc.invalidateQueries({ queryKey: inventoryKeys.balances(orgId ?? "") });
      }
    },
  });
}

export function useAddPartsCarPart(orgId: string | undefined) {
  const qc = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();
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
      if (isOnline) {
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
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/inventory/parts-cars/${carId}/parts`,
        method: "POST",
        body,
        queryKeysToInvalidate: [
          [...inventoryKeys.partsCarParts(orgId ?? "", carId)],
        ],
      });
      return { queued: true } as unknown as PartsCarParts;
    },
    onSuccess: (data, variables) => {
      const d = data as unknown as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        qc.invalidateQueries({
          queryKey: inventoryKeys.partsCarParts(orgId ?? "", variables.carId),
        });
      }
    },
  });
}

export function useRemovePartsCarPart(orgId: string | undefined) {
  const qc = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();
  return useMutation({
    mutationFn: async ({
      carId,
      partId,
    }: {
      carId: string;
      partId: string;
    }) => {
      if (isOnline) {
        const res = await fetch(
          `/api/organizations/${orgId}/inventory/parts-cars/${carId}/parts/${partId}`,
          { method: "DELETE" },
        );
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error?.message ?? "Failed to remove part");
        }
        return;
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/inventory/parts-cars/${carId}/parts/${partId}`,
        method: "DELETE",
        body: undefined,
        queryKeysToInvalidate: [
          [...inventoryKeys.partsCarParts(orgId ?? "", carId)],
        ],
      });
    },
    onSuccess: (data, variables) => {
      const d = data as unknown as Record<string, unknown> | undefined;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        qc.invalidateQueries({
          queryKey: inventoryKeys.partsCarParts(orgId ?? "", variables.carId),
        });
      }
    },
  });
}

export function useUpdatePartsCar(orgId: string | undefined) {
  const qc = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: string } & Record<string, unknown>) => {
      if (isOnline) {
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
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/inventory/parts-cars/${id}`,
        method: "PATCH",
        body: data,
        queryKeysToInvalidate: [[...inventoryKeys.partsCars(orgId ?? "")]],
      });
      return { queued: true } as unknown as unknown;
    },
    onSuccess: (data) => {
      const d = data as unknown as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        qc.invalidateQueries({
          queryKey: inventoryKeys.partsCars(orgId ?? ""),
        });
      }
    },
  });
}

export function useDeletePartsCar(orgId: string | undefined) {
  const qc = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isOnline) {
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
        return;
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/inventory/parts-cars/${id}`,
        method: "DELETE",
        body: undefined,
        queryKeysToInvalidate: [[...inventoryKeys.partsCars(orgId ?? "")]],
      });
    },
    onSuccess: (data) => {
      const d = data as unknown as Record<string, unknown> | undefined;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        qc.invalidateQueries({
          queryKey: inventoryKeys.partsCars(orgId ?? ""),
        });
      }
    },
  });
}
