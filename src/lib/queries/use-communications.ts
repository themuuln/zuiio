import type { UseQueryResult } from "@tanstack/react-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastRetry } from "@/lib/toast-utils";
import { createOrgQuery } from "./factory";
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
  const fetchCommunications = createOrgQuery<CustomerCommunication[]>(
    `/customers/${customerId ?? ""}/communications`,
  );
  return useQuery({
    queryKey: customerCommunicationKeys.list(orgId ?? "", customerId ?? ""),
    queryFn: () => fetchCommunications(orgId!),
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

  const mutation = useMutation({
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
    onMutate: async (variables) => {
      const queryKey = customerCommunicationKeys.all(
        orgId ?? "",
        customerId ?? "",
      );
      await queryClient.cancelQueries({ queryKey });
      const listKey = customerCommunicationKeys.list(
        orgId ?? "",
        customerId ?? "",
      );
      const previous =
        queryClient.getQueryData<CustomerCommunication[]>(listKey);
      if (previous) {
        const optimistic: CustomerCommunication = {
          id: `temp-${Date.now()}`,
          organization_id: orgId ?? "",
          customer_id: customerId ?? "",
          type: variables.type,
          direction: variables.direction,
          subject: variables.subject ?? null,
          content: variables.content,
          staff_id: null,
          created_at: new Date().toISOString(),
          deleted_at: null,
        };
        queryClient.setQueryData<CustomerCommunication[]>(listKey, [
          ...previous,
          optimistic,
        ]);
      }
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        const listKey = customerCommunicationKeys.list(
          orgId ?? "",
          customerId ?? "",
        );
        queryClient.setQueryData<CustomerCommunication[]>(
          listKey,
          context.previous,
        );
      }
      toastRetry(err.message, () => mutation.mutateAsync(variables));
    },
    onSuccess: () => {
      toast.success("Communication created");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: customerCommunicationKeys.all(orgId ?? "", customerId ?? ""),
      });
    },
  });
  return mutation;
}

/**
 * Deletes a customer communication and invalidates the communications query.
 */
export function useDeleteCustomerCommunication(
  orgId: string | undefined,
  customerId: string | undefined,
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
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
    onMutate: async (commId) => {
      const queryKey = customerCommunicationKeys.all(
        orgId ?? "",
        customerId ?? "",
      );
      await queryClient.cancelQueries({ queryKey });
      const listKey = customerCommunicationKeys.list(
        orgId ?? "",
        customerId ?? "",
      );
      const previous =
        queryClient.getQueryData<CustomerCommunication[]>(listKey);
      if (previous) {
        queryClient.setQueryData<CustomerCommunication[]>(
          listKey,
          previous.filter((c) => c.id !== commId),
        );
      }
      return { previous };
    },
    onError: (err, commId, context) => {
      if (context?.previous) {
        const listKey = customerCommunicationKeys.list(
          orgId ?? "",
          customerId ?? "",
        );
        queryClient.setQueryData<CustomerCommunication[]>(
          listKey,
          context.previous,
        );
      }
      toastRetry(err.message, () => mutation.mutateAsync(commId));
    },
    onSuccess: () => {
      toast.success("Communication deleted");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: customerCommunicationKeys.all(orgId ?? "", customerId ?? ""),
      });
    },
  });
  return mutation;
}
