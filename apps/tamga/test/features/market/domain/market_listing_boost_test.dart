import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/market/domain/market_listing.dart';
import 'package:tamga/src/features/market/application/market_providers.dart';

void main() {
  group('MarketListing boost/VIP/badge integration', () {
    MarketListing createTestListing({
      BoostLevel boostLevel = BoostLevel.none,
      DateTime? boostExpiresAt,
      VipLevel vipLevel = VipLevel.none,
      DateTime? vipExpiresAt,
      SellerBadgeType sellerBadge = SellerBadgeType.none,
      DateTime? sellerBadgeExpiresAt,
      int viewsCount = 0,
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
        viewsCount: viewsCount,
        boostLevel: boostLevel,
        boostExpiresAt: boostExpiresAt,
        vipLevel: vipLevel,
        vipExpiresAt: vipExpiresAt,
        sellerBadge: sellerBadge,
        sellerBadgeExpiresAt: sellerBadgeExpiresAt,
      );
    }

    group('sortPriority', () {
      test('returns 0 for listing with no boosts', () {
        final listing = createTestListing();
        expect(listing.sortPriority, 0);
      });

      test('returns correct priority for active boost', () {
        final listing = createTestListing(
          boostLevel: BoostLevel.standard,
          boostExpiresAt: DateTime.now().add(const Duration(hours: 12)),
        );
        expect(listing.sortPriority, 1);
      });

      test('returns correct priority for active VIP', () {
        final listing = createTestListing(
          vipLevel: VipLevel.standard,
          vipExpiresAt: DateTime.now().add(const Duration(days: 5)),
        );
        // VIP standard priority (3) * 10 = 30
        expect(listing.sortPriority, 30);
      });

      test('combines VIP and boost priorities correctly', () {
        final listing = createTestListing(
          vipLevel: VipLevel.premium,
          vipExpiresAt: DateTime.now().add(const Duration(days: 20)),
          boostLevel: BoostLevel.premium,
          boostExpiresAt: DateTime.now().add(const Duration(hours: 48)),
        );
        // VIP premium priority (4) * 10 = 40 + boost premium priority (2) = 42
        expect(listing.sortPriority, 42);
      });

      test('returns 0 for expired boost', () {
        final listing = createTestListing(
          boostLevel: BoostLevel.standard,
          boostExpiresAt: DateTime.now().subtract(const Duration(hours: 1)),
        );
        expect(listing.sortPriority, 0);
      });

      test('returns 0 for expired VIP', () {
        final listing = createTestListing(
          vipLevel: VipLevel.standard,
          vipExpiresAt: DateTime.now().subtract(const Duration(days: 1)),
        );
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
        // VIP standard (30) > boost premium (2)
        expect(
          vipStandard.sortPriority,
          greaterThan(boostPremium.sortPriority),
        );
      });
    });

    group('isActive / isBoosted / isVip / hasSellerBadge', () {
      test('isActive returns true for active status', () {
        final listing = createTestListing();
        expect(listing.isActive, true);
      });

      test('isPublished returns true for active and pending status', () {
        final active = createTestListing();
        final pending = MarketListing(
          id: 'test-2',
          horseId: 'horse-1',
          sellerId: 'seller-1',
          title: 'Test Listing',
          description: 'Test description',
          priceAmount: 1000000,
          currency: 'MNT',
          saleType: MarketSaleType.sale,
          status: MarketListingStatus.pendingVerification,
          locationLabel: 'Улаанбаатар',
          disciplineTags: const [],
          documentTags: const [],
          mediaUrls: const [],
          isSellerVerified: false,
          createdAt: DateTime(2026, 1, 1),
          updatedAt: DateTime(2026, 1, 1),
        );
        expect(active.isPublished, true);
        expect(pending.isPublished, true);
      });

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
          sellerBadgeExpiresAt: DateTime.now().subtract(
            const Duration(days: 1),
          ),
        );
        expect(listing.hasSellerBadge, false);
      });
    });

    group('copyWith', () {
      test('copyWith preserves boost fields', () {
        final original = createTestListing(
          boostLevel: BoostLevel.premium,
          boostExpiresAt: DateTime(2026, 2, 1),
          vipLevel: VipLevel.standard,
          vipExpiresAt: DateTime(2026, 2, 7),
          sellerBadge: SellerBadgeType.shop,
          sellerBadgeExpiresAt: DateTime(2026, 12, 31),
        );

        final copied = original.copyWith(title: 'Updated Title');

        expect(copied.title, 'Updated Title');
        expect(copied.boostLevel, BoostLevel.premium);
        expect(copied.boostExpiresAt, DateTime(2026, 2, 1));
        expect(copied.vipLevel, VipLevel.standard);
        expect(copied.vipExpiresAt, DateTime(2026, 2, 7));
        expect(copied.sellerBadge, SellerBadgeType.shop);
        expect(copied.sellerBadgeExpiresAt, DateTime(2026, 12, 31));
      });

      test('copyWith can override boost fields', () {
        final original = createTestListing(
          boostLevel: BoostLevel.standard,
          boostExpiresAt: DateTime(2026, 2, 1),
        );

        final copied = original.copyWith(
          boostLevel: BoostLevel.premium,
          boostExpiresAt: DateTime(2026, 3, 1),
        );

        expect(copied.boostLevel, BoostLevel.premium);
        expect(copied.boostExpiresAt, DateTime(2026, 3, 1));
      });
    });
  });

  group('MarketSort boosted', () {
    test('has correct label', () {
      expect(MarketSort.boosted.label, 'Дэмжсэн');
    });

    test('MarketSort enum includes boosted', () {
      expect(MarketSort.values.length, 6);
      expect(MarketSort.values, contains(MarketSort.boosted));
    });
  });

  group('BoostLevel extension', () {
    test('priority increases with level', () {
      expect(BoostLevel.none.priority, lessThan(BoostLevel.standard.priority));
      expect(
        BoostLevel.standard.priority,
        lessThan(BoostLevel.premium.priority),
      );
    });

    test('priceMnt increases with level', () {
      expect(BoostLevel.none.priceMnt, lessThan(BoostLevel.standard.priceMnt));
      expect(
        BoostLevel.standard.priceMnt,
        lessThan(BoostLevel.premium.priceMnt),
      );
    });

    test('duration increases with level', () {
      expect(BoostLevel.none.duration, lessThan(BoostLevel.standard.duration));
      expect(
        BoostLevel.standard.duration,
        lessThan(BoostLevel.premium.duration),
      );
    });
  });

  group('VipLevel extension', () {
    test('priority increases with level', () {
      expect(VipLevel.none.priority, lessThan(VipLevel.standard.priority));
      expect(VipLevel.standard.priority, lessThan(VipLevel.premium.priority));
    });

    test('priceMnt increases with level', () {
      expect(VipLevel.none.priceMnt, lessThan(VipLevel.standard.priceMnt));
      expect(VipLevel.standard.priceMnt, lessThan(VipLevel.premium.priceMnt));
    });

    test('duration increases with level', () {
      expect(VipLevel.none.duration, lessThan(VipLevel.standard.duration));
      expect(VipLevel.standard.duration, lessThan(VipLevel.premium.duration));
    });
  });

  group('SellerBadgeType extension', () {
    test('priceMnt increases with level', () {
      expect(
        SellerBadgeType.none.priceMnt,
        lessThan(SellerBadgeType.shop.priceMnt),
      );
    });

    test('duration increases with level', () {
      expect(
        SellerBadgeType.none.duration,
        lessThan(SellerBadgeType.shop.duration),
      );
    });
  });
}
