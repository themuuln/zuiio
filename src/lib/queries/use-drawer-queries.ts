"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CatalogPartItem,
  CatalogServiceItem,
} from "@/components/bay-view-v2/_drawer-types";
import type {
  GlobalPartCatalog,
  GlobalServiceCatalog,
  PartsCatalogItem,
  ServiceCatalog,
  StockThreshold,
  WorkOrderDetail,
} from "@/lib/types";
import {
  globalCatalogKeys,
  inventoryKeys,
  mechanicKeys,
  priceMemoryKeys,
  serviceKeys,
  workOrderKeys,
} from "./keys";
import { useCurrentOrg } from "./use-organization";

// ── Merge helpers ──────────────────────────────────────────────

function mergeServices(
  orgServices: ServiceCatalog[],
  globalServices: GlobalServiceCatalog[],
  priceMemory?: Record<string, { unit_price: number; created_at: string }>,
): CatalogServiceItem[] {
  const seen = new Set(orgServices.map((s) => s.name.toLowerCase()));
  return [
    ...orgServices.map((s) => ({
      ...s,
      last_price: priceMemory?.[s.id]?.unit_price ?? null,
    })),
    ...globalServices
      .filter((gs) => !seen.has(gs.name.toLowerCase()))
      .map((gs) => ({
        id: gs.id,
        name: gs.name,
        name_mn: gs.name_mn,
        category: gs.category,
        desc: gs.description ?? null,
        default_price: 0,
        last_price: priceMemory?.[gs.id]?.unit_price ?? null,
        is_active: true,
        estimated_duration_minutes: gs.estimated_duration_minutes,
        interval_km: null,
        interval_months: null,
        _source: "global" as const,
      })),
  ];
}

function mergeParts(
  orgParts: PartsCatalogItem[],
  globalParts: GlobalPartCatalog[],
): CatalogPartItem[] {
  const seen = new Set(orgParts.map((p) => p.name.toLowerCase()));
  return [
    ...orgParts.map((p) => ({ ...p, default_price: p.default_price ?? 0 })),
    ...globalParts
      .filter((gp) => !seen.has(gp.name.toLowerCase()))
      .map((gp) => ({
        id: gp.id,
        name: gp.name,
        name_mn: gp.name_mn,
        category: gp.category,
        desc: gp.description ?? null,
        part_number: gp.part_number,
        default_price: 0,
        is_active: true,
        _source: "global" as const,
      })),
  ];
}

function computeLowStock(
  balances: Array<{ part_id: string; quantity_on_hand: number }>,
  thresholds: StockThreshold[],
): Record<string, { quantity: number; threshold: number }> {
  const thresholdMap: Record<string, number> = {};
  for (const t of thresholds) {
    thresholdMap[t.part_id] = t.minimum_quantity;
  }
  const lowStock: Record<string, { quantity: number; threshold: number }> = {};
  for (const b of balances) {
    const min = thresholdMap[b.part_id] ?? 5;
    if (b.quantity_on_hand < min) {
      lowStock[b.part_id] = { quantity: b.quantity_on_hand, threshold: min };
    }
  }
  return lowStock;
}

// ── Prefetch function (call on hover) ──────────────────────────

/**
 * Warm the React Query cache before the drawer opens.
 * Call on onMouseEnter of a work order card for instant drawer open.
 */
