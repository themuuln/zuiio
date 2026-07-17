# Add Pagination to FlatList Screens

## Context
Three tab screens need infinite scroll: index.tsx (horses, currently MOCK), market.tsx (listings, placeholder), events.tsx (events, placeholder). Existing hooks are called from 6+ other screens, so new paginated variants are needed.

## Files to Change (6 files)

| File | Action | What changes |
|------|--------|--------------|
| `src/hooks/useHorsesPaginated.ts` | **Create** | `useInfiniteQuery` wrapper for horses with `.range()` |
| `src/hooks/useEventsPaginated.ts` | **Create** | `useInfiniteQuery` wrapper for events with `.range()` |
| `src/hooks/useListingsPaginated.ts` | **Create** | `useInfiniteQuery` wrapper for listings with `.range()` |
| `src/app/(tabs)/index.tsx` | Modify | Remove MOCK data, use `useHorsesPaginated`, add FlatList pagination |
| `src/app/(hooks)/market.tsx` | Modify | Replace placeholder with paginated listings FlatList |
| `src/app/(tabs)/events.tsx` | Modify | Replace placeholder with paginated events FlatList |

## Implementation

### Step 1: Create 3 paginated hooks (parallel, no deps)
Each uses `useInfiniteQuery` with `initialPageParam: 1`, `getNextPageParam` checking if page returned PAGE_SIZE results. Supabase `.range(offset, offset+19)`.

### Step 2: Update 3 screens (parallel, each uses its own hook)
Wire FlatList with `onEndReached → fetchNextPage`, `ListFooterComponent` for loading spinner, pull-to-refresh.

## Verification
- `npx tsc --noEmit` — zero errors
