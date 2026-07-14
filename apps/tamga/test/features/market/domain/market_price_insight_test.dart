import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/market/domain/market_listing.dart';
import 'package:tamga/src/features/market/domain/market_price_insight.dart';
import 'package:tamga/src/features/market/domain/price_history.dart';

void main() {
  // ── Helpers ────────────────────────────────────────────────────

  MarketListing createListing({
    int priceAmount = 10000000,
    MarketSaleType saleType = MarketSaleType.sale,
    String locationLabel = 'Архангай',
  }) {
    return MarketListing(
      id: 'ml-1',
      horseId: 'h1',
      sellerId: 's1',
      title: 'Test Horse',
      description: 'Test',
      priceAmount: priceAmount,
      currency: 'MNT',
      saleType: saleType,
      status: MarketListingStatus.active,
      locationLabel: locationLabel,
      disciplineTags: const [],
      documentTags: const [],
      mediaUrls: const [],
      isSellerVerified: false,
      createdAt: DateTime(2026, 1, 1),
      updatedAt: DateTime(2026, 1, 1),
    );
  }

  PriceHistoryRecord createHistory({
    required int priceAmount,
    required MarketSaleType saleType,
    String region = 'Архангай',
  }) {
    return PriceHistoryRecord(
      id: 'ph-$priceAmount',
      horseName: 'Test',
      lineageRootId: 'test',
      priceAmount: priceAmount,
      currency: 'MNT',
      saleType: saleType,
      date: DateTime(2025, 6, 1),
      region: region,
    );
  }

  // ── calculatePriceInsight ─────────────────────────────────────

  group('calculatePriceInsight', () {
    test('returns unknown when no history matches sale type', () {
      final listing = createListing(saleType: MarketSaleType.sale);
      final history = [
        createHistory(priceAmount: 5000000, saleType: MarketSaleType.lease),
      ];

      final insight = calculatePriceInsight(listing: listing, history: history);

      expect(insight.comparableCount, 0);
      expect(insight.verdict, PriceVerdict.unknown);
      expect(insight.hasData, isFalse);
    });

    test('returns fair market when price is within 15% of average', () {
      final listing = createListing(priceAmount: 10000000);
      final history = [
        createHistory(priceAmount: 9000000, saleType: MarketSaleType.sale),
        createHistory(priceAmount: 11000000, saleType: MarketSaleType.sale),
      ];

      final insight = calculatePriceInsight(listing: listing, history: history);

      expect(insight.comparableCount, 2);
      expect(insight.verdict, PriceVerdict.fairMarket);
      expect(insight.hasData, isTrue);
      expect(insight.averagePrice, 10000000);
    });

    test('returns below market when price is well below average', () {
      final listing = createListing(priceAmount: 5000000);
      final history = [
        createHistory(priceAmount: 10000000, saleType: MarketSaleType.sale),
        createHistory(priceAmount: 12000000, saleType: MarketSaleType.sale),
      ];

      final insight = calculatePriceInsight(listing: listing, history: history);

      expect(insight.verdict, PriceVerdict.belowMarket);
      expect(insight.averagePrice, 11000000);
      expect(insight.minPrice, 10000000);
      expect(insight.maxPrice, 12000000);
    });

    test('returns above market when price is well above average', () {
      final listing = createListing(priceAmount: 20000000);
      final history = [
        createHistory(priceAmount: 8000000, saleType: MarketSaleType.sale),
        createHistory(priceAmount: 10000000, saleType: MarketSaleType.sale),
      ];

      final insight = calculatePriceInsight(listing: listing, history: history);

      expect(insight.verdict, PriceVerdict.aboveMarket);
      expect(insight.averagePrice, 9000000);
    });

    test('prefers same-region comparables when available', () {
      final listing = createListing(
        priceAmount: 10000000,
        locationLabel: 'Архангай',
      );
      final history = [
        createHistory(
          priceAmount: 5000000,
          saleType: MarketSaleType.sale,
          region: 'Дархан',
        ),
        createHistory(
          priceAmount: 11000000,
          saleType: MarketSaleType.sale,
          region: 'Архангай',
        ),
        createHistory(
          priceAmount: 9000000,
          saleType: MarketSaleType.sale,
          region: 'Архангай',
        ),
      ];

      final insight = calculatePriceInsight(listing: listing, history: history);

      // Should use only Архангай comparables (2 items)
      expect(insight.comparableCount, 2);
      expect(insight.averagePrice, 10000000);
      expect(insight.verdict, PriceVerdict.fairMarket);
    });

    test('falls back to all comparables when no same-region matches', () {
      final listing = createListing(
        priceAmount: 10000000,
        locationLabel: 'Сүхбаатар',
      );
      final history = [
        createHistory(
          priceAmount: 8000000,
          saleType: MarketSaleType.sale,
          region: 'Архангай',
        ),
        createHistory(
          priceAmount: 12000000,
          saleType: MarketSaleType.sale,
          region: 'Дархан',
        ),
      ];

      final insight = calculatePriceInsight(listing: listing, history: history);

      // Should use all 2 comparables (no Сүхбаатар matches)
      expect(insight.comparableCount, 2);
      expect(insight.averagePrice, 10000000);
    });

    test('calculates percentile correctly', () {
      final listing = createListing(priceAmount: 9000000);
      final history = [
        createHistory(priceAmount: 5000000, saleType: MarketSaleType.sale),
        createHistory(priceAmount: 8000000, saleType: MarketSaleType.sale),
        createHistory(priceAmount: 10000000, saleType: MarketSaleType.sale),
        createHistory(priceAmount: 15000000, saleType: MarketSaleType.sale),
      ];

      final insight = calculatePriceInsight(listing: listing, history: history);

      // 2 out of 4 are cheaper → 50th percentile
      expect(insight.percentile, 50.0);
    });
  });

  // ── MarketPriceInsight labels ─────────────────────────────────

  group('MarketPriceInsight labels', () {
    test('verdictLabel returns correct strings', () {
      const below = MarketPriceInsight(
        listingPrice: 0,
        comparableCount: 1,
        verdict: PriceVerdict.belowMarket,
      );
      expect(below.verdictLabel, 'Дундажаас доогуур');

      const fair = MarketPriceInsight(
        listingPrice: 0,
        comparableCount: 1,
        verdict: PriceVerdict.fairMarket,
      );
      expect(fair.verdictLabel, 'Шударга үнэ');

      const above = MarketPriceInsight(
        listingPrice: 0,
        comparableCount: 1,
        verdict: PriceVerdict.aboveMarket,
      );
      expect(above.verdictLabel, 'Дундажаас дээгүүр');

      const unknown = MarketPriceInsight(
        listingPrice: 0,
        comparableCount: 0,
        verdict: PriceVerdict.unknown,
      );
      expect(unknown.verdictLabel, 'Мэдээлэл хүрэлцэхгүй');
    });

    test('buyerMessage returns appropriate text', () {
      const below = MarketPriceInsight(
        listingPrice: 0,
        comparableCount: 1,
        verdict: PriceVerdict.belowMarket,
      );
      expect(below.buyerMessage, contains('доогуур'));

      const fair = MarketPriceInsight(
        listingPrice: 0,
        comparableCount: 1,
        verdict: PriceVerdict.fairMarket,
      );
      expect(fair.buyerMessage, contains('тэнцүү'));

      const above = MarketPriceInsight(
        listingPrice: 0,
        comparableCount: 1,
        verdict: PriceVerdict.aboveMarket,
      );
      expect(above.buyerMessage, contains('дээгүүр'));
    });

    test('percentileLabel returns correct ranges', () {
      const p25 = MarketPriceInsight(
        listingPrice: 0,
        comparableCount: 1,
        percentile: 20,
      );
      expect(p25.percentileLabel, contains('25%'));

      const p50 = MarketPriceInsight(
        listingPrice: 0,
        comparableCount: 1,
        percentile: 40,
      );
      expect(p50.percentileLabel, contains('50%'));

      const p75 = MarketPriceInsight(
        listingPrice: 0,
        comparableCount: 1,
        percentile: 60,
      );
      expect(p75.percentileLabel, contains('75%'));

      const p100 = MarketPriceInsight(
        listingPrice: 0,
        comparableCount: 1,
        percentile: 90,
      );
      expect(p100.percentileLabel, contains('top 25%'));
    });

    test('hasData returns true when comparableCount > 0', () {
      const withData = MarketPriceInsight(listingPrice: 0, comparableCount: 3);
      expect(withData.hasData, isTrue);

      const noData = MarketPriceInsight(listingPrice: 0, comparableCount: 0);
      expect(noData.hasData, isFalse);
    });
  });
}
