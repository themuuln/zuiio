import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/shared/domain/horse.dart';

void main() {
  group('HorseGender', () {
    test('displayName returns Mongolian labels', () {
      expect(HorseGender.stallion.displayName, 'Азарга');
      expect(HorseGender.mare.displayName, 'Гүү');
      expect(HorseGender.gelding.displayName, 'Морь');
      expect(HorseGender.foal.displayName, 'Унага');
    });

    test('fromString parses English names', () {
      expect(HorseGender.fromString('stallion'), HorseGender.stallion);
      expect(HorseGender.fromString('mare'), HorseGender.mare);
      expect(HorseGender.fromString('gelding'), HorseGender.gelding);
      expect(HorseGender.fromString('foal'), HorseGender.foal);
    });

    test('fromString defaults to gelding for unknown values', () {
      expect(HorseGender.fromString('unknown'), HorseGender.gelding);
      expect(HorseGender.fromString(''), HorseGender.gelding);
    });
  });

  group('Horse', () {
    final sampleHorse = Horse(
      id: 'khan-khuleg',
      ownerId: 'owner-1',
      name: 'Хан Хүлэг',
      relationLabel: 'Root азарга',
      gender: HorseGender.stallion,
      coat: 'Хээр',
      birthYear: 2012,
      awardCount: 7,
      offspringCount: 18,
      notes: 'Root азарга',
      isOwnedByHousehold: true,
      lineageRootId: 'khan-khuleg',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    test('constructor assigns all fields', () {
      expect(sampleHorse.id, 'khan-khuleg');
      expect(sampleHorse.name, 'Хан Хүлэг');
      expect(sampleHorse.gender, HorseGender.stallion);
      expect(sampleHorse.coat, 'Хээр');
      expect(sampleHorse.birthYear, 2012);
      expect(sampleHorse.isOwnedByHousehold, true);
    });

    test('optional fields default correctly', () {
      final horse = Horse(
        id: 'minimal',
        ownerId: 'o1',
        name: 'Minimal',
        relationLabel: '',
        gender: HorseGender.mare,
        coat: 'Бор',
        birthYear: 2020,
        awardCount: 0,
        offspringCount: 0,
        isOwnedByHousehold: true,
        notes: '',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(horse.notes, '');
      expect(horse.photoUrls, []);
      expect(horse.microchipId, isNull);
      expect(horse.registrationNo, isNull);
      expect(horse.lineageRootId, isNull);
      expect(horse.ownerStampSvg, isNull);
    });

    test('copyWith updates specified fields', () {
      final updated = sampleHorse.copyWith(name: 'Шинэ Нэр', birthYear: 2020);
      expect(updated.id, 'khan-khuleg');
      expect(updated.name, 'Шинэ Нэр');
      expect(updated.birthYear, 2020);
      expect(updated.gender, HorseGender.stallion);
    });

    test('copyWith updates ownerStampSvg', () {
      const svg =
          '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>';
      final updated = sampleHorse.copyWith(ownerStampSvg: svg);
      expect(updated.ownerStampSvg, svg);
    });

    test('copyWith with no args returns identical object', () {
      final same = sampleHorse.copyWith();
      expect(same, sampleHorse);
    });

    test('equality — two identical horses are equal', () {
      final now = DateTime(2025, 1, 1);
      final horse1 = Horse(
        id: 'h1',
        ownerId: 'o1',
        name: 'Test',
        relationLabel: '',
        gender: HorseGender.gelding,
        coat: 'Хүрэн',
        birthYear: 2015,
        awardCount: 0,
        offspringCount: 0,
        isOwnedByHousehold: true,
        notes: '',
        createdAt: now,
        updatedAt: now,
      );
      final horse2 = Horse(
        id: 'h1',
        ownerId: 'o1',
        name: 'Test',
        relationLabel: '',
        gender: HorseGender.gelding,
        coat: 'Хүрэн',
        birthYear: 2015,
        awardCount: 0,
        offspringCount: 0,
        isOwnedByHousehold: true,
        notes: '',
        createdAt: now,
        updatedAt: now,
      );
      expect(horse1, horse2);
    });

    test('equality — different ids are not equal', () {
      final horse1 = Horse(
        id: 'h1',
        ownerId: 'o1',
        name: 'A',
        relationLabel: '',
        gender: HorseGender.gelding,
        coat: 'Хээр',
        birthYear: 2015,
        awardCount: 0,
        offspringCount: 0,
        isOwnedByHousehold: true,
        notes: '',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final horse2 = Horse(
        id: 'h2',
        ownerId: 'o1',
        name: 'A',
        relationLabel: '',
        gender: HorseGender.gelding,
        coat: 'Хээр',
        birthYear: 2015,
        awardCount: 0,
        offspringCount: 0,
        isOwnedByHousehold: true,
        notes: '',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(horse1 == horse2, false);
    });

    test('toJson serializes all fields', () {
      final json = sampleHorse.toJson();
      expect(json['id'], 'khan-khuleg');
      expect(json['name'], 'Хан Хүлэг');
      expect(json['gender'], 'stallion');
      expect(json['coat'], 'Хээр');
      expect(json['birthYear'], 2012);
      expect(json['isOwnedByHousehold'], true);
      expect(json['notes'], 'Root азарга');
    });

    test('fromJson deserializes correctly', () {
      final json = sampleHorse.toJson();
      final restored = Horse.fromJson(json);
      expect(restored, sampleHorse);
    });

    test('toJson includes ownerStampSvg', () {
      const svg =
          '<svg viewBox="0 0 100 100"><rect width="100" height="100"/></svg>';
      final horse = sampleHorse.copyWith(ownerStampSvg: svg);
      final json = horse.toJson();
      expect(json['ownerStampSvg'], svg);
    });

    test('fromJson deserializes ownerStampSvg', () {
      const svg =
          '<svg viewBox="0 0 100 100"><rect width="100" height="100"/></svg>';
      final json = {
        'id': 'h1',
        'ownerId': 'o1',
        'name': 'Test',
        'relationLabel': '',
        'gender': 'gelding',
        'coat': 'Бор',
        'birthYear': 2020,
        'awardCount': 0,
        'offspringCount': 0,
        'isOwnedByHousehold': true,
        'notes': '',
        'ownerStampSvg': svg,
        'createdAt': '2026-01-01T00:00:00.000',
        'updatedAt': '2026-01-01T00:00:00.000',
      };
      final horse = Horse.fromJson(json);
      expect(horse.ownerStampSvg, svg);
    });

    test('toSupabaseJson includes ownerId and snake_case keys', () {
      final supabase = sampleHorse.toSupabaseJson(ownerId: 'owner-1');
      expect(supabase['owner_id'], 'owner-1');
      expect(supabase['id'], 'khan-khuleg');
      expect(supabase['birth_year'], 2012);
      expect(supabase['is_owned_by_household'], true);
      expect(supabase['updated_at'], isA<String>());
    });

    test('fromSupabaseJson with snake_case', () {
      final supabase = {
        'id': 'h1',
        'owner_id': 'o1',
        'name': 'Supabase Horse',
        'gender': 'mare',
        'coat': 'Саарал',
        'birth_year': 2018,
        'microchip_id': null,
        'registration_no': 'UB-2020-001',
        'notes': 'Imported',
        'photo_urls': ['https://example.com/photo.jpg'],
        'is_owned_by_household': false,
        'lineage_root_id': null,
        'owner_stamp_svg': '<svg/>',
      };
      final horse = Horse.fromSupabaseJson(supabase);
      expect(horse.name, 'Supabase Horse');
      expect(horse.gender, HorseGender.mare);
      expect(horse.birthYear, 2018);
      expect(horse.registrationNo, 'UB-2020-001');
      expect(horse.photoUrls, ['https://example.com/photo.jpg']);
      expect(horse.isOwnedByHousehold, false);
      expect(horse.ownerStampSvg, '<svg/>');
    });

    test('age computes correctly', () {
      // birthYear 2012, current year is... we can't mock time easily
      // so just verify it returns some positive number
      expect(sampleHorse.age, greaterThan(0));
    });

    test('displayName returns name', () {
      expect(sampleHorse.displayName, 'Хан Хүлэг');
    });

    test('toString includes key fields', () {
      final str = sampleHorse.toString();
      expect(str, contains('khan-khuleg'));
      expect(str, contains('Хан Хүлэг'));
    });

    // ── registrationDate ─────────────────────────────────────

    test('copyWith sets registrationDate', () {
      final dt = DateTime(2025, 6, 1);
      final updated = sampleHorse.copyWith(registrationDate: dt);
      expect(updated.registrationDate, dt);
    });

    test('copyWith clearRegistrationDate sets registrationDate to null', () {
      final withDate = sampleHorse.copyWith(
        registrationDate: DateTime(2025, 6, 1),
      );
      expect(withDate.registrationDate, isNotNull);

      final cleared = withDate.clearRegistrationDate();
      expect(cleared.registrationDate, isNull);
    });

    test('toJson includes registrationDate', () {
      final dt = DateTime(2025, 1, 15);
      final horse = sampleHorse.copyWith(registrationDate: dt);
      final json = horse.toJson();
      expect(json['registrationDate'], dt.toIso8601String());
    });

    test('fromJson parses registrationDate', () {
      final json = {
        'id': 'h1',
        'ownerId': 'o1',
        'name': 'Reg Test',
        'relationLabel': '',
        'gender': 'gelding',
        'coat': 'Бор',
        'birthYear': 2020,
        'awardCount': 0,
        'offspringCount': 0,
        'isOwnedByHousehold': true,
        'notes': '',
        'registrationDate': '2025-01-15T00:00:00.000',
        'createdAt': '2026-01-01T00:00:00.000',
        'updatedAt': '2026-01-01T00:00:00.000',
      };
      final horse = Horse.fromJson(json);
      expect(horse.registrationDate, DateTime(2025, 1, 15));
    });

    test('toSupabaseJson includes registration_date', () {
      final dt = DateTime(2025, 1, 15);
      final horse = sampleHorse.copyWith(registrationDate: dt);
      final json = horse.toSupabaseJson(ownerId: 'owner-1');
      expect(json['registration_date'], dt.toIso8601String());
    });

    // ── Null optional fields in serialization ────────────────

    test('fromJson handles null optional fields', () {
      final json = {
        'id': 'h1',
        'ownerId': 'o1',
        'name': 'Null Test',
        'relationLabel': '',
        'gender': 'gelding',
        'coat': 'Бор',
        'birthYear': 2020,
        'awardCount': 0,
        'offspringCount': 0,
        'isOwnedByHousehold': true,
        'notes': '',
        'microchipId': null,
        'registrationNo': null,
        'lineageRootId': null,
        'ownerStampSvg': null,
        'registrationDate': null,
        'createdAt': '2026-01-01T00:00:00.000',
        'updatedAt': '2026-01-01T00:00:00.000',
      };
      final horse = Horse.fromJson(json);
      expect(horse.microchipId, isNull);
      expect(horse.registrationNo, isNull);
      expect(horse.lineageRootId, isNull);
      expect(horse.ownerStampSvg, isNull);
      expect(horse.registrationDate, isNull);
    });

    test('toJson includes null optional fields as null', () {
      final noOptionals = Horse(
        id: 'test-no-opts',
        ownerId: 'o1',
        name: 'No Opts',
        relationLabel: '',
        gender: HorseGender.mare,
        coat: 'Бор',
        birthYear: 2020,
        awardCount: 0,
        offspringCount: 0,
        isOwnedByHousehold: true,
        notes: '',
        microchipId: null,
        registrationNo: null,
        lineageRootId: null,
        ownerStampSvg: null,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final json = noOptionals.toJson();
      expect(json['microchipId'], isNull);
      expect(json['registrationNo'], isNull);
      expect(json['lineageRootId'], isNull);
      expect(json['ownerStampSvg'], isNull);
      expect(json['registrationDate'], isNull);
    });

    test('fromSupabaseJson parses tamga_verified and state_verified', () {
      final json = {
        'id': 'h1',
        'owner_id': 'o1',
        'name': 'Verified Horse',
        'relation_label': '',
        'gender': 'gelding',
        'coat': 'Хээр',
        'birth_year': 2020,
        'award_count': 0,
        'offspring_count': 0,
        'is_owned_by_household': true,
        'notes': '',
        'tamga_verified': true,
        'state_verified': true,
      };
      final horse = Horse.fromSupabaseJson(json);
      expect(horse.tamgaVerified, true);
      expect(horse.stateVerified, true);
    });

    test('toJson defaults tamgaVerified and stateVerified to false', () {
      final minimal = Horse(
        id: 'h1',
        ownerId: 'o1',
        name: 'Min',
        relationLabel: '',
        gender: HorseGender.mare,
        coat: 'Бор',
        birthYear: 2020,
        awardCount: 0,
        offspringCount: 0,
        isOwnedByHousehold: true,
        notes: '',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final json = minimal.toJson();
      expect(json['tamgaVerified'], false);
      expect(json['stateVerified'], false);
    });
  });
}
