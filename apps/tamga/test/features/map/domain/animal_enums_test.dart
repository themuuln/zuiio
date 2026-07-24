import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/constants/horse_coat_colors.dart';
import 'package:tamga/src/features/map/domain/animal_enums.dart';

void main() {
  // ── AnimalType ──────────────────────────────────────────────────
  // VAL-ANML-001: Animal type dropdown displays all five types

  group('AnimalType', () {
    test('has exactly 5 values', () {
      expect(
        AnimalType.values.length,
        5,
        reason:
            'Must have exactly 5 animal types: '
            'Адуу, Үхэр, Хонь, Ямаа, Тэмээ',
      );
    });

    test('contains all five types', () {
      expect(AnimalType.horse.displayName, 'Адуу');
      expect(AnimalType.cattle.displayName, 'Үхэр');
      expect(AnimalType.sheep.displayName, 'Хонь');
      expect(AnimalType.goat.displayName, 'Ямаа');
      expect(AnimalType.camel.displayName, 'Тэмээ');
    });

    test('all displayNames are non-empty', () {
      for (final type in AnimalType.values) {
        expect(
          type.displayName.trim().isNotEmpty,
          isTrue,
          reason: '${type.name} should have a non-empty displayName',
        );
      }
    });
  });

  // ── HorseBreed ──────────────────────────────────────────────────
  // VAL-ANML-004: Breed dropdown contains four predefined categories

  group('HorseBreed', () {
    test('has exactly 4 values', () {
      expect(
        HorseBreed.values.length,
        4,
        reason:
            'Must have exactly 4 breeds: '
            'Монгол, Шинэ цагийн монгол, Цэвэр цусны, Эрлийз',
      );
    });

    test('contains all four breeds', () {
      expect(HorseBreed.mongol.displayName, 'Монгол');
      expect(HorseBreed.shineTsagiinMongol.displayName, 'Шинэ цагийн монгол');
      expect(HorseBreed.tseverTsusni.displayName, 'Цэвэр цусны');
      expect(HorseBreed.erliiz.displayName, 'Эрлийз');
    });
  });

  // ─── LostHorsePricingTier ───────────────────────────────────────

  group('LostHorsePricingTier', () {
    test('has exactly 3 values', () {
      expect(
        LostHorsePricingTier.values.length,
        3,
        reason: 'Must have 3 tiers: Энгийн, Онцлох, VIP',
      );
    });

    test('has correct display names', () {
      expect(LostHorsePricingTier.free.displayName, 'Энгийн');
      expect(LostHorsePricingTier.featured.displayName, 'Онцлох');
      expect(LostHorsePricingTier.vip.displayName, 'VIP');
    });
  });

  // ── AnimalAge ───────────────────────────────────────────────────

  group('AnimalAge', () {
    test('has correct values', () {
      expect(
        AnimalAge.values.length,
        14,
        reason: 'Must have 14 age classifications',
      );
    });

    test('key ages have correct display names', () {
      expect(AnimalAge.unaga.displayName, 'Унага');
      expect(AnimalAge.daaga.displayName, 'Даага');
      expect(AnimalAge.shudlen.displayName, 'Шүдлэн');
      expect(AnimalAge.khazaalan.displayName, 'Хязаалан');
      expect(AnimalAge.soyolon.displayName, 'Соёолон');
      expect(AnimalAge.ikhNas.displayName, 'Их нас');
    });
  });

  // ── Coat Colors ─────────────────────────────────────────────────
  // VAL-ANML-005: Coat color dropdown is searchable with 40+ colors

  group('horseCoatColors', () {
    test('has at least 40 entries', () {
      expect(
        horseCoatColors.length,
        greaterThanOrEqualTo(40),
        reason: 'Must have 40+ Mongolian coat color names',
      );
    });

    test('contains no duplicates', () {
      final unique = horseCoatColors.toSet();
      expect(
        unique.length,
        horseCoatColors.length,
        reason: 'All coat color entries must be unique',
      );
    });

    test('contains key colors', () {
      expect(
        horseCoatColors,
        containsAll(['Хар', 'Цагаан', 'Хээр', 'Бор', 'Улаан']),
      );
    });

    test('all entries are non-empty', () {
      for (final color in horseCoatColors) {
        expect(color.trim().isNotEmpty, isTrue);
      }
    });
  });
}
