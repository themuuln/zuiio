# Supabase Realtime + React Query Research

## Architecture: Hybrid Cache Invalidation

Supabase Realtime provides PostgreSQL change subscriptions (`postgres_changes`). The optimal pattern is to **invalidate React Query caches when database changes occur**, rather than using Realtime as the primary data source.

## Key Pattern: Realtime Cache Invalidation Hook

```typescript
// src/lib/query/hooks/use-realtime-invalidation.ts
export function useRealtimeInvalidation(config: {
  table: string;
  filter?: string;
  invalidateKeys: readonly unknown[];
  orgId?: string;
}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`table:${config.table}`)
      .on(
        "postgres_changes",
        {
          event: "*", // or "INSERT" | "UPDATE" | "DELETE"
          schema: "public",
          table: config.table,
          filter: config.filter,
        },
        () => {
          // Invalidate React Query cache on any change
          queryClient.invalidateQueries({
            queryKey: config.invalidateKeys as any,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [config.table, config.filter, JSON.stringify(config.invalidateKeys), queryClient, config.orgId]);
}
```

## Organization-Scoped Subscriptions

All tables have `organization_id` as a foreign key. Use Supabase's `filter` parameter:

```typescript
// Listen only to this organization's changes
const filter = `organization_id=eq.${orgId}`;

supabase
  .channel(`products:${orgId}`)
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "products",
      filter,
    },
    (payload) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  )
  .subscribe();
```

## Selective Invalidation Based on Payload

For mutations that need immediate feedback (e.g., completing a sale):

```typescript
supabase
  .channel(`sales:${orgId}`)
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "sales",
      filter: `organization_id=eq.${orgId}`,
    },
    (payload: RealtimePostgresChangesPayload<SalesRow>) => {
      // Only invalidate if this wasn't our own mutation
      // (optimistic update already handled it)
      if (payload.eventType === "INSERT") {
        queryClient.invalidateQueries({ queryKey: ["sales"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      }
    },
  )
  .subscribe();
```

## Performance Considerations

1. **Limit active subscriptions** — each channel uses a WebSocket connection. Subscribe at the layout level, not per-page.
2. **RLS is respected** — Realtime subscriptions respect Row-Level Security. Ensure RLS policies allow SELECT for the authenticated user on subscribed tables.
3. **Reconnection** — supabase-js handles reconnection automatically. Channels re-subscribe on reconnect.
4. **Connection multiplexing** — All channels share a single WebSocket connection to Supabase.

## Hybrid Optimistic + Realtime Flow

```
1. User triggers action (e.g., completes sale)
2. ✅ Optimistic update: UI reflects change immediately
3. 🔄 Server Action: validates and persists to Supabase
4. 🔄 Realtime: broadcasts change to all clients
5. 🔄 React Query: invalidates cache, refetches if needed
6. ✅ Reconciliation: if server response matches optimistic → done
7. ❌ On error: rollback optimistic update
```

## Subscription Hook Design

```typescript
// src/lib/query/hooks/use-realtime-subscriptions.ts
export function useShopRealtimeSubscriptions(orgId: string) {
  const queryClient = useQueryClient();

  // Products channel
  useEffect(() => {
    if (!orgId) return;
    const channel = createClient()
      .channel(`shop:${orgId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products", filter: `organization_id=eq.${orgId}` },
        () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales", filter: `organization_id=eq.${orgId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.sales.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
        },
      )
      .subscribe();

    return () => { createClient().removeChannel(channel); };
  }, [orgId, queryClient]);
}
```

## Realtime Typing

```typescript
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

// In the .on callback:
(payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
  const newRow = payload.new as ProductRow;
  const oldRow = payload.old as ProductRow;
}
```
