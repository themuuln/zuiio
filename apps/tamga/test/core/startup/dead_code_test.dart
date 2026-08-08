import 'dart:io';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Dead code removal', () {
    test('app_theme.dart was deleted', () {
      final file = File('lib/src/app/theme/app_theme.dart');
      expect(
        file.existsSync(),
        isFalse,
        reason:
            'app_theme.dart was dead code (imported GoogleFonts, '
            'never used by any live code path). Delete it permanently.',
      );
    });

    test('app_components.dart was deleted', () {
      final file = File('lib/src/app/theme/app_components.dart');
      expect(
        file.existsSync(),
        isFalse,
        reason:
            'app_components.dart was only referenced by the now-deleted '
            'app_theme.dart. If it has other consumers, re-add the import.',
      );
    });
  });
}
