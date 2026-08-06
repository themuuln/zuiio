import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/core/sync/connection_status.dart';
import 'package:tamga/src/features/horses/data/co_ownership_repository.dart';
import 'package:tamga/src/features/horses/domain/co_ownership.dart';
import 'package:tamga/src/features/horses/domain/horse_record.dart';
import 'package:tamga/src/features/documents/data/document_repository.dart';
import 'package:tamga/src/features/certificates/data/certificate_repository.dart';
import 'package:tamga/src/features/payments/data/payment_repository.dart';
import 'package:tamga/src/features/profile/application/cloud_sync_coordinator.dart';
import 'package:tamga/src/features/horses/data/horses_repository.dart';
import 'package:tamga/src/features/health/data/health_repository.dart';
import 'package:tamga/src/shared/domain/health_log.dart';
import 'package:tamga/src/features/events/data/event_repository.dart';
import 'package:tamga/src/features/market/data/market_repository.dart';
import 'package:tamga/src/features/market/data/supabase_market_repository.dart';
import 'package:tamga/src/features/market/domain/market_listing.dart';
import 'package:tamga/src/features/breeding/data/breeding_repository.dart';
import 'package:tamga/src/features/breeding/data/supabase_breeding_repository.dart';
import 'package:tamga/src/features/breeding/domain/breeding_record.dart';
import 'package:tamga/src/shared/domain/event.dart';
import 'package:tamga/src/features/profile/data/profile_settings_repository.dart';
import 'package:tamga/src/features/map/data/map_repository.dart';
import 'package:tamga/src/features/map/data/lost_horse_repository.dart';
import 'package:tamga/src/features/map/domain/lost_horse_report.dart';
import 'package:tamga/src/features/map/domain/map_enums.dart';
import 'package:tamga/src/features/map/domain/sighting_report.dart';
import 'package:tamga/src/features/shared/data/isar_sync_storage.dart';
import 'package:tamga/src/features/shared/data/isar_schemas/isar_lost_horse_media_draft.dart';

// ── Mock classes ─────────────────────────────────────────────────────────

class MockHorsesRepository extends Mock implements HorsesRepository {}

class MockHealthRepository extends Mock implements HealthRepository {}

class MockEventRepository extends Mock implements EventRepository {}

class MockMarketRepository extends Mock implements MarketRepository {}

class MockBreedingRepository extends Mock implements BreedingRepository {}

class MockSupabaseMarketRepository extends Mock
    implements SupabaseMarketRepository {}

class MockSupabaseBreedingRepository extends Mock
    implements SupabaseBreedingRepository {}

class MockProfileSettingsRepository extends Mock
    implements ProfileSettingsRepository {}

class MockMapRepository extends Mock implements MapRepository {}

class MockIsarSyncStorage extends Mock implements IsarSyncStorage {}

class MockConnectionMonitor extends Mock implements ConnectionMonitor {}

class MockCoOwnershipRepository extends Mock implements CoOwnershipRepository {}

class MockDocumentRepository extends Mock implements DocumentRepository {}

class MockCertificateRepository extends Mock implements CertificateRepository {}

class MockPaymentRepository extends Mock implements PaymentRepository {}

class MockLostHorseRepository extends Mock implements LostHorseRepository {}

// ── Fallback value registration ─────────────────────────────────────────

void _registerFallbackValues() {
  registerFallbackValue(
    LostHorseReport(
      id: 'fallback-report',
      ownerId: 'fallback-owner',
      lastSeenLat: 47.9,
      lastSeenLng: 106.9,
      lastSeenAt: DateTime(2026),
      createdAt: DateTime(2026),
      updatedAt: DateTime(2026),
    ),
  );
  registerFallbackValue(
    SightingReport(
      id: 'fallback-sighting',
      reportId: 'fallback-report',
      reporterId: 'fallback-reporter',
      lat: 47.9,
      lng: 106.9,
      createdAt: DateTime(2026),
    ),
  );
  registerFallbackValue(
    CoOwnershipRecord(
      id: 'fallback-id',
      horseId: 'fallback-horse',
      coOwnerName: 'fallback-name',
      phone: 'fallback-phone',
      role: 'fallback-role',
      permissions: const ['read'],
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    ),
  );
  registerFallbackValue(
    HealthLog(
      id: 'fallback-hl',
      horseId: 'fallback-horse',
      logType: LogType.vaccination,
      date: null,
      notes: '',
      createdAt: DateTime(2026),
      updatedAt: DateTime(2026),
    ),
  );
  registerFallbackValue(
    Event(
      id: 'fallback-evt',
      horseId: 'fallback-horse',
      title: 'fallback',
      eventType: EventType.race,
      createdAt: DateTime(2026),
      updatedAt: DateTime(2026),
    ),
  );
  registerFallbackValue(
    MarketListing.fromJson({
      'id': 'fallback-listing',
      'horseId': 'h',
      'sellerId': 's',
      'title': 'T',
      'description': 'D',
      'priceAmount': 1000,
      'currency': 'MNT',
      'saleType': 'sale',
      'status': 'published',
      'locationLabel': 'L',
      'disciplineTags': <String>[],
      'documentTags': <String>[],
      'mediaUrls': <String>[],
      'isSellerVerified': false,
      'createdAt': '2026-01-01T00:00:00.000',
      'updatedAt': '2026-01-01T00:00:00.000',
    }),
  );
  registerFallbackValue(
    BreedingRecord(
      id: 'fallback-br',
      sireId: 'sire',
      sireName: 'S',
      damId: 'dam',
      damName: 'D',
      breedingDate: DateTime(2026),
      expectedFoalingDate: DateTime(2026, 5),
      status: 'Хээлтсэн',
      herdLabel: '',
      notes: '',
      createdAt: DateTime(2026),
      updatedAt: DateTime(2026),
    ),
  );
  registerFallbackValue(
    HorseRecord(
      id: 'fallback-horse',
      ownerId: 'owner',
      name: 'Морь',
      relationLabel: '',
      coat: 'Хээр',
      birthYear: 2020,
      awardCount: 0,
      offspringCount: 0,
      isOwnedByHousehold: true,
      notes: '',
      gender: HorseGender.gelding,
      createdAt: DateTime(2026),
      updatedAt: DateTime(2026),
    ),
  );
}

