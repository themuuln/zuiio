import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/storage/isar_database.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/events/data/local_event_repository.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';
import 'package:tamga/src/features/shared/data/isar_sync_storage.dart';

import '../../helpers/test_helpers.dart';

void main() {
  late IsarSyncStorage storage;

  setUp(() async {
    await setupTestEnvironment();
    await IsarDatabase.initialize();
    storage = IsarSyncStorage(IsarStorage.instance);
  });

  tearDown(() async {
    await IsarDatabase.close();
  });

  group('IsarSyncStorage.enqueue', () {
    test('persists an item and loadQueue round-trips it', () async {
      final item = SyncQueueItem(
        entityType: 'health',
        entityId: 'hl-1',
        action: SyncAction.create,
        data: {'notes': 'n1'},
        timestamp: DateTime(2026, 1, 1),
      );

      await storage.enqueue(item);

      final queue = await storage.loadQueue();
      expect(queue.pendingCount, 1);
      final restored = queue.dequeue()!;
      expect(restored.entityType, 'health');
      expect(restored.entityId, 'hl-1');
      expect(restored.action, SyncAction.create);
      expect(restored.data, {'notes': 'n1'});
    });

    test('create followed by delete cancels the row (coalescing)', () async {
      await storage.enqueue(
        SyncQueueItem(
          entityType: 'event',
          entityId: 'evt-1',
          action: SyncAction.create,
          data: {},
          timestamp: DateTime(2026, 1, 1),
        ),
      );
      await storage.enqueue(
        SyncQueueItem(
          entityType: 'event',
          entityId: 'evt-1',
          action: SyncAction.delete,
          data: {},
          timestamp: DateTime(2026, 1, 2),
        ),
      );

      final queue = await storage.loadQueue();
      expect(queue.pendingCount, 0);
    });

    test('update replaces earlier non-delete rows for the entity', () async {
      await storage.enqueue(
        SyncQueueItem(
          entityType: 'event',
          entityId: 'evt-1',
          action: SyncAction.create,
          data: {'v': 1},
          timestamp: DateTime(2026, 1, 1),
        ),
      );
      await storage.enqueue(
        SyncQueueItem(
          entityType: 'event',
          entityId: 'evt-1',
          action: SyncAction.update,
          data: {'v': 2},
          timestamp: DateTime(2026, 1, 2),
        ),
      );

      final queue = await storage.loadQueue();
      expect(queue.pendingCount, 1);
      final item = queue.dequeue()!;
      expect(item.action, SyncAction.update);
      expect(item.data, {'v': 2});
    });

    test('only rows for the same entityId are touched', () async {
      await storage.enqueue(
        SyncQueueItem(
          entityType: 'event',
          entityId: 'keep-me',
          action: SyncAction.create,
          data: {},
          timestamp: DateTime(2026, 1, 1),
        ),
      );
      await storage.enqueue(
        SyncQueueItem(
          entityType: 'event',
          entityId: 'remove-me',
          action: SyncAction.delete,
          data: {},
          timestamp: DateTime(2026, 1, 1),
        ),
      );

      final queue = await storage.loadQueue();
      expect(queue.pendingCount, 2);
      final ids = queue.toList().map((i) => i.entityId).toSet();
      // 'keep-me' must survive — a delete enqueue for another entity must not
      // clear the whole queue.
      expect(ids, contains('keep-me'));
      expect(ids, contains('remove-me'));
    });
  });

  group('LocalRepository durable queue persistence', () {
    test('save persists the sync intent when syncStorage is wired', () async {
      final repo = LocalEventRepository(
        storage: IsarStorage.instance,
        syncQueue: SyncQueue(),
        syncStorage: storage,
      );

      await repo.saveEvent(createMockEvent(id: 'evt-persist'));

      final queue = await storage.loadQueue();
      expect(queue.pendingCount, 1);
      final item = queue.dequeue()!;
      expect(item.entityType, 'event');
      expect(item.entityId, 'evt-persist');
      expect(item.action, SyncAction.create);
    });

    test('save does not persist when syncStorage is not wired', () async {
      final repo = LocalEventRepository(
        storage: IsarStorage.instance,
        syncQueue: SyncQueue(),
      );

      await repo.saveEvent(createMockEvent(id: 'evt-local'));

      final queue = await storage.loadQueue();
      expect(queue.pendingCount, 0);
    });

    test(
      'delete persists a delete intent once the create was synced',
      () async {
        final repo = LocalEventRepository(
          storage: IsarStorage.instance,
          syncQueue: SyncQueue(),
          syncStorage: storage,
        );
        await repo.saveEvent(createMockEvent(id: 'evt-del'));

        // Simulate the create already being pushed (queue row removed by sync).
        final queue = await storage.loadQueue();
        final item = queue.dequeue()!;
        await storage.removeQueueItem(item.stableQueueId);

        await repo.deleteEvent('evt-del');

        final after = await storage.loadQueue();
        expect(after.pendingCount, 1);
        final deleteItem = after.dequeue()!;
        expect(deleteItem.entityType, 'event');
        expect(deleteItem.entityId, 'evt-del');
        expect(deleteItem.action, SyncAction.delete);
      },
    );
  });
}
