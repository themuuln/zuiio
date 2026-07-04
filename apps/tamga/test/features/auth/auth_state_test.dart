import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/auth/domain/auth_state.dart';

void main() {
  group('AuthState', () {
    group('constructors', () {
      test('unauthenticated creates state with unauthenticated status', () {
        const state = AuthState.unauthenticated();

        expect(state.status, AuthStatus.unauthenticated);
        expect(state.userId, isNull);
        expect(state.email, isNull);
        expect(state.phone, isNull);
        expect(state.displayName, isNull);
        expect(state.isAnonymous, isFalse);
      });

      test('loading creates state with loading status', () {
        const state = AuthState.loading();

        expect(state.status, AuthStatus.loading);
        expect(state.userId, isNull);
        expect(state.email, isNull);
      });

      test('authenticated creates state with all fields', () {
        const state = AuthState.authenticated(
          userId: 'user-123',
          email: 'test@example.com',
          phone: '+97699112233',
          displayName: 'Тэмүүлэн',
        );

        expect(state.status, AuthStatus.authenticated);
        expect(state.userId, 'user-123');
        expect(state.email, 'test@example.com');
        expect(state.phone, '+97699112233');
        expect(state.displayName, 'Тэмүүлэн');
        expect(state.isAnonymous, isFalse);
      });

      test('authenticated with anonymous flag', () {
        const state = AuthState.authenticated(
          userId: 'anon-1',
          isAnonymous: true,
        );

        expect(state.isAnonymous, isTrue);
        expect(state.isAuthenticated, isTrue);
      });
    });

    group('status getters', () {
      test('isAuthenticated returns true only for authenticated state', () {
        const auth = AuthState.authenticated(userId: 'u1');
        const unauth = AuthState.unauthenticated();
        const loading = AuthState.loading();

        expect(auth.isAuthenticated, isTrue);
        expect(unauth.isAuthenticated, isFalse);
        expect(loading.isAuthenticated, isFalse);
      });

      test('isUnauthenticated returns true only for unauthenticated state', () {
        const auth = AuthState.authenticated(userId: 'u1');
        const unauth = AuthState.unauthenticated();
        const loading = AuthState.loading();

        expect(auth.isUnauthenticated, isFalse);
        expect(unauth.isUnauthenticated, isTrue);
        expect(loading.isUnauthenticated, isFalse);
      });

      test('isLoading returns true only for loading state', () {
        const auth = AuthState.authenticated(userId: 'u1');
        const unauth = AuthState.unauthenticated();
        const loading = AuthState.loading();

        expect(auth.isLoading, isFalse);
        expect(unauth.isLoading, isFalse);
        expect(loading.isLoading, isTrue);
      });
    });

    group('field getters', () {
      test('hasEmail returns true when email is non-empty', () {
        const withEmail = AuthState.authenticated(
          userId: 'u1',
          email: 'test@example.com',
        );
        const emptyEmail = AuthState.authenticated(userId: 'u1', email: '');
        const noEmail = AuthState.authenticated(userId: 'u1');

        expect(withEmail.hasEmail, isTrue);
        expect(emptyEmail.hasEmail, isFalse);
        expect(noEmail.hasEmail, isFalse);
      });

      test('hasPhone returns true when phone is non-empty', () {
        const withPhone = AuthState.authenticated(
          userId: 'u1',
          phone: '+97699112233',
        );
        const emptyPhone = AuthState.authenticated(userId: 'u1', phone: '');
        const noPhone = AuthState.authenticated(userId: 'u1');

        expect(withPhone.hasPhone, isTrue);
        expect(emptyPhone.hasPhone, isFalse);
        expect(noPhone.hasPhone, isFalse);
      });
    });

    group('equality', () {
      test('two AuthStates with same fields are equal', () {
        const s1 = AuthState.authenticated(
          userId: 'u1',
          email: 'a@b.com',
          displayName: 'Name',
        );
        const s2 = AuthState.authenticated(
          userId: 'u1',
          email: 'a@b.com',
          displayName: 'Name',
        );

        expect(s1, equals(s2));
        expect(s1.hashCode, s2.hashCode);
      });

      test('two AuthStates with different fields are not equal', () {
        const s1 = AuthState.authenticated(userId: 'u1');
        const s2 = AuthState.authenticated(userId: 'u2');

        expect(s1, isNot(equals(s2)));
      });

      test('authenticated and unauthenticated are not equal', () {
        const s1 = AuthState.authenticated(userId: 'u1');
        const s2 = AuthState.unauthenticated();

        expect(s1, isNot(equals(s2)));
      });
    });

    group('toString', () {
      test('includes key fields', () {
        const state = AuthState.authenticated(userId: 'u1', email: 'a@b.com');

        final str = state.toString();
        expect(str, contains('authenticated'));
        expect(str, contains('u1'));
        expect(str, contains('a@b.com'));
      });
    });
  });
}
