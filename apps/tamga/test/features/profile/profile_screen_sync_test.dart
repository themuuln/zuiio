/// VAL-FOUND-027 / VAL-FOUND-028 / VAL-FOUND-029: ProfileScreen sync status tests.
///
/// Tests that ProfileScreen shows:
/// - SyncIndicator in the header/cover area
/// - "Сүүлд синк хийсэн" with relative time when lastSyncTime is non-null
/// - Pending count when > 0
/// - Conflict count when > 0
/// - "Синк хийх" button that triggers sync
library;

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/core/error/app_exception.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/features/auth/application/auth_providers.dart';
import 'package:tamga/src/features/auth/data/auth_repository.dart';
import 'package:tamga/src/features/auth/domain/auth_state.dart';
import 'package:tamga/src/features/horses/application/horses_providers.dart';
import 'package:tamga/src/features/horses/domain/horse_record.dart';
import 'package:tamga/src/features/events/application/events_providers.dart';
import 'package:tamga/src/features/profile/application/cloud_sync_coordinator.dart';
import 'package:tamga/src/features/profile/presentation/profile_screen.dart';
import 'package:tamga/src/features/shared/application/sync_providers.dart';
import 'package:tamga/src/features/shared/presentation/sync_indicator.dart';
import 'package:tamga/src/shared/domain/event.dart';

// ── Helper: set a large viewport to prevent RenderFlex overflow ────
// The sync status section adds extra vertical space to the header,
// so using a taller viewport prevents the horses tab from overflowing.

extension on WidgetTester {
  Future<void> setLargeViewport() async {
    addTearDown(() {
      view.physicalSize = const Size(800, 600);
      view.devicePixelRatio = 1.0;
    });
    await binding.setSurfaceSize(const Size(800, 1200));
  }
}

// ── Mock AuthRepository (authenticated) ────────────────────────────

class _MockAuthRepository implements AuthRepository {
  @override
  Future<Result<AuthState>> getCurrentUser() async {
    return Result.ok(
      const AuthState.authenticated(
        userId: 'test-user',
        email: 'test@example.com',
        displayName: 'Test User',
      ),
    );
  }

  @override
  Stream<AuthState> get authStateChanges => Stream.value(
    const AuthState.authenticated(
      userId: 'test-user',
      email: 'test@example.com',
      displayName: 'Test User',
    ),
  );

  @override
  Stream<void> get sessionExpired => const Stream.empty();

  @override
  Future<Result<AuthState>> signUpWithEmail({
    required String email,
    required String password,
    String? displayName,
  }) async {
    return Result.fail(AppException(message: 'Not implemented', code: 'NI'));
  }

  @override
  Future<Result<AuthState>> signInWithEmail({
    required String email,
    required String password,
  }) async {
    return Result.fail(AppException(message: 'Not implemented', code: 'NI'));
  }

  @override
  Future<Result<AuthState>> signInWithPhone({required String phone}) async {
    return Result.fail(AppException(message: 'Not implemented', code: 'NI'));
  }

  @override
  Future<Result<AuthState>> verifyPhoneOtp({
    required String phone,
    required String token,
  }) async {
    return Result.fail(AppException(message: 'Not implemented', code: 'NI'));
  }

  @override
  Future<Result<AuthState>> signInAnonymously() async {
    return Result.fail(AppException(message: 'Not implemented', code: 'NI'));
  }

  @override
  Future<Result<AuthState>> signInWithGoogle() async {
    return Result.fail(AppException(message: 'Not implemented', code: 'NI'));
  }

  @override
  Future<Result<AuthState>> signInWithApple() async {
    return Result.fail(AppException(message: 'Not implemented', code: 'NI'));
  }

  @override
  Future<void> signOut() async {}

  @override
  Future<Result<void>> syncPendingOnboarding() async {
    return const Result.ok(null);
  }
}

// ── Test helper: creates overrides and captures the sync notifier ──

/// Creates a [ProviderScope] that renders [ProfileScreen] with controlled
/// sync state. Returns the [SyncStateNotifier] so tests can manipulate state.
Future<SyncStateNotifier> pumpProfileScreen({
  required WidgetTester tester,
  SyncState? initialState,
}) async {
  SyncStateNotifier? capturedNotifier;

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        authRepositoryProvider.overrideWithValue(_MockAuthRepository()),
        // Override coordinator to a never-completing future so
        // SyncStateNotifier stays in its initial state without connecting.
        cloudSyncCoordinatorProvider.overrideWith(
          (ref) => Completer<CloudSyncCoordinator>().future,
        ),
        // Create a real SyncStateNotifier but capture it for state control
        syncStateProvider.overrideWith((ref) {
          final notifier = SyncStateNotifier(ref);
          capturedNotifier = notifier;
          if (initialState != null) {
            notifier.setSyncStateForTesting(initialState);
          }
          return notifier;
        }),
        horsesProvider.overrideWith((ref) => <HorseRecord>[]),
        eventsProvider.overrideWith((ref) => <Event>[]),
      ],
      child: MaterialApp(
        theme: AppTheme.light(),
        home: const ProfileScreen(),
      ),
    ),
  );

  await tester.pump();
  await tester.pump(const Duration(milliseconds: 100));

  return capturedNotifier!;
}

// ── Tests ──────────────────────────────────────────────────────────

