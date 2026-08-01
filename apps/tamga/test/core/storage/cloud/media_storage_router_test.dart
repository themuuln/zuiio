import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/storage/cloud/media_storage_router.dart';

void main() {
  group('MediaStorageRouter', () {
    // ── Path generators ─────────────────────────────────────────────

    group('lostHorsePhotoPath', () {
      test('returns an owner-scoped path matching the expected pattern', () {
        final path = MediaStorageRouter.lostHorsePhotoPath(
          reportId: 'report-123',
          userId: 'user-456',
        );

        // Private bucket path: {userId}/{reportId}/{uuid}.jpg
        expect(path, startsWith('user-456/report-123/'));
        expect(path, endsWith('.jpg'));

        final segments = path.split('/');
        expect(segments.length, 3);
        expect(segments[0], 'user-456');
        expect(segments[1], 'report-123');

        final filename = segments[2];
        expect(filename, endsWith('.jpg'));
        expect(filename.length, greaterThan(30));
      });

      test('supports custom extension', () {
        final path = MediaStorageRouter.lostHorsePhotoPath(
          reportId: 'report-456',
          userId: 'user-789',
          extension: 'png',
        );

        expect(path, startsWith('user-789/report-456/'));
        expect(path, endsWith('.png'));
      });

      test('produces unique paths on successive calls', () {
        final path1 = MediaStorageRouter.lostHorsePhotoPath(
          reportId: 'report-1',
          userId: 'user-1',
        );
        final path2 = MediaStorageRouter.lostHorsePhotoPath(
          reportId: 'report-1',
          userId: 'user-1',
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
