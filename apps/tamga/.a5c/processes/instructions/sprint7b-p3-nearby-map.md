# Sprint 7b P3 — Nearby Horses on Map

## Context

Nearby horses currently show only as a list. They should appear as green markers on the map
so users can see at a glance which horses are nearby.

## Existing code

- `lib/src/features/map/application/nearby_horses_provider.dart` — nearbyHorsesProvider (FutureProvider)
- `lib/src/features/map/domain/horse_location.dart` — HorseLocation with lastSeenLat, lastSeenLng, horseName
- `lib/src/features/map/presentation/map_screen.dart` — MapScreen with markers + circles
- `lib/src/features/map/presentation/nearby_horses_screen.dart` — list view of nearby horses

## Task

### 1. Add nearby horses provider to MapScreen

In `map_screen.dart`, watch `nearbyHorsesProvider`:

```dart
// In build():
final nearbyAsync = ref.watch(nearbyHorsesProvider);

// Listen for changes:
ref.listen<AsyncValue<List<HorseLocation>>>(
  nearbyHorsesProvider,
  (prev, next) {
    next.whenData((horses) => _updateNearbyMarkers(horses));
  },
);
```

### 2. Add _updateNearbyMarkers method

```dart
Future<void> _updateNearbyMarkers(List<HorseLocation> horses) async {
  final controller = _controller;
  if (controller == null) return;

  // Add green markers for nearby horses
  final circles = <CircleOptions>[];
  for (final horse in horses) {
    circles.add(CircleOptions(
      geometry: LatLng(horse.lastSeenLat, horse.lastSeenLng),
      circleRadius: 8,
      circleColor: '#2E8B57', // sea green — different from red lost horses
      circleOpacity: 80,
      circleStrokeWidth: 2,
      circleStrokeColor: '#1a5c38',
      circleStrokeOpacity: 100,
    ));
  }

  if (circles.isNotEmpty) {
    await controller.addCircles(circles);
  }
}
```

### 3. Handle tap on nearby horse marker

MapLibre GL supports `onCircleTapped` callback. Add to MapLibreMap:

```dart
MapLibreMap(
  onCircleTapped: (Circle circle) {
    final data = circle.data;
    if (data != null && data['type'] == 'nearby') {
      // Show horse name snackbar
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${data['horseName']} — ойрхон байна')),
      );
    }
  },
)
```

Pass horse data when creating circles:

```dart
await controller.addCircles(circles, data: horses.map((h) => {
  'type': 'nearby',
  'horseName': h.horseName,
  'horseId': h.horseId,
}).toList());
```

### 4. Update _refreshMarkers to include nearby horses

```dart
Future<void> _refreshMarkers() async {
  final reports = ref.read(activeLostHorsesProvider).valueOrNull;
  final areas = ref.read(activeGeofencesProvider).valueOrNull;
  final nearby = ref.read(nearbyHorsesProvider).valueOrNull;
  if (reports != null) _updateMarkers(reports);
  if (areas != null) _updateGeofenceCircles(areas);
  if (nearby != null) _updateNearbyMarkers(nearby);
}
```

### 5. Fix clearCircles conflict

Currently `_updateGeofenceCircles` calls `controller.clearCircles()` which removes lost horse circles too.
Fix by using `controller.clearCircles()` then re-adding ALL circles (lost horse + geofence + nearby) in one batch.

Create a single `_renderAllCircles()` method that collects all circle sources and renders them together.

## Pitfalls

- `addCircles` with data parameter may not work on all MapLibre versions — test on device
- Green markers must be visually distinct from red lost horse markers
- Don't overload the map with markers if many horses are nearby — add a limit (e.g., top 50 closest)
- nearbyHorsesProvider needs current position to calculate nearby — ensure GPS is available

## Verification

- `dart analyze lib/src/features/map/` — 0 errors
- `flutter test test/features/map/` — tests pass
- Map shows three types of markers: red (lost), colored circles (geofences), green (nearby)
