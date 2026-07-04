import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/map/data/location_service.dart';

void main() {
  late LocationService service;

  setUp(() {
    service = LocationService();
  });

  // ── distanceBetween ───────────────────────────────────────────────

  group('distanceBetween', () {
    test('returns zero for same point', () {
      final distance = service.distanceBetween(47.9, 106.9, 47.9, 106.9);
      expect(distance, 0);
    });

    test('returns correct distance for known points', () {
      // Ulaanbaatar (47.9, 106.9) to Darkhan (49.5, 105.9)
      // Approximate distance: ~200km
      final distance = service.distanceBetween(47.9, 106.9, 49.5, 105.9);
      expect(distance, greaterThan(150000)); // > 150km
      expect(distance, lessThan(250000)); // < 250km
    });

    test('handles points across the globe', () {
      // Ulaanbaatar to Moscow
      final distance = service.distanceBetween(47.9, 106.9, 55.8, 37.6);
      expect(distance, greaterThan(4000000)); // > 4000km
      expect(distance, lessThan(6000000)); // < 6000km
    });

    test('handles very close points', () {
      // ~100 meters apart
      final distance = service.distanceBetween(47.9, 106.9, 47.901, 106.9);
      expect(distance, greaterThan(50)); // > 50m
      expect(distance, lessThan(200)); // < 200m
    });
  });
}
