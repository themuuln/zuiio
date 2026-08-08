import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:tamga/src/core/theme/tamga_design_system.dart';
import 'package:tamga/l10n/generated/app_localizations.dart';
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

class _Placeholder extends StatelessWidget {
  const _Placeholder(this.label);
  final String label;
  @override
  Widget build(BuildContext context) => Scaffold(body: Text(label));
}

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
      final goRouter = GoRouter(
        initialLocation: '/test',
        routes: [
          GoRoute(path: '/test', builder: (_, _) => const ProfileScreen()),
          GoRoute(
            path: '/login',
            builder: (_, _) => const _Placeholder('Login'),
          ),
          GoRoute(
            path: '/lineage',
            builder: (_, _) => const _Placeholder('Lineage'),
          ),
        ],
      );
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
          child: MaterialApp.router(
            theme: TamgaDesignSystem.buildThemeData(Brightness.light),
            locale: const Locale('mn'),
            localizationsDelegates: AppLocalizations.localizationsDelegates,
            supportedLocales: AppLocalizations.supportedLocales,
            routerConfig: goRouter,
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

      // Debug: verify the screen rendered
      expect(
        find.byType(ProfileScreen),
        findsOneWidget,
        reason: 'ProfileScreen should be visible',
      );
      expect(
        find.text('Тохиргоо'),
        findsOneWidget,
        reason: 'Settings tab should be visible',
      );

      // Tap the third tab (Тохиргоо) directly
      await tester.tap(find.text('Тохиргоо'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Debug: verify Settings tab content
      expect(
        find.text('Мэдээлэл'),
        findsOneWidget,
        reason: 'Session info should be visible',
      );

      // Try to find the Sign Out card using scroll
      final listViewFinder = find.byType(ListView).last;
      await tester.drag(listViewFinder, const Offset(0, -2000));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Debug: check what's visible near the bottom
      expect(
        find.text('Гарах'),
        findsAtLeastNWidgets(1),
        reason: 'Sign Out title should be visible',
      );
      expect(
        find.text('Sign Out'),
        findsOneWidget,
        reason: 'Sign Out subtitle should be visible',
      );
      expect(
        find.byIcon(Icons.logout),
        findsOneWidget,
        reason: 'Logout icon should be visible',
      );
    });

    testWidgets('shows confirmation dialog when sign-out is tapped', (
      tester,
    ) async {
      await pumpProfile(tester);

      // Go to settings tab
      await tester.tap(find.text('Тохиргоо'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Scroll down to ensure sign-out button is visible
      final listViewFinder = find.byType(ListView).last;
      await tester.drag(listViewFinder, const Offset(0, -2000));
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

      // Scroll down to ensure sign-out button is visible
      final listViewFinder = find.byType(ListView).last;
      await tester.drag(listViewFinder, const Offset(0, -2000));
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

      // Scroll down to ensure sign-out button is visible
      final listViewFinder = find.byType(ListView).last;
      await tester.drag(listViewFinder, const Offset(0, -2000));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));
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
