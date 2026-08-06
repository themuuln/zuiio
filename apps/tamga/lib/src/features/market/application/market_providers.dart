import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../events/application/events_providers.dart';
import '../../../shared/domain/event.dart';
import '../../horses/application/horses_providers.dart';
import '../../horses/domain/horse_record.dart';
import '../../shared/application/sync_providers.dart';
import '../../shared/data/isar_storage.dart';
import '../../shared/data/pagination/pagination_state.dart';
import '../../../core/sync/sync_queue.dart';
import '../data/local_market_repository_v2.dart';
import '../data/market_repository.dart';
import '../domain/digital_certificate.dart';
import '../domain/market_listing.dart';
import '../domain/market_price_insight.dart';
import '../domain/market_safety.dart';
import '../domain/price_history.dart';

// ── Sort ──────────────────────────────────────────────────────────

enum MarketSort { newest, priceLow, priceHigh, trusted, popular, boosted }

extension MarketSortLabel on MarketSort {
  String get label => switch (this) {
    MarketSort.newest => 'Шинэ',
    MarketSort.priceLow => 'Үнэ өсөх',
    MarketSort.priceHigh => 'Үнэ буурах',
    MarketSort.trusted => 'Итгэлцэл',
    MarketSort.popular => 'Алдартай',
    MarketSort.boosted => 'Дэмжсэн',
  };
}

// ── Filters ───────────────────────────────────────────────────────

class MarketFilters {
  const MarketFilters({
    this.query = '',
    this.saleType,
    this.verifiedOnly = false,
    this.location = '',
    this.minPrice,
    this.maxPrice,
    this.breed = '',
    this.sort = MarketSort.newest,
  });

  final String query;
  final MarketSaleType? saleType;
  final bool verifiedOnly;
  final String location;
  final int? minPrice;
  final int? maxPrice;
  final String breed;
  final MarketSort sort;

  MarketFilters copyWith({
    String? query,
    MarketSaleType? saleType,
    bool clearSaleType = false,
    bool? verifiedOnly,
    String? location,
    bool clearLocation = false,
    int? minPrice,
    bool clearMinPrice = false,
    int? maxPrice,
    bool clearMaxPrice = false,
    String? breed,
    bool clearBreed = false,
    MarketSort? sort,
  }) {
    return MarketFilters(
      query: query ?? this.query,
      saleType: clearSaleType ? null : saleType ?? this.saleType,
      verifiedOnly: verifiedOnly ?? this.verifiedOnly,
      location: clearLocation ? '' : location ?? this.location,
      minPrice: clearMinPrice ? null : minPrice ?? this.minPrice,
      maxPrice: clearMaxPrice ? null : maxPrice ?? this.maxPrice,
      breed: clearBreed ? '' : breed ?? this.breed,
      sort: sort ?? this.sort,
    );
  }
}

// ── View models ───────────────────────────────────────────────────

class MarketListingVm {
  const MarketListingVm({
    required this.listing,
    required this.horse,
    required this.events,
    required this.isFavorite,
  });

  final MarketListing listing;
  final HorseRecord? horse;
  final List<Event> events;
  final bool isFavorite;
}

class MarketCatalog {
  const MarketCatalog({required this.listings, required this.horses});

  final List<MarketListingVm> listings;
  final List<HorseRecord> horses;
}

class MyListingsSummary {
  const MyListingsSummary({
    required this.active,
    required this.pending,
    required this.sold,
    required this.expired,
  });

  final List<MarketListingVm> active;
  final List<MarketListingVm> pending;
  final List<MarketListingVm> sold;
  final List<MarketListingVm> expired;

  int get totalCount =>
      active.length + pending.length + sold.length + expired.length;
}

class MarketSafetySummary {
  const MarketSafetySummary({
    required this.sellerProfile,
    required this.inquiries,
    required this.reports,
    required this.localBuyerInquiry,
    required this.localReporterReports,
  });

  final SellerProfile? sellerProfile;
  final List<MarketInquiry> inquiries;
  final List<ListingReport> reports;
  final MarketInquiry? localBuyerInquiry;
  final List<ListingReport> localReporterReports;

