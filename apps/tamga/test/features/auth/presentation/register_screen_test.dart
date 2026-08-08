import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:mocktail/mocktail.dart';
import 'package:tamga/l10n/generated/app_localizations.dart';
import 'package:tamga/src/features/auth/application/auth_providers.dart';
import 'package:tamga/src/features/auth/data/auth_repository.dart';
import 'package:tamga/src/features/auth/domain/auth_state.dart';
import 'package:tamga/src/features/auth/presentation/register_screen.dart';
import 'package:tamga/src/core/error/result.dart';

// ── Controlled auth notifier ──

/// A notifier that yields AuthState.unauthenticated (never hits kDebugMode bypass).
class _TestAuthNotifier extends AuthStateNotifier {
  @override
  Stream<AuthState> build() async* {
    yield const AuthState.unauthenticated();
    // Then listen to authStateChanges from repository
    final repository = ref.read(authRepositoryProvider);
    yield* repository.authStateChanges;
  }
}

// ── Mock ──

class MockAuthRepository extends Mock implements AuthRepository {}

// ── Placeholder for GoRouter routes ──

class _Placeholder extends StatelessWidget {
  const _Placeholder(this.label);
  final String label;
  @override
  Widget build(BuildContext context) => Scaffold(body: Text(label));
}

GoRouter _testRouter(Widget home) {
  return GoRouter(
    initialLocation: '/test',
    routes: [
      GoRoute(path: '/test', builder: (_, _) => home),
      GoRoute(
        path: '/lineage',
        builder: (_, _) => const _Placeholder('Lineage'),
      ),
      GoRoute(
        path: '/register',
        builder: (_, _) => const _Placeholder('Register'),
      ),
    ],
  );
}

