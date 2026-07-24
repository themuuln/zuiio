import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/shared/domain/horse.dart';
import 'package:tamga/src/shared/domain/horse_breed_lineage.dart';
import 'package:tamga/src/shared/domain/horse_coat_color.dart';
import 'package:tamga/src/shared/domain/horse_markings.dart';

/// Builds a Horse with every new expansion field populated.
Horse makeFullHorse() => Horse(
  id: 'test',
  ownerId: 'o1',
  name: 'Test',
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
  sireId: 'sire-1',
  damId: 'dam-1',
  coatColor: MongolianCoatColor.kheer,
  breedLineage: MongolianBreedLineage.galshar,
  region: 'Хэнтий',
  sum: 'Галшар',
  tamgaBrandClan: 'Хүлэг',
  tamgaBrandGeneration: 3,
  markings: HorseMarkings(
    faceMarking: FaceMarking.star,
    faceMarkingDescription: 'Толбын од',
    legMarkings: {'leftFront': LegMarking.stocking},
    bodyMarkings: 'Зүүн ташаа дээр шалбарсан',
  ),
);

void main() {
  // ── 1. MongolianCoatColor ──

  group('MongolianCoatColor', () {
    test('has 17 values', () {
      expect(MongolianCoatColor.values.length, 17);
    });

    test('displayName returns Mongolian labels', () {
      for (final c in MongolianCoatColor.values) {
        expect(
          c.displayName,
          isNotEmpty,
          reason: '${c.name} has empty displayName',
        );
      }
      expect(MongolianCoatColor.saaral.displayName, 'Саарал');
      expect(MongolianCoatColor.sharga.displayName, 'Шарга');
      expect(MongolianCoatColor.kheer.displayName, 'Хээр');
      expect(MongolianCoatColor.khuren.displayName, 'Хүрэн');
      expect(MongolianCoatColor.alag.displayName, 'Алаг');
    });

    test('fromString parses valid values', () {
      expect(
        MongolianCoatColor.fromString('saaral'),
        MongolianCoatColor.saaral,
      );
      expect(
        MongolianCoatColor.fromString('sharga'),
        MongolianCoatColor.sharga,
      );
      expect(
        MongolianCoatColor.fromString('khaliiun'),
        MongolianCoatColor.khaliiun,
      );
      expect(MongolianCoatColor.fromString('ulaan'), MongolianCoatColor.ulaan);
      expect(
        MongolianCoatColor.fromString('buural'),
        MongolianCoatColor.buural,
      );
      expect(
        MongolianCoatColor.fromString('tsoohor'),
        MongolianCoatColor.tsoohor,
      );
      expect(MongolianCoatColor.fromString('khar'), MongolianCoatColor.khar);
      expect(
        MongolianCoatColor.fromString('khyarman'),
        MongolianCoatColor.khyarman,
      );
      expect(
        MongolianCoatColor.fromString('chabidar'),
        MongolianCoatColor.chabidar,
      );
      expect(MongolianCoatColor.fromString('kheer'), MongolianCoatColor.kheer);
      expect(
        MongolianCoatColor.fromString('khuren'),
        MongolianCoatColor.khuren,
      );
      expect(
        MongolianCoatColor.fromString('khuwar'),
        MongolianCoatColor.khuwar,
      );
      expect(MongolianCoatColor.fromString('khul'), MongolianCoatColor.khul);
      expect(MongolianCoatColor.fromString('bor'), MongolianCoatColor.bor);
      expect(
        MongolianCoatColor.fromString('tsenker'),
        MongolianCoatColor.tsenker,
      );
      expect(
        MongolianCoatColor.fromString('khaltar'),
        MongolianCoatColor.khaltar,
      );
      expect(MongolianCoatColor.fromString('alag'), MongolianCoatColor.alag);
    });

    test('fromString returns null for unknown', () {
      expect(MongolianCoatColor.fromString('unknown'), isNull);
      expect(MongolianCoatColor.fromString(''), isNull);
      expect(MongolianCoatColor.fromString('grey'), isNull);
    });

    test('description returns English descriptions', () {
      expect(
        MongolianCoatColor.kheer.description,
        'Reddish-brown + black hairs',
      );
      expect(MongolianCoatColor.khuren.description, 'Brown');
      expect(MongolianCoatColor.khar.description, 'Black');
    });
  });

  // ── 2. MongolianBreedLineage ──

  group('MongolianBreedLineage', () {
    test('has 7 values', () {
      expect(MongolianBreedLineage.values.length, 7);
    });

    test('displayName returns Mongolian labels', () {
      for (final l in MongolianBreedLineage.values) {
        expect(
          l.displayName,
          isNotEmpty,
          reason: '${l.name} has empty displayName',
        );
      }
      expect(MongolianBreedLineage.mongol.displayName, 'Монгол');
      expect(MongolianBreedLineage.galshar.displayName, 'Галшар');
      expect(MongolianBreedLineage.tes.displayName, 'Тэс');
      expect(MongolianBreedLineage.myangad.displayName, 'Мянгад');
      expect(MongolianBreedLineage.darkhad.displayName, 'Дархад');
      expect(MongolianBreedLineage.undurshil.displayName, 'Өндөршүл');
      expect(MongolianBreedLineage.gobiShankh.displayName, 'Говийн Шанх');
    });

    test('fromString parses valid values', () {
      expect(
        MongolianBreedLineage.fromString('mongol'),
        MongolianBreedLineage.mongol,
      );
      expect(
        MongolianBreedLineage.fromString('galshar'),
        MongolianBreedLineage.galshar,
      );
      expect(
        MongolianBreedLineage.fromString('tes'),
        MongolianBreedLineage.tes,
      );
      expect(
        MongolianBreedLineage.fromString('myangad'),
        MongolianBreedLineage.myangad,
      );
      expect(
        MongolianBreedLineage.fromString('darkhad'),
        MongolianBreedLineage.darkhad,
      );
      expect(
        MongolianBreedLineage.fromString('undurshil'),
        MongolianBreedLineage.undurshil,
      );
      expect(
        MongolianBreedLineage.fromString('gobiShankh'),
        MongolianBreedLineage.gobiShankh,
      );
    });

    test('fromString returns null for unknown', () {
      expect(MongolianBreedLineage.fromString('unknown'), isNull);
      expect(MongolianBreedLineage.fromString(''), isNull);
      expect(MongolianBreedLineage.fromString('arabian'), isNull);
    });

    test('region returns aimag names', () {
      expect(MongolianBreedLineage.galshar.region, 'Хэнтий аймаг');
      expect(MongolianBreedLineage.darkhad.region, 'Хөвсгөл аймаг');
      expect(MongolianBreedLineage.mongol.region, 'Улсын хэмжээнд');
    });

    test('description returns English descriptions', () {
      expect(MongolianBreedLineage.darkhad.description, contains('hardy'));
      expect(MongolianBreedLineage.galshar.description, contains('Racehorse'));
    });
  });

  // ── 3. HorseMarkings ──

  group('HorseMarkings', () {
    test('defaults', () {
      const m = HorseMarkings();
      expect(m.faceMarking, FaceMarking.none);
      expect(m.faceMarkingDescription, '');
      expect(m.legMarkings, isEmpty);
      expect(m.bodyMarkings, '');
    });

    test('fromJson roundtrip', () {
      final original = HorseMarkings(
        faceMarking: FaceMarking.blaze,
        faceMarkingDescription: 'Цагаан зураас',
        legMarkings: {
          'leftFront': LegMarking.stocking,
          'rightHind': LegMarking.sock,
        },
        bodyMarkings: 'Баруун ташаа',
      );
      final json = original.toJson();
      final restored = HorseMarkings.fromJson(json);

      expect(restored.faceMarking, original.faceMarking);
      expect(restored.faceMarkingDescription, original.faceMarkingDescription);
      expect(restored.legMarkings, original.legMarkings);
      expect(restored.bodyMarkings, original.bodyMarkings);
    });

    test('fromJson handles missing fields', () {
      final m = HorseMarkings.fromJson({});
      expect(m.faceMarking, FaceMarking.none);
      expect(m.faceMarkingDescription, '');
      expect(m.legMarkings, isEmpty);
      expect(m.bodyMarkings, '');
    });

    test('fromJson handles leg markings', () {
      final m = HorseMarkings.fromJson({
        'faceMarking': 'star',
        'faceMarkingDescription': 'Толбын од',
        'legMarkings': {
          'leftFront': 'stocking',
          'rightFront': 'pastern',
          'leftHind': 'none',
        },
        'bodyMarkings': 'Зүүн ташаа',
      });
      expect(m.faceMarking, FaceMarking.star);
      expect(m.legMarkings.length, 3);
      expect(m.legMarkings['leftFront'], LegMarking.stocking);
      expect(m.legMarkings['rightFront'], LegMarking.pastern);
      expect(m.legMarkings['leftHind'], LegMarking.none);
    });

    test('copyWith updates fields', () {
      const original = HorseMarkings(faceMarking: FaceMarking.none);
      final updated = original.copyWith(
        faceMarking: FaceMarking.strip,
        faceMarkingDescription: 'Зураас',
        bodyMarkings: 'Нуруун дээр',
      );
      expect(updated.faceMarking, FaceMarking.strip);
      expect(updated.faceMarkingDescription, 'Зураас');
      expect(updated.bodyMarkings, 'Нуруун дээр');
      // Unchanged fields remain default
      expect(updated.legMarkings, isEmpty);
    });

    test('equality — two identical markings are equal', () {
      const a = HorseMarkings(
        faceMarking: FaceMarking.snip,
        faceMarkingDescription: 'Толбо',
        bodyMarkings: 'Ташаа',
      );
      const b = HorseMarkings(
        faceMarking: FaceMarking.snip,
        faceMarkingDescription: 'Толбо',
        bodyMarkings: 'Ташаа',
      );
      expect(a, equals(b));
      expect(a.hashCode, b.hashCode);
    });

    test('inequality — different face marking', () {
      const a = HorseMarkings(faceMarking: FaceMarking.star);
      const b = HorseMarkings(faceMarking: FaceMarking.blaze);
      expect(a == b, false);
    });

    test('leg markings do not affect equality', () {
      const a = HorseMarkings(
        faceMarking: FaceMarking.star,
        legMarkings: {'leftFront': LegMarking.stocking},
      );
      const b = HorseMarkings(faceMarking: FaceMarking.star, legMarkings: {});
      // HorseMarkings equality only compares faceMarking, description, bodyMarkings
      expect(a, equals(b));
    });

    test('toJson preserves leg marking map', () {
      const m = HorseMarkings(
        faceMarking: FaceMarking.star,
        legMarkings: {
          'leftFront': LegMarking.stocking,
          'rightHind': LegMarking.coronet,
        },
      );
      final json = m.toJson();
      expect(json['legMarkings'], {
        'leftFront': 'stocking',
        'rightHind': 'coronet',
      });
    });

    test('FaceMarking fromString parses and defaults', () {
      expect(FaceMarking.fromString('star'), FaceMarking.star);
      expect(FaceMarking.fromString('blaze'), FaceMarking.blaze);
      expect(FaceMarking.fromString('unknown'), FaceMarking.none);
    });

    test('LegMarking fromString parses and defaults', () {
      expect(LegMarking.fromString('stocking'), LegMarking.stocking);
      expect(LegMarking.fromString('sock'), LegMarking.sock);
      expect(LegMarking.fromString('unknown'), LegMarking.none);
    });

    test('LegPosition fromString parses and defaults', () {
      expect(LegPosition.fromString('leftFront'), LegPosition.leftFront);
      expect(LegPosition.fromString('rightHind'), LegPosition.rightHind);
      expect(LegPosition.fromString('unknown'), LegPosition.leftFront);
    });

    test('FaceMarking displayName returns Mongolian labels', () {
      expect(FaceMarking.none.displayName, 'Үгүй');
      expect(FaceMarking.star.displayName, 'Од');
      expect(FaceMarking.blaze.displayName, 'Цагаан зураас');
    });

    test('LegMarking displayName returns Mongolian labels', () {
      expect(LegMarking.none.displayName, 'Үгүй');
      expect(LegMarking.stocking.displayName, 'Улгалga');
      expect(LegMarking.sock.displayName, 'Оймс');
    });

    test('LegPosition displayName returns Mongolian labels', () {
      expect(LegPosition.leftFront.displayName, 'Зүүн урд');
      expect(LegPosition.rightHind.displayName, 'Баруун хойд');
    });
  });

  // ── 4. Horse new fields serialization ──

  group('Horse new fields serialization', () {
    test('toJson includes all new fields', () {
      final horse = makeFullHorse();
      final json = horse.toJson();

      expect(json['sireId'], 'sire-1');
      expect(json['damId'], 'dam-1');
      expect(json['coatColor'], 'kheer');
      expect(json['breedLineage'], 'galshar');
      expect(json['region'], 'Хэнтий');
      expect(json['sum'], 'Галшар');
      expect(json['tamgaBrandClan'], 'Хүлэг');
      expect(json['tamgaBrandGeneration'], 3);
      expect(json['markings'], isA<Map>());
      expect(json['markings']!['faceMarking'], 'star');
      expect(json['markings']!['faceMarkingDescription'], 'Толбын од');
      expect(json['markings']!['bodyMarkings'], 'Зүүн ташаа дээр шалбарсан');
    });

    test('fromJson roundtrips new fields', () {
      final original = makeFullHorse();
      final json = original.toJson();
      final restored = Horse.fromJson(json);

      expect(restored.sireId, original.sireId);
      expect(restored.damId, original.damId);
      expect(restored.coatColor, original.coatColor);
      expect(restored.breedLineage, original.breedLineage);
      expect(restored.region, original.region);
      expect(restored.sum, original.sum);
      expect(restored.tamgaBrandClan, original.tamgaBrandClan);
      expect(restored.tamgaBrandGeneration, original.tamgaBrandGeneration);
      expect(restored.markings!.faceMarking, original.markings!.faceMarking);
      expect(
        restored.markings!.faceMarkingDescription,
        original.markings!.faceMarkingDescription,
      );
      expect(restored.markings!.legMarkings, original.markings!.legMarkings);
      expect(restored.markings!.bodyMarkings, original.markings!.bodyMarkings);
    });

    test('fromJson handles null new fields', () {
      final json = {
        'id': 'h1',
        'ownerId': 'o1',
        'name': 'Null Fields',
        'relationLabel': '',
        'gender': 'gelding',
        'coat': '',
        'birthYear': 2020,
        'awardCount': 0,
        'offspringCount': 0,
        'isOwnedByHousehold': true,
        'notes': '',
        'createdAt': '2025-01-01T00:00:00.000',
        'updatedAt': '2025-01-01T00:00:00.000',
        // All new fields omitted
      };
      final horse = Horse.fromJson(json);

      expect(horse.sireId, isNull);
      expect(horse.damId, isNull);
      expect(horse.coatColor, isNull);
      expect(horse.breedLineage, isNull);
      expect(horse.region, isNull);
      expect(horse.sum, isNull);
      expect(horse.tamgaBrandClan, isNull);
      expect(horse.tamgaBrandGeneration, isNull);
      expect(horse.markings, isNull);
    });

    test('fromSupabaseJson includes new fields with snake_case', () {
      final supabase = {
        'id': 'h1',
        'owner_id': 'o1',
        'name': 'Supabase Horse',
        'relation_label': '',
        'gender': 'stallion',
        'coat': 'Хээр',
        'birth_year': 2020,
        'award_count': 0,
        'offspring_count': 0,
        'is_owned_by_household': true,
        'notes': '',
        'created_at': '2025-01-01T00:00:00.000',
        'updated_at': '2025-01-01T00:00:00.000',
        'sire_id': 'sire-1',
        'dam_id': 'dam-1',
        'coat_color': 'kheer',
        'breed_lineage': 'galshar',
        'region': 'Хэнтий',
        'sum': 'Галшар',
        'tamga_brand_clan': 'Хүлэг',
        'tamga_brand_generation': 3,
        'markings': {
          'faceMarking': 'star',
          'faceMarkingDescription': 'Толбын од',
          'legMarkings': {'leftFront': 'stocking'},
          'bodyMarkings': 'Зүүн ташаа',
        },
      };
      final horse = Horse.fromSupabaseJson(supabase);

      expect(horse.sireId, 'sire-1');
      expect(horse.damId, 'dam-1');
      expect(horse.coatColor, MongolianCoatColor.kheer);
      expect(horse.breedLineage, MongolianBreedLineage.galshar);
      expect(horse.region, 'Хэнтий');
      expect(horse.sum, 'Галшар');
      expect(horse.tamgaBrandClan, 'Хүлэг');
      expect(horse.tamgaBrandGeneration, 3);
      expect(horse.markings!.faceMarking, FaceMarking.star);
      expect(horse.markings!.legMarkings['leftFront'], LegMarking.stocking);
    });

    test('toSupabaseJson includes new fields with snake_case', () {
      final horse = makeFullHorse();
      final supabase = horse.toSupabaseJson(ownerId: 'o1');

      expect(supabase['sire_id'], 'sire-1');
      expect(supabase['dam_id'], 'dam-1');
      expect(supabase['coat_color'], 'kheer');
      expect(supabase['breed_lineage'], 'galshar');
      expect(supabase['region'], 'Хэнтий');
      expect(supabase['sum'], 'Галшар');
      expect(supabase['tamga_brand_clan'], 'Хүлэг');
      expect(supabase['tamga_brand_generation'], 3);
      expect(supabase['markings'], isA<Map>());
      expect(supabase['markings']!['faceMarking'], 'star');
    });

    test('copyWith updates new fields', () {
      final original = makeFullHorse();
      final updated = original.copyWith(
        sireId: 'new-sire',
        damId: 'new-dam',
        coatColor: MongolianCoatColor.khuren,
        breedLineage: MongolianBreedLineage.darkhad,
        region: 'Хөвсгөл',
        sum: 'Төмөрбулаг',
        tamgaBrandClan: 'Алтан',
        tamgaBrandGeneration: 5,
        markings: const HorseMarkings(
          faceMarking: FaceMarking.blaze,
          bodyMarkings: 'Шинэ тэмдэг',
        ),
      );

      expect(updated.sireId, 'new-sire');
      expect(updated.damId, 'new-dam');
      expect(updated.coatColor, MongolianCoatColor.khuren);
      expect(updated.breedLineage, MongolianBreedLineage.darkhad);
      expect(updated.region, 'Хөвсгөл');
      expect(updated.sum, 'Төмөрбулаг');
      expect(updated.tamgaBrandClan, 'Алтан');
      expect(updated.tamgaBrandGeneration, 5);
      expect(updated.markings!.faceMarking, FaceMarking.blaze);
      expect(updated.markings!.bodyMarkings, 'Шинэ тэмдэг');
    });

    test('defaults for new fields are null/empty', () {
      final horse = Horse(
        id: 'h1',
        name: 'Minimal',
        gender: HorseGender.mare,
        createdAt: DateTime(2025, 1, 1),
        updatedAt: DateTime(2025, 1, 1),
      );

      expect(horse.sireId, isNull);
      expect(horse.damId, isNull);
      expect(horse.coatColor, isNull);
      expect(horse.breedLineage, isNull);
      expect(horse.region, isNull);
      expect(horse.sum, isNull);
      expect(horse.tamgaBrandClan, isNull);
      expect(horse.tamgaBrandGeneration, isNull);
      expect(horse.markings, isNull);
    });
  });

  // ── 5. Parent linkage ──

  group('Parent linkage', () {
    test('sireId and damId can be set and read', () {
      final horse = Horse(
        id: 'h1',
        name: 'Child',
        gender: HorseGender.foal,
        createdAt: DateTime(2025, 1, 1),
        updatedAt: DateTime(2025, 1, 1),
        sireId: 'sire-123',
        damId: 'dam-456',
      );
      expect(horse.sireId, 'sire-123');
      expect(horse.damId, 'dam-456');
    });

    test('parent linkage roundtrips through JSON', () {
      final original = Horse(
        id: 'h1',
        name: 'Roundtrip',
        gender: HorseGender.stallion,
        createdAt: DateTime(2025, 6, 15),
        updatedAt: DateTime(2025, 6, 15),
        sireId: 'sire-abc',
        damId: 'dam-xyz',
      );

      final json = original.toJson();
      final fromLocal = Horse.fromJson(json);
      expect(fromLocal.sireId, 'sire-abc');
      expect(fromLocal.damId, 'dam-xyz');

      final supabaseJson = original.toSupabaseJson(ownerId: 'o1');
      final fromSupa = Horse.fromSupabaseJson(supabaseJson);
      expect(fromSupa.sireId, 'sire-abc');
      expect(fromSupa.damId, 'dam-xyz');
    });

    test('sireId and damId default to null', () {
      final horse = Horse(
        id: 'h1',
        name: 'No Parents',
        gender: HorseGender.mare,
        createdAt: DateTime(2025, 1, 1),
        updatedAt: DateTime(2025, 1, 1),
      );
      expect(horse.sireId, isNull);
      expect(horse.damId, isNull);
    });

    test('copyWith can set and clear parent linkage', () {
      final base = Horse(
        id: 'h1',
        name: 'Base',
        gender: HorseGender.mare,
        createdAt: DateTime(2025, 1, 1),
        updatedAt: DateTime(2025, 1, 1),
        sireId: 'sire-old',
        damId: 'dam-old',
      );
      final updated = base.copyWith(sireId: 'sire-new', damId: null);
      expect(updated.sireId, 'sire-new');
      expect(updated.damId, isNull);
    });
  });
}
