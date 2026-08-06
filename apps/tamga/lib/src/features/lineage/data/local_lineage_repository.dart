import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:isar/isar.dart';

import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../../core/sync/sync_queue.dart';
import '../../../shared/domain/horse.dart';
import '../../shared/data/isar_storage.dart';
import '../../shared/data/isar_sync_storage.dart';
import '../../shared/data/isar_schemas/isar_lineage_root.dart';
import '../../shared/data/isar_schemas/isar_lineage_snapshot.dart';
import '../../shared/data/isar_schemas/isar_lineage_tree_node.dart';
import '../domain/lineage_root.dart';
import '../domain/lineage_snapshot.dart';
import '../domain/lineage_timeline_entry.dart';
import '../domain/lineage_tree_edge.dart';
import '../domain/lineage_tree_node.dart';
import 'lineage_repository.dart';

/// Isar-backed local implementation of [LineageRepository].
///
/// Stores lineage roots, snapshots, and tree nodes in Isar for offline access.
/// Mutations (addParentLink, removeParentLink, updateHorseLineageInfo) are
/// persisted to Isar immediately and then enqueued in [SyncQueue] for sync.
///
/// When online, the provider should prefer [SupabaseLineageRepository] and
/// cache results back to this repository for offline availability.
class LocalLineageRepository implements LineageRepository {
  LocalLineageRepository({
    required IsarStorage storage,
    required SyncQueue syncQueue,
    IsarSyncStorage? syncStorage,
  }) : _storage = storage,
       _syncQueue = syncQueue,
       _syncStorage = syncStorage;

  final IsarStorage _storage;
  final SyncQueue _syncQueue;
  final IsarSyncStorage? _syncStorage;

  /// Persist the sync intent to the durable queue (no-op when not wired).
  void _enqueueAndPersist(SyncQueueItem item) {
    _syncQueue.enqueue(item);
    final store = _syncStorage;
    if (store == null) return;
    unawaited(() async {
      try {
        await store.enqueue(item);
      } catch (e) {
        debugPrint('[lineage] Failed to persist queue item: $e');
      }
    }());
  }

  // ── Seed Data ──────────────────────────────────────────────────────

  /// Seed data used for the first-ever initialization.
  /// Only populated when the database is empty.
  static const _seedRoots = [
    LineageRoot(
      id: 'khan-khuleg',
      name: 'Хан Хүлэг',
      coat: 'Хээр',
      birthYear: 2012,
      offspringCount: 18,
      awardCount: 7,
      notes: 'Өрхийн гол азарганы шугам. Удмын модны үндсэн язгуур.',
    ),
    LineageRoot(
      id: 'tsagaan-salkhi',
      name: 'Цагаан Салхи',
      coat: 'Цагаан',
      birthYear: 2016,
      offspringCount: 9,
      awardCount: 4,
      notes: 'Гаднах удамтай холбогдсон хоёрдогч язгуур.',
    ),
  ];

