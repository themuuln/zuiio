import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/auth/application/auth_providers.dart';
import 'package:tamga/src/features/auth/domain/auth_state.dart';

void main() {
  group('initialAuthStateProvider', () {
    test('default is null (splash screen shows in normal flow)', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final result = container.read(initialAuthStateProvider);
      expect(result, isNull);
    });

    test('authenticated state overrides correctly', () {
      final container = ProviderContainer(
        overrides: [
          initialAuthStateProvider.overrideWithValue(
            const AuthState.authenticated(
              userId: 'test-user-1',
              email: 'test@example.com',
            ),
          ),
        ],
      );
      addTearDown(container.dispose);

      final result = container.read(initialAuthStateProvider);
      expect(result, isNotNull);
      expect(result!.isAuthenticated, isTrue);
      expect(result.userId, 'test-user-1');
      expect(result.email, 'test@example.com');
    });

    test('unauthenticated state overrides correctly', () {
      final container = ProviderContainer(
        overrides: [
          initialAuthStateProvider.overrideWithValue(
            const AuthState.unauthenticated(),
          ),
        ],
      );
      addTearDown(container.dispose);

      final result = container.read(initialAuthStateProvider);
      expect(result, isNotNull);
      expect(result!.isUnauthenticated, isTrue);
    });

    test('preserves all AuthState fields when overridden', () {
      const auth = AuthState.authenticated(
        userId: 'horse-owner-42',
        email: 'owner@horses.mn',
        displayName: 'Тэлмүүлэн',
        isAnonymous: false,
      );

      final container = ProviderContainer(
        overrides: [initialAuthStateProvider.overrideWithValue(auth)],
      );
      addTearDown(container.dispose);

      final result = container.read(initialAuthStateProvider);
      expect(result!.userId, 'horse-owner-42');
      expect(result.email, 'owner@horses.mn');
      expect(result.displayName, 'Тэлмүүлэн');
      expect(result.isAnonymous, isFalse);
    });

    test('can be overridden with null to skip preloading', () {
      final container = ProviderContainer(
        overrides: [initialAuthStateProvider.overrideWithValue(null)],
      );
      addTearDown(container.dispose);

      final result = container.read(initialAuthStateProvider);
      expect(result, isNull);
    });

    test('value is stable across multiple reads', () {
      const auth = AuthState.authenticated(userId: 'stable-user');

      final container = ProviderContainer(
        overrides: [initialAuthStateProvider.overrideWithValue(auth)],
      );
      addTearDown(container.dispose);

      expect(container.read(initialAuthStateProvider), same(auth));
      expect(container.read(initialAuthStateProvider), same(auth));
    });
  });
}