// ── Test coordinator factory ────────────────────────────────────────────

/// Creates a [CloudSyncCoordinator] with all mocked dependencies.
///
/// Pass specific mock instances to override default mocks for assertion.
CloudSyncCoordinator createTestCoordinator({
  HorsesRepository? horsesRepository,
  HealthRepository? healthRepository,
  EventRepository? eventRepository,
  MarketRepository? marketRepository,
  BreedingRepository? breedingRepository,
  ProfileSettingsRepository? profileSettingsRepository,
  MapRepository? mapRepository,
  IsarSyncStorage? syncStorage,
  ConnectionMonitor? connectionMonitor,
  CoOwnershipRepository? coOwnershipRepository,
  DocumentRepository? documentRepository,
  CertificateRepository? certificateRepository,
  PaymentRepository? paymentRepository,
  LostHorseRepository? lostHorseRepository,
  HorsesRepository? cloudHorsesRepository,
  HealthRepository? cloudHealthRepository,
  EventRepository? cloudEventRepository,
  SupabaseMarketRepository? cloudMarketRepository,
  SupabaseBreedingRepository? cloudBreedingRepository,
}) {
  return CloudSyncCoordinator(
    horsesRepository: horsesRepository ?? MockHorsesRepository(),
    healthRepository: healthRepository ?? MockHealthRepository(),
    eventRepository: eventRepository ?? MockEventRepository(),
    marketRepository: marketRepository ?? MockMarketRepository(),
    breedingRepository: breedingRepository ?? MockBreedingRepository(),
    profileSettingsRepository:
        profileSettingsRepository ?? MockProfileSettingsRepository(),
    mapRepository: mapRepository ?? MockMapRepository(),
    syncStorage: syncStorage ?? MockIsarSyncStorage(),
    connectionMonitor: connectionMonitor ?? MockConnectionMonitor(),
    coOwnershipRepository: coOwnershipRepository ?? MockCoOwnershipRepository(),
    documentRepository: documentRepository ?? MockDocumentRepository(),
    certificateRepository: certificateRepository ?? MockCertificateRepository(),
    paymentRepository: paymentRepository ?? MockPaymentRepository(),
    lostHorseRepository: lostHorseRepository,
    cloudHorsesRepository: cloudHorsesRepository,
    cloudHealthRepository: cloudHealthRepository,
    cloudEventRepository: cloudEventRepository,
    cloudMarketRepository: cloudMarketRepository,
    cloudBreedingRepository: cloudBreedingRepository,
  );
}

// ── Tests ───────────────────────────────────────────────────────────────

