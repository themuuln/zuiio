"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import type { useMutationQueue } from "./mutation-queue-provider";

interface OfflineQueueConfig<TData, TVariables> {
  /** API endpoint (e.g. "/api/organizations/org1/customers") */
  endpoint: string;
  /** HTTP method. Default: POST */
  method?: "POST" | "PATCH" | "DELETE";
  /** Build request body from variables */
  bodyFn: (variables: TVariables) => unknown;
  /** Query keys to invalidate after successful online mutation */
  queryKeys?: unknown[][];
  /** Whether to skip queue for this mutation (e.g. file uploads). Default: false */
  skipQueue?: boolean;
  /** The original fetch/mutation function */
  mutationFn: (variables: TVariables) => Promise<TData>;
}

/**
 * Create an offline-queue-aware mutation function.
 *
 * When online: delegates to the original mutationFn.
 * When offline: enqueues the mutation to IndexedDB for later replay.
 *
 * Use inside a component alongside useMutation.
 *
 * @example
 * ```tsx
 * function useCreateCustomer(orgId: string) {
 *   const qc = useQueryClient();
 *   const isOnline = useOnlineStatus();
 *   const queue = useMutationQueue();
 *   const queryClient = useQueryClient();
 *
 *   return useMutation({
 *     mutationFn: withOfflineQueue({
 *       endpoint: `/api/organizations/${orgId}/customers`,
 *       method: "POST",
 *       bodyFn: (vars) => vars,
 *       queryKeys: [customerKeys.all(orgId)],
 *       mutationFn: async (body) => {
 *         const res = await fetch(`/api/organizations/${orgId}/customers`, {
 *           method: "POST",
 *           body: JSON.stringify(body),
 *         });
 *         return res.json();
 *       },
 *     }),
 *   });
 * }
 * ```
 */
export function withOfflineQueue<TData, TVariables>({
  endpoint,
  method = "POST",
  bodyFn,
  queryKeys = [],
  skipQueue = false,
  mutationFn,
}: OfflineQueueConfig<TData, TVariables>) {
  const isOnlineFn = () => false; // placeholder — overridden at call site

  // Return a wrapped mutation function that can be used with useMutation
  return async function wrappedMutationFn(
    variables: TVariables,
    _context?: {
      isOnline: boolean;
      queue: ReturnType<typeof useMutationQueue>;
    },
  ): Promise<TData> {
    const { isOnline, queue } = _context!;

    // If online or skipQueue, try the network
    if (skipQueue || isOnline) {
      return mutationFn(variables);
    }

    // Offline — queue
    if (!endpoint.startsWith("/")) {
      throw new Error(`Invalid endpoint: ${endpoint}`);
    }

    await queue.enqueue({
      endpoint,
      method,
      body: bodyFn(variables),
      queryKeysToInvalidate: queryKeys,
    });

    // Return a synthetic success — the mutation will be replayed on reconnect
    return { queued: true } as unknown as TData;
  };
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
