# Task 1: Query limits + dashboard stats RPC

**Goal:** Stop fetching unbounded row sets. Biggest single perf win — page weight and query time currently grow linearly with business data.

Read `docs/performance/README.md` ground rules first.

## Part A — Dashboard quick-stats RPC

### Problem

`src/app/(dashboard)/_sections/quick-shortcuts.tsx` (around line 67) downloads **every product row** just to compute two aggregates:

```ts
supabase
  .from("products")
  .select("cost_price, current_stock, min_stock")
  .eq("organization_id", orgId)
  .is("deleted_at", null),
```

…then sums `cost_price * current_stock` in JS (line ~80) and counts low-stock items. The same component fires 3 more count queries (products, customers, suppliers). That's 4 round-trips and a potentially huge payload on **every dashboard load**.

### Fix

1. Create migration `supabase migration new dashboard_quick_stats_rpc` with:

```sql
create or replace function public.get_dashboard_quick_stats(p_organization_id uuid)
returns table (
  product_count bigint,
  customer_count bigint,
  supplier_count bigint,
  inventory_value numeric,
  low_stock_count bigint
)
language sql
security invoker
set search_path = ''
stable
as $$
  select
    (select count(*) from public.products p
      where p.organization_id = p_organization_id and p.deleted_at is null),
    (select count(*) from public.contacts c
      where c.organization_id = p_organization_id and c.type = 'customer'),
    (select count(*) from public.contacts c
      where c.organization_id = p_organization_id and c.type = 'supplier'),
    (select coalesce(sum(coalesce(p.cost_price, 0) * coalesce(p.current_stock, 0)), 0)
      from public.products p
      where p.organization_id = p_organization_id and p.deleted_at is null),
    (select count(*) from public.products p
      where p.organization_id = p_organization_id and p.deleted_at is null
        and p.current_stock is not null and p.min_stock is not null
        and p.current_stock <= p.min_stock);
$$;

grant execute on function public.get_dashboard_quick_stats(uuid) to authenticated;
```

**Before writing this SQL**, open `quick-shortcuts.tsx` and read the exact JS aggregate logic (which columns, whether the low-stock comparison is `<` or `<=`, whether soft-delete filters apply to contacts). The SQL above is a template — **the SQL must reproduce the existing JS logic exactly.** Adjust if the file differs.

`security invoker` is deliberate: the function runs with the caller's RLS policies, so it cannot leak cross-org data even if called with a foreign org id.

2. Apply the migration remotely + regenerate types (README ground rule 6).

3. Rewrite `quick-shortcuts.tsx` to replace the 4 queries with one call:

```ts
const { data: stats } = await withDbCapture(
  "dashboard_quick_stats",
  supabase.rpc("get_dashboard_quick_stats", { p_organization_id: orgId }).single(),
);
```

Keep the component's rendered output **identical** — same numbers, same formatting, same links. Only the data-fetching changes.

## Part B — Add `.limit()` to unbounded list queries

Add `.limit(N)` to these queries (verified unbounded on audit date). Insert `.limit()` **after** `.order(...)` so we keep the newest rows:

| File | Query | Limit |
|------|-------|-------|
| `src/app/(dashboard)/customers/page.tsx` (~line 45) | `contacts` type=customer | `.limit(500)` |
| `src/app/(dashboard)/sales/page.tsx` (~line 46) | `sales` list | `.limit(500)` |
| `src/app/(dashboard)/sales/page.tsx` (~line 60) | `products` for the sale form | `.limit(1000)` |
| `src/app/(dashboard)/invoices/page.tsx` (~line 20) | `invoices` list | `.limit(500)` |
| `src/app/(dashboard)/purchases/page.tsx` (~line 29) | `purchases` list | `.limit(500)` |
| `src/app/(dashboard)/expenses/expenses-content.tsx` (~line 31) | `expenses` list | `.limit(500)` |
| `src/app/(dashboard)/inventory/inventory-content.tsx` (~line 117) | `products` list | `.limit(1000)` |

Notes:

- `suppliers/page.tsx` already has `.limit(500)` — leave it.
- If any of these queries feed a client-side search box, the search now only covers loaded rows. That is accepted for this task; note it in your report.
- **Out of scope:** real server-side pagination / infinite scroll. That needs product decisions (URL params, `ErpDataTable` changes) — do NOT attempt it here.
- Do not touch the shop catalog (`src/components/shop/catalog-client.tsx`) — it has its own loading strategy.

## Definition of done

- [ ] Migration file created, applied to remote, recorded in `schema_migrations`, visible in `mcp__supabase_list_migrations`
- [ ] Types regenerated into both `src/lib/database.types.ts` and `src/lib/supabase/types.ts`; `biome check --write` run on them
- [ ] `quick-shortcuts.tsx` uses the single RPC; renders identical output
- [ ] All 7 `.limit()` additions in place
- [ ] Every touched query still uses `withDbCapture`
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all pass
- [ ] Dashboard verified in browser (`next-dev-loop` skill): stats numbers match pre-change values, no console errors
