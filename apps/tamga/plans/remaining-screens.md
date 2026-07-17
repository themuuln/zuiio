# Remaining Flutter Screens — Final 11

## Context
89 Flutter screens vs 80 Expo screens. 11 Flutter screens still lack Expo counterparts. These are the last screens needed for full feature parity.

## Files to Create

| File | Flutter Source | Description |
|------|---------------|-------------|
| `src/app/horse/[id]/verify-cert.tsx` | `verify_certificate_screen.dart` | Public certificate verification |
| `src/app/events/api-settings.tsx` | `api_settings_screen.dart` | API key management for events |
| `src/app/horse/stamp-tracing.tsx` | `stamp_tracing_screen.dart` | Horse brand/stamp tracing |
| `src/app/lineage/inbreeding.tsx` | `inbreeding_calculator_screen.dart` | Inbreeding risk calculator |
| `src/app/(tabs)/notifications-settings.tsx` | `notification_preferences_screen.dart` | Notification preferences |
| `src/app/races/new.tsx` | `race_form_screen.dart` | Create/edit race |
| `src/app/races/[id].tsx` | `race_results_editor_screen.dart` | Edit race results |
| `src/app/services/provider-dashboard.tsx` | `provider_dashboard_screen.dart` | Service provider dashboard |
| `src/app/shared/conflict-resolution.tsx` | `conflict_resolution_screen.dart` | Data conflict resolution |
| `src/app/shared/sync-queue.tsx` | `sync_queue_screen.dart` | Offline sync queue UI |
| `src/app/shared/sync-settings.tsx` | `sync_settings_screen.dart` | Sync settings |

## Implementation Order
1. Independent batch: all 11 screens have no inter-dependencies
2. Dispatch 3 parallel workers: batch A (3), batch B (4), batch C (4)
3. Wire all routes into `_layout.tsx`
4. Type-check + health check

## Patterns
- Follow existing screen patterns (PageHeader, Loading/Empty/Error states, Mongolian text)
- Supabase queries via hooks where available, direct `supabase.from()` otherwise
- TanStack Query v5 object syntax, `isPending` not `isLoading`

## Verification
1. `npx tsc --noEmit 2>&1 | grep "^src/"` — zero errors in src/
2. All 11 files exist on disk
3. Routes registered in `_layout.tsx`
