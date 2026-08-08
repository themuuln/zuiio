import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/l10n/generated/app_localizations.dart';
import 'package:tamga/src/core/widgets/splash_screen.dart';
import 'package:tamga/src/features/auth/application/auth_providers.dart';
import 'package:tamga/src/features/auth/domain/auth_state.dart';

/// A controlled AuthStateNotifier that lets the test control auth state.
class _ControllableAuthNotifier extends AuthStateNotifier {
  final _stateController = StreamController<AuthState>();

  @override
  Stream<AuthState> build() {
    // Never calls super.build() — no kDebugMode bypass.
    _stateController.add(const AuthState.loading());
    return _stateController.stream;
  }

  void emit(AuthState state) {
    _stateController.add(state);
  }
}

/// A test app that shows SplashScreen while auth is loading,
/// and a Scaffold with 'Loaded' after auth resolves.
class _TestApp extends ConsumerWidget {
  const _TestApp();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authAsync = ref.watch(authStateProvider);
    final isLoading = authAsync.valueOrNull?.isLoading ?? true;

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 300),
      switchInCurve: Curves.easeInOut,
      switchOutCurve: Curves.easeInOut,
      child: isLoading
          ? const SplashScreen(key: ValueKey('splash'))
          : Scaffold(
              key: const ValueKey('loaded'),
              body: const Center(child: Text('Loaded')),
            ),
    );
  }
}

void main() {
  group('SplashScreen integration', () {
    testWidgets('shows SplashScreen while auth resolves, then transitions', (
      tester,
    ) async {
      _ControllableAuthNotifier? capturedNotifier;

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authStateProvider.overrideWith(() {
              final notifier = _ControllableAuthNotifier();
              capturedNotifier = notifier;
              return notifier;
            }),
          ],
          child: MaterialApp(
            locale: const Locale('mn'),
            localizationsDelegates: AppLocalizations.localizationsDelegates,
            supportedLocales: AppLocalizations.supportedLocales,
            home: const _TestApp(),
          ),
        ),
      );
      await tester.pump();

      // SplashScreen should be visible while auth is loading
      expect(find.byType(SplashScreen), findsOneWidget);
      expect(find.text('Тамга'), findsOneWidget);

      // Complete auth resolution to unauthenticated
      capturedNotifier!.emit(const AuthState.unauthenticated());
      await tester.pump();
      // AnimatedSwitcher has 300ms duration
      await tester.pump(const Duration(milliseconds: 350));

      // Splash should be gone, 'Loaded' text should be visible
      expect(find.byType(SplashScreen), findsNothing);
      expect(find.text('Loaded'), findsOneWidget);
    });
  });
}