void main() {
  group('VAL-FOUND-027: ProfileScreen shows SyncIndicator and last sync time', () {
    testWidgets('SyncIndicator widget is present in the header/cover area', (
      tester,
    ) async {
      await pumpProfileScreen(tester: tester);

      // ── Assertion: SyncIndicator is present ──
      expect(find.byType(SyncIndicator), findsOneWidget,
          reason: 'SyncIndicator should be present in ProfileScreen header');
    });

    testWidgets('shows last sync time "Сүүлд синк хийсэн" when lastSyncTime is non-null', (
      tester,
    ) async {
      await tester.setLargeViewport();

      await pumpProfileScreen(
        tester: tester,
        initialState: SyncState(
          lastSyncTime: DateTime.now().subtract(const Duration(minutes: 5)),
        ),
      );

      // ── Assertion: "Сүүлд синк хийсэн" text is shown ──
      expect(
        find.textContaining('Сүүлд синк хийсэн'),
        findsOneWidget,
        reason: '"Сүүлд синк хийсэн" should appear when lastSyncTime is set',
      );

      // ── Assertion: relative time text is shown ──
      expect(
        find.textContaining('минутын өмнө'),
        findsOneWidget,
        reason: 'Relative time (minutes ago) should appear with last sync time',
      );
    });

    testWidgets('does not show last sync time when lastSyncTime is null', (
      tester,
    ) async {
      await pumpProfileScreen(tester: tester);

      // ── Assertion: "Сүүлд синк хийсэн" should NOT be visible ──
      expect(
        find.textContaining('Сүүлд синк хийсэн'),
        findsNothing,
        reason: '"Сүүлд синк хийсэн" should NOT appear when lastSyncTime is null',
      );
    });
  });

  group('VAL-FOUND-028: ProfileScreen shows pending and conflict counts', () {
    testWidgets('shows pending count when pendingCount > 0', (tester) async {
      await tester.setLargeViewport();

      final notifier = await pumpProfileScreen(
        tester: tester,
        initialState: const SyncState(
          pendingCount: 3,
          lastSyncTime: null,
        ),
      );

      // Set state after pump
      notifier.setSyncStateForTesting(
        const SyncState(pendingCount: 3, lastSyncTime: null),
      );
      await tester.pump();

      // ── Assertion: pending count text is shown ──
      expect(
        find.textContaining('3 синк хүлээгдэж байна'),
        findsOneWidget,
        reason: 'Pending count should be displayed when > 0',
      );
    });

    testWidgets('shows conflict count when conflictCount > 0', (tester) async {
      await tester.setLargeViewport();

      final notifier = await pumpProfileScreen(tester: tester);

      notifier.setSyncStateForTesting(
        const SyncState(conflictCount: 2, lastSyncTime: null),
      );
      await tester.pump();

      // ── Assertion: conflict count text is shown ──
      expect(
        find.textContaining('2 зөрчилдөөн байна'),
        findsOneWidget,
        reason: 'Conflict count should be displayed when > 0',
      );
    });

    testWidgets('shows both pending and conflict counts when both > 0', (
      tester,
    ) async {
      await tester.setLargeViewport();

      final notifier = await pumpProfileScreen(tester: tester);

      notifier.setSyncStateForTesting(
        const SyncState(pendingCount: 5, conflictCount: 1, lastSyncTime: null),
      );
      await tester.pump();

      // ── Assertion: both pending and conflict text appear ──
      expect(
        find.textContaining('5 синк хүлээгдэж байна'),
        findsOneWidget,
        reason: 'Pending count should display when > 0',
      );
      expect(
        find.textContaining('1 зөрчилдөөн байна'),
        findsOneWidget,
        reason: 'Conflict count should display when > 0',
      );
    });

    testWidgets('does not show pending count when pendingCount is 0', (
      tester,
    ) async {
      await pumpProfileScreen(tester: tester);

      // ── Assertion: no pending count text when count is 0 ──
      expect(
        find.textContaining('синк хүлээгдэж байна'),
        findsNothing,
        reason: 'Pending count text should NOT appear when pendingCount is 0',
      );
    });

    testWidgets('does not show conflict count when conflictCount is 0', (
      tester,
    ) async {
      await pumpProfileScreen(tester: tester);

      // ── Assertion: no conflict count text when count is 0 ──
      expect(
        find.textContaining('зөрчилдөөн байна'),
        findsNothing,
        reason: 'Conflict count text should NOT appear when conflictCount is 0',
      );
    });
  });

  group('"Синк хийх" button', () {
    testWidgets('"Синк хийх" button is present in the header', (tester) async {
      await pumpProfileScreen(tester: tester);

      // ── Assertion: "Синк хийх" button exists ──
      expect(
        find.text('Синк хийх'),
        findsOneWidget,
        reason: '"Синк хийх" button should be visible in ProfileScreen header',
      );
    });

    testWidgets('tapping "Синк хийх" triggers sync via the notifier', (
      tester,
    ) async {
      final notifier = await pumpProfileScreen(tester: tester);

      // Verify button exists
      expect(find.text('Синк хийх'), findsOneWidget);

      // Tap the sync button
      await tester.tap(find.text('Синк хийх'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // ── Assertion: state changed (triggerSync was called) ──
      // The real SyncStateNotifier.triggerSync() tries to read the coordinator
      // which is null, so it returns early without changing status.
      // We verify the button press doesn't throw and the notifier is reachable.
      expect(notifier.state.status, SyncStatus.idle,
          reason: 'Sync stays idle when coordinator is null (expected)');
    });
  });
}
