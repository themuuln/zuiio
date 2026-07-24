import 'dart:io';

import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

import 'tile_cache_manager.dart';

/// Manages offline map tile downloads and caching.
///
/// Supports both MBTiles and PMTiles formats for vector tile storage.
/// Bundled tiles in assets/tiles/ are used when available,
/// with fallback to OpenFreeMap for development.
///
/// Integrates with [TileCacheManager] to cache tiles for areas beyond
/// the bundled Mongolia PMTiles, with a configurable storage limit (~500 MB).
class OfflineTileManager {
  // ── MBTiles paths ──
  static const _assetMbtilesPath = 'assets/tiles/mongolia.mbtiles';
  static const _localMbtilesFilename = 'mongolia.mbtiles';

  // ── PMTiles paths ──
  static const _assetPmtilesPath = 'assets/tiles/mongolia.pmtiles';
  static const _localPmtilesFilename = 'mongolia.pmtiles';

  static const _fallbackStyleUrl =
      'https://tiles.openfreemap.org/styles/liberty';

  // ── Tile source URLs ──
  static const _protomapsBasemapUrl =
      'https://r2-public.protomaps.com/protomaps-basemaps/protomaps-basemap-v4-0-0.pmtiles';
  static const _openfreemapStyleUrl =
      'https://tiles.openfreemap.org/styles/liberty';

  /// The tile cache manager for areas beyond the bundled PMTiles.
  final TileCacheManager tileCache;

  /// Asset bundle for loading bundled tile files — overridable for testing.
  final AssetBundle _assetBundle;

  /// Creates an [OfflineTileManager] with an optional [TileCacheManager].
  ///
  /// If no [TileCacheManager] is provided, a default one is created with
  /// the standard 500 MB soft storage limit.
  ///
  /// An optional [assetBundle] can be provided for testing — when omitted,
  /// defaults to [rootBundle].
  OfflineTileManager({TileCacheManager? tileCache, AssetBundle? assetBundle})
    : tileCache = tileCache ?? TileCacheManager(),
      _assetBundle = assetBundle ?? rootBundle;

  /// Returns the path to the offline tile file (PMTiles preferred, then MBTiles).
  Future<String?> getOfflineTilesPath() async {
    final appDir = await getApplicationDocumentsDirectory();

    // Check PMTiles first (preferred)
    final pmtilesLocalPath = p.join(appDir.path, _localPmtilesFilename);
    if (await File(pmtilesLocalPath).exists()) {
      return pmtilesLocalPath;
    }

    // Try to copy PMTiles from assets
    try {
      final data = await _assetBundle.load(_assetPmtilesPath);
      final bytes = data.buffer.asUint8List();
      await File(pmtilesLocalPath).writeAsBytes(bytes);
      return pmtilesLocalPath;
    } catch (_) {
      // PMTiles asset not bundled
    }

    // Fall back to MBTiles
    final mbtilesLocalPath = p.join(appDir.path, _localMbtilesFilename);
    if (await File(mbtilesLocalPath).exists()) {
      return mbtilesLocalPath;
    }

    // Try to copy MBTiles from assets
    try {
      final data = await _assetBundle.load(_assetMbtilesPath);
      final bytes = data.buffer.asUint8List();
      await File(mbtilesLocalPath).writeAsBytes(bytes);
      return mbtilesLocalPath;
    } catch (_) {
      // MBTiles asset not bundled
    }

    return null;
  }

  /// Returns the path to the MBTiles file, copying from assets if needed.
  Future<String?> getMbtilesPath() async {
    final appDir = await getApplicationDocumentsDirectory();
    final localPath = p.join(appDir.path, _localMbtilesFilename);

    // If already copied, return local path
    if (await File(localPath).exists()) {
      return localPath;
    }

    // Try to copy from bundled assets
    try {
      final data = await _assetBundle.load(_assetMbtilesPath);
      final bytes = data.buffer.asUint8List();
      await File(localPath).writeAsBytes(bytes);
      return localPath;
    } catch (_) {
      // Asset not bundled — return null for fallback
      return null;
    }
  }

  /// Returns the path to the PMTiles file, copying from assets if needed.
  Future<String?> getPmtilesPath() async {
    final appDir = await getApplicationDocumentsDirectory();
    final localPath = p.join(appDir.path, _localPmtilesFilename);

    // If already copied, return local path
    if (await File(localPath).exists()) {
      return localPath;
    }

    // Try to copy from bundled assets
    try {
      final data = await _assetBundle.load(_assetPmtilesPath);
      final bytes = data.buffer.asUint8List();
      await File(localPath).writeAsBytes(bytes);
      return localPath;
    } catch (_) {
      // Asset not bundled — return null
      return null;
    }
  }

  /// Returns a MapLibre-compatible style JSON string.
  ///
  /// If bundled tiles exist (PMTiles or MBTiles), returns a style pointing to them.
  /// Otherwise falls back to OpenFreeMap online style.
  Future<String> getStyleJson() async {
    // Check for PMTiles first
    final pmtilesPath = await getPmtilesPath();
    if (pmtilesPath != null) {
      return _buildPmtilesStyleJson(pmtilesPath);
    }

    // Fall back to MBTiles
    final mbtilesPath = await getMbtilesPath();
    if (mbtilesPath != null) {
      return _buildMbtilesStyleJson(mbtilesPath);
    }

    // No offline tiles — return online style URL
    return _fallbackStyleUrl;
  }

