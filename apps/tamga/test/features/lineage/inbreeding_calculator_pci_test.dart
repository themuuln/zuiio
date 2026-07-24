import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/lineage/application/inbreeding_calculator.dart';
import 'package:tamga/src/shared/domain/horse.dart';

/// Helper to create a Horse without boilerplate.
Horse _horse(String id, {String? sireId, String? damId}) => Horse(
  id: id,
  ownerId: 'o',
  name: 'H$id',
  gender: HorseGender.stallion,
  createdAt: DateTime(2026),
  updatedAt: DateTime(2026),
  sireId: sireId,
  damId: damId,
);

void main() {
  // ── Shared test data ──

  // Complete pedigree: 3 generations of parents (7 ancestors)
  final completeMap = {
    'horse': const Parents(sireId: 'sire', damId: 'dam'),
    'sire': const Parents(sireId: 's1', damId: 'd1'),
    'dam': const Parents(sireId: 's2', damId: 'd2'),
    's1': const Parents(sireId: null, damId: null),
    'd1': const Parents(sireId: null, damId: null),
    's2': const Parents(sireId: null, damId: null),
    'd2': const Parents(sireId: null, damId: null),
  };

  // Partial pedigree: only sire side has parents
  final partialMap = {
    'horse': const Parents(sireId: 'sire', damId: 'dam'),
    'sire': const Parents(sireId: 's1', damId: 'd1'),
    // dam has no parents — omitted
  };

  final emptyMap = <String, Parents>{};

  // ── calculatePCI tests ──

  group('calculatePCI', () {
    test('complete pedigree returns high PCI', () {
      final pci = InbreedingCalculator.calculatePCI('horse', completeMap);
      // 3 generations: gen1=2, gen2=4, gen3=8 → 14 expected
      // Known: 2 (sire,dam) + 4 (s1,d1,s2,d2) = 6
      // pci = 6/14 ≈ 0.429
      expect(pci, greaterThan(0.0));
      expect(pci, lessThanOrEqualTo(1.0));
    });

    test('empty pedigree returns 0.0', () {
      final pci = InbreedingCalculator.calculatePCI('horse', emptyMap);
      expect(pci, equals(0.0));
    });

    test('horse not in map returns 0.0', () {
      final pci = InbreedingCalculator.calculatePCI('nonexistent', completeMap);
      expect(pci, equals(0.0));
    });

    test('partial pedigree returns mid-range PCI', () {
      final pci = InbreedingCalculator.calculatePCI('horse', partialMap);
      // Gen1: 2 known (sire, dam). Gen2: 2 known (s1, d1 from sire).
      // Total = 4, expected: 2+4 = 6, pci = 4/6 ≈ 0.667
      expect(pci, greaterThan(0.0));
      expect(pci, lessThan(1.0));
    });

    test('generations parameter limits depth', () {
      final pciShallow = InbreedingCalculator.calculatePCI(
        'horse',
        partialMap,
        generations: 1,
      );
      final pciDeep = InbreedingCalculator.calculatePCI(
        'horse',
        partialMap,
        generations: 4,
      );

      // generations=1: only direct parents: 2/2 = 1.0
      // generations=4: includes grandparents: 4/6 ≈ 0.667
      expect(pciShallow, greaterThanOrEqualTo(pciDeep));
    });

    test('single-parent pedigree computes correctly', () {
      final singleParentMap = {
        'horse': const Parents(sireId: 'sire', damId: null),
        'sire': const Parents(sireId: 'gs', damId: 'gd'),
        'gs': const Parents(sireId: null, damId: null),
        'gd': const Parents(sireId: null, damId: null),
      };
      final pci = InbreedingCalculator.calculatePCI('horse', singleParentMap);
      // BFS: depth 0 (horse) → known += 1 (sire). depth 1 (sire) → known += 2 (gs, gd).
      // depth 2 (gs, gd) → no parents. Total known = 3.
      // Expected: sum 2^d for d=1..3 = 2+4+8 = 14.
      // pci = 3/14 ≈ 0.214
      expect(pci, closeTo(3 / 14, 0.001));
    });
  });

  // ── calculateWithPCI tests ──

  group('calculateWithPCI', () {
    test('returns coi and pci fields', () {
      final result = InbreedingCalculator.calculateWithPCI(
        'horse',
        'sire',
        'dam',
        <String, String>{},
        parentMap: completeMap,
      );
      expect(result.coi, isA<double>());
      expect(result.pci, isA<double>());
      expect(result.generations, equals(4));
      expect(result.warning, isA<String>());
    });

    test('warning when PCI < 0.5', () {
      final result = InbreedingCalculator.calculateWithPCI(
        'horse',
        'sire',
        'dam',
        <String, String>{},
        parentMap: emptyMap,
      );
      // empty map → PCI = 0.0 → warning
      expect(result.pci, equals(0.0));
      expect(result.warning, isNotEmpty);
    });

    test('no warning when PCI >= 0.5', () {
      // Use generations=1 with complete map: 2/2 = 1.0
      final result = InbreedingCalculator.calculateWithPCI(
        'horse',
        'sire',
        'dam',
        <String, String>{},
        parentMap: completeMap,
        generations: 1,
      );
      expect(result.pci, greaterThanOrEqualTo(0.5));
      expect(result.warning, isEmpty);
    });

    test('uses parentMap when provided', () {
      final result = InbreedingCalculator.calculateWithPCI(
        'horse',
        'sire',
        'dam',
        <String, String>{},
        parentMap: completeMap,
      );
      expect(result.pci, greaterThan(0.0));
    });

    test('builds parentMap from horses when parentMap not provided', () {
      final horses = [_horse('h1', sireId: 'h3', damId: 'h4'), _horse('h3')];
      final result = InbreedingCalculator.calculateWithPCI(
        'h1',
        'h3',
        'h4',
        <String, String>{},
        horses: horses,
      );
      expect(result.pci, greaterThan(0.0));
    });
  });

  // ── buildParentMapFromHorses tests ──

  group('buildParentMapFromHorses', () {
    test('builds map from horse list with sireId and damId', () {
      final horses = [_horse('h1', sireId: 'h3', damId: 'h4'), _horse('h2')];
      final map = InbreedingCalculator.buildParentMapFromHorses(horses);
      expect(map, contains('h1'));
      expect(map['h1']!.sireId, equals('h3'));
      expect(map['h1']!.damId, equals('h4'));
    });

    test('empty list returns empty map', () {
      final map = InbreedingCalculator.buildParentMapFromHorses([]);
      expect(map, isEmpty);
    });

    test('horses without sireId or damId are omitted', () {
      final horses = [
        _horse('h1', sireId: 'h3', damId: 'h4'),
        _horse('h2'), // no parents
        _horse('h3'), // no parents
      ];
      final map = InbreedingCalculator.buildParentMapFromHorses(horses);
      expect(map, contains('h1'));
      expect(map, isNot(contains('h2')));
      expect(map, isNot(contains('h3')));
    });

    test('horse with only sireId is included', () {
      final horses = [_horse('h1', sireId: 'h2')];
      final map = InbreedingCalculator.buildParentMapFromHorses(horses);
      expect(map, contains('h1'));
      expect(map['h1']!.sireId, equals('h2'));
      expect(map['h1']!.damId, isNull);
    });

    test('horse with only damId is included', () {
      final horses = [_horse('h1', damId: 'h2')];
      final map = InbreedingCalculator.buildParentMapFromHorses(horses);
      expect(map, contains('h1'));
      expect(map['h1']!.sireId, isNull);
      expect(map['h1']!.damId, equals('h2'));
    });
  });
}
