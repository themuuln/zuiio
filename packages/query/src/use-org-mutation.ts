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
 * // Delete with separate response/cache types
 * const del = useOrgMutation<{ success: true }, string, MyType>({
 *   endpoint: (id) => `/api/${orgId}/items/${id}`,
 *   method: "DELETE",
 *   queryKey: itemKeys.all(orgId),
 *   optimisticUpdate: (notes, noteId) => notes.filter((n) => n.id !== noteId),
 *   successMessage: "Deleted",
 * });
 * ```
 */

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * UUID v4 generator (no external deps).
 * Falls back to crypto.randomUUID when available.
 */
function generateOptimisticId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
import { toast } from "sonner";
import { useOnlineStatus } from "@zuiio/hooks";
import { useMutationQueue } from "@zuiio/offline";

// ─── Types ─────────────────────────────────────────────────────

type HttpMethod = "POST" | "PATCH" | "DELETE";

/** Context passed to `optimisticUpdate` for stable temp ID generation. */
export interface OptimisticContext {
  /** Stable unique ID for the optimistic item (use instead of Date.now() in temp IDs). */
  optimisticId: string;
  /** ISO timestamp of when the mutation was submitted. */
  submittedAt: string;
}

export interface OrgMutationConfig<TResponse, TVariables, TCache = TResponse> {
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
   * Optional mutation key for mutation deduplication.
   * When set, onSettled skips invalidation if sibling mutations
   * with the same key are still in-flight — preventing one mutation's
   * refetch from clearing another mutation's optimistic state.
   * Defaults to ["org-mutation", optimisticQueryKey ?? queryKey].
   */
  mutationKey?: readonly unknown[];

  /**
   * Optimistic update — transforms the cached list before the server responds.
   * Uses TCache (not TResponse) so the cache type can differ from the response type.
   *
   * The third argument provides:
   * - `optimisticId`: a stable UUID for temp IDs (use instead of `Date.now()`)
   * - `submittedAt`: ISO timestamp of submission
   *
   * - Create: `(old, vars) => [...old, tempItem(vars)]`
   * - Update: `(old, vars) => old.map(...)`
   * - Delete: `(old, vars) => old.filter(...)`
   */
  optimisticUpdate?: (
    cached: TCache[],
    variables: TVariables,
    context: OptimisticContext,
  ) => TCache[];

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
    helpers: { retry: () => Promise<TResponse> },
  ) => void;

  /** Extra query keys to invalidate on settle (beyond queryKey). */
  invalidateKeys?: readonly (readonly unknown[])[];

  /**
   * Custom request body builder.
   * Default: POST/PATCH → variables, DELETE → undefined.
   * When provided, ALWAYS called (including for DELETE).
   */
  bodyFn?: (variables: TVariables) => unknown;

  /**
   * Idempotency key factory for safe retry.
   * When provided, the key is sent as the `Idempotency-Key` HTTP header
   * on online requests, and stored with the queued mutation for offline replay.
   * The server should reject duplicate requests with the same key.
   *
   * Example: `idempotencyKey: (vars) => \`refund-\${orgId}-\${vars.invoice_id}\``
   */
  idempotencyKey?: (variables: TVariables) => string;

  /** Extra side effects on successful online mutation. */
  onSuccess?: (data: TResponse, variables: TVariables) => void;

  /**
   * Error side-effect callback (non-toast).
   * Runs after rollback but independently of toast error display.
   */
  onError?: (error: Error, variables: TVariables) => void | Promise<void>;
}

// ─── Context type (internal) ───────────────────────────────────

interface MutationContext<TCache> {
  previous: TCache[] | undefined;
  wasOffline: boolean;
}

// ─── Factory ───────────────────────────────────────────────────

export function useOrgMutation<TResponse, TVariables = void, TCache = TResponse>(
  config: OrgMutationConfig<TResponse, TVariables, TCache>,
) {
  const {
    endpoint,
    method = "POST",
    queryKey,
    optimisticQueryKey,
    mutationKey,
    optimisticUpdate,
    idempotencyKey,
    successMessage,
    errorMessage,
    onErrorToast,
    invalidateKeys = [],
    bodyFn,
    onSuccess,
    onError: onErrorCb,
  } = config;

  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  const exactKey = optimisticQueryKey ?? queryKey;
  const resolvedMutationKey =
    mutationKey ?? ["org-mutation", ...exactKey];

  const mutateRef = React.useRef<((vars: TVariables) => Promise<TResponse>) | null>(null);

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

  const mutation = useMutation<TResponse, Error, TVariables, MutationContext<TCache>>({
    mutationKey: resolvedMutationKey,

    mutationFn: async (variables): Promise<TResponse> => {
      const url = resolveEndpoint(variables);

      if (isOnline) {
        const built = buildBody(variables);
        const init: RequestInit = {
          method,
          body: built !== undefined ? JSON.stringify(built) : undefined,
        };

        if (built !== undefined) {
          const h: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (idempotencyKey) {
            h["Idempotency-Key"] = idempotencyKey(variables);
          }
          init.headers = h;
        }

        const res = await fetch(url, init);
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(
            json.error?.message ?? `Request failed (${res.status})`,
          );
        }

        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        return json.data as TResponse;
      }

      // Offline — enqueue for later replay
      await queue.enqueue({
        endpoint: url,
        method,
        body: buildBody(variables),
        idempotencyKey: idempotencyKey?.(variables),
        queryKeysToInvalidate: [
          [...queryKey],
          ...invalidateKeys.map((k) => [...k]),
        ],
      });

      return { queued: true } as unknown as TResponse;
    },

    onMutate: async (variables): Promise<MutationContext<TCache>> => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TCache[]>(exactKey);

      if (previous && optimisticUpdate) {
        const context: OptimisticContext = {
          optimisticId: generateOptimisticId(),
          submittedAt: new Date().toISOString(),
        };
        const next = optimisticUpdate(previous, variables, context);
        if (next !== undefined) {
          queryClient.setQueryData<TCache[]>(exactKey, next);
        }
      }

      return { previous: previous ?? undefined, wasOffline: !isOnline };
    },

    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData<TCache[]>(exactKey, context.previous);
      }

      // Non-toast error callback (runs independently)
      onErrorCb?.(error, variables);

      if (onErrorToast) {
        const retryFn = () => {
          if (mutateRef.current) {
            return mutateRef.current(variables);
          }
          return Promise.reject(new Error("Mutation not initialized"));
        };
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

      // If sibling mutations with the same key are still in-flight,
      // skip invalidation to avoid clearing their optimistic state.
      if (queryClient.isMutating({ mutationKey: resolvedMutationKey }) > 1) return;

      return Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        ...invalidateKeys.map((key) =>
          queryClient.invalidateQueries({ queryKey: key }),
        ),
      ]);
    },
  });

  mutateRef.current = mutation.mutateAsync;

  return mutation;
}

// ─── Generic alias for shared Zuiio usage ────────────────────

export { useOrgMutation as useOfflineJsonMutation };
