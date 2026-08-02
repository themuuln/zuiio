import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/map/domain/sighting_report.dart';

/// Helper to create a minimal SightingReport with defaults.
SightingReport _createSighting({
  String id = 's1',
  String reportId = 'r1',
  String reporterId = 'u1',
  double lat = 47.9,
  double lng = 106.9,
  DateTime? createdAt,
}) {
  final t = createdAt ?? DateTime(2026, 6, 1);
  return SightingReport(
    id: id,
    reportId: reportId,
    reporterId: reporterId,
    lat: lat,
    lng: lng,
    createdAt: t,
  );
}

void main() {
  group('SightingReport', () {
    test('defaults: pending status, public reporting, no review trail', () {
      final sighting = _createSighting();

      expect(sighting.status, SightingStatus.pending);
      expect(sighting.isAnonymous, isFalse);
      expect(sighting.locationName, isNull);
      expect(sighting.description, isNull);
      expect(sighting.photoUrl, isNull);
      expect(sighting.clientId, isNull);
      expect(sighting.reviewedAt, isNull);
      expect(sighting.reviewedBy, isNull);
    });

    test('toJson/fromJson roundtrip preserves all fields', () {
      final now = DateTime(2026, 6, 1, 10, 30);
      final sighting = SightingReport(
        id: 's-full',
        reportId: 'r-full',
        reporterId: 'u-full',
        lat: 47.9184,
        lng: 106.9177,
        locationName: 'Хангай',
        description: 'Улаан зүстэй морь харсан',
        photoUrl: 'https://example.com/sighting.jpg',
        isAnonymous: true,
        status: SightingStatus.confirmed,
        clientId: 'client-s-full',
        reviewedAt: now.add(const Duration(hours: 2)),
        reviewedBy: 'owner-1',
        createdAt: now,
      );

      final restored = SightingReport.fromJson(sighting.toJson());

      expect(restored.id, 's-full');
      expect(restored.reportId, 'r-full');
      expect(restored.reporterId, 'u-full');
      expect(restored.lat, 47.9184);
      expect(restored.lng, 106.9177);
      expect(restored.locationName, 'Хангай');
      expect(restored.description, 'Улаан зүстэй морь харсан');
      expect(restored.photoUrl, 'https://example.com/sighting.jpg');
      expect(restored.isAnonymous, isTrue);
      expect(restored.status, SightingStatus.confirmed);
      expect(restored.clientId, 'client-s-full');
      expect(restored.reviewedAt, now.add(const Duration(hours: 2)));
      expect(restored.reviewedBy, 'owner-1');
      expect(restored.createdAt, now);
    });

    test('roundtrip with null optional fields', () {
      final sighting = _createSighting();

      final restored = SightingReport.fromJson(sighting.toJson());

      expect(restored.locationName, isNull);
      expect(restored.description, isNull);
      expect(restored.photoUrl, isNull);
      expect(restored.clientId, isNull);
      expect(restored.reviewedAt, isNull);
      expect(restored.reviewedBy, isNull);
    });

    test('fromJson tolerates missing optional fields', () {
      final sighting = SightingReport.fromJson({
        'id': 's-min',
        'report_id': 'r1',
        'reporter_id': 'u1',
        'lat': 47.9,
        'lng': 106.9,
        'created_at': '2026-06-01T00:00:00.000',
      });

      expect(sighting.id, 's-min');
      expect(sighting.status, SightingStatus.pending);
      expect(sighting.isAnonymous, isFalse);
    });

    test('fromJson falls back to pending for unknown status', () {
      final json = _createSighting().toJson()..['status'] = 'bogus';

      final restored = SightingReport.fromJson(json);

      expect(restored.status, SightingStatus.pending);
    });

    test('copyWith overrides specified fields only', () {
      final sighting = _createSighting();
      final updated = sighting.copyWith(
        status: SightingStatus.confirmed,
        description: 'Хоёр дахь удаа харсан',
        reviewedBy: 'owner-1',
      );

      expect(updated.status, SightingStatus.confirmed);
      expect(updated.description, 'Хоёр дахь удаа харсан');
      expect(updated.reviewedBy, 'owner-1');
      // Unchanged fields are preserved.
      expect(updated.id, 's1');
      expect(updated.reportId, 'r1');
      expect(updated.reporterId, 'u1');
      expect(updated.lat, 47.9);
      expect(updated.lng, 106.9);
      expect(updated.isAnonymous, isFalse);
    });

    test('copyWith keeps existing value when null passed', () {
      final sighting = _createSighting().copyWith(
        locationName: 'Хангай',
        clientId: 'client-1',
      );
      expect(sighting.locationName, 'Хангай');

      // Null-coalescing copyWith: omitting a field keeps the current value.
      final same = sighting.copyWith(description: 'Тэмдэглэл');
      expect(same.locationName, 'Хангай');
      expect(same.clientId, 'client-1');
    });

    test('status labels are Mongolian', () {
      expect(SightingStatus.pending.label, 'Хүлээгдэж буй');
      expect(SightingStatus.confirmed.label, 'Баталгаажсан');
      expect(SightingStatus.dismissed.label, 'Үгүйсгэсэн');
    });
  });
}
