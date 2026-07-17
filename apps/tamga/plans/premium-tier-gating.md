# Premium Tier Gating for Tamga

## Context
Tamga has 4 tiers (Free/Pro/Breeder/Stable) but lacks a `subscription_history` table and a `user_meets_tier()` SQL function for server-side tier checks. The existing system reads tier from `profiles.subscription_tier`. This adds a proper subscription history table, an SQL-based tier check, a simplified `useTierGate` hook, and rewrites the subscription screen to use the new data source alongside the existing pattern.

## Files to Change
| File | Action | What changes |
|------|--------|--------------|
| Supabase migration | Create via MCP | `subscription_history` table + `user_meets_tier()` function |
| `src/hooks/useTierGate.ts` | Create | New hook querying `subscription_history` for tier + `meetsTier()` helper |
| `src/app/subscription.tsx` | Rewrite | Full screen: current plan display, 4 plan cards with features in Mongolian, upgrade/downgrade/cancel, comparison table |

## Dependencies
1. SQL migration must apply first (table must exist for RLS)
2. `useTierGate.ts` is standalone — no deps on other new files
3. `subscription.tsx` depends on `useSubscriptionMutations.ts` (existing: `useUpgradeSubscription`, `useCancelSubscription`, `TIER_META`, `TIER_ORDER`, `TIER_FEATURES`)

## Implementation Order
1. Apply SQL migration via `mcp__supabase_tamga_apply_migration`
2. Create `src/hooks/useTierGate.ts`
3. Rewrite `src/app/subscription.tsx` — integrate `useTierGate` for current tier display while keeping existing upgrade/cancel mutations

## Edge Cases
- User with no subscription_history row → defaults to "free"
- `useTierGate` with no userId → disabled query, returns "free"
- Upgrade mutation fails → Alert shows error
- Cancel on free tier → no cancel button shown

## Verification
1. `npx tsc --noEmit` — zero new errors in src/
2. Confirm migration applied via MCP (list tables)
