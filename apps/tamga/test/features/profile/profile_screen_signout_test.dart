import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/features/auth/application/auth_providers.dart';
import 'package:tamga/src/features/auth/data/auth_repository.dart';
import 'package:tamga/src/features/auth/domain/auth_state.dart';
import 'package:tamga/src/features/profile/application/cloud_sync_coordinator.dart';
import 'package:tamga/src/features/profile/presentation/profile_screen.dart';
import 'package:tamga/src/features/shared/application/sync_providers.dart';
import 'package:tamga/src/features/horses/domain/horse_record.dart';
import 'package:tamga/src/features/horses/application/horses_providers.dart';
import 'package:tamga/src/features/events/application/events_providers.dart';
import 'package:tamga/src/shared/domain/event.dart';
import 'package:tamga/src/core/error/app_exception.dart';
import 'package:tamga/src/core/error/result.dart';

/// A minimal auth repository mock for testing sign-out.
class _MockAuthRepository implements AuthRepository {
  bool signOutCalled = false;
  bool shouldThrowOnSignOut = false;

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
  Future<void> signOut() async {
    signOutCalled = true;
    if (shouldThrowOnSignOut) {
      throw Exception('Sign out failed');
    }
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
  Future<Result<void>> syncPendingOnboarding() async {
    return const Result.ok(null);
  }
}

void main() {
  group('ProfileScreen sign-out', () {
    late _MockAuthRepository mockRepo;

    setUp(() {
      mockRepo = _MockAuthRepository();
    });

    Future<void> pumpProfile(WidgetTester tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authRepositoryProvider.overrideWithValue(mockRepo),
            // Prevent SyncStateNotifier from connecting to coordinator
            cloudSyncCoordinatorProvider.overrideWith(
              (ref) => Completer<CloudSyncCoordinator>().future,
            ),
            horsesProvider.overrideWith((ref) => <HorseRecord>[]),
            eventsProvider.overrideWith((ref) => <Event>[]),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const ProfileScreen(),
          ),
        ),
      );
      // Let auth state resolve and UI settle
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));
      await tester.pump(const Duration(milliseconds: 100));
    }

    testWidgets('shows sign-out button in settings tab', (tester) async {
      await pumpProfile(tester);

      // Tap the third tab (Тохиргоо) directly
      await tester.tap(find.text('Тохиргоо'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Scroll until the sign-out tile is built. Header height varies with
      // the sync status section and the leading back control, so a fixed
      // drag offset is not reliable.
      await tester.dragUntilVisible(
        find.text('Sign Out'),
        find.byType(ListView).last,
        const Offset(0, -100),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Verify sign-out button is present
      expect(find.text('Гарах'), findsWidgets);
      expect(find.text('Sign Out'), findsOneWidget);
      expect(find.byIcon(Icons.logout), findsOneWidget);
    });

    testWidgets('shows confirmation dialog when sign-out is tapped', (
      tester,
    ) async {
      await pumpProfile(tester);

      // Go to settings tab
      await tester.tap(find.text('Тохиргоо'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Scroll until the sign-out tile is built (header height varies).
      await tester.dragUntilVisible(
        find.text('Sign Out'),
        find.byType(ListView).last,
        const Offset(0, -100),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));
      await tester.ensureVisible(find.text('Sign Out'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Tap the sign-out button
      await tester.tap(find.text('Sign Out'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Verify confirmation dialog appears
      expect(
        find.text('Та системээс гарахдаа итгэлтэй байна уу?'),
        findsOneWidget,
      );
      expect(find.text('Болих'), findsOneWidget);
      expect(find.text('Гарах'), findsWidgets); // Title + button
    });

    testWidgets('confirms sign-out calls authRepository.signOut', (
      tester,
    ) async {
      await pumpProfile(tester);

      // Go to settings tab
      await tester.tap(find.text('Тохиргоо'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Scroll until the sign-out tile is built (header height varies).
      await tester.dragUntilVisible(
        find.text('Sign Out'),
        find.byType(ListView).last,
        const Offset(0, -100),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));
      await tester.ensureVisible(find.text('Sign Out'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Tap sign-out
      await tester.tap(find.text('Sign Out'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Tap confirm - find the FilledButton with "Гарах" text (the confirm button)
      final confirmButtons = find.widgetWithText(FilledButton, 'Гарах');
      await tester.tap(confirmButtons.last);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Verify signOut was called
      expect(mockRepo.signOutCalled, true);
    });

    testWidgets('cancel dismisses dialog without calling signOut', (
      tester,
    ) async {
      await pumpProfile(tester);

      // Go to settings tab
      await tester.tap(find.text('Тохиргоо'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Scroll until the sign-out tile is built (header height varies).
      await tester.dragUntilVisible(
        find.text('Sign Out'),
        find.byType(ListView).last,
        const Offset(0, -100),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));
      await tester.ensureVisible(find.text('Sign Out'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Tap sign-out
      await tester.tap(find.text('Sign Out'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Tap cancel
      await tester.tap(find.text('Болих'), warnIfMissed: false);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Verify signOut was NOT called
      expect(mockRepo.signOutCalled, false);
    });
  });
}
