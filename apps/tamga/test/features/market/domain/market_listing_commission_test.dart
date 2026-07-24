import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/market/domain/market_listing.dart';

void main() {
  group('MarketListing commission fields', () {
    final baseTime = DateTime(2026, 6, 18);

    MarketListing createListing({
      double? commissionRate,
      int? commissionAmount,
    }) {
      return MarketListing(
        id: 'listing-1',
        horseId: 'horse-1',
        sellerId: 'seller-1',
        title: 'Test Horse',
        description: 'A test listing',
        priceAmount: 500000,
        currency: 'MNT',
        saleType: MarketSaleType.sale,
        status: MarketListingStatus.active,
        locationLabel: 'Улаанбаатар',
        disciplineTags: ['racing'],
        documentTags: [],
        mediaUrls: [],
        isSellerVerified: false,
        createdAt: baseTime,
        updatedAt: baseTime,
        commissionRate: commissionRate,
        commissionAmount: commissionAmount,
      );
    }

    test('default commissionRate is null', () {
      final listing = createListing();
      expect(listing.commissionRate, isNull);
      expect(listing.commissionAmount, isNull);
    });

    test('can set commissionRate', () {
      final listing = createListing(commissionRate: 0.05);
      expect(listing.commissionRate, 0.05);
      expect(listing.commissionAmount, isNull);
    });

    test('can set commissionRate and commissionAmount', () {
      final listing = createListing(commissionRate: 0.05, commissionAmount: 25000);
      expect(listing.commissionRate, 0.05);
      expect(listing.commissionAmount, 25000);
    });

    test('commission fields survive copyWith', () {
      final listing = createListing(commissionRate: 0.05, commissionAmount: 25000);
      final copied = listing.copyWith(title: 'New Title');

      expect(copied.commissionRate, 0.05);
      expect(copied.commissionAmount, 25000);
      expect(copied.title, 'New Title');
    });

    test('copyWith can update commissionRate', () {
      final listing = createListing(commissionRate: 0.05);
      final copied = listing.copyWith(commissionRate: 0.10);

      expect(copied.commissionRate, 0.10);
    });

    test('copyWith can clear commissionRate', () {
      final listing = createListing(commissionRate: 0.05);
      final copied = listing.copyWith(commissionRate: null);

      expect(copied.commissionRate, isNull);
    });

    test('copyWith can clear commissionAmount', () {
      final listing = createListing(commissionRate: 0.05, commissionAmount: 25000);
      final copied = listing.copyWith(commissionAmount: null);

      expect(copied.commissionAmount, isNull);
    });

    test('serialization round-trips commission fields', () {
      final original = createListing(
        commissionRate: 0.05,
        commissionAmount: 25000,
      );
      final json = original.toJson();
      final restored = MarketListing.fromJson(json);

      expect(restored.commissionRate, original.commissionRate);
      expect(restored.commissionAmount, original.commissionAmount);
    });

    test('serialization round-trips without commission fields', () {
      final original = createListing();
      final json = original.toJson();
      final restored = MarketListing.fromJson(json);

      expect(restored.commissionRate, isNull);
      expect(restored.commissionAmount, isNull);
    });

    test('toJson includes commission fields when set', () {
      final listing = createListing(
        commissionRate: 0.05,
        commissionAmount: 25000,
      );
      final json = listing.toJson();

      expect(json['commissionRate'], 0.05);
      expect(json['commissionAmount'], 25000);
    });

    test('toJson omits commission fields when null', () {
      final listing = createListing();
      final json = listing.toJson();

      expect(json['commissionRate'], isNull);
      expect(json['commissionAmount'], isNull);
    });

    test('fromJson parses commission fields correctly', () {
      final json = {
        'id': 'listing-1',
        'horseId': 'horse-1',
        'sellerId': 'seller-1',
        'title': 'Test Horse',
        'description': 'A test listing',
        'priceAmount': 500000,
        'currency': 'MNT',
        'saleType': 'sale',
        'status': 'active',
        'locationLabel': 'Улаанбаатар',
        'disciplineTags': ['racing'],
        'documentTags': [],
        'mediaUrls': [],
        'isSellerVerified': false,
        'createdAt': '2026-06-18T00:00:00.000',
        'updatedAt': '2026-06-18T00:00:00.000',
        'viewsCount': 0,
        'isFavorite': false,
        'isFeatured': false,
        'boostLevel': 'none',
        'vipLevel': 'none',
        'sellerBadge': 'none',
        'commissionRate': 0.05,
        'commissionAmount': 25000,
      };

      final listing = MarketListing.fromJson(json);
      expect(listing.commissionRate, 0.05);
      expect(listing.commissionAmount, 25000);
    });
  });
}
