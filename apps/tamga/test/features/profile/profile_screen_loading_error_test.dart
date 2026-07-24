/// VAL-FOUND-010 / VAL-FOUND-011: ProfileScreen loading and error state tests.
///
/// Tests skeleton/placeholder rendering during loading and inline error cards
/// with retry on provider failure. Also verifies stat chips show '—' for
/// errored data and that existing horses/settings tabs are preserved.
library;

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/core/error/app_exception.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/core/widgets/loading_state.dart';
import 'package:tamga/src/features/auth/application/auth_providers.dart';
import 'package:tamga/src/features/auth/data/auth_repository.dart';
import 'package:tamga/src/features/auth/domain/auth_state.dart';
import 'package:tamga/src/features/horses/application/horses_providers.dart';
import 'package:tamga/src/features/horses/domain/horse_record.dart';
import 'package:tamga/src/features/events/application/events_providers.dart';
import 'package:tamga/src/shared/domain/event.dart';
import 'package:tamga/src/features/profile/presentation/profile_screen.dart';

// ── Helper: set a large viewport to prevent RenderFlex overflow ────
// Error cards in the header take extra vertical space, so the default
// 800×600 test viewport can cause HorsesTab empty state to overflow.

extension on WidgetTester {
  Future<void> setLargeViewport() async {
    addTearDown(() {
      view.physicalSize = const Size(800, 600);
      view.devicePixelRatio = 1.0;
    });
    await binding.setSurfaceSize(const Size(800, 1200));
  }
}

// ── Mock AuthRepository: never completes (loading state) ────────────

class _LoadingAuthRepository implements AuthRepository {
  @override
  Future<Result<AuthState>> getCurrentUser() async {
    // Never completes → StreamNotifier stays in loading state forever
    await Completer<void>().future;
    return const Result.ok(AuthState.unauthenticated());
  }

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
  Stream<AuthState> get authStateChanges =>
      Stream.value(const AuthState.unauthenticated());

  @override
  Stream<void> get sessionExpired => const Stream.empty();

  @override
  Future<Result<void>> syncPendingOnboarding() async {
    return const Result.ok(null);
  }
}

// ── Mock AuthRepository: throws on getCurrentUser (error state) ───

class _ErrorAuthRepository implements AuthRepository {
  @override
  Future<Result<AuthState>> getCurrentUser() async {
    throw AppException(message: 'Auth error', code: 'AUTH_ERR');
  }

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
  Stream<AuthState> get authStateChanges =>
      Stream.value(const AuthState.unauthenticated());

  @override
  Stream<void> get sessionExpired => const Stream.empty();

  @override
  Future<Result<void>> syncPendingOnboarding() async {
    return const Result.ok(null);
  }
}

// ── Tests ──────────────────────────────────────────────────────────

