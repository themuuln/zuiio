import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:tamga/src/app/router/app_router.dart';
import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/features/auth/application/auth_providers.dart';
import 'package:tamga/src/features/auth/domain/auth_state.dart';
import 'package:tamga/src/features/care/application/care_providers.dart';
import 'package:tamga/src/features/horses/application/horses_providers.dart';
import 'package:tamga/src/features/home/presentation/home_screen.dart';
import 'package:tamga/src/features/profile/application/cloud_sync_coordinator.dart';
import 'package:tamga/src/features/shared/application/sync_providers.dart';

/// Regression guard: the shell must render with semantics enabled (the
/// '!semantics.parentDataDirty' crash class Maestro/XCTest hit when the FAB
/// menu's all-Positioned Stack got unbounded constraints).
class _FakeAuthStateNotifier extends AuthStateNotifier {
  _FakeAuthStateNotifier(this._state);

  final AuthState _state;

  @override
  Stream<AuthState> build() async* {
    yield _state;
  }
}

void main() {
  testWidgets('PROBE: app shell renders under enabled semantics', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues(const {});
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authStateProvider.overrideWith(
            () => _FakeAuthStateNotifier(
              const AuthState.authenticated(
                userId: 'user-1',
                email: 'user@test.com',
              ),
            ),
          ),
          horsesProvider.overrideWith((ref) async => const []),
          careOverviewProvider.overrideWith(
            (ref) async => const CareOverview(
              tasks: [],
              upcomingEvents: [],
              monitoredHorseIds: {},
              attentionHorseIds: {},
              healthLogCount: 0,
            ),
          ),
          syncStateProvider.overrideWith((ref) {
            final notifier = SyncStateNotifier(ref);
            notifier.state = const SyncState();
            return notifier;
          }),
        ],
        child: Consumer(
          builder: (context, ref, _) {
            final router = ref.watch(appRouterProvider);
            return MaterialApp.router(
              theme: AppTheme.light(),
              routerConfig: router,
            );
          },
        ),
      ),
    );
    await tester.pump(const Duration(seconds: 1));
    await tester.pump(const Duration(seconds: 1));
    // The shell (home tab) should be visible.
    expect(find.byType(HomeScreen), findsOneWidget);
    semantics.dispose();
  });
}
