import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/storage/isar_database.dart';

import 'helpers/test_helpers.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/market/data/local_market_repository_v2.dart';
import 'package:tamga/src/features/market/domain/market_listing.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';

void main() {
  setUp(() async {
    await setupTestEnvironment();
    await IsarDatabase.initialize();
  });

  tearDown(() async {
    await IsarDatabase.close();
  });

  group('Phase 3: Digital Certificates Tests', () {
    test(
      'issueCertificate, fetchCertificateForHorse, and transferCertificate work',
      () async {
        final repository = LocalMarketRepositoryV2(
          storage: IsarStorage.instance,
          syncQueue: SyncQueue(),
        );

        // 1. Initial seed check
        final altanCertResult = await repository.fetchCertificateForHorse(
          'altan-shuurga',
        );
        final altanCert = altanCertResult.getOrThrow();
        expect(altanCert, isNotNull);
        expect(altanCert!.ownerId, 'seller-tamga');
        expect(altanCert.isVerified, isTrue);

        // 2. Issue a new certificate
        final newCertResult = await repository.issueCertificate(
          horseId: 'test-horse',
          ownerId: 'seller-local',
          issuer: 'Tamga Registrar',
        );
        final newCert = newCertResult.getOrThrow();
        expect(newCert.horseId, 'test-horse');
        expect(newCert.ownerId, 'seller-local');

        final fetchedResult = await repository.fetchCertificateForHorse(
          'test-horse',
        );
        final fetched = fetchedResult.getOrThrow();
        expect(fetched, isNotNull);
        expect(fetched!.id, newCert.id);

        // 3. Transfer the certificate
        await repository.transferCertificate(
          horseId: 'test-horse',
          newOwnerId: 'new-owner',
        );
        final afterTransferResult = await repository.fetchCertificateForHorse(
          'test-horse',
        );
        final afterTransfer = afterTransferResult.getOrThrow();
        expect(afterTransfer!.ownerId, 'new-owner');
      },
    );
  });

  group('Phase 3: Stud Service Listing Type Tests', () {
    test('MarketSaleType.stud labels correctly', () {
      expect(MarketSaleType.stud.label, 'Ороо / Хээлтүүлэг');
    });
  });

  group('Phase 3: Seller Ratings Tests', () {
    test('submitSellerRating updates averageRating and review list', () async {
      final repository = LocalMarketRepositoryV2(
        storage: IsarStorage.instance,
        syncQueue: SyncQueue(),
      );

      final profileBeforeResult = await repository.fetchSellerProfile(
        'seller-tamga',
      );
      final profileBefore = profileBeforeResult.getOrThrow();
      expect(profileBefore, isNotNull);
      expect(profileBefore!.ratingCount, 0);
      expect(profileBefore.averageRating, 0.0);

      // Rate the seller
      await repository.submitSellerRating(
        listingId: 'test-listing-1',
        sellerId: 'seller-tamga',
        buyerId: 'buyer-1',
        rating: 5,
        review: 'Excellent horse seller!',
      );

      final profileAfterResult = await repository.fetchSellerProfile(
        'seller-tamga',
      );
      final profileAfter = profileAfterResult.getOrThrow();
      expect(profileAfter!.ratingCount, 1);
      expect(profileAfter.averageRating, 5.0);
      expect(profileAfter.reviews.length, 1);

      // Add a second rating
      await repository.submitSellerRating(
        listingId: 'test-listing-1',
        sellerId: 'seller-tamga',
        buyerId: 'buyer-1',
        rating: 4,
        review: 'Very good.',
      );

      final profileAfterTwoResult = await repository.fetchSellerProfile(
        'seller-tamga',
      );
      final profileAfterTwo = profileAfterTwoResult.getOrThrow();
      expect(profileAfterTwo!.ratingCount, 2);
      expect(profileAfterTwo.averageRating, 4.5); // (5.0 + 4.0) / 2
      expect(profileAfterTwo.reviews, contains('[4★] Very good.'));
    });
  });

  group('Phase 3: Price History Tests', () {
    test('fetchPriceHistory returns seeded transaction history', () async {
      final repository = LocalMarketRepositoryV2(
        storage: IsarStorage.instance,
        syncQueue: SyncQueue(),
      );

      final historyResult = await repository.fetchPriceHistory();
      final history = historyResult.getOrThrow();
      expect(history, isNotEmpty);
      expect(history.length, greaterThanOrEqualTo(6));
      expect(history.any((rec) => rec.region == 'Архангай'), isTrue);
      expect(history.any((rec) => rec.lineageRootId == 'uulen-bor'), isTrue);
    });
  });
}
