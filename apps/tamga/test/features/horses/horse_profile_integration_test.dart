import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/shared/domain/horse.dart';
import 'package:tamga/src/shared/domain/horse_coat_color.dart';
import 'package:tamga/src/shared/domain/horse_breed_lineage.dart';
import 'package:tamga/src/shared/domain/horse_markings.dart';

/// Creates a Horse with sensible defaults. Override any field as needed.
Horse makeHorse({
  String id = 'test',
  String? sireId,
  String? damId,
  MongolianCoatColor? coatColor,
  MongolianBreedLineage? breedLineage,
  String? region,
  String? sum,
  HorseMarkings? markings,
  String? tamgaBrandClan,
  int? tamgaBrandGeneration,
}) => Horse(
  id: id,
  ownerId: 'owner-1',
  name: 'Test Horse $id',
  relationLabel: '',
  gender: HorseGender.stallion,
  coat: 'Хээр',
  birthYear: 2020,
  awardCount: 0,
  offspringCount: 0,
  isOwnedByHousehold: true,
  notes: '',
  createdAt: DateTime(2025, 1, 1),
  updatedAt: DateTime(2025, 1, 1),
  sireId: sireId,
  damId: damId,
  coatColor: coatColor,
  breedLineage: breedLineage,
  region: region,
  sum: sum,
  markings: markings,
  tamgaBrandClan: tamgaBrandClan,
  tamgaBrandGeneration: tamgaBrandGeneration,
);

/// A fully-populated Horse exercising every field including the 9 new ones.
Horse makeFullHorse() => Horse(
  id: 'full-horse-1',
  ownerId: 'owner-42',
  name: 'Батмөнх',
  relationLabel: 'Аавын морь',
  gender: HorseGender.stallion,
  coat: 'Хүрэн',
  birthYear: 2018,
  awardCount: 5,
  offspringCount: 12,
  isOwnedByHousehold: true,
  notes: 'Зүүн талаа одтой',
  microchipId: 'MC-998877',
  registrationNo: 'MN-2018-0042',
  photoUrls: ['https://img.example.com/1.jpg', 'https://img.example.com/2.jpg'],
  lineageRootId: 'root-abc',
  ownerStampSvg:
      '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>',
  registrationDate: DateTime(2018, 6, 15),
  tamgaVerified: true,
  stateVerified: true,
  createdAt: DateTime(2025, 1, 1),
  updatedAt: DateTime(2025, 3, 15),
  // ── 9 new fields ──
  sireId: 'sire-001',
  damId: 'dam-001',
  coatColor: MongolianCoatColor.kheer,
  breedLineage: MongolianBreedLineage.darkhad,
  region: 'Хөвсгөл',
  sum: 'Түрлэг',
  markings: const HorseMarkings(
    faceMarking: FaceMarking.blaze,
    faceMarkingDescription: 'Өргөн цагаан зураас',
    legMarkings: {
      'leftFront': LegMarking.stocking,
      'rightHind': LegMarking.sock,
    },
    bodyMarkings: 'Баруун ташаан дээр толбо',
  ),
  tamgaBrandClan: 'Дархад',
  tamgaBrandGeneration: 3,
);

