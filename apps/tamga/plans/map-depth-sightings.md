# Map Depth + Sightings

## Context
Enhance herd tracking with better map UX (horse selection, location details, export) and add a sighting report form for lost horses.

## Files to Change
| File | Action | What changes |
|------|--------|--------------|
| `src/hooks/useSightings.ts` | Create | Query/mutation hooks for `lost_horse_sightings` table |
| `src/app/herd-tracking.tsx` | Rewrite | Full-screen map with horse markers, user location, tap-to-detail, horse filter, export |
| `src/app/lost-horse/sighting.tsx` | Create | Report sighting form for lost horses |

## Implementation Order
1. `useSightings.ts` — no dependencies on screens
2. `herd-tracking.tsx` — depends on useSightings + existing useHerdTracking
3. `lost-horse/sighting.tsx` — depends on useSightings

## Edge Cases
- No horses → EmptyState
- No locations → EmptyState on map
- Location permission denied → Alert + graceful fallback
- Empty sighting list → EmptyState
- Network error → error state from TanStack Query

## Verification
- Map renders with horse markers centered on Mongolia
- User location indicator shows when tracking enabled
- Tap marker → horse detail panel
- Horse filter chips work
- Sighting form submits to Supabase
- All text in Mongolian
