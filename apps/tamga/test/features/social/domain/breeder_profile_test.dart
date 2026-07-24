import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/social/domain/breeder_profile.dart';

void main() {
  group('BreederProfile model', () {
    final testProfile = BreederProfile(
      id: 'seller-1',
      displayName: 'Болд',
      locationLabel: 'Төв аймаг, Баян сум',
      memberSince: DateTime(2020, 1, 15),
      totalHorses: 25,
      achievements: ['Туршлагатай үржүүлэгч', 'Итгэлтэй худалдагч'],
      recentListings: const [
        BreederListingPreview(
          id: 'listing-1',
          title: 'Азарга',
          priceAmount: 5000000,
          currency: 'MNT',
        ),
        BreederListingPreview(
          id: 'listing-2',
          title: 'Гүү',
          priceAmount: 3000000,
          currency: 'MNT',
        ),
      ],
      averageRating: 4.5,
      totalRatings: 12,
    );

    test('BreederProfile has all required fields', () {
      expect(testProfile.id, 'seller-1');
      expect(testProfile.displayName, 'Болд');
      expect(testProfile.locationLabel, 'Төв аймаг, Баян сум');
      expect(testProfile.memberSince, DateTime(2020, 1, 15));
      expect(testProfile.totalHorses, 25);
      expect(testProfile.achievements.length, 2);
      expect(testProfile.recentListings.length, 2);
      expect(testProfile.averageRating, 4.5);
      expect(testProfile.totalRatings, 12);
    });

    test('memberSinceYears returns correct years', () {
      // memberSince is 2020, current year is 2026
      expect(testProfile.memberSinceYears, 6);
    });

    test('memberSinceLabel returns correct format', () {
      expect(testProfile.memberSinceLabel, '6 жил');
    });

    test('memberSinceLabel returns dash when no memberSince', () {
      const profile = BreederProfile(
        id: 'seller-2',
        displayName: 'Test',
      );
      expect(profile.memberSinceLabel, '—');
    });

    test('copyWith preserves unchanged fields', () {
      final copy = testProfile.copyWith(displayName: 'Баяр');
      expect(copy.id, 'seller-1');
      expect(copy.displayName, 'Баяр');
      expect(copy.totalHorses, 25);
    });

    test('copyWith can clear memberSince', () {
      final copy = testProfile.copyWith(clearMemberSince: true);
      expect(copy.memberSince, isNull);
    });

    test('equality is based on id, displayName, totalHorses, averageRating', () {
      const same = BreederProfile(
        id: 'seller-1',
        displayName: 'Болд',
        totalHorses: 25,
        averageRating: 4.5,
      );
      expect(testProfile, same);
    });

    test('different ids are not equal', () {
      const different = BreederProfile(
        id: 'seller-2',
        displayName: 'Болд',
      );
      expect(testProfile, isNot(different));
    });

    test('toJson / fromJson round-trips correctly', () {
      final json = testProfile.toJson();
      final restored = BreederProfile.fromJson(json);
      expect(restored.id, testProfile.id);
      expect(restored.displayName, testProfile.displayName);
      expect(restored.locationLabel, testProfile.locationLabel);
      expect(restored.memberSince, testProfile.memberSince);
      expect(restored.totalHorses, testProfile.totalHorses);
      expect(restored.achievements, testProfile.achievements);
      expect(restored.averageRating, testProfile.averageRating);
      expect(restored.totalRatings, testProfile.totalRatings);
    });

    test('toJson / fromJson round-trips recentListings', () {
      final json = testProfile.toJson();
      final restored = BreederProfile.fromJson(json);
      expect(restored.recentListings.length, 2);
      expect(restored.recentListings[0].id, 'listing-1');
      expect(restored.recentListings[0].title, 'Азарга');
    });
  });

  group('BreederListingPreview model', () {
    const testPreview = BreederListingPreview(
      id: 'listing-1',
      title: 'Азарга',
      priceAmount: 5000000,
      currency: 'MNT',
      thumbnailUrl: 'https://example.com/horse.jpg',
      status: 'active',
    );

    test('has all required fields', () {
      expect(testPreview.id, 'listing-1');
      expect(testPreview.title, 'Азарга');
      expect(testPreview.priceAmount, 5000000);
      expect(testPreview.currency, 'MNT');
      expect(testPreview.thumbnailUrl, 'https://example.com/horse.jpg');
      expect(testPreview.status, 'active');
    });

    test('formattedPrice formats MNT correctly', () {
      expect(testPreview.formattedPrice, '5,000,000 ₮');
    });

    test('formattedPrice formats USD correctly', () {
      const usdPreview = BreederListingPreview(
        id: 'listing-2',
        title: 'Stallion',
        priceAmount: 5000,
        currency: 'USD',
      );
      expect(usdPreview.formattedPrice, '\$5000');
    });

    test('formattedPrice handles zero', () {
      const zero = BreederListingPreview(
        id: 'zero',
        title: 'Free',
        priceAmount: 0,
        currency: 'MNT',
      );
      expect(zero.formattedPrice, '0 ₮');
    });

    test('copyWith preserves fields', () {
      final copy = testPreview.copyWith(title: 'Шилдэг азарга');
      expect(copy.id, 'listing-1');
      expect(copy.title, 'Шилдэг азарга');
      expect(copy.priceAmount, 5000000);
    });

    test('copyWith can clear thumbnailUrl', () {
      final copy = testPreview.copyWith(clearThumbnailUrl: true);
      expect(copy.thumbnailUrl, isNull);
    });

    test('toJson / fromJson round-trips correctly', () {
      final json = testPreview.toJson();
      final restored = BreederListingPreview.fromJson(json);
      expect(restored.id, testPreview.id);
      expect(restored.title, testPreview.title);
      expect(restored.priceAmount, testPreview.priceAmount);
      expect(restored.currency, testPreview.currency);
      expect(restored.thumbnailUrl, testPreview.thumbnailUrl);
      expect(restored.status, testPreview.status);
    });

    test('equality is based on id, title, priceAmount', () {
      const same = BreederListingPreview(
        id: 'listing-1',
        title: 'Азарга',
        priceAmount: 5000000,
        currency: 'MNT',
      );
      expect(testPreview, same);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // VAL-SOCIAL-001: Breeder public profile screen exists with required info
  // ══════════════════════════════════════════════════════════════════

  group('VAL-SOCIAL-001: Breeder profile model coverage', () {
    test('BreederProfile contains all 7 required fields', () {
      final profile = BreederProfile(
        id: 'test-id',
        displayName: 'Test Breeder',
        locationLabel: 'Test Location',
        memberSince: DateTime(2021),
        totalHorses: 10,
        achievements: const ['Test Badge'],
        recentListings: const [
          BreederListingPreview(
            id: 'l1',
            title: 'Test Listing',
            priceAmount: 1000,
            currency: 'MNT',
          ),
        ],
        averageRating: 4.0,
        totalRatings: 5,
      );

      // 1. name (displayName)
      expect(profile.displayName, isNotEmpty);
      // 2. location
      expect(profile.locationLabel, isNotEmpty);
      // 3. member since
      expect(profile.memberSince, isNotNull);
      // 4. total horses
      expect(profile.totalHorses, greaterThan(0));
      // 5. achievements/badges
      expect(profile.achievements, isNotEmpty);
      // 6. recent listings
      expect(profile.recentListings, isNotEmpty);
      // 7. average seller rating
      expect(profile.averageRating, greaterThan(0));
    });
  });
}
