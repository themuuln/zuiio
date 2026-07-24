import '../../market/domain/market_listing.dart';

/// Санхүүгийн аналитикийн домэйн модел.
///
/// Зах зээлийн мэдээллээр орлого, зарлага, ROI-г тооцоолно.
class FinancialAnalytics {
  FinancialAnalytics({required this.listings})
    : totalRevenue = _computeTotalRevenue(listings),
      totalExpenses = _computeTotalExpenses(listings),
      totalCommission = _computeTotalCommission(listings),
      roi = _computeRoi(listings),
      activeListings = listings.where((l) => l.isActive).length,
      soldListings = listings.where((l) => l.isSold).length;

  /// Зах зээлийн зарууд.
  final List<MarketListing> listings;

  /// Нийт орлого (борлуулсан заруудын нийт дүн).
  final int totalRevenue;

  /// Нийт зарлага (комисс).
  final int totalExpenses;

  /// Нийт комиссын дүн.
  final int totalCommission;

  /// Хөрөнгө оруулалтын өгөөж (Return on Investment).
  final double roi;

  /// Идэвхтэй заруудын тоо.
  final int activeListings;

  /// Борлуулсан заруудын тоо.
  final int soldListings;

  /// Average sale price (борлуулсан заруудын дундаж үнэ).
  int get averageSalePrice {
    final sold = listings.where((l) => l.isSold);
    if (sold.isEmpty) return 0;
    final total = sold.fold<int>(0, (sum, l) => sum + l.priceAmount);
    return total ~/ sold.length;
  }

  /// Хоосон аналитик.
  static final empty = FinancialAnalytics(listings: []);

  // ── Тооцоолол ─────────────────────────────────────────────────

  static int _computeTotalRevenue(List<MarketListing> listings) {
    return listings
        .where((l) => l.isSold)
        .fold<int>(0, (sum, l) => sum + l.priceAmount);
  }

  static int _computeTotalExpenses(List<MarketListing> listings) {
    return listings.fold<int>(0, (sum, l) => sum + (l.commissionAmount ?? 0));
  }

  static int _computeTotalCommission(List<MarketListing> listings) {
    return listings.fold<int>(0, (sum, l) => sum + (l.commissionAmount ?? 0));
  }

  static double _computeRoi(List<MarketListing> listings) {
    final revenue = _computeTotalRevenue(listings).toDouble();
    final expenses = _computeTotalExpenses(listings).toDouble();
    if (expenses == 0) {
      return revenue > 0 ? double.infinity : 0.0;
    }
    return ((revenue - expenses) / expenses) * 100;
  }
}
