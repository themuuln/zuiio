import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/storage/isar_database.dart';

import '../../helpers/test_helpers.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';
import 'package:tamga/src/features/market/domain/market_listing.dart';
import 'package:tamga/src/features/market/data/local_market_repository_v2.dart';

void main() {
  group('LocalMarketRepository', () {
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

    test('fetchListings returns empty on first call', () async {
      final result = await repository.fetchListings();
      expect(result.isSuccess, true);
      expect(result.value, isEmpty);
    });

    test('saveListing adds a listing', () async {
      final now = DateTime(2026, 5, 1);
      final listing = MarketListing(
        id: 'm1',
        horseId: 'h1',
        sellerId: 's1',
        title: 'Хан Хүлэг',
        description: 'Шилдэг азарга',
        priceAmount: 5000000,
        currency: 'MNT',
        saleType: MarketSaleType.sale,
        status: MarketListingStatus.active,
        locationLabel: 'Улаанбаатар',
        disciplineTags: ['Уралдаан'],
        documentTags: ['Pedigree'],
        mediaUrls: [],
        isSellerVerified: true,
        createdAt: now,
        updatedAt: now,
      );

      final result = await repository.saveListing(listing);
      expect(result.isSuccess, true);
      expect(result.value.title, 'Хан Хүлэг');
    });

    test('saveListing enqueues sync create', () async {
      final now = DateTime(2026, 1, 1);
      await repository.saveListing(
        MarketListing(
          id: 'm2',
          horseId: 'h1',
          sellerId: 's1',
          title: 'Test',
          description: 'desc',
          priceAmount: 1000000,
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
        ),
      );
      expect(syncQueue.pendingCount, 1);
      expect(syncQueue.peek()!.entityType, 'market');
      expect(syncQueue.peek()!.action, SyncAction.create);
    });

    test('saveListing updates existing listing', () async {
      final now = DateTime(2026, 1, 1);
      await repository.saveListing(
        MarketListing(
          id: 'm1',
          horseId: 'h1',
          sellerId: 's1',
          title: 'Old',
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
        ),
      );
      syncQueue.clear();

      await repository.saveListing(
        MarketListing(
          id: 'm1',
          horseId: 'h1',
          sellerId: 's1',
          title: 'Updated',
          description: 'New desc',
          priceAmount: 2000,
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
        ),
      );

      final fetch = await repository.fetchListings();
      expect(fetch.value.length, 1);
      expect(fetch.value.first.title, 'Updated');
      expect(fetch.value.first.priceAmount, 2000);
      expect(syncQueue.peek()!.action, SyncAction.update);
    });

    test('deleteListing removes and enqueues delete', () async {
      final now = DateTime(2026, 1, 1);
      await repository.saveListing(
        MarketListing(
          id: 'm1',
          horseId: 'h1',
          sellerId: 's1',
          title: 'Del',
          description: '',
          priceAmount: 100,
          currency: 'MNT',
          saleType: MarketSaleType.sale,
          status: MarketListingStatus.pendingVerification,
          locationLabel: '',
          disciplineTags: [],
          documentTags: [],
          mediaUrls: [],
          isSellerVerified: false,
          createdAt: now,
          updatedAt: now,
        ),
      );
      syncQueue.clear();

      await repository.deleteListing('m1');
      final fetch = await repository.fetchListings();
      expect(fetch.value, isEmpty);
      expect(syncQueue.peek()!.action, SyncAction.delete);
    });

    test(
      'fetchListingsBySeller returns only that seller\'s listings',
      () async {
        final now = DateTime(2026, 1, 1);
        for (int i = 0; i < 3; i++) {
          await repository.saveListing(
            MarketListing(
              id: 'm$i',
              horseId: 'h$i',
              sellerId: i < 2 ? 's1' : 's2',
              title: 'Horse $i',
              description: '',
              priceAmount: 100,
              currency: 'MNT',
              saleType: MarketSaleType.sale,
              status: MarketListingStatus.active,
              locationLabel: '',
              disciplineTags: [],
              documentTags: [],
              mediaUrls: [],
              isSellerVerified: false,
              createdAt: now,
              updatedAt: now,
            ),
          );
        }

        final s1Listings = await repository.fetchListingsBySeller('s1');
        expect(s1Listings.isSuccess, true);
        expect(s1Listings.value.length, 2);
      },
    );
  });
}