  /// Seed snapshots keyed by root id.
  /// Only used when the database is empty.
  static final Map<String, LineageSnapshot> _seedSnapshots = {
    'khan-khuleg': LineageSnapshot(
      root: _seedRoots.first,
      treeSummary:
          'Хан Хүлэгийн шугамд өрхийн 11 морь, гаднах холбоотой 7 морь бүртгэгдсэн байна. Энэ root дээрээс 4 гол салааг tree view-д дэлгэж харах боломжтой.',
      treeNodes: const [
        LineageTreeNode(
          id: 'tenger-khuleg',
          name: 'Тэнгэр Хүлэг',
          relationLabel: 'Эцэг',
          coat: 'Хонгор',
          birthYear: 2006,
          awardCount: 6,
          offspringCount: 12,
          isOwnedByHousehold: false,
          generation: -1,
          branchOrder: 0,
          sortOrder: 0,
          sex: 'stallion',
          tamgaNo: 'ТЭ-001',
          region: 'Төв аймаг',
        ),
        LineageTreeNode(
          id: 'khuren-guu',
          name: 'Хүрэн Гүү',
          relationLabel: 'Эх',
          coat: 'Хүрэн',
          birthYear: 2008,
          awardCount: 2,
          offspringCount: 7,
          isOwnedByHousehold: true,
          generation: -1,
          branchOrder: 1,
          sortOrder: 0,
          sex: 'mare',
          region: 'Төв аймаг',
        ),
        LineageTreeNode(
          id: 'altan-shuurga',
          name: 'Алтан Шуурга',
          relationLabel: 'Хүү',
          coat: 'Хээр',
          birthYear: 2018,
          awardCount: 3,
          offspringCount: 5,
          isOwnedByHousehold: true,
          generation: 1,
          branchOrder: 0,
          sortOrder: 0,
          hiddenBranchCount: 2,
          sex: 'gelding',
          tamgaNo: 'АШ-003',
          region: 'Төв аймаг',
          speedIndex: 11.9,
        ),
        LineageTreeNode(
          id: 'uulen-bor',
          name: 'Үүлэн Бор',
          relationLabel: 'Охин',
          coat: 'Бор',
          birthYear: 2019,
          awardCount: 2,
          offspringCount: 2,
          isOwnedByHousehold: true,
          generation: 1,
          branchOrder: 1,
          sortOrder: 0,
          sex: 'mare',
          region: 'Төв аймаг',
        ),
        LineageTreeNode(
          id: 'shandas-gal',
          name: 'Шандас Гал',
          relationLabel: 'Хүү',
          coat: 'Хүрэн',
          birthYear: 2020,
          awardCount: 1,
          offspringCount: 1,
          isOwnedByHousehold: false,
          generation: 1,
          branchOrder: 2,
          sortOrder: 0,
          sex: 'gelding',
          region: 'Булган аймаг',
        ),
        LineageTreeNode(
          id: 'khukh-suld',
          name: 'Хөх Сүлд',
          relationLabel: 'Ач',
          coat: 'Хөх',
          birthYear: 2022,
          awardCount: 1,
          offspringCount: 0,
          isOwnedByHousehold: false,
          generation: 2,
          branchOrder: 0,
          sortOrder: 0,
          sex: 'gelding',
          region: 'Сэлэнгэ аймаг',
        ),
        LineageTreeNode(
          id: 'saaral-tenkhee',
          name: 'Саарал Тэнхээ',
          relationLabel: 'Зээ',
          coat: 'Саарал',
          birthYear: 2023,
          awardCount: 0,
          offspringCount: 0,
          isOwnedByHousehold: true,
          generation: 2,
          branchOrder: 1,
          sortOrder: 0,
        ),
      ],
      treeEdges: const [
        LineageTreeEdge(
          fromId: 'tenger-khuleg',
          toId: 'khan-khuleg',
          type: LineageTreeRelationType.sire,
        ),
        LineageTreeEdge(
          fromId: 'khuren-guu',
          toId: 'khan-khuleg',
          type: LineageTreeRelationType.dam,
        ),
        LineageTreeEdge(
          fromId: 'khan-khuleg',
          toId: 'altan-shuurga',
          type: LineageTreeRelationType.offspring,
        ),
        LineageTreeEdge(
          fromId: 'khan-khuleg',
          toId: 'uulen-bor',
          type: LineageTreeRelationType.offspring,
        ),
        LineageTreeEdge(
          fromId: 'khan-khuleg',
          toId: 'shandas-gal',
          type: LineageTreeRelationType.offspring,
        ),
        LineageTreeEdge(
          fromId: 'altan-shuurga',
          toId: 'khukh-suld',
          type: LineageTreeRelationType.offspring,
        ),
        LineageTreeEdge(
          fromId: 'uulen-bor',
          toId: 'saaral-tenkhee',
          type: LineageTreeRelationType.offspring,
        ),
      ],
      relatedHorses: [
        Horse(
          id: 'altan-shuurga',
          name: 'Алтан Шуурга',
          relationLabel: 'Хүү',
          coat: 'Хээр',
          birthYear: 2018,
          awardCount: 3,
          offspringCount: 5,
          isOwnedByHousehold: true,
          notes: 'Өрхийн дотоод хамгийн идэвхтэй үр төл.',
          gender: HorseGender.gelding,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
        Horse(
          id: 'uulen-bor',
          name: 'Үүлэн Бор',
          relationLabel: 'Охин',
          coat: 'Бор',
          birthYear: 2019,
          awardCount: 2,
          offspringCount: 2,
          isOwnedByHousehold: true,
          notes: 'Гүүний шугамын хүчтэй холбоос.',
          gender: HorseGender.mare,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
        Horse(
          id: 'khukh-suld',
          name: 'Хөх Сүлд',
          relationLabel: 'Ач',
          coat: 'Хөх',
          birthYear: 2022,
          awardCount: 1,
          offspringCount: 0,
          isOwnedByHousehold: false,
          notes: 'Гаднах өрхөд бүртгэлтэй ч энэ удмын чухал зангилаа.',
          gender: HorseGender.gelding,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      ],
      timeline: const [
        LineageTimelineEntry(
          year: 2012,
          title: 'Төрсөн',
          description:
              'Хан Хүлэг үндсэн азарганы record болон lineage root болсон.',
        ),
        LineageTimelineEntry(
          year: 2018,
          title: 'Анхны амжилттай үр төл',
          description: 'Алтан Шуурга анхны том уралдааны шагналыг авсан.',
        ),
        LineageTimelineEntry(
          year: 2024,
          title: 'Гаднах холбоос нэмсэн',
          description:
              'Хөх Сүлд гаднах өрхийн бүрэн record-оор lineage-д орсон.',
        ),
      ],
    ),
    'tsagaan-salkhi': LineageSnapshot(
      root: _seedRoots.last,
      treeSummary:
          'Цагаан Салхи нь гаднах удамтай гүн холбоотой шугам бөгөөд 3 үеийн visual tree preview-д тохиромжтой.',
      treeNodes: const [
        LineageTreeNode(
          id: 'erdeniin-khiimor',
          name: 'Эрдэнийн Хийморь',
          relationLabel: 'Эцэг',
          coat: 'Цагаан',
          birthYear: 2010,
          awardCount: 5,
          offspringCount: 9,
          isOwnedByHousehold: false,
          generation: -1,
          branchOrder: 0,
          sortOrder: 0,
        ),
        LineageTreeNode(
          id: 'erdene-salkhi',
          name: 'Эрдэнэ Салхи',
          relationLabel: 'Хүү',
          coat: 'Цагаан',
          birthYear: 2020,
          awardCount: 2,
          offspringCount: 1,
          isOwnedByHousehold: false,
          generation: 1,
          branchOrder: 0,
          sortOrder: 0,
        ),
        LineageTreeNode(
          id: 'munguun-khiimor',
          name: 'Мөнгөн Хийморь',
          relationLabel: 'Охин',
          coat: 'Саарал',
          birthYear: 2021,
          awardCount: 1,
          offspringCount: 0,
          isOwnedByHousehold: true,
          generation: 1,
          branchOrder: 1,
          sortOrder: 0,
        ),
        LineageTreeNode(
          id: 'saran-tuyaa',
          name: 'Саран Туяа',
          relationLabel: 'Ач',
          coat: 'Цайвар',
          birthYear: 2024,
          awardCount: 0,
          offspringCount: 0,
          isOwnedByHousehold: true,
          generation: 2,
          branchOrder: 1,
          sortOrder: 0,
        ),
      ],
      treeEdges: const [
        LineageTreeEdge(
          fromId: 'erdeniin-khiimor',
          toId: 'tsagaan-salkhi',
          type: LineageTreeRelationType.sire,
        ),
        LineageTreeEdge(
          fromId: 'tsagaan-salkhi',
          toId: 'erdene-salkhi',
          type: LineageTreeRelationType.offspring,
        ),
        LineageTreeEdge(
          fromId: 'tsagaan-salkhi',
          toId: 'munguun-khiimor',
          type: LineageTreeRelationType.offspring,
        ),
        LineageTreeEdge(
          fromId: 'munguun-khiimor',
          toId: 'saran-tuyaa',
          type: LineageTreeRelationType.offspring,
        ),
      ],
      relatedHorses: [
        Horse(
          id: 'erdene-salkhi',
          name: 'Эрдэнэ Салхи',
          relationLabel: 'Хүү',
          coat: 'Цагаан',
          birthYear: 2020,
          awardCount: 2,
          offspringCount: 1,
          isOwnedByHousehold: false,
          notes: 'Гаднах азарганы цэвэр шугамтай.',
          gender: HorseGender.gelding,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
        Horse(
          id: 'munguun-khiimor',
          name: 'Мөнгөн Хийморь',
          relationLabel: 'Охин',
          coat: 'Саарал',
          birthYear: 2021,
          awardCount: 1,
          offspringCount: 0,
          isOwnedByHousehold: true,
          notes: 'Өрхийн талд үлдсэн гол охин морь.',
          gender: HorseGender.mare,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      ],
      timeline: const [
        LineageTimelineEntry(
          year: 2016,
          title: 'Шинэ root бүртгэсэн',
          description: 'Цагаан Салхи хоёрдогч lineage root болсон.',
        ),
        LineageTimelineEntry(
          year: 2021,
          title: 'Өрхийн гүүний шугамд нөлөөлсөн',
          description: 'Мөнгөн Хийморь lineage timeline-д нэмэгдсэн.',
        ),
      ],
    ),
  };

  // ── Read operations ────────────────────────────────────────────────

  @override
  Future<Result<List<LineageRoot>>> fetchRoots() async {
    try {
      final dbRoots = await _storage.lineageRoots.where().findAll();
      if (dbRoots.isNotEmpty) {
        return Result.ok(dbRoots.map((r) => r.toDomain()).toList());
      }

      // Seed the database if empty
      await _seedDatabase();
      final seeded = await _storage.lineageRoots.where().findAll();
      return Result.ok(seeded.map((r) => r.toDomain()).toList());
    } catch (e) {
      // Isar unavailable (first-launch race, store error): serve the
      // compile-time seed data instead of failing — offline-first holds even
      // when the local store hiccups.
      return Result.ok(_seedRoots);
    }
  }

  @override
  Future<Result<LineageSnapshot>> fetchSnapshot(String rootId) async {
    try {
      // Try loading from Isar snapshot cache first
      final cachedSnapshot = await _storage.lineageSnapshots
          .filter()
          .rootIdEqualTo(rootId)
          .findFirst();

      if (cachedSnapshot != null) {
        // Load the root from the roots collection
        final rootIsar = await _storage.lineageRoots
            .filter()
            .domainIdEqualTo(rootId)
            .findFirst();

        final root =
            rootIsar?.toDomain() ??
            LineageRoot(
              id: rootId,
              name: '',
              coat: '',
              birthYear: 0,
              offspringCount: 0,
              awardCount: 0,
              notes: '',
            );

        return Result.ok(cachedSnapshot.toDomain(root: root));
      }

      // Fall back to seed data if database is empty
      await _seedDatabase();

      final seeded = await _storage.lineageSnapshots
          .filter()
          .rootIdEqualTo(rootId)
          .findFirst();

      if (seeded != null) {
        final rootIsar = await _storage.lineageRoots
            .filter()
            .domainIdEqualTo(rootId)
            .findFirst();
        final root =
            rootIsar?.toDomain() ??
            LineageRoot(
              id: rootId,
              name: '',
              coat: '',
              birthYear: 0,
              offspringCount: 0,
              awardCount: 0,
              notes: '',
            );
        return Result.ok(seeded.toDomain(root: root));
      }

      // If nothing found, return a valid empty snapshot
      return Result.ok(
        LineageSnapshot(
          root: LineageRoot(
            id: rootId,
            name: '',
            coat: '',
            birthYear: 0,
            offspringCount: 0,
            awardCount: 0,
            notes: '',
          ),
          treeSummary:
              'Энэ морь удам угсаагүй байна / This horse has no recorded lineage.',
          treeNodes: const [],
          treeEdges: const [],
          relatedHorses: const [],
          timeline: const [],
        ),
      );
    } catch (e) {
      // Same resilience as [fetchRoots]: fall back to the compile-time seed
      // snapshot when the store is unavailable.
      final seed = _seedSnapshots[rootId];
      if (seed != null) {
        return Result.ok(seed);
      }
      return Result.fail(
        AppException.withDetail('FETCH_SNAPSHOT_ERROR', e.toString()),
      );
    }
  }

  // ── CRUD operations ────────────────────────────────────────────────

  @override
  Future<Result<void>> addParentLink({
    required String horseId,
    required String parentId,
    required String relation,
  }) async {
    try {
      await _storage.lineageRoots.isar.writeTxn(() async {
        // Store the parent as a tree node linked to the horse's root
        // We create a minimal LineageTreeNode and store it
        final node = IsarLineageTreeNode()
          ..domainId = parentId
          ..rootId = horseId
          ..name = ''
          ..relationLabel = relation == 'sire' ? 'Эцэг / Sire' : 'Эх / Dam'
          ..coat = ''
          ..birthYear = 0
          ..awardCount = 0
          ..offspringCount = 0
          ..isOwnedByHousehold = true
          ..generation = -1
          ..branchOrder = 0
          ..sortOrder = 0
          ..isRoot = false
          ..hiddenBranchCount = 0;

        await _storage.lineageTreeNodes.put(node);
      });

      _enqueueAndPersist(
        SyncQueueItem(
          entityType: 'lineage',
          entityId: '${horseId}_parent_$parentId',
          action: SyncAction.create,
          data: {
            'horseId': horseId,
            'parentId': parentId,
            'relation': relation,
          },
          timestamp: DateTime.now(),
        ),
      );

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('ADD_PARENT_LINK_ERROR', e.toString()),
      );
    }
  }

  @override
  Future<Result<void>> removeParentLink({
    required String horseId,
    required String parentId,
  }) async {
    try {
      await _storage.lineageRoots.isar.writeTxn(() async {
        final existing = await _storage.lineageTreeNodes
            .filter()
            .domainIdEqualTo(parentId)
            .rootIdEqualTo(horseId)
            .findFirst();

        if (existing != null) {
          await _storage.lineageTreeNodes.delete(existing.id);
        }
      });

      _enqueueAndPersist(
        SyncQueueItem(
          entityType: 'lineage',
          entityId: '${horseId}_parent_$parentId',
          action: SyncAction.delete,
          data: {'horseId': horseId, 'parentId': parentId},
          timestamp: DateTime.now(),
        ),
      );

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('REMOVE_PARENT_LINK_ERROR', e.toString()),
      );
    }
  }

  @override
  Future<Result<void>> updateHorseLineageInfo({
    required String horseId,
    String? name,
    String? coat,
    int? birthYear,
    String? notes,
  }) async {
    try {
      await _storage.lineageRoots.isar.writeTxn(() async {
        // Try updating in lineage_roots collection
        final existingRoot = await _storage.lineageRoots
            .filter()
            .domainIdEqualTo(horseId)
            .findFirst();

        if (existingRoot != null) {
          if (name != null) existingRoot.name = name;
          if (coat != null) existingRoot.coat = coat;
          if (birthYear != null) existingRoot.birthYear = birthYear;
          if (notes != null) existingRoot.notes = notes;
          await _storage.lineageRoots.put(existingRoot);
        }

        // Also update in tree_nodes collection
        final nodes = await _storage.lineageTreeNodes
            .filter()
            .domainIdEqualTo(horseId)
            .findAll();

        for (final node in nodes) {
          if (name != null) node.name = name;
          if (coat != null) node.coat = coat;
          if (birthYear != null) node.birthYear = birthYear;
          await _storage.lineageTreeNodes.put(node);
        }
      });

      final updateData = <String, dynamic>{'horseId': horseId};
      if (name != null) updateData['name'] = name;
      if (coat != null) updateData['coat'] = coat;
      if (birthYear != null) updateData['birthYear'] = birthYear;
      if (notes != null) updateData['notes'] = notes;

      _enqueueAndPersist(
        SyncQueueItem(
          entityType: 'lineage',
          entityId: horseId,
          action: SyncAction.update,
          data: updateData,
          timestamp: DateTime.now(),
        ),
      );

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('UPDATE_HORSE_LINEAGE_ERROR', e.toString()),
      );
    }
  }

  // ── Caching support ────────────────────────────────────────────────

  /// Cache a [LineageSnapshot] fetched from Supabase to local Isar storage
  /// so it's available offline.
  Future<Result<void>> cacheSnapshot(LineageSnapshot snapshot) async {
    try {
      await _storage.lineageRoots.isar.writeTxn(() async {
        // Upsert the root
        final isarRoot = IsarLineageRoot.fromDomain(snapshot.root);
        await _storage.lineageRoots.put(isarRoot);

        // Delete existing nodes for this root
        final existingNodes = await _storage.lineageTreeNodes
            .filter()
            .rootIdEqualTo(snapshot.root.id)
            .findAll();
        for (final node in existingNodes) {
          await _storage.lineageTreeNodes.delete(node.id);
        }

        // Insert new nodes
        for (final treeNode in snapshot.treeNodes) {
          final isarNode = IsarLineageTreeNode.fromDomain(
            treeNode,
            rootId: snapshot.root.id,
          );
          await _storage.lineageTreeNodes.put(isarNode);
        }

        // Upsert the snapshot
        final isarSnapshot = IsarLineageSnapshot.fromDomain(snapshot);
        await _storage.lineageSnapshots.put(isarSnapshot);
      });

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('CACHE_SNAPSHOT_ERROR', e.toString()),
      );
    }
  }

  /// Cache a list of [LineageRoot]s to local Isar storage.
  Future<Result<void>> cacheRoots(List<LineageRoot> roots) async {
    try {
      await _storage.lineageRoots.isar.writeTxn(() async {
        for (final root in roots) {
          final isarRoot = IsarLineageRoot.fromDomain(root);
          await _storage.lineageRoots.put(isarRoot);
        }
      });
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('CACHE_ROOTS_ERROR', e.toString()),
      );
    }
  }

  // ── Seeding ────────────────────────────────────────────────────────

  Future<void> _seedDatabase() async {
    await _storage.lineageRoots.isar.writeTxn(() async {
      // Only seed if the database is empty
      final count = await _storage.lineageRoots.where().count();
      if (count > 0) return;

      // Insert roots
      for (final root in _seedRoots) {
        await _storage.lineageRoots.put(IsarLineageRoot.fromDomain(root));
      }

      // Insert snapshots
      for (final entry in _seedSnapshots.entries) {
        final snapshot = IsarLineageSnapshot.fromDomain(entry.value);
        await _storage.lineageSnapshots.put(snapshot);

        // Insert tree nodes for this snapshot
        for (final node in entry.value.treeNodes) {
          final isarNode = IsarLineageTreeNode.fromDomain(
            node,
            rootId: entry.key,
          );
          await _storage.lineageTreeNodes.put(isarNode);
        }
      }
    });
  }
}
