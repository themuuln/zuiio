# Agent Gateway Caching Optimizations

## Context
The agent-gateway hits Supabase on every webhook request for org name, tool definitions, and knowledge search. Adding Redis + in-memory caching reduces latency and DB load.

## Files to Change
| File | Action | What changes |
|------|--------|--------------|
| `src/gateway/webhook-helpers.ts` | Modify | Cache org name in Redis (1h TTL); add in-memory tool cache (5min) |
| `src/state/knowledge.ts` | Modify | Cache `searchKnowledge` results in Redis (5min TTL) |
| `src/state/session.ts` | Verify | Already uses Redis via `getCachedSession`/`setCachedSession` — no changes needed |

## Implementation Order
1. Modify `webhook-helpers.ts` org-name fetch (lines 21-36) to check Redis before Supabase
2. Modify `webhook-helpers.ts` `getProductTools` (lines 2336-2348) to add in-memory cache
3. Modify `knowledge.ts` `searchKnowledge` to cache results in Redis
4. Run `pnpm check`/`pnpm test` to verify

## Edge Cases
- Redis not configured → `getRedis()` returns null, fall through to Supabase (already handled)
- Cache miss → fetch from Supabase and populate cache
- Cache stale/expired → treat as miss, refresh from Supabase
- Tool cache size grows → periodic eviction when > 100 entries
- Knowledge results with embeddings vs without → cache key includes whether embedding was used

## Verification
1. `pnpm validate:types` — zero new type errors
2. `pnpm test` — all existing tests pass
3. Read modified files to confirm correctness
