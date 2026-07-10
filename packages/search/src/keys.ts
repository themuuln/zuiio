/**
 * Query key factory for RPC-based search.
 * Use with TanStack Query's queryKey.
 *
 * @example
 * ```ts
 * const { data } = useRpcSearch("төгрөг", { ... });
 * // queryKey is automatically: ["rpc-search", "search_products", "төгрөг"]
 * ```
 */
export const searchKeys = {
  all: ["search"] as const,
  rpc: (functionName: string, query: string) =>
    [...searchKeys.all, functionName, query] as const,
};