  /// Returns the tile source URL for the map.
  ///
  /// For PMTiles, returns the `pmtiles://` protocol URL.
  /// For MBTiles, returns the `mbtiles://` protocol URL.
  /// For online, returns the OpenFreeMap style URL.
  Future<String> getTileSourceUrl() async {
    final pmtilesPath = await getPmtilesPath();
    if (pmtilesPath != null) {
      return 'pmtiles://$pmtilesPath';
    }

    final mbtilesPath = await getMbtilesPath();
    if (mbtilesPath != null) {
      return 'mbtiles://$mbtilesPath';
    }

    return _openfreemapStyleUrl;
  }

  /// Whether offline tiles are currently available.
  ///
  /// Returns true if bundled PMTiles/MBTiles exist OR if the tile cache
  /// has entries. This allows the map to work offline for cached areas
  /// beyond the Mongolia bounds.
  Future<bool> get hasOfflineTiles async {
    // Check bundled tiles first
    final path = await getOfflineTilesPath();
    if (path != null) return true;

    // Check if tile cache has any entries
    final count = await tileCache.cachedTileCount;
    return count > 0;
  }

  /// Returns the download URL for the Protomaps basemap.
  String get downloadUrl => _protomapsBasemapUrl;

  /// Returns the file size estimate for the Mongolia extract.
  ///
  /// Approximate sizes:
  /// - Full planet: ~120GB
  /// - Mongolia (zoom 0-12): ~500MB
  /// - Mongolia (zoom 0-10): ~150MB
  /// - Mongolia (zoom 0-8): ~30MB
  static const estimatedSizeMb = 150;

  /// Returns the tile cache directory path for areas beyond the bundled PMTiles.
  Future<Directory> getTileCacheDirectory() => tileCache.cacheDirectory;

  /// Returns the current tile cache size in bytes.
  Future<int> get tileCacheSizeBytes => tileCache.cacheSizeBytes;

  /// Returns the number of cached tiles.
  Future<int> get cachedTileCount => tileCache.cachedTileCount;

  /// Whether the tile cache has exceeded the soft limit.
  Future<bool> get isTileCacheFull => tileCache.isCacheFull;

  /// Clears the tile cache.
  Future<void> clearTileCache() => tileCache.clearCache();

  /// Downloads and caches a single tile at the given coordinates.
  ///
  /// Returns the cached file if successful, or null if the tile is
  /// unavailable (e.g., no internet or the tile doesn't exist).
  Future<File?> downloadAndCacheTile(int z, int x, int y) =>
      tileCache.downloadAndCacheTile(z, x, y);

  /// Copies a downloaded PMTiles file to the app's documents directory.
  Future<bool> installPmtiles(String sourcePath) async {
    try {
      final appDir = await getApplicationDocumentsDirectory();
      final localPath = p.join(appDir.path, _localPmtilesFilename);

      // Copy file
      await File(sourcePath).copy(localPath);

      // Verify installation
      if (await File(localPath).exists()) {
        final size = await File(localPath).length();
        if (size > 1000) {
          // At least 1KB
          return true;
        }
      }

      return false;
    } catch (_) {
      return false;
    }
  }

  // ── Private helpers ──

  String _buildPmtilesStyleJson(String pmtilesPath) {
    return '''
{
  "version": 8,
  "name": "Tamga Offline (PMTiles)",
  "glyphs": "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
  "sprite": "https://protomaps.github.io/basemaps-assets/sprites/v4/light",
  "sources": {
    "protomaps": {
      "type": "vector",
      "url": "pmtiles://$pmtilesPath",
      "attribution": "<a href=\\"https://protomaps.com\\">Protomaps</a> © <a href=\\"https://openstreetmap.org\\">OpenStreetMap</a>"
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
      "source": "protomaps",
      "source-layer": "earth",
      "paint": {"fill-color": "#ebe6df"}
    },
    {
      "id": "water",
      "type": "fill",
      "source": "protomaps",
      "source-layer": "water",
      "paint": {"fill-color": "#aad3df"}
    },
    {
      "id": "waterway",
      "type": "line",
      "source": "protomaps",
      "source-layer": "waterway",
      "paint": {
        "line-color": "#aad3df",
        "line-width": 1
      }
    },
    {
      "id": "roads",
      "type": "line",
      "source": "protomaps",
      "source-layer": "roads",
      "paint": {
        "line-color": "#ffffff",
        "line-width": 1
      }
    },
    {
      "id": "buildings",
      "type": "fill",
      "source": "protomaps",
      "source-layer": "buildings",
      "paint": {"fill-color": "#e0d8d0"}
    },
    {
      "id": "landuse",
      "type": "fill",
      "source": "protomaps",
      "source-layer": "landuse",
      "paint": {"fill-color": "#d8e8c8"}
    }
  ]
}
''';
  }

  String _buildMbtilesStyleJson(String mbtilesPath) {
    return '''
{
  "version": 8,
  "name": "Tamga Offline",
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
      "id": "waterway",
      "type": "line",
      "source": "offline",
      "source-layer": "waterway",
      "paint": {
        "line-color": "#aad3df",
        "line-width": 1
      }
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
    },
    {
      "id": "buildings",
      "type": "fill",
      "source": "offline",
      "source-layer": "buildings",
      "paint": {"fill-color": "#e0d8d0"}
    },
    {
      "id": "landuse",
      "type": "fill",
      "source": "offline",
      "source-layer": "landuse",
      "paint": {"fill-color": "#d8e8c8"}
    }
  ]
}
''';
  }
}
