import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

import '../domain/map_enums.dart';
import '../data/location_service.dart';
import '../data/map_repository.dart';
import '../data/offline_tile_manager.dart';
import '../data/supabase_map_repository.dart';
import '../data/tile_cache_manager.dart';

/// Repository provider — swap SupabaseMapRepository for LocalMapRepository when offline.
final mapRepositoryProvider = Provider<MapRepository>((ref) {
  return SupabaseMapRepository();
});

/// Current GPS position of the device.
final currentPositionProvider =
    AsyncNotifierProvider<CurrentPositionNotifier, Position?>(
      CurrentPositionNotifier.new,
    );

class CurrentPositionNotifier extends AsyncNotifier<Position?> {
  @override
  Future<Position?> build() async {
    final service = ref.read(locationServiceProvider);
    final hasPermission = await service.requestPermission();
    if (!hasPermission) return null;
    return service.getCurrentPosition();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final service = ref.read(locationServiceProvider);
      return service.getCurrentPosition();
    });
  }
}

/// Active map layer selection.
final mapLayerProvider = StateProvider<MapLayer>((ref) => MapLayer.standard);

/// Currently selected marker ID on the map.
final selectedMarkerProvider = StateProvider<String?>((ref) => null);

/// Whether the app is in offline mode.
final isOfflineModeProvider = StateProvider<bool>((ref) => false);

/// Tile cache manager for areas beyond the bundled Mongolia PMTiles.
///
/// Default soft limit: 500 MB. Can be overridden for testing.
final tileCacheManagerProvider = Provider<TileCacheManager>((ref) {
  return TileCacheManager();
});

/// Offline tile manager — manages bundled & cached offline tiles.
final offlineTileManagerProvider = Provider<OfflineTileManager>((ref) {
  final cache = ref.watch(tileCacheManagerProvider);
  return OfflineTileManager(tileCache: cache, assetBundle: rootBundle);
});

/// Map style URL — resolves offline MBTiles first, falls back to OpenFreeMap.
final offlineStyleProvider = FutureProvider<String>((ref) async {
  final manager = ref.watch(offlineTileManagerProvider);
  return manager.getStyleJson();
});

/// Internal version counter bumped after cache mutations so that
/// [tileCacheSizeProvider] and [cachedTileCountProvider] recompute.
final _tileCacheVersionProvider = StateProvider<int>((ref) => 0);

/// Tile cache size in bytes.
///
/// Recomputes whenever [_tileCacheVersionProvider] changes. Call
/// [invalidateTileCacheMetrics] after cache mutations to trigger an update.
final tileCacheSizeProvider = FutureProvider.autoDispose<int>((ref) async {
  ref.watch(_tileCacheVersionProvider);
  final manager = ref.watch(offlineTileManagerProvider);
  return manager.tileCacheSizeBytes;
});

/// Number of tiles in the cache — useful for debug/UI display.
///
/// Recomputes whenever [_tileCacheVersionProvider] changes. Call
/// [invalidateTileCacheMetrics] after cache mutations to trigger an update.
final cachedTileCountProvider = FutureProvider.autoDispose<int>((ref) async {
  ref.watch(_tileCacheVersionProvider);
  final manager = ref.watch(offlineTileManagerProvider);
  return manager.cachedTileCount;
});

/// Invalidates tile cache metric providers, forcing them to recompute.
/// Call this after cache mutations such as downloading a tile or clearing
/// the cache to keep UI-visible metrics up to date.
void invalidateTileCacheMetrics(Ref ref) {
  ref.invalidate(_tileCacheVersionProvider);
}
