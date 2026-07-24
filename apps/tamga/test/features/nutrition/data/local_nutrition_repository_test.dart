import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/storage/isar_database.dart';

import '../../../helpers/test_helpers.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';
import 'package:tamga/src/features/nutrition/domain/feed_schedule.dart';
import 'package:tamga/src/features/nutrition/domain/feed_log.dart';
import 'package:tamga/src/features/nutrition/data/local_nutrition_repository.dart';

void main() {
  group('LocalNutritionRepository', () {
    late SyncQueue syncQueue;
    late LocalNutritionRepository repository;

    setUp(() async {
      await setupTestEnvironment();
      await IsarDatabase.initialize();
      syncQueue = SyncQueue();
      repository = LocalNutritionRepository(
        storage: IsarStorage.instance,
        syncQueue: syncQueue,
      );
    });

    tearDown(() async {
      await IsarDatabase.close();
    });

    group('FeedSchedule', () {
      test('fetchSchedules returns empty list for unknown horse', () async {
        final result = await repository.fetchSchedules('unknown-horse');
        expect(result.isSuccess, true);
        expect(result.value, isEmpty);
      });

      test('saveSchedule creates a feed schedule', () async {
        await repository.saveSchedule(
          FeedSchedule(
            id: 'fs-1',
            horseId: 'h1',
            feedType: FeedType.hay,
            quantityKg: 5.0,
            frequency: 'Өдөр бүр',
            startDate: DateTime(2026, 6, 1),
            endDate: DateTime(2026, 8, 1),
            notes: 'Өвс нэмэх',
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );
        final fetchResult = await repository.fetchSchedules('h1');
        expect(fetchResult.value.length, 1);
        expect(fetchResult.value.first.feedType, FeedType.hay);
        expect(fetchResult.value.first.quantityKg, 5.0);
        expect(fetchResult.value.first.frequency, 'Өдөр бүр');
      });

      test('saveSchedule enqueues sync action', () async {
        await repository.saveSchedule(
          FeedSchedule(
            id: 'fs-2',
            horseId: 'h1',
            feedType: FeedType.grain,
            quantityKg: 2.0,
            frequency: 'Өдөрт 2 удаа',
            startDate: DateTime.now(),
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );
        expect(syncQueue.pendingCount, 1);
        expect(syncQueue.peek()!.entityType, 'feed_schedule');
        expect(syncQueue.peek()!.action, SyncAction.create);
      });

      test('saveSchedule update enqueues update sync action', () async {
        await repository.saveSchedule(
          FeedSchedule(
            id: 'fs-3',
            horseId: 'h1',
            feedType: FeedType.supplement,
            quantityKg: 0.5,
            frequency: 'Долоо хоногт 1 удаа',
            startDate: DateTime.now(),
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );
        syncQueue.clear();
        await repository.saveSchedule(
          FeedSchedule(
            id: 'fs-3',
            horseId: 'h1',
            feedType: FeedType.supplement,
            quantityKg: 1.0,
            frequency: 'Долоо хоногт 1 удаа',
            startDate: DateTime.now(),
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );
        expect(syncQueue.peek()!.action, SyncAction.update);
      });

      test('deleteSchedule removes a feed schedule', () async {
        await repository.saveSchedule(
          FeedSchedule(
            id: 'fs-del-1',
            horseId: 'h1',
            feedType: FeedType.hay,
            quantityKg: 5.0,
            frequency: 'Өдөр бүр',
            startDate: DateTime.now(),
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );
        syncQueue.clear();
        await repository.deleteSchedule('fs-del-1');
        final fetch = await repository.fetchSchedules('h1');
        expect(fetch.value, isEmpty);
        expect(syncQueue.peek()!.action, SyncAction.delete);
      });

      test('fetchSchedules returns only schedules for the specified horse',
          () async {
        await repository.saveSchedule(
          FeedSchedule(
            id: 'fs-a',
            horseId: 'horse-a',
            feedType: FeedType.hay,
            quantityKg: 5.0,
            frequency: 'Өдөр бүр',
            startDate: DateTime.now(),
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );
        await repository.saveSchedule(
          FeedSchedule(
            id: 'fs-b',
            horseId: 'horse-b',
            feedType: FeedType.grain,
            quantityKg: 2.0,
            frequency: 'Өдөрт 2 удаа',
            startDate: DateTime.now(),
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );
        final resultA = await repository.fetchSchedules('horse-a');
        expect(resultA.value.length, 1);
        expect(resultA.value.first.id, 'fs-a');

        final resultB = await repository.fetchSchedules('horse-b');
        expect(resultB.value.length, 1);
        expect(resultB.value.first.id, 'fs-b');
      });
    });

    group('FeedLog', () {
      test('fetchLogs returns empty list for unknown horse', () async {
        final result = await repository.fetchLogs('unknown-horse');
        expect(result.isSuccess, true);
        expect(result.value, isEmpty);
      });

      test('saveLog creates a feed log', () async {
        await repository.saveLog(
          FeedLog(
            id: 'fl-1',
            scheduleId: 'fs-1',
            horseId: 'h1',
            date: DateTime(2026, 6, 1),
            amountGiven: 4.5,
            skipped: false,
            notes: 'Өглөө хооллосон',
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );
        final fetchResult = await repository.fetchLogs('h1');
        expect(fetchResult.value.length, 1);
        expect(fetchResult.value.first.amountGiven, 4.5);
        expect(fetchResult.value.first.skipped, false);
        expect(fetchResult.value.first.notes, 'Өглөө хооллосон');
      });

      test('saveLog enqueues sync action', () async {
        await repository.saveLog(
          FeedLog(
            id: 'fl-2',
            scheduleId: 'fs-1',
            horseId: 'h1',
            date: DateTime.now(),
            amountGiven: 2.0,
            skipped: false,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );
        expect(syncQueue.pendingCount, 1);
        expect(syncQueue.peek()!.entityType, 'feed_log');
        expect(syncQueue.peek()!.action, SyncAction.create);
      });

      test('deleteLog removes a feed log', () async {
        await repository.saveLog(
          FeedLog(
            id: 'fl-del-1',
            scheduleId: 'fs-1',
            horseId: 'h1',
            date: DateTime.now(),
            amountGiven: 5.0,
            skipped: false,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );
        syncQueue.clear();
        await repository.deleteLog('fl-del-1');
        final fetch = await repository.fetchLogs('h1');
        expect(fetch.value, isEmpty);
        expect(syncQueue.peek()!.action, SyncAction.delete);
      });

      test('fetchLogsByDateRange returns logs within range', () async {
        await repository.saveLog(
          FeedLog(
            id: 'fl-date-1',
            scheduleId: 'fs-1',
            horseId: 'h1',
            date: DateTime(2026, 6, 5),
            amountGiven: 5.0,
            skipped: false,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );
        await repository.saveLog(
          FeedLog(
            id: 'fl-date-2',
            scheduleId: 'fs-1',
            horseId: 'h1',
            date: DateTime(2026, 6, 10),
            amountGiven: 5.0,
            skipped: false,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );
        await repository.saveLog(
          FeedLog(
            id: 'fl-date-3',
            scheduleId: 'fs-1',
            horseId: 'h1',
            date: DateTime(2026, 6, 20),
            amountGiven: 5.0,
            skipped: false,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );

        final result = await repository.fetchLogsByDateRange(
          'h1',
          DateTime(2026, 6, 1),
          DateTime(2026, 6, 15),
        );
        expect(result.isSuccess, true);
        expect(result.value.length, 2);
        expect(result.value.map((l) => l.id),
            containsAll(['fl-date-1', 'fl-date-2']));
      });
    });

    group('model displayName', () {
      test('FeedType displayName returns Mongolian labels', () {
        expect(FeedType.hay.displayName, 'Өвс');
        expect(FeedType.grain.displayName, 'Тэжээл');
        expect(FeedType.supplement.displayName, 'Нэмэлт');
      });
    });
  });
}
