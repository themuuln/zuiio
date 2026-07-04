import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/map/data/geofence_service.dart';
import 'package:tamga/src/features/map/domain/search_area.dart';

void main() {
  late GeofenceService service;

  setUp(() {
    service = GeofenceService();
  });

  // ── isInsideCircle ────────────────────────────────────────────────

  group('isInsideCircle', () {
    test('returns true for center point', () {
      expect(
        service.isInsideCircle(
          47.9, // pointLat
          106.9, // pointLng
          47.9, // centerLat
          106.9, // centerLng
          5.0, // radiusKm
        ),
        true,
      );
    });

    test('returns true for point within radius', () {
      // ~1km north of center — inside 5km radius
      expect(service.isInsideCircle(47.91, 106.9, 47.9, 106.9, 5.0), true);
    });

    test('returns false for point outside radius', () {
      // ~11km north of center — outside 1km radius
      expect(service.isInsideCircle(48.0, 106.9, 47.9, 106.9, 1.0), false);
    });

    test('returns true for point very close to edge', () {
      // 0.044 degrees north ≈ 4.9km — inside 5km radius
      expect(
        service.isInsideCircle(47.9 + 0.044, 106.9, 47.9, 106.9, 5.0),
        true,
      );
    });

    test('handles zero radius', () {
      expect(service.isInsideCircle(47.9, 106.9, 47.9, 106.9, 0.0), true);
    });
  });

  // ── distanceToEdge ────────────────────────────────────────────────

  group('distanceToEdge', () {
    test('returns negative value when inside circle', () {
      final distance = service.distanceToEdge(47.9, 106.9, 47.9, 106.9, 5.0);
      expect(distance, lessThan(0));
      // Center point should be -5000m (negative radius)
      expect(distance, closeTo(-5000, 10));
    });

    test('returns positive value when outside circle', () {
      final distance = service.distanceToEdge(48.0, 106.9, 47.9, 106.9, 1.0);
      expect(distance, greaterThan(0));
      // 0.1° latitude ≈ 11.1km, minus 1km radius = ~10.1km
      expect(distance, greaterThan(10000));
    });

    test('returns zero when on edge', () {
      // 0.044° north ≈ 4.9km, should be very close to 0
      final distance = service.distanceToEdge(
        47.9 + 0.044,
        106.9,
        47.9,
        106.9,
        5.0,
      );
      expect(distance, closeTo(-100, 500)); // ~100m inside
    });
  });

  // ── findContainingAreas ───────────────────────────────────────────

  group('findContainingAreas', () {
    test('returns areas that contain the point', () {
      final areas = [
        SearchArea(
          id: 'a1',
          name: 'Nearby',
          centerLat: 47.9,
          centerLng: 106.9,
          radiusKm: 5.0,
          createdBy: 'user1',
          createdAt: DateTime(2026),
        ),
        SearchArea(
          id: 'a2',
          name: 'Far away',
          centerLat: 48.5,
          centerLng: 107.5,
          radiusKm: 1.0,
          createdBy: 'user1',
          createdAt: DateTime(2026),
        ),
      ];

      final result = service.findContainingAreas(47.9, 106.9, areas);
      expect(result.length, 1);
      expect(result.first.id, 'a1');
    });

    test('excludes inactive areas', () {
      final areas = [
        SearchArea(
          id: 'a1',
          name: 'Active',
          centerLat: 47.9,
          centerLng: 106.9,
          radiusKm: 5.0,
          isActive: true,
          createdBy: 'user1',
          createdAt: DateTime(2026),
        ),
        SearchArea(
          id: 'a2',
          name: 'Inactive',
          centerLat: 47.9,
          centerLng: 106.9,
          radiusKm: 5.0,
          isActive: false,
          createdBy: 'user1',
          createdAt: DateTime(2026),
        ),
      ];

      final result = service.findContainingAreas(47.9, 106.9, areas);
      expect(result.length, 1);
      expect(result.first.id, 'a1');
    });

    test('returns empty list when no areas contain point', () {
      final areas = [
        SearchArea(
          id: 'a1',
          name: 'Far away',
          centerLat: 48.5,
          centerLng: 107.5,
          radiusKm: 1.0,
          createdBy: 'user1',
          createdAt: DateTime(2026),
        ),
      ];

      final result = service.findContainingAreas(47.9, 106.9, areas);
      expect(result, isEmpty);
    });
  });

  // ── findExcludedAreas ─────────────────────────────────────────────

  group('findExcludedAreas', () {
    test('returns areas that do NOT contain the point', () {
      final areas = [
        SearchArea(
          id: 'a1',
          name: 'Nearby',
          centerLat: 47.9,
          centerLng: 106.9,
          radiusKm: 5.0,
          createdBy: 'user1',
          createdAt: DateTime(2026),
        ),
        SearchArea(
          id: 'a2',
          name: 'Far away',
          centerLat: 48.5,
          centerLng: 107.5,
          radiusKm: 1.0,
          createdBy: 'user1',
          createdAt: DateTime(2026),
        ),
      ];

      final result = service.findExcludedAreas(47.9, 106.9, areas);
      expect(result.length, 1);
      expect(result.first.id, 'a2');
    });

    test('excludes inactive areas', () {
      final areas = [
        SearchArea(
          id: 'a1',
          name: 'Active',
          centerLat: 47.9,
          centerLng: 106.9,
          radiusKm: 5.0,
          isActive: true,
          createdBy: 'user1',
          createdAt: DateTime(2026),
        ),
        SearchArea(
          id: 'a2',
          name: 'Inactive',
          centerLat: 48.5,
          centerLng: 107.5,
          radiusKm: 1.0,
          isActive: false,
          createdBy: 'user1',
          createdAt: DateTime(2026),
        ),
      ];

      final result = service.findExcludedAreas(47.9, 106.9, areas);
      expect(result, isEmpty);
    });

    test('returns all areas when point is outside all circles', () {
      final areas = [
        SearchArea(
          id: 'a1',
          name: 'Small 1',
          centerLat: 48.5,
          centerLng: 107.5,
          radiusKm: 1.0,
          createdBy: 'user1',
          createdAt: DateTime(2026),
        ),
        SearchArea(
          id: 'a2',
          name: 'Small 2',
          centerLat: 49.0,
          centerLng: 108.0,
          radiusKm: 1.0,
          createdBy: 'user1',
          createdAt: DateTime(2026),
        ),
      ];

      final result = service.findExcludedAreas(47.9, 106.9, areas);
      expect(result.length, 2);
    });
  });
}
