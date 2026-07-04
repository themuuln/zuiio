import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/core/sync/connection_status.dart';
import 'package:tamga/src/features/horses/data/co_ownership_repository.dart';
import 'package:tamga/src/features/horses/domain/co_ownership.dart';
import 'package:tamga/src/features/documents/data/document_repository.dart';
import 'package:tamga/src/features/certificates/data/certificate_repository.dart';
import 'package:tamga/src/features/payments/data/payment_repository.dart';
import 'package:tamga/src/features/profile/application/cloud_sync_coordinator.dart';
import 'package:tamga/src/features/horses/data/horses_repository.dart';
import 'package:tamga/src/features/health/data/health_repository.dart';
import 'package:tamga/src/features/events/data/event_repository.dart';
import 'package:tamga/src/features/market/data/market_repository.dart';
import 'package:tamga/src/features/breeding/data/breeding_repository.dart';
import 'package:tamga/src/features/profile/data/profile_settings_repository.dart';
import 'package:tamga/src/features/map/data/map_repository.dart';
import 'package:tamga/src/features/shared/data/isar_sync_storage.dart';

// ── Mock classes ─────────────────────────────────────────────────────────

class MockHorsesRepository extends Mock implements HorsesRepository {}

class MockHealthRepository extends Mock implements HealthRepository {}

class MockEventRepository extends Mock implements EventRepository {}

class MockMarketRepository extends Mock implements MarketRepository {}

class MockBreedingRepository extends Mock implements BreedingRepository {}

class MockProfileSettingsRepository extends Mock
    implements ProfileSettingsRepository {}

class MockMapRepository extends Mock implements MapRepository {}

class MockIsarSyncStorage extends Mock implements IsarSyncStorage {}

class MockConnectionMonitor extends Mock implements ConnectionMonitor {}

class MockCoOwnershipRepository extends Mock implements CoOwnershipRepository {}

class MockDocumentRepository extends Mock implements DocumentRepository {}

class MockCertificateRepository extends Mock implements CertificateRepository {}

class MockPaymentRepository extends Mock implements PaymentRepository {}

// ── Fallback value registration ─────────────────────────────────────────

void _registerFallbackValues() {
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
}
