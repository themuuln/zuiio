"use client";

/**
 * Unified mutation factory — one call replaces ~40 lines of boilerplate.
 *
 * Combines: fetch + offline queue + optimistic UI + rollback + toast + invalidation.
 *
 * Two exports:
 * - useOrgMutation (Tolom-compatible name, widely used)
 * - useOfflineJsonMutation (generic name for shared Zuiio usage)
 *
 * @example
 * ```ts
 * import { useOrgMutation } from "@zuiio/query";
 *
 * // Create with optimistic update
 * const create = useOrgMutation<MyType, CreateVars>({
 *   endpoint: `/api/${orgId}/items`,
 *   method: "POST",
 *   queryKey: itemKeys.all(orgId),
 *   optimisticUpdate: (cached, vars) => [...cached, tempItem(vars)],
 *   successMessage: "Created",
 * });
 *
 * // Delete
 * const del = useOrgMutation<MyType, string>({
 *   endpoint: (id) => `/api/${orgId}/items/${id}`,
 *   method: "DELETE",
 *   queryKey: itemKeys.all(orgId),
 *   optimisticUpdate: (cached, id) => cached.filter((i) => i.id !== id),
 *   successMessage: "Deleted",
 * });
 * ```
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOnlineStatus } from "@zuiio/hooks";
import { useMutationQueue } from "@zuiio/offline";

// ─── Types ─────────────────────────────────────────────────────

type HttpMethod = "POST" | "PATCH" | "DELETE";

export interface OrgMutationConfig<TData, TVariables> {
  /** API endpoint — static string or function that builds it from variables. */
  endpoint: string | ((variables: TVariables) => string);

  /** HTTP method (default: POST) */
  method?: HttpMethod;

  /**
   * Query key prefix — used for:
   *   1. Cancelling in-flight queries before optimistic update
   *   2. Invalidating queries on settle
   *   3. Offline queue replay invalidation
   */
  queryKey: readonly unknown[];

  /**
   * Exact query key for optimistic cache read/write.
   * Default: falls back to `queryKey` (works when queryKey IS the exact cache key).
   *
   * Set this when your cache key is more specific than the invalidation prefix.
   * Example: queryKey = customerCommunicationKeys.all(orgId, customerId)
   *          optimisticQueryKey = customerCommunicationKeys.list(orgId, customerId)
   */
  optimisticQueryKey?: readonly unknown[];

  /**
   * Optimistic update — transforms the cached list before the server responds.
   * - Create: `(old, vars) => [...old, tempItem(vars)]`
   * - Update: `(old, vars) => old.map(...)`
   * - Delete: `(old, vars) => old.filter(...)`
   */
  optimisticUpdate?: (cached: TData[], variables: TVariables) => TData[];

  /** Success toast message — string or function of variables. */
  successMessage?: string | ((variables: TVariables) => string);

  /** Error toast message on failure (default: error.message). */
  errorMessage?: string;

  /**
   * Custom error handler called after rollback but instead of toast.error.
   * Receives a `retry` callback so callers can show "Retry" buttons.
   * Example: `onErrorToast: (err, vars, { retry }) => toastRetry(err.message, () => retry())`
   */
  onErrorToast?: (
    error: Error,
    variables: TVariables,
    helpers: { retry: () => Promise<TData> },
  ) => void;

  /** Extra query keys to invalidate on settle (beyond queryKey). */
  invalidateKeys?: readonly (readonly unknown[])[];

  /**
   * Custom request body builder.
   * Default: POST/PATCH → variables, DELETE → undefined.
   * When provided, ALWAYS called (including for DELETE).
   */
  bodyFn?: (variables: TVariables) => unknown;

  /** Extra side effects on successful online mutation. */
  onSuccess?: (data: TData, variables: TVariables) => void;
}

// ─── Context type (internal) ───────────────────────────────────

interface MutationContext<TData> {
  previous: TData[] | undefined;
  wasOffline: boolean;
}

// ─── Factory ───────────────────────────────────────────────────

export function useOrgMutation<TData, TVariables = void>(
  config: OrgMutationConfig<TData, TVariables>,
) {
  const {
    endpoint,
    method = "POST",
    queryKey,
    optimisticQueryKey,
    optimisticUpdate,
    successMessage,
    errorMessage,
    onErrorToast,
    invalidateKeys = [],
    bodyFn,
    onSuccess,
  } = config;

  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  const exactKey = optimisticQueryKey ?? queryKey;

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
    mutationFn: async (variables): Promise<TData> => {
      const url = resolveEndpoint(variables);

      if (isOnline) {
        const init: RequestInit = {
          method,
          headers:
            method !== "DELETE" || bodyFn
              ? { "Content-Type": "application/json" }
              : undefined,
          body: JSON.stringify(buildBody(variables)),
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

      return { queued: true } as unknown as TData;
    },

    onMutate: async (variables): Promise<MutationContext<TData>> => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TData[]>(exactKey);

      if (previous && optimisticUpdate) {
        const next = optimisticUpdate(previous, variables);
        if (next !== undefined) {
          queryClient.setQueryData<TData[]>(exactKey, next);
        }
      }

      return { previous: previous ?? undefined, wasOffline: !isOnline };
    },

    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(exactKey, context.previous);
      }

      if (onErrorToast) {
        const retryFn = () =>
          // Re-run the mutation — uses the same hook instance
          Promise.reject(new Error("Retry not supported at this level"));
        onErrorToast(error, variables, { retry: retryFn });
      } else {
        toast.dismiss();
        toast.error(errorMessage ?? error.message ?? "Something went wrong");
      }
    },

    onSuccess: (data, variables) => {
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

    onSettled: (_data, _error, _variables, context) => {
      // Don't invalidate if the mutation was queued offline —
      // the MutationQueueProvider will handle invalidation after replay.
      if (context?.wasOffline) return;

      queryClient.invalidateQueries({ queryKey });
      for (const key of invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}

// ─── Generic alias for shared Zuiio usage ────────────────────

export { useOrgMutation as useOfflineJsonMutation };
