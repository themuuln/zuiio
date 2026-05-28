import { useQuery } from "@tanstack/react-query";
import type { VehicleModel } from "@/lib/types";
import { vehicleModelKeys } from "./keys";

/**
 * Fetches all distinct makes from the vehicle_models catalog.
 * Falls back to hardcoded list if the regular list is needed for non-catalog entries.
 */
export function useMakes(
  orgId: string | undefined,
): ReturnType<typeof useQuery<string[], Error>> {
  return useQuery({
    queryKey: vehicleModelKeys.makes(orgId ?? ""),
    queryFn: async () => {
      if (!orgId) return [];
      const res = await fetch(
        `/api/organizations/${orgId}/vehicle-models?mode=makes`,
      );
      if (!res.ok) throw new Error("Failed to load makes");
      const json = await res.json();
      return (json.data ?? []) as string[];
    },
    enabled: !!orgId,
    staleTime: 60_000,
  });
}

/**
 * Fetches vehicle models (distinct model names) for a given make from the catalog.
 */
export function useModelsByMake(
  orgId: string | undefined,
  make: string,
): ReturnType<typeof useQuery<string[], Error>> {
  return useQuery({
    queryKey: vehicleModelKeys.modelsByMake(orgId ?? "", make),
    queryFn: async () => {
      if (!orgId || !make.trim()) return [];
      const res = await fetch(
        `/api/organizations/${orgId}/vehicle-models?make=${encodeURIComponent(make)}`,
      );
      if (!res.ok) throw new Error("Failed to load models");
      const json = await res.json();
      const models = (json.data ?? []) as VehicleModel[];
      // Return distinct model names only
      return [...new Set(models.map((m) => m.model))];
    },
    enabled: !!orgId && !!make.trim(),
    staleTime: 60_000,
  });
}
