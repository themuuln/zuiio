import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:tamga/src/app/app.dart';
import 'package:tamga/src/app/router/app_router.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/features/auth/application/auth_providers.dart';
import 'package:tamga/src/features/auth/data/auth_repository.dart';
import 'package:tamga/src/features/auth/domain/auth_state.dart';

// ── Mock ──

class MockAuthRepository extends Mock implements AuthRepository {}

/// Builds the real app rooted at the onboarding route with a mocked auth
/// repository, so the wizard renders without Supabase/Isar dependencies.
///
/// Run on a device/emulator: flutter drive --driver=test_driver/integration_test.dart \
///   --target=integration_test/onboarding_flow_test.dart
Widget buildApp({required AuthRepository repository}) {
  return ProviderScope(
    overrides: [
      // Land on onboarding instead of the default /lineage.
      initialRouteProvider.overrideWithValue('/onboarding'),
      authRepositoryProvider.overrideWithValue(repository),
    ],
    child: const TamgaApp(),
  );
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Onboarding end-to-end (integration)', () {
    testWidgets('welcome -> role selection -> region selection', (
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

      // Complete auth resolution to unauthenticated (onboarding is public).
      completer.complete(const Result.ok(AuthState.unauthenticated()));
      await tester.pumpAndSettle();

      // ── Welcome page ──
      expect(find.text('Эхлэх'), findsOneWidget);
      await tester.tap(find.text('Эхлэх'));
      await tester.pumpAndSettle();

      // ── Role selection: all three options visible ──
      expect(find.text('Таны үүрэг'), findsOneWidget);
      expect(find.text('Морь сонирхогч'), findsOneWidget);
      expect(find.text('Уяач / Малчин'), findsOneWidget);
      expect(find.text('Жүчээ / Бизнес'), findsOneWidget);

      await tester.tap(find.text('Уяач / Малчин'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Үргэлжлүүлэх'));
      await tester.pumpAndSettle();

      // ── Region selection ──
      expect(find.text('Аймаг сонгох'), findsOneWidget);
      expect(find.text('Төв'), findsOneWidget);
    });
  });
}
