import {
  type UseQueryResult,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { toastRetry } from "@/lib/toast-utils";
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
  const mutation = useMutation({
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
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: customerNoteKeys.all(orgId ?? ""),
      });
      const previous = queryClient.getQueryData<CustomerNote[]>(
        customerNoteKeys.list(orgId ?? "", customerId ?? ""),
      );
      if (previous) {
        const optimistic: CustomerNote = {
          id: `temp-${Date.now()}`,
          organization_id: orgId ?? "",
          customer_id: customerId ?? "",
          content: variables.content,
          type: variables.type ?? "general",
          created_by: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
        };
        queryClient.setQueryData<CustomerNote[]>(
          customerNoteKeys.list(orgId ?? "", customerId ?? ""),
          [...previous, optimistic],
        );
      }
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData<CustomerNote[]>(
          customerNoteKeys.list(orgId ?? "", customerId ?? ""),
          context.previous,
        );
      }
      toastRetry(err.message, () => mutation.mutateAsync(variables));
    },
    onSuccess: () => {
      toast.success("Note created");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: customerNoteKeys.all(orgId ?? ""),
      });
    },
  });
  return mutation;
}

/**
 * Deletes a customer note with optimistic UI.
 */
export function useDeleteCustomerNote(
  orgId: string | undefined,
  customerId: string | undefined,
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
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
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({
        queryKey: customerNoteKeys.all(orgId ?? ""),
      });
      const previous = queryClient.getQueryData<CustomerNote[]>(
        customerNoteKeys.list(orgId ?? "", customerId ?? ""),
      );
      if (previous) {
        queryClient.setQueryData<CustomerNote[]>(
          customerNoteKeys.list(orgId ?? "", customerId ?? ""),
          previous.filter((n) => n.id !== noteId),
        );
      }
      return { previous };
    },
    onError: (err, noteId, context) => {
      if (context?.previous) {
        queryClient.setQueryData<CustomerNote[]>(
          customerNoteKeys.list(orgId ?? "", customerId ?? ""),
          context.previous,
        );
      }
      toastRetry(err.message, () => mutation.mutateAsync(noteId));
    },
    onSuccess: () => {
      toast.success("Note deleted");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: customerNoteKeys.all(orgId ?? ""),
      });
    },
  });
  return mutation;
}
