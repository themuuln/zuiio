import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/core/sync/connection_status.dart';
import 'package:tamga/src/features/shared/application/sync_providers.dart';
import 'package:tamga/src/features/shared/presentation/offline_banner.dart';
import 'package:tamga/src/features/profile/application/cloud_sync_coordinator.dart';

// ── Mocks ───────────────────────────────────────────────────────────────

class MockConnectionMonitor extends Mock implements ConnectionMonitor {}

// ── Helpers ─────────────────────────────────────────────────────────────

/// Wraps a widget in a ProviderScope with overrides for testing.
Widget wrapForTest({
  required Widget child,
  SyncState? syncState,
  ConnectionMonitor? connectionMonitor,
}) {
  final overrides = <Override>[];

  if (connectionMonitor != null) {
    overrides.add(
      connectionMonitorProvider.overrideWith((ref) => connectionMonitor),
    );
  }

  if (syncState != null) {
    overrides.add(
      syncStateProvider.overrideWith((ref) {
        final notifier = SyncStateNotifier(ref);
        notifier.state = syncState;
        return notifier;
      }),
    );
  }

  return ProviderScope(
    overrides: overrides,
    child: MaterialApp(
      theme: AppTheme.light(),
      home: Scaffold(body: child),
    ),
  );
}

// ── Tests ───────────────────────────────────────────────────────────────

void main() {
  late MockConnectionMonitor mockMonitor;
  late StreamController<ConnectionStatus> statusController;

  setUp(() {
    mockMonitor = MockConnectionMonitor();
    statusController = StreamController<ConnectionStatus>.broadcast();

    when(() => mockMonitor.status).thenAnswer((_) => statusController.stream);
  });

  tearDown(() {
    statusController.close();
  });

  group('OfflineBanner - appearance', () {
    testWidgets('shows banner when offline', (WidgetTester tester) async {
      when(() => mockMonitor.current).thenReturn(ConnectionStatus.offline);

      await tester.pumpWidget(
        wrapForTest(
          child: OfflineBanner(connectionMonitor: mockMonitor),
          syncState: const SyncState(status: SyncStatus.idle),
        ),
      );
      await tester.pump();

      // The banner should show the offline message
      expect(
        find.text('Offline — Локал өгөгдөл харуулж байна'),
        findsOneWidget,
      );

      // The cloud_off icon should be visible
      expect(find.byIcon(Icons.cloud_off), findsOneWidget);
    });

    testWidgets('hides banner when online', (WidgetTester tester) async {
      when(() => mockMonitor.current).thenReturn(ConnectionStatus.online);

      await tester.pumpWidget(
        wrapForTest(
          child: OfflineBanner(connectionMonitor: mockMonitor),
          syncState: const SyncState(status: SyncStatus.idle),
        ),
      );
      await tester.pump();

      // Banner should not be visible when online
      expect(find.text('Offline — Локал өгөгдөл харуулж байна'), findsNothing);
    });
  });

  group('OfflineBanner - last sync time', () {
    testWidgets('shows last sync time when available', (
      WidgetTester tester,
    ) async {
      when(() => mockMonitor.current).thenReturn(ConnectionStatus.offline);
      final syncState = SyncState(
        status: SyncStatus.synced,
        lastSyncTime: DateTime.now().subtract(const Duration(minutes: 5)),
        pendingCount: 0,
      );

      await tester.pumpWidget(
        wrapForTest(
          child: OfflineBanner(connectionMonitor: mockMonitor),
          syncState: syncState,
        ),
      );
      await tester.pump();

      // Should show last sync time
      expect(find.textContaining('Сүүлд синк хийсэн'), findsOneWidget);
    });

    testWidgets('banner works without last sync time (null)', (
      WidgetTester tester,
    ) async {
      when(() => mockMonitor.current).thenReturn(ConnectionStatus.offline);

      await tester.pumpWidget(
        wrapForTest(
          child: OfflineBanner(connectionMonitor: mockMonitor),
          syncState: const SyncState(status: SyncStatus.idle),
        ),
      );
      await tester.pump();

      // Banner still shows the offline message even without sync time
      expect(
        find.text('Offline — Локал өгөгдөл харуулж байна'),
        findsOneWidget,
      );

      // No sync time text
      expect(find.textContaining('Сүүлд синк хийсэн'), findsNothing);
    });

    testWidgets('shows correct relative time format for minutes', (
      WidgetTester tester,
    ) async {
      when(() => mockMonitor.current).thenReturn(ConnectionStatus.offline);
      final syncState = SyncState(
        status: SyncStatus.synced,
        lastSyncTime: DateTime.now().subtract(const Duration(minutes: 3)),
        pendingCount: 0,
      );

      await tester.pumpWidget(
        wrapForTest(
          child: OfflineBanner(connectionMonitor: mockMonitor),
          syncState: syncState,
        ),
      );
      await tester.pump();

      expect(find.text('Сүүлд синк хийсэн: 3 минутын өмнө'), findsOneWidget);
    });

    testWidgets('shows correct relative time format for hours', (
      WidgetTester tester,
    ) async {
      when(() => mockMonitor.current).thenReturn(ConnectionStatus.offline);
      final syncState = SyncState(
        status: SyncStatus.synced,
        lastSyncTime: DateTime.now().subtract(const Duration(hours: 2)),
        pendingCount: 0,
      );

      await tester.pumpWidget(
        wrapForTest(
          child: OfflineBanner(connectionMonitor: mockMonitor),
          syncState: syncState,
        ),
      );
      await tester.pump();

      expect(find.text('Сүүлд синк хийсэн: 2 цагийн өмнө'), findsOneWidget);
    });

    testWidgets('shows correct relative time format for "just now"', (
      WidgetTester tester,
    ) async {
      when(() => mockMonitor.current).thenReturn(ConnectionStatus.offline);
      final syncState = SyncState(
        status: SyncStatus.synced,
        lastSyncTime: DateTime.now(),
        pendingCount: 0,
      );

      await tester.pumpWidget(
        wrapForTest(
          child: OfflineBanner(connectionMonitor: mockMonitor),
          syncState: syncState,
        ),
      );
      await tester.pump();

      expect(find.text('Сүүлд синк хийсэн: саяхан'), findsOneWidget);
    });
  });
}
