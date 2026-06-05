/**
 * Unified mutation factory — one call replaces ~40 lines of boilerplate.
 *
 * Combines: optimistic UI + offline queue + rollback + toast + invalidation.
 *
 * @example
 * ```ts
 * // Create
 * export function useCreateExpense(orgId: string) {
 *   return useOrgMutation<Expense, CreateExpenseParams>({
 *     endpoint: `/api/organizations/${orgId}/expenses`,
 *     method: "POST",
 *     queryKey: expenseKeys.all(orgId),
 *     optimisticUpdate: (old, vars) => [
 *       ...old,
 *       { id: `temp-${Date.now()}`, ...vars, created_at: new Date().toISOString() } as Expense,
 *     ],
 *     successMessage: "Expense created",
 *   });
 * }
 *
 * // Update (dynamic endpoint)
 * export function useUpdateExpense(orgId: string) {
 *   return useOrgMutation<Expense, { id: string } & UpdateExpenseParams>({
 *     endpoint: (vars) => `/api/organizations/${orgId}/expenses/${vars.id}`,
 *     method: "PATCH",
 *     queryKey: expenseKeys.all(orgId),
 *     optimisticUpdate: (old, vars) =>
 *       old.map((e) => (e.id === vars.id ? { ...e, ...vars } : e)),
 *     successMessage: "Expense updated",
 *   });
 * }
 *
 * // Delete
 * export function useDeleteExpense(orgId: string) {
 *   return useOrgMutation<Expense, string>({
 *     endpoint: (id) => `/api/organizations/${orgId}/expenses/${id}`,
 *     method: "DELETE",
 *     queryKey: expenseKeys.all(orgId),
 *     optimisticUpdate: (old, id) => old.filter((e) => e.id !== id),
 *     successMessage: "Expense deleted",
 *   });
 * }
 * ```
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { useMutationQueue } from "@/lib/offline/mutation-queue-provider";

// ─── Types ─────────────────────────────────────────────────────

type HttpMethod = "POST" | "PATCH" | "DELETE";

interface OrgMutationConfig<TData, TVariables> {
  /**
   * API endpoint — static string or function that builds it from variables.
   * Example: `/api/organizations/${orgId}/expenses` or
   * `(vars) => `/api/organizations/${orgId}/expenses/${vars.id}``
   */
  endpoint: string | ((variables: TVariables) => string);

  /** HTTP method. Default: POST */
  method?: HttpMethod;

  /** Query key to cancel during optimistic update and invalidate on settle. */
  queryKey: readonly unknown[];

  /**
   * Optimistic update — transforms the cached list before the server responds.
   * - Create: `(old, vars) => [...old, tempItem(vars)]`
   * - Update: `(old, vars) => old.map(...)`
   * - Delete: `(old, vars) => old.filter(...)`
   */
  optimisticUpdate?: (cached: TData[], variables: TVariables) => TData[];

  /** Success toast message — string or function of variables. */
  successMessage?: string | ((variables: TVariables) => string);

  /** Error toast message on failure. Default: error.message. */
  errorMessage?: string;

  /** Extra query keys to invalidate on settle (beyond queryKey). */
  invalidateKeys?: readonly (readonly unknown[])[];

  /**
   * Request body builder for offline queue replay.
   * Default: POST → variables, PATCH → variables, DELETE → undefined.
   */
  bodyFn?: (variables: TVariables) => unknown;

  /** Extra side effects on successful online mutation (e.g. invalidate stats). */
  onSuccess?: (data: TData, variables: TVariables) => void;
}

// ─── Context type (internal) ───────────────────────────────────

interface MutationContext<TData> {
  previous: TData[] | undefined;
}

// ─── Factory ───────────────────────────────────────────────────

export function useOrgMutation<TData, TVariables = void>(
  config: OrgMutationConfig<TData, TVariables>,
) {
  const {
    endpoint,
    method = "POST",
    queryKey,
    optimisticUpdate,
    successMessage,
    errorMessage,
    invalidateKeys = [],
    bodyFn,
    onSuccess,
  } = config;

  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  const resolveEndpoint = (vars: TVariables): string =>
    typeof endpoint === "function" ? endpoint(vars) : endpoint;

  const buildBody = (vars: TVariables): unknown => {
    if (bodyFn) return bodyFn(vars);
    if (method === "DELETE") return undefined;
    return vars;
  };

  const getSuccessMsg = (vars: TVariables): string | null => {
    if (!successMessage) return null;
    return typeof successMessage === "function"
      ? successMessage(vars)
      : successMessage;
  };

  return useMutation<TData, Error, TVariables, MutationContext<TData>>({
    // ── mutationFn: online → fetch, offline → queue ──
    mutationFn: async (variables): Promise<TData> => {
      const url = resolveEndpoint(variables);

      if (isOnline) {
        const init: RequestInit = {
          method,
          headers:
            method !== "DELETE"
              ? { "Content-Type": "application/json" }
              : undefined,
          body:
            method !== "DELETE"
              ? JSON.stringify(buildBody(variables))
              : undefined,
        };

        const res = await fetch(url, init);
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(
            json.error?.message ?? `Request failed (${res.status})`,
          );
        }

        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        return json.data as TData;
      }

      // Offline — enqueue for later replay
      await queue.enqueue({
        endpoint: url,
        method,
        body: buildBody(variables),
        queryKeysToInvalidate: [
          [...queryKey],
          ...invalidateKeys.map((k) => [...k]),
        ],
      });

      // Synthetic success — queue will replay on reconnect
      return { queued: true } as unknown as TData;
    },

    // ── onMutate: optimistic update ──
    onMutate: async (variables): Promise<MutationContext<TData>> => {
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

    // ── onError: rollback + toast ──
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }

      toast.error(errorMessage ?? error.message ?? "Something went wrong");
    },

    // ── onSuccess: queued check + toast + extra effects ──
    onSuccess: (data, variables) => {
      // Check if this was an offline-queued response
      if ((data as unknown as Record<string, unknown>)?.queued) {
        toast.info("Saved offline — will sync when connected");
        return;
      }

      const msg = getSuccessMsg(variables);
      if (msg) {
        toast.dismiss();
        toast.success(msg);
      }

      onSuccess?.(data, variables);
    },

    // ── onSettled: invalidate queries ──
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      for (const key of invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
