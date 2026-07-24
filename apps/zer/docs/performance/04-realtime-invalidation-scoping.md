# Task 4: Scope realtime cache invalidation

**Goal:** Stop refetching the entire inventory list on every sale. During active POS use, every checkout currently triggers a background refetch of the inventory query for all connected clients of the org.

Read `docs/performance/README.md` ground rules first.

## Problem (verified)

`src/lib/query/hooks/use-realtime-subscriptions.ts` line 39:

```ts
{
  table: "sales",
  queryKeys: [saleKeys.lists(orgId!), inventoryKeys.lists(orgId!)],
  filter: `organization_id=eq.${orgId}`,
},
```

Every INSERT/UPDATE/DELETE on `sales` invalidates **both** the sales list and the inventory list. But stock changes are written to the `products` table, and there is already a `products` subscription (line 32) that invalidates `productKeys.lists(orgId)` when that happens.

## Step 1 — Verify the assumption before changing anything

Confirm that a sale's stock decrement actually updates `products.current_stock` (which fires the existing `products` channel). Check:

```bash
grep -rn "current_stock" src/app/\(dashboard\)/shop --include="*.ts" -l
grep -rn "current_stock" src/lib/stock-utils.ts | head -20
grep -rn "decrement\|current_stock" supabase/migrations/ | grep -i "function\|trigger" | head -20
```

You are looking for the checkout/sale path: does it (or a DB trigger) write to `products.current_stock`? If YES → proceed to Step 2. If you cannot confirm it → STOP, report what you found, and do not make the change.

## Step 2 — The change

In `use-realtime-subscriptions.ts`, remove `inventoryKeys.lists(orgId!)` from the `sales` entry:

```ts
{
  table: "sales",
  queryKeys: [saleKeys.lists(orgId!)],
  filter: `organization_id=eq.${orgId}`,
},
```

Then check which query keys the inventory page actually uses:

```bash
grep -rn "inventoryKeys\|productKeys" "src/app/(dashboard)/inventory/inventory-content.tsx" | head
```

- If the inventory page uses `inventoryKeys.lists(...)` for its product query, add `inventoryKeys.lists(orgId!)` to the **products** subscription entry (so stock updates via `products` still refresh the inventory page):

```ts
{
  table: "products",
  queryKeys: [productKeys.lists(orgId!), inventoryKeys.lists(orgId!)],
  filter: `organization_id=eq.${orgId}`,
},
```

- If it uses `productKeys.lists(...)`, no addition is needed.

Also update the file's doc comment (lines 14–24) — it currently says "Sales changes also invalidate the inventory/stock cache", which will no longer be true.

## Step 3 — Runtime verification (required)

Using the `next-dev-loop` skill / browser with two tabs:

1. Tab A: open `/inventory`, note a product's stock.
2. Tab B: complete a shop checkout containing that product.
3. Tab A: within a few seconds the stock number should update (via the `products` channel) **without a page reload**.

If stock does NOT update in Tab A, revert the change and report — the assumption in Step 1 was wrong in practice.

## Do NOT

- Do not remove or reorder the other subscriptions (contacts, expenses, brands).
- Do not change `@zuiio/realtime` package internals.
- Do not move `RealtimeSubscriptions` out of the dashboard shell (route-scoped subscriptions are a possible future task, not this one).

## Definition of done

- [ ] Step 1 verification documented in your report (file + line where stock write was confirmed)
- [ ] `sales` entry no longer invalidates inventory keys; `products` entry covers inventory keys if needed
- [ ] Doc comment updated
- [ ] Two-tab runtime test passed as described
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all pass
