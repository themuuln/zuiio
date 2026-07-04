import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/storage/isar_database.dart';

import '../../../helpers/test_helpers.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';
import 'package:tamga/src/features/market/domain/market_listing.dart';
import 'package:tamga/src/features/market/domain/market_safety.dart';
import 'package:tamga/src/features/market/data/local_market_repository_v2.dart';

void main() {
  group('MarketListing isFavorite', () {
    test('defaults to false', () {
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
        disciplineTags: const [],
        documentTags: const [],
        mediaUrls: const [],
        isSellerVerified: false,
        createdAt: DateTime(2026, 1, 1),
        updatedAt: DateTime(2026, 1, 1),
      );
      expect(listing.isFavorite, isFalse);
    });

    test('copyWith preserves isFavorite', () {
      final original = MarketListing(
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
        disciplineTags: const [],
        documentTags: const [],
        mediaUrls: const [],
        isSellerVerified: false,
        createdAt: DateTime(2026, 1, 1),
        updatedAt: DateTime(2026, 1, 1),
        isFavorite: true,
      );

      final copied = original.copyWith(title: 'New');
      expect(copied.isFavorite, isTrue);
      expect(copied.title, 'New');
    });

    test('copyWith can change isFavorite', () {
      final original = MarketListing(
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
        disciplineTags: const [],
        documentTags: const [],
        mediaUrls: const [],
        isSellerVerified: false,
        createdAt: DateTime(2026, 1, 1),
        updatedAt: DateTime(2026, 1, 1),
      );

      final favorited = original.copyWith(isFavorite: true);
      expect(favorited.isFavorite, isTrue);

      final unfavorited = favorited.copyWith(isFavorite: false);
      expect(unfavorited.isFavorite, isFalse);
    });

    test('toJson/fromJson round-trip preserves isFavorite', () {
      final original = MarketListing(
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
        disciplineTags: const [],
        documentTags: const [],
        mediaUrls: const [],
        isSellerVerified: false,
        createdAt: DateTime(2026, 1, 1),
        updatedAt: DateTime(2026, 1, 1),
        isFavorite: true,
      );

      final json = original.toJson();
      final restored = MarketListing.fromJson(json);
      expect(restored.isFavorite, isTrue);
    });

    test('fromJson defaults isFavorite to false when missing', () {
      final json = {
        'id': 'ml-1',
        'horseId': 'h1',
        'sellerId': 's1',
        'title': 'Test',
        'description': '',
        'priceAmount': 1000,
        'currency': 'MNT',
        'saleType': 'sale',
        'status': 'active',
        'locationLabel': 'UB',
        'disciplineTags': <String>[],
        'documentTags': <String>[],
        'mediaUrls': <String>[],
        'isSellerVerified': false,
        'createdAt': '2026-01-01T00:00:00.000',
        'updatedAt': '2026-01-01T00:00:00.000',
      };

      final listing = MarketListing.fromJson(json);
      expect(listing.isFavorite, isFalse);
    });
  });

  // ── Repository favorites ──────────────────────────────────────

  group('LocalMarketRepository favorites', () {
    late SyncQueue syncQueue;
    late LocalMarketRepositoryV2 repository;

    setUp(() async {
      await setupTestEnvironment();
      await IsarDatabase.initialize();
      syncQueue = SyncQueue();
      repository = LocalMarketRepositoryV2(
        storage: IsarStorage.instance,
        syncQueue: syncQueue,
      );
    });

    tearDown(() async {
      await IsarDatabase.close();
    });

    MarketListing createTestListing(String id) {
      return MarketListing(
        id: id,
        horseId: 'h1',
        sellerId: 's1',
        title: 'Horse $id',
        description: '',
        priceAmount: 1000000,
        currency: 'MNT',
        saleType: MarketSaleType.sale,
        status: MarketListingStatus.active,
        locationLabel: 'UB',
        disciplineTags: const [],
        documentTags: const [],
        mediaUrls: const [],
        isSellerVerified: false,
        createdAt: DateTime(2026, 1, 1),
        updatedAt: DateTime(2026, 1, 1),
      );
    }

    test('fetchFavoriteListingIds returns empty initially', () async {
      final favorites = await repository.fetchFavoriteListingIds();
      expect(favorites.getOrThrow(), isEmpty);
    });

    test('toggleFavorite marks listing as favorite', () async {
      await repository.saveListing(createTestListing('m1'));
      syncQueue.clear();

      final result = await repository.toggleFavorite('m1');
      expect(result.getOrThrow(), contains('m1'));
    });

    test('toggleFavorite twice unmarks listing', () async {
      await repository.saveListing(createTestListing('m1'));

      await repository.toggleFavorite('m1');
      final afterFirst = await repository.fetchFavoriteListingIds();
      expect(afterFirst.getOrThrow(), contains('m1'));

      await repository.toggleFavorite('m1');
      final afterSecond = await repository.fetchFavoriteListingIds();
      expect(afterSecond.getOrThrow(), isEmpty);
    });

    test('favorites are preserved across saveListing', () async {
      await repository.saveListing(createTestListing('m1'));
      await repository.toggleFavorite('m1');

      // Re-save the same listing (update)
      await repository.saveListing(createTestListing('m1'));

      final favorites = await repository.fetchFavoriteListingIds();
      expect(favorites.getOrThrow(), contains('m1'));
    });

    test('multiple favorites work', () async {
      await repository.saveListing(createTestListing('m1'));
      await repository.saveListing(createTestListing('m2'));
      await repository.saveListing(createTestListing('m3'));

      await repository.toggleFavorite('m1');
      await repository.toggleFavorite('m3');

      final favorites = await repository.fetchFavoriteListingIds();
      expect(favorites.getOrThrow(), containsAll(['m1', 'm3']));
      expect(favorites.getOrThrow(), isNot(contains('m2')));
    });
  });

  // ── Repository inquiries ──────────────────────────────────────

  group('LocalMarketRepository inquiries', () {
    late SyncQueue syncQueue;
    late LocalMarketRepositoryV2 repository;

    setUp(() async {
      await setupTestEnvironment();
      await IsarDatabase.initialize();
      syncQueue = SyncQueue();
      repository = LocalMarketRepositoryV2(
        storage: IsarStorage.instance,
        syncQueue: syncQueue,
      );
    });

    tearDown(() async {
      await IsarDatabase.close();
    });

    test('fetchInquiries returns empty initially', () async {
      final inquiries = await repository.fetchInquiries('listing-1');
      expect(inquiries.getOrThrow(), isEmpty);
    });

    test('createInquiry creates and persists inquiry', () async {
      final inquiryResult = await repository.createInquiry(
        listingId: 'listing-1',
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
      );
      final inquiry = inquiryResult.getOrThrow();

      expect(inquiry.listingId, 'listing-1');
      expect(inquiry.buyerId, 'buyer-1');
      expect(inquiry.sellerId, 'seller-1');
      expect(inquiry.status, MarketInquiryStatus.newInquiry);

      final fetched = await repository.fetchInquiries('listing-1');
      expect(fetched.getOrThrow().length, 1);
      expect(fetched.getOrThrow().first.id, inquiry.id);
    });
  });

  // ── Repository reports ────────────────────────────────────────

  group('LocalMarketRepository reports', () {
    late SyncQueue syncQueue;
    late LocalMarketRepositoryV2 repository;

    setUp(() async {
      await setupTestEnvironment();
      await IsarDatabase.initialize();
      syncQueue = SyncQueue();
      repository = LocalMarketRepositoryV2(
        storage: IsarStorage.instance,
        syncQueue: syncQueue,
      );
    });

    tearDown(() async {
      await IsarDatabase.close();
    });

    test('fetchReports returns empty initially', () async {
      final reports = await repository.fetchReports('listing-1');
      expect(reports.getOrThrow(), isEmpty);
    });

    test('createReport creates and persists report', () async {
      final reportResult = await repository.createReport(
        listingId: 'listing-1',
        reporterId: 'reporter-1',
        reason: 'Suspicious pricing',
      );
      final report = reportResult.getOrThrow();

      expect(report.listingId, 'listing-1');
      expect(report.reporterId, 'reporter-1');
      expect(report.reason, 'Suspicious pricing');
      expect(report.status, ListingReportStatus.submitted);

      final fetched = await repository.fetchReports('listing-1');
      expect(fetched.getOrThrow().length, 1);
      expect(fetched.getOrThrow().first.id, report.id);
    });
  });
}