  int get inquiryCount => inquiries.length;
  int get reportCount => reports.length;
  bool get hasLocalReport => localReporterReports.isNotEmpty;
}

const localMarketBuyerId = 'local-buyer';
const localMarketReporterId = 'local-reporter';

// ── Providers ─────────────────────────────────────────────────────

final marketRepositoryProvider = FutureProvider<MarketRepository>((ref) async {
  return LocalMarketRepositoryV2(
    storage: IsarStorage.instance,
    syncQueue: SyncQueue(),
    syncStorage: ref.watch(isarSyncStorageProvider),
  );
});

final marketFiltersProvider = StateProvider<MarketFilters>((ref) {
  return const MarketFilters();
});

final marketListingsProvider = FutureProvider<List<MarketListing>>((ref) async {
  final repository = await ref.watch(marketRepositoryProvider.future);
  return (await repository.fetchListings()).getOrThrow();
});

final favoriteListingIdsProvider = FutureProvider<List<String>>((ref) async {
  final repository = await ref.watch(marketRepositoryProvider.future);
  final result = await repository.fetchFavoriteListingIds();
  return result.getOrThrow();
});

final marketSafetySummaryProvider =
    FutureProvider.family<MarketSafetySummary, String>((ref, listingId) async {
      final repository = await ref.watch(marketRepositoryProvider.future);
      final listings = await ref.watch(marketListingsProvider.future);
      final listing = _firstOrNull(
        listings.where((item) => item.id == listingId),
      );
      final sellerProfile = listing == null
          ? null
          : (await repository.fetchSellerProfile(
              listing.sellerId,
            )).getOrThrow();
      final inquiries = (await repository.fetchInquiries(
        listingId,
      )).getOrThrow();
      final reports = (await repository.fetchReports(listingId)).getOrThrow();
      final localInquiry = _firstOrNull(
        inquiries.where((item) => item.buyerId == localMarketBuyerId),
      );
      final localReports = reports
          .where((item) => item.reporterId == localMarketReporterId)
          .toList();

      return MarketSafetySummary(
        sellerProfile: sellerProfile,
        inquiries: inquiries,
        reports: reports,
        localBuyerInquiry: localInquiry,
        localReporterReports: localReports,
      );
    });

final digitalCertificateProvider =
    FutureProvider.family<DigitalCertificate?, String>((ref, horseId) async {
      final repository = await ref.watch(marketRepositoryProvider.future);
      final result = await repository.fetchCertificateForHorse(horseId);
      return result.getOrThrow();
    });

/// Catalog with enhanced filtering for the browse screen.
final marketCatalogProvider = FutureProvider<MarketCatalog>((ref) async {
  final listings = await ref.watch(marketListingsProvider.future);
  final horses = await ref.watch(horsesProvider.future);
  final events = await ref.watch(eventsProvider.future);
  final favorites = await ref.watch(favoriteListingIdsProvider.future);
  final filters = ref.watch(marketFiltersProvider);

  final horseById = {for (final horse in horses) horse.id: horse};
  final eventByHorseId = <String, List<Event>>{};
  for (final event in events) {
    eventByHorseId.putIfAbsent(event.horseId, () => []).add(event);
  }

  final vms = listings
      .where((listing) => listing.isPublished)
      .where(
        (listing) => _matches(listing, horseById[listing.horseId], filters),
      )
      .map(
        (listing) => MarketListingVm(
          listing: listing,
          horse: horseById[listing.horseId],
          events: eventByHorseId[listing.horseId] ?? const [],
          isFavorite: favorites.contains(listing.id),
        ),
      )
      .toList();

  vms.sort((a, b) {
    // When sort is 'boosted', use sortPriority as primary key
    if (filters.sort == MarketSort.boosted) {
      final priorityCmp = b.listing.sortPriority.compareTo(
        a.listing.sortPriority,
      );
      if (priorityCmp != 0) return priorityCmp;
      // Tie-break by newest
      return b.listing.createdAt.compareTo(a.listing.createdAt);
    }

    // For all other sorts, use sortPriority as secondary key
    final primaryCmp = switch (filters.sort) {
      MarketSort.newest => b.listing.createdAt.compareTo(a.listing.createdAt),
      MarketSort.priceLow => a.listing.priceAmount.compareTo(
        b.listing.priceAmount,
      ),
      MarketSort.priceHigh => b.listing.priceAmount.compareTo(
        a.listing.priceAmount,
      ),
      MarketSort.trusted => b.listing.trustScore.compareTo(
        a.listing.trustScore,
      ),
      MarketSort.popular => b.listing.viewsCount.compareTo(
        a.listing.viewsCount,
      ),
      MarketSort.boosted => 0, // handled above
    };
    if (primaryCmp != 0) return primaryCmp;

    // Secondary: boost/VIP priority (higher sortPriority first)
    return b.listing.sortPriority.compareTo(a.listing.sortPriority);
  });

  return MarketCatalog(listings: vms, horses: horses);
});

