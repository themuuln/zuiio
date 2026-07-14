import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/core/sync/sync_engine.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/core/error/app_exception.dart';

void main() {
  group('SyncQueue', () {
    late SyncQueue queue;

    setUp(() {
      queue = SyncQueue();
    });

    test('starts empty', () {
      expect(queue.pendingCount, 0);
      expect(queue.peek(), isNull);
      expect(queue.deadLetterCount, 0);
    });

    test('enqueue adds an item', () {
      final item = SyncQueueItem(
        entityType: 'horse',
        entityId: 'h1',
        action: SyncAction.create,
        data: {'name': 'Test'},
        timestamp: DateTime.now(),
      );
      queue.enqueue(item);
      expect(queue.pendingCount, 1);
    });

    test('enqueue multiple items increments count', () {
      queue.enqueue(
        SyncQueueItem(
          entityType: 'horse',
          entityId: 'h1',
          action: SyncAction.create,
          data: {},
          timestamp: DateTime.now(),
        ),
      );
      queue.enqueue(
        SyncQueueItem(
          entityType: 'horse',
          entityId: 'h2',
          action: SyncAction.update,
          data: {},
          timestamp: DateTime.now(),
        ),
      );
      expect(queue.pendingCount, 2);
    });

    test('peek returns oldest item without removing', () {
      queue.enqueue(
        SyncQueueItem(
          entityType: 'horse',
          entityId: 'h1',
          action: SyncAction.create,
          data: {},
          timestamp: DateTime.now(),
        ),
      );
      queue.enqueue(
        SyncQueueItem(
          entityType: 'horse',
          entityId: 'h2',
          action: SyncAction.update,
          data: {},
          timestamp: DateTime.now(),
        ),
      );
      expect(queue.peek()!.entityId, 'h1');
      expect(queue.pendingCount, 2); // still there
    });

    test('dequeue removes and returns oldest item', () {
      queue.enqueue(
        SyncQueueItem(
          entityType: 'horse',
          entityId: 'h1',
          action: SyncAction.create,
          data: {},
          timestamp: DateTime.now(),
        ),
      );
      queue.enqueue(
        SyncQueueItem(
          entityType: 'horse',
          entityId: 'h2',
          action: SyncAction.update,
          data: {},
          timestamp: DateTime.now(),
        ),
      );

      final item = queue.dequeue();
      expect(item!.entityId, 'h1');
      expect(queue.pendingCount, 1);
    });

    test('dequeue on empty returns null', () {
      expect(queue.dequeue(), isNull);
    });

    test('removeById removes specific item', () {
      queue.enqueue(
        SyncQueueItem(
          entityType: 'horse',
          entityId: 'h1',
          action: SyncAction.create,
          data: {},
          timestamp: DateTime.now(),
        ),
      );
      queue.enqueue(
        SyncQueueItem(
          entityType: 'horse',
          entityId: 'h2',
          action: SyncAction.create,
          data: {},
          timestamp: DateTime.now(),
        ),
      );

      queue.removeById('h1');
      expect(queue.pendingCount, 1);
      expect(queue.peek()!.entityId, 'h2');
    });

    test('clear removes all', () {
      queue.enqueue(
        SyncQueueItem(
          entityType: 'horse',
          entityId: 'h1',
          action: SyncAction.create,
          data: {},
          timestamp: DateTime.now(),
        ),
      );
      queue.clear();
      expect(queue.pendingCount, 0);
    });

    test('coalesceCreateUpdate — replaces update with same entityId', () {
      queue.enqueue(
        SyncQueueItem(
          entityType: 'horse',
          entityId: 'h1',
          action: SyncAction.create,
          data: {'name': 'V1'},
          timestamp: DateTime.now(),
        ),
      );
      queue.enqueue(
        SyncQueueItem(
          entityType: 'horse',
          entityId: 'h1',
          action: SyncAction.update,
          data: {'name': 'V2'},
          timestamp: DateTime.now(),
        ),
      );

      expect(queue.pendingCount, 1);
      expect(queue.peek()!.data['name'], 'V2');
    });

    test('coalesceCreateUpdate — create then delete removes both', () {
      queue.enqueue(
        SyncQueueItem(
          entityType: 'horse',
          entityId: 'h1',
          action: SyncAction.create,
          data: {},
          timestamp: DateTime.now(),
        ),
      );
      queue.enqueue(
        SyncQueueItem(
          entityType: 'horse',
          entityId: 'h1',
          action: SyncAction.delete,
          data: {},
          timestamp: DateTime.now(),
        ),
      );

      expect(queue.pendingCount, 0);
    });

    test('toJson / fromJson roundtrip', () {
      queue.enqueue(
        SyncQueueItem(
          entityType: 'health_log',
          entityId: 'hl1',
          action: SyncAction.create,
          data: {'type': 'vaccination', 'date': '2026-01-15'},
          timestamp: DateTime(2026, 1, 15, 10, 30),
        ),
      );
      queue.enqueue(
        SyncQueueItem(
          entityType: 'horse',
          entityId: 'h1',
          action: SyncAction.update,
          data: {'name': 'Updated'},
          timestamp: DateTime(2026, 1, 16, 14, 0),
          retryCount: 2,
        ),
      );

      final json = queue.toJson();
      final restored = SyncQueue.fromJson(json);

      expect(restored.pendingCount, 2);
      expect(restored.peek()!.entityType, 'health_log');
      final items = restored.toList();
      expect(items[1].retryCount, 2);
    });

    test('toJson from empty queue', () {
      final json = queue.toJson();
      expect(json['items'], []);
      expect(json['deadLetterItems'], []);
    });

    // ── Dead letter queue tests ─────────────────────────────────

    test('deadLetterCount starts at 0', () {
      expect(queue.deadLetterCount, 0);
    });

    test('addToDeadLetter adds item with movedAt timestamp', () {
      final item = SyncQueueItem(
        entityType: 'horse',
        entityId: 'h1',
        action: SyncAction.create,
        data: {'name': 'Test'},
        timestamp: DateTime(2026, 1, 15),
      );
      queue.addToDeadLetter(item);

      expect(queue.deadLetterCount, 1);
      final dlItem = queue.deadLetterList().first;
      expect(dlItem.entityType, 'horse');
      expect(dlItem.entityId, 'h1');
      expect(dlItem.movedAt, isNotNull);
    });

    test('addToDeadLetter preserves existing movedAt', () {
      final movedAt = DateTime(2026, 6, 1);
      final item = SyncQueueItem(
        entityType: 'horse',
        entityId: 'h1',
        action: SyncAction.create,
        data: {},
        timestamp: DateTime.now(),
        movedAt: movedAt,
      );
      queue.addToDeadLetter(item);

      expect(queue.deadLetterCount, 1);
      expect(queue.deadLetterList().first.movedAt, movedAt);
    });

    test('deadLetterList returns full SyncQueueItem with all fields', () {
      final now = DateTime(2026, 6, 15);
      final item = SyncQueueItem(
        entityType: 'horse',
        entityId: 'h1',
        action: SyncAction.update,
        data: {'name': 'Тэст', 'age': 5},
        timestamp: DateTime(2026, 6, 10),
        retryCount: 5,
        status: SyncItemStatus.failed,
        lastAttemptAt: now,
      );
      queue.addToDeadLetter(item);

      final dlItem = queue.deadLetterList().first;
      expect(dlItem.entityType, 'horse');
      expect(dlItem.entityId, 'h1');
      expect(dlItem.action, SyncAction.update);
      expect(dlItem.data['name'], 'Тэст');
      expect(dlItem.timestamp, DateTime(2026, 6, 10));
      expect(dlItem.retryCount, 5);
      expect(dlItem.status, SyncItemStatus.failed);
      expect(dlItem.lastAttemptAt, now);
      expect(dlItem.movedAt, isNotNull);
    });

    test('clearDeadLetter removes all dead letter items', () {
      final item = SyncQueueItem(
        entityType: 'horse',
        entityId: 'h1',
        action: SyncAction.create,
        data: {},
        timestamp: DateTime.now(),
      );
      queue.addToDeadLetter(item);
      expect(queue.deadLetterCount, 1);

      queue.clearDeadLetter();
      expect(queue.deadLetterCount, 0);
    });

    test('dead letter items included in toJson / fromJson roundtrip', () {
      final item = SyncQueueItem(
        entityType: 'horse',
        entityId: 'h1',
        action: SyncAction.create,
        data: {'name': 'Тест'},
        timestamp: DateTime(2026, 6, 10),
        retryCount: 5,
      );
      queue.addToDeadLetter(item);

      final json = queue.toJson();
      final restored = SyncQueue.fromJson(json);

      expect(restored.deadLetterCount, 1);
      expect(restored.deadLetterList().first.entityId, 'h1');
      expect(restored.deadLetterList().first.movedAt, isNotNull);
    });

    // ── movedAt & isDeadLetter ───────────────────────────────────

    test('SyncQueueItem.isDeadLetter is true when movedAt is set', () {
      final item = SyncQueueItem(
        entityType: 'horse',
        entityId: 'h1',
        action: SyncAction.create,
        data: {},
        timestamp: DateTime.now(),
        movedAt: DateTime.now(),
      );
      expect(item.isDeadLetter, isTrue);
    });

    test('SyncQueueItem.isDeadLetter is false when movedAt is null', () {
      final item = SyncQueueItem(
        entityType: 'horse',
        entityId: 'h1',
        action: SyncAction.create,
        data: {},
        timestamp: DateTime.now(),
      );
      expect(item.isDeadLetter, isFalse);
    });

    test('copyWith preserves movedAt', () {
      final now = DateTime.now();
      final item = SyncQueueItem(
        entityType: 'horse',
        entityId: 'h1',
        action: SyncAction.create,
        data: {},
        timestamp: DateTime.now(),
      );
      final withMovedAt = item.copyWith(movedAt: now);
      expect(withMovedAt.movedAt, now);
      expect(withMovedAt.isDeadLetter, isTrue);

      final withoutMovedAt = withMovedAt.copyWith(movedAt: null);
      expect(withoutMovedAt.movedAt, isNull);
      expect(withoutMovedAt.isDeadLetter, isFalse);
    });

    test('toJson / fromJson roundtrip includes movedAt', () {
      final movedAt = DateTime(2026, 6, 15, 10, 30);
      final item = SyncQueueItem(
        entityType: 'horse',
        entityId: 'h1',
        action: SyncAction.create,
        data: {},
        timestamp: DateTime(2026, 6, 10),
        movedAt: movedAt,
      );

      final json = item.toJson();
      final restored = SyncQueueItem.fromJson(json);

      expect(restored.movedAt, movedAt);
      expect(restored.isDeadLetter, isTrue);
    });
  });

  group('SyncEngine', () {
    test('processAsync — ok returns items processed', () async {
      final queue = SyncQueue();
      queue.enqueue(
        SyncQueueItem(
          entityType: 'horse',
          entityId: 'h1',
          action: SyncAction.create,
          data: {'name': 'Test'},
          timestamp: DateTime.now(),
        ),
      );

      int processedCount = 0;
      await SyncEngine.processAsync(
        queue: queue,
        batchSize: 10,
        onProcessItem: (item) async {
          processedCount++;
          return Result.ok(true);
        },
      );

      expect(processedCount, 1);
      expect(queue.pendingCount, 0); // processed items removed
    });

    test('processAsync — failure increments retry, keeps in queue', () async {
      final queue = SyncQueue();
      queue.enqueue(
        SyncQueueItem(
          entityType: 'horse',
          entityId: 'h1',
          action: SyncAction.create,
          data: {},
          timestamp: DateTime.now(),
        ),
      );

      await SyncEngine.processAsync(
        queue: queue,
        batchSize: 10,
        onProcessItem: (item) async {
          return Result.fail(
            const AppException(message: 'network error', code: 'NET_ERR'),
          );
        },
      );

      expect(queue.pendingCount, 1);
      expect(queue.peek()!.retryCount, 1);
    });

    test('processAsync — retries beyond max send to dead letter', () async {
      final queue = SyncQueue();
      queue.enqueue(
        SyncQueueItem(
          entityType: 'horse',
          entityId: 'h1',
          action: SyncAction.create,
          data: {},
          timestamp: DateTime.now(),
          retryCount: SyncEngine.maxRetries,
        ),
      );

      final deadLetterItems = <SyncQueueItem>[];
      await SyncEngine.processAsync(
        queue: queue,
        batchSize: 10,
        onProcessItem: (item) async {
          return Result.fail(
            const AppException(message: 'still failing', code: 'FAIL'),
          );
        },
        onDeadLetter: (item) {
          deadLetterItems.add(item);
        },
      );

      expect(queue.pendingCount, 0); // removed from active queue
      expect(deadLetterItems.length, 1);
      expect(deadLetterItems.first.entityId, 'h1');
      expect(deadLetterItems.first.movedAt, isNotNull);
      expect(deadLetterItems.first.retryCount, SyncEngine.maxRetries);
    });

    test('processAsync — processes only up to batchSize', () async {
      final queue = SyncQueue();
      for (int i = 0; i < 5; i++) {
        queue.enqueue(
          SyncQueueItem(
            entityType: 'horse',
            entityId: 'h$i',
            action: SyncAction.create,
            data: {},
            timestamp: DateTime.now(),
          ),
        );
      }

      int processedCount = 0;
      await SyncEngine.processAsync(
        queue: queue,
        batchSize: 3,
        onProcessItem: (item) async {
          processedCount++;
          return Result.ok(true);
        },
      );

      expect(processedCount, 3);
      expect(queue.pendingCount, 2);
    });

    test('processAsync — empty queue does nothing', () async {
      final queue = SyncQueue();
      bool called = false;
      await SyncEngine.processAsync(
        queue: queue,
        batchSize: 10,
        onProcessItem: (item) async {
          called = true;
          return Result.ok(true);
        },
      );
      expect(called, false);
    });

    // ── Exponential backoff tests ──────────────────────────────

    group('backoffDelay', () {
      test('retryCount 0 returns 2s', () {
        expect(SyncEngine.backoffDelay(0), const Duration(seconds: 2));
      });

      test('retryCount 1 returns 4s', () {
        expect(SyncEngine.backoffDelay(1), const Duration(seconds: 4));
      });

      test('retryCount 2 returns 8s', () {
        expect(SyncEngine.backoffDelay(2), const Duration(seconds: 8));
      });

      test('retryCount 3 returns 16s', () {
        expect(SyncEngine.backoffDelay(3), const Duration(seconds: 16));
      });

      test('retryCount 4 returns 32s', () {
        expect(SyncEngine.backoffDelay(4), const Duration(seconds: 32));
      });

      test('retryCount 5 returns 60s (capped)', () {
        expect(SyncEngine.backoffDelay(5), const Duration(seconds: 60));
      });

      test('retryCount 10 returns 60s (capped)', () {
        expect(SyncEngine.backoffDelay(10), const Duration(seconds: 60));
      });

      test('negative retryCount returns zero', () {
        expect(SyncEngine.backoffDelay(-1), Duration.zero);
      });
    });

    test(
      'processAsync respects backoff — item not retried before interval',
      () async {
        final queue = SyncQueue();
        final recentAttempt = DateTime.now().subtract(
          const Duration(seconds: 1),
        );
        queue.enqueue(
          SyncQueueItem(
            entityType: 'horse',
            entityId: 'h1',
            action: SyncAction.create,
            data: {},
            timestamp: DateTime.now(),
            retryCount: 0,
            lastAttemptAt: recentAttempt, // only 1s ago, needs 2s backoff
          ),
        );

        bool wasProcessed = false;
        final deadLetterItems = <SyncQueueItem>[];
        await SyncEngine.processAsync(
          queue: queue,
          batchSize: 10,
          onProcessItem: (item) async {
            wasProcessed = true;
            return Result.ok(true);
          },
          onDeadLetter: (item) {
            deadLetterItems.add(item);
          },
        );

        // Item should NOT have been processed - backoff hasn't elapsed
        expect(wasProcessed, isFalse);
        // Item should be back in the queue (re-enqueued with same retryCount)
        expect(queue.pendingCount, 1);
        expect(queue.peek()!.retryCount, 0);
        expect(deadLetterItems.length, 0);
      },
    );

    test('processAsync retries after backoff interval has elapsed', () async {
      final queue = SyncQueue();
      final oldAttempt = DateTime.now().subtract(const Duration(seconds: 10));
      queue.enqueue(
        SyncQueueItem(
          entityType: 'horse',
          entityId: 'h1',
          action: SyncAction.create,
          data: {},
          timestamp: DateTime.now(),
          retryCount: 0,
          lastAttemptAt: oldAttempt, // 10s ago, needs only 2s backoff
        ),
      );

      bool wasProcessed = false;
      await SyncEngine.processAsync(
        queue: queue,
        batchSize: 10,
        onProcessItem: (item) async {
          wasProcessed = true;
          return Result.ok(true);
        },
      );

      expect(wasProcessed, isTrue);
      expect(queue.pendingCount, 0); // success → removed
    });

    test(
      'backoff does not apply to first attempt (no lastAttemptAt)',
      () async {
        final queue = SyncQueue();
        // No lastAttemptAt = brand new item
        queue.enqueue(
          SyncQueueItem(
            entityType: 'horse',
            entityId: 'h1',
            action: SyncAction.create,
            data: {},
            timestamp: DateTime.now(),
          ),
        );

        bool wasProcessed = false;
        await SyncEngine.processAsync(
          queue: queue,
          batchSize: 10,
          onProcessItem: (item) async {
            wasProcessed = true;
            return Result.ok(true);
          },
        );

        expect(wasProcessed, isTrue);
      },
    );
  });
}
