"use client";

import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { withDbCapture } from "@zuiio/capture";
import { createClient } from "@/lib/supabase/client";

/**
 * Configuration for creating a simple list query hook.
 */
interface SimpleQueryConfig<_T> {
  /** Query key factory with `lists(orgId)` method */
  keys: {
    lists: (orgId: string) => readonly unknown[];
  };
  /** Table name to query */
  table: string;
  /** Select query string (defaults to "*") */
  select?: string;
  /** Order column (defaults to "name") */
  orderBy?: string;
  /** Order direction */
  orderDirection?: "asc" | "desc";
  /** Additional filters to apply */
  filters?: Array<{
    column: string;
    operator: "eq" | "neq" | "is" | "gt" | "gte" | "lt" | "lte";
    value: unknown;
  }>;
  /** Whether to soft-delete filter (defaults to is("deleted_at", null)) */
  softDelete?: boolean;
}

/**
 * Creates a simple list query hook for a given table.
 *
 * Usage:
 * ```ts
 * export const useProducts = createSimpleQuery({
 *   keys: productKeys,
 *   table: "products",
 *   softDelete: true,
 * });
 * ```
 *
 * This generates a hook equivalent to:
 * ```ts
 * function useProducts(orgId: string) {
 *   const supabase = createClient();
 *   return useQuery({
 *     queryKey: productKeys.lists(orgId),
 *     queryFn: async () => {
 *       const { data, error } = await supabase
 *         .from("products").select("id,name,sku,current_stock")
 *         .eq("organization_id", orgId)
 *         .is("deleted_at", null)
 *         .order("name");
 *       if (error) throw error;
 *       return data;
 *     },
 *     enabled: !!orgId,
 *   });
 * }
 * ```
 */
export function createSimpleQuery<TData>(config: SimpleQueryConfig<TData>) {
  const {
    keys,
    table,
    select = "*",
    orderBy = "name",
    orderDirection = "asc",
    filters = [],
    softDelete = false,
  } = config;

  return function useHook(orgId: string): UseQueryResult<TData[], Error> {
    const supabase = createClient();

    return useQuery({
      queryKey: keys.lists(orgId) as unknown as readonly unknown[],
      queryFn: async () => {
        let query = supabase
          // biome-ignore lint/suspicious/noExplicitAny: generic table name
          .from(table as any)
          .select(select)
          .eq("organization_id", orgId);

        if (softDelete) {
          query = query.is("deleted_at", null);
        }

        for (const filter of filters) {
          // biome-ignore lint/suspicious/noExplicitAny: dynamic filter operator
          query = (query as any)[filter.operator](filter.column, filter.value);
        }

        const { data, error } = await withDbCapture(
          `simple_query:${table}`,
          query.order(orderBy, { ascending: orderDirection === "asc" }),
        );

        if (error) throw error;
        return data as unknown as TData[];
      },
      enabled: !!orgId,
    });
  };
}
