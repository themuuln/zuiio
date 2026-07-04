import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:tamga/src/features/auth/application/auth_providers.dart';
import 'package:tamga/src/features/auth/data/auth_repository.dart';
import 'package:tamga/src/features/auth/domain/auth_state.dart';
import 'package:tamga/src/features/auth/presentation/login_screen.dart';
import 'package:tamga/src/core/error/result.dart';

// ── Mock ────────────────────────────────────────────────────────────────

class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late MockAuthRepository mockRepo;

  setUp(() {
    mockRepo = MockAuthRepository();
    // Default: unauthenticated, empty state changes stream
    when(
      () => mockRepo.getCurrentUser(),
    ).thenAnswer((_) async => const Result.ok(AuthState.unauthenticated()));
    when(
      () => mockRepo.authStateChanges,
    ).thenAnswer((_) => const Stream.empty());
  });

  Widget buildApp({AuthRepository? repository}) {
    return ProviderScope(
      overrides: [
        // Override the authRepositoryProvider
        if (repository != null)
          authRepositoryProvider.overrideWithValue(repository),
      ],
      child: const MaterialApp(home: LoginScreen()),
    );
  }

  group('LoginScreen', () {
    testWidgets('renders login form with email and password fields', (
      tester,
    ) async {
      await tester.pumpWidget(buildApp(repository: mockRepo));
      await tester.pumpAndSettle();

      expect(find.text('Нэвтрэх'), findsWidgets);
      expect(find.text('Имэйл'), findsOneWidget);
      expect(find.text('Нууц үг'), findsOneWidget);
      expect(find.byType(TextFormField), findsNWidgets(2));
    });

    testWidgets('renders logo and app name', (tester) async {
      await tester.pumpWidget(buildApp(repository: mockRepo));
      await tester.pumpAndSettle();

      expect(find.textContaining('🐎'), findsOneWidget);
      expect(find.text('Адуучин'), findsOneWidget);
    });

    testWidgets('renders guest login button', (tester) async {
      await tester.pumpWidget(buildApp(repository: mockRepo));
      await tester.pumpAndSettle();

      expect(find.text('Зочин хэрэглэгч'), findsOneWidget);
    });

    testWidgets('renders register link', (tester) async {
      await tester.pumpWidget(buildApp(repository: mockRepo));
      await tester.pumpAndSettle();

      expect(find.text('Бүртгүүлэх'), findsOneWidget);
    });

    testWidgets('validates empty email field', (tester) async {
      await tester.pumpWidget(buildApp(repository: mockRepo));
      await tester.pumpAndSettle();

      // Clear pre-filled email (filled in debug mode)
      await tester.enterText(find.byType(TextFormField).first, '');
      await tester.tap(find.text('Нэвтрэх').last);
      await tester.pumpAndSettle();

      expect(find.text('Имэйл хаягаа оруулна уу'), findsOneWidget);
    });

    testWidgets('validates invalid email format', (tester) async {
      await tester.pumpWidget(buildApp(repository: mockRepo));
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField).first, 'notanemail');
      await tester.tap(find.text('Нэвтрэх').last);
      await tester.pumpAndSettle();

      expect(find.text('Зөв имэйл хаяг оруулна уу'), findsOneWidget);
    });

    testWidgets('validates empty password field', (tester) async {
      await tester.pumpWidget(buildApp(repository: mockRepo));
      await tester.pumpAndSettle();

      await tester.enterText(
        find.byType(TextFormField).first,
        'test@example.com',
      );
      // Clear pre-filled password (filled in debug mode)
      await tester.enterText(find.byType(TextFormField).last, '');
      await tester.tap(find.text('Нэвтрэх').last);
      await tester.pumpAndSettle();

      expect(find.text('Нууц үгээ оруулна уу'), findsOneWidget);
    });

    testWidgets('validates short password', (tester) async {
      await tester.pumpWidget(buildApp(repository: mockRepo));
      await tester.pumpAndSettle();

      await tester.enterText(
        find.byType(TextFormField).first,
        'test@example.com',
      );
      await tester.enterText(find.byType(TextFormField).last, '123');
      await tester.tap(find.text('Нэвтрэх').last);
      await tester.pumpAndSettle();

      expect(
        find.text('Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой'),
        findsOneWidget,
      );
    });

    testWidgets('calls signInWithEmail on valid form submit', (tester) async {
      when(
        () => mockRepo.signInWithEmail(
          email: any(named: 'email'),
          password: any(named: 'password'),
        ),
      ).thenAnswer(
        (_) async => const Result.ok(AuthState.authenticated(userId: 'user-1')),
      );

      await tester.pumpWidget(buildApp(repository: mockRepo));
      await tester.pumpAndSettle();

      await tester.enterText(
        find.byType(TextFormField).first,
        'test@example.com',
      );
      await tester.enterText(find.byType(TextFormField).last, 'password123');
      await tester.tap(find.text('Нэвтрэх').last);
      await tester.pumpAndSettle();

      verify(
        () => mockRepo.signInWithEmail(
          email: 'test@example.com',
          password: 'password123',
        ),
      ).called(1);
    });

    testWidgets('shows loading indicator while authenticating', (tester) async {
      // Use a Completer to delay the response
      final completer = Completer<Result<AuthState>>();
      when(
        () => mockRepo.signInWithEmail(
          email: any(named: 'email'),
          password: any(named: 'password'),
        ),
      ).thenAnswer((_) => completer.future);

      await tester.pumpWidget(buildApp(repository: mockRepo));
      await tester.pumpAndSettle();

      await tester.enterText(
        find.byType(TextFormField).first,
        'test@example.com',
      );
      await tester.enterText(find.byType(TextFormField).last, 'password123');
      await tester.tap(find.text('Нэвтрэх').last);
      await tester.pump();

      // Loading spinner should appear
      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      // Complete the future to clean up
      completer.complete(const Result.ok(AuthState.unauthenticated()));
      await tester.pumpAndSettle();
    });
  });
}
