"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Optimistic create: immediately prepends the new item to all active list
 * caches for `queryKey()`, then rolls back on error and shows a toast.
 *
 * The component passes `onSuccess` via `mutate(formData, { onSuccess })` for
 * drawer close / form reset / success toast.
 */
export function useOptimisticCreate<TItem>({
  mutationFn,
  queryKey,
  buildOptimistic,
}: {
  mutationFn: (formData: FormData) => Promise<unknown>;
  queryKey: () => readonly string[];
  buildOptimistic: (formData: FormData) => TItem;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey: queryKey() });
      const snapshot = queryClient.getQueriesData({ queryKey: queryKey() });
      const optimistic = buildOptimistic(formData);
      queryClient.setQueriesData(
        { queryKey: queryKey(), type: "active" },
        (old: unknown) => {
          if (Array.isArray(old)) {
            return [optimistic as never, ...old];
          }
          return old;
        },
      );
      return { snapshot };
    },
    onError: (err, _vars, context) => {
      if (context?.snapshot) {
        for (const [key, data] of context.snapshot) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey() });
    },
  });
}

/**
 * Optimistic delete: immediately removes the item identified by `getId`
 * from all active list caches, then rolls back on error.
 */
export function useOptimisticDelete({
  mutationFn,
  queryKey,
  getId,
}: {
  mutationFn: (formData: FormData) => Promise<unknown>;
  queryKey: () => readonly string[];
  getId: (formData: FormData) => string;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey: queryKey() });
      const snapshot = queryClient.getQueriesData({ queryKey: queryKey() });
      const id = getId(formData);
      queryClient.setQueriesData(
        { queryKey: queryKey(), type: "active" },
        (old: unknown) => {
          if (Array.isArray(old)) {
            return old.filter(
              (item: Record<string, unknown>) =>
                item.id !== id &&
                (item as { productId?: string }).productId !== id,
            );
          }
          return old;
        },
      );
      return { snapshot };
    },
    onError: (err, _vars, context) => {
      if (context?.snapshot) {
        for (const [key, data] of context.snapshot) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey() });
    },
  });
}

/**
 * Optimistic update: immediately merges the partial returned by
 * `buildOptimistic` into the cached item matching `getId`, then
 * rolls back on error.
 */
export function useOptimisticUpdate<TItem extends Record<string, unknown>>({
  mutationFn,
  queryKey,
  getId,
  buildOptimistic,
}: {
  mutationFn: (formData: FormData) => Promise<unknown>;
  queryKey: () => readonly string[];
  getId: (formData: FormData) => string;
  buildOptimistic: (formData: FormData) => Partial<TItem>;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey: queryKey() });
      const snapshot = queryClient.getQueriesData({ queryKey: queryKey() });
      const id = getId(formData);
      const updates = buildOptimistic(formData);
      queryClient.setQueriesData(
        { queryKey: queryKey(), type: "active" },
        (old: unknown) => {
          if (Array.isArray(old)) {
            return old.map((item: Record<string, unknown>) =>
              item.id === id ? { ...item, ...updates } : item,
            );
          }
          return old;
        },
      );
      return { snapshot };
    },
    onError: (err, _vars, context) => {
      if (context?.snapshot) {
        for (const [key, data] of context.snapshot) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey() });
    },
  });
}
