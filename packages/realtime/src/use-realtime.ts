import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

/** A Supabase realtime channel subscription handle. */
export interface RealtimeChannelHandle {
  subscribe: (callback?: (status: string) => void) => void;
  on: (
    event: string,
    filter: Record<string, unknown>,
    callback: (payload: Record<string, unknown>) => void,
  ) => RealtimeChannelHandle;
  unsubscribe: () => void;
}

/**
 * Minimal Supabase client surface needed by realtime hooks.
 * Defined with plain function signatures (not derived from SupabaseClient)
 * to avoid type incompatibilities between @supabase/supabase-js versions.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RealtimeClient = any;

/** Configuration for a single realtime subscription. */
export interface RealtimeTableConfig {
  /** Supabase table name to subscribe to. */
  table: string;
  /** Query key prefix(es) to invalidate on change. */
  queryKeys: readonly (readonly unknown[])[];
  /** Filter (Supabase Realtime filter syntax). Example: `"organization_id=eq.${orgId}"`. */
  filter?: string;
  /** Schema. Default: `"public"`. */
  schema?: string;
}

/** Configuration for subscribing to a single table (convenience). */
export interface UseRealtimeOptions {
  /** Supabase client instance. */
  supabase: RealtimeClient;
  /** Supabase table name to subscribe to. */
  table: string;
  /** Query key(s) to invalidate on change. A single array or an array of arrays. */
  queryKeys: readonly unknown[] | readonly (readonly unknown[])[];
  /** Filter the subscription (Supabase Realtime filter syntax). */
  filter?: string;
  /** Whether to enable the subscription. Default: `true`. */
  enabled?: boolean;
  /** Schema to subscribe to. Default: `"public"`. */
  schema?: string;
}

/**
 * Subscribe to Supabase Realtime table changes and automatically invalidate
 * React Query caches.
 *
 * Uses RLS — Supabase only sends rows the authenticated user can read.
 * Pair with `filter` for org-scoped subscriptions to avoid receiving
 * rows from other organizations.
 *
 * @example
 * ```tsx
 * useRealtime({
 *   supabase,
 *   table: "work_orders",
 *   queryKeys: workOrderKeys.all(orgId),
 *   filter: `organization_id=eq.${orgId}`,
 *   enabled: !!orgId,
 * });
 * ```
 *
 * @example
 * ```tsx
 * // Invalidate multiple query key groups
 * useRealtime({
 *   supabase,
 *   table: "sales",
 *   queryKeys: [saleKeys.lists(orgId), inventoryKeys.lists(orgId)],
 *   filter: `organization_id=eq.${orgId}`,
 *   enabled: !!orgId,
 * });
 * ```
 */
export function useRealtime({
  supabase,
  table,
  queryKeys: rawQueryKeys,
  filter,
  enabled = true,
  schema = "public",
}: UseRealtimeOptions) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannelHandle | null>(null);

  // Normalize: single array → array of arrays
  const queryKeys = Array.isArray(rawQueryKeys[0])
    ? (rawQueryKeys as readonly (readonly unknown[])[])
    : [rawQueryKeys as readonly unknown[]];

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel(`realtime:${table}`)
      .on(
        "postgres_changes" as const,
        {
          event: "*",
          schema,
          table,
          ...(filter ? { filter } : {}),
        },
        () => {
          for (const queryKey of queryKeys) {
            queryClient.invalidateQueries({ queryKey });
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, filter, enabled, schema, queryClient, supabase, queryKeys]);
}
