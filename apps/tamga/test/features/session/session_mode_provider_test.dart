import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:tamga/src/features/session/application/session_mode_provider.dart';

void main() {
  group('sessionModeProvider', () {
    test('returns guestLocal as default session mode', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final mode = container.read(sessionModeProvider);
      expect(mode, SessionMode.guestLocal);
    });

    test('SessionMode enum has exactly one value', () {
      expect(SessionMode.values.length, 1);
      expect(SessionMode.values, contains(SessionMode.guestLocal));
    });
  });
}
