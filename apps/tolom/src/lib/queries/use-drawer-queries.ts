"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef } from "react";
import type {
  CatalogPartItem,
  CatalogServiceItem,
  PriceMatchQuality,
} from "@/components/bay-view-v2/_drawer-types";
import type {
  GlobalPartCatalog,
  GlobalServiceCatalog,
  PartsCatalogItem,
  ServiceCatalog,
  StockThreshold,
  WorkOrderDetail,
} from "@/lib/types";
import { useCurrentOrg } from "./use-organization";

// ── Shape of the consolidated API response ─────────────────────

interface DrawerDetailResponse {
  workOrder: WorkOrderDetail;
  servicesCatalog: ServiceCatalog[];
  partsCatalog: PartsCatalogItem[];
  globalServices: GlobalServiceCatalog[];
  globalParts: GlobalPartCatalog[];
  balances: Array<{ part_id: string; quantity_on_hand: number }>;
  thresholds: StockThreshold[];
  mechanics: Array<{ id: string; full_name: string }>;
  priceMemory: {
    services: Record<string, PriceMemoryEntry>;
    parts: Record<string, PriceMemoryEntry>;
  };
}

// ── Match quality helper ───────────────────────────────────────

function computeMatchQuality(
  lastMake: string | null | undefined,
  lastModel: string | null | undefined,
  currentMake: string | null | undefined,
  currentModel: string | null | undefined,
): PriceMatchQuality | null {
  if (!lastMake || !currentMake) return null;
  const lm = lastMake.toLowerCase();
  const lmd = lastModel?.toLowerCase();
  const cm = currentMake.toLowerCase();
  const cmd = currentModel?.toLowerCase();

  if (lm === cm) {
    if (lmd && cmd && lmd === cmd) return "exact";
    return "same_make";
  }
  return "fallback";
}

interface PriceMemoryEntry {
  unit_price: number;
  last_price?: number;
  created_at: string;
  last_make?: string;
  last_model?: string;
}

// ── Merge helpers ──────────────────────────────────────────────

function mergeServices(
  orgServices: ServiceCatalog[],
  globalServices: GlobalServiceCatalog[],
  priceMemory?: Record<string, PriceMemoryEntry>,
  currentMake?: string | null,
  currentModel?: string | null,
): CatalogServiceItem[] {
  const seen = new Set(orgServices.map((s) => s.name.toLowerCase()));
  return [
    ...orgServices.map((s) => {
      const pm = priceMemory?.[s.id];
      return {
        ...s,
        last_price: pm?.unit_price ?? null,
        last_make: pm?.last_make ?? null,
        last_model: pm?.last_model ?? null,
        match_quality: computeMatchQuality(
          pm?.last_make,
          pm?.last_model,
          currentMake,
          currentModel,
        ),
      };
    }),
    ...globalServices
      .filter((gs) => !seen.has(gs.name.toLowerCase()))
      .map((gs) => {
        const pm = priceMemory?.[gs.id];
        return {
          id: gs.id,
          name: gs.name,
          name_mn: gs.name_mn,
          category: gs.category,
          desc: gs.description ?? null,
          default_price: 0,
          last_price: pm?.unit_price ?? null,
          last_make: pm?.last_make ?? null,
          last_model: pm?.last_model ?? null,
          match_quality: computeMatchQuality(
            pm?.last_make,
            pm?.last_model,
            currentMake,
            currentModel,
          ),
          is_active: true,
          estimated_duration_minutes: gs.estimated_duration_minutes,
          interval_km: null,
          interval_months: null,
          _source: "global" as const,
        };
      }),
  ];
}

