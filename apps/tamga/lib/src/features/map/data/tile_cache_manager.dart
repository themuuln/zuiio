import 'dart:io';
import 'dart:math';

import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

/// Manages a local tile cache for areas beyond the bundled Mongolia PMTiles.
///
/// Caches individual vector tiles (.mvt) keyed by z/x/y coordinates.
/// Enforces a configurable storage limit (~500 MB) with LRU-style eviction.
/// Falls back gracefully when tiles are unavailable (no crash).
class TileCacheManager {
  // ── Constants ──────────────────────────────────────────────────────

  /// Subdirectory name within the app documents directory for tile cache.
  static const _cacheDirName = 'tile_cache';

  /// Default soft storage limit (500 MB).
  static const _defaultMaxCacheSizeBytes = 500 * 1024 * 1024; // 500 MB

  /// Protomaps R2 tile URL template for downloading individual tiles.
  /// Uses the v4 basemap which matches the bundled PMTiles layers.
  static const _protomapsTileUrl =
      'https://r2-public.protomaps.com/protomaps-basemaps/protomaps-basemap-v4-0-0.pmtiles';

  // ── Fields ─────────────────────────────────────────────────────────

  final int maxCacheSizeBytes;

  // ── Constructor ────────────────────────────────────────────────────

  TileCacheManager({this.maxCacheSizeBytes = _defaultMaxCacheSizeBytes});

  // ── Public API ─────────────────────────────────────────────────────

  /// Returns the path to the tile cache directory.
  Future<Directory> get cacheDirectory async {
    final appDir = await getApplicationDocumentsDirectory();
    final cacheDir = Directory(p.join(appDir.path, _cacheDirName));
    if (!await cacheDir.exists()) {
      await cacheDir.create(recursive: true);
    }
    return cacheDir;
  }

  /// Returns the path for a cached tile file at the given coordinates.
  Future<String> _tilePath(int z, int x, int y) async {
    final cacheDir = await cacheDirectory;
    return p.join(cacheDir.path, '$z', '$x', '$y.mvt');
  }

  /// Returns the cached tile file for the given coordinates, if it exists.
  Future<File?> getCachedTile(int z, int x, int y) async {
    final path = await _tilePath(z, x, y);
    final file = File(path);
    if (await file.exists()) {
      // Touch the file's modification time to indicate recent use (LRU).
      await file.setLastModified(DateTime.now());
      return file;
    }
    return null;
  }

  /// Caches tile data at the given coordinates.
  ///
  /// Creates parent directories as needed. After writing, checks cache size
  /// and evicts LRU entries if the soft limit is exceeded.
  Future<void> cacheTile(int z, int x, int y, List<int> data) async {
    final path = await _tilePath(z, x, y);
    final file = File(path);

    // Ensure parent directory exists
    await file.parent.create(recursive: true);

    // Write tile data
    await file.writeAsBytes(data);

    // Enforce cache size limit
    await _enforceCacheSizeLimit();
  }

  /// Returns the total size of the tile cache in bytes.
  Future<int> get cacheSizeBytes async {
    final cacheDir = await cacheDirectory;
    return _directorySize(cacheDir);
  }

  /// Returns the number of cached tiles.
  Future<int> get cachedTileCount async {
    final cacheDir = await cacheDirectory;
    if (!await cacheDir.exists()) return 0;
    try {
      final files = await cacheDir
          .list(recursive: true)
          .where((entity) => entity is File && entity.path.endsWith('.mvt'))
          .toList();
      return files.length;
    } catch (_) {
      return 0;
    }
  }

  /// Whether the cache has exceeded the soft limit.
  Future<bool> get isCacheFull async {
    final size = await cacheSizeBytes;
    return size >= maxCacheSizeBytes;
  }

  /// Clears all cached tiles.
  Future<void> clearCache() async {
    final cacheDir = await cacheDirectory;
    if (await cacheDir.exists()) {
      await cacheDir.delete(recursive: true);
      await cacheDir.create(recursive: true);
    }
  }

  /// Removes cached tiles for areas within the bundled Mongolia PMTiles
  /// bounding box to avoid duplicating bundled data.
  Future<void> pruneBundledArea() async {
    // Mongolia bounding box (matches the PMTiles bounds)
    const minLon = 87.3;
    const minLat = 41.5;
    const maxLon = 120.0;
    const maxLat = 52.5;

    final cacheDir = await cacheDirectory;
    if (!await cacheDir.exists()) return;

    try {
      await for (final entity in cacheDir.list(recursive: true)) {
        if (entity is File && entity.path.endsWith('.mvt')) {
          // Parse z/x/y from path: .../tile_cache/{z}/{x}/{y}.mvt
          final parts = entity.path.replaceAll('\\', '/').split('/');
          if (parts.length >= 3) {
            final z = int.tryParse(parts[parts.length - 3]);
            final x = int.tryParse(parts[parts.length - 2]);
            final y = parts[parts.length - 1].replaceAll('.mvt', '');
            final yInt = int.tryParse(y);

            if (z != null && x != null && yInt != null) {
              // Convert tile coords to lat/lng to check if inside Mongolia bbox
              final tileLon1 = _tile2lon(x, z);
              final tileLat1 = _tile2lat(yInt, z);
              final tileLon2 = _tile2lon(x + 1, z);
              final tileLat2 = _tile2lat(yInt + 1, z);

              // If tile overlaps Mongolia bbox, skip it (it's bundled)
              if (_rectanglesOverlap(
                tileLon1,
                tileLat1,
                tileLon2,
                tileLat2,
                minLon,
                minLat,
                maxLon,
                maxLat,
              )) {
                await entity.delete();
              }
            }
          }
        }
      }
    } catch (_) {
      // Best-effort prune; ignore errors
    }
  }

