import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/market_repository.dart';
import '../domain/saved_search.dart';
import 'market_providers.dart';

// ── Repository ────────────────────────────────────────────────────

/// Хадгалсан хайлтуудын repository provider.
final savedSearchRepositoryProvider = FutureProvider<MarketRepository>((ref) {
  return ref.watch(marketRepositoryProvider.future);
});

// ── Хадгалсан хайлтын жагсаалт ───────────────────────────────────

/// Тухайн хэрэглэгчийн хадгалсан хайлтуудын жагсаалт.
final savedSearchesProvider =
    FutureProvider.family<List<SavedSearch>, String>((ref, userId) async {
  final repository = await ref.watch(savedSearchRepositoryProvider.future);
  final result = await repository.fetchSavedSearches(userId);
  return result.getOrThrow();
});

// ── Хадгалсан хайлт хадгалах ──────────────────────────────────────

/// Хадгалсан хайлт үүсгэх (хэрэглэгчийн шүүлтүүрийг хадгалах).
///
/// [userId] — хэрэглэгчийн ID
/// [name] — хайлтын нэр
/// [filters] — одоогийн шүүлтүүрийн Map хэлбэр
final saveSavedSearchProvider =
    FutureProvider.family<void, SaveSavedSearchParams>((ref, params) async {
  final repository = await ref.watch(savedSearchRepositoryProvider.future);
  final now = DateTime.now();
  final search = SavedSearch(
    id: 'saved-search-${now.millisecondsSinceEpoch}',
    userId: params.userId,
    filters: params.filters,
    name: params.name,
    createdAt: now,
  );
  await repository.saveSavedSearch(search);
});

/// Хадгалсан хайлт үүсгэх параметр.
class SaveSavedSearchParams {
  const SaveSavedSearchParams({
    required this.userId,
    required this.name,
    required this.filters,
  });

  final String userId;
  final String name;
  final Map<String, dynamic> filters;
}

// ── Хадгалсан хайлт устгах ───────────────────────────────────────

/// Хадгалсан хайлт устгах provider.
final deleteSavedSearchProvider =
    FutureProvider.family<void, String>((ref, id) async {
  final repository = await ref.watch(savedSearchRepositoryProvider.future);
  await repository.deleteSavedSearch(id);
});

// ── Хадгалсан хайлтын нэр шинэчлэх ────────────────────────────────

/// Хадгалсан хайлтын нэрийг шинэчлэх provider.
final renameSavedSearchProvider =
    FutureProvider.family<void, RenameSavedSearchParams>((ref, params) async {
  final repository = await ref.watch(savedSearchRepositoryProvider.future);
  await repository.updateSavedSearchName(params.id, params.newName);
});

/// Хадгалсан хайлтын нэр шинэчлэх параметр.
class RenameSavedSearchParams {
  const RenameSavedSearchParams({
    required this.id,
    required this.newName,
  });

  final String id;
  final String newName;
}

// ── Matching Engine ──────────────────────────────────────────────

/// Хадгалсан хайлтуудтай тохирч буй шинэ заруудыг шалгах.
///
/// [savedSearches] — хэрэглэгчийн хадгалсан хайлтууд
/// [listings] — шалгах зарууд (ихэвчлэн шинэ зарууд)
///
/// Буцаах утга: тохирсон хослолын жагсаалт (savedSearch, listing)
List<({SavedSearch search, String listingId})> findMatchingListings({
  required List<SavedSearch> savedSearches,
  required List<({String id, Map<String, dynamic> listingData})> listings,
}) {
  final matches = <({SavedSearch search, String listingId})>[];

  for (final search in savedSearches) {
    for (final listing in listings) {
      if (_matchesSearch(search.filters, listing.listingData)) {
        matches.add((search: search, listingId: listing.id));
      }
    }
  }

  return matches;
}

/// Шүүлтүүр болон зарын өгөгдөл тохирч байгаа эсэхийг шалгах.
bool _matchesSearch(
  Map<String, dynamic> filters,
  Map<String, dynamic> listingData,
) {
  // Зарын төрөл
  if (filters.containsKey('saleType')) {
    final filterSaleType = filters['saleType'] as String?;
    final listingSaleType = listingData['saleType'] as String?;
    if (filterSaleType != null &&
        listingSaleType != null &&
        filterSaleType != listingSaleType) {
      return false;
    }
  }

  // Баталгаажсан худалдагч эсэх
  if (filters.containsKey('verifiedOnly') && filters['verifiedOnly'] == true) {
    final isVerified = listingData['isSellerVerified'] as bool? ?? false;
    if (!isVerified) return false;
  }

  // Байршил
  if (filters.containsKey('location')) {
    final filterLocation = (filters['location'] as String?).orEmpty
        .toLowerCase();
    if (filterLocation.isNotEmpty) {
      final listingLocation = (listingData['locationLabel'] as String?).orEmpty
          .toLowerCase();
      if (!listingLocation.contains(filterLocation)) return false;
    }
  }

  // Үнийн хязгаар
  final listingPrice = listingData['priceAmount'] as int? ?? 0;
  if (filters.containsKey('minPrice')) {
    final minPrice = filters['minPrice'] as int? ?? 0;
    if (listingPrice < minPrice) return false;
  }
  if (filters.containsKey('maxPrice')) {
    final maxPrice = filters['maxPrice'] as int?;
    if (maxPrice != null && listingPrice > maxPrice) return false;
  }

  // Үүл/зүс (breed)
  if (filters.containsKey('breed')) {
    final filterBreed = (filters['breed'] as String?).orEmpty.toLowerCase();
    if (filterBreed.isNotEmpty) {
      final title = (listingData['title'] as String?).orEmpty.toLowerCase();
      final desc = (listingData['description'] as String?).orEmpty.toLowerCase();
      if (!title.contains(filterBreed) && !desc.contains(filterBreed)) {
        return false;
      }
    }
  }

  // Текст хайлт
  if (filters.containsKey('query')) {
    final query = (filters['query'] as String?).orEmpty.trim().toLowerCase();
    if (query.isNotEmpty) {
      final haystack = [
        listingData['title'] as String? ?? '',
        listingData['description'] as String? ?? '',
        listingData['locationLabel'] as String? ?? '',
      ].join(' ').toLowerCase();
      if (!haystack.contains(query)) return false;
    }
  }

  return true;
}

// ── Extension helpers ─────────────────────────────────────────────

extension _StringOrEmpty on String? {
  String get orEmpty => this ?? '';
}
