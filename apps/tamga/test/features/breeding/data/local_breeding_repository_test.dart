import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/storage/isar_database.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/breeding/data/local_breeding_repository.dart';
import 'package:tamga/src/features/breeding/domain/breeding_record.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';

import '../../../helpers/test_helpers.dart';

/// Creates a minimal BreedingRecord with deterministic dates.
BreedingRecord _createRecord({
  String id = 'br-1',
  String status = 'Хээлтсэн',
  DateTime? breedingDate,
  DateTime? expectedFoalingDate,
}) {
  final breedDate = breedingDate ?? DateTime(2026, 1, 1);
  return BreedingRecord(
    id: id,
    sireId: 'sire-1',
    sireName: 'Тэмүүлэн',
    damId: 'dam-1',
    damName: 'Алтан',
    breedingDate: breedDate,
    expectedFoalingDate:
        expectedFoalingDate ??
        breedDate.add(const Duration(days: BreedingRecord.gestationDays)),
    status: status,
    herdLabel: 'Улаанбаатар',
    notes: '',
    createdAt: DateTime(2026, 1, 1),
    updatedAt: DateTime(2026, 1, 1),
  );
}

void main() {
  late LocalBreedingRepository repository;
  late SyncQueue syncQueue;

  setUp(() async {
    await setupTestEnvironment();
    await IsarDatabase.initialize();
    syncQueue = SyncQueue();
    repository = LocalBreedingRepository(
      storage: IsarStorage.instance,
      syncQueue: syncQueue,
    );
  });

  tearDown(() async {
    await IsarDatabase.close();
  });

  group('LocalBreedingRepository', () {
    test(
      'fetchBreedingRecords seeds two default records on first read',
      () async {
        final result = await repository.fetchBreedingRecords();

        expect(result.isSuccess, isTrue);
        expect(result.value, hasLength(2));
        expect(result.value.map((r) => r.id), ['breeding-1', 'breeding-2']);
        expect(syncQueue.pendingCount, 0);
      },
    );

    test(
      'saveBreedingRecord stores a new record and enqueues a create item',
      () async {
        final record = _createRecord(id: 'br-new');

        final result = await repository.saveBreedingRecord(record);

        expect(result.isSuccess, isTrue);
        expect(result.value.any((r) => r.id == 'br-new'), isTrue);

        final fetch = await repository.fetchBreedingRecords();
        final saved = fetch.value.singleWhere((r) => r.id == 'br-new');
        expect(saved.damName, 'Алтан');
        expect(saved.status, 'Хээлтсэн');

        expect(syncQueue.pendingCount, 1);
        final item = syncQueue.peek()!;
        expect(item.entityType, 'breeding');
        expect(item.entityId, 'br-new');
        expect(item.action, SyncAction.create);
        expect(item.data['id'], 'br-new');
      },
    );

    test(
      'saveBreedingRecord updates an existing record and enqueues an update item',
      () async {
        await repository.saveBreedingRecord(_createRecord(id: 'br-1'));
        syncQueue.clear();

        final updated = _createRecord(id: 'br-1', status: 'Төллөсөн');
        final result = await repository.saveBreedingRecord(updated);

        expect(result.isSuccess, isTrue);
        final fetch = await repository.fetchBreedingRecords();
        final saved = fetch.value.singleWhere((r) => r.id == 'br-1');
        expect(saved.status, 'Төллөсөн');

        expect(syncQueue.pendingCount, 1);
        final item = syncQueue.peek()!;
        expect(item.entityType, 'breeding');
        expect(item.entityId, 'br-1');
        expect(item.action, SyncAction.update);
      },
    );

    test(
      'saveBreedingRecord preserves sibling records in the collection',
      () async {
        await repository.saveBreedingRecord(_createRecord(id: 'br-a'));
        await repository.saveBreedingRecord(_createRecord(id: 'br-b'));

        final result = await repository.fetchBreedingRecords();

        expect(result.isSuccess, isTrue);
        // Full-collection replacement must keep the 2 seeds plus both new ones.
        expect(result.value, hasLength(4));
        expect(result.value.map((r) => r.id), containsAll(['br-a', 'br-b']));
      },
    );

    test(
      'deleteBreedingRecord removes the record and enqueues a delete item',
      () async {
        await repository.saveBreedingRecord(_createRecord(id: 'br-del'));
        syncQueue.clear();

        final result = await repository.deleteBreedingRecord('br-del');

        expect(result.isSuccess, isTrue);
        final fetch = await repository.fetchBreedingRecords();
        expect(fetch.value.any((r) => r.id == 'br-del'), isFalse);

        expect(syncQueue.pendingCount, 1);
        final item = syncQueue.peek()!;
        expect(item.entityType, 'breeding');
        expect(item.entityId, 'br-del');
        expect(item.action, SyncAction.delete);
      },
    );

    test(
      'deleteBreedingRecord on a missing id is a no-op without enqueue',
      () async {
        await repository.fetchBreedingRecords(); // seed the collection
        syncQueue.clear();

        final result = await repository.deleteBreedingRecord('missing');

        expect(result.isSuccess, isTrue);
        expect(syncQueue.pendingCount, 0);

        final fetch = await repository.fetchBreedingRecords();
        expect(fetch.value, hasLength(2));
      },
    );
  });
}
