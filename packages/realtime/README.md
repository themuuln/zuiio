# @zuiio/realtime — Supabase Realtime Hooks

React hooks that subscribe to Supabase Realtime table changes and automatically invalidate TanStack Query caches.

## Exports

| Export | Kind | Description |
|---|---|---|
| `useRealtime` | Hook | Subscribe to a single table; invalidates query keys on any change |
| `useRealtimeMulti` | Hook | Subscribe to multiple tables over a single WebSocket channel |
| `UseRealtimeOptions` | Type | Options for `useRealtime` |
| `UseRealtimeMultiOptions` | Type | Options for `useRealtimeMulti` |
| `RealtimeTableConfig` | Type | Per-table subscription config (table, queryKeys, filter, schema) |
| `RealtimeClient` | Type | Minimal Supabase client surface (avoids version incompatibilities) |

## Usage

### Single table

```tsx
import { useRealtime } from "@zuiio/realtime";

useRealtime({
  supabase,
  table: "work_orders",
  queryKeys: workOrderKeys.all(orgId),
  filter: `organization_id=eq.${orgId}`,
  enabled: !!orgId,
});
```

`queryKeys` accepts a single array or an array of arrays to invalidate multiple query key groups:

```tsx
useRealtime({
  supabase,
  table: "sales",
  queryKeys: [saleKeys.lists(orgId), inventoryKeys.lists(orgId)],
  filter: `organization_id=eq.${orgId}`,
  enabled: !!orgId,
});
```

### Multiple tables (single channel)

`useRealtimeMulti` multiplexes all subscriptions over one WebSocket connection — more efficient than calling `useRealtime` multiple times.

```tsx
import { useRealtimeMulti } from "@zuiio/realtime";

useRealtimeMulti({
  supabase,
  enabled: !!orgId,
  tables: [
    { table: "work_orders", queryKeys: [workOrderKeys.all(orgId)], filter: `organization_id=eq.${orgId}` },
    { table: "work_order_services", queryKeys: [workOrderKeys.all(orgId)], filter: `organization_id=eq.${orgId}` },
    { table: "mechanic_assignments", queryKeys: [workOrderKeys.all(orgId)], filter: `organization_id=eq.${orgId}` },
  ],
});
```

## Supabase Realtime requirements

- **Enable Realtime** on each table in the Supabase dashboard (Database → Replication) or via CLI.
- **RLS is respected** — Supabase only pushes rows the authenticated user can SELECT. If subscriptions silently produce no data, check that RLS policies allow the current user.
- **Use `filter` for multi-tenant apps** — without it you'll receive every inserted/updated/deleted row across all organizations. Filter syntax is `column=eq.${value}`.
- **Peer dependencies** — requires `react ^19`, `@tanstack/react-query ^5`, and a `@supabase/supabase-js` client (not listed as a peer dep to avoid version conflicts; the `RealtimeClient` type accepts any compatible client).
