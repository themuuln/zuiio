"use client";

import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@zuiio/hooks";
import type { UseRpcSearchOptions } from "./types";
import {
  DEFAULT_DEBOUNCE_MS,
  DEFAULT_LIMIT,
  DEFAULT_MAX_QUERY_LENGTH,
  DEFAULT_MIN_QUERY_LENGTH,
  DEFAULT_STALE_TIME,
} from "./defaults";

/**
 * Generic RPC search hook with debouncing, input sanitization,
 * error handling, and graceful degradation.
 *
 * @example
 * ```tsx
 * const { data: results } = useRpcSearch<Product>("төгрөг", {
 *   supabase,
 *   rpcFunction: "search_products",
 *   mapResult: (row) => ({ id: row.id, name: row.name } as Product),
 * });
 * ```
 */
export function useRpcSearch<T>(
  query: string,
  options: UseRpcSearchOptions<T> & {
    supabase: UseRpcSearchOptions<T>["supabase"];
  },
) {
  const {
    supabase,
    rpcFunction,
    mapResult,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    minQueryLength = DEFAULT_MIN_QUERY_LENGTH,
    maxLength = DEFAULT_MAX_QUERY_LENGTH,
    staleTime = DEFAULT_STALE_TIME,
    limit = DEFAULT_LIMIT,
  } = options;

  const trimmed = query
    .toLowerCase()
    .trim()
    .slice(0, maxLength);

  const debouncedQuery = useDebounce(trimmed, debounceMs);

  return useQuery({
    queryKey: ["rpc-search", rpcFunction, debouncedQuery],
    queryFn: async (): Promise<T[]> => {
      try {
        const { data, error } = await supabase.rpc(rpcFunction, {
          p_query: debouncedQuery,
          p_limit: limit,
        } as never);
        if (error) throw error;
        return (data as unknown as Record<string, unknown>[] ?? []).map(
          mapResult,
        );
      } catch {
        // Graceful degradation: return empty array
        // Caller uses `data` null check to fall back to client-side filtering
        return [];
      }
    },
    enabled: debouncedQuery.length >= minQueryLength,
    staleTime,
    placeholderData: (prev) => prev,
    retry: 1,
    retryDelay: 500,
  });
}