  // ── Cache Limits & Eviction ────────────────────────────────────────

  /// Enforces the cache size soft limit by evicting LRU tiles.
  ///
  /// Tiles are sorted by last-modified time (ascending) and the oldest
  /// are deleted until total size is under the limit.
  Future<void> _enforceCacheSizeLimit() async {
    final currentSize = await cacheSizeBytes;
    if (currentSize <= maxCacheSizeBytes) return;

    final excess = currentSize - maxCacheSizeBytes;
    final cacheDir = await cacheDirectory;
    if (!await cacheDir.exists()) return;

    try {
      // Collect all cached tile files with their last-modified time
      final tileFiles = <File>[];
      await for (final entity in cacheDir.list(recursive: true)) {
        if (entity is File && entity.path.endsWith('.mvt')) {
          tileFiles.add(entity);
        }
      }

      // Sort by last modified (oldest first) for LRU eviction
      tileFiles.sort((a, b) {
        final aTime = a.lastModifiedSync();
        final bTime = b.lastModifiedSync();
        return aTime.compareTo(bTime);
      });

      // Delete oldest files until under limit
      var freed = 0;
      for (final file in tileFiles) {
        if (freed >= excess) break;
        freed += await file.length();
        await file.delete();
      }
    } catch (_) {
      // Best-effort eviction; ignore errors
    }
  }

  /// Computes the total size of a directory recursively.
  Future<int> _directorySize(Directory dir) async {
    if (!await dir.exists()) return 0;
    try {
      var total = 0;
      await for (final entity in dir.list(recursive: true)) {
        if (entity is File) {
          total += await entity.length();
        }
      }
      return total;
    } catch (_) {
      return 0;
    }
  }

  // ── Coordinate Helpers ─────────────────────────────────────────────

  /// Convert tile X coordinate to longitude at given zoom.
  static double _tile2lon(int x, int z) {
    return (x / (1 << z)) * 360.0 - 180.0;
  }

  /// Convert tile Y coordinate to latitude at given zoom.
  static double _tile2lat(int y, int z) {
    final n = pi - 2.0 * pi * y / (1 << z);
    return 180.0 / pi * atan(0.5 * (exp(n) - exp(-n)));
  }

  /// Whether two bounding rectangles overlap.
  ///
  /// Handles tile Y coordinates that decrease (north→south) by normalizing
  /// latitude ordering before checking.
  static bool _rectanglesOverlap(
    double ax1,
    double ay1,
    double ax2,
    double ay2,
    double bx1,
    double by1,
    double bx2,
    double by2,
  ) {
    // Normalize latitude ordering — tile Y goes north→south so ay1 may be > ay2.
    final aLatMin = min(ay1, ay2);
    final aLatMax = max(ay1, ay2);
    final bLatMin = min(by1, by2);
    final bLatMax = max(by1, by2);
    return ax1 < bx2 && ax2 > bx1 && aLatMin < bLatMax && aLatMax > bLatMin;
  }

  // ── Download Helper ────────────────────────────────────────────────

  /// Downloads a tile from the Protomaps R2 URL and caches it.
  ///
  /// Returns the cached file if successful, or null if the download fails.
  Future<File?> downloadAndCacheTile(int z, int x, int y) async {
    // Check cache first
    final cached = await getCachedTile(z, x, y);
    if (cached != null) return cached;

    // Try downloading from Protomaps R2
    final http = _createHttpClient();
    try {
      // The Protomaps basemap serves tiles via ZXY endpoint on Cloudflare R2
      final tileUrl = '$_protomapsTileUrl/$z/$x/$y.mvt';
      final request = await http.getUrl(Uri.parse(tileUrl));
      final response = await request.close();

      if (response.statusCode == 200) {
        final bytes = await response.fold<List<int>>(
          [],
          (prev, chunk) => prev..addAll(chunk),
        );

        if (bytes.isNotEmpty) {
          await cacheTile(z, x, y, bytes);
          return File(await _tilePath(z, x, y));
        }
      }

      return null;
    } catch (_) {
      // Download failed — return null for graceful fallback
      return null;
    } finally {
      http.close(force: true);
    }
  }

  /// Creates an HTTP client for tile downloads.
  /// Uses dart:io HttpClient to avoid adding http package dependency.
  HttpClient _createHttpClient() {
    return HttpClient()
      ..userAgent = 'Tamga/1.0'
      ..connectionTimeout = const Duration(seconds: 10);
  }
}
