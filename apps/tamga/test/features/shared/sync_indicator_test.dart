import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tamga/src/features/shared/application/sync_providers.dart';
import 'package:tamga/src/features/shared/presentation/sync_indicator.dart';
import 'package:tamga/src/features/profile/application/cloud_sync_coordinator.dart';
import 'package:tamga/src/core/theme/tamga_design_system.dart';

// ── Helpers ─────────────────────────────────────────────────────────────

/// Wraps SyncIndicator in a ProviderScope with overrides for testing.
Widget wrapForTest({required Widget child, SyncState? syncState}) {
  final overrides = <Override>[];

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
      theme: TamgaDesignSystem.buildThemeData(Brightness.light),
      home: Scaffold(body: child),
    ),
  );
}

// ── Tests ───────────────────────────────────────────────────────────────

void main() {
  group('SyncIndicator - color mapping', () {
    testWidgets('shows GREEN dot when synced with no pending items', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        wrapForTest(
          child: const SyncIndicator(),
          syncState: const SyncState(
            status: SyncStatus.synced,
            pendingCount: 0,
          ),
        ),
      );

      // The indicator should be a Container with a green background
      final container = tester.widget<Container>(find.byType(Container));
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.color, Colors.green);
    });

    testWidgets('shows AMBER dot when pendingCount > 0', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        wrapForTest(
          child: const SyncIndicator(),
          syncState: const SyncState(
            status: SyncStatus.synced,
            pendingCount: 3,
          ),
        ),
      );

      final container = tester.widget<Container>(find.byType(Container));
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.color, Colors.amber);
    });

    testWidgets('shows AMBER dot when syncing', (WidgetTester tester) async {
      await tester.pumpWidget(
        wrapForTest(
          child: const SyncIndicator(),
          syncState: const SyncState(
            status: SyncStatus.syncing,
            pendingCount: 0,
          ),
        ),
      );

      final container = tester.widget<Container>(find.byType(Container));
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.color, Colors.amber);
    });

    testWidgets('shows RED dot on error', (WidgetTester tester) async {
      await tester.pumpWidget(
        wrapForTest(
          child: const SyncIndicator(),
          syncState: const SyncState(
            status: SyncStatus.error,
            pendingCount: 0,
            errorMessage: 'Sync failed',
          ),
        ),
      );

      final container = tester.widget<Container>(find.byType(Container));
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.color, Colors.red);
    });

    testWidgets('shows GREY dot when idle', (WidgetTester tester) async {
      await tester.pumpWidget(
        wrapForTest(
          child: const SyncIndicator(),
          syncState: const SyncState(status: SyncStatus.idle, pendingCount: 0),
        ),
      );

      final container = tester.widget<Container>(find.byType(Container));
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.color, Colors.grey);
    });
  });

  group('SyncIndicator - tooltip', () {
    testWidgets('shows correct tooltip for synced state', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        wrapForTest(
          child: const SyncIndicator(),
          syncState: const SyncState(
            status: SyncStatus.synced,
            pendingCount: 0,
          ),
        ),
      );

      // Find the Tooltip widget
      final tooltip = tester.widget<Tooltip>(find.byType(Tooltip));
      expect(tooltip.message, 'Synced');
    });

    testWidgets('shows correct tooltip for pending state', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        wrapForTest(
          child: const SyncIndicator(),
          syncState: const SyncState(
            status: SyncStatus.synced,
            pendingCount: 5,
          ),
        ),
      );

      final tooltip = tester.widget<Tooltip>(find.byType(Tooltip));
      expect(tooltip.message, '5 pending');
    });

    testWidgets('shows correct tooltip for error state', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        wrapForTest(
          child: const SyncIndicator(),
          syncState: const SyncState(
            status: SyncStatus.error,
            pendingCount: 0,
            errorMessage: 'Connection failed',
          ),
        ),
      );

      final tooltip = tester.widget<Tooltip>(find.byType(Tooltip));
      expect(tooltip.message, 'Connection failed');
    });

    testWidgets('shows correct tooltip for idle state', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        wrapForTest(
          child: const SyncIndicator(),
          syncState: const SyncState(status: SyncStatus.idle, pendingCount: 0),
        ),
      );

      final tooltip = tester.widget<Tooltip>(find.byType(Tooltip));
      expect(tooltip.message, 'Sync inactive');
    });

    testWidgets('shows default error tooltip when no error message', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        wrapForTest(
          child: const SyncIndicator(),
          syncState: const SyncState(status: SyncStatus.error, pendingCount: 0),
        ),
      );

      final tooltip = tester.widget<Tooltip>(find.byType(Tooltip));
      expect(tooltip.message, 'Sync error');
    });
  });

  group('SyncIndicator - circle shape', () {
    testWidgets('has BoxShape.circle decoration', (WidgetTester tester) async {
      await tester.pumpWidget(
        wrapForTest(
          child: const SyncIndicator(),
          syncState: const SyncState(
            status: SyncStatus.synced,
            pendingCount: 0,
          ),
        ),
      );

      final container = tester.widget<Container>(find.byType(Container));
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.shape, BoxShape.circle);
    });
  });

  group('SyncIndicator - conflict display', () {
    testWidgets('shows RED dot when conflictCount > 0', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        wrapForTest(
          child: const SyncIndicator(),
          syncState: const SyncState(
            status: SyncStatus.synced,
            pendingCount: 0,
            conflictCount: 2,
          ),
        ),
      );

      final container = tester.widget<Container>(find.byType(Container));
      final decoration = container.decoration as BoxDecoration;
      // Conflict red takes priority over synced green
      expect(decoration.color, Colors.red);
    });

    testWidgets('shows RED dot even with pending items when conflicts exist', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        wrapForTest(
          child: const SyncIndicator(),
          syncState: const SyncState(
            status: SyncStatus.synced,
            pendingCount: 5,
            conflictCount: 1,
          ),
        ),
      );

      final container = tester.widget<Container>(find.byType(Container));
      final decoration = container.decoration as BoxDecoration;
      // Conflict red should take priority
      expect(decoration.color, Colors.red);
    });

    testWidgets('tooltip shows conflict count', (WidgetTester tester) async {
      await tester.pumpWidget(
        wrapForTest(
          child: const SyncIndicator(),
          syncState: const SyncState(
            status: SyncStatus.synced,
            pendingCount: 0,
            conflictCount: 3,
          ),
        ),
      );

      final tooltip = tester.widget<Tooltip>(find.byType(Tooltip));
      expect(tooltip.message, '3 conflict(s)');
    });

    testWidgets('tooltip shows singular conflict count', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        wrapForTest(
          child: const SyncIndicator(),
          syncState: const SyncState(
            status: SyncStatus.synced,
            pendingCount: 0,
            conflictCount: 1,
          ),
        ),
      );

      final tooltip = tester.widget<Tooltip>(find.byType(Tooltip));
      expect(tooltip.message, '1 conflict(s)');
    });

    testWidgets('does not show red dot when conflictCount is 0', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        wrapForTest(
          child: const SyncIndicator(),
          syncState: const SyncState(
            status: SyncStatus.synced,
            pendingCount: 0,
            conflictCount: 0,
          ),
        ),
      );

      final container = tester.widget<Container>(find.byType(Container));
      final decoration = container.decoration as BoxDecoration;
      // Without conflicts, should show the normal synced color (green)
      expect(decoration.color, Colors.green);
    });
  });
}
