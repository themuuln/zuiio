# ADR-0001: Uncached Bay View Data Fetcher

**Date**: 2026-05-15
**Status**: Accepted

## Context

After every mutation (drag-to-bay, status change, mechanic assign), the UI called `getBayViewData()` which used Next.js `unstable_cache` with a 30s TTL. Despite `revalidateTag` calls in mutation functions, the cached data sometimes served stale results, overwriting optimistic UI updates.

## Decision

Create `getBayViewDataFresh()` — an uncached version that always hits the database directly. The client component now uses this for ALL fetches (initial load, after-mutation refetches, and 30s auto-polling).

The cached `getBayViewData()` is preserved for any future server components that might need it, but the client never uses it.

## Consequences

+ UI always reflects committed database state after mutations
+ No more "snapping back" to stale data
+ Slightly more DB queries (negligible for bay view's small dataset)

## Alternatives Considered

- Fixing `revalidateTag` calls to remove invalid `"max"` argument — would work but is less reliable
- Adding a `forceFresh` parameter — same outcome, more complex API
