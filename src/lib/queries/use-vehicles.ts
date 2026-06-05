import {
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { useMutationQueue } from "@/lib/offline/mutation-queue-provider";
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
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      if (isOnline) {
        const res = await fetch(`/api/organizations/${orgId}/vehicles/${id}`, {
          method: "DELETE",
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        return;
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/vehicles/${id}`,
        method: "DELETE",
        body: undefined,
        queryKeysToInvalidate: [[...vehicleKeys.all(orgId ?? "")]],
      });
    },
    onSuccess: (data) => {
      const d = data as Record<string, unknown> | undefined;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        if (orgId)
          queryClient.invalidateQueries({ queryKey: vehicleKeys.all(orgId) });
        toast.dismiss();
        toast.success("Vehicle deleted");
      }
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
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  const mutation = useMutation({
    mutationFn: async (body: CreateVehicleParams) => {
      if (!orgId) throw new Error("No organization ID");

      if (isOnline) {
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
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/vehicles`,
        method: "POST",
        body,
        queryKeysToInvalidate: [[...vehicleKeys.all(orgId)]],
      });
      return { queued: true } as unknown as Vehicle;
    },
    onSuccess: (data) => {
      const d = data as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        if (orgId) {
          queryClient.invalidateQueries({
            queryKey: vehicleKeys.all(orgId),
          });
        }
        toast.dismiss();
        toast.success("Vehicle created");
      }
    },
    onError: (err: Error, variables) => {
      toastRetry(err.message, () => mutation.mutateAsync(variables));
    },
  });

  return mutation;
}
