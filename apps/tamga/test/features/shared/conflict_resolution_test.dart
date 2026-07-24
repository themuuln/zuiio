import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/core/sync/sync_conflict.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/profile/application/cloud_sync_coordinator.dart';
import 'package:tamga/src/features/shared/application/sync_providers.dart';
import 'package:tamga/src/features/shared/data/isar_sync_storage.dart';
import 'package:tamga/src/features/shared/presentation/conflict_resolution_screen.dart';
import 'package:tamga/src/core/sync/connection_status.dart';
import 'package:tamga/src/features/horses/data/horses_repository.dart';
import 'package:tamga/src/features/health/data/health_repository.dart';
import 'package:tamga/src/features/events/data/event_repository.dart';
import 'package:tamga/src/features/market/data/market_repository.dart';
import 'package:tamga/src/features/breeding/data/breeding_repository.dart';
import 'package:tamga/src/features/profile/data/profile_settings_repository.dart';
import 'package:tamga/src/features/map/data/map_repository.dart';
import 'package:tamga/src/features/horses/data/co_ownership_repository.dart';
import 'package:tamga/src/features/documents/data/document_repository.dart';
import 'package:tamga/src/features/certificates/data/certificate_repository.dart';
import 'package:tamga/src/features/payments/data/payment_repository.dart';

// ── Mocks ───────────────────────────────────────────────────────────────

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

// ── Helpers ─────────────────────────────────────────────────────────────

CloudSyncCoordinator createTestCoordinator({
  IsarSyncStorage? syncStorage,
  ConnectionMonitor? connectionMonitor,
}) {
  return CloudSyncCoordinator(
    horsesRepository: MockHorsesRepository(),
    healthRepository: MockHealthRepository(),
    eventRepository: MockEventRepository(),
    marketRepository: MockMarketRepository(),
    breedingRepository: MockBreedingRepository(),
    profileSettingsRepository: MockProfileSettingsRepository(),
    mapRepository: MockMapRepository(),
    syncStorage: syncStorage ?? MockIsarSyncStorage(),
    connectionMonitor: connectionMonitor ?? MockConnectionMonitor(),
    coOwnershipRepository: MockCoOwnershipRepository(),
    documentRepository: MockDocumentRepository(),
    certificateRepository: MockCertificateRepository(),
    paymentRepository: MockPaymentRepository(),
  );
}

// ── Fallback value registration ────────────────────────────────────────

void _registerFallbackValues() {
  registerFallbackValue(SyncQueue());
}

// ── SyncState conflictCount tests ───────────────────────────────────────

