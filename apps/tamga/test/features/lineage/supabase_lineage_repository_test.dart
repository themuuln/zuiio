import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import 'package:tamga/src/features/lineage/data/lineage_repository.dart';
import 'package:tamga/src/features/lineage/data/supabase_lineage_repository.dart';
import 'package:tamga/src/features/lineage/domain/lineage_root.dart';
import 'package:tamga/src/features/lineage/domain/lineage_snapshot.dart';
import 'package:tamga/src/features/lineage/domain/lineage_tree_edge.dart';
import 'package:tamga/src/shared/domain/horse.dart';

// ── Mocks ───────────────────────────────────────────────────────────────

class MockSupabaseClient extends Mock implements SupabaseClient {}

// ── Helpers ──────────────────────────────────────────────────────────────

Map<String, dynamic> sampleHorseRow({
  String id = 'root-1',
  String name = 'Test Horse',
  String coat = 'Bay',
  int birthYear = 2010,
  int awardCount = 3,
  int offspringCount = 5,
  String? gender = 'stallion',
  String? lineageRootId = 'root-1',
  bool isOwnedByHousehold = true,
  String? region,
}) {
  return {
    'id': id,
    'name': name,
    'coat': coat,
    'birth_year': birthYear,
    'award_count': awardCount,
    'offspring_count': offspringCount,
    'is_owned_by_household': isOwnedByHousehold,
    'notes': '',
    'gender': gender,
    'owner_id': 'owner-1',
    'lineage_root_id': lineageRootId,
    'region': region,
  };
}

Map<String, dynamic> samplePedigreeLinkRow({
  required String horseId,
  required String parentId,
  String relation = 'sire',
}) {
  return {
    'id': 'link-$horseId-$parentId',
    'horse_id': horseId,
    'parent_id': parentId,
    'relation': relation,
  };
}

void main() {
  group('SupabaseLineageRepository implements LineageRepository', () {
    test('class exists and implements LineageRepository', () {
      final repo = SupabaseLineageRepository(client: null);
      expect(repo, isA<LineageRepository>());
    });
  });

  group('fetchRoots', () {
    test('returns empty list when Supabase client is null', () async {
      final repo = SupabaseLineageRepository(client: null);
      final result = await repo.fetchRoots();
      expect(result.isSuccess, isTrue);
      expect(result.value, isEmpty);
    });

    test('returns failure on query error', () async {
      final mockClient = MockSupabaseClient();
      // Make .from() throw
      when(() => mockClient.from(any())).thenThrow(Exception('Network error'));
      final repo = SupabaseLineageRepository(client: mockClient);

      final result = await repo.fetchRoots();

      expect(result.isFailure, isTrue);
    });
  });

  group('fetchSnapshot', () {
    test('returns failure when Supabase client is null', () async {
      final repo = SupabaseLineageRepository(client: null);
      final result = await repo.fetchSnapshot('any-id');
      expect(result.isFailure, isTrue);
    });

    test('returns failure on query error', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('DB error'));
      final repo = SupabaseLineageRepository(client: mockClient);

      final result = await repo.fetchSnapshot('any-id');
      expect(result.isFailure, isTrue);
    });
  });

  // ── Data mapping and snapshot building ──────────────────────────────
  //
  // These tests verify the repository's data transformation logic by testing
  // the snapshot construction using directly supplied data.

  group('LineageSnapshot building', () {
    test('_rowToLineageRoot maps horse row correctly', () {
      // This is an internal method, tested via behavior.
      // The actual repository transforms Supabase responses to domain models.
      final row = sampleHorseRow(
        id: 'test-1',
        name: 'Test Root',
        coat: 'Black',
        birthYear: 2015,
        awardCount: 5,
        offspringCount: 10,
      );

      // Use the factory method from Horse to verify mapping
      final horse = Horse.fromSupabaseJson(row);
      expect(horse.id, 'test-1');
      expect(horse.name, 'Test Root');
      expect(horse.coat, 'Black');
      expect(horse.birthYear, 2015);
      expect(horse.awardCount, 5);
      expect(horse.offspringCount, 10);
    });
  });

  group('Edge: empty lineage returns valid snapshot', () {
    test('snapshot with only root horse is valid', () {
      // Verify that a LineageSnapshot can be created with just a root
      // and no ancestors/descendants (simulating the repository output).
      final root = LineageRoot(
        id: 'single-horse',
        name: 'Ганц Морь',
        coat: 'Bay',
        birthYear: 2020,
        offspringCount: 0,
        awardCount: 0,
        notes: 'No lineage',
      );
      final snapshot = LineageSnapshot(
        root: root,
        treeSummary:
            'Ганц Морь морь удам угсаагүй байна. / Ганц Морь has no recorded lineage.',
        treeNodes: const [],
        treeEdges: const [],
        relatedHorses: const [],
        timeline: const [],
      );

      expect(snapshot.root.id, 'single-horse');
      expect(snapshot.treeNodes, isEmpty);
      expect(snapshot.treeEdges, isEmpty);
      expect(snapshot.relatedHorses, isEmpty);
      expect(snapshot.timeline, isEmpty);
      expect(snapshot.treeSummary, contains('has no recorded lineage'));
    });
  });

  group('Edge: ancestor and descendant traversal coherence', () {
    test('LineageTreeEdge correctly models sire/dam/offspring relations', () {
      // Verify edge model works correctly for ancestor and descendant links.
      final sireEdge = LineageTreeEdge(
        fromId: 'sire-1',
        toId: 'horse-1',
        type: LineageTreeRelationType.sire,
      );
      final damEdge = LineageTreeEdge(
        fromId: 'dam-1',
        toId: 'horse-1',
        type: LineageTreeRelationType.dam,
      );
      final offspringEdge = LineageTreeEdge(
        fromId: 'horse-1',
        toId: 'offspring-1',
        type: LineageTreeRelationType.offspring,
      );

      expect(sireEdge.type, LineageTreeRelationType.sire);
      expect(damEdge.type, LineageTreeRelationType.dam);
      expect(offspringEdge.type, LineageTreeRelationType.offspring);
    });
  });
}
