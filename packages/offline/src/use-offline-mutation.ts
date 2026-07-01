"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOnlineStatus } from "@zuiio/hooks";
import { useMutationQueue } from "./mutation-queue-provider";

export interface OfflineMutationOptions<TData, TVariables> {
  /** API endpoint to call */
  endpoint: string;
  /** HTTP method. Default: POST */
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
  /** HTTP method as a function of variables (for dynamic methods) */
  methodFn?: (variables: TVariables) => "POST" | "PUT" | "PATCH" | "DELETE";
  /** Query keys to invalidate after successful sync */
  queryKeys?: unknown[][];
  /** Function to build the request body from variables */
  bodyFn: (variables: TVariables) => unknown;
  /** Called on successful online mutation */
  onSuccess?: (data: TData, variables: TVariables) => void;
  /** Called on mutation error */
  onError?: (error: Error, variables: TVariables) => void;
}

/**
 * Drop-in replacement for useMutation that auto-queues when offline.
 *
 * When online: behaves exactly like a normal mutation.
 * When offline: enqueues the mutation to IndexedDB and returns a synthetic success.
 * On reconnect: the MutationQueueProvider replays queued mutations automatically.
 *
 * @example
 * ```tsx
 * const createCustomer = useOfflineMutation({
 *   endpoint: `/api/organizations/${orgId}/customers`,
 *   method: "POST",
 *   queryKeys: [customerKeys.all(orgId)],
 *   bodyFn: (vars) => vars,
 *   onSuccess: (data) => toast.success("Created"),
 * });
 *
 * // Usage is identical to useMutation:
 * createCustomer.mutate({ first_name: "John", phone: "555-1234" });
 * ```
 */
export function useOfflineMutation<TData = unknown, TVariables = void>({
  endpoint,
  method = "POST",
  methodFn,
  queryKeys = [],
  bodyFn,
  onSuccess,
  onError,
}: OfflineMutationOptions<TData, TVariables>) {
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables): Promise<TData> => {
      if (!isOnline) {
        const resolvedMethod = methodFn ? methodFn(variables) : method;

        // Validate endpoint is a relative path
        if (!endpoint.startsWith("/")) {
          throw new Error(`Invalid endpoint: ${endpoint}`);
        }

        await queue.enqueue({
          endpoint,
          method: resolvedMethod,
          body: bodyFn(variables),
          queryKeysToInvalidate: queryKeys,
        });

        // Return a synthetic success — the mutation will be replayed on reconnect
        return { queued: true } as unknown as TData;
      }

      // Online: normal fetch
      const resolvedMethod = methodFn ? methodFn(variables) : method;
      const res = await fetch(endpoint, {
        method: resolvedMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyFn(variables)),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(
          json?.error?.message ?? `HTTP ${res.status}: ${res.statusText}`,
        );
      }

      const json = await res.json();
      return (json.data ?? json) as TData;
    },

    onSuccess: (data, variables) => {
      const d = data as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        onSuccess?.(data as TData, variables);
      }
    },

    onError: (error, variables) => {
      onError?.(error, variables);
    },

    onSettled: () => {
      if (isOnline) {
        for (const key of queryKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
    },
  });
}

/**
 * Helper to check if a mutation result is a queued (offline) response.
 */
export function isQueuedResponse(data: unknown): boolean {
  return (data as Record<string, unknown>)?.queued === true;
}

/**
 * Helper to handle the success callback for offline-aware mutations.
 * Returns true if this was a queued response (caller should skip normal onSuccess).
 */
export function handleOfflineSuccess(
  data: unknown,
  onlineCallback?: () => void,
): boolean {
  if (isQueuedResponse(data)) {
    toast.info("Saved offline — will sync when connected");
    return true;
  }
  onlineCallback?.();
  return false;
}
