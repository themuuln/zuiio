"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GlobalPartCatalog, GlobalServiceCatalog } from "@/lib/types";
import type {
  CatalogPartItem,
  CatalogServiceItem,
  DrawerDataResult,
} from "./_drawer-types";

export function useDrawerData(
  workOrderId: string | null,
  open: boolean,
): DrawerDataResult {
  const [wo, setWo] = useState<DrawerDataResult["wo"]>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<CatalogServiceItem[]>([]);
  const [partsCatalog, setPartsCatalog] = useState<CatalogPartItem[]>([]);
  const [lowStockMap, setLowStockMap] = useState<
    Record<string, { quantity: number; threshold: number }>
  >({});
  const [mechanics, setMechanics] = useState<
    Array<{ id: string; full_name: string }>
  >([]);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const orgIdRef = useRef<string | null>(null);
  const catalogFetchedRef = useRef(false);

  // ── Fetch work order detail ──

  const fetchWo = useCallback(
    async (silent = false, orgIdOverride?: string) => {
      const orgId = orgIdOverride ?? orgIdRef.current;
      if (!workOrderId || !orgId) return;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/organizations/${orgId}/work-orders/${workOrderId}`,
        );
        const json = await res.json();
        if (json.error) {
          setError(json.error.message ?? "Failed to load work order");
        } else {
          setWo(json.data);
        }
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    },
    [workOrderId],
  );

  // ── Initial data fetch on open ──

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const abort = new AbortController();
    const signal = abort.signal;

    fetch("/api/profile", { signal })
      .then((r) => r.json())
      .then((d) => {
        if (signal.aborted) return;
        const id = d?.organizationId ?? d?.data?.organizationId;
        if (id) {
          orgIdRef.current = id;
          fetchWo();

          // Fetch org-specific and global catalogs in parallel
          Promise.all([
            fetch(`/api/organizations/${id}/services`, { signal }).then((r) =>
              r.json(),
            ),
            fetch(`/api/organizations/${id}/inventory/parts`, { signal }).then(
              (r) => r.json(),
            ),
            fetch("/api/global-catalog/services", { signal }).then((r) =>
              r.json(),
            ),
            fetch("/api/global-catalog/parts", { signal }).then((r) =>
              r.json(),
            ),
            fetch(`/api/organizations/${id}/inventory/balances`, {
              signal,
            }).then((r) => r.json()),
            fetch(`/api/organizations/${id}/inventory/thresholds`, {
              signal,
            }).then((r) => r.json()),
          ])
            .then(
              ([
                orgServicesRes,
                orgPartsRes,
                globalServicesRes,
                globalPartsRes,
                balancesRes,
                thresholdsRes,
              ]) => {
                if (signal.aborted) return;

                // Merge services: org first, then global (deduplicated by name)
                const orgServices: CatalogServiceItem[] =
                  orgServicesRes.data ?? [];
                const globalServices: GlobalServiceCatalog[] =
                  globalServicesRes.data ?? [];
                const seenNames = new Set(
                  orgServices.map((s) => s.name.toLowerCase()),
                );
                const mergedServices: CatalogServiceItem[] = [
                  ...orgServices,
                  ...globalServices
                    .filter((gs) => !seenNames.has(gs.name.toLowerCase()))
                    .map((gs) => ({
                      id: gs.id,
                      name: gs.name,
                      name_mn: gs.name_mn,
                      category: gs.category,
                      description: gs.description,
                      default_price: 0,
                      is_active: true,
                      estimated_duration_minutes: gs.estimated_duration_minutes,
                      interval_km: null,
                      interval_months: null,
                      _source: "global" as const,
                    })),
                ];
                setCatalog(mergedServices);

                // Merge parts: org first, then global (deduplicated by name)
                const orgParts: CatalogPartItem[] =
                  orgPartsRes.data?.data ?? orgPartsRes.data ?? [];
                const globalParts: GlobalPartCatalog[] =
                  globalPartsRes.data ?? [];
                const seenPartNames = new Set(
                  orgParts.map((p) => p.name.toLowerCase()),
                );
                const mergedParts: CatalogPartItem[] = [
                  ...orgParts,
                  ...globalParts
                    .filter((gp) => !seenPartNames.has(gp.name.toLowerCase()))
                    .map((gp) => ({
                      id: gp.id,
                      name: gp.name,
                      name_mn: gp.name_mn,
                      category: gp.category,
                      description: gp.description,
                      part_number: gp.part_number,
                      default_price: 0,
                      is_active: true,
                      _source: "global" as const,
                    })),
                ];
                setPartsCatalog(mergedParts);

                // Build low-stock map from balances and thresholds
                const balancesList: Array<{
                  part_id: string;
                  quantity_on_hand: number;
                }> = balancesRes.data?.data ?? balancesRes.data ?? [];
                const thresholdsList: Array<{
                  part_id: string;
                  minimum_quantity: number;
                }> = thresholdsRes.data?.data ?? thresholdsRes.data ?? [];
                const thresholdMap: Record<string, number> = {};
                for (const t of thresholdsList) {
                  thresholdMap[t.part_id] = t.minimum_quantity;
                }
                const lowStock: Record<
                  string,
                  { quantity: number; threshold: number }
                > = {};
                for (const b of balancesList) {
                  const min = thresholdMap[b.part_id] ?? 5;
                  if (b.quantity_on_hand < min) {
                    lowStock[b.part_id] = {
                      quantity: b.quantity_on_hand,
                      threshold: min,
                    };
                  }
                }
                setLowStockMap(lowStock);
              },
            )
            .catch((err) => {
              if (!signal.aborted)
                console.error("Failed to load catalogs:", err);
            });

          fetch(`/api/organizations/${id}/reports?type=mechanics`, { signal })
            .then((r) => r.json())
            .then((d) => {
              if (!signal.aborted && d.data) setMechanics(d.data);
            })
            .catch((err) => {
              if (!signal.aborted)
                console.error("Failed to load mechanics:", err);
            });
        }
      })
      .catch((err) => {
        if (!signal.aborted) console.error("Failed to fetch profile:", err);
      });

    if (!catalogFetchedRef.current) {
      catalogFetchedRef.current = true;
    }

    return () => abort.abort();
  }, [open, fetchWo]);

  // ── Track first successful load for layout-preserving loading ──

  useEffect(() => {
    if (wo) setHasLoadedOnce(true);
  }, [wo]);

  // ── Reset state on close for clean reopen ──

  useEffect(() => {
    if (!open) {
      orgIdRef.current = null;
      setWo(null);
      setError(null);
      setLoading(false);
    }
  }, [open]);

  return {
    wo,
    setWo,
    loading,
    error,
    hasLoadedOnce,
    orgIdRef,
    fetchWo,
    catalog,
    partsCatalog,
    lowStockMap,
    mechanics,
  };
}
