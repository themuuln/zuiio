import 'package:flutter_test/flutter_test.dart';
import 'package:isar/isar.dart';
import 'package:tamga/src/core/storage/isar_database.dart';
import 'package:tamga/src/features/lineage/domain/lineage_root.dart';
import 'package:tamga/src/features/lineage/domain/lineage_snapshot.dart';
import 'package:tamga/src/features/lineage/domain/lineage_timeline_entry.dart';
import 'package:tamga/src/features/lineage/domain/lineage_tree_edge.dart';
import 'package:tamga/src/features/lineage/domain/lineage_tree_node.dart';
import 'package:tamga/src/features/shared/data/isar_schemas/isar_lineage_root.dart';
import 'package:tamga/src/features/shared/data/isar_schemas/isar_lineage_snapshot.dart';
import 'package:tamga/src/features/shared/data/isar_schemas/isar_lineage_tree_node.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';
import 'package:tamga/src/shared/domain/horse.dart';

import '../../helpers/test_helpers.dart';

void main() {
  // ── IsarLineageRoot ─────────────────────────────────────────────────

  group('IsarLineageRoot', () {
    final sampleRoot = LineageRoot(
      id: 'test-root',
      name: 'Туршилт Морь',
      coat: 'Хээр',
      birthYear: 2015,
      offspringCount: 10,
      awardCount: 5,
      notes: 'Туршилтын тэмдэглэл',
    );

    test('fromDomain creates IsarLineageRoot from domain model', () {
      final isar = IsarLineageRoot.fromDomain(sampleRoot);

      expect(isar.domainId, 'test-root');
      expect(isar.name, 'Туршилт Морь');
      expect(isar.coat, 'Хээр');
      expect(isar.birthYear, 2015);
      expect(isar.offspringCount, 10);
      expect(isar.awardCount, 5);
      expect(isar.notes, 'Туршилтын тэмдэглэл');
    });

    test('toDomain converts back to domain model', () {
      final isar = IsarLineageRoot.fromDomain(sampleRoot);
      final domain = isar.toDomain();

      expect(domain.id, sampleRoot.id);
      expect(domain.name, sampleRoot.name);
      expect(domain.coat, sampleRoot.coat);
      expect(domain.birthYear, sampleRoot.birthYear);
      expect(domain.offspringCount, sampleRoot.offspringCount);
      expect(domain.awardCount, sampleRoot.awardCount);
      expect(domain.notes, sampleRoot.notes);
    });

    test('roundtrip preserves all fields', () {
      final isar = IsarLineageRoot.fromDomain(sampleRoot);
      final domain = isar.toDomain();
      final isar2 = IsarLineageRoot.fromDomain(domain);

      expect(isar2.domainId, isar.domainId);
      expect(isar2.name, isar.name);
      expect(isar2.coat, isar.coat);
      expect(isar2.birthYear, isar.birthYear);
      expect(isar2.offspringCount, isar.offspringCount);
      expect(isar2.awardCount, isar.awardCount);
      expect(isar2.notes, isar.notes);
    });

    test('IsarLineageRoot has @collection annotation and Id field', () {
      // Verify the class is usable with Isar by checking it has an Id field
      final isar = IsarLineageRoot();
      expect(isar.id, isA<Id>());
    });
  });

  // ── IsarLineageTreeNode ──────────────────────────────────────────────

  group('IsarLineageTreeNode', () {
    final sampleNode = LineageTreeNode(
      id: 'test-node',
      name: 'Туршилт Заан',
      relationLabel: 'Эцэг',
      coat: 'Хонгор',
      birthYear: 2008,
      awardCount: 3,
      offspringCount: 7,
      isOwnedByHousehold: true,
      generation: -1,
      branchOrder: 0,
      sortOrder: 0,
      isRoot: false,
      hiddenBranchCount: 0,
      photoUrl: 'http://example.com/photo.jpg',
      sex: 'stallion',
      tamgaNo: 'ТЗ-001',
      region: 'Төв аймаг',
      speedIndex: 11.5,
    );

    test('fromDomain creates IsarLineageTreeNode from domain model', () {
      final isar = IsarLineageTreeNode.fromDomain(sampleNode, rootId: 'root-1');

      expect(isar.domainId, 'test-node');
      expect(isar.rootId, 'root-1');
      expect(isar.name, 'Туршилт Заан');
      expect(isar.relationLabel, 'Эцэг');
      expect(isar.coat, 'Хонгор');
      expect(isar.birthYear, 2008);
      expect(isar.awardCount, 3);
      expect(isar.offspringCount, 7);
      expect(isar.isOwnedByHousehold, isTrue);
      expect(isar.generation, -1);
      expect(isar.branchOrder, 0);
      expect(isar.sortOrder, 0);
      expect(isar.isRoot, isFalse);
      expect(isar.hiddenBranchCount, 0);
      expect(isar.photoUrl, 'http://example.com/photo.jpg');
      expect(isar.sex, 'stallion');
      expect(isar.tamgaNo, 'ТЗ-001');
      expect(isar.region, 'Төв аймаг');
      expect(isar.speedIndex, 11.5);
    });

    test('toDomain converts back to domain model', () {
      final isar = IsarLineageTreeNode.fromDomain(sampleNode, rootId: 'root-1');
      final domain = isar.toDomain();

      expect(domain.id, sampleNode.id);
      expect(domain.name, sampleNode.name);
      expect(domain.relationLabel, sampleNode.relationLabel);
      expect(domain.coat, sampleNode.coat);
      expect(domain.birthYear, sampleNode.birthYear);
      expect(domain.awardCount, sampleNode.awardCount);
      expect(domain.offspringCount, sampleNode.offspringCount);
      expect(domain.isOwnedByHousehold, sampleNode.isOwnedByHousehold);
      expect(domain.generation, sampleNode.generation);
      expect(domain.branchOrder, sampleNode.branchOrder);
      expect(domain.sortOrder, sampleNode.sortOrder);
      expect(domain.isRoot, sampleNode.isRoot);
      expect(domain.hiddenBranchCount, sampleNode.hiddenBranchCount);
      expect(domain.photoUrl, sampleNode.photoUrl);
      expect(domain.sex, sampleNode.sex);
      expect(domain.tamgaNo, sampleNode.tamgaNo);
      expect(domain.region, sampleNode.region);
      expect(domain.speedIndex, sampleNode.speedIndex);
    });

    test('roundtrip preserves rootId', () {
      final isar = IsarLineageTreeNode.fromDomain(
        sampleNode,
        rootId: 'root-42',
      );
      expect(isar.rootId, 'root-42');

      final domain = isar.toDomain();
      final isar2 = IsarLineageTreeNode.fromDomain(domain, rootId: 'root-42');
      expect(isar2.rootId, 'root-42');
    });
  });

  // ── IsarLineageSnapshot ──────────────────────────────────────────────

  group('IsarLineageSnapshot', () {
    final sampleRoot = LineageRoot(
      id: 'snapshot-root',
      name: 'Гэрэлт Хүлэг',
      coat: 'Цагаан',
      birthYear: 2010,
      offspringCount: 15,
      awardCount: 8,
      notes: 'Гол азарга',
    );

    final sampleNodes = [
      LineageTreeNode(
        id: 'parent-1',
        name: 'Эцэг Морь',
        relationLabel: 'Эцэг / Sire',
        coat: 'Хээр',
        birthYear: 2004,
        awardCount: 5,
        offspringCount: 20,
        isOwnedByHousehold: false,
        generation: -1,
        branchOrder: 0,
        sortOrder: 0,
        sex: 'stallion',
      ),
      LineageTreeNode(
        id: 'child-1',
        name: 'Үр Морь',
        relationLabel: 'Үр / Offspring',
        coat: 'Хүрэн',
        birthYear: 2016,
        awardCount: 2,
        offspringCount: 3,
        isOwnedByHousehold: true,
        generation: 1,
        branchOrder: 0,
        sortOrder: 0,
        sex: 'gelding',
      ),
    ];

    final sampleEdges = [
      LineageTreeEdge(
        fromId: 'parent-1',
        toId: 'snapshot-root',
        type: LineageTreeRelationType.sire,
      ),
      LineageTreeEdge(
        fromId: 'snapshot-root',
        toId: 'child-1',
        type: LineageTreeRelationType.offspring,
      ),
    ];

    final sampleRelatedHorses = [
      Horse(
        id: 'parent-1',
        name: 'Эцэг Морь',
        relationLabel: 'Эцэг',
        coat: 'Хээр',
        birthYear: 2004,
        awardCount: 5,
        offspringCount: 20,
        isOwnedByHousehold: false,
        notes: 'Тэмдэглэл',
        gender: HorseGender.stallion,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
    ];

    final sampleTimeline = [
      LineageTimelineEntry(
        year: 2010,
        title: 'Төрсөн / Born',
        description: 'Гэрэлт Хүлэг төрсөн.',
      ),
      LineageTimelineEntry(
        year: 2016,
        title: 'Үр удам / Offspring',
        description: 'Үр Морь төрсөн.',
      ),
    ];

    final sampleSnapshot = LineageSnapshot(
      root: sampleRoot,
      treeSummary: 'Гэрэлт Хүлэгийн шугамд 2 морь бүртгэгдсэн.',
      treeNodes: sampleNodes,
      treeEdges: sampleEdges,
      relatedHorses: sampleRelatedHorses,
      timeline: sampleTimeline,
    );

    test('fromDomain creates IsarLineageSnapshot from domain model', () {
      final isar = IsarLineageSnapshot.fromDomain(sampleSnapshot);

      expect(isar.rootId, 'snapshot-root');
      expect(isar.treeSummary, contains('Гэрэлт Хүлэгийн шугамд'));
      expect(isar.treeNodesJson, isNotEmpty);
      expect(isar.treeEdgesJson, isNotEmpty);
      expect(isar.relatedHorsesJson, isNotEmpty);
      expect(isar.timelineJson, isNotEmpty);
    });

    test('toDomain converts back preserving all data', () {
      final isar = IsarLineageSnapshot.fromDomain(sampleSnapshot);
      final domain = isar.toDomain(root: sampleRoot);

      expect(domain.root.id, 'snapshot-root');
      expect(domain.treeSummary, sampleSnapshot.treeSummary);
      expect(domain.treeNodes.length, 2);
      expect(domain.treeEdges.length, 2);
      expect(domain.relatedHorses.length, 1);
      expect(domain.timeline.length, 2);
    });

    test('toDomain preserves node data correctly', () {
      final isar = IsarLineageSnapshot.fromDomain(sampleSnapshot);
      final domain = isar.toDomain(root: sampleRoot);

      final parentNode = domain.treeNodes.firstWhere((n) => n.id == 'parent-1');
      expect(parentNode.name, 'Эцэг Морь');
      expect(parentNode.generation, -1);
      expect(parentNode.sex, 'stallion');

      final childNode = domain.treeNodes.firstWhere((n) => n.id == 'child-1');
      expect(childNode.name, 'Үр Морь');
      expect(childNode.generation, 1);
    });

    test('toDomain preserves edge data correctly', () {
      final isar = IsarLineageSnapshot.fromDomain(sampleSnapshot);
      final domain = isar.toDomain(root: sampleRoot);

      final sireEdge = domain.treeEdges.firstWhere(
        (e) => e.type == LineageTreeRelationType.sire,
      );
      expect(sireEdge.fromId, 'parent-1');
      expect(sireEdge.toId, 'snapshot-root');

      final offspringEdge = domain.treeEdges.firstWhere(
        (e) => e.type == LineageTreeRelationType.offspring,
      );
      expect(offspringEdge.fromId, 'snapshot-root');
      expect(offspringEdge.toId, 'child-1');
    });

    test('toDomain preserves related horses and timeline', () {
      final isar = IsarLineageSnapshot.fromDomain(sampleSnapshot);
      final domain = isar.toDomain(root: sampleRoot);

      expect(domain.relatedHorses.length, 1);
      expect(domain.relatedHorses.first.id, 'parent-1');

      expect(domain.timeline.length, 2);
      expect(domain.timeline.first.year, 2010);
      expect(domain.timeline.last.year, 2016);
    });

    test('empty lists are handled correctly', () {
      final emptySnapshot = LineageSnapshot(
        root: sampleRoot,
        treeSummary: 'No data',
        treeNodes: const [],
        treeEdges: const [],
        relatedHorses: const [],
        timeline: const [],
      );

      final isar = IsarLineageSnapshot.fromDomain(emptySnapshot);
      final domain = isar.toDomain(root: sampleRoot);

      expect(domain.treeNodes, isEmpty);
      expect(domain.treeEdges, isEmpty);
      expect(domain.relatedHorses, isEmpty);
      expect(domain.timeline, isEmpty);
    });

    test('cachedAt timestamp is set on creation', () {
      final before = DateTime.now();
      final isar = IsarLineageSnapshot.fromDomain(sampleSnapshot);
      final after = DateTime.now();

      expect(isar.cachedAt.isAfter(before), isTrue);
      expect(
        isar.cachedAt.isBefore(after) || isar.cachedAt.isAtSameMomentAs(after),
        isTrue,
      );
    });
  });

  // ── Isar persistence (integration with actual database) ────────────

  group('Isar persistence', () {
    setUp(() async {
      await setupTestEnvironment();
      await IsarDatabase.initialize();
    });

    tearDown(() async {
      await IsarDatabase.close();
    });

    test('IsarLineageRoot can be stored and retrieved', () async {
      final storage = IsarStorage.instance;

      final isarRoot = IsarLineageRoot.fromDomain(
        LineageRoot(
          id: 'persist-root',
          name: 'Байнгын Морь',
          coat: 'Бор',
          birthYear: 2018,
          offspringCount: 5,
          awardCount: 2,
          notes: 'Байнгын тэмдэглэл',
        ),
      );

      await storage.lineageRoots.isar.writeTxn(() async {
        await storage.lineageRoots.put(isarRoot);
      });

      final retrieved = await storage.lineageRoots
          .filter()
          .domainIdEqualTo('persist-root')
          .findFirst();

      expect(retrieved, isNotNull);
      expect(retrieved!.toDomain().name, 'Байнгын Морь');
      expect(retrieved.toDomain().birthYear, 2018);
    });

    test('IsarLineageTreeNode can be stored and queried by rootId', () async {
      final storage = IsarStorage.instance;

      final node = IsarLineageTreeNode()
        ..domainId = 'node-1'
        ..rootId = 'root-a'
        ..name = 'Зангилаа'
        ..relationLabel = 'Эцэг'
        ..coat = 'Хээр'
        ..birthYear = 2010
        ..awardCount = 3
        ..offspringCount = 5
        ..isOwnedByHousehold = true
        ..generation = -1
        ..branchOrder = 0
        ..sortOrder = 0
        ..isRoot = false
        ..hiddenBranchCount = 0;

      await storage.lineageRoots.isar.writeTxn(() async {
        await storage.lineageTreeNodes.put(node);
      });

      final byRoot = await storage.lineageTreeNodes
          .filter()
          .rootIdEqualTo('root-a')
          .findAll();

      expect(byRoot.length, 1);
      expect(byRoot.first.domainId, 'node-1');
    });

    test('IsarLineageSnapshot can be stored and retrieved', () async {
      final storage = IsarStorage.instance;

      final snapshot = IsarLineageSnapshot()
        ..rootId = 'snap-root'
        ..treeSummary = 'Test summary'
        ..treeNodesJson = '[]'
        ..treeEdgesJson = '[]'
        ..relatedHorsesJson = '[]'
        ..timelineJson = '[]'
        ..cachedAt = DateTime.now();

      await storage.lineageRoots.isar.writeTxn(() async {
        await storage.lineageSnapshots.put(snapshot);
      });

      final retrieved = await storage.lineageSnapshots
          .filter()
          .rootIdEqualTo('snap-root')
          .findFirst();

      expect(retrieved, isNotNull);
      expect(retrieved!.treeSummary, 'Test summary');
      expect(retrieved.cachedAt, isNotNull);
    });

    test('Schemas are registered in IsarDatabase', () async {
      // If these work, the schemas are registered
      final storage = IsarStorage.instance;

      // All three collections should exist
      expect(storage.lineageRoots, isNotNull);
      expect(storage.lineageTreeNodes, isNotNull);
      expect(storage.lineageSnapshots, isNotNull);
    });
  });
}
