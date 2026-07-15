import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/storage/isar_database.dart';

import '../../../helpers/test_helpers.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';
import 'package:tamga/src/features/training/domain/training_log.dart';
import 'package:tamga/src/features/training/domain/performance_record.dart';
import 'package:tamga/src/features/training/data/local_training_repository.dart';

void main() {
  group('LocalTrainingRepository', () {
    late SyncQueue syncQueue;
    late LocalTrainingRepository repository;

    setUp(() async {
      await setupTestEnvironment();
      await IsarDatabase.initialize();
      syncQueue = SyncQueue();
      repository = LocalTrainingRepository(
        storage: IsarStorage.instance,
        syncQueue: syncQueue,
      );
    });

    tearDown(() async {
      await IsarDatabase.close();
    });

    group('TrainingLog', () {
      test('fetchByHorse returns empty list for unknown horse', () async {
        final result = await repository.fetchByHorse('unknown-horse');
        expect(result.isSuccess, true);
        expect(result.value, isEmpty);
      });

      test('save creates a training log', () async {
        await repository.save(
          TrainingLog(
            id: 'tl-1',
            horseId: 'h1',
            type: TrainingLogType.gallop,
            date: DateTime(2026, 6, 1),
            durationMinutes: 30,
            distanceKm: 5.0,
            notes: 'Хурдалгаа',
            handlerName: 'Дорж',
            weather: 'Сайн',
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );
        final fetchResult = await repository.fetchByHorse('h1');
        expect(fetchResult.value.length, 1);
        expect(fetchResult.value.first.type, TrainingLogType.gallop);
        expect(fetchResult.value.first.durationMinutes, 30);
        expect(fetchResult.value.first.distanceKm, 5.0);
        expect(fetchResult.value.first.handlerName, 'Дорж');
        expect(fetchResult.value.first.weather, 'Сайн');
      });

      test('save enqueues sync action', () async {
        await repository.save(
          TrainingLog(
            id: 'tl-2',
            horseId: 'h1',
            type: TrainingLogType.sprint,
            date: DateTime.now(),
            durationMinutes: 20,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );
        expect(syncQueue.pendingCount, 1);
        expect(syncQueue.peek()!.entityType, 'training_log');
        expect(syncQueue.peek()!.action, SyncAction.create);
      });

      test('save update enqueues update sync action', () async {
        await repository.save(
          TrainingLog(
            id: 'tl-3',
            horseId: 'h1',
            type: TrainingLogType.endurance,
            date: DateTime.now(),
            durationMinutes: 60,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );
        syncQueue.clear();
        await repository.save(
          TrainingLog(
            id: 'tl-3',
            horseId: 'h1',
            type: TrainingLogType.endurance,
            date: DateTime.now(),
            durationMinutes: 90,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );
        expect(syncQueue.peek()!.action, SyncAction.update);
      });

      test('delete removes a training log', () async {
        await repository.save(
          TrainingLog(
            id: 'tl-del-1',
            horseId: 'h1',
            type: TrainingLogType.gallop,
            date: DateTime.now(),
            durationMinutes: 30,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );
        syncQueue.clear();
        await repository.delete('tl-del-1');
        final fetch = await repository.fetchByHorse('h1');
        expect(fetch.value, isEmpty);
        expect(syncQueue.peek()!.action, SyncAction.delete);
      });

      test('fetchByHorse returns only logs for the specified horse', () async {
        await repository.save(
          TrainingLog(
            id: 'tl-a',
            horseId: 'horse-a',
            type: TrainingLogType.gallop,
            date: DateTime.now(),
            durationMinutes: 30,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );
        await repository.save(
          TrainingLog(
            id: 'tl-b',
            horseId: 'horse-b',
            type: TrainingLogType.sprint,
            date: DateTime.now(),
            durationMinutes: 20,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );
        final resultA = await repository.fetchByHorse('horse-a');
        expect(resultA.value.length, 1);
        expect(resultA.value.first.id, 'tl-a');

        final resultB = await repository.fetchByHorse('horse-b');
        expect(resultB.value.length, 1);
        expect(resultB.value.first.id, 'tl-b');
      });
    });

    group('PerformanceRecord', () {
      test(
        'fetchPerformanceByHorse returns empty list for unknown horse',
        () async {
          final result = await repository.fetchPerformanceByHorse(
            'unknown-horse',
          );
          expect(result.isSuccess, true);
          expect(result.value, isEmpty);
        },
      );

      test('savePerformance creates a performance record', () async {
        await repository.savePerformance(
          PerformanceRecord(
            id: 'pr-1',
            horseId: 'h1',
            metric: MetricType.speed,
            value: 45.0,
            unit: 'км/ц',
            notes: 'Хурд хэмжилт',
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );
        final fetchResult = await repository.fetchPerformanceByHorse('h1');
        expect(fetchResult.value.length, 1);
        expect(fetchResult.value.first.metric, MetricType.speed);
        expect(fetchResult.value.first.value, 45.0);
        expect(fetchResult.value.first.unit, 'км/ц');
      });

      test('savePerformance enqueues sync action', () async {
        await repository.savePerformance(
          PerformanceRecord(
            id: 'pr-2',
            horseId: 'h1',
            metric: MetricType.weight,
            value: 350.0,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );
        expect(syncQueue.pendingCount, 1);
        expect(syncQueue.peek()!.entityType, 'performance');
        expect(syncQueue.peek()!.action, SyncAction.create);
      });

      test('deletePerformance removes a performance record', () async {
        await repository.savePerformance(
          PerformanceRecord(
            id: 'pr-del-1',
            horseId: 'h1',
            metric: MetricType.condition,
            value: 8.0,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );
        syncQueue.clear();
        await repository.deletePerformance('pr-del-1');
        final fetch = await repository.fetchPerformanceByHorse('h1');
        expect(fetch.value, isEmpty);
        expect(syncQueue.peek()!.action, SyncAction.delete);
      });
    });

    group('model displayName', () {
      test('TrainingLogType displayName returns Mongolian labels', () {
        expect(TrainingLogType.gallop.displayName, 'Хурдалгаа');
        expect(TrainingLogType.sprint.displayName, 'Спринт');
        expect(TrainingLogType.endurance.displayName, 'Тэвчээр');
        expect(TrainingLogType.rest.displayName, 'Амралт');
      });

      test('MetricType displayName returns Mongolian labels', () {
        expect(MetricType.speed.displayName, 'Хурд');
        expect(MetricType.endurance.displayName, 'Тэвчээр');
        expect(MetricType.weight.displayName, 'Жин');
        expect(MetricType.condition.displayName, 'Биеийн байдал');
      });
    });
  });
}
