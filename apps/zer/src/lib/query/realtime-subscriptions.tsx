"use client";

import { useRealtimeSubscriptions } from "@/lib/query/hooks/use-realtime-subscriptions";

/**
 * Thin client wrapper that invokes the useRealtimeSubscriptions hook.
 *
 * Renders nothing; its sole purpose is to mount the hook inside a
 * server-rendered layout that passes orgId as a prop.
 */
export function RealtimeSubscriptions({
  orgId,
}: {
  orgId: string | null | undefined;
}) {
  useRealtimeSubscriptions(orgId);
  return null;
}
