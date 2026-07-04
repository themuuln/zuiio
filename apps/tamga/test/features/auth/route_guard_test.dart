import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/auth/domain/auth_state.dart';
import 'package:tamga/src/app/router/app_router.dart';

void main() {
  group('authGuardRedirect', () {
    // ── Loading state ──
    group('when auth is loading', () {
      test('returns null for protected route (/lineage)', () {
        const authState = AuthState.loading();
        expect(authGuardRedirect(authState, '/lineage'), isNull);
      });

      test('returns null for auth route (/login)', () {
        const authState = AuthState.loading();
        expect(authGuardRedirect(authState, '/login'), isNull);
      });

      test('returns null for public route (/onboarding)', () {
        const authState = AuthState.loading();
        expect(authGuardRedirect(authState, '/onboarding'), isNull);
      });
    });

    // ── Unauthenticated state ──
    group('when user is unauthenticated', () {
      const unauth = AuthState.unauthenticated();

      test('redirects protected route /lineage to /login', () {
        expect(authGuardRedirect(unauth, '/lineage'), '/login');
      });

      test('redirects protected route /market to /login', () {
        expect(authGuardRedirect(unauth, '/market'), '/login');
      });

      test('redirects protected route /events to /login', () {
        expect(authGuardRedirect(unauth, '/events'), '/login');
      });

      test('redirects protected route /lost-horse to /login', () {
        expect(authGuardRedirect(unauth, '/lost-horse'), '/login');
      });

      test('redirects protected route /profile to /login', () {
        expect(authGuardRedirect(unauth, '/profile'), '/login');
      });

      test('redirects protected route /search to /login', () {
        expect(authGuardRedirect(unauth, '/search'), '/login');
      });

      test('redirects protected route /stable to /login', () {
        expect(authGuardRedirect(unauth, '/stable'), '/login');
      });

      test('redirects protected route /breeding to /login', () {
        expect(authGuardRedirect(unauth, '/breeding'), '/login');
      });

      test('allows public route /certificates/verify', () {
        expect(authGuardRedirect(unauth, '/certificates/verify'), isNull);
      });

      test('allows public route /login', () {
        expect(authGuardRedirect(unauth, '/login'), isNull);
      });

      test('allows public route /register', () {
        expect(authGuardRedirect(unauth, '/register'), isNull);
      });

      test('allows public route /phone-login', () {
        expect(authGuardRedirect(unauth, '/phone-login'), isNull);
      });

      test('allows public route /phone-verify', () {
        expect(authGuardRedirect(unauth, '/phone-verify'), isNull);
      });

      test('allows public route /onboarding', () {
        expect(authGuardRedirect(unauth, '/onboarding'), isNull);
      });
    });

    // ── Authenticated state ──
    group('when user is authenticated', () {
      const auth = AuthState.authenticated(userId: 'user-1');

      test('redirects /login to /lineage', () {
        expect(authGuardRedirect(auth, '/login'), '/lineage');
      });

      test('redirects /register to /lineage', () {
        expect(authGuardRedirect(auth, '/register'), '/lineage');
      });

      test('allows /lineage (stays)', () {
        expect(authGuardRedirect(auth, '/lineage'), isNull);
      });

      test('allows /market', () {
        expect(authGuardRedirect(auth, '/market'), isNull);
      });

      test('allows /events', () {
        expect(authGuardRedirect(auth, '/events'), isNull);
      });

      test('allows /lost-horse', () {
        expect(authGuardRedirect(auth, '/lost-horse'), isNull);
      });

      test('allows /profile', () {
        expect(authGuardRedirect(auth, '/profile'), isNull);
      });

      test('allows /onboarding (public route)', () {
        expect(authGuardRedirect(auth, '/onboarding'), isNull);
      });

      test('allows /phone-login (public route)', () {
        expect(authGuardRedirect(auth, '/phone-login'), isNull);
      });
    });

    // ── Anonymous (isAnonymous) state ──
    group('when user is authenticated but anonymous', () {
      const anon = AuthState.authenticated(userId: 'anon-1', isAnonymous: true);

      test('allows protected route /lineage (no crash)', () {
        expect(authGuardRedirect(anon, '/lineage'), isNull);
      });

      test('allows protected route /market', () {
        expect(authGuardRedirect(anon, '/market'), isNull);
      });

      test('allows protected route /events', () {
        expect(authGuardRedirect(anon, '/events'), isNull);
      });

      test('allows protected route /lost-horse', () {
        expect(authGuardRedirect(anon, '/lost-horse'), isNull);
      });

      test('allows protected route /profile', () {
        expect(authGuardRedirect(anon, '/profile'), isNull);
      });

      test('redirects /login to /lineage', () {
        expect(authGuardRedirect(anon, '/login'), '/lineage');
      });

      test('redirects /register to /lineage', () {
        expect(authGuardRedirect(anon, '/register'), '/lineage');
      });
    });

    // ── Null auth state (before provider resolves) ──
    group('when auth state is null', () {
      test('returns null for any route', () {
        expect(authGuardRedirect(null, '/lineage'), isNull);
        expect(authGuardRedirect(null, '/login'), isNull);
        expect(authGuardRedirect(null, '/market'), isNull);
      });
    });
  });
}
