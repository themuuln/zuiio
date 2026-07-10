/**
 * Re-export from @zuiio/realtime with Tolom-specific convenience wrapper
 * that auto-injects the Supabase client and preserves the legacy API.
 */

import type { RealtimeTableConfig } from "@zuiio/realtime";
import { useRealtimeMulti as useRealtimeMultiBase } from "@zuiio/realtime";
import { createClient } from "@/lib/supabase/client";

interface UseRealtimeMultiOptions {
  /** List of tables to subscribe to. */
  tables: (Omit<RealtimeTableConfig, "queryKeys"> & {
    /** Query key prefix to invalidate on change. */
    queryKey: readonly unknown[];
  })[];
  /** Whether to enable all subscriptions. Default: `true`. */
  enabled?: boolean;
}

/**
 * Convenience wrapper that auto-injects the Supabase browser client.
 * Accepts legacy `queryKey` (singular) and maps to `queryKeys`.
 */
export function useRealtimeMulti({
  tables,
  enabled = true,
}: UseRealtimeMultiOptions) {
  const supabase = createClient();
  return useRealtimeMultiBase({
    supabase,
    enabled,
    tables: tables.map(({ table, queryKey, filter, schema }) => ({
      table,
      queryKeys: [queryKey],
      filter,
      schema,
    })),
  });
}

export type { RealtimeTableConfig };
