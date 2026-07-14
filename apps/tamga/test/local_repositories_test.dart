// ignore_for_file: deprecated_member_use_from_same_package

import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/storage/isar_database.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';

import 'helpers/test_helpers.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';

import 'package:tamga/src/features/horses/data/local_horses_repository.dart';
import 'package:tamga/src/features/horses/domain/horse_record.dart';
import 'package:tamga/src/features/horses/data/local_health_repository.dart';
import 'package:tamga/src/shared/domain/health_log.dart';
import 'package:tamga/src/features/market/data/local_market_repository.dart';
import 'package:tamga/src/features/market/domain/market_listing.dart';
import 'package:tamga/src/features/market/domain/market_safety.dart';

void main() {
  late SyncQueue syncQueue;

  setUp(() async {
    await setupTestEnvironment();
    await IsarDatabase.initialize();
    syncQueue = SyncQueue();
  });

  tearDown(() async {
    await IsarDatabase.close();
  });

  test(
    'LocalHorsesRepository.saveHorse persists a new horse locally',
    () async {
      final repository = LocalHorsesRepository(
        storage: IsarStorage.instance,
        syncQueue: syncQueue,
      );

      await repository.fetchHorses();
      final result = await repository.saveHorse(
        HorseRecord(
          id: 'test-horse',
          name: 'Тест Морь',
          relationLabel: 'Хүү',
          coat: 'Хар',
          birthYear: 2024,
          awardCount: 0,
          offspringCount: 0,
          isOwnedByHousehold: true,
          notes: 'Тест нэмэлт морь.',
          gender: HorseGender.gelding,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      );

      expect(result.isSuccess, isTrue);
      expect(result.getOrThrow().id, 'test-horse');
    },
  );

  test('LocalMarketRepository saves listings and toggles favorites', () async {
    final repository = LocalMarketRepository(IsarStorage.instance);

    await repository.fetchListings();
    final now = DateTime(2026, 4, 24);
    final listings = await repository.saveListing(
      MarketListing(
        id: 'test-listing',
        horseId: 'test-horse',
        sellerId: 'seller-local',
        title: 'Тест marketplace зар',
        description: 'Баталгаатай бичиг баримттай тест зар.',
        priceAmount: 1000000,
        currency: 'MNT',
        saleType: MarketSaleType.sale,
        status: MarketListingStatus.active,
        locationLabel: 'Улаанбаатар',
        disciplineTags: const ['Test'],
        documentTags: const ['Pedigree'],
        mediaUrls: const [],
        isSellerVerified: true,
        createdAt: now,
        updatedAt: now,
      ),
    );
    final favorites = await repository.toggleFavorite('test-listing');

    expect(listings.any((listing) => listing.id == 'test-listing'), isTrue);
    expect(favorites, contains('test-listing'));
  });

  test(
    'LocalMarketRepository seeds seller profiles and persists safety actions',
    () async {
      final repository = LocalMarketRepository(IsarStorage.instance);

      final profile = await repository.fetchSellerProfile('seller-tamga');
      final firstInquiry = await repository.createInquiry(
        listingId: 'listing-altan-shuurga',
        buyerId: 'local-buyer',
        sellerId: 'seller-tamga',
      );
      final duplicateInquiry = await repository.createInquiry(
        listingId: 'listing-altan-shuurga',
        buyerId: 'local-buyer',
        sellerId: 'seller-tamga',
      );
      final inquiries = await repository.fetchInquiries(
        'listing-altan-shuurga',
      );
      final report = await repository.createReport(
        listingId: 'listing-altan-shuurga',
        reporterId: 'local-reporter',
        reason: 'Missing vet record',
      );
      final reports = await repository.fetchReports('listing-altan-shuurga');

      expect(profile?.stableName, 'Адуучин өрхийн жүчээ');
      expect(firstInquiry.status, MarketInquiryStatus.newInquiry);
      expect(duplicateInquiry.id, firstInquiry.id);
      expect(inquiries, hasLength(1));
      expect(report.status, ListingReportStatus.submitted);
      expect(reports.single.reason, 'Missing vet record');
    },
  );

  test('LocalHealthRepository saves and deletes medical logs', () async {
    final repository = LocalHealthRepository(IsarStorage.instance);

    const horseId = 'test-horse';
    final medLog = HealthLog(
      id: 'test-med',
      horseId: horseId,
      logType: LogType.vaccination,
      date: DateTime(2026, 5, 23),
      notes: 'Test vaccination notes',
      medicament: 'Test-Vacc',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    await repository.saveMedicalLog(medLog);
    final medLogs = (await repository.fetchMedicalLogs(horseId)).getOrThrow();
    expect(medLogs.length, 1);
    expect(medLogs.first.id, 'test-med');
    expect(medLogs.first.medicament, 'Test-Vacc');

    await repository.deleteMedicalLog(horseId, 'test-med');
    final medLogsAfterDelete = (await repository.fetchMedicalLogs(
      horseId,
    )).getOrThrow();
    expect(medLogsAfterDelete.isEmpty, isTrue);
  });
}
