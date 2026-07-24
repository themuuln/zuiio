import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../horses/application/horses_providers.dart';
import '../../horses/domain/horse_record.dart';
import '../../market/application/market_providers.dart';
import '../../market/application/rating_providers.dart';
import '../../market/domain/market_listing.dart';
import '../../market/domain/seller_rating.dart';
import '../domain/breeder_profile.dart';

/// Үржүүлэгчийн нийтийн профайлыг өгөгдөл эх сурвалжуудаас бүрдүүлэн авах provider.
///
/// Дараах эх сурвалжуудыг ашиглана:
/// - [marketRepositoryProvider] — худалдагчийн профайл, зарууд
/// - [sellerRatingSummaryProvider] — үнэлгээний хураангуй
/// - [horsesProvider] — морины тоо
final breederProfileProvider = FutureProvider.family<BreederProfile, String>((
  ref,
  sellerId,
) async {
  final repository = await ref.watch(marketRepositoryProvider.future);

  // ── Seller profile (нэр, байршил) ──
  final sellerProfileResult = await repository.fetchSellerProfile(sellerId);
  final sellerProfile = sellerProfileResult.getOrDefault(null);
  final displayName = sellerProfile?.displayName ?? 'Хэрэглэгч';
  final locationLabel = sellerProfile?.locationLabel ?? '';

  // ── Үнэлгээ ──
  SellerRatingSummary ratingSummary;
  try {
    ratingSummary = await ref.watch(
      sellerRatingSummaryProvider(sellerId).future,
    );
  } catch (_) {
    ratingSummary = const SellerRatingSummary(
      averageRating: 0.0,
      totalCount: 0,
      distribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
    );
  }

  // ── Сүүлийн зарууд ──
  final sellerListingsResult = await repository.fetchListingsBySeller(sellerId);
  final sellerListings = sellerListingsResult.getOrDefault(<MarketListing>[]);
  final sortedListings = List<MarketListing>.from(sellerListings)
    ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
  final recentListings = sortedListings
      .take(5)
      .map(
        (l) => BreederListingPreview(
          id: l.id,
          title: l.title,
          priceAmount: l.priceAmount,
          currency: l.currency,
          thumbnailUrl: l.mediaUrls.isNotEmpty ? l.mediaUrls.first : null,
          status: l.status.label,
        ),
      )
      .toList();

  // ── Нийт морины тоо ──
  List<HorseRecord> allHorses;
  try {
    allHorses = await ref.watch(horsesProvider.future);
  } catch (_) {
    allHorses = [];
  }
  final totalHorses = allHorses.where((h) => h.ownerId == sellerId).length;

  // ── Гишүүнээр элссэн огноо ──
  // Хэрэв seller profile дээр байхгүй бол хамгийн эртний зараас тооцоолно.
  DateTime? memberSince;
  if (sellerListings.isNotEmpty) {
    final earliestListing = sellerListings.reduce(
      (a, b) => a.createdAt.isBefore(b.createdAt) ? a : b,
    );
    memberSince = earliestListing.createdAt;
  }

  // ── Амжилт / тэмдэг ──
  final achievements = _computeAchievements(
    totalHorses: totalHorses,
    averageRating: ratingSummary.averageRating,
    totalRatings: ratingSummary.totalCount,
    listingsCount: sellerListings.length,
    completedSalesCount: sellerListings
        .where((l) => l.status == MarketListingStatus.sold)
        .length,
  );

  return BreederProfile(
    id: sellerId,
    displayName: displayName,
    locationLabel: locationLabel,
    memberSince: memberSince,
    totalHorses: totalHorses,
    achievements: achievements,
    recentListings: recentListings,
    averageRating: ratingSummary.averageRating,
    totalRatings: ratingSummary.totalCount,
  );
});

/// Үржүүлэгчийн амжилт/тэмдгийг тооцоолох.
///
/// Дараах шалгууруудаар амжилтуудыг тодорхойлно:
/// - Морины тоо: 10+ (Туршлагатай), 50+ (Мастер)
/// - Үнэлгээ: 4.0+ (Итгэлтэй), 4.5+ (Шилдэг)
/// - Борлуулалт: 5+ (Борлуулалттай)
List<String> _computeAchievements({
  required int totalHorses,
  required double averageRating,
  required int totalRatings,
  required int listingsCount,
  required int completedSalesCount,
}) {
  final achievements = <String>[];

  // Морины тоогоор
  if (totalHorses >= 50) {
    achievements.add('Мастер үржүүлэгч');
  } else if (totalHorses >= 10) {
    achievements.add('Туршлагатай үржүүлэгч');
  }

  // Үнэлгээгээр
  if (totalRatings >= 1) {
    if (averageRating >= 4.5) {
      achievements.add('Шилдэг үнэлгээ');
    } else if (averageRating >= 4.0) {
      achievements.add('Итгэлтэй худалдагч');
    }
  }

  // Борлуулалтаар
  if (completedSalesCount >= 10) {
    achievements.add('Туршлагатай худалдагч');
  } else if (completedSalesCount >= 5) {
    achievements.add('Борлуулалттай');
  }

  // Зарын тоогоор
  if (listingsCount >= 20) {
    achievements.add('Идэвхтэй худалдагч');
  } else if (listingsCount >= 5) {
    achievements.add('Идэвхтэй');
  }

  return achievements;
}
