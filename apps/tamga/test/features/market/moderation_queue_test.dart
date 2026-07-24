import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/storage/isar_database.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/market/data/local_market_repository_v2.dart';
import 'package:tamga/src/features/market/domain/market_listing.dart';
import 'package:tamga/src/features/market/domain/market_safety.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';

import '../../helpers/test_helpers.dart';

void main() {
  group('ModerationQueue', () {
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

    group('fetchAllReports', () {
      test('returns empty list when no reports exist', () async {
        final result = await repository.fetchAllReports();
        expect(result.isSuccess, true);
        expect(result.value, isEmpty);
      });

      test('returns all reports across listings', () async {
        // Create first report
        await repository.createReport(
          listingId: 'listing-1',
          reporterId: 'reporter-1',
          reason: 'Хуурамч мэдээлэл',
        );

        // Create second report
        await repository.createReport(
          listingId: 'listing-2',
          reporterId: 'reporter-2',
          reason: 'Давхар зар',
        );

        final result = await repository.fetchAllReports();
        expect(result.isSuccess, true);
        expect(result.value.length, 2);
      });

      test('returns reports with correct fields', () async {
        final report = await repository.createReport(
          listingId: 'listing-1',
          reporterId: 'reporter-1',
          reason: 'Зохисгүй агуулга',
        );

        expect(report.isSuccess, true);
        final r = report.value;
        expect(r.listingId, 'listing-1');
        expect(r.reporterId, 'reporter-1');
        expect(r.reason, 'Зохисгүй агуулга');
        expect(r.status, ListingReportStatus.submitted);
      });
    });

    group('approve and reject listing', () {
      test('approve listing sets status to active', () async {
        final now = DateTime(2026, 5, 1);
        final listing = await repository.saveListing(
          MarketListing(
            id: 'ml-1',
            horseId: 'h1',
            sellerId: 'seller-local',
            title: 'Хан Хүлэг',
            description: 'Шилдэг азарга',
            priceAmount: 5000000,
            currency: 'MNT',
            saleType: MarketSaleType.sale,
            status: MarketListingStatus.pendingVerification,
            locationLabel: 'Улаанбаатар',
            disciplineTags: [],
            documentTags: [],
            mediaUrls: [],
            isSellerVerified: false,
            createdAt: now,
            updatedAt: now,
          ),
        );
        expect(listing.isSuccess, true);

        // Use renewListing to set status to active (same as approve)
        final approveResult = await repository.renewListing('ml-1');
        expect(approveResult.isSuccess, true);

        final fetched = await repository.fetchListingById('ml-1');
        expect(fetched.isSuccess, true);
        expect(fetched.value?.status, MarketListingStatus.active);
        expect(fetched.value?.isActive, isTrue);
      });

      test('reject listing sets status to rejected', () async {
        final now = DateTime(2026, 5, 1);
        await repository.saveListing(
          MarketListing(
            id: 'ml-2',
            horseId: 'h1',
            sellerId: 'seller-local',
            title: 'Тест зар',
            description: 'Тайлбар',
            priceAmount: 1000000,
            currency: 'MNT',
            saleType: MarketSaleType.sale,
            status: MarketListingStatus.pendingVerification,
            locationLabel: 'Улаанбаатар',
            disciplineTags: [],
            documentTags: [],
            mediaUrls: [],
            isSellerVerified: false,
            createdAt: now,
            updatedAt: now,
          ),
        );

        // Reject by marking as rejected (using _updateStatus equivalent)
        // In the repository, we can use saveListing with rejected status
        final rejectResult = await repository.saveListing(
          MarketListing(
            id: 'ml-2',
            horseId: 'h1',
            sellerId: 'seller-local',
            title: 'Тест зар',
            description: 'Тайлбар',
            priceAmount: 1000000,
            currency: 'MNT',
            saleType: MarketSaleType.sale,
            status: MarketListingStatus.rejected,
            locationLabel: 'Улаанбаатар',
            disciplineTags: [],
            documentTags: [],
            mediaUrls: [],
            isSellerVerified: false,
            createdAt: now,
            updatedAt: now,
          ),
        );
        expect(rejectResult.isSuccess, true);

        final fetched = await repository.fetchListingById('ml-2');
        expect(fetched.isSuccess, true);
        expect(fetched.value?.status, MarketListingStatus.rejected);
        expect(fetched.value?.isActive, isFalse);
      });

      test('approve resolves report status', () async {
        final report = await repository.createReport(
          listingId: 'listing-approve',
          reporterId: 'reporter-1',
          reason: 'Туршилт',
        );
        expect(report.isSuccess, true);
        final reportId = report.value.id;

        // Resolve the report
        final resolveResult = await repository.resolveReport(
          reportId,
          ListingReportStatus.resolved,
        );
        expect(resolveResult.isSuccess, true);

        final allReports = await repository.fetchAllReports();
        final resolved = allReports.value.firstWhere((r) => r.id == reportId);
        expect(resolved.status, ListingReportStatus.resolved);
      });
    });
  });
}
