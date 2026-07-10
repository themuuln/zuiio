import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { globalCatalogKeys } from "./keys";

// ── Types ──────────────────────────────────────────────────────

export interface GlobalService {
  id: string;
  name: string;
  name_mn: string | null;
  category: string | null;
  description: string | null;
  estimated_duration_minutes: number | null;
  interval_months: number | null;
  interval_km: number | null;
}

export interface GlobalPart {
  id: string;
  name: string;
  name_mn: string | null;
  category: string | null;
  description: string | null;
  part_number: string | null;
  unit: string | null;
}

// ── Hooks ──────────────────────────────────────────────────────

/**
 * Fetch the global services catalog.
 * Visible to all organizations — no pricing (orgs set their own).
 * Cached for 1 hour (rarely changes).
 */
export function useGlobalServiceCatalog(): UseQueryResult<
  GlobalService[],
  Error
> {
  return useQuery({
    queryKey: globalCatalogKeys.services(),
    queryFn: async () => {
      const res = await fetch("/api/global-catalog/services");
      if (!res.ok) throw new Error("Failed to load global services");
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return (json.data ?? []) as GlobalService[];
    },
    staleTime: 3600_000, // 1 hour
    gcTime: 3600_000, // 1 hour
    retry: 2,
  });
}

/**
 * Fetch the global parts catalog.
 * Visible to all organizations — no pricing (orgs set their own).
 * Cached for 1 hour (rarely changes).
 */
export function useGlobalPartsCatalog(): UseQueryResult<GlobalPart[], Error> {
  return useQuery({
    queryKey: globalCatalogKeys.parts(),
    queryFn: async () => {
      const res = await fetch("/api/global-catalog/parts");
      if (!res.ok) throw new Error("Failed to load global parts");
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return (json.data ?? []) as GlobalPart[];
    },
    staleTime: 3600_000, // 1 hour
    gcTime: 3600_000, // 1 hour
    retry: 2,
  });
}
