import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/storage/cloud/media_storage_router.dart';

void main() {
  group('MediaStorageRouter', () {
    // ── Path generators ─────────────────────────────────────────────

    group('lostHorsePhotoPath', () {
      test('returns path matching expected pattern', () {
        final path = MediaStorageRouter.lostHorsePhotoPath(
          reportId: 'report-123',
        );

        // Pattern: lost-horse-photos/{reportId}/{uuid}.jpg
        expect(path, startsWith('lost-horse-photos/report-123/'));
        expect(path, endsWith('.jpg'));

        // Should contain a UUID-like segment (8-4-4-? format)
        final segments = path.split('/');
        expect(segments.length, 3);
        expect(segments[0], 'lost-horse-photos');
        expect(segments[1], 'report-123');

        // The third segment should be {uuid}.jpg
        final filename = segments[2];
        expect(filename, endsWith('.jpg'));
        expect(
          filename.length,
          greaterThan(30),
          reason: 'Filename should contain uuid-like string + extension',
        );
      });

      test('supports custom extension', () {
        final path = MediaStorageRouter.lostHorsePhotoPath(
          reportId: 'report-456',
          extension: 'png',
        );

        expect(path, startsWith('lost-horse-photos/report-456/'));
        expect(path, endsWith('.png'));
      });

      test('produces unique paths on successive calls', () {
        final path1 = MediaStorageRouter.lostHorsePhotoPath(
          reportId: 'report-1',
        );
        final path2 = MediaStorageRouter.lostHorsePhotoPath(
          reportId: 'report-1',
        );

        expect(
          path1,
          isNot(equals(path2)),
          reason: 'Each call should generate a unique UUID',
        );
      });
    });

    // ── Existing path generators (smoke tests) ──────────────────────

    group('existing path generators', () {
      test('horsePhotoPath returns expected pattern', () {
        final path = MediaStorageRouter.horsePhotoPath(
          horseId: 'h1',
          userId: 'u1',
        );

        expect(path, startsWith('horse-photos/u1/h1/'));
        expect(path, endsWith('.jpg'));
      });

      test('marketPhotoPath returns expected pattern', () {
        final path = MediaStorageRouter.marketPhotoPath(userId: 'u1');

        expect(path, startsWith('horse-photos/u1/market/'));
        expect(path, endsWith('.jpg'));
      });
    });
  });
}
