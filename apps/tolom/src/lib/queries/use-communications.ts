import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useOrgMutation } from "@zuiio/query";
import { toastRetry } from "@zuiio/ui";
import type {
  CreateCustomerCommunicationParams,
  CustomerCommunication,
} from "@/lib/types";
import { createOrgQuery } from "./factory";
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
 * Creates a communication for a customer — optimistic + offline-queue.
 */
export function useCreateCustomerCommunication(
  orgId: string | undefined,
  customerId: string | undefined,
) {
  return useOrgMutation<
    CustomerCommunication,
    CreateCustomerCommunicationParams
  >({
    endpoint: `/api/organizations/${orgId}/customers/${customerId}/communications`,
    method: "POST",
    queryKey: customerCommunicationKeys.all(orgId ?? "", customerId ?? ""),
    optimisticQueryKey: customerCommunicationKeys.list(
      orgId ?? "",
      customerId ?? "",
    ),
    optimisticUpdate: (cached, variables) => {
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
      return [...cached, optimistic];
    },
    successMessage: "Communication created",
    errorMessage: "Failed to create communication",
    onErrorToast: (err, _variables, { retry }) =>
      toastRetry(err.message, () => retry()),
  });
}

/**
 * Deletes a customer communication — optimistic + offline-queue.
 */
export function useDeleteCustomerCommunication(
  orgId: string | undefined,
  customerId: string | undefined,
) {
  return useOrgMutation<CustomerCommunication, string>({
    endpoint: (commId) =>
      `/api/organizations/${orgId}/customers/${customerId}/communications/${commId}`,
    method: "DELETE",
    queryKey: customerCommunicationKeys.all(orgId ?? "", customerId ?? ""),
    optimisticQueryKey: customerCommunicationKeys.list(
      orgId ?? "",
      customerId ?? "",
    ),
    optimisticUpdate: (cached, commId) => cached.filter((c) => c.id !== commId),
    successMessage: "Communication deleted",
    errorMessage: "Failed to delete communication",
    onErrorToast: (err, _commId, { retry }) =>
      toastRetry(err.message, () => retry()),
  });
}
