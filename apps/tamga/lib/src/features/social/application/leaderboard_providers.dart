import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../horses/application/horses_providers.dart';
import '../../market/application/market_providers.dart';
import '../../market/application/rating_providers.dart';
import '../../market/domain/market_listing.dart';
import '../domain/leaderboard_entry.dart';

// ── Filter State Providers ─────────────────────────────────────────

/// Сонгосон аймаг/бүс — хоосон бол бүгд.
final leaderboardRegionProvider = StateProvider<String>((ref) => '');

/// Сонгосон хугацаа.
final leaderboardTimePeriodProvider = StateProvider<LeaderboardTimePeriod>(
  (ref) => LeaderboardTimePeriod.all,
);

/// Боломжтой аймгуудын жагсаалт — заруудын locationLabel-аас гаргаж авна.
final leaderboardAvailableRegionsProvider = FutureProvider<List<String>>((
  ref,
) async {
  final repository = await ref.watch(marketRepositoryProvider.future);
  final result = await repository.fetchListings();
  final listings = result.getOrDefault(<MarketListing>[]);

  // Бүх locationLabel-аас аймгийн нэрийг ялгаж авах.
  // Жишээ: "Төв аймаг, Баян сум" -> "Төв аймаг"
  final regions = <String>{};
  for (final listing in listings) {
    final parts = listing.locationLabel.split(',');
    if (parts.isNotEmpty) {
      final region = parts.first.trim();
      if (region.isNotEmpty) {
        regions.add(region);
      }
    }
  }

  return regions.toList()..sort();
});

// ── Main Leaderboard Provider ───────────────────────────────────────

/// Чансааны өгөгдлийг бүрдүүлэх provider.
///
/// Бүх зар, морь, үнэлгээг нэгтгэж үржүүлэгч тус бүрийн үзүүлэлтийг тооцоолно.
final leaderboardProvider = FutureProvider<List<LeaderboardEntry>>((ref) async {
  final region = ref.watch(leaderboardRegionProvider);
  final timePeriod = ref.watch(leaderboardTimePeriodProvider);

  final repository = await ref.watch(marketRepositoryProvider.future);
  final allHorses = await ref.watch(horsesProvider.future);

  // ── Listings ──
  final listingsResult = await repository.fetchListings();
  final allListings = listingsResult.getOrDefault(<MarketListing>[]);

  // Хугацааны шүүлтүүрийн хязгаарыг тодорхойлох
  final DateTime? cutoffDate;
  switch (timePeriod) {
    case LeaderboardTimePeriod.last7d:
      cutoffDate = DateTime.now().subtract(const Duration(days: 7));
      break;
    case LeaderboardTimePeriod.last30d:
      cutoffDate = DateTime.now().subtract(const Duration(days: 30));
      break;
    case LeaderboardTimePeriod.all:
      cutoffDate = null;
      break;
  }

  // Хугацааны шүүлтүүрээр заруудыг шүүх
  final List<MarketListing> filteredListings;
  if (cutoffDate != null) {
    final cutoff = cutoffDate;
    filteredListings = allListings
        .where((l) => l.createdAt.isAfter(cutoff))
        .toList();
  } else {
    filteredListings = allListings;
  }

  // ── Үржүүлэгч тус бүрийн үзүүлэлтүүдийг тооцоолох ──
  // Бүх зарыг sellerId-аар бүлэглэх
  final listingsBySeller = <String, List<MarketListing>>{};
  for (final listing in filteredListings) {
    listingsBySeller.putIfAbsent(listing.sellerId, () => []).add(listing);
  }

  // Бүх sellerId-ууд (хугацааны шүүлтүүрээс үл хамааран бүх зарын эзэд)
  final allSellerIds = <String>{};
  for (final listing in allListings) {
    allSellerIds.add(listing.sellerId);
  }

  // Хугацааны шүүлтүүрэд хамаарах sellerId-ууд
  final filteredSellerIds = listingsBySeller.keys.toSet();

  // Бүрэн бүх seller-үүдийн өгөгдлийг цуглуулах
  final entries = <LeaderboardEntry>[];
  for (final sellerId in allSellerIds) {
    // Хэрэв хугацааны шүүлтүүрэд тохирох зар байхгүй бол 0 үзүүлэлттэй оруулна
    final sellerListings = listingsBySeller[sellerId] ?? <MarketListing>[];

    // Худалдагчийн нэр, байршлыг авах
    String breederName;
    String locationLabel;
    try {
      final sellerProfile = await repository.fetchSellerProfile(sellerId);
      final profile = sellerProfile.getOrDefault(null);
      breederName = profile?.displayName ?? 'Хэрэглэгч';
      locationLabel = profile?.locationLabel ?? '';
    } catch (_) {
      breederName = 'Хэрэглэгч';
      locationLabel = '';
    }

    // Бүс/аймгийн шүүлтүүр
    if (region.isNotEmpty) {
      if (!locationLabel.toLowerCase().contains(region.toLowerCase())) {
        continue;
      }
    }

    // Хугацааны шүүлтүүрэд хамаарахгүй seller-үүдийг алгасах
    // (зөвхөн тухайн хугацаанд зартай seller-үүдийг харуулах)
    if (!filteredSellerIds.contains(sellerId)) {
      continue;
    }

    // Идэвхтэй зарууд
    final activeListingsCount = sellerListings
        .where((l) => l.status == MarketListingStatus.active)
        .length;

    // Борлуулсан зарууд
    final completedSalesCount = sellerListings
        .where((l) => l.status == MarketListingStatus.sold)
        .length;

    // Үнэлгээ
    double averageRating;
    try {
      final summary = await ref.read(
        sellerRatingSummaryProvider(sellerId).future,
      );
      averageRating = summary.averageRating;
    } catch (_) {
      averageRating = 0.0;
    }

    // Морины тоо
    final horseCount = allHorses.where((h) => h.ownerId == sellerId).length;

    // Нийт оноо: идэвхтэй зар * 10 + борлуулалт * 25 + дундаж үнэлгээ * 20 + морины тоо * 5
    final totalScore =
        (activeListingsCount * 10) +
        (completedSalesCount * 25) +
        (averageRating * 20).round() +
        (horseCount * 5);

    entries.add(
      LeaderboardEntry(
        rank: 0, // Дараа нь эрэмблэгдэнэ
        breederId: sellerId,
        breederName: breederName,
        locationLabel: locationLabel,
        totalScore: totalScore,
        activeListingsCount: activeListingsCount,
        completedSalesCount: completedSalesCount,
        averageRating: averageRating,
        horseCount: horseCount,
      ),
    );
  }

  // Оноогоор эрэмблэх
  entries.sort((a, b) => b.totalScore.compareTo(a.totalScore));

  // Чансааны дугаар өгөх
  for (var i = 0; i < entries.length; i++) {
    entries[i] = entries[i].copyWith(rank: i + 1);
  }

  return entries;
});
