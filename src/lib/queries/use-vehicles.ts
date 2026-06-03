import {
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { toastRetry } from "@/lib/toast-utils";
import type { CreateVehicleParams, Vehicle } from "@/lib/types";
import { createOrgQuery } from "./factory";
import { vehicleKeys } from "./keys";

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

export function useCreateVehicle(orgId: string | undefined) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (body: CreateVehicleParams) => {
      if (!orgId) throw new Error("No organization ID");
      const res = await fetch(`/api/organizations/${orgId}/vehicles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? "Failed to create vehicle");
      }
      return json.data as Vehicle;
    },
    onSuccess: () => {
      if (orgId) {
        queryClient.invalidateQueries({
          queryKey: vehicleKeys.all(orgId),
        });
      }
      toast.success("Vehicle created");
    },
    onError: (err: Error, variables) => {
      toastRetry(err.message, () => mutation.mutateAsync(variables));
    },
  });

  return mutation;
}
