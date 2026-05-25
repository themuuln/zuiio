import { type UseQueryResult, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CustomerNote, CustomerNoteType } from "@/lib/types";
import { customerNoteKeys } from "./keys";

/**
 * Fetches notes for a customer.
 * `enabled: !!orgId && !!customerId` prevents fetching before IDs are available.
 */
export function useCustomerNotes(
  orgId: string | undefined,
  customerId: string | undefined,
): UseQueryResult<CustomerNote[], Error> {
  return useQuery({
    queryKey: customerNoteKeys.list(orgId ?? "", customerId ?? ""),
    queryFn: async () => {
      const url = `/api/organizations/${orgId}/customers/${customerId}/notes`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load customer notes");
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return (json.data ?? []) as CustomerNote[];
    },
    enabled: !!orgId && !!customerId,
    staleTime: 30_000,
  });
}

interface CreateNoteVariables {
  content: string;
  type?: CustomerNoteType;
}

/**
 * Creates a note for a customer and invalidates the notes query.
 */
export function useCreateCustomerNote(
  orgId: string | undefined,
  customerId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: CreateNoteVariables) => {
      const url = `/api/organizations/${orgId}/customers/${customerId}/notes`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(variables),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message ?? "Failed to create note");
      }
      const json = await res.json();
      return json.data as CustomerNote;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: customerNoteKeys.all(orgId ?? ""),
      });
    },
  });
}

/**
 * Deletes a customer note and invalidates the notes query.
 */
export function useDeleteCustomerNote(
  orgId: string | undefined,
  customerId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const url = `/api/organizations/${orgId}/customers/${customerId}/notes/${noteId}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message ?? "Failed to delete note");
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: customerNoteKeys.all(orgId ?? ""),
      });
    },
  });
}
