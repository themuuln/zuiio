import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { Vehicle } from "@/lib/types";
import { vehicleKeys } from "./keys";

export function useVehicles(
  orgId: string | undefined,
  query = "",
): UseQueryResult<Vehicle[], Error> {
  return useQuery({
    queryKey: vehicleKeys.list(orgId ?? "", query),
    queryFn: async () => {
      const url = `/api/organizations/${orgId}/vehicles${query ? `?q=${encodeURIComponent(query)}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load vehicles");
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return (json.data ?? []) as Vehicle[];
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });
}

export function useVehicle(
  orgId: string | undefined,
  vehicleId: string | undefined,
): UseQueryResult<Vehicle, Error> {
  return useQuery({
    queryKey: vehicleKeys.detail(orgId ?? "", vehicleId ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/vehicles/${vehicleId}`);
      if (!res.ok) throw new Error("Failed to load vehicle");
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as Vehicle;
    },
    enabled: !!orgId && !!vehicleId,
    staleTime: 30_000,
  });
}
