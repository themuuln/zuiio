import 'market_listing.dart';
import 'price_history.dart';

/// Price intelligence for a listing, comparing it against historical sales.
class MarketPriceInsight {
  const MarketPriceInsight({
    required this.listingPrice,
    required this.comparableCount,
    this.averagePrice,
    this.minPrice,
    this.maxPrice,
    this.verdict = PriceVerdict.unknown,
    this.percentile = 0,
  });

  final int listingPrice;
  final int comparableCount;
  final int? averagePrice;
  final int? minPrice;
  final int? maxPrice;
  final PriceVerdict verdict;
  final double percentile;

  bool get hasData => comparableCount > 0;

  String get verdictLabel => switch (verdict) {
    PriceVerdict.belowMarket => 'Дундажаас доогуур',
    PriceVerdict.fairMarket => 'Шударга үнэ',
    PriceVerdict.aboveMarket => 'Дундажаас дээгүүр',
    PriceVerdict.unknown => 'Мэдээлэл хүрэлцэхгүй',
  };

  String get percentileLabel {
    if (percentile == 0) return '';
    if (percentile <= 25) return 'Дээд хүрээнд (25%)';
    if (percentile <= 50) return 'Дундаж (50%)';
    if (percentile <= 75) return 'Доод хүрээнд (75%)';
    return 'Хамгийн үнэтэй (top 25%)';
  }

  /// Recommendation message for the buyer.
  String get buyerMessage => switch (verdict) {
    PriceVerdict.belowMarket =>
      'Энэ зар дундаж үнээс доогуур байна — боломжит худалдан авалт.',
    PriceVerdict.fairMarket => 'Үнэ нь захын дундажтай тэнцүү байна.',
    PriceVerdict.aboveMarket =>
      'Энэ зар дундаж үнээс дээгүүр байна — нэмэлт мэдээлэл шалга.',
    PriceVerdict.unknown =>
      'Тухайн зарын төрөл, бүс нутгийн үнийн мэдээлэл хүрэлцэхгүй байна.',
  };
}

enum PriceVerdict { belowMarket, fairMarket, aboveMarket, unknown }

/// Calculate price insight by comparing a listing against price history.
MarketPriceInsight calculatePriceInsight({
  required MarketListing listing,
  required List<PriceHistoryRecord> history,
}) {
  // Find comparable records by sale type and optionally region
  final byType = history.where((r) => r.saleType == listing.saleType).toList();
  if (byType.isEmpty) {
    return MarketPriceInsight(
      listingPrice: listing.priceAmount,
      comparableCount: 0,
      verdict: PriceVerdict.unknown,
    );
  }

  // Prefer same-region comparables if available
  final sameRegion = byType
      .where(
        (r) => r.region.toLowerCase() == listing.locationLabel.toLowerCase(),
      )
      .toList();

  final comparables = sameRegion.isNotEmpty ? sameRegion : byType;
  final prices = comparables.map((r) => r.priceAmount).toList()..sort();

  final average = prices.reduce((a, b) => a + b) ~/ prices.length;
  final min = prices.first;
  final max = prices.last;

  // Calculate percentile: what % of comparables are cheaper than this listing
  final cheaperCount = prices.where((p) => p < listing.priceAmount).length;
  final percentile = (cheaperCount / prices.length) * 100;

  // Determine verdict
  PriceVerdict verdict;
  final diffPercent = ((listing.priceAmount - average) / average * 100).abs();

  if (diffPercent <= 15) {
    verdict = PriceVerdict.fairMarket;
  } else if (listing.priceAmount < average) {
    verdict = PriceVerdict.belowMarket;
  } else {
    verdict = PriceVerdict.aboveMarket;
  }

  return MarketPriceInsight(
    listingPrice: listing.priceAmount,
    comparableCount: comparables.length,
    averagePrice: average,
    minPrice: min,
    maxPrice: max,
    verdict: verdict,
    percentile: percentile,
  );
}