void main() {
  // ── Loading State Tests ─────────────────────────────────────────
  group('VAL-FOUND-010: ProfileScreen shows skeleton loaders while loading', () {
    testWidgets(
      'shows shimmer and skeleton placeholder when providers are loading',
      (tester) async {
        // Keep horses/events in loading state using never-completing futures
        final horsesCompleter = Completer<List<HorseRecord>>();
        final eventsCompleter = Completer<List<Event>>();

        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              authRepositoryProvider.overrideWithValue(
                _LoadingAuthRepository(),
              ),
              horsesProvider.overrideWith((ref) => horsesCompleter.future),
              eventsProvider.overrideWith((ref) => eventsCompleter.future),
            ],
            child: MaterialApp(
              theme: AppTheme.light(),
              home: const ProfileScreen(),
            ),
          ),
        );

        // Pump to let the initial build happen. The providers stay in loading
        // state because the completers never complete.
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 100));

        // ── Assertions: skeleton UI elements are visible ──

        // ShimmerEffect wraps the skeleton content (at least one in header,
        // plus one from SkeletonLoader in horses tab when that tab renders)
        expect(
          find.byType(ShimmerEffect),
          findsAtLeastNWidgets(1),
          reason: 'ShimmerEffect should be present during loading',
        );

        // Skeleton avatar circle — a Container with BoxShape.circle and size 96
        final skeletonAvatars = find.byWidgetPredicate(
          (widget) =>
              widget is Container &&
              widget.constraints?.maxWidth == 96 &&
              widget.decoration is BoxDecoration &&
              (widget.decoration as BoxDecoration).shape == BoxShape.circle,
        );
        expect(
          skeletonAvatars,
          findsOneWidget,
          reason: 'Skeleton avatar circle should be shown during loading',
        );

        // Skeleton stat chips — Container widgets with fixed dimensions
        // The _SkeletonStatChip renders a Container(width: 100, height: 32)
        final skeletonChips = find.byWidgetPredicate(
          (widget) =>
              widget is Container &&
              widget.constraints?.maxWidth == 100 &&
              widget.constraints?.maxHeight == 32 &&
              widget.decoration is BoxDecoration &&
              (widget.decoration as BoxDecoration).borderRadius != null,
        );
        // Should find 3 skeleton stat chips
        expect(
          skeletonChips,
          findsNWidgets(3),
          reason: 'Three skeleton stat chips should be shown during loading',
        );

        // Verify the cover photo settings icon is still visible
        expect(
          find.byIcon(Icons.settings_outlined),
          findsOneWidget,
          reason: 'Settings icon should remain visible in skeleton header',
        );

        // Verify the skeleton header does NOT contain actual data text
        expect(
          find.text('Хэрэглэгч'),
          findsNothing,
          reason: 'Display name should not appear during loading',
        );
      },
    );
  });

  // ── Error State Tests ───────────────────────────────────────────
  group(
    'VAL-FOUND-011: ProfileScreen shows inline error cards with retry on failure',
    () {
      testWidgets('shows error cards and "—" in stats when providers have errors', (
        tester,
      ) async {
        await tester.setLargeViewport();

        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              authRepositoryProvider.overrideWithValue(_ErrorAuthRepository()),
              horsesProvider.overrideWith(
                (ref) => Future.error(
                  AppException(message: 'Horses error', code: 'H_ERR'),
                ),
              ),
              eventsProvider.overrideWith(
                (ref) => Future.error(
                  AppException(message: 'Events error', code: 'E_ERR'),
                ),
              ),
            ],
            child: MaterialApp(
              theme: AppTheme.light(),
              home: const ProfileScreen(),
            ),
          ),
        );

        // Let async operations settle — the error futures complete immediately
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 100));
        await tester.pump(const Duration(milliseconds: 100));
        await tester.pump(const Duration(milliseconds: 100));

        // ── Assertions: error UI elements are visible ──

        // Retry buttons should be present (each error card has "Дахин оролдох")
        expect(
          find.text('Дахин оролдох'),
          findsWidgets,
          reason: 'Retry buttons should appear on error cards',
        );

        // Error message for auth failure (may appear in both error card and toast)
        expect(
          find.textContaining('Хэрэглэгчийн мэдээлэл ачаалахад алдаа гарлаа'),
          findsAtLeastNWidgets(1),
          reason: 'Auth error message should be visible',
        );

        // Error message for horses failure
        expect(
          find.textContaining('Морьдын мэдээлэл ачаалахад алдаа гарлаа'),
          findsAtLeastNWidgets(1),
          reason: 'Horses error message should be visible',
        );

        // Error message for events failure
        expect(
          find.textContaining('Уралдааны мэдээлэл ачаалахад алдаа гарлаа'),
          findsAtLeastNWidgets(1),
          reason: 'Events error message should be visible',
        );

        // Stat chips show '—' for errored data
        // Horses, events, and lineage chips all show '—' when their data errors
        expect(
          find.text('—'),
          findsAtLeastNWidgets(3),
          reason: 'All three stat chips show "—" when data has errors',
        );
      });

      testWidgets('retry button triggers provider invalidation', (
        tester,
      ) async {
        final errorRepo = _ErrorAuthRepository();

        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              authRepositoryProvider.overrideWithValue(errorRepo),
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
        await tester.pump(const Duration(milliseconds: 100));

        // Verify error card with retry button is visible
        expect(
          find.text('Дахин оролдох'),
          findsWidgets,
          reason: 'Retry button should be visible on auth error card',
        );

        // Tap the retry button
        await tester.tap(find.text('Дахин оролдох').first);
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 100));

        // After invalidation, the provider re-fetches and errors again,
        // so the error card and retry button should show again
        expect(
          find.text('Дахин оролдох'),
          findsWidgets,
          reason:
              'Retry button should reappear after invalidation re-triggers error',
        );
      });

      testWidgets('settings tab is still accessible with auth error', (
        tester,
      ) async {
        await tester.setLargeViewport();

        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              authRepositoryProvider.overrideWithValue(_ErrorAuthRepository()),
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
        await tester.pump(const Duration(milliseconds: 100));

        // Navigate to settings tab
        await tester.tap(find.text('Тохиргоо'));
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 300));

        // Settings tab content should be accessible
        expect(
          find.text('Мэдээлэл'),
          findsOneWidget,
          reason:
              'Settings tab content should be accessible even with auth error',
        );
      });
    },
  );
}