export async function prefetchDrawerData(
  queryClient: ReturnType<typeof useQueryClient>,
  orgId: string | null | undefined,
  woId: string,
): Promise<void> {
  if (!orgId || !woId) return;

  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: workOrderKeys.detail(orgId, woId),
      queryFn: async () => {
        const res = await fetch(
          `/api/organizations/${orgId}/work-orders/${woId}`,
        );
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        return json.data as WorkOrderDetail;
      },
      staleTime: 15_000,
    }),
    queryClient.prefetchQuery({
      queryKey: serviceKeys.list(orgId),
      queryFn: async () => {
        const res = await fetch(`/api/organizations/${orgId}/services`);
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        return (json.data ?? []) as ServiceCatalog[];
      },
      staleTime: 300_000, // 5 min — catalog rarely changes after setup
    }),
    queryClient.prefetchQuery({
      queryKey: mechanicKeys.list(orgId),
      queryFn: async () => {
        const res = await fetch(
          `/api/organizations/${orgId}/reports?type=mechanics`,
        );
        const json = await res.json();
        return (json.data ?? []) as Array<{ id: string; full_name: string }>;
      },
      staleTime: 60_000, // 1 min — mechanics change occasionally
    }),
    queryClient.prefetchQuery({
      queryKey: inventoryKeys.parts(orgId),
      queryFn: async () => {
        const res = await fetch(`/api/organizations/${orgId}/inventory/parts`);
        const json = await res.json();
        return (json.data?.data ?? json.data ?? []) as PartsCatalogItem[];
      },
      staleTime: 300_000, // 5 min — parts rarely change after setup
    }),
    queryClient.prefetchQuery({
      queryKey: globalCatalogKeys.services(),
      queryFn: async () => {
        const res = await fetch("/api/global-catalog/services");
        const json = await res.json();
        return (json.data ?? []) as GlobalServiceCatalog[];
      },
      staleTime: 3600_000,
    }),
    queryClient.prefetchQuery({
      queryKey: globalCatalogKeys.parts(),
      queryFn: async () => {
        const res = await fetch("/api/global-catalog/parts");
        const json = await res.json();
        return (json.data ?? []) as GlobalPartCatalog[];
      },
      staleTime: 3600_000,
    }),
    queryClient.prefetchQuery({
      queryKey: inventoryKeys.balances(orgId),
      queryFn: async () => {
        const res = await fetch(
          `/api/organizations/${orgId}/inventory/balances`,
        );
        const json = await res.json();
        return (json.data?.data ?? json.data ?? []) as Array<{
          part_id: string;
          quantity_on_hand: number;
        }>;
      },
      staleTime: 30_000,
    }),
    queryClient.prefetchQuery({
      queryKey: inventoryKeys.thresholds(orgId),
      queryFn: async () => {
        const res = await fetch(
          `/api/organizations/${orgId}/inventory/thresholds`,
        );
        const json = await res.json();
        return (json.data?.data ?? json.data ?? []) as StockThreshold[];
      },
      staleTime: 60_000,
    }),
  ]);
}

// ── Drawer data hook (React Query) ─────────────────────────────

