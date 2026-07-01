import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { RealtimeClient, RealtimeTableConfig } from "./use-realtime";

/** Configuration for subscribing to multiple tables. */
export interface UseRealtimeMultiOptions {
  /** Supabase client instance. */
  supabase: RealtimeClient;
  /** List of tables to subscribe to. */
  tables: RealtimeTableConfig[];
  /** Whether to enable all subscriptions. Default: `true`. */
  enabled?: boolean;
}

/**
 * Subscribe to multiple Supabase Realtime tables in a single WebSocket channel.
 *
 * More efficient than calling `useRealtime` multiple times — Supabase
 * multiplexes all subscriptions over one connection.
 *
 * @example
 * ```tsx
 * useRealtimeMulti({
 *   supabase,
 *   enabled: !!orgId,
 *   tables: [
 *     { table: "work_orders", queryKeys: [workOrderKeys.all(orgId)], filter: `organization_id=eq.${orgId}` },
 *     { table: "work_order_services", queryKeys: [workOrderKeys.all(orgId)], filter: `organization_id=eq.${orgId}` },
 *     { table: "mechanic_assignments", queryKeys: [workOrderKeys.all(orgId)], filter: `organization_id=eq.${orgId}` },
 *   ],
 * });
 * ```
 */
export function useRealtimeMulti({
  supabase,
  tables,
  enabled = true,
}: UseRealtimeMultiOptions) {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<RealtimeClient["channel"]> | null>(null);

  useEffect(() => {
    if (!enabled || tables.length === 0) return;

    let channel = supabase.channel("realtime:multi");

    for (const {
      table,
      queryKeys,
      filter,
      schema = "public",
    } of tables) {
      channel = channel.on(
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
      );
    }

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, queryClient, supabase, tables]);
}
