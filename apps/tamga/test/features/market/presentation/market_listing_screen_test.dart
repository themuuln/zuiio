import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/market/domain/market_listing.dart';
import 'package:tamga/src/features/market/application/market_providers.dart';

void main() {
  // ── MarketFilters ────────────────────────────────────────────────

  group('MarketFilters', () {
    test('default values', () {
      const filters = MarketFilters();
      expect(filters.query, '');
      expect(filters.saleType, isNull);
      expect(filters.verifiedOnly, isFalse);
      expect(filters.location, '');
      expect(filters.minPrice, isNull);
      expect(filters.maxPrice, isNull);
      expect(filters.breed, '');
      expect(filters.sort, MarketSort.newest);
    });

    test('copyWith preserves unchanged fields', () {
      const original = MarketFilters(
        query: 'test',
        saleType: MarketSaleType.sale,
        verifiedOnly: true,
        location: 'UB',
        minPrice: 1000,
        maxPrice: 5000,
        breed: 'Хонгор',
        sort: MarketSort.priceLow,
      );

      final updated = original.copyWith(query: 'new query');

      expect(updated.query, 'new query');
      expect(updated.saleType, MarketSaleType.sale);
      expect(updated.verifiedOnly, isTrue);
      expect(updated.location, 'UB');
      expect(updated.minPrice, 1000);
      expect(updated.maxPrice, 5000);
      expect(updated.breed, 'Хонгор');
      expect(updated.sort, MarketSort.priceLow);
    });

    test('copyWith with clearSaleType', () {
      const original = MarketFilters(saleType: MarketSaleType.sale);
      final updated = original.copyWith(clearSaleType: true);
      expect(updated.saleType, isNull);
    });

    test('copyWith with clearLocation', () {
      const original = MarketFilters(location: 'Улаанбаатар');
      final updated = original.copyWith(clearLocation: true);
      expect(updated.location, '');
    });

    test('copyWith with clearMinPrice', () {
      const original = MarketFilters(minPrice: 1000);
      final updated = original.copyWith(clearMinPrice: true);
      expect(updated.minPrice, isNull);
    });

    test('copyWith with clearMaxPrice', () {
      const original = MarketFilters(maxPrice: 5000);
      final updated = original.copyWith(clearMaxPrice: true);
      expect(updated.maxPrice, isNull);
    });

    test('copyWith with clearBreed', () {
      const original = MarketFilters(breed: 'Хонгор');
      final updated = original.copyWith(clearBreed: true);
      expect(updated.breed, '');
    });

    test('copyWith updates sort', () {
      const original = MarketFilters(sort: MarketSort.newest);
      final updated = original.copyWith(sort: MarketSort.trusted);
      expect(updated.sort, MarketSort.trusted);
    });
  });

  // ── MarketSort labels ───────────────────────────────────────────

  group('MarketSort labels', () {
    test('each sort has correct Mongolian label', () {
      expect(MarketSort.newest.label, 'Шинэ');
      expect(MarketSort.priceLow.label, 'Үнэ өсөх');
      expect(MarketSort.priceHigh.label, 'Үнэ буурах');
      expect(MarketSort.trusted.label, 'Итгэлцэл');
      expect(MarketSort.popular.label, 'Алдартай');
    });
  });

  // ── Filtering logic (simulated) ────────────────────────────────

  group('filtering logic', () {
    MarketListing makeListing({
      MarketSaleType saleType = MarketSaleType.sale,
      bool isSellerVerified = false,
      String locationLabel = 'Улаанбаатар',
      int priceAmount = 5000000,
      String title = 'Test Horse',
      String description = 'Good horse',
      List<String> disciplineTags = const [],
      List<String> documentTags = const [],
      List<String> mediaUrls = const [],
    }) {
      return MarketListing(
        id: 'ml-1',
        horseId: 'h1',
        sellerId: 's1',
        title: title,
        description: description,
        priceAmount: priceAmount,
        currency: 'MNT',
        saleType: saleType,
        status: MarketListingStatus.active,
        locationLabel: locationLabel,
        disciplineTags: disciplineTags,
        documentTags: documentTags,
        mediaUrls: mediaUrls,
        isSellerVerified: isSellerVerified,
        createdAt: DateTime(2026, 5, 1),
        updatedAt: DateTime(2026, 5, 1),
      );
    }

    bool matches(MarketListing listing, MarketFilters filters) {
      if (filters.saleType != null && listing.saleType != filters.saleType) {
        return false;
      }
      if (filters.verifiedOnly && !listing.isSellerVerified) {
        return false;
      }
      if (filters.location.isNotEmpty &&
          !listing.locationLabel.toLowerCase().contains(
            filters.location.toLowerCase(),
          )) {
        return false;
      }
      if (filters.minPrice != null && listing.priceAmount < filters.minPrice!) {
        return false;
      }
      if (filters.maxPrice != null && listing.priceAmount > filters.maxPrice!) {
        return false;
      }
      final query = filters.query.trim().toLowerCase();
      if (query.isEmpty) return true;
      final haystack = [
        listing.title,
        listing.description,
        listing.locationLabel,
      ].join(' ').toLowerCase();
      return haystack.contains(query);
    }

    test('filter by saleType', () {
      final lease = makeListing(saleType: MarketSaleType.lease);
      const saleFilter = MarketFilters(saleType: MarketSaleType.sale);
      const leaseFilter = MarketFilters(saleType: MarketSaleType.lease);

      expect(matches(lease, saleFilter), isFalse);
      expect(matches(lease, leaseFilter), isTrue);
    });

    test('filter by verifiedOnly', () {
      final unverified = makeListing(isSellerVerified: false);
      final verified = makeListing(isSellerVerified: true);
      const filter = MarketFilters(verifiedOnly: true);

      expect(matches(unverified, filter), isFalse);
      expect(matches(verified, filter), isTrue);
    });

    test('filter by location', () {
      final ubListing = makeListing(locationLabel: 'Улаанбаатар');
      final darkhanListing = makeListing(locationLabel: 'Дархан');
      const filter = MarketFilters(location: 'Улаанбаатар');

      expect(matches(ubListing, filter), isTrue);
      expect(matches(darkhanListing, filter), isFalse);
    });

    test('filter by minPrice', () {
      final cheap = makeListing(priceAmount: 1000000);
      final expensive = makeListing(priceAmount: 10000000);
      const filter = MarketFilters(minPrice: 5000000);

      expect(matches(cheap, filter), isFalse);
      expect(matches(expensive, filter), isTrue);
    });

    test('filter by maxPrice', () {
      final cheap = makeListing(priceAmount: 1000000);
      final expensive = makeListing(priceAmount: 10000000);
      const filter = MarketFilters(maxPrice: 5000000);

      expect(matches(cheap, filter), isTrue);
      expect(matches(expensive, filter), isFalse);
    });

    test('filter by text query', () {
      final listing = makeListing(
        title: 'Хан Хүлэг',
        description: 'Шилдэг азарга',
      );

      const matchFilter = MarketFilters(query: 'Хүлэг');
      const noMatchFilter = MarketFilters(query: 'xyz');

      expect(matches(listing, matchFilter), isTrue);
      expect(matches(listing, noMatchFilter), isFalse);
    });

    test('empty filter matches all', () {
      final listing = makeListing();
      const emptyFilter = MarketFilters();
      expect(matches(listing, emptyFilter), isTrue);
    });

    test('combined filters', () {
      final listing = makeListing(
        saleType: MarketSaleType.sale,
        isSellerVerified: true,
        locationLabel: 'Улаанбаатар',
        priceAmount: 5000000,
      );

      const allMatch = MarketFilters(
        saleType: MarketSaleType.sale,
        verifiedOnly: true,
        location: 'Улаанбаатар',
        minPrice: 3000000,
        maxPrice: 8000000,
      );
      expect(matches(listing, allMatch), isTrue);

      const wrongType = MarketFilters(saleType: MarketSaleType.lease);
      expect(matches(listing, wrongType), isFalse);

      const notVerified = MarketFilters(verifiedOnly: true);
      // listing is verified, so this should match
      expect(matches(listing, notVerified), isTrue);
    });
  });

  // ── Sorting ─────────────────────────────────────────────────────

  group('sorting', () {
    List<MarketListing> createSortList() {
      return [
        MarketListing(
          id: 'a',
          horseId: 'h1',
          sellerId: 's1',
          title: 'A',
          description: '',
          priceAmount: 1000,
          currency: 'MNT',
          saleType: MarketSaleType.sale,
          status: MarketListingStatus.active,
          locationLabel: '',
          disciplineTags: [],
          documentTags: [],
          mediaUrls: [],
          isSellerVerified: false,
          createdAt: DateTime(2026, 1, 1),
          updatedAt: DateTime(2026, 1, 1),
          viewsCount: 10,
        ),
        MarketListing(
          id: 'b',
          horseId: 'h2',
          sellerId: 's2',
          title: 'B',
          description: '',
          priceAmount: 5000,
          currency: 'MNT',
          saleType: MarketSaleType.sale,
          status: MarketListingStatus.active,
          locationLabel: '',
          disciplineTags: [],
          documentTags: [],
          mediaUrls: [],
          isSellerVerified: false,
          createdAt: DateTime(2026, 3, 1),
          updatedAt: DateTime(2026, 3, 1),
          viewsCount: 50,
        ),
        MarketListing(
          id: 'c',
          horseId: 'h3',
          sellerId: 's3',
          title: 'C',
          description: '',
          priceAmount: 3000,
          currency: 'MNT',
          saleType: MarketSaleType.sale,
          status: MarketListingStatus.active,
          locationLabel: '',
          disciplineTags: [],
          documentTags: [],
          mediaUrls: [],
          isSellerVerified: true,
          createdAt: DateTime(2026, 2, 1),
          updatedAt: DateTime(2026, 2, 1),
          viewsCount: 30,
        ),
      ];
    }

    test('sort by newest (descending createdAt)', () {
      final list = createSortList();
      list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      expect(list.map((l) => l.id).toList(), ['b', 'c', 'a']);
    });

    test('sort by priceLow (ascending)', () {
      final list = createSortList();
      list.sort((a, b) => a.priceAmount.compareTo(b.priceAmount));
      expect(list.map((l) => l.id).toList(), ['a', 'c', 'b']);
    });

    test('sort by priceHigh (descending)', () {
      final list = createSortList();
      list.sort((a, b) => b.priceAmount.compareTo(a.priceAmount));
      expect(list.map((l) => l.id).toList(), ['b', 'c', 'a']);
    });

    test('sort by popular (descending viewsCount)', () {
      final list = createSortList();
      list.sort((a, b) => b.viewsCount.compareTo(a.viewsCount));
      expect(list.map((l) => l.id).toList(), ['b', 'c', 'a']);
    });
  });

  // ── MarketListingVm ─────────────────────────────────────────────

  group('MarketListingVm', () {
    test('constructs with all fields', () {
      final now = DateTime(2026, 5, 1);
      final listing = MarketListing(
        id: 'ml-1',
        horseId: 'h1',
        sellerId: 's1',
        title: 'Test',
        description: '',
        priceAmount: 1000,
        currency: 'MNT',
        saleType: MarketSaleType.sale,
        status: MarketListingStatus.active,
        locationLabel: 'UB',
        disciplineTags: [],
        documentTags: [],
        mediaUrls: [],
        isSellerVerified: false,
        createdAt: now,
        updatedAt: now,
      );

      final vm = MarketListingVm(
        listing: listing,
        horse: null,
        events: [],
        isFavorite: true,
      );

      expect(vm.listing, listing);
      expect(vm.horse, isNull);
      expect(vm.events, isEmpty);
      expect(vm.isFavorite, isTrue);
    });
  });
}
