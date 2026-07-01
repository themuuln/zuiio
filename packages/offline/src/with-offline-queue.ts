"use client";

import { toast } from "sonner";

/**
 * Configuration for withOfflineQueue wrapper.
 */
export interface OfflineQueueConfig<TData, TVariables> {
  /** API endpoint (e.g. "/api/organizations/org1/customers") */
  endpoint: string;
  /** HTTP method. Default: POST */
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
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
 * Wraps a mutationFn with offline-queue behavior.
 *
 * When online: delegates to the original mutationFn.
 * When offline: enqueues the mutation to IndexedDB for later replay.
 *
 * @example
 * ```tsx
 * mutationFn: withOfflineQueue({
 *   endpoint: `/api/organizations/${orgId}/customers`,
 *   method: "POST",
 *   bodyFn: (vars) => vars,
 *   queryKeys: [customerKeys.all(orgId)],
 *   mutationFn: async (body) => {
 *     const res = await fetch(...);
 *     return res.json();
 *   },
 * })
 * ```
 */
export function withOfflineQueue<TData, TVariables>({
  endpoint,
  method = "POST",
  bodyFn,
  queryKeys = [],
  mutationFn,
}: OfflineQueueConfig<TData, TVariables>) {
  return async function wrappedMutationFn(
    variables: TVariables,
    context?: {
      isOnline: boolean;
      queue: {
        enqueue: (mutation: {
          endpoint: string;
          method: string;
          body: unknown;
          queryKeysToInvalidate: unknown[][];
        }) => Promise<string>;
      };
    },
  ): Promise<TData> {
    if (!context || context.isOnline) {
      return mutationFn(variables);
    }

    // Offline — queue
    if (!endpoint.startsWith("/")) {
      throw new Error(`Invalid endpoint: ${endpoint}`);
    }

    await context.queue.enqueue({
      endpoint,
      method,
      body: bodyFn(variables),
      queryKeysToInvalidate: queryKeys,
    });

    return { queued: true } as unknown as TData;
  };
}