function mergeParts(
  orgParts: PartsCatalogItem[],
  globalParts: GlobalPartCatalog[],
  priceMemory?: Record<string, PriceMemoryEntry>,
  currentMake?: string | null,
  currentModel?: string | null,
): CatalogPartItem[] {
  const seen = new Set(orgParts.map((p) => p.name.toLowerCase()));
  return [
    ...orgParts.map((p) => {
      const pm = priceMemory?.[p.name.toLowerCase()];
      return {
        ...p,
        default_price: p.default_price ?? 0,
        last_price: pm?.unit_price ?? p.default_price ?? 0,
        last_make: pm?.last_make ?? null,
        last_model: pm?.last_model ?? null,
        match_quality: computeMatchQuality(
          pm?.last_make,
          pm?.last_model,
          currentMake,
          currentModel,
        ),
      };
    }),
    ...globalParts
      .filter((gp) => !seen.has(gp.name.toLowerCase()))
      .map((gp) => {
        const pm = priceMemory?.[gp.name.toLowerCase()];
        return {
          id: gp.id,
          name: gp.name,
          name_mn: gp.name_mn,
          category: gp.category,
          desc: gp.description ?? null,
          part_number: gp.part_number,
          default_price: 0,
          last_price: pm?.unit_price ?? null,
          last_make: pm?.last_make ?? null,
          last_model: pm?.last_model ?? null,
          match_quality: computeMatchQuality(
            pm?.last_make,
            pm?.last_model,
            currentMake,
            currentModel,
          ),
          is_active: true,
          _source: "global" as const,
        };
      }),
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

// ── Consolidated query key ─────────────────────────────────────

const drawerDetailKeys = {
  all: (orgId: string, woId: string) => ["drawer-detail", orgId, woId] as const,
};

// ── Prefetch function (call on hover) ──────────────────────────

/**
 * Warm the React Query cache before the drawer opens.
 * Prefetches the consolidated detail endpoint in a single request.
 */
export async function prefetchDrawerData(
  queryClient: ReturnType<typeof useQueryClient>,
  orgId: string | null | undefined,
  woId: string,
): Promise<void> {
  if (!orgId || !woId) return;

  await queryClient.prefetchQuery({
    queryKey: drawerDetailKeys.all(orgId, woId),
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${woId}/detail`,
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as DrawerDetailResponse;
    },
    staleTime: 15_000,
  });
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

  // ── Consolidated query: single API call for all drawer data ──
  const detailQuery = useQuery({
    queryKey: drawerDetailKeys.all(orgId ?? "", woId ?? ""),
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${woId}/detail`,
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as DrawerDetailResponse;
    },
    enabled: !!orgId && !!woId,
    staleTime: 15_000,
  });

  const response = detailQuery.data;

  // ── Vehicle context for match quality ──

  const currentMake = response?.workOrder?.vehicle?.make;
  const currentModel = response?.workOrder?.vehicle?.model;

  // ── Derived data ──

  const catalog = useMemo(
    () =>
      mergeServices(
        response?.servicesCatalog ?? [],
        response?.globalServices ?? [],
        response?.priceMemory?.services,
        currentMake,
        currentModel,
      ),
    [
      response?.servicesCatalog,
      response?.globalServices,
      response?.priceMemory?.services,
      currentMake,
      currentModel,
    ],
  );

  const partsCatalog = useMemo(
    () =>
      mergeParts(
        response?.partsCatalog ?? [],
        response?.globalParts ?? [],
        response?.priceMemory?.parts,
        currentMake,
        currentModel,
      ),
    [
      response?.partsCatalog,
      response?.globalParts,
      response?.priceMemory?.parts,
      currentMake,
      currentModel,
    ],
  );

  const lowStockMap = useMemo(
    () => computeLowStock(response?.balances ?? [], response?.thresholds ?? []),
    [response?.balances, response?.thresholds],
  );

  // ── setWo: update the work order inside the consolidated cache ──

  const setWo = useCallback(
    (
      updater:
        | WorkOrderDetail
        | null
        | ((prev: WorkOrderDetail | null) => WorkOrderDetail | null),
    ) => {
      if (!orgId || !woId) return;
      const key = drawerDetailKeys.all(orgId, woId);
      queryClient.setQueryData<DrawerDetailResponse>(key, (prev) => {
        if (!prev) return prev;
        const currentWo = prev.workOrder;
        const newWo =
          typeof updater === "function" ? updater(currentWo ?? null) : updater;
        if (!newWo) return prev;
        return { ...prev, workOrder: newWo };
      });
    },
    [orgId, woId, queryClient],
  );

  // ── Loading state ──

  const isLoading =
    orgQuery.isLoading || (detailQuery.isEnabled && detailQuery.isLoading);

  const isError = orgQuery.isError || detailQuery.isError;
  const error = orgQuery.error || detailQuery.error;

  return {
    orgId,
    orgIdRef,
    wo: response?.workOrder ?? null,
    setWo,
    catalog,
    partsCatalog,
    lowStockMap,
    mechanics: response?.mechanics ?? [],
    isLoading,
    isError,
    error,
  };
}
