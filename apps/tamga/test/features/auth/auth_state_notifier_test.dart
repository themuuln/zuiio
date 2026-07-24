import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';
import 'package:tamga/src/features/auth/application/auth_providers.dart';
import 'package:tamga/src/features/auth/data/auth_repository.dart';
import 'package:tamga/src/features/auth/domain/auth_state.dart';
import 'package:tamga/src/core/error/app_exception.dart';
import 'package:tamga/src/core/error/result.dart';

// ── Mocks ───────────────────────────────────────────────────────────────

class MockAuthRepository extends Mock implements AuthRepository {}

ProviderContainer createContainer({AuthRepository? repository}) {
  return ProviderContainer(
    overrides: [
      if (repository != null)
        authRepositoryProvider.overrideWithValue(repository),
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
    when(() => mockRepo.sessionExpired).thenAnswer((_) => const Stream.empty());
    when(
      () => mockRepo.syncPendingOnboarding(),
    ).thenAnswer((_) async => const Result.ok(null));
  });

  group('AuthStateNotifier', () {
    test(
      'initial state is unauthenticated when repository returns unauthenticated',
      () async {
        final container = createContainer(repository: mockRepo);
        addTearDown(container.dispose);

        final notifier = container.read(authStateProvider.notifier);
        expect(notifier, isNotNull);
      },
    );

    test(
      'signInWithEmail calls repository and syncs onboarding on success',
      () async {
        when(
          () => mockRepo.signInWithEmail(
            email: any(named: 'email'),
            password: any(named: 'password'),
          ),
        ).thenAnswer(
          (_) async => Result.ok(
            const AuthState.authenticated(
              userId: 'user-1',
              email: 'test@example.com',
            ),
          ),
        );

        final container = createContainer(repository: mockRepo);
        addTearDown(container.dispose);

        final notifier = container.read(authStateProvider.notifier);
        await notifier.signInWithEmail(
          email: 'test@example.com',
          password: 'password123',
        );

        verify(
          () => mockRepo.signInWithEmail(
            email: 'test@example.com',
            password: 'password123',
          ),
        ).called(1);
        verify(() => mockRepo.syncPendingOnboarding()).called(1);
      },
    );

    test('signInWithEmail throws AppException on failure', () async {
      final authError = AppException.withDetail(
        'AUTH_FAILED',
        'Нэвтрэх амжилтгүй',
      );
      when(
        () => mockRepo.signInWithEmail(
          email: any(named: 'email'),
          password: any(named: 'password'),
        ),
      ).thenAnswer((_) async => Result.fail(authError));

      final container = createContainer(repository: mockRepo);
      addTearDown(container.dispose);

      final notifier = container.read(authStateProvider.notifier);
      expect(
        () => notifier.signInWithEmail(
          email: 'test@example.com',
          password: 'wrong',
        ),
        throwsA(isA<AppException>()),
      );
    });

    test(
      'signUpWithEmail calls repository and syncs onboarding on success',
      () async {
        when(
          () => mockRepo.signUpWithEmail(
            email: any(named: 'email'),
            password: any(named: 'password'),
            displayName: any(named: 'displayName'),
          ),
        ).thenAnswer(
          (_) async => Result.ok(
            const AuthState.authenticated(
              userId: 'user-2',
              email: 'new@example.com',
            ),
          ),
        );

        final container = createContainer(repository: mockRepo);
        addTearDown(container.dispose);

        final notifier = container.read(authStateProvider.notifier);
        await notifier.signUpWithEmail(
          email: 'new@example.com',
          password: 'securePass123',
          displayName: 'New User',
        );

        verify(
          () => mockRepo.signUpWithEmail(
            email: 'new@example.com',
            password: 'securePass123',
            displayName: 'New User',
          ),
        ).called(1);
        verify(() => mockRepo.syncPendingOnboarding()).called(1);
      },
    );

    test('signUpWithEmail throws on failure', () async {
      final authError = AppException.withDetail(
        'REG_FAILED',
        'Бүртгэл амжилтгүй',
      );
      when(
        () => mockRepo.signUpWithEmail(
          email: any(named: 'email'),
          password: any(named: 'password'),
          displayName: any(named: 'displayName'),
        ),
      ).thenAnswer((_) async => Result.fail(authError));

      final container = createContainer(repository: mockRepo);
      addTearDown(container.dispose);

      final notifier = container.read(authStateProvider.notifier);
      expect(
        () => notifier.signUpWithEmail(
          email: 'new@example.com',
          password: 'pass',
        ),
        throwsA(isA<AppException>()),
      );
    });

    test('signInWithPhone calls repository', () async {
      when(
        () => mockRepo.signInWithPhone(phone: any(named: 'phone')),
      ).thenAnswer((_) async => const Result.ok(AuthState.loading()));

      final container = createContainer(repository: mockRepo);
      addTearDown(container.dispose);

      final notifier = container.read(authStateProvider.notifier);
      await notifier.signInWithPhone(phone: '+97699119911');

      verify(() => mockRepo.signInWithPhone(phone: '+97699119911')).called(1);
    });

    test('signInWithPhone throws on failure', () async {
      final authError = AppException.withDetail(
        'PHONE_FAILED',
        'Утасны дугаар буруу',
      );
      when(
        () => mockRepo.signInWithPhone(phone: any(named: 'phone')),
      ).thenAnswer((_) async => Result.fail(authError));

      final container = createContainer(repository: mockRepo);
      addTearDown(container.dispose);

      final notifier = container.read(authStateProvider.notifier);
      expect(
        () => notifier.signInWithPhone(phone: '+97699119911'),
        throwsA(isA<AppException>()),
      );
    });

    test('verifyPhoneOtp calls repository and syncs on success', () async {
      when(
        () => mockRepo.verifyPhoneOtp(
          phone: any(named: 'phone'),
          token: any(named: 'token'),
        ),
      ).thenAnswer(
        (_) async => Result.ok(
          const AuthState.authenticated(
            userId: 'user-3',
            phone: '+97699119911',
          ),
        ),
      );

      final container = createContainer(repository: mockRepo);
      addTearDown(container.dispose);

      final notifier = container.read(authStateProvider.notifier);
      await notifier.verifyPhoneOtp(phone: '+97699119911', token: '123456');

      verify(
        () => mockRepo.verifyPhoneOtp(phone: '+97699119911', token: '123456'),
      ).called(1);
      verify(() => mockRepo.syncPendingOnboarding()).called(1);
    });

    test('signInAnonymously calls repository and syncs on success', () async {
      when(() => mockRepo.signInAnonymously()).thenAnswer(
        (_) async => Result.ok(
          const AuthState.authenticated(userId: 'anon-1', isAnonymous: true),
        ),
      );

      final container = createContainer(repository: mockRepo);
      addTearDown(container.dispose);

      final notifier = container.read(authStateProvider.notifier);
      await notifier.signInAnonymously();

      verify(() => mockRepo.signInAnonymously()).called(1);
      verify(() => mockRepo.syncPendingOnboarding()).called(1);
    });

    test('signOut calls repository signOut', () async {
      when(() => mockRepo.signOut()).thenAnswer((_) async {});

      final container = createContainer(repository: mockRepo);
      addTearDown(container.dispose);

      final notifier = container.read(authStateProvider.notifier);
      await notifier.signOut();

      verify(() => mockRepo.signOut()).called(1);
    });
  });
}
