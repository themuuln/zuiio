import {
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { toastRetry } from "@/lib/toast-utils";
import type { Vehicle } from "@/lib/types";
import { createOrgQuery } from "./factory";
import { vehicleKeys } from "./keys";

const fetchVehicles = createOrgQuery<Vehicle[]>("/vehicles");

export function useVehicles(
  orgId: string | undefined,
  query = "",
): UseQueryResult<Vehicle[], Error> {
  return useQuery({
    queryKey: vehicleKeys.list(orgId ?? "", query),
    queryFn: () =>
      fetchVehicles(orgId!, {
        params: query ? { q: query } : undefined,
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
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/organizations/${orgId}/vehicles/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
    },
    onSuccess: () => {
      if (orgId)
        queryClient.invalidateQueries({ queryKey: vehicleKeys.all(orgId) });
      toast.success("Vehicle deleted");
    },
    onError: (err: Error, variables) => {
      toastRetry(err.message ?? "Failed to delete vehicle", () =>
        mutation.mutateAsync(variables),
      );
    },
  });
  return mutation;
}
