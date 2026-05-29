import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface RealtimeTableConfig {
  /** Supabase table name. */
  table: string;
  /** Query key prefix to invalidate on change. */
  queryKey: readonly unknown[];
  /** Filter (Supabase Realtime filter syntax). */
  filter?: string;
  /** Schema. Default: `"public"`. */
  schema?: string;
}

interface UseRealtimeMultiOptions {
  /** List of tables to subscribe to. */
  tables: RealtimeTableConfig[];
  /** Whether to enable all subscriptions. Default: `true`. */
  enabled?: boolean;
}

/**
 * Subscribe to multiple Supabase Realtime tables in a single connection.
 *
 * More efficient than calling `useRealtime` multiple times — Supabase
 * multiplexes all subscriptions over one WebSocket connection.
 *
 * @example
 * ```tsx
 * useRealtimeMulti({
 *   enabled: !!orgId,
 *   tables: [
 *     { table: 'work_orders', queryKey: workOrderKeys.all(orgId), filter: `organization_id=eq.${orgId}` },
 *     { table: 'work_order_services', queryKey: workOrderKeys.all(orgId), filter: `organization_id=eq.${orgId}` },
 *     { table: 'mechanic_assignments', queryKey: workOrderKeys.all(orgId), filter: `organization_id=eq.${orgId}` },
 *   ],
 * });
 * ```
 */
export function useRealtimeMulti({
  tables,
  enabled = true,
}: UseRealtimeMultiOptions) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || tables.length === 0) return;

    const supabase = createClient();
    let channel = supabase.channel("realtime:multi");

    for (const { table, queryKey, filter, schema = "public" } of tables) {
      channel = channel.on(
        "postgres_changes" as const,
        {
          event: "*",
          schema,
          table,
          ...(filter ? { filter } : {}),
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
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
  }, [
    tables
      .map(
        (t) =>
          `${t.table}:${JSON.stringify(t.queryKey)}:${t.filter}:${t.schema}`,
      )
      .join("|"),
    enabled,
    queryClient,
  ]);
}
