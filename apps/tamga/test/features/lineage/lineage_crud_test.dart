import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/storage/isar_database.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/lineage/data/local_lineage_repository.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';

import '../../helpers/test_helpers.dart';

void main() {
  group('LocalLineageRepository CRUD', () {
    late SyncQueue syncQueue;
    late LocalLineageRepository repository;

    setUp(() async {
      await setupTestEnvironment();
      await IsarDatabase.initialize();
      syncQueue = SyncQueue();
      repository = LocalLineageRepository(
        storage: IsarStorage.instance,
        syncQueue: syncQueue,
      );
    });

    tearDown(() async {
      await IsarDatabase.close();
    });

    group('fetchRoots', () {
      test('returns seed roots when database is empty', () async {
        final result = await repository.fetchRoots();
        expect(result.isSuccess, isTrue);
        expect(result.value.length, greaterThan(0));
        expect(result.value.first.name, 'Хан Хүлэг');
      });
    });

    group('fetchSnapshot', () {
      test('returns seed snapshot for known root', () async {
        final result = await repository.fetchSnapshot('khan-khuleg');
        expect(result.isSuccess, isTrue);
        expect(result.value.root.name, 'Хан Хүлэг');
        expect(result.value.treeNodes.length, greaterThan(0));
        expect(result.value.treeEdges.length, greaterThan(0));
      });

      test('returns empty snapshot for unknown root', () async {
        final result = await repository.fetchSnapshot('unknown-horse');
        expect(result.isSuccess, isTrue);
        expect(result.value.treeNodes, isEmpty);
        expect(result.value.treeEdges, isEmpty);
        expect(result.value.treeSummary, contains('has no recorded lineage'));
      });
    });

    group('addParentLink', () {
      test('adds parent link and enqueues sync item', () async {
        final result = await repository.addParentLink(
          horseId: 'khan-khuleg',
          parentId: 'new-parent',
          relation: 'sire',
        );

        expect(result.isSuccess, isTrue);

        // Verify sync queue has the item
        expect(syncQueue.pendingCount, 1);
        final item = syncQueue.peek()!;
        expect(item.entityType, 'lineage');
        expect(item.entityId, 'khan-khuleg_parent_new-parent');
        expect(item.action, SyncAction.create);
        expect(item.data['horseId'], 'khan-khuleg');
        expect(item.data['parentId'], 'new-parent');
        expect(item.data['relation'], 'sire');
      });
    });

    group('removeParentLink', () {
      test('removes parent link and enqueues sync item', () async {
        // First add a parent link
        await repository.addParentLink(
          horseId: 'khan-khuleg',
          parentId: 'parent-to-remove',
          relation: 'dam',
        );
        syncQueue.clear();

        // Now remove it
        final result = await repository.removeParentLink(
          horseId: 'khan-khuleg',
          parentId: 'parent-to-remove',
        );

        expect(result.isSuccess, isTrue);

        // Verify sync queue has the delete item
        expect(syncQueue.pendingCount, 1);
        final item = syncQueue.peek()!;
        expect(item.entityType, 'lineage');
        expect(item.action, SyncAction.delete);
        expect(item.data['horseId'], 'khan-khuleg');
        expect(item.data['parentId'], 'parent-to-remove');
      });

      test('succeeds even when parent does not exist', () async {
        final result = await repository.removeParentLink(
          horseId: 'unknown-horse',
          parentId: 'nonexistent-parent',
        );

        expect(result.isSuccess, isTrue);
      });
    });

    group('updateHorseLineageInfo', () {
      test('updates horse info and enqueues sync item', () async {
        final result = await repository.updateHorseLineageInfo(
          horseId: 'khan-khuleg',
          name: 'Шинэ Хан Хүлэг',
          coat: 'Хүрэн',
          birthYear: 2013,
        );

        expect(result.isSuccess, isTrue);

        // Verify sync queue has the update item
        expect(syncQueue.pendingCount, 1);
        final item = syncQueue.peek()!;
        expect(item.entityType, 'lineage');
        expect(item.entityId, 'khan-khuleg');
        expect(item.action, SyncAction.update);
        expect(item.data['name'], 'Шинэ Хан Хүлэг');
        expect(item.data['coat'], 'Хүрэн');
        expect(item.data['birthYear'], 2013);
      });

      test('updates persisted data in Isar', () async {
        // First seed the database by fetching roots
        await repository.fetchRoots();

        // Update the horse
        await repository.updateHorseLineageInfo(
          horseId: 'khan-khuleg',
          name: 'Шинэ Нэр',
        );

        // Fetch and verify the update is persisted
        final fetchResult = await repository.fetchRoots();
        expect(fetchResult.isSuccess, isTrue);

        final updatedRoot = fetchResult.value.firstWhere(
          (r) => r.id == 'khan-khuleg',
        );
        expect(updatedRoot.name, 'Шинэ Нэр');
      });

      test('partial update preserves other fields', () async {
        // First seed the database by fetching roots
        await repository.fetchRoots();

        // Update only name
        await repository.updateHorseLineageInfo(
          horseId: 'khan-khuleg',
          name: 'Зөвхөн Нэр',
        );

        final fetchResult = await repository.fetchRoots();
        final updatedRoot = fetchResult.value.firstWhere(
          (r) => r.id == 'khan-khuleg',
        );

        expect(updatedRoot.name, 'Зөвхөн Нэр');
        expect(updatedRoot.coat, 'Хээр'); // unchanged
        expect(updatedRoot.birthYear, 2012); // unchanged
      });
    });
  });
}
