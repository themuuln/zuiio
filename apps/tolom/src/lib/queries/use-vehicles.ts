import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { CreateVehicleParams, Vehicle } from "@/lib/types";
import { createOrgQuery } from "./factory";
import { vehicleKeys } from "./keys";
import { useOrgMutation } from "@zuiio/query";

const fetchVehicles = createOrgQuery<Vehicle[]>("/vehicles");

export function useVehicles(
  orgId: string | undefined,
  query = "",
  branchId?: string | null,
): UseQueryResult<Vehicle[], Error> {
  const params: Record<string, string> = {};
  if (query) params.q = query;
  if (branchId) params.branch_id = branchId;

  return useQuery({
    queryKey: vehicleKeys.list(orgId ?? "", query, branchId ?? null),
    queryFn: () =>
      fetchVehicles(orgId!, {
        params: Object.keys(params).length ? params : undefined,
      }),
    enabled: !!orgId,
    staleTime: 30_000,
    // Keep previous data visible while fetching new search results
    placeholderData: (prev) => prev,
  });
}

export function useVehicle(
  orgId: string | undefined,
  vehicleId: string | undefined,
): UseQueryResult<Vehicle, Error> {
  const fetchVehicle = createOrgQuery<Vehicle>(`/vehicles/${vehicleId ?? ""}`);
  return useQuery({
    queryKey: vehicleKeys.detail(orgId ?? "", vehicleId ?? ""),
    queryFn: () => fetchVehicle(orgId!),
    enabled: !!orgId && !!vehicleId,
    staleTime: 30_000,
  });
}

export function useDeleteVehicle(orgId: string | undefined) {
  return useOrgMutation<unknown, string>({
    endpoint: (id) => `/api/organizations/${orgId}/vehicles/${id}`,
    method: "DELETE",
    queryKey: vehicleKeys.all(orgId ?? ""),
    successMessage: "Vehicle deleted",
  });
}

export function useCreateVehicle(orgId: string | undefined) {
  return useOrgMutation<Vehicle, CreateVehicleParams>({
    endpoint: `/api/organizations/${orgId}/vehicles`,
    method: "POST",
    queryKey: vehicleKeys.all(orgId ?? ""),
    successMessage: "Vehicle created",
  });
}
