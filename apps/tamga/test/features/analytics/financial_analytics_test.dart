import 'package:flutter_test/flutter_test.dart';

import 'package:tamga/src/features/market/domain/market_listing.dart'
    show MarketListing, MarketSaleType, MarketListingStatus;
import 'package:tamga/src/features/analytics/domain/financial_analytics.dart'
    show FinancialAnalytics;

void main() {
  group('FinancialAnalytics', () {
    final now = DateTime(2026, 6, 18);

    final listings = [
      MarketListing(
        id: '1',
        horseId: 'horse1',
        sellerId: 'seller1',
        title: 'Sold Listing 1',
        description: 'A sold horse',
        priceAmount: 5000000,
        currency: 'MNT',
        saleType: MarketSaleType.sale,
        status: MarketListingStatus.sold,
        locationLabel: 'Улаанбаатар',
        disciplineTags: [],
        documentTags: [],
        mediaUrls: [],
        isSellerVerified: true,
        createdAt: now.subtract(const Duration(days: 60)),
        updatedAt: now.subtract(const Duration(days: 30)),
        commissionAmount: 250000,
      ),
      MarketListing(
        id: '2',
        horseId: 'horse2',
        sellerId: 'seller1',
        title: 'Sold Listing 2',
        description: 'Another sold horse',
        priceAmount: 3000000,
        currency: 'MNT',
        saleType: MarketSaleType.sale,
        status: MarketListingStatus.sold,
        locationLabel: 'Хөвсгөл',
        disciplineTags: [],
        documentTags: [],
        mediaUrls: [],
        isSellerVerified: true,
        createdAt: now.subtract(const Duration(days: 90)),
        updatedAt: now.subtract(const Duration(days: 45)),
        commissionAmount: 150000,
      ),
      MarketListing(
        id: '3',
        horseId: 'horse3',
        sellerId: 'seller1',
        title: 'Active Listing',
        description: 'An active listing',
        priceAmount: 8000000,
        currency: 'MNT',
        saleType: MarketSaleType.sale,
        status: MarketListingStatus.active,
        locationLabel: 'Дархан',
        disciplineTags: [],
        documentTags: [],
        mediaUrls: [],
        isSellerVerified: true,
        createdAt: now.subtract(const Duration(days: 10)),
        updatedAt: now.subtract(const Duration(days: 5)),
      ),
      MarketListing(
        id: '4',
        horseId: 'horse4',
        sellerId: 'seller2',
        title: 'Expired Listing',
        description: 'An expired listing',
        priceAmount: 2000000,
        currency: 'MNT',
        saleType: MarketSaleType.lease,
        status: MarketListingStatus.expired,
        locationLabel: 'Сэлэнгэ',
        disciplineTags: [],
        documentTags: [],
        mediaUrls: [],
        isSellerVerified: false,
        createdAt: now.subtract(const Duration(days: 200)),
        updatedAt: now.subtract(const Duration(days: 100)),
      ),
    ];

    test('totalRevenue sums only sold listings', () {
      final analytics = FinancialAnalytics(listings: listings);
      expect(analytics.totalRevenue, 5000000 + 3000000);
    });

    test('totalExpenses sums all commission amounts', () {
      final analytics = FinancialAnalytics(listings: listings);
      expect(analytics.totalExpenses, 250000 + 150000);
    });

    test('totalCommission equals totalExpenses', () {
      final analytics = FinancialAnalytics(listings: listings);
      expect(analytics.totalCommission, analytics.totalExpenses);
    });

    test('soldListings counts only sold listings', () {
      final analytics = FinancialAnalytics(listings: listings);
      expect(analytics.soldListings, 2);
    });

    test('activeListings counts only active listings', () {
      final analytics = FinancialAnalytics(listings: listings);
      expect(analytics.activeListings, 1);
    });

    test('averageSalePrice returns correct average of sold listings', () {
      final analytics = FinancialAnalytics(listings: listings);
      expect(analytics.averageSalePrice, (5000000 + 3000000) ~/ 2);
    });

    test('averageSalePrice returns 0 when no sold listings', () {
      final activeOnly = listings.where((l) => l.status != MarketListingStatus.sold).toList();
      final analytics = FinancialAnalytics(listings: activeOnly);
      expect(analytics.averageSalePrice, 0);
    });

    test('roi computes correctly with expenses', () {
      // revenue = 8,000,000, expenses = 400,000
      // ROI = ((8,000,000 - 400,000) / 400,000) * 100
      final analytics = FinancialAnalytics(listings: listings);
      final expectedRoi = ((5000000 + 3000000 - (250000 + 150000)) / (250000 + 150000)) * 100;
      expect(analytics.roi, expectedRoi);
    });

    test('roi returns infinity when no expenses but has revenue', () {
      final noCommission = [
        MarketListing(
          id: '5',
          horseId: 'horse5',
          sellerId: 'seller1',
          title: 'Sold No Commission',
          description: 'Sold without commission',
          priceAmount: 1000000,
          currency: 'MNT',
          saleType: MarketSaleType.sale,
          status: MarketListingStatus.sold,
          locationLabel: 'Улаанбаатар',
          disciplineTags: [],
          documentTags: [],
          mediaUrls: [],
          isSellerVerified: true,
          createdAt: now.subtract(const Duration(days: 30)),
          updatedAt: now.subtract(const Duration(days: 15)),
          commissionAmount: null,
        ),
      ];
      final analytics = FinancialAnalytics(listings: noCommission);
      expect(analytics.roi, double.infinity);
    });

    test('roi returns 0 when no revenue and no expenses', () {
      final emptyData = [
        MarketListing(
          id: '6',
          horseId: 'horse6',
          sellerId: 'seller1',
          title: 'Active Only',
          description: 'No sales yet',
          priceAmount: 1000000,
          currency: 'MNT',
          saleType: MarketSaleType.sale,
          status: MarketListingStatus.active,
          locationLabel: 'Улаанбаатар',
          disciplineTags: [],
          documentTags: [],
          mediaUrls: [],
          isSellerVerified: true,
          createdAt: now,
          updatedAt: now,
        ),
      ];
      final analytics = FinancialAnalytics(listings: emptyData);
      expect(analytics.roi, 0.0);
    });

    test('empty returns correct static empty instance', () {
      final analytics = FinancialAnalytics.empty;
      expect(analytics.listings, []);
      expect(analytics.totalRevenue, 0);
      expect(analytics.totalExpenses, 0);
      expect(analytics.roi, 0.0);
      expect(analytics.activeListings, 0);
      expect(analytics.soldListings, 0);
    });
  });
}
