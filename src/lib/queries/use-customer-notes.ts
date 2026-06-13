import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { CustomerNote, CustomerNoteType } from "@/lib/types";
import { createOrgQuery } from "./factory";
import { customerNoteKeys } from "./keys";
import { useOrgMutation } from "./mutation-factory";

/**
 * Fetches notes for a customer.
 * `enabled: !!orgId && !!customerId` prevents fetching before IDs are available.
 */
export function useCustomerNotes(
  orgId: string | undefined,
  customerId: string | undefined,
): UseQueryResult<CustomerNote[], Error> {
  const fetchNotes = createOrgQuery<CustomerNote[]>(
    `/customers/${customerId ?? ""}/notes`,
  );
  return useQuery({
    queryKey: customerNoteKeys.list(orgId ?? "", customerId ?? ""),
    queryFn: () => fetchNotes(orgId!),
    enabled: !!orgId && !!customerId,
    staleTime: 30_000,
  });
}

interface CreateNoteVariables {
  content: string;
  type?: CustomerNoteType;
}

/**
 * Creates a note for a customer — optimistic + offline-queue.
 */
export function useCreateCustomerNote(
  orgId: string | undefined,
  customerId: string | undefined,
) {
  return useOrgMutation<CustomerNote, CreateNoteVariables>({
    endpoint: `/api/organizations/${orgId}/customers/${customerId}/notes`,
    method: "POST",
    queryKey: customerNoteKeys.all(orgId ?? ""),
    optimisticUpdate: (old, vars) => [
      ...old,
      {
        id: `temp-${Date.now()}`,
        organization_id: orgId ?? "",
        customer_id: customerId ?? "",
        content: vars.content,
        type: vars.type ?? "general",
        created_by: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      } as CustomerNote,
    ],
    successMessage: "Note created",
  });
}

/**
 * Deletes a customer note — optimistic + offline-queue.
 */
export function useDeleteCustomerNote(
  orgId: string | undefined,
  customerId: string | undefined,
) {
  return useOrgMutation<CustomerNote, string>({
    endpoint: (noteId) =>
      `/api/organizations/${orgId}/customers/${customerId}/notes/${noteId}`,
    method: "DELETE",
    queryKey: customerNoteKeys.all(orgId ?? ""),
    optimisticUpdate: (old, noteId) => old.filter((n) => n.id !== noteId),
    successMessage: "Note deleted",
  });
}
