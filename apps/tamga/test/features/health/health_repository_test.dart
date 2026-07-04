import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/storage/isar_database.dart';

import '../../helpers/test_helpers.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';
import 'package:tamga/src/shared/domain/health_log.dart';
import 'package:tamga/src/features/health/data/local_health_repository.dart';

void main() {
  group('LocalHealthRepository', () {
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

    group('MedicalLogs', () {
      test('fetchMedicalLogs returns empty list for unknown horse', () async {
        final result = await repository.fetchMedicalLogs('unknown-horse');
        expect(result.isSuccess, true);
        expect(result.value, isEmpty);
      });

      test('saveHealthLog adds a log', () async {
        await repository.saveHealthLog(
          HealthLog(
            id: 'med-1',
            horseId: 'h1',
            logType: LogType.vaccination,
            date: DateTime(2026, 5, 1),
            notes: 'Вакцин',
            medicament: 'Томуу-Вак',
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );
        final fetchResult = await repository.fetchMedicalLogs('h1');
        expect(fetchResult.value.length, 1);
        expect(fetchResult.value.first.logType, LogType.vaccination);
        expect(fetchResult.value.first.medicament, 'Томуу-Вак');
      });

      test('saveHealthLog enqueues sync action', () async {
        await repository.saveHealthLog(
          HealthLog(
            id: 'med-2',
            horseId: 'h1',
            logType: LogType.deworming,
            date: DateTime.now(),
            notes: 'Туулгалт',
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );
        expect(syncQueue.pendingCount, 1);
        expect(syncQueue.peek()!.entityType, 'health');
        expect(syncQueue.peek()!.action, SyncAction.create);
      });

      test('deleteHealthLog removes a log', () async {
        await repository.saveHealthLog(
          HealthLog(
            id: 'med-1',
            horseId: 'h1',
            logType: LogType.vaccination,
            date: DateTime.now(),
            notes: 'Del',
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );
        syncQueue.clear();
        await repository.deleteHealthLog('h1', 'med-1');
        final fetch = await repository.fetchMedicalLogs('h1');
        expect(fetch.value, isEmpty);
        expect(syncQueue.peek()!.action, SyncAction.delete);
      });
    });

    group('HealthLog model', () {
      test('displayName returns Mongolian labels', () {
        expect(LogType.vaccination.displayName, 'Вакцинжуулалт');
        expect(LogType.deworming.displayName, 'Туулгалт');
        expect(LogType.treatment.displayName, 'Эмчилгээ');
        expect(LogType.vetVisit.displayName, 'Эмчийн үзлэг');
      });
    });
  });
}