/// Хуудаслалттай захын каталогийн төлөв.
///
/// `PaginationState<MarketListingVm>`-ийг өргөтгөсөн нэмэлт.
class MarketCatalogPaginationState extends PaginationState<MarketListingVm> {
  const MarketCatalogPaginationState({
    super.items,
    super.isLoading,
    super.hasMore,
    super.error,
    super.currentPage,
    this.totalCount = 0,
  });

  /// Нийт элементийн тоо.
  final int totalCount;

  @override
  MarketCatalogPaginationState copyWith({
    List<MarketListingVm>? items,
    bool? isLoading,
    bool? hasMore,
    Object? error,
    int? currentPage,
    bool clearError = false,
    int? totalCount,
  }) {
    return MarketCatalogPaginationState(
      items: items ?? this.items,
      isLoading: isLoading ?? this.isLoading,
      hasMore: hasMore ?? this.hasMore,
      error: clearError ? null : (error ?? this.error),
      currentPage: currentPage ?? this.currentPage,
      totalCount: totalCount ?? this.totalCount,
    );
  }
}

/// Хуудаслалттай захын каталогийг удирдах notifier.
///
/// Нэг хуудсыг ачаалж, морь/үйл явдал/хадгалсан мэдээллээр баяжуулна.
/// Filters өөрчлөгдөхөд эхний хуудаснаас дахин ачаална.
class MarketCatalogNotifier
    extends StateNotifier<MarketCatalogPaginationState> {
  MarketCatalogNotifier({required this.repository, required this.pageSize})
    : super(const MarketCatalogPaginationState());

  final MarketRepository repository;
  final int pageSize;

  /// Хадгалсан заруудын ID-ууд.
  List<String> _favoriteIds = const [];

  /// Морьдын мэдээлэл (ID -> HorseRecord).
  Map<String, HorseRecord> _horseById = const {};

  /// Үйл явдлууд (horseId -> events).
  Map<String, List<Event>> _eventByHorseId = const {};

  /// Нэмэлт мэдээллийг шинэчлэх.
  void updateContext({
    required List<String> favoriteIds,
    required List<HorseRecord> horses,
    required List<Event> events,
  }) {
    _favoriteIds = favoriteIds;
    _horseById = {for (final h in horses) h.id: h};
    _eventByHorseId = {};
    for (final e in events) {
      _eventByHorseId.putIfAbsent(e.horseId, () => []).add(e);
    }
    // Хуудсыг дахин баяжуулах
    if (state.items.isNotEmpty) {
      final enriched = state.items.map((vm) {
        final listing = vm.listing;
        return MarketListingVm(
          listing: listing,
          horse: _horseById[listing.horseId],
          events: _eventByHorseId[listing.horseId] ?? const [],
          isFavorite: _favoriteIds.contains(listing.id),
        );
      }).toList();
      state = state.copyWith(items: enriched);
    }
  }

  /// Анхны хуудсыг ачаалах.
  Future<void> loadInitial({MarketFilters? filters}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await repository.fetchListingsPaginated(
        page: 0,
        limit: pageSize,
      );
      final paginated = result.getOrThrow();
      final vms = _enrichListings(paginated.items, filters);
      state = MarketCatalogPaginationState(
        items: vms,
        isLoading: false,
        hasMore: paginated.items.length >= pageSize,
        currentPage: 0,
        totalCount: paginated.totalCount,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e);
    }
  }

  /// Дараагийн хуудсыг ачаалах.
  Future<void> loadMore({MarketFilters? filters}) async {
    if (state.isLoading || !state.hasMore) return;
    state = state.copyWith(isLoading: true);
    try {
      final nextPage = state.currentPage + 1;
      final result = await repository.fetchListingsPaginated(
        page: nextPage,
        limit: pageSize,
      );
      final paginated = result.getOrThrow();
      final vms = _enrichListings(paginated.items, filters);
      state = MarketCatalogPaginationState(
        items: [...state.items, ...vms],
        isLoading: false,
        hasMore: paginated.items.length >= pageSize,
        currentPage: nextPage,
        totalCount: paginated.totalCount,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e);
    }
  }

  /// Дахин ачаалах.
  Future<void> refresh({MarketFilters? filters}) =>
      loadInitial(filters: filters);

  /// Заруудыг морь/үйл явдал/хадгалсан мэдээллээр баяжуулах.
  List<MarketListingVm> _enrichListings(
    List<MarketListing> listings,
    MarketFilters? filters,
  ) {
    var filtered = listings.where((l) => l.isPublished);
    if (filters != null) {
      filtered = filtered.where(
        (l) => _matches(l, _horseById[l.horseId], filters),
      );
    }
    return filtered
        .map(
          (listing) => MarketListingVm(
            listing: listing,
            horse: _horseById[listing.horseId],
            events: _eventByHorseId[listing.horseId] ?? const [],
            isFavorite: _favoriteIds.contains(listing.id),
          ),
        )
        .toList();
  }
}

