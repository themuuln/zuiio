import type { UseQueryResult } from "@tanstack/react-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CustomerCommunication } from "@/lib/types";
import type { CreateCustomerCommunicationParams } from "@/lib/types";
import { customerCommunicationKeys } from "./keys";

/**
 * Fetches communications for a customer.
 * `enabled: !!orgId && !!customerId` prevents fetching before IDs are available.
 */
export function useCustomerCommunications(
  orgId: string | undefined,
  customerId: string | undefined,
): UseQueryResult<CustomerCommunication[], Error> {
  return useQuery({
    queryKey: customerCommunicationKeys.list(orgId ?? "", customerId ?? ""),
    queryFn: async () => {
      const url = `/api/organizations/${orgId}/customers/${customerId}/communications`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load customer communications");
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return (json.data ?? []) as CustomerCommunication[];
    },
    enabled: !!orgId && !!customerId,
    staleTime: 30_000,
  });
}

/**
 * Creates a communication for a customer and invalidates the communications query.
 */
export function useCreateCustomerCommunication(
  orgId: string | undefined,
  customerId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: CreateCustomerCommunicationParams) => {
      const url = `/api/organizations/${orgId}/customers/${customerId}/communications`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(variables),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(
          json.error?.message ?? "Failed to create communication",
        );
      }
      const json = await res.json();
      return json.data as CustomerCommunication;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: customerCommunicationKeys.all(orgId ?? "", customerId ?? ""),
      });
    },
  });
}

/**
 * Deletes a customer communication and invalidates the communications query.
 */
export function useDeleteCustomerCommunication(
  orgId: string | undefined,
  customerId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commId: string) => {
      const url = `/api/organizations/${orgId}/customers/${customerId}/communications/${commId}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(
          json.error?.message ?? "Failed to delete communication",
        );
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: customerCommunicationKeys.all(orgId ?? "", customerId ?? ""),
      });
    },
  });
}
