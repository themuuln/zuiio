/// VAL-EVENTS-027: Partner Dashboard-д профайл хуудаснаас шилжих тест
///
/// Профайл хуудасны "Тохиргоо" tab-д байрлах "Түншийн самбар" товчийг
/// дарж PartnerDashboardScreen руу шилжихийг баталгаажуулна.
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/core/error/app_exception.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/features/auth/application/auth_providers.dart';
import 'package:tamga/src/features/auth/data/auth_repository.dart';
import 'package:tamga/src/features/auth/domain/auth_state.dart';
import 'package:tamga/src/features/horses/domain/horse_record.dart';
import 'package:tamga/src/features/horses/application/horses_providers.dart';
import 'package:tamga/src/features/events/application/events_providers.dart';
import 'package:tamga/src/features/events/data/event_repository.dart';
import 'package:tamga/src/features/profile/presentation/profile_screen.dart';
import 'package:tamga/src/shared/domain/event.dart';

// ── Mock AuthRepository ─────────────────────────────────────────────

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
    // no-op
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

// ── Mock EventRepository ───────────────────────────────────────────

class _MockEventRepository extends EventRepository {
  final List<Event> _events = [];

  @override
  Future<Result<List<Event>>> fetchEvents() async {
    return Result.ok(_events);
  }

  @override
  Future<Result<List<Event>>> fetchEventsByHorse(String horseId) async {
    return Result.ok([]);
  }

  @override
  Future<Result<List<Event>>> fetchEventsByOwner(String ownerId) async {
    return Result.ok(_events.where((e) => e.ownerId == ownerId).toList());
  }

  @override
  Future<Result<List<Event>>> fetchFeaturedEvents() async {
    return Result.ok(_events.where((e) => e.isFeatured).toList());
  }

  @override
  Future<Result<Event>> saveEvent(Event event) async {
    _events.add(event);
    return Result.ok(event);
  }

  @override
  Future<Result<void>> deleteEvent(String id) async {
    _events.removeWhere((e) => e.id == id);
    return Result.ok(null);
  }
}

// ── Test helpers ────────────────────────────────────────────────────

/// Partner Dashboard-ийн тест дэлгэц — жинхэнэ PartnerDashboardScreen-ийг
/// орлох mock бөгөөд уникал тэмдэгтээр тусад нь илрүүлэгдэнэ.
class _PartnerDashboardTestScreen extends StatelessWidget {
  const _PartnerDashboardTestScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text('PARTNER_DASHBOARD_LOADED'),
      ),
    );
  }
}

void main() {
  group('VAL-EVENTS-027: Profile screen → Partner Dashboard navigation', () {
    final mockAuthRepo = _MockAuthRepository();
    final mockEventRepo = _MockEventRepository();

    testWidgets('"Түншийн самбар" ListTile is visible in Settings tab', (
      tester,
    ) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authRepositoryProvider.overrideWithValue(mockAuthRepo),
            localEventRepositoryProvider.overrideWith(
              (ref) => mockEventRepo,
            ),
            horsesProvider.overrideWith((ref) => <HorseRecord>[]),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const ProfileScreen(),
          ),
        ),
      );
      // Let auth state resolve
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));
      await tester.pump(const Duration(milliseconds: 100));

      // Navigate to Settings tab (index 2)
      await tester.tap(find.text('Тохиргоо'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Scroll down to ensure "Түншийн самбар" is visible
      await tester.drag(find.byType(ListView).last, const Offset(0, -600));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Verify the "Түншийн самбар" ListTile is present
      expect(find.text('Түншийн самбар'), findsOneWidget);
      expect(find.text('Арга хэмжээ удирдах / Partner Dashboard'), findsOneWidget);
      expect(find.byIcon(Icons.dashboard_outlined), findsOneWidget);
    });

    testWidgets(
        'tapping "Түншийн самбар" navigates to PartnerDashboardScreen', (
      tester,
    ) async {
      final goRouter = GoRouter(
        initialLocation: '/profile',
        routes: [
          GoRoute(
            path: '/profile',
            builder: (ctx, state) => const ProfileScreen(),
            routes: [
              GoRoute(
                path: 'partner-dashboard',
                builder: (ctx, state) => const _PartnerDashboardTestScreen(),
              ),
            ],
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authRepositoryProvider.overrideWithValue(mockAuthRepo),
            localEventRepositoryProvider.overrideWith(
              (ref) => mockEventRepo,
            ),
            horsesProvider.overrideWith((ref) => <HorseRecord>[]),
          ],
          child: MaterialApp.router(
            theme: AppTheme.light(),
            routerConfig: goRouter,
          ),
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));
      await tester.pump(const Duration(milliseconds: 100));

      // Navigate to Settings tab
      await tester.tap(find.text('Тохиргоо'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Scroll down
      await tester.drag(find.byType(ListView).last, const Offset(0, -600));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Tap "Түншийн самбар" 
      await tester.tap(find.text('Түншийн самбар').last);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));
      await tester.pump(const Duration(milliseconds: 300));

      // Verify navigation to PartnerDashboardScreen occurred
      // by checking for a unique text in the destination screen
      expect(find.text('PARTNER_DASHBOARD_LOADED'), findsOneWidget);
    });
  });
}
