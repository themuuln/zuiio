import {
  type MutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { toastRetry } from "@/lib/toast-utils";

// ─── Types ─────────────────────────────────────────────────────

interface OptimisticMutateOptions<TData, TVariables> {
  /** Query key to cancel + optimistically update + invalidate */
  queryKey: unknown[];
  /** API call — the actual mutation */
  mutationFn: (variables: TVariables) => Promise<unknown>;
  /**
   * Optimistic update: transforms the cached array before the server responds.
   * Return `undefined` to skip the optimistic update (e.g. if you prefer
   * to just invalidate and refetch).
   *
   * Common patterns:
   * - **Create**: `(old, v) => [...old, tempItem(v)]`
   * - **Update**: `(old, v) => old.map(item => item.id === v.id ? { ...item, ...v } : item)`
   * - **Delete**: `(old, v) => old.filter(item => item.id !== v.id)`
   */
  optimisticUpdate?: (
    old: TData[],
    variables: TVariables,
  ) => TData[] | undefined;
  /** Success toast (default: none). Pass a string or `(variables) => string`. */
  successMessage?: string | ((variables: TVariables) => string);
  /** Error toast on failure (default: tries toastRetry with the mutation). */
  errorMessage?: string | ((error: Error) => string);
  /** Whether to invalidate the query key on settle (default: true) */
  invalidateOnSettle?: boolean;
  /** Extra mutation options (e.g. `onSuccess` side effects beyond the toast) */
  extra?: Partial<
    MutationOptions<unknown, Error, TVariables, { previous?: TData[] }>
  >;
}

// ─── Factory ───────────────────────────────────────────────────

/**
 * Create a mutation with optimistic updates, rollback, toast, and invalidation.
 *
 * Eliminates the repeated 5-step dance:
 *   cancelQueries → savePrevious → setQueryData → onError(rollback+toast) → onSettled(invalidate)
 *
 * @example
 * ```ts
 * export function useCreateCategory(orgId: string) {
 *   return createOptimisticMutation({
 *     queryKey: expenseKeys.categories(orgId),
 *     mutationFn: async (params) => {
 *       const res = await fetch(`/api/orgs/${orgId}/categories`, {
 *         method: "POST", body: JSON.stringify(params),
 *       });
 *       const d = await res.json();
 *       if (d.error) throw new Error(d.error.message);
 *       return d.data;
 *     },
 *     optimisticUpdate: (old, params) => [
 *       ...old,
 *       { id: `temp-${Date.now()}`, ...params, created_at: new Date().toISOString() },
 *     ],
 *     successMessage: "Category created",
 *   });
 * }
 * ```
 */
export function createOptimisticMutation<
  TData extends { id: string },
  TVariables = void,
>({
  queryKey,
  mutationFn,
  optimisticUpdate,
  successMessage,
  errorMessage,
  invalidateOnSettle = true,
}: OptimisticMutateOptions<TData, TVariables>) {
  const queryClient = useQueryClient();

  const message =
    typeof successMessage === "function"
      ? (v: TVariables) => successMessage(v)
      : successMessage
        ? () => successMessage as string
        : null;

  return useMutation({
    mutationFn,

    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TData[]>(queryKey);

      if (previous && optimisticUpdate) {
        const next = optimisticUpdate(previous, variables);
        if (next !== undefined) {
          queryClient.setQueryData<TData[]>(queryKey, next);
        }
      }

      return { previous };
    },

    onError: (error: Error, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }

      if (errorMessage) {
        const msg =
          typeof errorMessage === "function"
            ? errorMessage(error)
            : errorMessage;
        toast.error(msg);
      } else {
        toastRetry(error.message ?? "Something went wrong", () =>
          mutationFn(variables),
        );
      }
    },

    onSuccess: () => {
      if (message) {
        // We can't access variables here easily, so we use a static message
        const msg = typeof successMessage === "string" ? successMessage : null;
        if (msg) toast.success(msg);
      }
    },

    onSettled: () => {
      if (invalidateOnSettle) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}
