import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/updater/domain/app_version.dart';

void main() {
  group('AppVersion', () {
    test('constructor creates instance with all fields', () {
      const version = AppVersion(
        versionCode: 2,
        versionName: '1.0.1',
        storagePath: 'apps/tamga_1_0_1.apk',
        sha256Hash: 'abc123',
        changelog: 'Fixed bugs',
        forceUpdate: true,
      );

      expect(version.versionCode, 2);
      expect(version.versionName, '1.0.1');
      expect(version.storagePath, 'apps/tamga_1_0_1.apk');
      expect(version.sha256Hash, 'abc123');
      expect(version.changelog, 'Fixed bugs');
      expect(version.forceUpdate, isTrue);
    });

    test('constructor uses defaults for optional fields', () {
      const version = AppVersion(
        versionCode: 1,
        versionName: '1.0.0',
        storagePath: 'apps/tamga_1_0_0.apk',
        sha256Hash: 'def456',
      );

      expect(version.changelog, '');
      expect(version.forceUpdate, isFalse);
    });

    test('fromJson parses all fields correctly', () {
      final json = {
        'version_code': 3,
        'version_name': '1.0.2',
        'storage_path': 'apps/tamga_1_0_2.apk',
        'sha256_hash': 'xyz789',
        'changelog': 'Performance improvements',
        'force_update': true,
      };

      final version = AppVersion.fromJson(json);

      expect(version.versionCode, 3);
      expect(version.versionName, '1.0.2');
      expect(version.storagePath, 'apps/tamga_1_0_2.apk');
      expect(version.sha256Hash, 'xyz789');
      expect(version.changelog, 'Performance improvements');
      expect(version.forceUpdate, isTrue);
    });

    test('fromJson uses defaults when optional fields are missing', () {
      final json = {
        'version_code': 1,
        'version_name': '1.0.0',
        'storage_path': 'apps/tamga_1_0_0.apk',
        'sha256_hash': 'abc',
      };

      final version = AppVersion.fromJson(json);

      expect(version.changelog, '');
      expect(version.forceUpdate, isFalse);
    });

    test('fromJson handles null optional fields', () {
      final json = {
        'version_code': 1,
        'version_name': '1.0.0',
        'storage_path': 'apps/tamga_1_0_0.apk',
        'sha256_hash': 'abc',
        'changelog': null,
        'force_update': null,
      };

      final version = AppVersion.fromJson(json);

      expect(version.changelog, '');
      expect(version.forceUpdate, isFalse);
    });

    test('equality works correctly', () {
      const a = AppVersion(
        versionCode: 1,
        versionName: '1.0.0',
        storagePath: 'apps/tamga.apk',
        sha256Hash: 'abc',
      );
      const b = AppVersion(
        versionCode: 1,
        versionName: '1.0.0',
        storagePath: 'apps/tamga.apk',
        sha256Hash: 'abc',
      );
      const c = AppVersion(
        versionCode: 2,
        versionName: '2.0.0',
        storagePath: 'apps/tamga2.apk',
        sha256Hash: 'def',
      );

      expect(a, equals(b));
      expect(a, isNot(equals(c)));
    });

    test('toString includes key fields', () {
      const version = AppVersion(
        versionCode: 1,
        versionName: '1.0.0',
        storagePath: 'apps/tamga.apk',
        sha256Hash: 'abc',
      );

      final str = version.toString();
      expect(str, contains('1'));
      expect(str, contains('1.0.0'));
    });
  });
}
