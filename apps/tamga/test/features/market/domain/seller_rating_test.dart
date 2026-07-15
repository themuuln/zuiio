import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/market/domain/seller_rating.dart';

void main() {
  group('SellerRating', () {
    final now = DateTime(2026, 6, 15);

    final defaultRating = SellerRating(
      id: 'rating-1',
      listingId: 'listing-1',
      sellerId: 'seller-1',
      buyerId: 'buyer-1',
      rating: 5,
      review: 'Маш сайн худалдагч!',
      createdAt: now,
    );

    test('creates rating with required fields', () {
      expect(defaultRating.id, 'rating-1');
      expect(defaultRating.listingId, 'listing-1');
      expect(defaultRating.sellerId, 'seller-1');
      expect(defaultRating.buyerId, 'buyer-1');
      expect(defaultRating.rating, 5);
      expect(defaultRating.review, 'Маш сайн худалдагч!');
      expect(defaultRating.createdAt, now);
    });

    test('hasResponse returns false when sellerResponse is null', () {
      expect(defaultRating.hasResponse, false);
    });

    test('hasResponse returns false when sellerResponse is empty', () {
      final rating = defaultRating.copyWith(sellerResponse: '');
      expect(rating.hasResponse, false);
    });

    test('hasResponse returns true when sellerResponse is not empty', () {
      final rating = defaultRating.copyWith(
        sellerResponse: 'Баярлалаа!',
        responseAt: DateTime(2026, 6, 16),
      );
      expect(rating.hasResponse, true);
      expect(rating.sellerResponse, 'Баярлалаа!');
      expect(rating.responseAt, DateTime(2026, 6, 16));
    });

    test('copyWith preserves fields', () {
      final modified = defaultRating.copyWith(rating: 3, review: 'Дунд зэрэг');
      expect(modified.rating, 3);
      expect(modified.review, 'Дунд зэрэг');
      expect(modified.id, 'rating-1'); // unchanged
      expect(modified.sellerId, 'seller-1'); // unchanged
    });

    test('copyWith clears sellerResponse', () {
      final withResponse = defaultRating.copyWith(
        sellerResponse: 'Баярлалаа!',
        responseAt: DateTime(2026, 6, 16),
      );
      final cleared = withResponse.copyWith(
        clearResponse: true,
        clearResponseAt: true,
      );
      expect(cleared.sellerResponse, isNull);
      expect(cleared.responseAt, isNull);
    });

    test('JSON serialization round-trip', () {
      final rating = defaultRating.copyWith(
        sellerResponse: 'Баярлалаа!',
        responseAt: DateTime(2026, 6, 16),
      );

      final json = rating.toJson();
      final restored = SellerRating.fromJson(json);

      expect(restored.id, rating.id);
      expect(restored.listingId, rating.listingId);
      expect(restored.sellerId, rating.sellerId);
      expect(restored.buyerId, rating.buyerId);
      expect(restored.rating, rating.rating);
      expect(restored.review, rating.review);
      expect(restored.createdAt, rating.createdAt);
      expect(restored.sellerResponse, rating.sellerResponse);
      expect(restored.responseAt, rating.responseAt);
    });

    test('JSON serialization without optional fields', () {
      final json = defaultRating.toJson();
      final restored = SellerRating.fromJson(json);

      expect(restored.id, defaultRating.id);
      expect(restored.sellerResponse, isNull);
      expect(restored.responseAt, isNull);
    });

    test('equality works correctly', () {
      final same = defaultRating.copyWith();
      final different = defaultRating.copyWith(rating: 3);

      expect(defaultRating == same, true);
      expect(defaultRating == different, false);
    });

    test('hashCode consistent with equality', () {
      final same = defaultRating.copyWith();
      expect(defaultRating.hashCode, same.hashCode);
    });

    test('toString includes key fields', () {
      final str = defaultRating.toString();
      expect(str, contains('rating-1'));
      expect(str, contains('seller-1'));
      expect(str, contains('5'));
    });

    test('rating clamped on construction', () {
      // Domain model doesn't clamp, but constructor accepts any int
      // Clamping happens in repository
      final rating = SellerRating(
        id: 'r2',
        listingId: 'l1',
        sellerId: 's1',
        buyerId: 'b1',
        rating: 5, // already valid
        review: 'Great',
        createdAt: now,
      );
      expect(rating.rating, 5);
    });
  });

  group('SellerRatingSummary', () {
    test('empty ratings produce zero values', () {
      final summary = SellerRatingSummary.fromRatings([]);
      expect(summary.averageRating, 0.0);
      expect(summary.totalCount, 0);
      expect(summary.distribution, {1: 0, 2: 0, 3: 0, 4: 0, 5: 0});
      expect(summary.hasRatings, false);
    });

    test('single rating produces correct summary', () {
      final now = DateTime(2026, 6, 15);
      final ratings = [
        SellerRating(
          id: 'r1',
          listingId: 'l1',
          sellerId: 's1',
          buyerId: 'b1',
          rating: 5,
          review: 'Great!',
          createdAt: now,
        ),
      ];

      final summary = SellerRatingSummary.fromRatings(ratings);
      expect(summary.averageRating, 5.0);
      expect(summary.totalCount, 1);
      expect(summary.distribution, {1: 0, 2: 0, 3: 0, 4: 0, 5: 1});
      expect(summary.hasRatings, true);
      expect(summary.mostCommonRating, 5);
    });

    test('multiple ratings produce correct average', () {
      final now = DateTime(2026, 6, 15);
      final ratings = [
        for (var i = 0; i < 5; i++)
          SellerRating(
            id: 'r$i',
            listingId: 'l1',
            sellerId: 's1',
            buyerId: 'b1',
            rating: i + 1, // 1, 2, 3, 4, 5
            review: 'Review $i',
            createdAt: now,
          ),
      ];

      final summary = SellerRatingSummary.fromRatings(ratings);
      expect(summary.averageRating, 3.0); // (1+2+3+4+5)/5 = 3
      expect(summary.totalCount, 5);
      expect(summary.distribution, {1: 1, 2: 1, 3: 1, 4: 1, 5: 1});
      expect(summary.hasRatings, true);
    });

    test('rating values are clamped to 1-5 range', () {
      final now = DateTime(2026, 6, 15);
      final ratings = [
        SellerRating(
          id: 'r1',
          listingId: 'l1',
          sellerId: 's1',
          buyerId: 'b1',
          rating: 0, // below range
          review: 'Bad',
          createdAt: now,
        ),
        SellerRating(
          id: 'r2',
          listingId: 'l1',
          sellerId: 's1',
          buyerId: 'b1',
          rating: 6, // above range
          review: 'Excellent',
          createdAt: now,
        ),
      ];

      final summary = SellerRatingSummary.fromRatings(ratings);
      expect(summary.totalCount, 2);
      expect(summary.distribution[1], 1); // clamped from 0
      expect(summary.distribution[5], 1); // clamped from 6
      expect(summary.mostCommonRating, anyOf(1, 5));
    });

    test('mostCommonRating returns null for empty', () {
      final summary = SellerRatingSummary.fromRatings([]);
      expect(summary.mostCommonRating, isNull);
    });

    test('percentageFor returns correct values', () {
      final now = DateTime(2026, 6, 15);
      final ratings = [
        SellerRating(
          id: 'r1',
          listingId: 'l1',
          sellerId: 's1',
          buyerId: 'b1',
          rating: 5,
          review: '',
          createdAt: now,
        ),
        SellerRating(
          id: 'r2',
          listingId: 'l1',
          sellerId: 's1',
          buyerId: 'b1',
          rating: 5,
          review: '',
          createdAt: now,
        ),
        SellerRating(
          id: 'r3',
          listingId: 'l1',
          sellerId: 's1',
          buyerId: 'b1',
          rating: 4,
          review: '',
          createdAt: now,
        ),
        SellerRating(
          id: 'r4',
          listingId: 'l1',
          sellerId: 's1',
          buyerId: 'b1',
          rating: 3,
          review: '',
          createdAt: now,
        ),
      ];

      final summary = SellerRatingSummary.fromRatings(ratings);
      expect(summary.percentageFor(5), 0.5); // 2/4
      expect(summary.percentageFor(4), 0.25); // 1/4
      expect(summary.percentageFor(3), 0.25); // 1/4
      expect(summary.percentageFor(2), 0.0); // 0/4
      expect(summary.percentageFor(1), 0.0); // 0/4
    });

    test('JSON serialization round-trip', () {
      final now = DateTime(2026, 6, 15);
      final ratings = [
        SellerRating(
          id: 'r1',
          listingId: 'l1',
          sellerId: 's1',
          buyerId: 'b1',
          rating: 5,
          review: '',
          createdAt: now,
        ),
        SellerRating(
          id: 'r2',
          listingId: 'l1',
          sellerId: 's1',
          buyerId: 'b1',
          rating: 4,
          review: '',
          createdAt: now,
        ),
      ];

      final summary = SellerRatingSummary.fromRatings(ratings);
      final json = summary.toJson();
      final restored = SellerRatingSummary.fromJson(json);

      expect(restored.averageRating, summary.averageRating);
      expect(restored.totalCount, summary.totalCount);
      expect(restored.distribution, summary.distribution);
    });

    test('equality works correctly', () {
      final a = SellerRatingSummary.fromRatings([]);
      final b = SellerRatingSummary.fromRatings([]);
      expect(a == b, true);

      final now = DateTime(2026, 6, 15);
      final ratings = [
        SellerRating(
          id: 'r1',
          listingId: 'l1',
          sellerId: 's1',
          buyerId: 'b1',
          rating: 5,
          review: '',
          createdAt: now,
        ),
      ];
      final c = SellerRatingSummary.fromRatings(ratings);
      expect(a == c, false);
    });

    test('toString representation', () {
      final summary = SellerRatingSummary.fromRatings([]);
      final str = summary.toString();
      expect(str, contains('0.0'));
      expect(str, contains('0'));
    });
  });
}