interface UseDrawerQueriesResult {
  orgId: string | null;
  orgIdRef: React.MutableRefObject<string | null>;
  wo: WorkOrderDetail | null;
  setWo: React.Dispatch<React.SetStateAction<WorkOrderDetail | null>>;
  catalog: CatalogServiceItem[];
  partsCatalog: CatalogPartItem[];
  lowStockMap: Record<string, { quantity: number; threshold: number }>;
  mechanics: Array<{ id: string; full_name: string }>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export function useDrawerQueries(woId: string | null): UseDrawerQueriesResult {
  const queryClient = useQueryClient();
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId ?? null;

  // Keep a ref for mutations (they need synchronous access)
  const orgIdRef = useRef<string | null>(null);
  orgIdRef.current = orgId;

  // Defer catalog loading — only fetch after work order detail renders
  const [catalogsEnabled, setCatalogsEnabled] = useState(false);

  // Work order detail
  const woQuery = useQuery({
    queryKey: workOrderKeys.detail(orgId ?? "", woId ?? ""),
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${woId}`,
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as WorkOrderDetail;
    },
    enabled: !!orgId && !!woId,
    staleTime: 15_000,
  });

  // Lazy-load catalogs: fire after work order detail renders
  useEffect(() => {
    if (woQuery.data) setCatalogsEnabled(true);
  }, [woQuery.data]);

  // Org service catalog
  const serviceQuery = useQuery({
    queryKey: serviceKeys.list(orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/services`);
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return (json.data ?? []) as ServiceCatalog[];
    },
    enabled: catalogsEnabled && !!orgId,
    staleTime: 300_000, // 5 min — catalog rarely changes after setup
  });

  // Org parts catalog
  const partsQuery = useQuery({
    queryKey: inventoryKeys.parts(orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/inventory/parts`);
      const json = await res.json();
      return (json.data?.data ?? json.data ?? []) as PartsCatalogItem[];
    },
    enabled: catalogsEnabled && !!orgId,
    staleTime: 300_000, // 5 min — catalog rarely changes after setup
  });

  // Global service catalog
  const globalServicesQuery = useQuery({
    queryKey: globalCatalogKeys.services(),
    queryFn: async () => {
      const res = await fetch("/api/global-catalog/services");
      const json = await res.json();
      return (json.data ?? []) as GlobalServiceCatalog[];
    },
    staleTime: 3600_000,
  });

  // Global parts catalog
  const globalPartsQuery = useQuery({
    queryKey: globalCatalogKeys.parts(),
    queryFn: async () => {
      const res = await fetch("/api/global-catalog/parts");
      const json = await res.json();
      return (json.data ?? []) as GlobalPartCatalog[];
    },
    staleTime: 3600_000,
  });

  // Inventory balances
  const balancesQuery = useQuery({
    queryKey: inventoryKeys.balances(orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/inventory/balances`);
      const json = await res.json();
      return (json.data?.data ?? json.data ?? []) as Array<{
        part_id: string;
        quantity_on_hand: number;
      }>;
    },
    enabled: catalogsEnabled && !!orgId,
    staleTime: 30_000,
  });

  // Stock thresholds
  const thresholdsQuery = useQuery({
    queryKey: inventoryKeys.thresholds(orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/inventory/thresholds`,
      );
      const json = await res.json();
      return (json.data?.data ?? json.data ?? []) as StockThreshold[];
    },
    enabled: catalogsEnabled && !!orgId,
    staleTime: 60_000, // 1 min — thresholds
  });

  // Mechanics
  const mechanicsQuery = useQuery({
    queryKey: mechanicKeys.list(orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/reports?type=mechanics`,
      );
      const json = await res.json();
      return (json.data ?? []) as Array<{ id: string; full_name: string }>;
    },
    enabled: catalogsEnabled && !!orgId,
    staleTime: 60_000,
  });

  // Price memory — org-wide last sold prices for services and parts
  const priceMemoryQuery = useQuery({
    queryKey: priceMemoryKeys.serviceLastUsed(orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/price-history`);
      const json = await res.json();
      const data = json.data as {
        services: Record<
          string,
          { unit_price?: number; last_price?: number; created_at?: string }
        >;
        parts: Record<string, { unit_price?: number; created_at?: string }>;
      };
      const serviceMap: Record<
        string,
        { unit_price: number; created_at: string }
      > = {};
      for (const [id, row] of Object.entries(data.services ?? {})) {
        serviceMap[id] = {
          unit_price: Number(row.unit_price ?? row.last_price ?? 0),
          created_at: row.created_at ?? "",
        };
      }
      const partsMap: Record<
        string,
        { unit_price: number; created_at: string }
      > = {};
      for (const [name, row] of Object.entries(data.parts ?? {})) {
        partsMap[name] = {
          unit_price: Number(row.unit_price ?? 0),
          created_at: row.created_at ?? "",
        };
      }
      return { services: serviceMap, parts: partsMap };
    },
    enabled: catalogsEnabled && !!orgId,
    staleTime: 60_000,
  });

  // ── Derived data (computed from cached queries) ──

  const catalog = useMemo(
    () =>
      mergeServices(
        serviceQuery.data ?? [],
        globalServicesQuery.data ?? [],
        priceMemoryQuery.data?.services,
      ),
    [serviceQuery.data, globalServicesQuery.data, priceMemoryQuery.data],
  );

  const partsCatalog = useMemo(
    () => mergeParts(partsQuery.data ?? [], globalPartsQuery.data ?? []),
    [partsQuery.data, globalPartsQuery.data],
  );

  const lowStockMap = useMemo(
    () => computeLowStock(balancesQuery.data ?? [], thresholdsQuery.data ?? []),
    [balancesQuery.data, thresholdsQuery.data],
  );

  // ── setWo: update the query cache directly ──

  const setWo = useCallback(
    (
      updater:
        | WorkOrderDetail
        | null
        | ((prev: WorkOrderDetail | null) => WorkOrderDetail | null),
    ) => {
      if (!orgId || !woId) return;
      const key = workOrderKeys.detail(orgId, woId);
      queryClient.setQueryData<WorkOrderDetail>(key, (prev) => {
        if (typeof updater === "function") {
          return updater(prev ?? null) ?? undefined;
        }
        return updater ?? undefined;
      });
    },
    [orgId, woId, queryClient],
  );

  // ── Loading state ──

  const isLoading =
    orgQuery.isLoading || (woQuery.isEnabled && woQuery.isLoading);

  const isError = orgQuery.isError || woQuery.isError;
  const error = orgQuery.error || woQuery.error;

  return {
    orgId,
    orgIdRef,
    wo: woQuery.data ?? null,
    setWo,
    catalog,
    partsCatalog,
    lowStockMap,
    mechanics: mechanicsQuery.data ?? [],
    isLoading,
    isError,
    error,
  };
}
