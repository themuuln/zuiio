import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:gotrue/gotrue.dart' as gotrue;
import 'package:mocktail/mocktail.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import 'package:tamga/src/features/auth/data/supabase_auth_repository.dart';
import 'package:tamga/src/features/auth/domain/auth_state.dart';

// ── Mocks ───────────────────────────────────────────────────────────────

class MockSupabaseClient extends Mock implements SupabaseClient {}

class MockGoTrueClient extends Mock implements GoTrueClient {}

class MockUser extends Mock implements User {}

class MockSession extends Mock implements Session {}

class MockAuthResponse extends Mock implements AuthResponse {}

void main() {
  setUpAll(() {
    registerFallbackValue(OtpType.sms);
    SharedPreferences.setMockInitialValues({});
  });

  late MockSupabaseClient mockClient;
  late MockGoTrueClient mockAuth;
  late SupabaseAuthRepository repository;

  setUp(() {
    mockClient = MockSupabaseClient();
    mockAuth = MockGoTrueClient();
    when(() => mockClient.auth).thenReturn(mockAuth);
    repository = SupabaseAuthRepository(client: mockClient);
  });

  // Helper to build a mock User with controlled fields
  MockUser buildMockUser({
    String id = 'user-123',
    String? email = 'test@example.com',
    String? phone,
    String? displayName,
    bool isAnonymous = false,
  }) {
    final user = MockUser();
    when(() => user.id).thenReturn(id);
    when(() => user.email).thenReturn(email);
    when(() => user.phone).thenReturn(phone);
    when(
      () => user.userMetadata,
    ).thenReturn(displayName != null ? {'display_name': displayName} : null);
    when(() => user.isAnonymous).thenReturn(isAnonymous);
    return user;
  }

  group('getCurrentUser', () {
    test('returns unauthenticated when no session exists', () async {
      when(() => mockAuth.currentSession).thenReturn(null);
      when(() => mockAuth.currentUser).thenReturn(null);

      final result = await repository.getCurrentUser();

      expect(result.isSuccess, isTrue);
      expect(result.value.status, AuthStatus.unauthenticated);
    });

    test('returns authenticated when session exists', () async {
      final user = buildMockUser();
      final session = MockSession();
      when(() => mockAuth.currentSession).thenReturn(session);
      when(() => mockAuth.currentUser).thenReturn(user);

      final result = await repository.getCurrentUser();

      expect(result.isSuccess, isTrue);
      expect(result.value.status, AuthStatus.authenticated);
      expect(result.value.userId, 'user-123');
      expect(result.value.email, 'test@example.com');
    });

    test('returns authenticated with anonymous flag', () async {
      final user = buildMockUser(isAnonymous: true);
      final session = MockSession();
      when(() => mockAuth.currentSession).thenReturn(session);
      when(() => mockAuth.currentUser).thenReturn(user);

      final result = await repository.getCurrentUser();

      expect(result.isSuccess, isTrue);
      expect(result.value.isAnonymous, isTrue);
    });
  });

  group('signUpWithEmail', () {
    test('returns authenticated on success', () async {
      final user = buildMockUser(displayName: 'Тэмүүлэн');
      final response = MockAuthResponse();
      when(() => response.user).thenReturn(user);

      when(
        () => mockAuth.signUp(
          email: any(named: 'email'),
          password: any(named: 'password'),
          data: any(named: 'data'),
        ),
      ).thenAnswer((_) async => response);

      final result = await repository.signUpWithEmail(
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Тэмүүлэн',
      );

      expect(result.isSuccess, isTrue);
      expect(result.value.isAuthenticated, isTrue);
      expect(result.value.displayName, 'Тэмүүлэн');
    });

    test('returns failure when user is null', () async {
      final response = MockAuthResponse();
      when(() => response.user).thenReturn(null);

      when(
        () => mockAuth.signUp(
          email: any(named: 'email'),
          password: any(named: 'password'),
          data: any(named: 'data'),
        ),
      ).thenAnswer((_) async => response);

      final result = await repository.signUpWithEmail(
        email: 'test@example.com',
        password: 'password123',
      );

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SIGNUP_FAILED');
    });

    test('wraps AuthException on error', () async {
      when(
        () => mockAuth.signUp(
          email: any(named: 'email'),
          password: any(named: 'password'),
          data: any(named: 'data'),
        ),
      ).thenThrow(AuthException('User already registered'));

      final result = await repository.signUpWithEmail(
        email: 'test@example.com',
        password: 'password123',
      );

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'AUTH_ERROR');
      expect(result.error.message, 'User already registered');
    });
  });

  group('signInWithEmail', () {
    test('returns authenticated on success', () async {
      final user = buildMockUser();
      final response = MockAuthResponse();
      when(() => response.user).thenReturn(user);

      when(
        () => mockAuth.signInWithPassword(
          email: any(named: 'email'),
          password: any(named: 'password'),
        ),
      ).thenAnswer((_) async => response);

      final result = await repository.signInWithEmail(
        email: 'test@example.com',
        password: 'password123',
      );

      expect(result.isSuccess, isTrue);
      expect(result.value.isAuthenticated, isTrue);
      expect(result.value.userId, 'user-123');
    });

    test('returns failure when credentials are invalid', () async {
      when(
        () => mockAuth.signInWithPassword(
          email: any(named: 'email'),
          password: any(named: 'password'),
        ),
      ).thenThrow(AuthException('Invalid login credentials'));

      final result = await repository.signInWithEmail(
        email: 'wrong@example.com',
        password: 'wrongpassword',
      );

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'AUTH_ERROR');
    });

    test('returns failure when response user is null', () async {
      final response = MockAuthResponse();
      when(() => response.user).thenReturn(null);

      when(
        () => mockAuth.signInWithPassword(
          email: any(named: 'email'),
          password: any(named: 'password'),
        ),
      ).thenAnswer((_) async => response);

      final result = await repository.signInWithEmail(
        email: 'test@example.com',
        password: 'password123',
      );

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SIGNIN_FAILED');
    });
  });

  group('signInWithPhone', () {
    test('returns loading after OTP is sent', () async {
      when(
        () => mockAuth.signInWithOtp(phone: any(named: 'phone')),
      ).thenAnswer((_) async {});

      final result = await repository.signInWithPhone(phone: '+97699112233');

      expect(result.isSuccess, isTrue);
      expect(result.value.status, AuthStatus.loading);
    });

    test('wraps error on failure', () async {
      when(
        () => mockAuth.signInWithOtp(phone: any(named: 'phone')),
      ).thenThrow(AuthException('Invalid phone number'));

      final result = await repository.signInWithPhone(phone: 'invalid');

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'AUTH_ERROR');
    });
  });

  group('verifyPhoneOtp', () {
    test('returns authenticated on successful verification', () async {
      final user = buildMockUser(phone: '+97699112233');
      final response = MockAuthResponse();
      when(() => response.user).thenReturn(user);

      when(
        () => mockAuth.verifyOTP(
          phone: any(named: 'phone'),
          token: any(named: 'token'),
          type: any(named: 'type'),
        ),
      ).thenAnswer((_) async => response);

      final result = await repository.verifyPhoneOtp(
        phone: '+97699112233',
        token: '123456',
      );

      expect(result.isSuccess, isTrue);
      expect(result.value.isAuthenticated, isTrue);
      expect(result.value.phone, '+97699112233');
    });

    test('returns failure on invalid OTP', () async {
      when(
        () => mockAuth.verifyOTP(
          phone: any(named: 'phone'),
          token: any(named: 'token'),
          type: any(named: 'type'),
        ),
      ).thenThrow(AuthException('Token has expired or is invalid'));

      final result = await repository.verifyPhoneOtp(
        phone: '+97699112233',
        token: '000000',
      );

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'AUTH_ERROR');
    });
  });

  group('signInAnonymously', () {
    test('returns authenticated with anonymous flag', () async {
      final user = buildMockUser(id: 'anon-1', isAnonymous: true);
      final response = MockAuthResponse();
      when(() => response.user).thenReturn(user);

      when(
        () => mockAuth.signInAnonymously(),
      ).thenAnswer((_) async => response);

      final result = await repository.signInAnonymously();

      expect(result.isSuccess, isTrue);
      expect(result.value.isAuthenticated, isTrue);
      expect(result.value.isAnonymous, isTrue);
    });

    test('wraps error on failure', () async {
      when(
        () => mockAuth.signInAnonymously(),
      ).thenThrow(AuthException('Anonymous sign in not enabled'));

      final result = await repository.signInAnonymously();

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'AUTH_ERROR');
    });
  });

  group('signOut', () {
    test('calls auth.signOut and completes without error', () async {
      when(() => mockAuth.signOut()).thenAnswer((_) async {});

      await repository.signOut();

      verify(() => mockAuth.signOut()).called(1);
    });

    test('completes even if signOut throws', () async {
      when(() => mockAuth.signOut()).thenThrow(Exception('network error'));

      // Should not throw -- signOut swallows errors
      await repository.signOut();
    });
  });

  // ── Session Expiry Tests ─────────────────────────────────────────────

  group('sessionExpired', () {
    late StreamController<gotrue.AuthState> authStateController;

    setUp(() {
      authStateController = StreamController<gotrue.AuthState>.broadcast();
      when(
        () => mockAuth.onAuthStateChange,
      ).thenAnswer((_) => authStateController.stream);
      // Ensure getCurrentUser stack doesn't interfere
      when(() => mockAuth.currentSession).thenReturn(null);
      when(() => mockAuth.currentUser).thenReturn(null);
    });

    tearDown(() async {
      await authStateController.close();
    });

    test('sessionExpired fires when signedOut is not user-initiated', () async {
      final expiredEvents = <void>[];
      final sub = repository.sessionExpired.listen(
        (_) => expiredEvents.add(null),
      );

      // Must subscribe to authStateChanges to trigger the stream processing
      final authSub = repository.authStateChanges.listen((_) {});

      // Emit signedOut without calling signOut first — simulates session expiry
      authStateController.add(
        gotrue.AuthState(AuthChangeEvent.signedOut, null),
      );

      // Allow stream to process
      await Future<void>.delayed(Duration.zero);
      await Future<void>.delayed(Duration.zero);

      expect(
        expiredEvents.length,
        1,
        reason:
            'sessionExpired should emit when signedOut is not user-initiated',
      );

      await sub.cancel();
      await authSub.cancel();
    });

    test(
      'sessionExpired does not fire when signOut was called first',
      () async {
        final expiredEvents = <void>[];
        final sub = repository.sessionExpired.listen(
          (_) => expiredEvents.add(null),
        );

        // Must subscribe to authStateChanges to trigger the stream processing
        final authSub = repository.authStateChanges.listen((_) {});

        // First call signOut — sets _isUserInitiatedSignOut = true
        when(() => mockAuth.signOut()).thenAnswer((_) async {});
        await repository.signOut();

        // Then emit signedOut on the stream
        authStateController.add(
          gotrue.AuthState(AuthChangeEvent.signedOut, null),
        );

        // Allow stream to process
        await Future<void>.delayed(Duration.zero);
        await Future<void>.delayed(Duration.zero);

        expect(
          expiredEvents.length,
          0,
          reason:
              'sessionExpired should NOT emit when signOut was user-initiated',
        );

        await sub.cancel();
        await authSub.cancel();
      },
    );

    test(
      'authStateChanges emits unauthenticated on signedOut regardless',
      () async {
        final authStates = <AuthState>[];
        final authSub = repository.authStateChanges.listen(
          (s) => authStates.add(s),
        );

        // Emit signedOut without calling signOut
        authStateController.add(
          gotrue.AuthState(AuthChangeEvent.signedOut, null),
        );

        // Allow stream to process
        await Future<void>.delayed(Duration.zero);
        await Future<void>.delayed(Duration.zero);

        expect(authStates.length, 1);
        expect(authStates[0].status, AuthStatus.unauthenticated);

        await authSub.cancel();
      },
    );

    test('sessionExpired does not fire on non-signOut events', () async {
      final expiredEvents = <void>[];
      final sub = repository.sessionExpired.listen(
        (_) => expiredEvents.add(null),
      );

      // Must subscribe to authStateChanges to trigger the stream processing
      final authSub = repository.authStateChanges.listen((_) {});

      // Emit a signedIn event — should NOT trigger sessionExpired
      final user = buildMockUser();
      final session = MockSession();
      when(() => session.user).thenReturn(user);
      authStateController.add(
        gotrue.AuthState(AuthChangeEvent.signedIn, session),
      );

      // Allow stream to process
      await Future<void>.delayed(Duration.zero);
      await Future<void>.delayed(Duration.zero);

      expect(
        expiredEvents.length,
        0,
        reason: 'sessionExpired should NOT emit on SIGNED_IN events',
      );

      await sub.cancel();
      await authSub.cancel();
    });
  });
}
