# Sprint 7b P2 — Offline MBTiles Bundle

## Context

Rural Mongolia has no internet. Map must work offline with bundled vector tiles.
Protomaps provides free MBTiles extracts of any country.

## Existing code

- `lib/src/features/map/data/offline_tile_manager.dart` — copies MBTiles from assets, provides path
- `lib/src/features/map/presentation/map_screen.dart` — uses OpenFreeMap style string
- `pubspec.yaml` — has mbtiles: ^0.5.0

## Task

### 1. Find and download Protomaps Mongolia MBTiles

- Search for "protomaps mbtiles download mongolia" or "protomaps basemaps"
- Protomaps provides free extracts: https://protomaps.com/downloads
- Look for a Mongolia country extract at zoom 0-14 (estimated 200-500MB)
- If no direct MBTiles available, document the manual download steps

### 2. Add MBTiles to Flutter assets

In `pubspec.yaml`, add under flutter/assets:

```yaml
flutter:
  assets:
    - assets/tiles/mongolia.mbtiles
```

Create `assets/tiles/` directory.

### 3. Update OfflineTileManager

The current implementation copies from assets but doesn't generate a MapLibre-compatible style JSON.

Add a method to generate the style:

```dart
/// Returns a MapLibre style JSON pointing to the local MBTiles via file:// protocol.
Future<String> getStyleJson() async {
  final mbtilesPath = await getMbtilesPath();
  if (mbtilesPath == null) return _fallbackStyleUrl;

  // MapLibre GL can read MBTiles directly via file URI
  return jsonEncode({
    "version": 8,
    "sources": {
      "offline": {
        "type": "vector",
        "url": "mbtiles://$mbtilesPath"
      }
    },
    "layers": [
      {
        "id": "background",
        "type": "background",
        "paint": {"background-color": "#f8f4f0"}
      },
      {
        "id": "earth",
        "type": "fill",
        "source": "offline",
        "source-layer": "earth",
        "paint": {"fill-color": "#ebe6df"}
      },
      {
        "id": "water",
        "type": "fill",
        "source": "offline",
        "source-layer": "water",
        "paint": {"fill-color": "#aad3df"}
      },
      {
        "id": "roads",
        "type": "line",
        "source": "offline",
        "source-layer": "roads",
        "paint": {
          "line-color": "#ffffff",
          "line-width": 1
        }
      }
    ]
  });
}
```

### 4. Update MapScreen

Replace the hardcoded style URL with OfflineTileManager:

```dart
MapLibreMap(
  styleString: offlineStyleUrl, // resolved from OfflineTileManager
  // ...
)
```

Use a FutureProvider for the style URL so it resolves async.

### 5. Fallback behavior

If MBTiles not bundled (development mode), fall back to OpenFreeMap.

## Pitfalls

- MBTiles file can be 200-500MB — ensure assets are compressed and the copy operation is efficient
- `mbtiles://` protocol only works on mobile (iOS/Android), not web
- MapLibre GL style layers must match the vector tile layer names in the MBTiles
- Protomaps uses "water", "earth", "roads", "buildings", "landuse" layer names

## Verification

- `dart analyze lib/src/features/map/` — 0 errors
- MBTiles file exists in assets/tiles/
- OfflineTileManager.getStyleJson() returns valid JSON
- Map falls back to OpenFreeMap when MBTiles not present
