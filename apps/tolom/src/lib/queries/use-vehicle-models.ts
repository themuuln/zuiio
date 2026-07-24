import { useQuery } from "@tanstack/react-query";
import type { VehicleModel } from "@/lib/types";
import { createOrgQuery } from "./factory";
import { vehicleModelKeys } from "./keys";

/**
 * Fetches all distinct makes from the vehicle_models catalog.
 * Falls back to hardcoded list if the regular list is needed for non-catalog entries.
 */
const fetchMakes = createOrgQuery<string[]>("/vehicle-models");

export function useMakes(
  orgId: string | undefined,
): ReturnType<typeof useQuery<string[], Error>> {
  return useQuery({
    queryKey: vehicleModelKeys.makes(orgId ?? ""),
    queryFn: () => {
      if (!orgId) throw new Error("orgId required");
      return fetchMakes(orgId, { params: { mode: "makes" } });
    },
    enabled: !!orgId,
    staleTime: 5 * 60_000,
  });
}

/**
 * Fetches vehicle models (distinct model names) for a given make from the catalog.
 */
const fetchModels = createOrgQuery<VehicleModel[]>("/vehicle-models");

export function useModelsByMake(
  orgId: string | undefined,
  make: string,
): ReturnType<typeof useQuery<string[], Error>> {
  return useQuery({
    queryKey: vehicleModelKeys.modelsByMake(orgId ?? "", make),
    queryFn: async () => {
      if (!orgId) throw new Error("orgId required");
      const models = await fetchModels(orgId, { params: { make } });
      return [...new Set(models.map((m) => m.model))];
    },
    enabled: !!orgId && !!make.trim(),
    staleTime: 5 * 60_000,
  });
}
