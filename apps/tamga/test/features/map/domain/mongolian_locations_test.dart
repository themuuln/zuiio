import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/map/domain/mongolian_locations.dart';

void main() {
  group('kAimagList', () {
    test('has 22 entries (21 aimags + Улаанбаатар)', () {
      expect(kAimagList.length, 22,
          reason: 'Must have 21 aimags + Улаанбаатар = 22 entries');
    });

    test('contains no duplicates', () {
      final unique = kAimagList.toSet();
      expect(unique.length, kAimagList.length);
    });

    test('contains Улаанбаатар', () {
      expect(kAimagList, contains('Улаанбаатар'));
    });

    test('contains key aimags', () {
      // Spot-check some important aimags
      expect(kAimagList, contains('Архангай'));
      expect(kAimagList, contains('Ховд'));
      expect(kAimagList, contains('Дорнод'));
      expect(kAimagList, contains('Өмнөговь'));
      expect(kAimagList, contains('Сүхбаатар'));
    });

    test('all entries are non-empty', () {
      for (final aimag in kAimagList) {
        expect(aimag.trim().isNotEmpty, isTrue,
            reason: 'Aimag should not be empty');
      }
    });
  });
}
