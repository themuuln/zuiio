import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/market/domain/market_listing.dart';
import 'package:tamga/src/features/payments/domain/payment_request.dart';

void main() {
  group('BoostLevel', () {
    test('has correct labels', () {
      expect(BoostLevel.none.label, 'Энгийн');
      expect(BoostLevel.standard.label, 'Сурталчилгаа');
      expect(BoostLevel.premium.label, 'Дээд зэрэглэл');
    });

    test('has correct prices', () {
      expect(BoostLevel.none.priceMnt, 0);
      expect(BoostLevel.standard.priceMnt, 2000);
      expect(BoostLevel.premium.priceMnt, 5000);
    });

    test('has correct durations', () {
      expect(BoostLevel.none.duration, Duration.zero);
      expect(BoostLevel.standard.duration, const Duration(hours: 24));
      expect(BoostLevel.premium.duration, const Duration(hours: 72));
    });

    test('has correct priorities', () {
      expect(BoostLevel.none.priority, 0);
      expect(BoostLevel.standard.priority, 1);
      expect(BoostLevel.premium.priority, 2);
    });
  });

  group('VipLevel', () {
    test('has correct labels', () {
      expect(VipLevel.none.label, 'Энгийн');
      expect(VipLevel.standard.label, 'VIP');
      expect(VipLevel.premium.label, 'VIP Premium');
    });

    test('has correct prices', () {
      expect(VipLevel.none.priceMnt, 0);
      expect(VipLevel.standard.priceMnt, 5000);
      expect(VipLevel.premium.priceMnt, 15000);
    });

    test('has correct durations', () {
      expect(VipLevel.none.duration, Duration.zero);
      expect(VipLevel.standard.duration, const Duration(days: 7));
      expect(VipLevel.premium.duration, const Duration(days: 30));
    });

    test('has correct priorities', () {
      expect(VipLevel.none.priority, 0);
      expect(VipLevel.standard.priority, 3);
      expect(VipLevel.premium.priority, 4);
    });
  });

  group('SellerBadgeType', () {
    test('has correct labels', () {
      expect(SellerBadgeType.none.label, 'Энгийн');
      expect(SellerBadgeType.shop.label, 'Дэлгүүр');
    });

    test('has correct prices', () {
      expect(SellerBadgeType.none.priceMnt, 0);
      expect(SellerBadgeType.shop.priceMnt, 10000);
    });

    test('has correct durations', () {
      expect(SellerBadgeType.none.duration, Duration.zero);
      expect(SellerBadgeType.shop.duration, const Duration(days: 365));
    });
  });

  group('MarketListing boost fields', () {
    MarketListing createTestListing({
      BoostLevel boostLevel = BoostLevel.none,
      DateTime? boostExpiresAt,
      VipLevel vipLevel = VipLevel.none,
      DateTime? vipExpiresAt,
      SellerBadgeType sellerBadge = SellerBadgeType.none,
      DateTime? sellerBadgeExpiresAt,
    }) {
      return MarketListing(
        id: 'test-1',
        horseId: 'horse-1',
        sellerId: 'seller-1',
        title: 'Test Listing',
        description: 'Test description',
        priceAmount: 1000000,
        currency: 'MNT',
        saleType: MarketSaleType.sale,
        status: MarketListingStatus.active,
        locationLabel: 'Улаанбаатар',
        disciplineTags: const [],
        documentTags: const [],
        mediaUrls: const [],
        isSellerVerified: true,
        createdAt: DateTime(2026, 1, 1),
        updatedAt: DateTime(2026, 1, 1),
        boostLevel: boostLevel,
        boostExpiresAt: boostExpiresAt,
        vipLevel: vipLevel,
        vipExpiresAt: vipExpiresAt,
        sellerBadge: sellerBadge,
        sellerBadgeExpiresAt: sellerBadgeExpiresAt,
      );
    }

    test('isBoosted returns true when boost is active and not expired', () {
      final listing = createTestListing(
        boostLevel: BoostLevel.standard,
        boostExpiresAt: DateTime.now().add(const Duration(hours: 12)),
      );
      expect(listing.isBoosted, true);
    });

    test('isBoosted returns false when boost is expired', () {
      final listing = createTestListing(
        boostLevel: BoostLevel.standard,
        boostExpiresAt: DateTime.now().subtract(const Duration(hours: 1)),
      );
      expect(listing.isBoosted, false);
    });

    test('isBoosted returns false when boost level is none', () {
      final listing = createTestListing(boostLevel: BoostLevel.none);
      expect(listing.isBoosted, false);
    });

    test('isVip returns true when VIP is active and not expired', () {
      final listing = createTestListing(
        vipLevel: VipLevel.standard,
        vipExpiresAt: DateTime.now().add(const Duration(days: 5)),
      );
      expect(listing.isVip, true);
    });

    test('isVip returns false when VIP is expired', () {
      final listing = createTestListing(
        vipLevel: VipLevel.standard,
        vipExpiresAt: DateTime.now().subtract(const Duration(days: 1)),
      );
      expect(listing.isVip, false);
    });

    test(
      'hasSellerBadge returns true when badge is active and not expired',
      () {
        final listing = createTestListing(
          sellerBadge: SellerBadgeType.shop,
          sellerBadgeExpiresAt: DateTime.now().add(const Duration(days: 300)),
        );
        expect(listing.hasSellerBadge, true);
      },
    );

    test('hasSellerBadge returns false when badge is expired', () {
      final listing = createTestListing(
        sellerBadge: SellerBadgeType.shop,
        sellerBadgeExpiresAt: DateTime.now().subtract(const Duration(days: 1)),
      );
      expect(listing.hasSellerBadge, false);
    });

    test('sortPriority combines VIP and boost priorities', () {
      // VIP standard (3 * 10 = 30) + boost standard (1) = 31
      final listing = createTestListing(
        vipLevel: VipLevel.standard,
        vipExpiresAt: DateTime.now().add(const Duration(days: 5)),
        boostLevel: BoostLevel.standard,
        boostExpiresAt: DateTime.now().add(const Duration(hours: 12)),
      );
      expect(listing.sortPriority, 31);
    });

    test('sortPriority is 0 for no boosts', () {
      final listing = createTestListing();
      expect(listing.sortPriority, 0);
    });

    test('VIP standard outranks boost premium', () {
      final vipStandard = createTestListing(
        vipLevel: VipLevel.standard,
        vipExpiresAt: DateTime.now().add(const Duration(days: 5)),
      );
      final boostPremium = createTestListing(
        boostLevel: BoostLevel.premium,
        boostExpiresAt: DateTime.now().add(const Duration(hours: 48)),
      );
      expect(vipStandard.sortPriority, greaterThan(boostPremium.sortPriority));
    });
  });

  group('MarketListing serialization', () {
    test('toJson/fromJson round-trip preserves boost fields', () {
      final now = DateTime.now();
      final listing = MarketListing(
        id: 'test-1',
        horseId: 'horse-1',
        sellerId: 'seller-1',
        title: 'Test Listing',
        description: 'Test description',
        priceAmount: 1000000,
        currency: 'MNT',
        saleType: MarketSaleType.sale,
        status: MarketListingStatus.active,
        locationLabel: 'Улаанбаатар',
        disciplineTags: const ['dressage'],
        documentTags: const ['vet Certificate'],
        mediaUrls: const ['https://example.com/image.jpg'],
        isSellerVerified: true,
        createdAt: now,
        updatedAt: now,
        boostLevel: BoostLevel.premium,
        boostExpiresAt: now.add(const Duration(hours: 72)),
        vipLevel: VipLevel.standard,
        vipExpiresAt: now.add(const Duration(days: 7)),
        sellerBadge: SellerBadgeType.shop,
        sellerBadgeExpiresAt: now.add(const Duration(days: 365)),
      );

      final json = listing.toJson();
      final restored = MarketListing.fromJson(json);

      expect(restored.boostLevel, BoostLevel.premium);
      expect(restored.vipLevel, VipLevel.standard);
      expect(restored.sellerBadge, SellerBadgeType.shop);
      expect(restored.boostExpiresAt, listing.boostExpiresAt);
      expect(restored.vipExpiresAt, listing.vipExpiresAt);
      expect(restored.sellerBadgeExpiresAt, listing.sellerBadgeExpiresAt);
    });

    test('fromJson handles missing boost fields gracefully', () {
      final json = {
        'id': 'test-1',
        'horseId': 'horse-1',
        'sellerId': 'seller-1',
        'title': 'Test',
        'description': 'Desc',
        'priceAmount': 1000,
        'currency': 'MNT',
        'saleType': 'sale',
        'status': 'active',
        'locationLabel': 'UB',
        'disciplineTags': <String>[],
        'documentTags': <String>[],
        'mediaUrls': <String>[],
        'isSellerVerified': false,
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      };

      final listing = MarketListing.fromJson(json);
      expect(listing.boostLevel, BoostLevel.none);
      expect(listing.vipLevel, VipLevel.none);
      expect(listing.sellerBadge, SellerBadgeType.none);
      expect(listing.boostExpiresAt, isNull);
      expect(listing.vipExpiresAt, isNull);
      expect(listing.sellerBadgeExpiresAt, isNull);
    });
  });

  group('MarketSaleType', () {
    test('has correct labels', () {
      expect(MarketSaleType.sale.label, 'Зарна');
      expect(MarketSaleType.lease.label, 'Түрээс');
      expect(MarketSaleType.trade.label, 'Солилцоо');
      expect(MarketSaleType.stud.label, 'Ороо / Хээлтүүлэг');
    });
  });

  group('MarketListingStatus', () {
    test('has correct labels', () {
      expect(MarketListingStatus.active.label, 'Идэвхтэй');
      expect(
        MarketListingStatus.pendingVerification.label,
        'Баталгаажуулалт хүлээж буй',
      );
      expect(MarketListingStatus.sold.label, 'Борлуулсан');
      expect(MarketListingStatus.expired.label, 'Хугацаа дууссан');
      expect(MarketListingStatus.rejected.label, 'Татгалзсан');
    });
  });

  group('MarketListing constructor', () {
    test('sets default values for optional fields', () {
      final listing = MarketListing(
        id: 'test-1',
        horseId: 'horse-1',
        sellerId: 'seller-1',
        title: 'Test',
        description: 'Desc',
        priceAmount: 1000000,
        currency: 'MNT',
        saleType: MarketSaleType.sale,
        status: MarketListingStatus.active,
        locationLabel: 'UB',
        disciplineTags: const [],
        documentTags: const [],
        mediaUrls: const [],
        isSellerVerified: true,
        createdAt: DateTime(2026, 1, 1),
        updatedAt: DateTime(2026, 1, 1),
      );
      expect(listing.viewsCount, 0);
      expect(listing.isFavorite, false);
      expect(listing.isFeatured, false);
      expect(listing.boostLevel, BoostLevel.none);
      expect(listing.boostExpiresAt, isNull);
      expect(listing.vipLevel, VipLevel.none);
      expect(listing.vipExpiresAt, isNull);
      expect(listing.sellerBadge, SellerBadgeType.none);
      expect(listing.sellerBadgeExpiresAt, isNull);
    });
  });

  group('MarketListing derived properties', () {
    MarketListing createStatusListing(MarketListingStatus status) {
      return MarketListing(
        id: 'test-1',
        horseId: 'horse-1',
        sellerId: 'seller-1',
        title: 'Test',
        description: 'Desc',
        priceAmount: 1000000,
        currency: 'MNT',
        saleType: MarketSaleType.sale,
        status: status,
        locationLabel: 'UB',
        disciplineTags: const [],
        documentTags: const [],
        mediaUrls: const [],
        isSellerVerified: true,
        createdAt: DateTime(2026, 1, 1),
        updatedAt: DateTime(2026, 1, 1),
      );
    }

    test('isActive returns true for active status', () {
      expect(createStatusListing(MarketListingStatus.active).isActive, true);
    });

    test('isPending returns true for pendingVerification', () {
      expect(
        createStatusListing(MarketListingStatus.pendingVerification).isPending,
        true,
      );
    });

    test('isSold returns true for sold status', () {
      expect(createStatusListing(MarketListingStatus.sold).isSold, true);
    });

    test('isExpired returns true for expired status', () {
      expect(createStatusListing(MarketListingStatus.expired).isExpired, true);
    });

    test('isPublished returns true for active and pending', () {
      expect(
        createStatusListing(MarketListingStatus.active).isPublished,
        true,
      );
      expect(
        createStatusListing(MarketListingStatus.pendingVerification)
            .isPublished,
        true,
      );
    });

    test('isPublished returns false for non-published statuses', () {
      expect(
        createStatusListing(MarketListingStatus.sold).isPublished,
        false,
      );
      expect(
        createStatusListing(MarketListingStatus.expired).isPublished,
        false,
      );
      expect(
        createStatusListing(MarketListingStatus.rejected).isPublished,
        false,
      );
    });

    test('trustScore reflects seller verification and document/media presence', () {
      final verifiedDocMedia = MarketListing(
        id: 'test-1',
        horseId: 'horse-1',
        sellerId: 'seller-1',
        title: 'Test',
        description: 'Desc',
        priceAmount: 1000000,
        currency: 'MNT',
        saleType: MarketSaleType.sale,
        status: MarketListingStatus.active,
        locationLabel: 'UB',
        disciplineTags: const [],
        documentTags: const ['doc1', 'doc2'],
        mediaUrls: const ['https://example.com/img.jpg'],
        isSellerVerified: true,
        createdAt: DateTime(2026, 1, 1),
        updatedAt: DateTime(2026, 1, 1),
      );
      // 35 (verified) + 24 (2 docs * 12) + 20 (has media) = 79
      expect(verifiedDocMedia.trustScore, 79);
    });

    test('trustScore caps document contribution at 45', () {
      final manyDocs = MarketListing(
        id: 'test-1',
        horseId: 'horse-1',
        sellerId: 'seller-1',
        title: 'Test',
        description: 'Desc',
        priceAmount: 1000000,
        currency: 'MNT',
        saleType: MarketSaleType.sale,
        status: MarketListingStatus.active,
        locationLabel: 'UB',
        disciplineTags: const [],
        documentTags: const ['a', 'b', 'c', 'd', 'e'],
        mediaUrls: const ['https://example.com/img.jpg'],
        isSellerVerified: false,
        createdAt: DateTime(2026, 1, 1),
        updatedAt: DateTime(2026, 1, 1),
      );
      // 0 (not verified) + 45 (5 docs capped at 45) + 20 = 65
      expect(manyDocs.trustScore, 65);
    });
  });

  group('MarketListing copyWith', () {
    test('updates specified fields', () {
      final listing = MarketListing(
        id: 'test-1',
        horseId: 'horse-1',
        sellerId: 'seller-1',
        title: 'Original',
        description: 'Desc',
        priceAmount: 1000000,
        currency: 'MNT',
        saleType: MarketSaleType.sale,
        status: MarketListingStatus.active,
        locationLabel: 'UB',
        disciplineTags: const [],
        documentTags: const [],
        mediaUrls: const [],
        isSellerVerified: true,
        createdAt: DateTime(2026, 1, 1),
        updatedAt: DateTime(2026, 1, 1),
      );
      final updated = listing.copyWith(
        title: 'Updated',
        priceAmount: 2000000,
        status: MarketListingStatus.sold,
      );
      expect(updated.title, 'Updated');
      expect(updated.priceAmount, 2000000);
      expect(updated.status, MarketListingStatus.sold);
      expect(updated.id, 'test-1');
      expect(updated.horseId, 'horse-1');
    });
  });

  group('MarketListing status serialization', () {
    test('fromJson handles legacy published status as active', () {
      final json = {
        'id': 'test-1',
        'horseId': 'horse-1',
        'sellerId': 'seller-1',
        'title': 'Test',
        'description': 'Desc',
        'priceAmount': 1000,
        'currency': 'MNT',
        'saleType': 'sale',
        'status': 'published',
        'locationLabel': 'UB',
        'disciplineTags': <String>[],
        'documentTags': <String>[],
        'mediaUrls': <String>[],
        'isSellerVerified': false,
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      };
      final listing = MarketListing.fromJson(json);
      expect(listing.status, MarketListingStatus.active);
    });

    test('fromJson handles draft status as pendingVerification', () {
      final json = {
        'id': 'test-1',
        'horseId': 'horse-1',
        'sellerId': 'seller-1',
        'title': 'Test',
        'description': 'Desc',
        'priceAmount': 1000,
        'currency': 'MNT',
        'saleType': 'sale',
        'status': 'draft',
        'locationLabel': 'UB',
        'disciplineTags': <String>[],
        'documentTags': <String>[],
        'mediaUrls': <String>[],
        'isSellerVerified': false,
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      };
      final listing = MarketListing.fromJson(json);
      expect(listing.status, MarketListingStatus.pendingVerification);
    });

    test('fromJson handles withdrawn status as expired', () {
      final json = {
        'id': 'test-1',
        'horseId': 'horse-1',
        'sellerId': 'seller-1',
        'title': 'Test',
        'description': 'Desc',
        'priceAmount': 1000,
        'currency': 'MNT',
        'saleType': 'sale',
        'status': 'withdrawn',
        'locationLabel': 'UB',
        'disciplineTags': <String>[],
        'documentTags': <String>[],
        'mediaUrls': <String>[],
        'isSellerVerified': false,
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      };
      final listing = MarketListing.fromJson(json);
      expect(listing.status, MarketListingStatus.expired);
    });
  });

  group('MarketListing toString', () {
    test('returns string representation without error', () {
      final listing = MarketListing(
        id: 'test-listing-1',
        horseId: 'horse-1',
        sellerId: 'seller-1',
        title: 'Test Listing',
        description: 'Desc',
        priceAmount: 1000000,
        currency: 'MNT',
        saleType: MarketSaleType.sale,
        status: MarketListingStatus.active,
        locationLabel: 'UB',
        disciplineTags: const [],
        documentTags: const [],
        mediaUrls: const [],
        isSellerVerified: true,
        createdAt: DateTime(2026, 1, 1),
        updatedAt: DateTime(2026, 1, 1),
      );
      expect(listing.toString(), isA<String>());
    });
  });

  group('PaymentType', () {
    test('has correct display names', () {
      expect(PaymentType.subscription.displayName, 'Захиалга');
      expect(PaymentType.listingBoost.displayName, 'Сурталчилгаа');
      expect(PaymentType.sellerBadge.displayName, 'Дэлгүүрийн тэмдэг');
    });
  });

  group('PaymentRequest paymentType', () {
    test('defaults to subscription', () {
      final request = PaymentRequest(
        id: 'test-1',
        userId: 'user-1',
        tier: SubscriptionTier.free,
        code: 'TG-TEST-1234',
        amountMnt: 0,
        status: PaymentStatus.pending,
        createdAt: DateTime.now(),
        expiresAt: DateTime.now().add(const Duration(hours: 72)),
      );
      expect(request.paymentType, PaymentType.subscription);
    });

    test('serialization preserves paymentType', () {
      final request = PaymentRequest(
        id: 'test-1',
        userId: 'user-1',
        tier: SubscriptionTier.pro,
        paymentType: PaymentType.listingBoost,
        code: 'TG-BOOST-1234',
        amountMnt: 5000,
        status: PaymentStatus.pending,
        createdAt: DateTime.now(),
        expiresAt: DateTime.now().add(const Duration(hours: 72)),
      );

      // Verify the field is set correctly
      expect(request.paymentType, PaymentType.listingBoost);
      expect(request.tier, SubscriptionTier.pro);
      expect(request.code, 'TG-BOOST-1234');
    });
  });
}
