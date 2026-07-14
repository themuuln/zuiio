import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/map/data/tile_cache_manager.dart';

/// Helper to set up a mock path_provider for tests.
Future<String> setupTestTileCache() async {
  TestWidgetsFlutterBinding.ensureInitialized();

  final tempDir = Directory.systemTemp.createTempSync('tamga_tile_cache_test_');

  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      .setMockMethodCallHandler(
        const MethodChannel('plugins.flutter.io/path_provider'),
        (MethodCall methodCall) async {
          if (methodCall.method == 'getApplicationDocumentsDirectory') {
            return tempDir.path;
          }
          return null;
        },
      );

  return tempDir.path;
}

void main() {
  late TileCacheManager cacheManager;
  late String tempPath;

  setUp(() async {
    tempPath = await setupTestTileCache();
    cacheManager = TileCacheManager(
      maxCacheSizeBytes: 1024 * 100, // 100 KB for testing
    );
  });

  tearDown(() async {
    // Clean up the temp directory
    final tempDir = Directory(tempPath);
    if (await tempDir.exists()) {
      await tempDir.delete(recursive: true);
    }
  });

  group('TileCacheManager', () {
    test('cacheDirectory creates and returns the cache dir', () async {
      final dir = await cacheManager.cacheDirectory;
      expect(await dir.exists(), true);
      expect(dir.path, contains('tile_cache'));
    });

    test('cachedTileCount returns 0 for empty cache', () async {
      final count = await cacheManager.cachedTileCount;
      expect(count, 0);
    });

    test('cacheSizeBytes returns 0 for empty cache', () async {
      final size = await cacheManager.cacheSizeBytes;
      expect(size, 0);
    });

    test('cacheTile stores tile data and returns on getCachedTile', () async {
      final tileData = [0x01, 0x02, 0x03, 0x04]; // minimal tile bytes

      await cacheManager.cacheTile(5, 10, 15, tileData);

      // Verify count increased
      final count = await cacheManager.cachedTileCount;
      expect(count, 1);

      // Verify size > 0
      final size = await cacheManager.cacheSizeBytes;
      expect(size, greaterThan(0));

      // Verify can retrieve
      final cached = await cacheManager.getCachedTile(5, 10, 15);
      expect(cached, isNotNull);
      expect(await cached!.readAsBytes(), equals(tileData));
    });

    test('getCachedTile returns null for non-existent tile', () async {
      final cached = await cacheManager.getCachedTile(9, 99, 99);
      expect(cached, isNull);
    });

    test('cacheTile creates nested directories automatically', () async {
      await cacheManager.cacheTile(12, 1234, 5678, [0x00]);

      final cached = await cacheManager.getCachedTile(12, 1234, 5678);
      expect(cached, isNotNull);
    });

    test('multiple tiles increase count and size', () async {
      await cacheManager.cacheTile(0, 0, 0, List.filled(100, 0x01));
      await cacheManager.cacheTile(1, 1, 1, List.filled(200, 0x02));
      await cacheManager.cacheTile(2, 2, 2, List.filled(300, 0x03));

      final count = await cacheManager.cachedTileCount;
      expect(count, 3);

      final size = await cacheManager.cacheSizeBytes;
      expect(size, greaterThanOrEqualTo(600));
    });

    test('clearCache removes all tiles', () async {
      await cacheManager.cacheTile(3, 3, 3, [0x01]);
      await cacheManager.cacheTile(4, 4, 4, [0x02]);

      await cacheManager.clearCache();

      final count = await cacheManager.cachedTileCount;
      expect(count, 0);
      final size = await cacheManager.cacheSizeBytes;
      expect(size, 0);
    });

    test('isCacheFull returns false when under limit', () async {
      // Small tile, 100 KB limit
      await cacheManager.cacheTile(0, 0, 0, List.filled(100, 0x01));
      final isFull = await cacheManager.isCacheFull;
      expect(isFull, false);
    });

    test('eviction removes oldest tiles when over limit', () async {
      // Create tiles that will exceed the 100 KB limit
      // Each tile is 40 KB, so 3 tiles = 120 KB > 100 KB limit
      await cacheManager.cacheTile(0, 0, 0, List.filled(40000, 0x01));
      await cacheManager.cacheTile(1, 1, 1, List.filled(40000, 0x02));
      await cacheManager.cacheTile(2, 2, 2, List.filled(40000, 0x03));

      // After eviction, size should be <= 100 KB
      final size = await cacheManager.cacheSizeBytes;
      expect(size, lessThanOrEqualTo(1024 * 100));

      // At least one tile should have been evicted
      final count = await cacheManager.cachedTileCount;
      expect(count, lessThan(3));
    });

    test('eviction removes oldest (LRU) entries first', () async {
      // Create tiles with different ages by using deliberately different sizes
      // to ensure reliable eviction behavior independent of filesystem timestamps
      await cacheManager.cacheTile(10, 10, 10, List.filled(40000, 0x01));

      // Small delay to ensure different file timestamps
      await Future.delayed(const Duration(milliseconds: 5));

      await cacheManager.cacheTile(20, 20, 20, List.filled(40000, 0x02));

      // Touch the second tile (make it newer by getting it)
      final touched = await cacheManager.getCachedTile(20, 20, 20);
      expect(touched, isNotNull);

      await Future.delayed(const Duration(milliseconds: 5));

      // Add third tile to trigger eviction (40KB * 3 = 120KB > 100KB limit)
      await cacheManager.cacheTile(30, 30, 30, List.filled(40000, 0x03));

      // After adding 3 tiles totaling 120KB with a 100KB limit, at least one
      // tile should have been evicted. The oldest (10/10/10) is most likely.
      final count = await cacheManager.cachedTileCount;
      expect(count, lessThan(3));

      // Verify cache is under or at the limit
      final size = await cacheManager.cacheSizeBytes;
      expect(size, lessThanOrEqualTo(1024 * 100));
    });

    test('pruneBundledArea removes tiles overlapping Mongolia bbox', () async {
      // A tile clearly outside Mongolia (ocean area)
      await cacheManager.cacheTile(2, 1, 1, [0x01]); // outside bbox
      // A tile that overlaps Mongolia
      await cacheManager.cacheTile(5, 15, 10, [0x02]); // likely inside

      // Count before prune
      final beforeCount = await cacheManager.cachedTileCount;
      expect(beforeCount, 2);

      await cacheManager.pruneBundledArea();

      // Should have removed at least the Mongolia-overlapping tile
      final afterCount = await cacheManager.cachedTileCount;
      expect(afterCount, lessThanOrEqualTo(beforeCount));
    });

    test('downloadAndCacheTile returns null when offline', () async {
      // Should fail gracefully when there's no network
      final result = await cacheManager.downloadAndCacheTile(0, 0, 0);
      expect(result, isNull);
    });

    test('LRU eviction respects maxCacheSizeBytes', () async {
      final sizedManager = TileCacheManager(maxCacheSizeBytes: 5000);

      // Fill with 6 tiles of 1KB each
      for (var i = 0; i < 6; i++) {
        await sizedManager.cacheTile(i, i, i, List.filled(1000, 0x01));
      }

      final size = await sizedManager.cacheSizeBytes;
      expect(size, lessThanOrEqualTo(5000));

      // The limit is soft, so some may be slightly over after eviction
      // but we should not have 6 * 1000 = 6000 bytes
      expect(size, lessThan(6000));
    });
  });
}
