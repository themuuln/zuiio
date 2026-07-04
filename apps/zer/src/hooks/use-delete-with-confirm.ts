"use client";

import type { QueryKey } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface UseDeleteWithConfirmOptions {
  /** The mutation function that performs the delete */
  mutationFn: (id: string) => Promise<{ error?: string } | undefined>;
  /** React Query key to invalidate on success */
  queryKey: QueryKey;
  /** Entity name in Mongolian for the confirmation dialog and toast */
  entityName: string;
  /** Name of the specific item being deleted (shown in confirmation) */
  itemName?: string;
  /** Callback after successful deletion */
  onSuccess?: () => void;
}

/**
 * Standardized delete mutation with confirmation dialog, toast, and cache invalidation.
 *
 * Returns `handleDelete(id)` that shows a `window.confirm` dialog before proceeding.
 */
export function useDeleteWithConfirm({
  mutationFn,
  queryKey,
  entityName,
  itemName,
  onSuccess,
}: UseDeleteWithConfirmOptions) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn,
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(`${entityName} амжилттай устгагдлаа.`);
      onSuccess?.();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleDelete = (id: string, name?: string) => {
    if (mutation.isPending) return;
    const displayName = name ?? itemName ?? entityName;
    const confirmed = window.confirm(
      `"${displayName}" ${entityName}-г устгахдаа итгэлтэй байна уу?`,
    );
    if (!confirmed) return;
    mutation.mutate(id);
  };

  return {
    handleDelete,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
