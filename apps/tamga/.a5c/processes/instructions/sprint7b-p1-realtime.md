# Sprint 7b P1 — Real-time Subscriptions

## Context

Map markers currently update only on pull-to-refresh or after navigating back from report screen.
Need Supabase realtime subscriptions so markers update live when other users report lost horses.

## Existing code

- `lib/src/features/map/data/map_repository.dart` — abstract MapRepository with Future-based methods
- `lib/src/features/map/data/supabase_map_repository.dart` — Supabase impl with RPC calls
- `lib/src/features/map/application/lost_horse_providers.dart` — FutureProvider for activeLostHorses
- `lib/src/features/map/application/nearby_horses_provider.dart` — FutureProvider for nearbyHorses
- `lib/src/features/map/application/map_providers.dart` — currentPositionProvider, etc.

## Task

### 1. Add stream methods to MapRepository

In `map_repository.dart`, add:

```dart
Stream<List<LostHorseReport>> watchActiveLostHorses();
Stream<List<HorseLocation>> watchNearbyHorses(double lat, double lng, double radiusKm);
```

### 2. Implement in SupabaseMapRepository

Use Supabase realtime channel subscriptions:

```dart
@override
Stream<List<LostHorseReport>> watchActiveLostHorses() {
  final channel = Supabase.instance.client
      .channel('lost_horses')
      .onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'lost_horse_reports',
        filter: PostgresChangeFilter(
          type: PostgresChangeFilterType.eq,
          column: 'status',
          value: 'active',
        ),
        callback: (payload) async {
          // Re-fetch full list on any change
          final result = await getActiveLostHorses();
          result.when(
            onSuccess: (v) => _lostHorsesController.add(v),
            onFailure: (e) {},
          );
        },
      )
      .subscribe();

  // Initial fetch
  getActiveLostHorses().then((result) {
    result.when(
      onSuccess: (v) => _lostHorsesController.add(v),
      onFailure: (e) {},
    );
  });

  return _lostHorsesController.stream;
}
```

Add a `BehaviorSubject<List<LostHorseReport>>` controller as a field.

### 3. Update providers to use StreamProvider

In `lost_horse_providers.dart`:

```dart
final activeLostHorsesStreamProvider = StreamProvider<List<LostHorseReport>>((ref) {
  final repo = ref.watch(mapRepositoryProvider);
  return repo.watchActiveLostHorses();
});
```

Keep the FutureProvider for one-shot reads. Add the stream provider alongside it.

In `map_screen.dart`, switch from `ref.watch(activeLostHorsesProvider)` to `ref.watch(activeLostHorsesStreamProvider)`.

### 4. Same pattern for nearby horses

Add `watchNearbyHorses()` stream, update nearby_horses_provider.dart, update MapScreen to use stream.

## Pitfalls

- Supabase channel must be properly disposed — add `dispose()` method or use autoDispose
- Don't create duplicate subscriptions — use a singleton pattern or Riverpod autoDispose
- Initial fetch must happen alongside subscription to avoid empty state on first load
- PostgresChangeFilter requires the table to have REPLICA IDENTITY set (check migration)

## Verification

- `dart analyze lib/src/features/map/` — 0 errors
- `flutter test test/features/map/` — tests still pass
- Map screen rebuilds automatically when a new lost horse report is inserted via Supabase
