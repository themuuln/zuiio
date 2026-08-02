import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/app/app_config.dart';

void main() {
  group('parseDotEnv', () {
    test(
      'parses comments, whitespace, quotes, and values containing equals',
      () {
        final values = parseDotEnv('''
# comment
 SUPABASE_URL = "https://example.supabase.co"
SUPABASE_PUBLISHABLE_KEY=sb_publishable_test==
''');

        expect(values, {
          'SUPABASE_URL': 'https://example.supabase.co',
          'SUPABASE_PUBLISHABLE_KEY': 'sb_publishable_test==',
        });
      },
    );

    test('ignores blank and malformed lines', () {
      final values = parseDotEnv('''

not-an-assignment
=missing-key
SUPABASE_URL=https://example.supabase.co
''');

      expect(values, {'SUPABASE_URL': 'https://example.supabase.co'});
    });
  });
}
