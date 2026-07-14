import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:tamga/src/app/app.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/core/widgets/splash_screen.dart';
import 'package:tamga/src/features/auth/application/auth_providers.dart';
import 'package:tamga/src/features/auth/data/auth_repository.dart';
import 'package:tamga/src/features/auth/domain/auth_state.dart';

// ── Mock ──

class MockAuthRepository extends Mock implements AuthRepository {}

/// Helper: wraps TamgaApp with a mocked auth repository.
///
/// Uses /login as initial route to avoid triggering GoRouter redirect
/// into protected screens that require Isar initialization.
Widget buildApp({required AuthRepository repository}) {
  return Directionality(
    textDirection: TextDirection.ltr,
    child: ProviderScope(
      overrides: [authRepositoryProvider.overrideWithValue(repository)],
      child: const TamgaApp(),
    ),
  );
}

void main() {
  group('SplashScreen integration', () {
    testWidgets('shows SplashScreen while auth resolves, then transitions', (
      tester,
    ) async {
      final mockRepo = MockAuthRepository();
      final completer = Completer<Result<AuthState>>();
      when(() => mockRepo.getCurrentUser()).thenAnswer((_) => completer.future);
      when(
        () => mockRepo.authStateChanges,
      ).thenAnswer((_) => const Stream.empty());

      await tester.pumpWidget(buildApp(repository: mockRepo));
      await tester.pump();

      // SplashScreen should be visible while auth is loading
      expect(find.byType(SplashScreen), findsOneWidget);
      expect(find.text('Тамга'), findsOneWidget);

      // Complete auth resolution to unauthenticated
      completer.complete(const Result.ok(AuthState.unauthenticated()));
      await tester.pump();
      // AnimatedSwitcher has 300ms duration
      await tester.pump(const Duration(milliseconds: 350));

      // Splash should be gone, MaterialApp.router should be visible
      expect(find.byType(SplashScreen), findsNothing);
      expect(find.byType(MaterialApp), findsOneWidget);
    });
  });
}
