import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/auth/application/auth_providers.dart';
import 'package:tamga/src/features/auth/domain/auth_state.dart';

void main() {
  group('initialAuthStateProvider', () {
    test('default value is null', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final result = container.read(initialAuthStateProvider);

      expect(result, isNull);
    });

    test('can be overridden with authenticated state', () {
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

    test('can be overridden with null', () {
      final container = ProviderContainer(
        overrides: [initialAuthStateProvider.overrideWithValue(null)],
      );
      addTearDown(container.dispose);

      final result = container.read(initialAuthStateProvider);

      expect(result, isNull);
    });

    test('preloaded value survives across reads', () {
      final preloaded = const AuthState.authenticated(
        userId: 'persistent-user',
      );

      final container = ProviderContainer(
        overrides: [initialAuthStateProvider.overrideWithValue(preloaded)],
      );
      addTearDown(container.dispose);

      // Read multiple times — value must be stable
      expect(container.read(initialAuthStateProvider), preloaded);
      expect(container.read(initialAuthStateProvider), preloaded);
      expect(
        container.read(initialAuthStateProvider).hashCode,
        preloaded.hashCode,
      );
    });

    test('preloaded unauthenticated state is preserved', () {
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
      expect(result.userId, isNull);
    });
  });
}