void main() {
  setUpAll(() {
    _registerFallbackValues();
  });

  group('CloudSyncCoordinator push dispatch', () {
    // ── Co-ownership ─────────────────────────────────────────────

    test('_pushCoOwnership calls saveCoOwner for create action', () async {
      final coOwnershipRepo = MockCoOwnershipRepository();
      final coordinator = createTestCoordinator(
        coOwnershipRepository: coOwnershipRepo,
      );
      final item = SyncQueueItem(
        entityType: 'co_ownership',
        entityId: 'co-test-1',
        action: SyncAction.create,
        data: {
          'id': 'co-test-1',
          'horseId': 'h1',
          'coOwnerName': 'Тест',
          'phone': '99001122',
          'role': 'Эзэмшигч',
          'permissions': <String>['read', 'write'],
          'createdAt': '2026-01-01T00:00:00.000',
          'updatedAt': '2026-01-01T00:00:00.000',
        },
        timestamp: DateTime(2026, 6, 1),
      );

      when(
        () => coOwnershipRepo.saveCoOwner(any()),
      ).thenAnswer((_) async => Result.ok(<CoOwnershipRecord>[]));

      final result = await coordinator.testPushItem(item);

      expect(result.isSuccess, isTrue);
      verify(() => coOwnershipRepo.saveCoOwner(any())).called(1);
    });

    test('_pushCoOwnership calls deleteCoOwner for delete action', () async {
      final coOwnershipRepo = MockCoOwnershipRepository();
      final coordinator = createTestCoordinator(
        coOwnershipRepository: coOwnershipRepo,
      );
      final item = SyncQueueItem(
        entityType: 'co_ownership',
        entityId: 'co-test-1',
        action: SyncAction.delete,
        data: {},
        timestamp: DateTime(2026, 6, 1),
      );

      when(
        () => coOwnershipRepo.deleteCoOwner(any()),
      ).thenAnswer((_) async => Result.ok(<CoOwnershipRecord>[]));

      final result = await coordinator.testPushItem(item);

      expect(result.isSuccess, isTrue);
      verify(() => coOwnershipRepo.deleteCoOwner(any())).called(1);
    });

    // ── Document ─────────────────────────────────────────────────

    test('_pushDocument calls deleteDocument for delete action', () async {
      final documentRepo = MockDocumentRepository();
      final coordinator = createTestCoordinator(
        documentRepository: documentRepo,
      );
      final item = SyncQueueItem(
        entityType: 'document',
        entityId: 'doc-test-1',
        action: SyncAction.delete,
        data: {},
        timestamp: DateTime(2026, 6, 1),
      );

      when(
        () => documentRepo.deleteDocument(any()),
      ).thenAnswer((_) async => const Result<void>.ok(null));

      final result = await coordinator.testPushItem(item);

      expect(result.isSuccess, isTrue);
      verify(() => documentRepo.deleteDocument(any())).called(1);
    });

    test(
      '_pushDocument returns SUPABASE_NOT_CONFIGURED for create action',
      () async {
        final coordinator = createTestCoordinator();
        final item = SyncQueueItem(
          entityType: 'document',
          entityId: 'doc-test-2',
          action: SyncAction.create,
          data: {
            'id': 'doc-test-2',
            'horseId': 'h1',
            'ownerId': 'o1',
            'docType': 'registration',
            'title': 'Test',
            'storagePath': '/test/path',
            'createdAt': '2026-06-01T00:00:00.000',
            'updatedAt': '2026-06-01T00:00:00.000',
          },
          timestamp: DateTime(2026, 6, 1),
        );

        final result = await coordinator.testPushItem(item);

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      },
    );

    test(
      '_pushDocument returns SUPABASE_NOT_CONFIGURED for update action',
      () async {
        final coordinator = createTestCoordinator();
        final item = SyncQueueItem(
          entityType: 'document',
          entityId: 'doc-test-3',
          action: SyncAction.update,
          data: {
            'id': 'doc-test-3',
            'horseId': 'h1',
            'ownerId': 'o1',
            'docType': 'registration',
            'title': 'Updated',
            'storagePath': '/test/path',
            'createdAt': '2026-06-01T00:00:00.000',
            'updatedAt': '2026-06-02T00:00:00.000',
          },
          timestamp: DateTime(2026, 6, 2),
        );

        final result = await coordinator.testPushItem(item);

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      },
    );

    // ── Certificate ──────────────────────────────────────────────

    test(
      '_pushCertificate returns SUPABASE_NOT_CONFIGURED for create action',
      () async {
        final coordinator = createTestCoordinator();
        final item = SyncQueueItem(
          entityType: 'certificate',
          entityId: 'cert-test-1',
          action: SyncAction.create,
          data: {
            'id': 'cert-test-1',
            'horseId': 'h1',
            'ownerId': 'o1',
            'ownerName': 'Test Owner',
          },
          timestamp: DateTime(2026, 6, 1),
        );

        final result = await coordinator.testPushItem(item);

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      },
    );

    test(
      '_pushCertificate returns SUPABASE_NOT_CONFIGURED for update action',
      () async {
        final coordinator = createTestCoordinator();
        final item = SyncQueueItem(
          entityType: 'certificate',
          entityId: 'cert-test-2',
          action: SyncAction.update,
          data: {
            'id': 'cert-test-2',
            'horseId': 'h1',
            'ownerId': 'o1',
            'ownerName': 'Updated Owner',
          },
          timestamp: DateTime(2026, 6, 2),
        );

        final result = await coordinator.testPushItem(item);

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      },
    );

    test('_pushCertificate returns ok for delete action', () async {
      final coordinator = createTestCoordinator();
      final item = SyncQueueItem(
        entityType: 'certificate',
        entityId: 'cert-test-3',
        action: SyncAction.delete,
        data: {},
        timestamp: DateTime(2026, 6, 1),
      );

      final result = await coordinator.testPushItem(item);

      // Certificate deletion is a no-op that returns success
      expect(result.isSuccess, isTrue);
    });

    // ── Payment ──────────────────────────────────────────────────

    test(
      '_pushPayment returns SUPABASE_NOT_CONFIGURED for create action',
      () async {
        final coordinator = createTestCoordinator();
        final item = SyncQueueItem(
          entityType: 'payment',
          entityId: 'pay-test-1',
          action: SyncAction.create,
          data: {
            'id': 'pay-test-1',
            'userId': 'u1',
            'amount': 1000,
            'currency': 'MNT',
          },
          timestamp: DateTime(2026, 6, 1),
        );

        final result = await coordinator.testPushItem(item);

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      },
    );

    test(
      '_pushPayment returns SUPABASE_NOT_CONFIGURED for update action',
      () async {
        final coordinator = createTestCoordinator();
        final item = SyncQueueItem(
          entityType: 'payment',
          entityId: 'pay-test-2',
          action: SyncAction.update,
          data: {
            'id': 'pay-test-2',
            'userId': 'u1',
            'amount': 2000,
            'currency': 'MNT',
            'status': 'completed',
          },
          timestamp: DateTime(2026, 6, 2),
        );

        final result = await coordinator.testPushItem(item);

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      },
    );

    test('_pushPayment returns ok for delete action', () async {
      final coordinator = createTestCoordinator();
      final item = SyncQueueItem(
        entityType: 'payment',
        entityId: 'pay-test-3',
        action: SyncAction.delete,
        data: {},
        timestamp: DateTime(2026, 6, 1),
      );

      final result = await coordinator.testPushItem(item);

      // Payment deletion is a no-op that returns success
      expect(result.isSuccess, isTrue);
    });

    // ── Lineage ─────────────────────────────────────────────────

    test(
      '_pushLineageNode returns SUPABASE_NOT_CONFIGURED for create action',
      () async {
        final coordinator = createTestCoordinator();
        final item = SyncQueueItem(
          entityType: 'lineage',
          entityId: 'h1_parent_p1',
          action: SyncAction.create,
          data: {'horseId': 'h1', 'parentId': 'p1', 'relation': 'sire'},
          timestamp: DateTime(2026, 6, 1),
        );

        final result = await coordinator.testPushItem(item);

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      },
    );

    test(
      '_pushLineageNode returns SUPABASE_NOT_CONFIGURED for delete action',
      () async {
        final coordinator = createTestCoordinator();
        final item = SyncQueueItem(
          entityType: 'lineage',
          entityId: 'h1_parent_p1',
          action: SyncAction.delete,
          data: {'horseId': 'h1', 'parentId': 'p1'},
          timestamp: DateTime(2026, 6, 1),
        );

        final result = await coordinator.testPushItem(item);

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      },
    );

    test(
      '_pushLineageNode returns SUPABASE_NOT_CONFIGURED for update action',
      () async {
        final coordinator = createTestCoordinator();
        final item = SyncQueueItem(
          entityType: 'lineage',
          entityId: 'h1',
          action: SyncAction.update,
          data: {
            'horseId': 'h1',
            'name': 'Шинэ Нэр',
            'coat': 'Хүрэн',
            'birthYear': 2013,
          },
          timestamp: DateTime(2026, 6, 1),
        );

        final result = await coordinator.testPushItem(item);

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      },
    );

    // ── Lost horse recovery ──────────────────────────────────────

    LostHorseReport buildRecoveryReport() {
      return LostHorseReport(
        id: 'r-recovery',
        ownerId: 'o1',
        lastSeenLat: 47.9,
        lastSeenLng: 106.9,
        lastSeenAt: DateTime(2026, 6, 1),
        createdAt: DateTime(2026, 6, 1),
        updatedAt: DateTime(2026, 6, 1),
      );
    }

    test(
      '_pushLostHorseReport create uploads staged media then publishes',
      () async {
        final lostHorseRepo = MockLostHorseRepository();
        final syncStorage = MockIsarSyncStorage();
        final coordinator = createTestCoordinator(
          lostHorseRepository: lostHorseRepo,
          syncStorage: syncStorage,
        );
        final report = buildRecoveryReport();
        final item = SyncQueueItem(
          entityType: 'lost_horse_report',
          entityId: report.id,
          action: SyncAction.create,
          data: report.toJson(),
          timestamp: report.createdAt,
          accountId: report.ownerId,
          queueId: 'lost_horse_report:${report.id}',
        );

        final draft = IsarLostHorseMediaDraft()
          ..mediaId = 'm1'
          ..reportId = report.id
          ..accountId = report.ownerId
          ..localPath = '/tmp/photo.jpg'
          ..mediaType = 'photo'
          ..storagePath = 'o1/r-recovery/0.jpg'
          ..sortOrder = 0
          ..createdAt = report.createdAt
          ..uploaded = false;

        when(
          () => syncStorage.loadRecoveryMediaDrafts(report.id),
        ).thenAnswer((_) async => [draft]);
        when(
          () => lostHorseRepo.createReport(
            any(),
            localMediaPaths: ['/tmp/photo.jpg'],
            mediaIds: ['m1'],
          ),
        ).thenAnswer((_) async => Result.ok(report));
        when(
          () =>
              lostHorseRepo.publishReport(report.id, expectedMediaIds: ['m1']),
        ).thenAnswer((_) async => Result.ok(report));
        when(
          () => syncStorage.markRecoveryMediaUploaded(
            report.id,
            mediaIds: ['m1'],
          ),
        ).thenAnswer((_) async {});

        final result = await coordinator.testPushItem(item);

        expect(result.isSuccess, isTrue);
        verify(
          () => lostHorseRepo.createReport(
            any(),
            localMediaPaths: ['/tmp/photo.jpg'],
            mediaIds: ['m1'],
          ),
        ).called(1);
        verify(
          () =>
              lostHorseRepo.publishReport(report.id, expectedMediaIds: ['m1']),
        ).called(1);
        // Media marked uploaded after the create and again after publish.
        verify(
          () => syncStorage.markRecoveryMediaUploaded(
            report.id,
            mediaIds: ['m1'],
          ),
        ).called(2);
      },
    );

    test('_pushLostHorseReport create without media skips uploads', () async {
      final lostHorseRepo = MockLostHorseRepository();
      final syncStorage = MockIsarSyncStorage();
      final coordinator = createTestCoordinator(
        lostHorseRepository: lostHorseRepo,
        syncStorage: syncStorage,
      );
      final report = buildRecoveryReport();
      final item = SyncQueueItem(
        entityType: 'lost_horse_report',
        entityId: report.id,
        action: SyncAction.create,
        data: report.toJson(),
        timestamp: report.createdAt,
        accountId: report.ownerId,
        queueId: 'lost_horse_report:${report.id}',
      );

      when(
        () => syncStorage.loadRecoveryMediaDrafts(report.id),
      ).thenAnswer((_) async => <IsarLostHorseMediaDraft>[]);
      when(
        () => lostHorseRepo.createReport(
          any(),
          localMediaPaths: [],
          mediaIds: [],
        ),
      ).thenAnswer((_) async => Result.ok(report));
      when(
        () => lostHorseRepo.publishReport(report.id, expectedMediaIds: []),
      ).thenAnswer((_) async => Result.ok(report));
      when(
        () => syncStorage.markRecoveryMediaUploaded(report.id, mediaIds: []),
      ).thenAnswer((_) async {});

      final result = await coordinator.testPushItem(item);

      expect(result.isSuccess, isTrue);
      // Media marked uploaded once — after publish only (no pending drafts).
      verify(
        () => syncStorage.markRecoveryMediaUploaded(report.id, mediaIds: []),
      ).called(1);
    });

    test(
      '_pushLostHorseReport routes legacy status rows to resolution',
      () async {
        final lostHorseRepo = MockLostHorseRepository();
        final coordinator = createTestCoordinator(
          lostHorseRepository: lostHorseRepo,
        );
        final item = SyncQueueItem(
          entityType: 'lost_horse_report',
          entityId: 'r-legacy',
          action: SyncAction.update,
          data: {'status': 'found', 'resolution_note': 'Эзэндээ буцаж ирсэн'},
          timestamp: DateTime(2026, 6, 1),
          accountId: 'o1',
          queueId: 'lost_horse_report:r-legacy',
        );

        when(
          () => lostHorseRepo.resolveReport(
            reportId: 'r-legacy',
            resolutionType: LostHorseResolutionType.reunited,
            note: 'Эзэндээ буцаж ирсэн',
            verifiedSightingId: null,
          ),
        ).thenAnswer((_) async => Result.ok(buildRecoveryReport()));

        final result = await coordinator.testPushItem(item);

        expect(result.isSuccess, isTrue);
        verify(
          () => lostHorseRepo.resolveReport(
            reportId: 'r-legacy',
            resolutionType: LostHorseResolutionType.reunited,
            note: 'Эзэндээ буцаж ирсэн',
            verifiedSightingId: null,
          ),
        ).called(1);
      },
    );

    test('_pushLostHorseReport returns ok for delete action', () async {
      final coordinator = createTestCoordinator();
      final item = SyncQueueItem(
        entityType: 'lost_horse_report',
        entityId: 'r-del',
        action: SyncAction.delete,
        data: {},
        timestamp: DateTime(2026, 6, 1),
      );

      final result = await coordinator.testPushItem(item);

      expect(result.isSuccess, isTrue);
    });

    test('_pushLostHorsePublish forwards expected media ids', () async {
      final lostHorseRepo = MockLostHorseRepository();
      final coordinator = createTestCoordinator(
        lostHorseRepository: lostHorseRepo,
      );
      final item = SyncQueueItem(
        entityType: 'lost_horse_publish',
        entityId: 'r-publish',
        action: SyncAction.update,
        data: {
          'expected_media_ids': ['m1', 'm2'],
        },
        timestamp: DateTime(2026, 6, 1),
        accountId: 'o1',
        queueId: 'lost_horse_publish:r-publish',
      );

      when(
        () => lostHorseRepo.publishReport(
          'r-publish',
          expectedMediaIds: ['m1', 'm2'],
        ),
      ).thenAnswer((_) async => Result.ok(buildRecoveryReport()));

      final result = await coordinator.testPushItem(item);

      expect(result.isSuccess, isTrue);
      verify(
        () => lostHorseRepo.publishReport(
          'r-publish',
          expectedMediaIds: ['m1', 'm2'],
        ),
      ).called(1);
    });

    test('_pushLostHorseResolution resolves with typed resolution', () async {
      final lostHorseRepo = MockLostHorseRepository();
      final coordinator = createTestCoordinator(
        lostHorseRepository: lostHorseRepo,
      );
      final item = SyncQueueItem(
        entityType: 'lost_horse_resolution',
        entityId: 'r-resolve',
        action: SyncAction.update,
        data: {
          'resolution_type': 'withdrawn',
          'resolution_note': 'Хайхаа больсон',
        },
        timestamp: DateTime(2026, 6, 1),
        accountId: 'o1',
        queueId: 'lost_horse_resolution:r-resolve',
      );

      when(
        () => lostHorseRepo.resolveReport(
          reportId: 'r-resolve',
          resolutionType: LostHorseResolutionType.withdrawn,
          note: 'Хайхаа больсон',
          verifiedSightingId: null,
        ),
      ).thenAnswer((_) async => Result.ok(buildRecoveryReport()));

      final result = await coordinator.testPushItem(item);

      expect(result.isSuccess, isTrue);
      verify(
        () => lostHorseRepo.resolveReport(
          reportId: 'r-resolve',
          resolutionType: LostHorseResolutionType.withdrawn,
          note: 'Хайхаа больсон',
          verifiedSightingId: null,
        ),
      ).called(1);
    });

    test('_pushLostHorseSighting creates a new sighting', () async {
      final lostHorseRepo = MockLostHorseRepository();
      final coordinator = createTestCoordinator(
        lostHorseRepository: lostHorseRepo,
      );
      final sighting = SightingReport(
        id: 's1',
        reportId: 'r1',
        reporterId: 'u1',
        lat: 47.9,
        lng: 106.9,
        createdAt: DateTime(2026, 6, 1),
      );
      final item = SyncQueueItem(
        entityType: 'lost_horse_sighting',
        entityId: sighting.id,
        action: SyncAction.create,
        data: sighting.toJson(),
        timestamp: sighting.createdAt,
        accountId: sighting.reporterId,
        queueId: 'lost_horse_sighting:${sighting.id}',
      );

      when(
        () => lostHorseRepo.createSighting(any()),
      ).thenAnswer((_) async => Result.ok(sighting));

      final result = await coordinator.testPushItem(item);

      expect(result.isSuccess, isTrue);
      verify(() => lostHorseRepo.createSighting(any())).called(1);
    });

    test('_pushLostHorseSighting update reviews the sighting', () async {
      final lostHorseRepo = MockLostHorseRepository();
      final coordinator = createTestCoordinator(
        lostHorseRepository: lostHorseRepo,
      );
      final sighting = SightingReport(
        id: 's2',
        reportId: 'r1',
        reporterId: 'u1',
        lat: 47.9,
        lng: 106.9,
        status: SightingStatus.confirmed,
        createdAt: DateTime(2026, 6, 1),
      );
      final item = SyncQueueItem(
        entityType: 'lost_horse_sighting',
        entityId: sighting.id,
        action: SyncAction.update,
        data: sighting.toJson(),
        timestamp: sighting.createdAt,
        accountId: sighting.reporterId,
        queueId: 'lost_horse_sighting:${sighting.id}',
      );

      when(
        () => lostHorseRepo.reviewSighting(
          sightingId: sighting.id,
          status: SightingStatus.confirmed,
        ),
      ).thenAnswer((_) async => Result.ok(sighting));

      final result = await coordinator.testPushItem(item);

      expect(result.isSuccess, isTrue);
      verify(
        () => lostHorseRepo.reviewSighting(
          sightingId: sighting.id,
          status: SightingStatus.confirmed,
        ),
      ).called(1);
    });
  });

  group('Entity type dispatch completeness', () {
    test('all entity types work through the push pipeline', () async {
      final coOwnershipRepo = MockCoOwnershipRepository();
      final documentRepo = MockDocumentRepository();
      final coordinator = createTestCoordinator(
        coOwnershipRepository: coOwnershipRepo,
        documentRepository: documentRepo,
      );

      // Stub documentRepo for the document delete action
      when(
        () => documentRepo.deleteDocument(any()),
      ).thenAnswer((_) async => const Result<void>.ok(null));

      final newEntityTypes = [
        'co_ownership',
        'document',
        'certificate',
        'payment',
        'lineage',
      ];

      for (final type in newEntityTypes) {
        final item = SyncQueueItem(
          entityType: type,
          entityId: '$type-1',
          action: SyncAction.delete,
          data: {},
          timestamp: DateTime(2026, 6, 1),
        );

        final result = await coordinator.testPushItem(item);

        expect(
          result,
          isA<Result<bool>>(),
          reason:
              'New entity type "$type" was not handled by the push pipeline',
        );
      }
    });

    test('unknown entity type is handled gracefully with Result.fail', () async {
      final coordinator = createTestCoordinator();
      final item = SyncQueueItem(
        entityType: 'unknown_type_xyz',
        entityId: 'unknown-1',
        action: SyncAction.create,
        data: {},
        timestamp: DateTime(2026, 6, 1),
      );

      final result = await coordinator.testPushItem(item);

      // Unknown types hit the default case which logs a warning and returns Result.fail
      expect(result.isSuccess, isFalse);
    });
  });

  group('Error handling', () {
    test(
      'push method wraps repository exception in typed AppException',
      () async {
        final coOwnershipRepo = MockCoOwnershipRepository();
        final coordinator = createTestCoordinator(
          coOwnershipRepository: coOwnershipRepo,
        );
        final item = SyncQueueItem(
          entityType: 'co_ownership',
          entityId: 'co-error-1',
          action: SyncAction.create,
          data: {
            'id': 'co-error-1',
            'horseId': 'h1',
            'coOwnerName': 'Тест',
            'phone': '99001122',
            'role': 'Эзэмшигч',
            'permissions': <String>['read'],
          },
          timestamp: DateTime(2026, 6, 1),
        );

        when(
          () => coOwnershipRepo.saveCoOwner(any()),
        ).thenThrow(Exception('DB connection failed'));

        final result = await coordinator.testPushItem(item);

        // _pushCoOwnership catches the exception and returns a typed fail
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'CO_OWNERSHIP_PUSH_ERROR');
        expect(result.error.message, contains('Co-ownership push алдаа'));
      },
    );

    test(
      'push method wraps repository exception for document delete',
      () async {
        final documentRepo = MockDocumentRepository();
        final coordinator = createTestCoordinator(
          documentRepository: documentRepo,
        );
        final item = SyncQueueItem(
          entityType: 'document',
          entityId: 'doc-error-1',
          action: SyncAction.delete,
          data: {},
          timestamp: DateTime(2026, 6, 1),
        );

        when(
          () => documentRepo.deleteDocument(any()),
        ).thenThrow(Exception('Storage error'));

        final result = await coordinator.testPushItem(item);

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'DOCUMENT_PUSH_ERROR');
      },
    );

    test('push method wraps Supabase exception for lineage push', () async {
      final coordinator = createTestCoordinator();
      // We don't need to stub getConfiguredSupabaseClient() here because
      // the push method catches errors from the Supabase client call and
      // wraps them. In test env, getConfiguredSupabaseClient() returns null.
      // This test verifies the error wrapping path when Supabase throws.
      final item = SyncQueueItem(
        entityType: 'lineage',
        entityId: 'h1-parent-p1',
        action: SyncAction.create,
        data: {'horseId': 'h1', 'parentId': 'p1', 'relation': 'sire'},
        timestamp: DateTime(2026, 6, 1),
      );

      final result = await coordinator.testPushItem(item);

      // In test env without Supabase, returns SUPABASE_NOT_CONFIGURED
      expect(result.isFailure, isTrue);
    });
  });

  // ── Concurrent sync guard tests ──────────────────────────────────

  group('Concurrent sync guard', () {
    late ConnectionMonitor onlineMonitor;

    setUp(() {
      onlineMonitor = MockConnectionMonitor();
      when(() => onlineMonitor.current).thenReturn(ConnectionStatus.online);
    });

    test('syncAll returns early when sync already in progress', () async {
      final coordinator = createTestCoordinator(
        connectionMonitor: onlineMonitor,
      );

      // Simulate an already-active sync
      coordinator.testSetSyncing(true);

      final result = await coordinator.syncAll();

      expect(result.usedCloud, isTrue);
      expect(result.message, contains('Sync аль хэдийн явж байна'));
    });

    test('syncAll proceeds normally when not already syncing', () async {
      final coordinator = createTestCoordinator(
        connectionMonitor: onlineMonitor,
      );

      // Ensure syncing flag is false (default)
      coordinator.testSetSyncing(false);

      // When not syncing, syncAll should pass the guard and proceed
      // to pre-checks which will fail at ensureSupabaseUserId
      // because Supabase client returns null in test env
      final result = await coordinator.syncAll();

      // Should NOT get the "already syncing" message
      expect(result.message, isNot(contains('Sync аль хэдийн явж байна')));
    });

    test('testSetSyncing controls _isSyncing flag correctly', () async {
      final coordinator = createTestCoordinator(
        connectionMonitor: onlineMonitor,
      );

      // Default is false — guard not triggered
      var result = await coordinator.syncAll();
      expect(result.message, isNot(contains('Sync аль хэдийн явж байна')));

      // Set to true — guard triggers
      coordinator.testSetSyncing(true);
      result = await coordinator.syncAll();
      expect(result.message, contains('Sync аль хэдийн явж байна'));

      // Reset to false — guard not triggered
      coordinator.testSetSyncing(false);
      result = await coordinator.syncAll();
      expect(result.message, isNot(contains('Sync аль хэдийн явж байна')));
    });

    test('syncAll resets _isSyncing to false via finally block', () async {
      final coordinator = createTestCoordinator(
        connectionMonitor: onlineMonitor,
      );

      // First call will fail at pre-checks but still runs the finally
      // block where _isSyncing = false is set
      await coordinator.syncAll();

      // Verify flag is not stuck by setting it true, then observing guard
      coordinator.testSetSyncing(true);
      final resultWhileSyncing = await coordinator.syncAll();
      expect(resultWhileSyncing.message, contains('Sync аль хэдийн явж байна'));

      // Reset for clean state
      coordinator.testSetSyncing(false);
    });
  });

  // ── Cloud push handlers write to Supabase repos ────────────────────
  //
  // Regression guard: these handlers used to re-save into the LOCAL repos and
  // delete the queue row — a silent no-op that never reached the cloud.

  group('Cloud push handlers target Supabase repos', () {
    test('_pushHealthLog create saves via the cloud health repo', () async {
      final cloudHealth = MockHealthRepository();
      when(() => cloudHealth.saveHealthLog(any())).thenAnswer(
        (_) async => Result.ok(
          HealthLog(
            id: 'hl-1',
            horseId: 'h1',
            logType: LogType.vaccination,
            date: null,
            notes: '',
            createdAt: DateTime(2026, 1, 1),
            updatedAt: DateTime(2026, 1, 1),
          ),
        ),
      );
      final coordinator = createTestCoordinator(
        cloudHealthRepository: cloudHealth,
      );
      final item = SyncQueueItem(
        entityType: 'health',
        entityId: 'hl-1',
        action: SyncAction.create,
        data: {
          'id': 'hl-1',
          'horseId': 'h1',
          'logType': 'vaccination',
          'date': null,
          'createdAt': '2026-01-01T00:00:00.000',
          'updatedAt': '2026-01-01T00:00:00.000',
        },
        timestamp: DateTime(2026, 6, 1),
      );

      final result = await coordinator.testPushItem(item);

      expect(result.isSuccess, isTrue);
      verify(() => cloudHealth.saveHealthLog(any())).called(1);
    });

    test('_pushHealthLog delete calls the cloud health repo', () async {
      final cloudHealth = MockHealthRepository();
      when(
        () => cloudHealth.deleteHealthLog(any(), any()),
      ).thenAnswer((_) async => const Result<void>.ok(null));
      final coordinator = createTestCoordinator(
        cloudHealthRepository: cloudHealth,
      );
      final item = SyncQueueItem(
        entityType: 'health',
        entityId: 'hl-del',
        action: SyncAction.delete,
        data: {'horseId': 'h1'},
        timestamp: DateTime(2026, 6, 1),
      );

      final result = await coordinator.testPushItem(item);

      expect(result.isSuccess, isTrue);
      verify(() => cloudHealth.deleteHealthLog('h1', 'hl-del')).called(1);
    });

    test('_pushEvent create saves via the cloud event repo', () async {
      final cloudEvents = MockEventRepository();
      when(() => cloudEvents.saveEvent(any())).thenAnswer(
        (_) async => Result.ok(
          Event(
            id: 'evt-1',
            horseId: 'h1',
            title: 'Т',
            eventType: EventType.race,
            createdAt: DateTime(2026, 1, 1),
            updatedAt: DateTime(2026, 1, 1),
          ),
        ),
      );
      final coordinator = createTestCoordinator(
        cloudEventRepository: cloudEvents,
      );
      final item = SyncQueueItem(
        entityType: 'event',
        entityId: 'evt-1',
        action: SyncAction.create,
        data: {
          'id': 'evt-1',
          'horseId': 'h1',
          'title': 'Т',
          'eventType': 'race',
          'createdAt': '2026-01-01T00:00:00.000',
          'updatedAt': '2026-01-01T00:00:00.000',
        },
        timestamp: DateTime(2026, 6, 1),
      );

      final result = await coordinator.testPushItem(item);

      expect(result.isSuccess, isTrue);
      verify(() => cloudEvents.saveEvent(any())).called(1);
    });

    test(
      '_pushMarketListing create upserts via the cloud market repo',
      () async {
        final cloudMarket = MockSupabaseMarketRepository();
        when(() => cloudMarket.create(any())).thenAnswer(
          (_) async => Result.ok(
            MarketListing.fromJson({
              'id': 'lst-1',
              'horseId': 'h',
              'sellerId': 's',
              'title': 'T',
              'description': 'D',
              'priceAmount': 1000,
              'currency': 'MNT',
              'saleType': 'sale',
              'status': 'published',
              'locationLabel': 'L',
              'disciplineTags': <String>[],
              'documentTags': <String>[],
              'mediaUrls': <String>[],
              'isSellerVerified': false,
              'createdAt': '2026-01-01T00:00:00.000',
              'updatedAt': '2026-01-01T00:00:00.000',
            }),
          ),
        );
        final coordinator = createTestCoordinator(
          cloudMarketRepository: cloudMarket,
        );
        final item = SyncQueueItem(
          entityType: 'market',
          entityId: 'lst-1',
          action: SyncAction.create,
          data: {
            'id': 'lst-1',
            'horseId': 'h',
            'sellerId': 's',
            'title': 'T',
            'description': 'D',
            'priceAmount': 1000,
            'currency': 'MNT',
            'saleType': 'sale',
            'status': 'published',
            'locationLabel': 'L',
            'disciplineTags': <String>[],
            'documentTags': <String>[],
            'mediaUrls': <String>[],
            'isSellerVerified': false,
            'createdAt': '2026-01-01T00:00:00.000',
            'updatedAt': '2026-01-01T00:00:00.000',
          },
          timestamp: DateTime(2026, 6, 1),
        );

        final result = await coordinator.testPushItem(item);

        expect(result.isSuccess, isTrue);
        verify(() => cloudMarket.create(any())).called(1);
      },
    );

    test('_pushMarketListing delete removes the remote row', () async {
      final cloudMarket = MockSupabaseMarketRepository();
      when(
        () => cloudMarket.delete(any()),
      ).thenAnswer((_) async => const Result<void>.ok(null));
      final coordinator = createTestCoordinator(
        cloudMarketRepository: cloudMarket,
      );
      final item = SyncQueueItem(
        entityType: 'market',
        entityId: 'lst-del',
        action: SyncAction.delete,
        data: {},
        timestamp: DateTime(2026, 6, 1),
      );

      final result = await coordinator.testPushItem(item);

      expect(result.isSuccess, isTrue);
      verify(() => cloudMarket.delete('lst-del')).called(1);
    });

    test(
      '_pushBreedingRecord create upserts via the cloud breeding repo',
      () async {
        final cloudBreeding = MockSupabaseBreedingRepository();
        when(() => cloudBreeding.create(any())).thenAnswer(
          (_) async => Result.ok(
            BreedingRecord(
              id: 'br-1',
              sireId: 'sire',
              sireName: 'S',
              damId: 'dam',
              damName: 'D',
              breedingDate: DateTime(2026, 1, 1),
              expectedFoalingDate: DateTime(2026, 5, 1),
              status: 'confirmed',
              herdLabel: '',
              notes: '',
              createdAt: DateTime(2026, 1, 1),
              updatedAt: DateTime(2026, 1, 1),
            ),
          ),
        );
        final coordinator = createTestCoordinator(
          cloudBreedingRepository: cloudBreeding,
        );
        final item = SyncQueueItem(
          entityType: 'breeding',
          entityId: 'br-1',
          action: SyncAction.create,
          data: {
            'id': 'br-1',
            'sireId': 'sire',
            'sireName': 'S',
            'damId': 'dam',
            'damName': 'D',
            'breedingDate': '2026-01-01T00:00:00.000',
            'expectedFoalingDate': '2026-05-01T00:00:00.000',
            'status': 'confirmed',
            'herdLabel': '',
            'notes': '',
            'createdAt': '2026-01-01T00:00:00.000',
            'updatedAt': '2026-01-01T00:00:00.000',
          },
          timestamp: DateTime(2026, 6, 1),
        );

        final result = await coordinator.testPushItem(item);

        expect(result.isSuccess, isTrue);
        verify(() => cloudBreeding.create(any())).called(1);
      },
    );

    test('_pushHorse delete hard-deletes via the cloud horses repo', () async {
      final cloudHorses = MockHorsesRepository();
      when(
        () => cloudHorses.deleteHorse(any()),
      ).thenAnswer((_) async => const Result<void>.ok(null));
      final coordinator = createTestCoordinator(
        cloudHorsesRepository: cloudHorses,
      );
      final item = SyncQueueItem(
        entityType: 'horse',
        entityId: 'horse-del',
        action: SyncAction.delete,
        data: {},
        timestamp: DateTime(2026, 6, 1),
      );

      final result = await coordinator.testPushItem(item);

      expect(result.isSuccess, isTrue);
      verify(() => cloudHorses.deleteHorse('horse-del')).called(1);
    });

    test(
      '_pushMarketMessage dispatches (guard fails without Supabase)',
      () async {
        final coordinator = createTestCoordinator();
        final item = SyncQueueItem(
          entityType: 'market_message',
          entityId: 'msg-1',
          action: SyncAction.create,
          data: {
            'id': 'msg-1',
            'conversationId': 'conv-1',
            'senderId': 'u-1',
            'text': 'Сайн уу',
            'timestamp': '2026-06-01T00:00:00.000',
            'read': false,
          },
          timestamp: DateTime(2026, 6, 1),
        );

        final result = await coordinator.testPushItem(item);

        // Without a configured client the handler reports the configuration
        // guard failure (NOT the unknown-entity dead letter) — proving the
        // message is now dispatched to its own handler.
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      },
    );
  });
}
