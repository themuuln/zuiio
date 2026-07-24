import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/map/domain/animal_enums.dart';
import 'package:tamga/src/features/map/domain/lost_horse_report.dart';
import 'package:tamga/src/features/map/domain/search_area.dart';
import 'package:tamga/src/features/map/domain/horse_location.dart';
import 'package:tamga/src/features/map/domain/geofence_alert.dart';
import 'package:tamga/src/features/map/domain/map_enums.dart';
import 'package:tamga/src/shared/domain/horse.dart';

/// Helper to create a minimal LostHorseReport with defaults.
LostHorseReport _createReport({
  String id = 'r1',
  String ownerId = 'o1',
  double lat = 47.9,
  double lng = 106.9,
  DateTime? now,
}) {
  final t = now ?? DateTime(2026, 6, 1);
  return LostHorseReport(
    id: id,
    ownerId: ownerId,
    lastSeenLat: lat,
    lastSeenLng: lng,
    lastSeenAt: t,
    createdAt: t,
    updatedAt: t,
  );
}

void main() {
  // ── LostHorseReport ─────────────────────────────────────────────

  group('LostHorseReport', () {
    test('toJson/fromJson roundtrip', () {
      final now = DateTime(2026, 6, 1);
      final report = LostHorseReport(
        id: 'r1',
        horseId: 'h1',
        ownerId: 'o1',
        horseName: 'Алтан',
        description: 'Хаяж морь',
        lastSeenLat: 47.9,
        lastSeenLng: 106.9,
        lastSeenAt: now,
        searchRadiusKm: 10.0,
        status: LostHorseStatus.active,
        createdAt: now,
        updatedAt: now,
      );

      final json = report.toJson();
      final restored = LostHorseReport.fromJson(json);

      expect(restored.id, 'r1');
      expect(restored.horseName, 'Алтан');
      expect(restored.lastSeenLat, 47.9);
      expect(restored.searchRadiusKm, 10.0);
      expect(restored.status, LostHorseStatus.active);
    });

    test('copyWith overrides specified fields', () {
      final report = LostHorseReport(
        id: 'r1',
        horseId: 'h1',
        ownerId: 'o1',
        horseName: 'Алтан',
        lastSeenLat: 47.9,
        lastSeenLng: 106.9,
        lastSeenAt: DateTime(2026),
        createdAt: DateTime(2026),
        updatedAt: DateTime(2026),
      );

      final updated = report.copyWith(
        status: LostHorseStatus.found,
        description: 'Олсон',
      );

      expect(updated.status, LostHorseStatus.found);
      expect(updated.description, 'Олсон');
      expect(updated.horseName, 'Алтан'); // unchanged
    });

    // ── Location serialization (VAL-LOC-004) ──

    test('location fields toJson/fromJson roundtrip', () {
      final now = DateTime(2026, 6, 1);
      final report = LostHorseReport(
        id: 'r1',
        ownerId: 'o1',
        lastSeenLat: 47.9,
        lastSeenLng: 106.9,
        lastSeenAt: now,
        createdAt: now,
        updatedAt: now,
        locationAimag: 'Архангай',
        locationSum: 'Цэцэрлэг',
        locationBag: '1-р баг',
        locationName: 'Говийн хөндий',
      );

      final json = report.toJson();
      final restored = LostHorseReport.fromJson(json);

      expect(restored.locationAimag, 'Архангай');
      expect(restored.locationSum, 'Цэцэрлэг');
      expect(restored.locationBag, '1-р баг');
      expect(restored.locationName, 'Говийн хөндий');
    });

    test('location fields roundtrip with null values', () {
      final now = DateTime(2026, 6, 1);
      final report = _createReport(now: now);

      final json = report.toJson();
      final restored = LostHorseReport.fromJson(json);

      expect(restored.locationAimag, isNull);
      expect(restored.locationSum, isNull);
      expect(restored.locationBag, isNull);
      expect(restored.locationName, isNull);
    });

    // ── Animal info serialization (VAL-LOC-004) ──

    test('animal info fields toJson/fromJson roundtrip', () {
      final now = DateTime(2026, 6, 1);
      final report = LostHorseReport(
        id: 'r1',
        ownerId: 'o1',
        lastSeenLat: 47.9,
        lastSeenLng: 106.9,
        lastSeenAt: now,
        createdAt: now,
        updatedAt: now,
        animalType: AnimalType.cattle,
        ages: [AnimalAge.daaga, AnimalAge.shudlen],
        gender: HorseGender.mare,
        breed: HorseBreed.shineTsagiinMongol,
        coatColor: 'Хээр',
        lostCount: 3,
      );

      final json = report.toJson();
      final restored = LostHorseReport.fromJson(json);

      expect(restored.animalType, AnimalType.cattle);
      expect(restored.ages, [AnimalAge.daaga, AnimalAge.shudlen]);
      expect(restored.gender, HorseGender.mare);
      expect(restored.breed, HorseBreed.shineTsagiinMongol);
      expect(restored.coatColor, 'Хээр');
      expect(restored.lostCount, 3);
    });

    // ── Default values (VAL-ANML-006) ──

    test('lostCount defaults to 1', () {
      final report = _createReport();
      expect(report.lostCount, 1,
          reason: 'lostCount should default to 1');
    });

    test('photoUrls defaults to empty list', () {
      final report = _createReport();
      expect(report.photoUrls, isEmpty,
          reason: 'photoUrls should default to empty list');
    });

    test('videoUrls defaults to empty list', () {
      final report = _createReport();
      expect(report.videoUrls, isEmpty,
          reason: 'videoUrls should default to empty list');
    });

    test('animalType defaults to horse', () {
      final report = _createReport();
      expect(report.animalType, AnimalType.horse,
          reason: 'animalType should default to Адуу/horse');
    });

    test('ages defaults to empty list', () {
      final report = _createReport();
      expect(report.ages, isEmpty,
          reason: 'ages should default to empty list');
    });

    // ── Media serialization (VAL-MEDIA-003) ──

    test('media fields toJson/fromJson roundtrip', () {
      final now = DateTime(2026, 6, 1);
      final report = LostHorseReport(
        id: 'r1',
        ownerId: 'o1',
        lastSeenLat: 47.9,
        lastSeenLng: 106.9,
        lastSeenAt: now,
        createdAt: now,
        updatedAt: now,
        photoUrls: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
        videoUrls: ['https://example.com/video1.mp4'],
      );

      final json = report.toJson();
      final restored = LostHorseReport.fromJson(json);

      expect(restored.photoUrls, ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg']);
      expect(restored.videoUrls, ['https://example.com/video1.mp4']);
    });

    test('media fields roundtrip with null values', () {
      final now = DateTime(2026, 6, 1);
      final report = _createReport(now: now);

      final json = report.toJson();
      final restored = LostHorseReport.fromJson(json);

      expect(restored.photoUrls, isEmpty);
      expect(restored.videoUrls, isEmpty);
    });

    // ── Tamga / Identification serialization (VAL-TAMGA-001, VAL-TAMGA-002) ──

    test('tamgaImageUrl and earMarkDescription toJson/fromJson roundtrip', () {
      final now = DateTime(2026, 6, 1);
      final report = LostHorseReport(
        id: 'r1',
        ownerId: 'o1',
        lastSeenLat: 47.9,
        lastSeenLng: 106.9,
        lastSeenAt: now,
        createdAt: now,
        updatedAt: now,
        tamgaImageUrl: 'https://example.com/tamga.jpg',
        earMarkDescription: 'Зүүн чихэнд хэвтээ зураас',
      );

      final json = report.toJson();
      final restored = LostHorseReport.fromJson(json);

      expect(restored.tamgaImageUrl, 'https://example.com/tamga.jpg');
      expect(restored.earMarkDescription, 'Зүүн чихэнд хэвтээ зураас');
    });

    test('tamgaImageUrl and earMarkDescription roundtrip with null values', () {
      final now = DateTime(2026, 6, 1);
      final report = _createReport(now: now);

      final json = report.toJson();
      final restored = LostHorseReport.fromJson(json);

      expect(restored.tamgaImageUrl, isNull);
      expect(restored.earMarkDescription, isNull);
    });

    test('tamgaImageUrl defaults to null', () {
      final report = _createReport();
      expect(report.tamgaImageUrl, isNull,
          reason: 'tamgaImageUrl should default to null');
    });

    test('earMarkDescription defaults to null', () {
      final report = _createReport();
      expect(report.earMarkDescription, isNull,
          reason: 'earMarkDescription should default to null');
    });

    // ── Contact phone serialization (VAL-CONTACT-001, VAL-CONTACT-002) ──

    test('contactPhone toJson/fromJson roundtrip', () {
      final now = DateTime(2026, 6, 1);
      final report = LostHorseReport(
        id: 'r1',
        ownerId: 'o1',
        lastSeenLat: 47.9,
        lastSeenLng: 106.9,
        lastSeenAt: now,
        createdAt: now,
        updatedAt: now,
        contactPhone: '+97699112233',
      );

      final json = report.toJson();
      final restored = LostHorseReport.fromJson(json);

      expect(restored.contactPhone, '+97699112233');
    });

    test('contactPhone roundtrip with null value', () {
      final now = DateTime(2026, 6, 1);
      final report = _createReport(now: now);

      final json = report.toJson();
      final restored = LostHorseReport.fromJson(json);

      expect(restored.contactPhone, isNull);
    });

    test('contactPhone defaults to null', () {
      final report = _createReport();
      expect(report.contactPhone, isNull,
          reason: 'contactPhone should default to null');
    });

    test('copyWith updates contactPhone', () {
      final report = _createReport();
      final updated = report.copyWith(contactPhone: '+97699554433');

      expect(updated.contactPhone, '+97699554433');
    });

    // ── Pricing serialization (VAL-PRICE-001) ──

    test('pricingTier defaults to free', () {
      final report = _createReport();
      expect(report.pricingTier, LostHorsePricingTier.free,
          reason: 'pricingTier should default to free/Энгийн');
    });

    test('expiresAt defaults to null', () {
      final report = _createReport();
      expect(report.expiresAt, isNull,
          reason: 'expiresAt should default to null');
    });

    test('renewalRequested defaults to false', () {
      final report = _createReport();
      expect(report.renewalRequested, isFalse,
          reason: 'renewalRequested should default to false');
    });

    test('pricing fields toJson/fromJson roundtrip (free tier)', () {
      final now = DateTime(2026, 6, 1);
      final report = LostHorseReport(
        id: 'r1',
        ownerId: 'o1',
        lastSeenLat: 47.9,
        lastSeenLng: 106.9,
        lastSeenAt: now,
        createdAt: now,
        updatedAt: now,
        pricingTier: LostHorsePricingTier.free,
      );

      final json = report.toJson();
      final restored = LostHorseReport.fromJson(json);

      expect(restored.pricingTier, LostHorsePricingTier.free);
      expect(restored.expiresAt, isNull);
      expect(restored.renewalRequested, isFalse);
    });

    test('pricing fields toJson/fromJson roundtrip (featured tier)', () {
      final now = DateTime(2026, 6, 1);
      final expiresAt = now.add(const Duration(days: 7));
      final report = LostHorseReport(
        id: 'r1',
        ownerId: 'o1',
        lastSeenLat: 47.9,
        lastSeenLng: 106.9,
        lastSeenAt: now,
        createdAt: now,
        updatedAt: now,
        pricingTier: LostHorsePricingTier.featured,
        expiresAt: expiresAt,
        renewalRequested: false,
      );

      final json = report.toJson();
      final restored = LostHorseReport.fromJson(json);

      expect(restored.pricingTier, LostHorsePricingTier.featured);
      expect(restored.expiresAt, expiresAt);
      expect(restored.renewalRequested, isFalse);
    });

    test('pricing fields toJson/fromJson roundtrip (vip tier)', () {
      final now = DateTime(2026, 6, 1);
      final expiresAt = now.add(const Duration(days: 14));
      final report = LostHorseReport(
        id: 'r1',
        ownerId: 'o1',
        lastSeenLat: 47.9,
        lastSeenLng: 106.9,
        lastSeenAt: now,
        createdAt: now,
        updatedAt: now,
        pricingTier: LostHorsePricingTier.vip,
        expiresAt: expiresAt,
        renewalRequested: true,
      );

      final json = report.toJson();
      final restored = LostHorseReport.fromJson(json);

      expect(restored.pricingTier, LostHorsePricingTier.vip);
      expect(restored.expiresAt, expiresAt);
      expect(restored.renewalRequested, isTrue);
    });

    test('copyWith updates pricing fields', () {
      final report = _createReport();
      final expiresAt = DateTime(2026, 6, 15);
      final updated = report.copyWith(
        pricingTier: LostHorsePricingTier.vip,
        expiresAt: expiresAt,
        renewalRequested: true,
      );

      expect(updated.pricingTier, LostHorsePricingTier.vip);
      expect(updated.expiresAt, expiresAt);
      expect(updated.renewalRequested, isTrue);
    });

    test('PricingTier price and duration are correct', () {
      expect(LostHorsePricingTier.free.priceMnt, 0);
      expect(LostHorsePricingTier.free.durationDays, isNull);
      expect(LostHorsePricingTier.free.priceLabel, '0₮');
      expect(LostHorsePricingTier.free.isPaid, isFalse);

      expect(LostHorsePricingTier.featured.priceMnt, 5000);
      expect(LostHorsePricingTier.featured.durationDays, 7);
      expect(LostHorsePricingTier.featured.priceLabel, '5,000₮');
      expect(LostHorsePricingTier.featured.isPaid, isTrue);

      expect(LostHorsePricingTier.vip.priceMnt, 9900);
      expect(LostHorsePricingTier.vip.durationDays, 14);
      expect(LostHorsePricingTier.vip.priceLabel, '9,900₮');
      expect(LostHorsePricingTier.vip.isPaid, isTrue);
    });

    // ── copyWith for new fields ──

    test('copyWith updates location fields', () {
      final report = _createReport();
      final updated = report.copyWith(
        locationAimag: 'Ховд',
        locationSum: 'Булган',
        locationBag: '2-р баг',
        locationName: 'Хөшөөт',
      );

      expect(updated.locationAimag, 'Ховд');
      expect(updated.locationSum, 'Булган');
      expect(updated.locationBag, '2-р баг');
      expect(updated.locationName, 'Хөшөөт');
    });

    test('copyWith updates animal info fields', () {
      final report = _createReport();
      final updated = report.copyWith(
        animalType: AnimalType.camel,
        ages: [AnimalAge.ikhNas],
        gender: HorseGender.stallion,
        breed: HorseBreed.erliiz,
        coatColor: 'Цагаан',
        lostCount: 5,
      );

      expect(updated.animalType, AnimalType.camel);
      expect(updated.ages, [AnimalAge.ikhNas]);
      expect(updated.gender, HorseGender.stallion);
      expect(updated.breed, HorseBreed.erliiz);
      expect(updated.coatColor, 'Цагаан');
      expect(updated.lostCount, 5);
    });

    test('copyWith updates media fields', () {
      final report = _createReport();
      final updated = report.copyWith(
        photoUrls: ['https://example.com/p1.jpg'],
        videoUrls: ['https://example.com/v1.mp4'],
      );

      expect(updated.photoUrls, ['https://example.com/p1.jpg']);
      expect(updated.videoUrls, ['https://example.com/v1.mp4']);
    });

    test('copyWith updates tamgaImageUrl and earMarkDescription', () {
      final report = _createReport();
      final updated = report.copyWith(
        tamgaImageUrl: 'https://example.com/tamga.jpg',
        earMarkDescription: 'Баруун чихэнд дугуй тэмдэг',
      );

      expect(updated.tamgaImageUrl, 'https://example.com/tamga.jpg');
      expect(
        updated.earMarkDescription,
        'Баруун чихэнд дугуй тэмдэг',
      );
    });

    test('distanceTo returns meters', () {
      final report = LostHorseReport(
        id: 'r1',
        horseId: 'h1',
        ownerId: 'o1',
        horseName: 'Алтан',
        lastSeenLat: 47.9,
        lastSeenLng: 106.9,
        lastSeenAt: DateTime(2026),
        createdAt: DateTime(2026),
        updatedAt: DateTime(2026),
      );

      // Same point = 0 distance
      expect(report.distanceTo(47.9, 106.9), 0);

      // ~111km per degree latitude
      final dist = report.distanceTo(48.9, 106.9);
      expect(dist, greaterThan(100000));
      expect(dist, lessThan(120000));
    });

    test('status label is in Mongolian', () {
      expect(LostHorseStatus.active.label, 'Идэвхтэй');
      expect(LostHorseStatus.found.label, 'Олсон');
      expect(LostHorseStatus.cancelled.label, 'Цуцалсан');
    });
  });

  // ── SearchArea ──────────────────────────────────────────────────

  group('SearchArea', () {
    test('toJson/fromJson roundtrip', () {
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

      final json = area.toJson();
      final restored = SearchArea.fromJson(json);

      expect(restored.id, 'a1');
      expect(restored.name, 'Гэрийн ойролцоо');
      expect(restored.radiusKm, 5.0);
      expect(restored.isActive, true);
    });

    test('containsPoint inside circle', () {
      final area = SearchArea(
        id: 'a1',
        name: 'Test',
        centerLat: 47.9,
        centerLng: 106.9,
        radiusKm: 5.0,
        createdBy: 'o1',
        createdAt: DateTime(2026),
      );

      // Center point — definitely inside
      expect(area.containsPoint(47.9, 106.9), true);

      // ~1km away — inside 5km radius
      expect(area.containsPoint(47.91, 106.9), true);
    });

    test('containsPoint outside circle', () {
      final area = SearchArea(
        id: 'a1',
        name: 'Test',
        centerLat: 47.9,
        centerLng: 106.9,
        radiusKm: 1.0,
        createdBy: 'o1',
        createdAt: DateTime(2026),
      );

      // ~11km away — outside 1km radius
      expect(area.containsPoint(48.0, 106.9), false);
    });

    test('distanceToEdge negative when inside', () {
      final area = SearchArea(
        id: 'a1',
        name: 'Test',
        centerLat: 47.9,
        centerLng: 106.9,
        radiusKm: 5.0,
        createdBy: 'o1',
        createdAt: DateTime(2026),
      );

      expect(area.distanceToEdge(47.9, 106.9), lessThan(0));
    });

    test('distanceToEdge positive when outside', () {
      final area = SearchArea(
        id: 'a1',
        name: 'Test',
        centerLat: 47.9,
        centerLng: 106.9,
        radiusKm: 1.0,
        createdBy: 'o1',
        createdAt: DateTime(2026),
      );

      expect(area.distanceToEdge(48.0, 106.9), greaterThan(0));
    });
  });

  // ── HorseLocation ───────────────────────────────────────────────

  group('HorseLocation', () {
    test('toJson/fromJson roundtrip', () {
      final loc = HorseLocation(
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

      final json = loc.toJson();
      final restored = HorseLocation.fromJson(json);

      expect(restored.horseId, 'h1');
      expect(restored.horseName, 'Зүүлдэр');
      expect(restored.isVisible, true);
      expect(restored.coatColor, 'brow');
    });
  });

  // ── GeofenceAlert ───────────────────────────────────────────────

  group('GeofenceAlert', () {
    test('toJson/fromJson roundtrip', () {
      final alert = GeofenceAlert(
        id: 'g1',
        horseId: 'h1',
        horseName: 'Алтан',
        geofenceId: 'f1',
        geofenceName: 'Гэр',
        alertType: GeofenceAlertType.entered,
        triggeredAt: DateTime(2026),
        horseLat: 47.9,
        horseLng: 106.9,
        acknowledged: false,
      );

      final json = alert.toJson();
      final restored = GeofenceAlert.fromJson(json);

      expect(restored.id, 'g1');
      expect(restored.alertType, GeofenceAlertType.entered);
      expect(restored.acknowledged, false);
    });

    test('acknowledged copyWith', () {
      final alert = GeofenceAlert(
        id: 'g1',
        horseId: 'h1',
        horseName: 'Алтан',
        geofenceId: 'f1',
        geofenceName: 'Гэр',
        alertType: GeofenceAlertType.exited,
        triggeredAt: DateTime(2026),
        horseLat: 47.9,
        horseLng: 106.9,
      );

      final acked = alert.copyWith(acknowledged: true);
      expect(acked.acknowledged, true);
    });
  });

  // ── Enums ───────────────────────────────────────────────────────

  group('Map Enums', () {
    test('HorseMarkerType has all values', () {
      expect(HorseMarkerType.values.length, 3);
    });

    test('GeofenceType has all values', () {
      expect(GeofenceType.values.length, 3);
    });

    test('LostHorseStatus has all values', () {
      expect(LostHorseStatus.values.length, 4);
    });

    test('LostHorseStatus includes expired status', () {
      expect(LostHorseStatus.expired.label, 'Хугацаа дууссан');
    });

    test('GeofenceAlertType has all values', () {
      expect(GeofenceAlertType.values.length, 2);
    });
  });
}
