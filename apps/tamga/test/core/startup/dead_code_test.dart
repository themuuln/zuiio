import 'dart:io';
import 'package:flutter_test/flutter_test.dart';

/// Returns the first line in [roots] that references [fileName] by its bare
/// basename (covers relative and package imports alike), or null.
String? _findImportSite(String fileName, List<String> roots) {
  for (final root in roots) {
    final dir = Directory(root);
    if (!dir.existsSync()) continue;
    for (final entity in dir.listSync(recursive: true)) {
      if (entity is! File || !entity.path.endsWith('.dart')) continue;
      final content = entity.readAsStringSync();
      if (content.contains("'$fileName'") || content.contains('"$fileName"')) {
        return entity.path;
      }
    }
  }
  return null;
}

void main() {
  group('Theme files exist and are referenced', () {
    test('app_theme.dart exists and is imported by the codebase', () {
      final file = File('lib/src/app/theme/app_theme.dart');
      expect(
        file.existsSync(),
        isTrue,
        reason:
            'app_theme.dart is the restored iOS-minimal theme builder; '
            'deleting it would break every consumer below.',
      );

      // Existence alone is not enough — the file must have at least one real
      // import site so it cannot silently rot as dead code.
      final site = _findImportSite('app_theme.dart', ['lib', 'test']);
      expect(
        site,
        isNotNull,
        reason:
            'app_theme.dart exists but is referenced nowhere — it is dead '
            'code and should be deleted instead of kept.',
      );
    });

    test('app_components.dart exists and is imported by app_theme.dart', () {
      final file = File('lib/src/app/theme/app_components.dart');
      expect(
        file.existsSync(),
        isTrue,
        reason:
            'app_components.dart provides the Material component themes used '
            'by app_theme.dart.',
      );

      final site = _findImportSite('app_components.dart', ['lib']);
      expect(
        site,
        isNotNull,
        reason:
            'app_components.dart exists but is referenced nowhere — it is '
            'dead code and should be deleted instead of kept.',
      );
    });
  });
}
