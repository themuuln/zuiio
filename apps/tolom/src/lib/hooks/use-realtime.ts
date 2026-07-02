/**
 * Re-export from @zuiio/realtime with Tolom-specific convenience wrappers
 * that auto-inject the Supabase client and preserve the legacy `queryKey` API.
 */
export { useRealtimeMulti } from "@zuiio/realtime";
export type {
  UseRealtimeMultiOptions,
  RealtimeTableConfig,
} from "@zuiio/realtime";

import { useRealtime as useRealtimeBase } from "@zuiio/realtime";
import { createClient } from "@/lib/supabase/client";

/**
 * Convenience wrapper that auto-injects the Supabase browser client.
 * Accepts a single `queryKey` (legacy API) for backward compatibility.
 */
export function useRealtime({
  table,
  queryKey,
  filter,
  enabled = true,
  schema = "public",
}: {
  table: string;
  queryKey: readonly unknown[];
  filter?: string;
  enabled?: boolean;
  schema?: string;
}) {
  const supabase = createClient();
  return useRealtimeBase({
    supabase,
    table,
    queryKeys: queryKey,
    filter,
    enabled,
    schema,
  });
}