/// Хуудаслалттай захын каталогийн provider.
///
/// MarketCatalogNotifier-ийг үүсгэж, эхний хуудсыг ачаална.
final paginatedMarketCatalogProvider =
    StateNotifierProvider<MarketCatalogNotifier, MarketCatalogPaginationState>((
      ref,
    ) {
      final notifier = MarketCatalogNotifier(
        repository: LocalMarketRepositoryV2(
          storage: IsarStorage.instance,
          syncQueue: SyncQueue(),
        ),
        pageSize: 20,
      );

      // Анхны ачаалалт — контекст мэдээллийг хүлээж аваад эхлүүлнэ.
      Future.microtask(() async {
        final horses = await ref.read(horsesProvider.future);
        final events = await ref.read(eventsProvider.future);
        final favorites = await ref.read(favoriteListingIdsProvider.future);
        final filters = ref.read(marketFiltersProvider);
        notifier.updateContext(
          favoriteIds: favorites,
          horses: horses,
          events: events,
        );
        await notifier.loadInitial(filters: filters);
      });

      return notifier;
    });

/// Derived provider that returns only the count of active listings.
/// Use with select() for fine-grained rebuilds.
final activeListingCountProvider = FutureProvider<int>((ref) async {
  final catalog = await ref.watch(marketCatalogProvider.future);
  return catalog.listings.length;
});

/// Derived provider that returns only the count of verified sellers.
/// Use with select() for fine-grained rebuilds.
final verifiedSellerCountProvider = FutureProvider<int>((ref) async {
  final catalog = await ref.watch(marketCatalogProvider.future);
  return catalog.listings.where((item) => item.listing.isSellerVerified).length;
});

/// Derived provider that returns listings as a Map by listing ID for O(1) lookup.
final marketListingsMapProvider = Provider<Map<String, MarketListingVm>>((ref) {
  final catalog = ref.watch(marketCatalogProvider);
  return catalog.whenOrNull(
        data: (data) => {
          for (final item in data.listings) item.listing.id: item,
        },
      ) ??
      const {};
});

