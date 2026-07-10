"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "sonner";
import { useMutationQueue } from "@/lib/offline/mutation-queue-provider";
import { useOnlineStatus } from "@/lib/zuiio/hooks";

export const QUEUED_SENTINEL = Symbol("zuiio-queued");

export interface QueuedResult {
  [QUEUED_SENTINEL]: true;
}

export function isQueuedResult(data: unknown): data is QueuedResult {
  return typeof data === "object" && data !== null && QUEUED_SENTINEL in data;
}

function generateOptimisticId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

type HttpMethod = "POST" | "PATCH" | "DELETE";

export interface OptimisticContext {
  optimisticId: string;
  submittedAt: string;
}

export interface OrgMutationConfig<TResponse, TVariables, TCache = TResponse> {
  endpoint: string | ((variables: TVariables) => string);
  method?: HttpMethod;
  queryKey: readonly unknown[];
  optimisticQueryKey?: readonly unknown[];
  mutationKey?: readonly unknown[];
  optimisticUpdate?: (
    cached: TCache[],
    variables: TVariables,
    context: OptimisticContext,
  ) => TCache[];
  optimisticMode?: "exact" | "prefix";
  successMessage?: string | ((variables: TVariables) => string);
  errorMessage?: string;
  onErrorToast?: (
    error: Error,
    variables: TVariables,
    helpers: { retry: () => Promise<TResponse> },
  ) => void;
  invalidateKeys?: readonly (readonly unknown[])[];
  bodyFn?: (variables: TVariables) => unknown;
  idempotencyKey?: (variables: TVariables) => string;
  onSuccess?: (data: TResponse, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void | Promise<void>;
}

interface CacheSnapshot<TCache> {
  key: readonly unknown[];
  data: TCache[] | undefined;
}

interface MutationContext<TCache> {
  previous: TCache[] | undefined;
  snapshots: CacheSnapshot<TCache>[];
  wasOffline: boolean;
}

export function useOrgMutation<
  TResponse,
  TVariables = void,
  TCache = TResponse,
>(config: OrgMutationConfig<TResponse, TVariables, TCache>) {
  const {
    endpoint,
    method = "POST",
    queryKey,
    optimisticQueryKey,
    mutationKey,
    optimisticMode,
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
  const resolvedMutationKey = mutationKey ?? ["org-mutation", ...exactKey];
  const mutateRef = React.useRef<
    ((vars: TVariables) => Promise<TResponse>) | null
  >(null);

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

  const mutation = useMutation<
    TResponse,
    Error,
    TVariables,
    MutationContext<TCache>
  >({
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
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (idempotencyKey) {
            headers["Idempotency-Key"] = idempotencyKey(variables);
          }
          init.headers = headers;
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

      await queue.enqueue({
        endpoint: url,
        method,
        body: buildBody(variables),
        idempotencyKey: idempotencyKey?.(variables),
        queryKeysToInvalidate: [
          [...queryKey],
          ...invalidateKeys.map((key) => [...key]),
        ],
      });

      return { [QUEUED_SENTINEL]: true } as unknown as TResponse;
    },
    onMutate: async (variables): Promise<MutationContext<TCache>> => {
      await queryClient.cancelQueries({ queryKey });

      const optContext: OptimisticContext = {
        optimisticId: generateOptimisticId(),
        submittedAt: new Date().toISOString(),
      };

      if (optimisticMode === "prefix") {
        const snapshots = queryClient.getQueriesData<TCache[]>({ queryKey });
        queryClient.setQueriesData<TCache[]>({ queryKey }, (old) => {
          if (!old || !optimisticUpdate) return old;
          return optimisticUpdate(old, variables, optContext);
        });

        return {
          previous: undefined,
          snapshots: snapshots.map(([key, data]) => ({
            key,
            data: data ?? undefined,
          })),
          wasOffline: !isOnline,
        };
      }

      const previous = queryClient.getQueryData<TCache[]>(exactKey);
      if (previous && optimisticUpdate) {
        const next = optimisticUpdate(previous, variables, optContext);
        if (next !== undefined) {
          queryClient.setQueryData<TCache[]>(exactKey, next);
        }
      }

      return {
        previous: previous ?? undefined,
        snapshots: [],
        wasOffline: !isOnline,
      };
    },
    onError: (error, variables, context) => {
      if (context?.snapshots && context.snapshots.length > 0) {
        for (const snap of context.snapshots) {
          if (snap.data !== undefined) {
            queryClient.setQueryData<TCache[]>(snap.key, snap.data);
          }
        }
      } else if (context?.previous) {
        queryClient.setQueryData<TCache[]>(exactKey, context.previous);
      }

      void onErrorCb?.(error, variables);

      if (onErrorToast) {
        const retryFn = () => {
          if (mutateRef.current) return mutateRef.current(variables);
          return Promise.reject(new Error("Mutation not initialized"));
        };
        onErrorToast(error, variables, { retry: retryFn });
      } else {
        toast.dismiss();
        toast.error(errorMessage ?? error.message ?? "Something went wrong");
      }
    },
    onSuccess: (data, variables) => {
      if (isQueuedResult(data)) {
        toast.info("Saved offline — will sync when connected");
        return;
      }

      const message = getSuccessMsg(variables);
      if (message) {
        toast.dismiss();
        toast.success(message);
      }

      onSuccess?.(data, variables);
    },
    onSettled: (_data, _error, _variables, context) => {
      if (context?.wasOffline) return;
      if (queryClient.isMutating({ mutationKey: resolvedMutationKey }) > 1)
        return;

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

export { useOrgMutation as useOfflineJsonMutation };