void main() {
  late MockAuthRepository mockRepo;

  setUp(() {
    mockRepo = MockAuthRepository();
    when(
      () => mockRepo.getCurrentUser(),
    ).thenAnswer((_) async => const Result.ok(AuthState.unauthenticated()));
    when(
      () => mockRepo.authStateChanges,
    ).thenAnswer((_) => const Stream.empty());
  });

  Widget buildApp({AuthRepository? repository}) {
    final repo = repository ?? mockRepo;
    return ProviderScope(
      overrides: [
        authStateProvider.overrideWith(() => _TestAuthNotifier()),
        authRepositoryProvider.overrideWithValue(repo),
      ],
      child: MaterialApp.router(
        routerConfig: _testRouter(const RegisterScreen()),
        locale: const Locale('mn'),
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
      ),
    );
  }

  group('RegisterScreen', () {
    testWidgets('renders registration form with all fields', (tester) async {
      await tester.pumpWidget(buildApp(repository: mockRepo));
      await tester.pumpAndSettle();

      expect(find.text('Бүртгүүлэх'), findsWidgets);
      expect(find.text('Нэр (заавал биш)'), findsOneWidget);
      expect(find.text('Имэйл'), findsOneWidget);
      expect(find.text('Нууц үг'), findsOneWidget);
      expect(find.text('Нууц үг давтах'), findsOneWidget);
      expect(find.byType(TextFormField), findsNWidgets(4));
    });

    testWidgets('renders heading and horse emoji', (tester) async {
      await tester.pumpWidget(buildApp(repository: mockRepo));
      await tester.pumpAndSettle();

      expect(find.text('Шинээр бүртгүүлэх'), findsOneWidget);
      expect(find.textContaining('🐎'), findsOneWidget);
    });

    testWidgets('renders back to login link', (tester) async {
      await tester.pumpWidget(buildApp(repository: mockRepo));
      await tester.pumpAndSettle();

      expect(find.text('Аль хэдийн бүртгэлтэй юу? Нэвтрэх'), findsOneWidget);
    });

    testWidgets('validates empty email field', (tester) async {
      await tester.pumpWidget(buildApp(repository: mockRepo));
      await tester.pumpAndSettle();

      // Clear pre-filled fields (filled in debug mode)
      await tester.enterText(find.byType(TextFormField).at(1), '');
      await tester.enterText(find.byType(TextFormField).at(2), '');
      await tester.tap(find.widgetWithText(FilledButton, 'Бүртгүүлэх'));
      await tester.pumpAndSettle();

      expect(find.text('Имэйл хаягаа оруулна уу'), findsOneWidget);
    });

    testWidgets('validates invalid email format', (tester) async {
      await tester.pumpWidget(buildApp(repository: mockRepo));
      await tester.pumpAndSettle();

      // Skip name field, enter invalid email
      await tester.enterText(
        find.byType(TextFormField).at(1), // email field
        'notanemail',
      );
      await tester.tap(find.widgetWithText(FilledButton, 'Бүртгүүлэх'));
      await tester.pumpAndSettle();

      expect(find.text('Зөв имэйл хаяг оруулна уу'), findsOneWidget);
    });

    testWidgets('validates empty password field', (tester) async {
      await tester.pumpWidget(buildApp(repository: mockRepo));
      await tester.pumpAndSettle();

      await tester.enterText(
        find.byType(TextFormField).at(1),
        'test@example.com',
      );
      // Clear pre-filled password (filled in debug mode)
      await tester.enterText(find.byType(TextFormField).at(2), '');
      await tester.tap(find.widgetWithText(FilledButton, 'Бүртгүүлэх'));
      await tester.pumpAndSettle();

      expect(find.text('Нууц үгээ оруулна уу'), findsOneWidget);
    });

    testWidgets('validates short password', (tester) async {
      await tester.pumpWidget(buildApp(repository: mockRepo));
      await tester.pumpAndSettle();

      await tester.enterText(
        find.byType(TextFormField).at(1),
        'test@example.com',
      );
      await tester.enterText(
        find.byType(TextFormField).at(2), // password field
        '123',
      );
      await tester.tap(find.widgetWithText(FilledButton, 'Бүртгүүлэх'));
      await tester.pumpAndSettle();

      expect(
        find.text('Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой'),
        findsOneWidget,
      );
    });

    testWidgets('validates password confirmation mismatch', (tester) async {
      await tester.pumpWidget(buildApp(repository: mockRepo));
      await tester.pumpAndSettle();

      await tester.enterText(
        find.byType(TextFormField).at(1),
        'test@example.com',
      );
      await tester.enterText(find.byType(TextFormField).at(2), 'password123');
      await tester.enterText(
        find.byType(TextFormField).at(3), // confirm password
        'different123',
      );
      await tester.tap(find.widgetWithText(FilledButton, 'Бүртгүүлэх'));
      await tester.pumpAndSettle();

      expect(find.text('Нууц үг таарахгүй байна'), findsOneWidget);
    });

    testWidgets('calls signUpWithEmail on valid form submit', (tester) async {
      when(
        () => mockRepo.signUpWithEmail(
          email: any(named: 'email'),
          password: any(named: 'password'),
          displayName: any(named: 'displayName'),
        ),
      ).thenAnswer(
        (_) async => const Result.ok(AuthState.authenticated(userId: 'user-1')),
      );

      await tester.pumpWidget(buildApp(repository: mockRepo));
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField).at(0), 'Тэмүүлэн');
      await tester.enterText(
        find.byType(TextFormField).at(1),
        'test@example.com',
      );
      await tester.enterText(find.byType(TextFormField).at(2), 'password123');
      await tester.enterText(find.byType(TextFormField).at(3), 'password123');
      await tester.tap(find.widgetWithText(FilledButton, 'Бүртгүүлэх'));
      await tester.pumpAndSettle();

      verify(
        () => mockRepo.signUpWithEmail(
          email: 'test@example.com',
          password: 'password123',
          displayName: 'Тэмүүлэн',
        ),
      ).called(1);
    });

    testWidgets('skips displayName when name field is empty', (tester) async {
      when(
        () => mockRepo.signUpWithEmail(
          email: any(named: 'email'),
          password: any(named: 'password'),
          displayName: any(named: 'displayName'),
        ),
      ).thenAnswer(
        (_) async => const Result.ok(AuthState.authenticated(userId: 'user-1')),
      );

      await tester.pumpWidget(buildApp(repository: mockRepo));
      await tester.pumpAndSettle();

      // Clear pre-filled name (filled in debug mode), then fill rest
      await tester.enterText(find.byType(TextFormField).at(0), '');
      await tester.enterText(
        find.byType(TextFormField).at(1),
        'test@example.com',
      );
      await tester.enterText(find.byType(TextFormField).at(2), 'password123');
      await tester.enterText(find.byType(TextFormField).at(3), 'password123');
      await tester.tap(find.widgetWithText(FilledButton, 'Бүртгүүлэх'));
      await tester.pumpAndSettle();

      verify(
        () => mockRepo.signUpWithEmail(
          email: 'test@example.com',
          password: 'password123',
          displayName: null,
        ),
      ).called(1);
    });

    testWidgets('shows loading indicator while registering', (tester) async {
      final completer = Completer<Result<AuthState>>();
      when(
        () => mockRepo.signUpWithEmail(
          email: any(named: 'email'),
          password: any(named: 'password'),
          displayName: any(named: 'displayName'),
        ),
      ).thenAnswer((_) => completer.future);

      await tester.pumpWidget(buildApp(repository: mockRepo));
      await tester.pumpAndSettle();

      await tester.enterText(
        find.byType(TextFormField).at(1),
        'test@example.com',
      );
      await tester.enterText(find.byType(TextFormField).at(2), 'password123');
      await tester.enterText(find.byType(TextFormField).at(3), 'password123');
      await tester.tap(find.widgetWithText(FilledButton, 'Бүртгүүлэх'));
      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      completer.complete(const Result.ok(AuthState.unauthenticated()));
      await tester.pumpAndSettle();
    });
  });
}