void main() {
  setUpAll(() {
    _registerFallbackValues();
  });
  group('SyncState.conflictCount', () {
    test('defaults to 0', () {
      const state = SyncState();
      expect(state.conflictCount, 0);
    });

    test('copyWith updates conflictCount', () {
      const state = SyncState();
      final updated = state.copyWith(conflictCount: 3);
      expect(updated.conflictCount, 3);
      // Original unchanged
      expect(state.conflictCount, 0);
    });

    test('copyWith preserves existing conflictCount when null', () {
      const state = SyncState(conflictCount: 5);
      final updated = state.copyWith(pendingCount: 10);
      expect(updated.conflictCount, 5);
      expect(updated.pendingCount, 10);
    });

    test('conflictCount resets on SyncState constructor default', () {
      const state = SyncState(conflictCount: 3);
      const resetState = SyncState();
      expect(resetState.conflictCount, 0);
      expect(state.conflictCount, 3);
    });
  });

  // ── SyncConflict model tests ───────────────────────────────────────────

  group('SyncConflict', () {
    test('creates with local and remote data', () {
      final conflict = SyncConflict(
        entityType: 'horse',
        entityId: 'abc-123',
        localData: {'name': 'Local Horse', 'age': 5},
        remoteData: {'name': 'Remote Horse', 'age': 6},
      );
      expect(conflict.entityType, 'horse');
      expect(conflict.entityId, 'abc-123');
      expect(conflict.conflictKey, 'horse:abc-123');
    });

    test('diffFields returns only differing fields, skipping id', () {
      final conflict = SyncConflict(
        entityType: 'horse',
        entityId: 'abc-123',
        localData: {
          'id': 'abc-123',
          'name': 'Local Horse',
          'age': 5,
          'color': 'bay',
        },
        remoteData: {
          'id': 'abc-123',
          'name': 'Remote Horse',
          'age': 6,
          'color': 'bay',
        },
      );
      final diffs = conflict.diffFields;
      // 'id' and 'color' omitted; 'name' and 'age' differ
      expect(diffs.length, 2);
      expect(diffs.any((d) => d.$1 == 'name'), isTrue);
      expect(diffs.any((d) => d.$1 == 'age'), isTrue);
    });

    test('diffFields returns empty when data is identical', () {
      final conflict = SyncConflict(
        entityType: 'horse',
        entityId: 'abc-123',
        localData: {'name': 'Same', 'age': 5},
        remoteData: {'name': 'Same', 'age': 5},
      );
      expect(conflict.diffFields, isEmpty);
    });

    test('localUpdatedAt and remoteUpdatedAt parse timestamps', () {
      final conflict = SyncConflict(
        entityType: 'horse',
        entityId: 'abc-123',
        localData: {'updatedAt': '2026-06-15T10:00:00.000'},
        remoteData: {'updated_at': '2026-06-16T10:00:00.000'},
      );
      expect(conflict.localUpdatedAt, isNotNull);
      expect(conflict.remoteUpdatedAt, isNotNull);
      expect(
        conflict.localUpdatedAt!.isBefore(conflict.remoteUpdatedAt!),
        isTrue,
      );
    });
  });

  // ── Coordinator conflict methods tests ───────────────────────────────

  group('CloudSyncCoordinator conflict methods', () {
    late CloudSyncCoordinator coordinator;

    setUp(() {
      final syncStorage = MockIsarSyncStorage();
      when(() => syncStorage.loadQueue()).thenAnswer((_) async => SyncQueue());
      when(() => syncStorage.saveQueue(any())).thenAnswer((_) async {});
      coordinator = createTestCoordinator(syncStorage: syncStorage);
    });

    test('starts with no conflicts', () {
      expect(coordinator.conflictCount, 0);
      expect(coordinator.pendingConflicts, isEmpty);
    });

    test('addConflict increments conflictCount', () {
      coordinator.testAddConflict(
        SyncConflict(
          entityType: 'horse',
          entityId: 'h1',
          localData: {'name': 'Local'},
          remoteData: {'name': 'Remote'},
        ),
      );

      expect(coordinator.conflictCount, 1);
      expect(coordinator.pendingConflicts.length, 1);
    });

    test('addConflict updates SyncState.conflictCount', () {
      coordinator.testAddConflict(
        SyncConflict(
          entityType: 'horse',
          entityId: 'h1',
          localData: {'name': 'Local'},
          remoteData: {'name': 'Remote'},
        ),
      );

      expect(coordinator.state.conflictCount, 1);
    });

    test('resolveConflict decrements conflictCount', () {
      coordinator.testAddConflict(
        SyncConflict(
          entityType: 'horse',
          entityId: 'h1',
          localData: {'name': 'Local'},
          remoteData: {'name': 'Remote'},
        ),
      );

      expect(coordinator.conflictCount, 1);

      coordinator.resolveConflict('horse:h1');
      expect(coordinator.conflictCount, 0);
    });

    test('resolveWithData removes conflict and decrements count', () async {
      coordinator.testAddConflict(
        SyncConflict(
          entityType: 'horse',
          entityId: 'h1',
          localData: {'name': 'Local'},
          remoteData: {'name': 'Remote'},
        ),
      );

      expect(coordinator.conflictCount, 1);

      await coordinator.resolveWithData(
        conflictKey: 'horse:h1',
        resolvedData: {'name': 'Local'},
      );

      expect(coordinator.conflictCount, 0);
      expect(coordinator.pendingConflicts, isEmpty);
    });

    test('multiple conflicts count correctly', () {
      coordinator.testAddConflict(
        SyncConflict(
          entityType: 'horse',
          entityId: 'h1',
          localData: {'name': 'A'},
          remoteData: {'name': 'B'},
        ),
      );
      coordinator.testAddConflict(
        SyncConflict(
          entityType: 'event',
          entityId: 'e1',
          localData: {'title': 'X'},
          remoteData: {'title': 'Y'},
        ),
      );

      expect(coordinator.conflictCount, 2);

      coordinator.resolveConflict('horse:h1');
      expect(coordinator.conflictCount, 1);

      coordinator.resolveConflict('event:e1');
      expect(coordinator.conflictCount, 0);
    });
  });

  // ── ConflictResolutionScreen widget tests ────────────────────────────

  group('ConflictResolutionScreen', () {
    /// Creates a test environment with a coordinator that has specific conflicts.
    Widget buildTestScreen({required CloudSyncCoordinator coordinator}) {
      // Override the cloudSyncCoordinatorProvider (FutureProvider)
      // with our synchronous value
      final overrides = [
        cloudSyncCoordinatorProvider.overrideWith((ref) async => coordinator),
        syncStateProvider.overrideWith((ref) {
          final notifier = SyncStateNotifier(ref);
          notifier.state = coordinator.state;
          return notifier;
        }),
      ];

      return ProviderScope(
        overrides: overrides,
        child: MaterialApp(
          theme: AppTheme.light(),
          home: const ConflictResolutionScreen(),
        ),
      );
    }

    testWidgets('shows empty state when no conflicts', (
      WidgetTester tester,
    ) async {
      final syncStorage = MockIsarSyncStorage();
      when(() => syncStorage.loadQueue()).thenAnswer((_) async => SyncQueue());
      when(() => syncStorage.saveQueue(any())).thenAnswer((_) async {});

      final coordinator = createTestCoordinator(syncStorage: syncStorage);

      await tester.pumpWidget(buildTestScreen(coordinator: coordinator));
      await tester.pumpAndSettle();

      expect(find.text('Зөрчилдөөн байхгүй'), findsOneWidget);
    });

    testWidgets('shows conflict card with field-level diff', (
      WidgetTester tester,
    ) async {
      final syncStorage = MockIsarSyncStorage();
      when(() => syncStorage.loadQueue()).thenAnswer((_) async => SyncQueue());
      when(() => syncStorage.saveQueue(any())).thenAnswer((_) async {});

      final coordinator = createTestCoordinator(syncStorage: syncStorage);
      coordinator.testAddConflict(
        SyncConflict(
          entityType: 'horse',
          entityId: 'horse-1',
          localData: {'name': 'Local Horse', 'age': 5},
          remoteData: {'name': 'Remote Horse', 'age': 6},
        ),
      );

      await tester.pumpWidget(buildTestScreen(coordinator: coordinator));
      await tester.pumpAndSettle();

      // Should show entity type
      expect(find.text('Морь'), findsOneWidget);
      // Should show ID
      expect(find.text('ID: horse-1'), findsOneWidget);
      // Should show field-level diff — field names
      expect(find.textContaining('Name'), findsWidgets);
      expect(find.textContaining('Age'), findsWidgets);
      // Should show local value
      expect(find.text('Local Horse'), findsOneWidget);
      // Should show remote value
      expect(find.text('Remote Horse'), findsOneWidget);
    });

    testWidgets('Keep Local button calls resolveWithData with local data', (
      WidgetTester tester,
    ) async {
      final syncStorage = MockIsarSyncStorage();
      when(() => syncStorage.loadQueue()).thenAnswer((_) async => SyncQueue());
      when(() => syncStorage.saveQueue(any())).thenAnswer((_) async {});

      final coordinator = createTestCoordinator(syncStorage: syncStorage);
      coordinator.testAddConflict(
        SyncConflict(
          entityType: 'horse',
          entityId: 'horse-1',
          localData: {'name': 'Local Horse'},
          remoteData: {'name': 'Remote Horse'},
        ),
      );

      expect(coordinator.conflictCount, 1);

      await tester.pumpWidget(buildTestScreen(coordinator: coordinator));
      await tester.pumpAndSettle();

      // Tap "Keep Local" button
      await tester.tap(find.text('Keep Local'));
      await tester.pumpAndSettle();

      // After resolution, conflict count should be 0
      expect(coordinator.conflictCount, 0);
      expect(coordinator.pendingConflicts, isEmpty);
    });

    testWidgets('Keep Remote button calls resolveWithData with remote data', (
      WidgetTester tester,
    ) async {
      final syncStorage = MockIsarSyncStorage();
      when(() => syncStorage.loadQueue()).thenAnswer((_) async => SyncQueue());
      when(() => syncStorage.saveQueue(any())).thenAnswer((_) async {});

      final coordinator = createTestCoordinator(syncStorage: syncStorage);
      coordinator.testAddConflict(
        SyncConflict(
          entityType: 'horse',
          entityId: 'horse-1',
          localData: {'name': 'Local Horse'},
          remoteData: {'name': 'Remote Horse'},
        ),
      );

      expect(coordinator.conflictCount, 1);

      await tester.pumpWidget(buildTestScreen(coordinator: coordinator));
      await tester.pumpAndSettle();

      // Tap "Keep Remote" button
      await tester.tap(find.text('Keep Remote'));
      await tester.pumpAndSettle();

      // After resolution, conflict count should be 0
      expect(coordinator.conflictCount, 0);
      expect(coordinator.pendingConflicts, isEmpty);
    });
  });
}
