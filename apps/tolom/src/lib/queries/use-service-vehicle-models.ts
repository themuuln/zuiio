/**
 * React Query hooks for vehicle-model-specific service pricing.
 */
import { useQuery } from "@tanstack/react-query";
import { useOrgMutation } from "@zuiio/query";
import { serviceKeys, vehicleModelKeys } from "./keys";

export interface VehicleModelServiceRow {
  id: string;
  vehicle_model_id: string;
  vehicle_model_make: string;
  vehicle_model_model: string;
  specific_price: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all vehicle model service prices for a given service.
 */
export function useServiceVehicleModels(
  orgId: string | undefined,
  serviceId: string | undefined,
) {
  return useQuery({
    queryKey: serviceKeys.vehicleModels(orgId ?? "", serviceId ?? ""),
    queryFn: async () => {
      if (!orgId || !serviceId) return [];
      const res = await fetch(
        `/api/organizations/${orgId}/services/${serviceId}/vehicle-models`,
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return (json.data ?? []) as VehicleModelServiceRow[];
    },
    enabled: !!orgId && !!serviceId,
    staleTime: 30_000,
  });
}

/**
 * Upsert (create or update) a vehicle-model-specific price for a service.
 */
export function useUpsertServiceVehicleModelPrice(
  orgId: string | undefined,
  serviceId: string | undefined,
) {
  return useOrgMutation<
    VehicleModelServiceRow,
    {
      vehicle_model_id: string;
      specific_price: number | null;
    }
  >({
    endpoint: `/api/organizations/${orgId}/services/${serviceId}/vehicle-models`,
    method: "POST",
    queryKey: serviceKeys.vehicleModels(orgId ?? "", serviceId ?? ""),
  });
}

/**
 * Delete a vehicle-model-specific price for a service.
 */
export function useDeleteServiceVehicleModelPrice(
  orgId: string | undefined,
  serviceId: string | undefined,
) {
  return useOrgMutation<unknown, string>({
    endpoint: `/api/organizations/${orgId}/services/${serviceId}/vehicle-models`,
    method: "DELETE",
    queryKey: serviceKeys.vehicleModels(orgId ?? "", serviceId ?? ""),
  });
}

/**
 * Fetch a map of service_id → count of models with custom prices.
 * Single query for the whole org — avoids N+1 on the services listing page.
 */
export function useServiceModelPriceCounts(orgId: string | undefined) {
  return useQuery({
    queryKey: [...serviceKeys.all(orgId ?? ""), "model-price-counts"],
    queryFn: async () => {
      if (!orgId) return {};
      const res = await fetch(
        `/api/organizations/${orgId}/services/model-price-counts`,
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return (json.data ?? {}) as Record<string, number>;
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });
}

/**
 * Fetch all vehicle models for an org (for the model picker).
 */
export function useOrgVehicleModels(orgId: string | undefined) {
  return useQuery({
    queryKey: vehicleModelKeys.list(orgId ?? ""),
    queryFn: async () => {
      if (!orgId) return [];
      const res = await fetch(`/api/organizations/${orgId}/vehicle-models`);
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return (json.data ?? []) as Array<{
        id: string;
        make: string;
        model: string;
      }>;
    },
    enabled: !!orgId,
    staleTime: 60_000,
  });
}
