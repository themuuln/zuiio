import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/storage/isar_database.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';
import 'package:tamga/src/features/market/data/local_market_repository_v2.dart';
import 'package:tamga/src/features/market/domain/market_listing.dart';

import '../../helpers/test_helpers.dart';

void main() {
  group('LocalMarketRepositoryV2 incrementViewsCount enqueue', () {
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

    test(
      'incrementViewsCount enqueues SyncQueueItem with entityType market',
      () async {
        // VAL-SYNC-010: incrementViewsCount enqueues SyncQueueItem
        // First create a listing
        final now = DateTime(2026, 6, 1);
        await repository.saveListing(
          MarketListing(
            id: 'view-test-1',
            horseId: 'h1',
            sellerId: 's1',
            title: 'Үзэлт Тест',
            description: 'Views test',
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
        syncQueue.clear();

        // Now increment views
        final result = await repository.incrementViewsCount('view-test-1');
        expect(result.isSuccess, true);

        expect(syncQueue.pendingCount, greaterThanOrEqualTo(1));
        final item = syncQueue.peek();
        expect(item, isNotNull);
        expect(item!.entityType, 'market');
        expect(item.entityId, 'view-test-1');
        expect(item.action, SyncAction.update);
      },
    );

    test('incrementViewsCount increments view count locally', () async {
      final now = DateTime(2026, 6, 1);
      await repository.saveListing(
        MarketListing(
          id: 'view-test-2',
          horseId: 'h2',
          sellerId: 's2',
          title: 'Үзэлт Тест 2',
          description: 'Views count test',
          priceAmount: 2000000,
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

      await repository.incrementViewsCount('view-test-2');

      final listing = await repository.fetchListingById('view-test-2');
      expect(listing.isSuccess, true);
      expect(listing.value!.viewsCount, 1);
    });
  });
}
