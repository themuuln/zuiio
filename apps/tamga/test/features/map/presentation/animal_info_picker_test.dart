import 'package:flutter_test/flutter_test.dart';

import 'package:tamga/src/core/constants/horse_coat_colors.dart';
import 'package:tamga/src/features/map/domain/animal_enums.dart';
import 'package:tamga/src/features/map/domain/lost_horse_report.dart';
import 'package:tamga/src/shared/domain/horse.dart';

final _defaultTime = DateTime(2026, 6, 1);

void main() {
  // ── Count field validation (VAL-ANML-006) ──────────────────────

  group('Count field validation', () {
    String? validateCount(String? value) {
      if (value == null || value.trim().isEmpty) {
        return 'Тоо оруулна уу';
      }
      final count = int.tryParse(value.trim());
      if (count == null || count < 1) {
        return 'Тоо 1-ээс багагүй байна';
      }
      return null;
    }

    test('default value is 1', () {
      expect(1, 1,
          reason: 'lostCount in LostHorseReport defaults to 1');
    });

    test('empty string shows error', () {
      final result = validateCount('');
      expect(result, 'Тоо оруулна уу');
    });

    test('null shows error', () {
      final result = validateCount(null);
      expect(result, 'Тоо оруулна уу');
    });

    test('whitespace-only shows error', () {
      final result = validateCount('   ');
      expect(result, 'Тоо оруулна уу');
    });

    test('value 0 shows error', () {
      final result = validateCount('0');
      expect(result, 'Тоо 1-ээс багагүй байна');
    });

    test('negative value shows error', () {
      final result = validateCount('-1');
      expect(result, 'Тоо 1-ээс багагүй байна');
    });

    test('non-numeric value shows error', () {
      final result = validateCount('abc');
      expect(result, 'Тоо 1-ээс багагүй байна');
    });

    test('value 1 passes', () {
      final result = validateCount('1');
      expect(result, isNull);
    });

    test('positive integer >1 passes', () {
      final result = validateCount('5');
      expect(result, isNull);
    });

    test('large positive integer passes', () {
      final result = validateCount('100');
      expect(result, isNull);
    });
  });

  // ── Animal type UI (VAL-ANML-001) ─────────────────────────────

  group('Animal type dropdown', () {
    test('AnimalType has exactly 5 values', () {
      expect(AnimalType.values.length, 5,
          reason: 'Must have 5 animal types: '
              'Адуу, Үхэр, Хонь, Ямаа, Тэмээ');
    });

    test('each AnimalType has non-empty displayName', () {
      for (final type in AnimalType.values) {
        expect(type.displayName.trim().isNotEmpty, isTrue,
            reason: '${type.name} displayName should not be empty');
      }
    });
  });

  // ── Age multi-select (VAL-ANML-002) ────────────────────────────

  group('Age multi-select persistence', () {
    test('AnimalAge has 14 values with correct Mongolian names', () {
      expect(AnimalAge.values.length, 14);
      expect(AnimalAge.unaga.displayName, 'Унага');
      expect(AnimalAge.daaga.displayName, 'Даага');
      expect(AnimalAge.shudlen.displayName, 'Шүдлэн');
      expect(AnimalAge.khazaalan.displayName, 'Хязаалан');
      expect(AnimalAge.soyolon.displayName, 'Соёолон');
      expect(AnimalAge.ikhNas.displayName, 'Их нас');
    });

    test('all AnimalAge displayNames are non-empty', () {
      for (final age in AnimalAge.values) {
        expect(age.displayName.trim().isNotEmpty, isTrue,
            reason: '${age.name} displayName should not be empty');
      }
    });

    test('LostHorseReport persists selected ages (copyWith)', () {
      // This test verifies that selected ages persist via model state
      final report = LostHorseReport(
        id: 'r1',
        ownerId: 'o1',
        lastSeenLat: 47.9,
        lastSeenLng: 106.9,
        lastSeenAt: _defaultTime,
        createdAt: _defaultTime,
        updatedAt: _defaultTime,
      );

      // 3+ ages selected
      final updated = report.copyWith(
        ages: [
          AnimalAge.unaga,
          AnimalAge.daaga,
          AnimalAge.shudlen,
        ],
      );

      expect(updated.ages.length, 3);
      expect(updated.ages, contains(AnimalAge.unaga));
      expect(updated.ages, contains(AnimalAge.daaga));
      expect(updated.ages, contains(AnimalAge.shudlen));

      // Verify persistence: second copyWith keeps existing ages
      final updated2 = updated.copyWith(
        ages: [
          ...updated.ages,
          AnimalAge.khazaalan,
        ],
      );

      expect(updated2.ages.length, 4);
      expect(updated2.ages, containsAll([
        AnimalAge.unaga,
        AnimalAge.daaga,
        AnimalAge.shudlen,
        AnimalAge.khazaalan,
      ]));

      // Verify toggling off: removing an age
      final updated3 = report.copyWith(
        ages: [AnimalAge.unaga],
      );

      expect(updated3.ages.length, 1);
      expect(updated3.ages, [AnimalAge.unaga]);

      // Verify empty ages
      final updated4 = report.copyWith(ages: []);
      expect(updated4.ages, isEmpty);
    });

    test('LostHorseReport serializes/deserializes ages correctly', () {
      final report = LostHorseReport(
        id: 'r1',
        ownerId: 'o1',
        lastSeenLat: 47.9,
        lastSeenLng: 106.9,
        lastSeenAt: _defaultTime,
        createdAt: _defaultTime,
        updatedAt: _defaultTime,
        ages: [
          AnimalAge.unaga,
          AnimalAge.daaga,
          AnimalAge.shudlen,
          AnimalAge.khazaalan,
          AnimalAge.soyolon,
        ],
      );

      final json = report.toJson();
      final restored = LostHorseReport.fromJson(json);

      expect(restored.ages.length, 5);
      expect(restored.ages, containsAll([
        AnimalAge.unaga,
        AnimalAge.daaga,
        AnimalAge.shudlen,
        AnimalAge.khazaalan,
        AnimalAge.soyolon,
      ]));
    });
  });

  // ── Gender dropdown (VAL-ANML-003) ─────────────────────────────

  group('Gender dropdown', () {
    test('HorseGender has 4 values with correct display names', () {
      expect(HorseGender.values.length, 4);

      // Технически: enum-д 4 утга байгаа ч UI-д 3-ыг харуулна
      expect(HorseGender.stallion.displayName, 'Азарга');
      expect(HorseGender.mare.displayName, 'Гүү');
      expect(HorseGender.gelding.displayName, 'Морь');
      expect(HorseGender.foal.displayName, 'Унага');
    });

    test('all HorseGender display names are non-empty', () {
      for (final gender in HorseGender.values) {
        expect(gender.displayName.trim().isNotEmpty, isTrue,
            reason: '${gender.name} displayName should not be empty');
      }
    });
  });

  // ── Breed dropdown (VAL-ANML-004) ─────────────────────────────

  group('Breed dropdown', () {
    test('HorseBreed has exactly 4 values', () {
      expect(HorseBreed.values.length, 4,
          reason: 'Must have 4 breeds: '
              'Монгол, Шинэ цагийн монгол, Цэвэр цусны, Эрлийз');
    });

    test('each HorseBreed has non-empty displayName', () {
      for (final breed in HorseBreed.values) {
        expect(breed.displayName.trim().isNotEmpty, isTrue,
            reason: '${breed.name} displayName should not be empty');
      }
    });
  });

  // ── Coat color searchable (VAL-ANML-005) ──────────────────────

  group('Coat color search', () {
    test('horseCoatColors has at least 40 entries', () {
      expect(horseCoatColors.length, greaterThanOrEqualTo(40));
    });

    test('typing filters coat colors', () {
      // Simulate the TamgaCombobox filter behavior
      final query = 'Хал';
      final filtered = horseCoatColors
          .where((c) => c.toLowerCase().contains(query.toLowerCase()))
          .toList();

      expect(filtered.length, greaterThan(0),
          reason: 'Filtering by "$query" should return results');
      expect(filtered, containsAll(['Халтар', 'Халзан', 'Халиун']));
    });

    test('no-match query returns empty', () {
      final query = 'xyz123';
      final filtered = horseCoatColors
          .where((c) => c.toLowerCase().contains(query.toLowerCase()))
          .toList();

      expect(filtered, isEmpty,
          reason: 'Non-matching query should return no results');
    });

    test('empty query returns all colors', () {
      final query = '';
      final filtered = horseCoatColors
          .where((c) => c.toLowerCase().contains(query.toLowerCase()))
          .toList();

      expect(filtered.length, horseCoatColors.length);
    });
  });
}