void main() {
  // ─────────────────────────────────────────────────────────────
  // 1. Full horse profile creation and serialization
  // ─────────────────────────────────────────────────────────────
  group('Full horse profile creation and serialization', () {
    test('all fields are accessible after construction', () {
      final horse = makeFullHorse();

      // Original fields
      expect(horse.id, 'full-horse-1');
      expect(horse.ownerId, 'owner-42');
      expect(horse.name, 'Батмөнх');
      expect(horse.relationLabel, 'Аавын морь');
      expect(horse.gender, HorseGender.stallion);
      expect(horse.coat, 'Хүрэн');
      expect(horse.birthYear, 2018);
      expect(horse.awardCount, 5);
      expect(horse.offspringCount, 12);
      expect(horse.isOwnedByHousehold, true);
      expect(horse.notes, 'Зүүн талаа одтой');
      expect(horse.microchipId, 'MC-998877');
      expect(horse.registrationNo, 'MN-2018-0042');
      expect(horse.photoUrls, hasLength(2));
      expect(horse.lineageRootId, 'root-abc');
      expect(horse.ownerStampSvg, isNotNull);
      expect(horse.registrationDate, DateTime(2018, 6, 15));
      expect(horse.tamgaVerified, true);
      expect(horse.stateVerified, true);

      // 9 new fields
      expect(horse.sireId, 'sire-001');
      expect(horse.damId, 'dam-001');
      expect(horse.coatColor, MongolianCoatColor.kheer);
      expect(horse.breedLineage, MongolianBreedLineage.darkhad);
      expect(horse.region, 'Хөвсгөл');
      expect(horse.sum, 'Түрлэг');
      expect(horse.markings, isNotNull);
      expect(horse.tamgaBrandClan, 'Дархад');
      expect(horse.tamgaBrandGeneration, 3);
    });

    test('toJson includes every field', () {
      final json = makeFullHorse().toJson();

      // Original fields
      expect(json['id'], 'full-horse-1');
      expect(json['ownerId'], 'owner-42');
      expect(json['name'], 'Батмөнх');
      expect(json['relationLabel'], 'Аавын морь');
      expect(json['gender'], 'stallion');
      expect(json['coat'], 'Хүрэн');
      expect(json['birthYear'], 2018);
      expect(json['awardCount'], 5);
      expect(json['offspringCount'], 12);
      expect(json['isOwnedByHousehold'], true);
      expect(json['notes'], 'Зүүн талаа одтой');
      expect(json['microchipId'], 'MC-998877');
      expect(json['registrationNo'], 'MN-2018-0042');
      expect(json['photoUrls'], hasLength(2));
      expect(json['lineageRootId'], 'root-abc');
      expect(json['ownerStampSvg'], isNotNull);
      expect(json['registrationDate'], isNotNull);
      expect(json['tamgaVerified'], true);
      expect(json['stateVerified'], true);

      // 9 new fields
      expect(json['sireId'], 'sire-001');
      expect(json['damId'], 'dam-001');
      expect(json['coatColor'], 'kheer');
      expect(json['breedLineage'], 'darkhad');
      expect(json['region'], 'Хөвсгөл');
      expect(json['sum'], 'Түрлэг');
      expect(json['markings'], isA<Map>());
      expect(json['tamgaBrandClan'], 'Дархад');
      expect(json['tamgaBrandGeneration'], 3);
    });

    test('fromJson restores every field', () {
      final original = makeFullHorse();
      final restored = Horse.fromJson(original.toJson());

      expect(restored.id, original.id);
      expect(restored.ownerId, original.ownerId);
      expect(restored.name, original.name);
      expect(restored.relationLabel, original.relationLabel);
      expect(restored.gender, original.gender);
      expect(restored.coat, original.coat);
      expect(restored.birthYear, original.birthYear);
      expect(restored.awardCount, original.awardCount);
      expect(restored.offspringCount, original.offspringCount);
      expect(restored.isOwnedByHousehold, original.isOwnedByHousehold);
      expect(restored.notes, original.notes);
      expect(restored.microchipId, original.microchipId);
      expect(restored.registrationNo, original.registrationNo);
      expect(restored.photoUrls, original.photoUrls);
      expect(restored.lineageRootId, original.lineageRootId);
      expect(restored.ownerStampSvg, original.ownerStampSvg);
      expect(restored.registrationDate, original.registrationDate);
      expect(restored.tamgaVerified, original.tamgaVerified);
      expect(restored.stateVerified, original.stateVerified);
      expect(restored.sireId, original.sireId);
      expect(restored.damId, original.damId);
      expect(restored.coatColor, original.coatColor);
      expect(restored.breedLineage, original.breedLineage);
      expect(restored.region, original.region);
      expect(restored.sum, original.sum);
      expect(restored.tamgaBrandClan, original.tamgaBrandClan);
      expect(restored.tamgaBrandGeneration, original.tamgaBrandGeneration);
    });

    test('JSON roundtrip preserves horse equality', () {
      final horse = makeFullHorse();
      final roundtripped = Horse.fromJson(horse.toJson());

      // freezed structural equality covers all fields
      expect(roundtripped, equals(horse));
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Supabase roundtrip
  // ─────────────────────────────────────────────────────────────
  group('Supabase roundtrip', () {
    test('toSupabaseJson with ownerId includes all fields in snake_case', () {
      final horse = makeFullHorse();
      final supabase = horse.toSupabaseJson(ownerId: 'owner-42');

      // Verify snake_case keys
      expect(supabase.containsKey('owner_id'), true);
      expect(supabase.containsKey('relation_label'), true);
      expect(supabase.containsKey('birth_year'), true);
      expect(supabase.containsKey('award_count'), true);
      expect(supabase.containsKey('offspring_count'), true);
      expect(supabase.containsKey('is_owned_by_household'), true);
      expect(supabase.containsKey('microchip_id'), true);
      expect(supabase.containsKey('registration_no'), true);
      expect(supabase.containsKey('photo_urls'), true);
      expect(supabase.containsKey('lineage_root_id'), true);
      expect(supabase.containsKey('owner_stamp_svg'), true);
      expect(supabase.containsKey('registration_date'), true);
      expect(supabase.containsKey('tamga_verified'), true);
      expect(supabase.containsKey('state_verified'), true);
      expect(supabase.containsKey('created_at'), true);
      expect(supabase.containsKey('updated_at'), true);
      expect(supabase.containsKey('sire_id'), true);
      expect(supabase.containsKey('dam_id'), true);
      expect(supabase.containsKey('coat_color'), true);
      expect(supabase.containsKey('breed_lineage'), true);
      expect(supabase.containsKey('region'), true);
      expect(supabase.containsKey('sum'), true);
      expect(supabase.containsKey('markings'), true);
      expect(supabase.containsKey('tamga_brand_clan'), true);
      expect(supabase.containsKey('tamga_brand_generation'), true);

      // Verify values
      expect(supabase['owner_id'], 'owner-42');
      expect(supabase['sire_id'], 'sire-001');
      expect(supabase['dam_id'], 'dam-001');
      expect(supabase['coat_color'], 'kheer');
      expect(supabase['breed_lineage'], 'darkhad');
      expect(supabase['tamga_brand_clan'], 'Дархад');
      expect(supabase['tamga_brand_generation'], 3);
    });

    test('fromSupabaseJson restores all fields', () {
      final original = makeFullHorse();
      final supabase = original.toSupabaseJson(ownerId: 'owner-42');
      final restored = Horse.fromSupabaseJson(supabase);

      expect(restored.id, original.id);
      expect(restored.ownerId, 'owner-42');
      expect(restored.name, original.name);
      expect(restored.gender, original.gender);
      expect(restored.sireId, original.sireId);
      expect(restored.damId, original.damId);
      expect(restored.coatColor, original.coatColor);
      expect(restored.breedLineage, original.breedLineage);
      expect(restored.region, original.region);
      expect(restored.sum, original.sum);
      expect(restored.tamgaBrandClan, original.tamgaBrandClan);
      expect(restored.tamgaBrandGeneration, original.tamgaBrandGeneration);
      expect(restored.tamgaVerified, original.tamgaVerified);
      expect(restored.stateVerified, original.stateVerified);
      expect(restored.markings?.faceMarking, original.markings?.faceMarking);
      expect(
        restored.markings?.faceMarkingDescription,
        original.markings?.faceMarkingDescription,
      );
      expect(restored.markings?.bodyMarkings, original.markings?.bodyMarkings);
    });

    test('Supabase roundtrip preserves structural equality', () {
      final horse = makeFullHorse();
      // toSupabaseJson uses DateTime.now() for updated_at, so we compare
      // field-by-field instead of structural equality.
      final supabase = horse.toSupabaseJson(ownerId: 'owner-42');
      final restored = Horse.fromSupabaseJson(supabase);

      expect(restored.id, horse.id);
      expect(restored.name, horse.name);
      expect(restored.gender, horse.gender);
      expect(restored.coat, horse.coat);
      expect(restored.birthYear, horse.birthYear);
      expect(restored.sireId, horse.sireId);
      expect(restored.damId, horse.damId);
      expect(restored.coatColor, horse.coatColor);
      expect(restored.breedLineage, horse.breedLineage);
      expect(restored.region, horse.region);
      expect(restored.sum, horse.sum);
      expect(restored.markings?.faceMarking, horse.markings?.faceMarking);
      expect(restored.tamgaBrandClan, horse.tamgaBrandClan);
      expect(restored.tamgaBrandGeneration, horse.tamgaBrandGeneration);
      expect(restored.photoUrls, horse.photoUrls);
      expect(restored.microchipId, horse.microchipId);
      expect(restored.registrationNo, horse.registrationNo);
      // updated_at will differ (DateTime.now() in toSupabaseJson)
      expect(restored.updatedAt, isNot(horse.updatedAt));
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Parent linkage flow
  // ─────────────────────────────────────────────────────────────
  group('Parent linkage flow', () {
    test('sire and dam links roundtrip through JSON', () {
      final sire = makeHorse(id: 'sire-1');
      final dam = makeHorse(id: 'dam-1');
      final offspring = makeHorse(
        id: 'offspring-1',
        sireId: sire.id,
        damId: dam.id,
      );

      // Verify linkage set
      expect(offspring.sireId, 'sire-1');
      expect(offspring.damId, 'dam-1');

      // JSON roundtrip
      final roundtripped = Horse.fromJson(offspring.toJson());
      expect(roundtripped.sireId, 'sire-1');
      expect(roundtripped.damId, 'dam-1');
      expect(roundtripped, equals(offspring));
    });

    test('sire and dam links roundtrip through Supabase format', () {
      final offspring = makeHorse(
        id: 'offspring-2',
        sireId: 'sire-2',
        damId: 'dam-2',
      );
      final supabase = offspring.toSupabaseJson(ownerId: 'owner-1');
      final restored = Horse.fromSupabaseJson(supabase);

      expect(restored.sireId, 'sire-2');
      expect(restored.damId, 'dam-2');
    });

    test('null parents serialize and deserialize correctly', () {
      final orphan = makeHorse(id: 'orphan');
      expect(orphan.sireId, isNull);
      expect(orphan.damId, isNull);

      // JSON roundtrip
      final json = orphan.toJson();
      expect(json['sireId'], isNull);
      expect(json['damId'], isNull);

      final restored = Horse.fromJson(json);
      expect(restored.sireId, isNull);
      expect(restored.damId, isNull);
      expect(restored, equals(orphan));
    });

    test('null parents roundtrip through Supabase format', () {
      final orphan = makeHorse(id: 'orphan-sb');
      final supabase = orphan.toSupabaseJson(ownerId: 'owner-1');
      expect(supabase['sire_id'], isNull);
      expect(supabase['dam_id'], isNull);

      final restored = Horse.fromSupabaseJson(supabase);
      expect(restored.sireId, isNull);
      expect(restored.damId, isNull);
    });

    test('only sire set, dam null', () {
      final horse = makeHorse(id: 'sire-only', sireId: 'sire-x');
      final roundtripped = Horse.fromJson(horse.toJson());

      expect(roundtripped.sireId, 'sire-x');
      expect(roundtripped.damId, isNull);
    });

    test('only dam set, sire null', () {
      final horse = makeHorse(id: 'dam-only', damId: 'dam-x');
      final roundtripped = Horse.fromJson(horse.toJson());

      expect(roundtripped.sireId, isNull);
      expect(roundtripped.damId, 'dam-x');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Markings integration
  // ─────────────────────────────────────────────────────────────
  group('Markings integration', () {
    test('complex markings serialize through toJson/fromJson', () {
      const markings = HorseMarkings(
        faceMarking: FaceMarking.blaze,
        faceMarkingDescription: 'Өргөн цагаан зураас',
        legMarkings: {
          'leftFront': LegMarking.stocking,
          'rightFront': LegMarking.none,
          'leftHind': LegMarking.pastern,
          'rightHind': LegMarking.sock,
        },
        bodyMarkings: 'Баруун ташаан дээр толбо',
      );
      final horse = makeHorse(id: 'marked', markings: markings);
      final json = horse.toJson();

      // Verify markings appear in JSON
      final markingsJson = json['markings'] as Map<String, dynamic>;
      expect(markingsJson['faceMarking'], 'blaze');
      expect(markingsJson['faceMarkingDescription'], 'Өргөн цагаан зураас');
      expect(markingsJson['bodyMarkings'], 'Баруун ташаан дээр толбо');
      expect((markingsJson['legMarkings'] as Map<String, dynamic>).length, 4);

      // Deserialize and verify
      final restored = Horse.fromJson(json);
      expect(restored.markings, isNotNull);
      expect(restored.markings!.faceMarking, FaceMarking.blaze);
      expect(restored.markings!.faceMarkingDescription, 'Өргөн цагаан зураас');
      expect(restored.markings!.bodyMarkings, 'Баруун ташаан дээр толбо');
      expect(restored.markings!.legMarkings.length, 4);
      expect(restored.markings!.legMarkings['leftFront'], LegMarking.stocking);
      expect(restored.markings!.legMarkings['rightHind'], LegMarking.sock);
    });

    test('complex markings serialize through Supabase format', () {
      const markings = HorseMarkings(
        faceMarking: FaceMarking.star,
        faceMarkingDescription: 'Жижиг од',
        legMarkings: {'rightFront': LegMarking.coronet},
        bodyMarkings: 'Нуруун дээр зураас',
      );
      final horse = makeHorse(id: 'sb-marked', markings: markings);
      final supabase = horse.toSupabaseJson(ownerId: 'owner-1');
      final restored = Horse.fromSupabaseJson(supabase);

      expect(restored.markings, isNotNull);
      expect(restored.markings!.faceMarking, FaceMarking.star);
      expect(restored.markings!.faceMarkingDescription, 'Жижиг од');
      expect(restored.markings!.bodyMarkings, 'Нуруун дээр зураас');
      expect(restored.markings!.legMarkings['rightFront'], LegMarking.coronet);
    });

    test('empty markings serialize correctly', () {
      const markings = HorseMarkings(); // all defaults
      final horse = makeHorse(id: 'empty-marks', markings: markings);
      final json = horse.toJson();

      final markingsJson = json['markings'] as Map<String, dynamic>;
      expect(markingsJson['faceMarking'], 'none');
      expect(markingsJson['faceMarkingDescription'], '');
      expect(markingsJson['legMarkings'], isEmpty);
      expect(markingsJson['bodyMarkings'], '');

      final restored = Horse.fromJson(json);
      expect(restored.markings!.faceMarking, FaceMarking.none);
      expect(restored.markings!.legMarkings, isEmpty);
    });

    test('null markings serialize and deserialize as null', () {
      final horse = makeHorse(id: 'no-marks');
      expect(horse.markings, isNull);

      final json = horse.toJson();
      expect(json['markings'], isNull);

      final restored = Horse.fromJson(json);
      expect(restored.markings, isNull);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Coat color and breed lineage integration
  // ─────────────────────────────────────────────────────────────
  group('Coat color and breed lineage integration', () {
    test('MongolianCoatColor survives JSON roundtrip', () {
      final horse = makeHorse(id: 'cc1', coatColor: MongolianCoatColor.kheer);
      final roundtripped = Horse.fromJson(horse.toJson());

      expect(roundtripped.coatColor, MongolianCoatColor.kheer);
      expect(roundtripped.coatColor?.displayName, 'Хээр');
    });

    test('MongolianBreedLineage survives JSON roundtrip', () {
      final horse = makeHorse(
        id: 'bl1',
        breedLineage: MongolianBreedLineage.darkhad,
      );
      final roundtripped = Horse.fromJson(horse.toJson());

      expect(roundtripped.breedLineage, MongolianBreedLineage.darkhad);
      expect(roundtripped.breedLineage?.displayName, 'Дархад');
      expect(roundtripped.breedLineage?.region, 'Хөвсгөл аймаг');
    });

    test('null coatColor and breedLineage survive roundtrip', () {
      final horse = makeHorse(id: 'null-enum');
      expect(horse.coatColor, isNull);
      expect(horse.breedLineage, isNull);

      final json = horse.toJson();
      expect(json['coatColor'], isNull);
      expect(json['breedLineage'], isNull);

      final roundtripped = Horse.fromJson(json);
      expect(roundtripped.coatColor, isNull);
      expect(roundtripped.breedLineage, isNull);
      expect(roundtripped, equals(horse));
    });

    test('all MongolianCoatColor values survive roundtrip', () {
      for (final color in MongolianCoatColor.values) {
        final horse = makeHorse(id: 'c-${color.name}', coatColor: color);
        final roundtripped = Horse.fromJson(horse.toJson());
        expect(
          roundtripped.coatColor,
          color,
          reason: '${color.name} should survive JSON roundtrip',
        );
      }
    });

    test('all MongolianBreedLineage values survive roundtrip', () {
      for (final lineage in MongolianBreedLineage.values) {
        final horse = makeHorse(id: 'l-${lineage.name}', breedLineage: lineage);
        final roundtripped = Horse.fromJson(horse.toJson());
        expect(
          roundtripped.breedLineage,
          lineage,
          reason: '${lineage.name} should survive JSON roundtrip',
        );
      }
    });

    test('coat color and breed lineage survive Supabase roundtrip', () {
      final horse = makeHorse(
        id: 'sb-enum',
        coatColor: MongolianCoatColor.tsenker,
        breedLineage: MongolianBreedLineage.galshar,
      );
      final supabase = horse.toSupabaseJson(ownerId: 'owner-1');
      final restored = Horse.fromSupabaseJson(supabase);

      expect(restored.coatColor, MongolianCoatColor.tsenker);
      expect(restored.breedLineage, MongolianBreedLineage.galshar);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. CopyWith with new fields
  // ─────────────────────────────────────────────────────────────
  group('CopyWith with new fields', () {
    test('copyWith updates individual new fields', () {
      final original = makeHorse(id: 'cw-1');
      final updated = original.copyWith(
        sireId: 'new-sire',
        damId: 'new-dam',
        coatColor: MongolianCoatColor.alag,
        breedLineage: MongolianBreedLineage.gobiShankh,
        region: 'Говь',
        sum: 'Даланзадгад',
        markings: const HorseMarkings(
          faceMarking: FaceMarking.bald,
          faceMarkingDescription: 'Бүтэн цагаан нүүр',
        ),
        tamgaBrandClan: 'Говийн Шанх',
        tamgaBrandGeneration: 1,
      );

      expect(updated.sireId, 'new-sire');
      expect(updated.damId, 'new-dam');
      expect(updated.coatColor, MongolianCoatColor.alag);
      expect(updated.breedLineage, MongolianBreedLineage.gobiShankh);
      expect(updated.region, 'Говь');
      expect(updated.sum, 'Даланзадгад');
      expect(updated.markings?.faceMarking, FaceMarking.bald);
      expect(updated.tamgaBrandClan, 'Говийн Шанх');
      expect(updated.tamgaBrandGeneration, 1);
    });

    test('copyWith preserves unchanged new fields', () {
      final original = makeHorse(
        id: 'cw-2',
        sireId: 'sire-old',
        damId: 'dam-old',
        coatColor: MongolianCoatColor.khuren,
        breedLineage: MongolianBreedLineage.myangad,
        region: 'Ховд',
        sum: 'Буянт',
        markings: const HorseMarkings(faceMarking: FaceMarking.strip),
        tamgaBrandClan: 'Мянгад',
        tamgaBrandGeneration: 5,
      );

      // Only change the name — all new fields should be preserved
      final updated = original.copyWith(name: 'Шинэ нэр');

      expect(updated.name, 'Шинэ нэр');
      expect(updated.sireId, 'sire-old');
      expect(updated.damId, 'dam-old');
      expect(updated.coatColor, MongolianCoatColor.khuren);
      expect(updated.breedLineage, MongolianBreedLineage.myangad);
      expect(updated.region, 'Ховд');
      expect(updated.sum, 'Буянт');
      expect(updated.markings?.faceMarking, FaceMarking.strip);
      expect(updated.tamgaBrandClan, 'Мянгад');
      expect(updated.tamgaBrandGeneration, 5);
    });

    test('copyWith clearing a field to null works', () {
      final original = makeHorse(
        id: 'cw-3',
        sireId: 'sire-x',
        coatColor: MongolianCoatColor.khar,
      );
      final cleared = original.copyWith(sireId: null, coatColor: null);

      expect(cleared.sireId, isNull);
      expect(cleared.coatColor, isNull);
      // Other new fields untouched
      expect(cleared.damId, isNull); // was already null
    });

    test('copyWith updated horse survives JSON roundtrip', () {
      final original = makeHorse(id: 'cw-4');
      final updated = original.copyWith(
        sireId: 'sire-rt',
        damId: 'dam-rt',
        coatColor: MongolianCoatColor.sharga,
        breedLineage: MongolianBreedLineage.tes,
        tamgaBrandClan: 'Тэс',
        tamgaBrandGeneration: 2,
      );
      final roundtripped = Horse.fromJson(updated.toJson());

      expect(roundtripped, equals(updated));
      expect(roundtripped.sireId, 'sire-rt');
      expect(roundtripped.damId, 'dam-rt');
      expect(roundtripped.coatColor, MongolianCoatColor.sharga);
      expect(roundtripped.breedLineage, MongolianBreedLineage.tes);
      expect(roundtripped.tamgaBrandClan, 'Тэс');
      expect(roundtripped.tamgaBrandGeneration, 2);
    });
  });
}
