import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/storage/isar_database.dart';
import 'package:tamga/src/features/map/data/local_map_repository.dart';
import 'package:tamga/src/features/map/data/map_repository.dart';
import 'package:tamga/src/features/map/domain/geofence_alert.dart';
import 'package:tamga/src/features/map/domain/horse_location.dart';
import 'package:tamga/src/features/map/domain/lost_horse_report.dart';
import 'package:tamga/src/features/map/domain/map_enums.dart';
import 'package:tamga/src/features/map/domain/search_area.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';

import '../../../helpers/test_helpers.dart';

void main() {
  late LocalMapRepository repository;

  setUp(() async {
    await setupTestEnvironment();
    await IsarDatabase.initialize();
    repository = LocalMapRepository(storage: IsarStorage.instance);
  });

  tearDown(() async {
    await IsarDatabase.close();
  });

  // ── Horse Locations ───────────────────────────────────────────────

  group('Horse Locations', () {
    test('implements MapRepository', () {
      expect(repository, isA<MapRepository>());
    });

    test('updateHorseLocation writes to Isar and returns Result.ok', () async {
      final location = HorseLocation(
        horseId: 'h1',
        horseName: 'Зүүлдэр',
        ownerId: 'o1',
        ownerName: 'Тэмүүлэн',
        lat: 47.9,
        lng: 106.9,
        lastUpdated: DateTime(2026),
        isVisible: true,
        coatColor: 'brow',
      );

      final result = await repository.updateHorseLocation(location);
      expect(result.isSuccess, true);
    });

    test(
      'getNearbyHorses returns horses within radius sorted by distance',
      () async {
        // Insert horses at known distances from (47.9, 106.9)
        final centerLat = 47.9;
        final centerLng = 106.9;
        const radiusKm = 100.0;

        // ~0km away (same point)
        await repository.updateHorseLocation(
          HorseLocation(
            horseId: 'h-close',
            horseName: 'Ойр',
            ownerId: 'o1',
            ownerName: 'Owner',
            lat: centerLat,
            lng: centerLng,
            lastUpdated: DateTime(2026),
            isVisible: true,
          ),
        );

        // ~55km away (0.5° latitude difference ≈ 55km)
        await repository.updateHorseLocation(
          HorseLocation(
            horseId: 'h-mid',
            horseName: 'Дунд',
            ownerId: 'o1',
            ownerName: 'Owner',
            lat: 47.4,
            lng: centerLng,
            lastUpdated: DateTime(2026),
            isVisible: true,
          ),
        );

        // ~111km away (1° latitude difference ≈ 111km) — outside 100km radius
        await repository.updateHorseLocation(
          HorseLocation(
            horseId: 'h-far',
            horseName: 'Хол',
            ownerId: 'o1',
            ownerName: 'Owner',
            lat: 46.9,
            lng: centerLng,
            lastUpdated: DateTime(2026),
            isVisible: true,
          ),
        );

        // Non-visible horse — should be excluded
        await repository.updateHorseLocation(
          HorseLocation(
            horseId: 'h-hidden',
            horseName: 'Нууц',
            ownerId: 'o1',
            ownerName: 'Owner',
            lat: centerLat,
            lng: centerLng,
            lastUpdated: DateTime(2026),
            isVisible: false,
          ),
        );

        final result = await repository.getNearbyHorses(
          centerLat,
          centerLng,
          radiusKm,
        );

        expect(result.isSuccess, true);
        final horses = result.value;

        // Should return 2 horses (close and mid), exclude far and hidden
        expect(horses.length, 2);

        // Both should be within radius
        expect(horses.any((h) => h.horseId == 'h-close'), true);
        expect(horses.any((h) => h.horseId == 'h-mid'), true);

        // Should be sorted by distance (closest first)
        expect(horses.first.horseId, 'h-close');
      },
    );

    test('getNearbyHorses returns empty list when no visible horses', () async {
      // Insert only non-visible horse
      await repository.updateHorseLocation(
        HorseLocation(
          horseId: 'h-hidden',
          horseName: 'Нууц',
          ownerId: 'o1',
          ownerName: 'Owner',
          lat: 47.9,
          lng: 106.9,
          lastUpdated: DateTime(2026),
          isVisible: false,
        ),
      );

      final result = await repository.getNearbyHorses(47.9, 106.9, 10.0);
      expect(result.isSuccess, true);
      expect(result.value, isEmpty);
    });

    test('getNearbyHorses returns empty list when database empty', () async {
      final result = await repository.getNearbyHorses(47.9, 106.9, 10.0);
      expect(result.isSuccess, true);
      expect(result.value, isEmpty);
    });
  });

  // ── Lost Horse Reports ────────────────────────────────────────────

  group('Lost Horse Reports', () {
    test('reportLostHorse writes to Isar and returns Result.ok', () async {
      final report = LostHorseReport(
        id: 'r1',
        horseId: 'h1',
        ownerId: 'o1',
        horseName: 'Сайн морь',
        description: 'Хаягдсан',
        lastSeenLat: 47.9,
        lastSeenLng: 106.9,
        lastSeenAt: DateTime(2026, 6, 1),
        searchRadiusKm: 10.0,
        status: LostHorseStatus.active,
        createdAt: DateTime(2026, 6, 1),
        updatedAt: DateTime(2026, 6, 1),
      );

      final result = await repository.reportLostHorse(report);
      expect(result.isSuccess, true);
      expect(result.value.id, 'r1');
    });

    test('getActiveLostHorses returns only active reports', () async {
      // Create active report
      await repository.reportLostHorse(
        LostHorseReport(
          id: 'r-active',
          horseId: 'h1',
          ownerId: 'o1',
          horseName: 'Идэвхтэй',
          lastSeenLat: 47.9,
          lastSeenLng: 106.9,
          lastSeenAt: DateTime(2026),
          createdAt: DateTime(2026, 6, 1),
          updatedAt: DateTime(2026, 6, 1),
        ),
      );

      // Create found report
      await repository.reportLostHorse(
        LostHorseReport(
          id: 'r-found',
          horseId: 'h2',
          ownerId: 'o1',
          horseName: 'Олдсон',
          lastSeenLat: 47.9,
          lastSeenLng: 106.9,
          lastSeenAt: DateTime(2026),
          status: LostHorseStatus.found,
          createdAt: DateTime(2026, 6, 2),
          updatedAt: DateTime(2026, 6, 2),
        ),
      );

      final result = await repository.getActiveLostHorses();
      expect(result.isSuccess, true);
      expect(result.value.length, 1);
      expect(result.value.first.id, 'r-active');
    });

    test('getMyLostReports returns reports for specific owner', () async {
      await repository.reportLostHorse(
        LostHorseReport(
          id: 'r-my',
          horseId: 'h1',
          ownerId: 'my-owner',
          horseName: 'Миний',
          lastSeenLat: 47.9,
          lastSeenLng: 106.9,
          lastSeenAt: DateTime(2026),
          createdAt: DateTime(2026),
          updatedAt: DateTime(2026),
        ),
      );

      await repository.reportLostHorse(
        LostHorseReport(
          id: 'r-other',
          horseId: 'h2',
          ownerId: 'other-owner',
          horseName: 'Бусдын',
          lastSeenLat: 47.9,
          lastSeenLng: 106.9,
          lastSeenAt: DateTime(2026),
          createdAt: DateTime(2026),
          updatedAt: DateTime(2026),
        ),
      );

      final result = await repository.getMyLostReports('my-owner');
      expect(result.isSuccess, true);
      expect(result.value.length, 1);
      expect(result.value.first.id, 'r-my');
    });

    test(
      'updateLostHorseStatus changes status and returns Result.ok',
      () async {
        await repository.reportLostHorse(
          LostHorseReport(
            id: 'r-update',
            horseId: 'h1',
            ownerId: 'o1',
            horseName: 'Шинэчлэх',
            lastSeenLat: 47.9,
            lastSeenLng: 106.9,
            lastSeenAt: DateTime(2026),
            createdAt: DateTime(2026),
            updatedAt: DateTime(2026),
          ),
        );

        final updateResult = await repository.updateLostHorseStatus(
          'r-update',
          'found',
        );
        expect(updateResult.isSuccess, true);

        // Verify the status changed
        final activeResult = await repository.getActiveLostHorses();
        expect(activeResult.value.where((r) => r.id == 'r-update'), isEmpty);
      },
    );

    test('getActiveLostHorses returns newest first', () async {
      await repository.reportLostHorse(
        LostHorseReport(
          id: 'r-old',
          horseId: 'h1',
          ownerId: 'o1',
          horseName: 'Хуучин',
          lastSeenLat: 47.9,
          lastSeenLng: 106.9,
          lastSeenAt: DateTime(2026),
          createdAt: DateTime(2026, 6, 1),
          updatedAt: DateTime(2026, 6, 1),
        ),
      );

      await repository.reportLostHorse(
        LostHorseReport(
          id: 'r-new',
          horseId: 'h2',
          ownerId: 'o1',
          horseName: 'Шинэ',
          lastSeenLat: 47.9,
          lastSeenLng: 106.9,
          lastSeenAt: DateTime(2026),
          createdAt: DateTime(2026, 6, 10),
          updatedAt: DateTime(2026, 6, 10),
        ),
      );

      final result = await repository.getActiveLostHorses();
      expect(result.isSuccess, true);
      expect(result.value.first.id, 'r-new'); // newest first
    });

    test('reportLostHorse returns fail when Isar fails', () async {
      // Close Isar to simulate failure
      await IsarDatabase.close();

      final report = LostHorseReport(
        id: 'r-fail',
        horseId: 'h1',
        ownerId: 'o1',
        horseName: 'Алдаа',
        lastSeenLat: 47.9,
        lastSeenLng: 106.9,
        lastSeenAt: DateTime(2026),
        createdAt: DateTime(2026),
        updatedAt: DateTime(2026),
      );

      final result = await repository.reportLostHorse(report);
      expect(result.isFailure, true);

      // Re-open for tearDown
      await IsarDatabase.initialize();
    });

    test('report with photoUrls survives save and load round-trip', () async {
      final report = LostHorseReport(
        id: 'r-media',
        horseId: 'h1',
        ownerId: 'o1',
        horseName: 'Зурагтай морь',
        lastSeenLat: 47.9,
        lastSeenLng: 106.9,
        lastSeenAt: DateTime(2026, 6, 15),
        createdAt: DateTime(2026, 6, 15),
        updatedAt: DateTime(2026, 6, 15),
        photoUrls: [
          'https://example.com/photo1.jpg',
          'https://example.com/photo2.jpg',
        ],
        videoUrls: [
          'https://example.com/video1.mp4',
        ],
      );

      final saveResult = await repository.reportLostHorse(report);
      expect(saveResult.isSuccess, true);

      // Fetch active reports and verify media URLs preserved
      final fetchResult = await repository.getMyLostReports('o1');
      expect(fetchResult.isSuccess, true);

      final saved = fetchResult.value.firstWhere((r) => r.id == 'r-media');
      expect(saved.photoUrls, [
        'https://example.com/photo1.jpg',
        'https://example.com/photo2.jpg',
      ]);
      expect(saved.videoUrls, ['https://example.com/video1.mp4']);
    });
  });

  // ── Search Areas ──────────────────────────────────────────────────

  group('Search Areas', () {
    test('saveSearchArea writes to Isar and returns Result.ok', () async {
      final area = SearchArea(
        id: 'a1',
        name: 'Гэрийн ойролцоо',
        centerLat: 47.9,
        centerLng: 106.9,
        radiusKm: 5.0,
        color: 0xFFF06A2E,
        isActive: true,
        createdBy: 'o1',
        createdAt: DateTime(2026),
      );

      final result = await repository.saveSearchArea(area);
      expect(result.isSuccess, true);
      expect(result.value.id, 'a1');
    });

    test('getSearchAreas returns areas for specific user', () async {
      await repository.saveSearchArea(
        SearchArea(
          id: 'a1',
          name: 'Миний талбай',
          centerLat: 47.9,
          centerLng: 106.9,
          radiusKm: 5.0,
          createdBy: 'my-user',
          createdAt: DateTime(2026),
        ),
      );

      await repository.saveSearchArea(
        SearchArea(
          id: 'a2',
          name: 'Бусдын талбай',
          centerLat: 48.0,
          centerLng: 107.0,
          radiusKm: 3.0,
          createdBy: 'other-user',
          createdAt: DateTime(2026),
        ),
      );

      final result = await repository.getSearchAreas('my-user');
      expect(result.isSuccess, true);
      expect(result.value.length, 1);
      expect(result.value.first.id, 'a1');
    });

    test('deleteSearchArea removes area and returns Result.ok', () async {
      await repository.saveSearchArea(
        SearchArea(
          id: 'a-delete',
          name: 'Устгах',
          centerLat: 47.9,
          centerLng: 106.9,
          radiusKm: 5.0,
          createdBy: 'o1',
          createdAt: DateTime(2026),
        ),
      );

      final deleteResult = await repository.deleteSearchArea('a-delete');
      expect(deleteResult.isSuccess, true);

      // Verify deletion
      final areasResult = await repository.getSearchAreas('o1');
      expect(areasResult.value.where((a) => a.id == 'a-delete'), isEmpty);
    });

    test('getSearchAreas returns empty list for user with no areas', () async {
      final result = await repository.getSearchAreas('no-areas-user');
      expect(result.isSuccess, true);
      expect(result.value, isEmpty);
    });
  });

  // ── Geofence Alerts ───────────────────────────────────────────────

  group('Geofence Alerts', () {
    test('saveGeofenceAlert writes to Isar and returns Result.ok', () async {
      final alert = GeofenceAlert(
        id: 'g1',
        horseId: 'h1',
        horseName: 'Алтан',
        geofenceId: 'f1',
        geofenceName: 'Гэр',
        alertType: GeofenceAlertType.entered,
        triggeredAt: DateTime(2026, 6, 1, 10, 0),
        horseLat: 47.9,
        horseLng: 106.9,
      );

      final result = await repository.saveGeofenceAlert(alert);
      expect(result.isSuccess, true);
    });

    test(
      'getGeofenceAlerts returns all alerts sorted by triggeredAt desc',
      () async {
        await repository.saveGeofenceAlert(
          GeofenceAlert(
            id: 'g-old',
            horseId: 'h1',
            horseName: 'Хуучин',
            geofenceId: 'f1',
            geofenceName: 'Гэр',
            alertType: GeofenceAlertType.entered,
            triggeredAt: DateTime(2026, 6, 1, 9, 0),
            horseLat: 47.9,
            horseLng: 106.9,
          ),
        );

        await repository.saveGeofenceAlert(
          GeofenceAlert(
            id: 'g-new',
            horseId: 'h2',
            horseName: 'Шинэ',
            geofenceId: 'f2',
            geofenceName: 'Талбай',
            alertType: GeofenceAlertType.exited,
            triggeredAt: DateTime(2026, 6, 1, 10, 0),
            horseLat: 48.0,
            horseLng: 107.0,
          ),
        );

        final result = await repository.getGeofenceAlerts('o1');
        expect(result.isSuccess, true);
        expect(result.value.length, 2);
        expect(result.value.first.id, 'g-new'); // newest first
      },
    );

    test('acknowledgeAlert marks alert as acknowledged', () async {
      await repository.saveGeofenceAlert(
        GeofenceAlert(
          id: 'g-ack',
          horseId: 'h1',
          horseName: 'Морь',
          geofenceId: 'f1',
          geofenceName: 'Гэр',
          alertType: GeofenceAlertType.entered,
          triggeredAt: DateTime(2026),
          horseLat: 47.9,
          horseLng: 106.9,
          acknowledged: false,
        ),
      );

      final ackResult = await repository.acknowledgeAlert('g-ack');
      expect(ackResult.isSuccess, true);

      // Verify acknowledged
      final alertsResult = await repository.getGeofenceAlerts('o1');
      final alert = alertsResult.value.firstWhere((a) => a.id == 'g-ack');
      expect(alert.acknowledged, true);
    });

    test('getGeofenceAlerts returns empty list when no alerts', () async {
      final result = await repository.getGeofenceAlerts('no-alerts-user');
      expect(result.isSuccess, true);
      expect(result.value, isEmpty);
    });
  });

  // ── Real-time Streams ─────────────────────────────────────────────

  group('Streams', () {
    test('watchActiveLostHorses emits stream of active lost horses', () async {
      // Add a report
      await repository.reportLostHorse(
        LostHorseReport(
          id: 'r-stream',
          horseId: 'h1',
          ownerId: 'o1',
          horseName: 'Морь',
          lastSeenLat: 47.9,
          lastSeenLng: 106.9,
          lastSeenAt: DateTime(2026),
          createdAt: DateTime(2026),
          updatedAt: DateTime(2026),
        ),
      );

      final stream = repository.watchActiveLostHorses();
      expect(stream, isA<Stream<List<LostHorseReport>>>());

      final emitted = await stream.first;
      expect(emitted.length, 1);
      expect(emitted.first.id, 'r-stream');
    });

    test('watchNearbyHorses emits stream of nearby horses', () async {
      await repository.updateHorseLocation(
        HorseLocation(
          horseId: 'h-stream',
          horseName: 'Ойр',
          ownerId: 'o1',
          ownerName: 'Owner',
          lat: 47.9,
          lng: 106.9,
          lastUpdated: DateTime(2026),
          isVisible: true,
        ),
      );

      final stream = repository.watchNearbyHorses(47.9, 106.9, 50.0);
      expect(stream, isA<Stream<List<HorseLocation>>>());

      final emitted = await stream.first;
      expect(emitted.length, 1);
      expect(emitted.first.horseId, 'h-stream');
    });
  });

  // ── Haversine Distance (pure Dart) ───────────────────────────────

  group('Haversine Distance', () {
    test('getNearbyHorses filters using correct Haversine formula', () async {
      // Ulaanbaatar center
      const ubLat = 47.9186;
      const ubLng = 106.9176;

      // Horse at same location
      await repository.updateHorseLocation(
        HorseLocation(
          horseId: 'h-ub',
          horseName: 'Улаанбаатар',
          ownerId: 'o1',
          ownerName: 'Owner',
          lat: ubLat,
          lng: ubLng,
          lastUpdated: DateTime(2026),
          isVisible: true,
        ),
      );

      // Search with 5km radius from UB center
      final result = await repository.getNearbyHorses(ubLat, ubLng, 5.0);
      expect(result.isSuccess, true);
      expect(result.value.length, 1);

      // Search with 1km radius — too small
      final tightResult = await repository.getNearbyHorses(ubLat, ubLng, 1.0);
      expect(tightResult.isSuccess, true);
      expect(tightResult.value.length, 1); // same point, always 0 distance
    });
  });

  // ── Error Handling ─────────────────────────────────────────────────

  group('Error Handling', () {
    test('methods fail gracefully when database not initialized', () async {
      // Close database
      await IsarDatabase.close();

      final reportResult = await repository.getActiveLostHorses();
      expect(reportResult.isFailure, true);

      final locationResult = await repository.getNearbyHorses(0, 0, 1);
      expect(locationResult.isFailure, true);

      final searchResult = await repository.getSearchAreas('test');
      expect(searchResult.isFailure, true);

      final geofenceResult = await repository.getGeofenceAlerts('test');
      expect(geofenceResult.isFailure, true);

      // Re-open for tearDown
      await IsarDatabase.initialize();
    });
  });
}
