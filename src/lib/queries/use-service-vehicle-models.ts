/**
 * React Query hooks for vehicle-model-specific service pricing.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { useMutationQueue } from "@/lib/offline/mutation-queue-provider";
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
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  return useMutation({
    mutationFn: async (params: {
      vehicle_model_id: string;
      specific_price: number | null;
    }) => {
      if (!orgId || !serviceId) throw new Error("Missing orgId or serviceId");

      if (isOnline) {
        const res = await fetch(
          `/api/organizations/${orgId}/services/${serviceId}/vehicle-models`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              vehicle_model_id: params.vehicle_model_id,
              specific_price: params.specific_price,
            }),
          },
        );
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        return json.data as VehicleModelServiceRow;
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/services/${serviceId}/vehicle-models`,
        method: "POST",
        body: {
          vehicle_model_id: params.vehicle_model_id,
          specific_price: params.specific_price,
        },
        queryKeysToInvalidate: [
          [...serviceKeys.vehicleModels(orgId, serviceId)],
        ],
      });
      return { queued: true } as unknown as VehicleModelServiceRow;
    },
    onSuccess: (data) => {
      const d = data as unknown as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        if (orgId && serviceId) {
          queryClient.invalidateQueries({
            queryKey: serviceKeys.vehicleModels(orgId, serviceId),
          });
        }
      }
    },
  });
}

/**
 * Delete a vehicle-model-specific price for a service.
 */
export function useDeleteServiceVehicleModelPrice(
  orgId: string | undefined,
  serviceId: string | undefined,
) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  return useMutation({
    mutationFn: async (vehicleModelId: string) => {
      if (!orgId || !serviceId) throw new Error("Missing orgId or serviceId");

      if (isOnline) {
        const res = await fetch(
          `/api/organizations/${orgId}/services/${serviceId}/vehicle-models`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vehicle_model_id: vehicleModelId }),
          },
        );
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        return;
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/services/${serviceId}/vehicle-models`,
        method: "DELETE",
        body: { vehicle_model_id: vehicleModelId },
        queryKeysToInvalidate: [
          [...serviceKeys.vehicleModels(orgId, serviceId)],
        ],
      });
    },
    onSuccess: (data) => {
      const d = data as unknown as Record<string, unknown> | undefined;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        if (orgId && serviceId) {
          queryClient.invalidateQueries({
            queryKey: serviceKeys.vehicleModels(orgId, serviceId),
          });
        }
      }
    },
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
