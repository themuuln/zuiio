import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseRealtimeOptions {
  /** Supabase table name to subscribe to. */
  table: string;
  /** Query key prefix to invalidate on change. Pass the result of a keys factory method, e.g. `workOrderKeys.all(orgId)`. */
  queryKey: readonly unknown[];
  /** Filter the subscription (Supabase Realtime filter syntax). Example: `"organization_id=eq.${orgId}"`. */
  filter?: string;
  /** Whether to enable the subscription. Default: `true`. */
  enabled?: boolean;
  /** Schema to subscribe to. Default: `"public"`. */
  schema?: string;
}

/**
 * Subscribe to Supabase Realtime table changes and automatically invalidate React Query caches.
 *
 * Uses RLS — Supabase only sends rows the authenticated user can read.
 * Pair with `filter` for org-scoped subscriptions to avoid receiving
 * rows from other organizations.
 *
 * @example
 * ```tsx
 * useRealtime({
 *   table: 'work_orders',
 *   queryKey: workOrderKeys.all(orgId),
 *   filter: `organization_id=eq.${orgId}`,
 *   enabled: !!orgId,
 * });
 * ```
 */
export function useRealtime({
  table,
  queryKey,
  filter,
  enabled = true,
  schema = "public",
}: UseRealtimeOptions) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();

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
          queryClient.invalidateQueries({ queryKey });
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
  }, [table, JSON.stringify(queryKey), filter, enabled, schema, queryClient]);
}
