import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/storage/isar_database.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/horses/data/co_ownership_repository.dart';
import 'package:tamga/src/features/horses/domain/co_ownership.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';

import '../../../helpers/test_helpers.dart';

CoOwnershipRecord _record({
  String id = 'co-1',
  String horseId = 'horse-1',
  String coOwnerName = 'Хамтран эзэмшигч',
  String phone = '99112233',
  String role = 'Туслах уяач',
  List<String> permissions = const ['read'],
}) {
  return CoOwnershipRecord(
    id: id,
    horseId: horseId,
    coOwnerName: coOwnerName,
    phone: phone,
    role: role,
    permissions: permissions,
    createdAt: DateTime(2026, 1, 1),
    updatedAt: DateTime(2026, 1, 1),
  );
}

void main() {
  late SyncQueue syncQueue;
  late LocalCoOwnershipRepository repository;

  setUp(() async {
    await setupTestEnvironment();
    await IsarDatabase.initialize();
    syncQueue = SyncQueue();
    repository = LocalCoOwnershipRepository(
      storage: IsarStorage.instance,
      syncQueue: syncQueue,
    );
  });

  tearDown(() async {
    await IsarDatabase.close();
  });

  group('LocalCoOwnershipRepository', () {
    test('fetchCoOwners seeds default records on an empty database', () async {
      final result = await repository.fetchCoOwners('khan-khuleg');

      expect(result.isSuccess, true);
      expect(result.value, isNotEmpty);
      expect(result.value.every((r) => r.horseId == 'khan-khuleg'), true);
    });

    test(
      'fetchCoOwners returns only records for the requested horse',
      () async {
        await repository.saveCoOwner(_record(id: 'mine', horseId: 'horse-1'));
        await repository.saveCoOwner(_record(id: 'other', horseId: 'horse-2'));

        final result = await repository.fetchCoOwners('horse-1');

        expect(result.isSuccess, true);
        expect(result.value.map((r) => r.id), contains('mine'));
        expect(result.value.map((r) => r.id), isNot(contains('other')));
        expect(result.value.every((r) => r.horseId == 'horse-1'), true);
      },
    );

    test('fetchCoOwners returns empty for an unknown horse', () async {
      final result = await repository.fetchCoOwners('unknown-horse');

      expect(result.isSuccess, true);
      expect(result.value, isEmpty);
    });

    test(
      'saveCoOwner persists the record and enqueues a create item',
      () async {
        final record = _record(id: 'new-co', horseId: 'horse-1');

        final result = await repository.saveCoOwner(record);

        expect(result.isSuccess, true);
        expect(result.value.map((r) => r.id), contains('new-co'));

        expect(syncQueue.pendingCount, greaterThanOrEqualTo(1));
        final item = syncQueue.peek();
        expect(item, isNotNull);
        expect(item!.entityType, 'co_ownership');
        expect(item.entityId, 'new-co');
        expect(item.action, SyncAction.create);
      },
    );

    test(
      'saveCoOwner on an existing id replaces and enqueues an update',
      () async {
        await repository.saveCoOwner(_record(id: 'co-1', horseId: 'horse-1'));
        syncQueue.clear();

        final updated = _record(
          id: 'co-1',
          horseId: 'horse-1',
          coOwnerName: 'Шинэ нэр',
        );
        final result = await repository.saveCoOwner(updated);

        expect(result.isSuccess, true);
        final stored = result.value.singleWhere((r) => r.id == 'co-1');
        expect(stored.coOwnerName, 'Шинэ нэр');

        expect(syncQueue.pendingCount, greaterThanOrEqualTo(1));
        final item = syncQueue.peek();
        expect(item, isNotNull);
        expect(item!.entityId, 'co-1');
        expect(item.action, SyncAction.update);
      },
    );

    test('saveCoOwner returns only the records of that horse', () async {
      final result = await repository.saveCoOwner(
        _record(id: 'horse-1-co', horseId: 'horse-1'),
      );

      expect(result.isSuccess, true);
      expect(result.value.isNotEmpty, true);
      expect(result.value.every((r) => r.horseId == 'horse-1'), true);
    });

    test(
      'deleteCoOwner removes the record and enqueues a delete item',
      () async {
        await repository.saveCoOwner(
          _record(id: 'remove-me', horseId: 'horse-1'),
        );
        syncQueue.clear();

        final result = await repository.deleteCoOwner('remove-me');

        expect(result.isSuccess, true);
        expect(result.value.map((r) => r.id), isNot(contains('remove-me')));

        expect(syncQueue.pendingCount, greaterThanOrEqualTo(1));
        final item = syncQueue.peek();
        expect(item, isNotNull);
        expect(item!.entityType, 'co_ownership');
        expect(item.entityId, 'remove-me');
        expect(item.action, SyncAction.delete);
      },
    );

    test('deleteCoOwner for an unknown id still succeeds', () async {
      final result = await repository.deleteCoOwner('missing-co');

      expect(result.isSuccess, true);
    });

    test('syncCoOwnership returns 0 when Supabase is not configured', () async {
      final result = await repository.syncCoOwnership();

      expect(result.isSuccess, true);
      expect(result.value, 0);
    });

    test('watchCoOwners returns null for the local repository', () {
      expect(repository.watchCoOwners('horse-1'), isNull);
    });
  });
}
