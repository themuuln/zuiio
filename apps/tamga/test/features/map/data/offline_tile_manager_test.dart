import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/map/data/offline_tile_manager.dart';
import 'package:tamga/src/features/map/data/tile_cache_manager.dart';

/// A mock [AssetBundle] that throws when loading tile assets.
class _MockAssetBundle extends CachingAssetBundle {
  @override
  Future<ByteData> load(String key) async {
    if (key.contains('assets/tiles/')) {
      throw Exception('Mock asset not found: $key');
    }
    return ByteData(0);
  }
}

/// Sets up a mock path_provider for testing.
Future<String> setupTestPathProvider() async {
  TestWidgetsFlutterBinding.ensureInitialized();

  final tempDir = Directory.systemTemp.createTempSync(
    'tamga_offline_tile_test_',
  );

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

/// Creates a mock asset bundle that throws on tile assets.
AssetBundle createMockAssetBundle() => _MockAssetBundle();

void main() {
  late String tempPath;

  setUp(() async {
    tempPath = await setupTestPathProvider();
  });

  tearDown(() async {
    final tempDir = Directory(tempPath);
    if (await tempDir.exists()) {
      await tempDir.delete(recursive: true);
    }
  });

  group('OfflineTileManager with bundled PMTiles', () {
    late OfflineTileManager manager;

    setUp(() async {
      // Create a fake PMTiles file directly in the documents directory
      final appDir = Directory(tempPath);
      final pmtilesPath = '${appDir.path}/mongolia.pmtiles';
      await File(pmtilesPath).writeAsBytes(
        List<int>.generate(
          700,
          (i) => [0x50, 0x4D, 0x54, 0x69, 0x6C, 0x65, 0x73][i % 7],
        ),
      );

      manager = OfflineTileManager(
        tileCache: TileCacheManager(maxCacheSizeBytes: 100 * 1024),
        assetBundle: _MockAssetBundle(),
      );
    });

    test('hasOfflineTiles returns true', () async {
      expect(await manager.hasOfflineTiles, true);
    });

    test('getOfflineTilesPath returns PMTiles path', () async {
      final path = await manager.getOfflineTilesPath();
      expect(path, isNotNull);
      expect(path, contains('mongolia.pmtiles'));
    });

    test('getPmtilesPath returns existing local file', () async {
      final path = await manager.getPmtilesPath();
      expect(path, isNotNull);
      expect(File(path!).existsSync(), true);
    });

    test('getStyleJson returns PMTiles style JSON', () async {
      final style = await manager.getStyleJson();
      expect(style, contains('pmtiles://'));
      expect(style, contains('Tamga Offline (PMTiles)'));
      expect(style, contains('"earth"'));
      expect(style, contains('"water"'));
      expect(style, contains('"roads"'));
      expect(style, contains('"buildings"'));
      expect(style, contains('"landuse"'));
    });

    test('getTileSourceUrl returns pmtiles:// URL', () async {
      final url = await manager.getTileSourceUrl();
      expect(url, startsWith('pmtiles://'));
      expect(url, contains('mongolia.pmtiles'));
    });
  });

  group('OfflineTileManager with bundled MBTiles (no PMTiles)', () {
    late OfflineTileManager manager;

    setUp(() async {
      // Create only MBTiles file
      final appDir = Directory(tempPath);
      final mbtilesPath = '${appDir.path}/mongolia.mbtiles';
      await File(
        mbtilesPath,
      ).writeAsBytes(List<int>.generate(300, (i) => [0x00, 0x01, 0x02][i % 3]));

      manager = OfflineTileManager(
        tileCache: TileCacheManager(maxCacheSizeBytes: 100 * 1024),
        assetBundle: _MockAssetBundle(),
      );
    });

    test('hasOfflineTiles returns true', () async {
      expect(await manager.hasOfflineTiles, true);
    });

    test('getOfflineTilesPath returns MBTiles when no PMTiles', () async {
      // The mocked asset bundle prevents PMTiles from being copied
      final path = await manager.getOfflineTilesPath();
      expect(path, isNotNull);
      expect(path, contains('mongolia.mbtiles'));
    });

    test('getMbtilesPath returns the file', () async {
      final path = await manager.getMbtilesPath();
      expect(path, isNotNull);
      expect(File(path!).existsSync(), true);
    });

    test('getStyleJson returns MBTiles style', () async {
      final style = await manager.getStyleJson();
      expect(style, contains('mbtiles://'));
      expect(style, contains('Tamga Offline'));
    });

    test('getTileSourceUrl returns mbtiles:// URL', () async {
      final url = await manager.getTileSourceUrl();
      expect(url, startsWith('mbtiles://'));
      expect(url, contains('mongolia.mbtiles'));
    });
  });

  group('OfflineTileManager with no bundled tiles', () {
    late OfflineTileManager manager;

    setUp(() {
      manager = OfflineTileManager(
        tileCache: TileCacheManager(maxCacheSizeBytes: 100 * 1024),
        assetBundle: _MockAssetBundle(),
      );
    });

    test('getOfflineTilesPath returns null', () async {
      final path = await manager.getOfflineTilesPath();
      expect(path, isNull);
    });

    test('getPmtilesPath returns null when no local file', () async {
      final path = await manager.getPmtilesPath();
      expect(path, isNull);
    });

    test('getStyleJson returns fallback URL when no tiles', () async {
      final style = await manager.getStyleJson();
      expect(style, 'https://tiles.openfreemap.org/styles/liberty');
    });

    test('getTileSourceUrl returns fallback URL', () async {
      final url = await manager.getTileSourceUrl();
      expect(url, 'https://tiles.openfreemap.org/styles/liberty');
    });

    test('hasOfflineTiles returns false', () async {
      expect(await manager.hasOfflineTiles, false);
    });

    test('installPmtiles returns false for non-existent source', () async {
      final result = await manager.installPmtiles(
        '/nonexistent/source.pmtiles',
      );
      expect(result, false);
    });
  });

  group('TileCacheManager integration', () {
    late OfflineTileManager manager;

    setUp(() {
      manager = OfflineTileManager(
        tileCache: TileCacheManager(maxCacheSizeBytes: 100 * 1024),
        assetBundle: _MockAssetBundle(),
      );
    });

    test('tileCache is accessible', () {
      expect(manager.tileCache, isA<TileCacheManager>());
    });

    test('cachedTileCount and tileCacheSizeBytes work', () async {
      await manager.tileCache.cacheTile(5, 10, 15, List.filled(100, 0x01));
      expect(await manager.cachedTileCount, 1);
      expect(await manager.tileCacheSizeBytes, greaterThan(0));
    });

    test('clearTileCache removes all cached tiles', () async {
      await manager.tileCache.cacheTile(5, 5, 5, [0x01]);
      expect(await manager.cachedTileCount, 1);
      await manager.clearTileCache();
      expect(await manager.cachedTileCount, 0);
    });

    test('downloadAndCacheTile returns null when offline', () async {
      final result = await manager.downloadAndCacheTile(0, 0, 0);
      expect(result, isNull);
    });

    test('hasOfflineTiles returns true when cache has entries', () async {
      await manager.tileCache.cacheTile(0, 0, 0, [0x01, 0x02]);
      expect(await manager.hasOfflineTiles, true);
    });
  });

  group('OfflineTileManager constants', () {
    test('estimatedSizeMb is 150', () {
      expect(OfflineTileManager.estimatedSizeMb, 150);
    });

    test('manager can be created without assetBundle override', () {
      final manager = OfflineTileManager(
        tileCache: TileCacheManager(maxCacheSizeBytes: 100 * 1024),
      );
      expect(manager, isNotNull);
    });
  });
}