/// User's own listings grouped by status for MyListingsScreen.
final myListingsProvider = FutureProvider<MyListingsSummary>((ref) async {
  final repository = await ref.watch(marketRepositoryProvider.future);
  final horses = await ref.watch(horsesProvider.future);
  final events = await ref.watch(eventsProvider.future);
  final favorites = await ref.watch(favoriteListingIdsProvider.future);

  final result = await repository.fetchListingsBySeller('seller-local');
  final allListings = result.getOrThrow();

  final horseById = {for (final horse in horses) horse.id: horse};
  final eventByHorseId = <String, List<Event>>{};
  for (final event in events) {
    eventByHorseId.putIfAbsent(event.horseId, () => []).add(event);
  }

  List<MarketListingVm> toVms(List<MarketListing> list) {
    return list
        .map(
          (listing) => MarketListingVm(
            listing: listing,
            horse: horseById[listing.horseId],
            events: eventByHorseId[listing.horseId] ?? const [],
            isFavorite: favorites.contains(listing.id),
          ),
        )
        .toList();
  }

  return MyListingsSummary(
    active: toVms(allListings.where((l) => l.isActive).toList()),
    pending: toVms(allListings.where((l) => l.isPending).toList()),
    sold: toVms(allListings.where((l) => l.isSold).toList()),
    expired: toVms(allListings.where((l) => l.isExpired).toList()),
  );
});

// ── Filtering logic ───────────────────────────────────────────────

bool _matches(
  MarketListing listing,
  HorseRecord? horse,
  MarketFilters filters,
) {
  if (filters.saleType != null && listing.saleType != filters.saleType) {
    return false;
  }
  if (filters.verifiedOnly && !listing.isSellerVerified) {
    return false;
  }

  // Location filter
  if (filters.location.isNotEmpty) {
    if (!listing.locationLabel.toLowerCase().contains(
      filters.location.toLowerCase(),
    )) {
      return false;
    }
  }

  // Price range filter
  if (filters.minPrice != null && listing.priceAmount < filters.minPrice!) {
    return false;
  }
  if (filters.maxPrice != null && listing.priceAmount > filters.maxPrice!) {
    return false;
  }

  // Breed filter (matches against horse coat or name)
  if (filters.breed.isNotEmpty) {
    final breedLower = filters.breed.toLowerCase();
    final horseCoat = horse?.coat.toLowerCase() ?? '';
    final horseName = horse?.name.toLowerCase() ?? '';
    if (!horseCoat.contains(breedLower) && !horseName.contains(breedLower)) {
      return false;
    }
  }

  // Text search
  final query = filters.query.trim().toLowerCase();
  if (query.isEmpty) {
    return true;
  }

  final haystack = [
    listing.title,
    listing.description,
    listing.locationLabel,
    listing.disciplineTags.join(' '),
    listing.documentTags.join(' '),
    horse?.name ?? '',
    horse?.coat ?? '',
    horse?.relationLabel ?? '',
  ].join(' ').toLowerCase();

  return haystack.contains(query);
}

T? _firstOrNull<T>(Iterable<T> values) {
  for (final value in values) {
    return value;
  }
  return null;
}

final priceHistoryProvider = FutureProvider<List<PriceHistoryRecord>>((
  ref,
) async {
  final repository = await ref.watch(marketRepositoryProvider.future);
  final result = await repository.fetchPriceHistory();
  return result.getOrThrow();
});

// ── Price Intelligence ─────────────────────────────────────────

/// Price insight for a specific listing, comparing against history.
final priceInsightProvider = FutureProvider.family<MarketPriceInsight, String>((
  ref,
  listingId,
) async {
  final catalog = await ref.watch(marketCatalogProvider.future);
  final history = await ref.watch(priceHistoryProvider.future);

  MarketListing? listing;
  for (final item in catalog.listings) {
    if (item.listing.id == listingId) {
      listing = item.listing;
      break;
    }
  }

  if (listing == null) {
    return MarketPriceInsight(
      listingPrice: 0,
      comparableCount: 0,
      verdict: PriceVerdict.unknown,
    );
  }

  return calculatePriceInsight(listing: listing, history: history);
});
