# @zuiio/realtime

Supabase Realtime → React Query cache invalidation hooks. Subscribes to `postgres_changes` via Supabase Realtime and calls `queryClient.invalidateQueries()` on every change.

**Peer deps:** `@tanstack/react-query` v5, `react` 19. Also requires a `@supabase/supabase-js` client instance passed as the `supabase` option.

## Exports

| Export | Kind | Description |
|---|---|---|
| `useRealtime` | Hook | Subscribe to a single table's changes; invalidates specified query keys |
| `useRealtimeMulti` | Hook | Subscribe to multiple tables over one WebSocket channel; more efficient than multiple `useRealtime` calls |
| `UseRealtimeOptions` | Type | Options for `useRealtime` — supabase, table, queryKeys, filter, enabled, schema |
| `UseRealtimeMultiOptions` | Type | Options for `useRealtimeMulti` — supabase, tables array, enabled |
| `RealtimeClient` | Type | Minimal Supabase client surface needed by the hooks (plain `any` to avoid version conflicts) |
| `RealtimeTableConfig` | Type | Per-table config — table name, queryKeys to invalidate, optional filter and schema |

## Subscription Pattern

Both hooks listen to `postgres_changes` events (`INSERT`, `UPDATE`, `DELETE`) and invalidate TanStack Query caches. RLS applies — Supabase only delivers rows the authenticated user can read. Always scope with `filter` to avoid cross-org noise.

```tsx
// Single table
useRealtime({
  supabase,
  table: "work_orders",
  queryKeys: workOrderKeys.all(orgId),
  filter: `organization_id=eq.${orgId}`,
  enabled: !!orgId,
});

// Multiple tables — one connection, multiple subscriptions
useRealtimeMulti({
  supabase,
  enabled: !!orgId,
  tables: [
    { table: "work_orders", queryKeys: [workOrderKeys.all(orgId)], filter: `organization_id=eq.${orgId}` },
    { table: "work_order_services", queryKeys: [workOrderKeys.all(orgId)], filter: `organization_id=eq.${orgId}` },
  ],
});
```

## Conventions

- One hook per file, kebab-case filename (`use-realtime.ts`, `use-realtime-multi.ts`).
- `queryKeys` in `useRealtime` accepts a single array or array-of-arrays (auto-normalized).
- `enabled` defaults to `true` — always pass `!!entityId` to avoid subscribing before data is ready.
- Channels are cleaned up on unmount; no manual unsubscribe needed.

## Tasks (Agent Router)

Use this section to find the right context for your task.

### Common tasks

- See README.md for usage examples and API reference
