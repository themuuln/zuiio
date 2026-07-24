import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/sync/sync_queue.dart';
import '../../shared/data/isar_storage.dart';
import '../data/local_market_repository_v2.dart';
import '../data/market_repository.dart';
import '../domain/seller_rating.dart';
import 'market_providers.dart';

// ── Repository Provider ─────────────────────────────────────────────

/// Seller rating-д зориулсан repository provider.
///
/// marketRepositoryProvider-ийг дахин ашиглах боловч rating-д зориулсан
/// тусдаа provider нь илүү тодорхой dependency injection-ийг хангана.
final sellerRatingRepositoryProvider = FutureProvider<MarketRepository>((ref) {
  return Future.value(
    LocalMarketRepositoryV2(
      storage: IsarStorage.instance,
      syncQueue: SyncQueue(),
    ),
  );
});

// ── Rating Providers ─────────────────────────────────────────────────

/// Худалдагчийн бүх үнэлгээг авах.
final sellerRatingsProvider = FutureProvider.family<List<SellerRating>, String>(
  (ref, sellerId) async {
    final repository = await ref.watch(marketRepositoryProvider.future);
    final result = await repository.fetchSellerRatings(sellerId);
    return result.getOrThrow();
  },
);

/// Худалдагчийн үнэлгээний хураангуйг авах.
final sellerRatingSummaryProvider =
    FutureProvider.family<SellerRatingSummary, String>((ref, sellerId) async {
      final repository = await ref.watch(marketRepositoryProvider.future);
      final result = await repository.fetchSellerRatingSummary(sellerId);
      return result.getOrThrow();
    });

/// Үнэлгээний дундажийн provider (зөвхөн double утга).
final sellerAverageRatingProvider = FutureProvider.family<double, String>((
  ref,
  sellerId,
) async {
  final summary = await ref.watch(sellerRatingSummaryProvider(sellerId).future);
  return summary.averageRating;
});

/// Үнэлгээний тооны provider (зөвхөн int утга).
final sellerRatingCountProvider = FutureProvider.family<int, String>((
  ref,
  sellerId,
) async {
  final summary = await ref.watch(sellerRatingSummaryProvider(sellerId).future);
  return summary.totalCount;
});
