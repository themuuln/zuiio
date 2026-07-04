import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/map/application/expiry_service.dart';
import 'package:tamga/src/features/map/domain/animal_enums.dart';
import 'package:tamga/src/features/map/domain/lost_horse_report.dart';
import 'package:tamga/src/features/map/domain/map_enums.dart';

void main() {
  group('ExpiryService', () {
    // ── isNearingExpiry ─────────────────────────────────────────────
    // VAL-PRICE-003: "Сунгах уу?" prompt ~24h before expiry

    group('isNearingExpiry', () {
      test('returns true for paid report within 24h of expiry', () {
        final now = DateTime.now();
        final nearExpiry = now.add(const Duration(hours: 12));
        final report = LostHorseReport(
          id: 'r1',
          ownerId: 'o1',
          lastSeenLat: 47.9,
          lastSeenLng: 106.9,
          lastSeenAt: now,
          createdAt: now,
          updatedAt: now,
          pricingTier: LostHorsePricingTier.featured,
          expiresAt: nearExpiry,
          status: LostHorseStatus.active,
        );

        expect(ExpiryService.isNearingExpiry(report), isTrue);
      });

      test('returns false for free report', () {
        final now = DateTime.now();
        final report = LostHorseReport(
          id: 'r1',
          ownerId: 'o1',
          lastSeenLat: 47.9,
          lastSeenLng: 106.9,
          lastSeenAt: now,
          createdAt: now,
          updatedAt: now,
          pricingTier: LostHorsePricingTier.free,
          status: LostHorseStatus.active,
        );

        expect(ExpiryService.isNearingExpiry(report), isFalse);
      });

      test('returns false for paid report far from expiry', () {
        final now = DateTime.now();
        const sevenDays = Duration(days: 7);
        final farExpiry = now.add(sevenDays);
        final report = LostHorseReport(
          id: 'r1',
          ownerId: 'o1',
          lastSeenLat: 47.9,
          lastSeenLng: 106.9,
          lastSeenAt: now,
          createdAt: now,
          updatedAt: now,
          pricingTier: LostHorsePricingTier.vip,
          expiresAt: farExpiry,
          status: LostHorseStatus.active,
        );

        expect(ExpiryService.isNearingExpiry(report), isFalse);
      });

      test('returns false for already expired report', () {
        final now = DateTime.now();
        final pastExpiry = now.subtract(const Duration(days: 1));
        final report = LostHorseReport(
          id: 'r1',
          ownerId: 'o1',
          lastSeenLat: 47.9,
          lastSeenLng: 106.9,
          lastSeenAt: now,
          createdAt: now,
          updatedAt: now,
          pricingTier: LostHorsePricingTier.featured,
          expiresAt: pastExpiry,
          status: LostHorseStatus.expired,
        );

        expect(ExpiryService.isNearingExpiry(report), isFalse);
      });
    });

    // ── canBeRenewed ────────────────────────────────────────────────

    group('canBeRenewed', () {
      test('returns true for paid tiers', () {
        final now = DateTime.now();
        final featured = LostHorseReport(
          id: 'r1',
          ownerId: 'o1',
          lastSeenLat: 47.9,
          lastSeenLng: 106.9,
          lastSeenAt: now,
          createdAt: now,
          updatedAt: now,
          pricingTier: LostHorsePricingTier.featured,
        );
        final vip = LostHorseReport(
          id: 'r2',
          ownerId: 'o1',
          lastSeenLat: 47.9,
          lastSeenLng: 106.9,
          lastSeenAt: now,
          createdAt: now,
          updatedAt: now,
          pricingTier: LostHorsePricingTier.vip,
        );

        expect(ExpiryService.canBeRenewed(featured), isTrue);
        expect(ExpiryService.canBeRenewed(vip), isTrue);
      });

      test('returns false for free tier', () {
        final now = DateTime.now();
        final free = LostHorseReport(
          id: 'r1',
          ownerId: 'o1',
          lastSeenLat: 47.9,
          lastSeenLng: 106.9,
          lastSeenAt: now,
          createdAt: now,
          updatedAt: now,
          pricingTier: LostHorsePricingTier.free,
        );

        expect(ExpiryService.canBeRenewed(free), isFalse);
      });
    });

    // ── hoursUntilExpiry ────────────────────────────────────────────

    group('hoursUntilExpiry', () {
      test('returns null for reports without expiry', () {
        final now = DateTime.now();
        final free = LostHorseReport(
          id: 'r1',
          ownerId: 'o1',
          lastSeenLat: 47.9,
          lastSeenLng: 106.9,
          lastSeenAt: now,
          createdAt: now,
          updatedAt: now,
          pricingTier: LostHorsePricingTier.free,
        );

        expect(ExpiryService.hoursUntilExpiry(free), isNull);
      });

      test('returns positive hours for reports with future expiry', () {
        final now = DateTime.now();
        final future = now.add(const Duration(days: 1));
        final report = LostHorseReport(
          id: 'r1',
          ownerId: 'o1',
          lastSeenLat: 47.9,
          lastSeenLng: 106.9,
          lastSeenAt: now,
          createdAt: now,
          updatedAt: now,
          pricingTier: LostHorsePricingTier.featured,
          expiresAt: future,
        );

        final hours = ExpiryService.hoursUntilExpiry(report);
        expect(hours, greaterThan(0));
      });
    });
  });
}
