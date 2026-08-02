import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/storage/isar_database.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';
import 'package:tamga/src/shared/domain/health_log.dart';
import 'package:tamga/src/features/health/data/local_health_repository.dart';

import '../../../helpers/test_helpers.dart';

void main() {
  late SyncQueue syncQueue;
  late LocalHealthRepository repository;

  setUp(() async {
    await setupTestEnvironment();
    await IsarDatabase.initialize();
    syncQueue = SyncQueue();
    repository = LocalHealthRepository(
      storage: IsarStorage.instance,
      syncQueue: syncQueue,
    );
  });

  tearDown(() async {
    await IsarDatabase.close();
  });

  // ── Interface conformance ───────────────────────────────────

  // ── fetchAll across horses ──────────────────────────────────

  group('fetchAll', () {
    test('returns logs from all horses', () async {
      await repository.saveHealthLog(
        createMockHealthLog(id: 'a1', horseId: 'h1'),
      );
      await repository.saveHealthLog(
        createMockHealthLog(id: 'b1', horseId: 'h2'),
      );
      await repository.saveHealthLog(
        createMockHealthLog(id: 'a2', horseId: 'h1'),
      );

      final result = await repository.fetchAll();
      expect(result.isSuccess, true);
      expect(result.value.length, 3);
    });
  });

  // ── fetchAllByHorse scoping ─────────────────────────────────

  group('fetchAllByHorse', () {
    test('scopes to requested horse only', () async {
      await repository.saveHealthLog(
        createMockHealthLog(
          id: 'v1',
          horseId: 'h1',
          logType: LogType.vaccination,
        ),
      );
      await repository.saveHealthLog(
        createMockHealthLog(
          id: 'd1',
          horseId: 'h1',
          logType: LogType.deworming,
        ),
      );
      await repository.saveHealthLog(
        createMockHealthLog(
          id: 'v2',
          horseId: 'h2',
          logType: LogType.vaccination,
        ),
      );

      final h1 = await repository.fetchAllByHorse('h1');
      expect(h1.isSuccess, true);
      expect(h1.value.length, 2);

      final h2 = await repository.fetchAllByHorse('h2');
      expect(h2.isSuccess, true);
      expect(h2.value.length, 1);
      expect(h2.value.first.id, 'v2');

      final empty = await repository.fetchAllByHorse('unknown');
      expect(empty.isSuccess, true);
      expect(empty.value, isEmpty);
    });
  });

  // ── fetchAllByHorsePaginated ────────────────────────────────

  group('fetchAllByHorsePaginated', () {
    test('slices pages by offset/limit and reports totalCount', () async {
      for (var i = 0; i < 3; i++) {
        await repository.saveHealthLog(
          createMockHealthLog(id: 'p$i', horseId: 'h1'),
        );
      }

      final page0 = await repository.fetchAllByHorsePaginated(
        horseId: 'h1',
        page: 0,
        limit: 2,
      );
      expect(page0.isSuccess, true);
      expect(page0.value.items.length, 2);
      expect(page0.value.totalCount, 3);

      final page1 = await repository.fetchAllByHorsePaginated(
        horseId: 'h1',
        page: 1,
        limit: 2,
      );
      expect(page1.isSuccess, true);
      expect(page1.value.items.length, 1);
      expect(page1.value.items.first.id, 'p2');
      expect(page1.value.totalCount, 3);
    });
  });

  // ── save update in place ────────────────────────────────────

  group('save update', () {
    test(
      'updates existing log in place and enqueues SyncAction.update',
      () async {
        await repository.saveHealthLog(
          createMockHealthLog(id: 'u1', horseId: 'h1', notes: 'v1'),
        );
        expect(syncQueue.pendingCount, 1);
        expect(syncQueue.peek()!.action, SyncAction.create);

        await repository.saveHealthLog(
          createMockHealthLog(id: 'u1', horseId: 'h1', notes: 'v2'),
        );

        // Coalescing: create + update → single update
        expect(syncQueue.pendingCount, 1);
        expect(syncQueue.peek()!.action, SyncAction.update);

        final result = await repository.fetchAllByHorse('h1');
        expect(result.value.length, 1);
        expect(result.value.first.notes, 'v2');
      },
    );
  });

  // ── delete no-op + findById ─────────────────────────────────

  test('delete of unknown id is a no-op and findById distinguishes', () async {
    // findById returns null for missing entity.
    final missing = await repository.findById('absent');
    expect(missing.isSuccess, true);
    expect(missing.value, isNull);

    // Save, then delete unknown id → no-op, no sync.
    await repository.saveHealthLog(
      createMockHealthLog(id: 'd1', horseId: 'h1'),
    );
    syncQueue.clear();

    final delResult = await repository.deleteHealthLog('h1', 'unknown');
    expect(delResult.isSuccess, true);
    expect(syncQueue.pendingCount, 0);

    // findById returns the existing entity.
    final found = await repository.findById('d1');
    expect(found.isSuccess, true);
    expect(found.value, isNotNull);
  });
}
