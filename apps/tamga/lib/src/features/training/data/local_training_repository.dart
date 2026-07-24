import 'package:isar/isar.dart';

import '../../../core/data/local_repository.dart';
import '../../../core/error/result.dart';
import '../../../core/sync/sync_queue.dart';
import '../../../features/shared/data/isar_schemas/isar_training_log.dart';
import '../../../features/shared/data/isar_schemas/isar_performance_record.dart';
import '../domain/training_log.dart';
import '../domain/performance_record.dart';
import 'training_repository.dart';

/// Local-first [TrainingRepository] implementation backed by Isar.
class LocalTrainingRepository
    extends LocalRepository<TrainingLog, IsarTrainingLog>
    implements TrainingRepository {
  LocalTrainingRepository({required super.storage, required super.syncQueue});

  @override
  IsarCollection<IsarTrainingLog> get collection => storage.trainingLogs;

  @override
  String get entityType => 'training_log';

  @override
  TrainingLog toDomain(IsarTrainingLog entity) => entity.toDomain();

  @override
  IsarTrainingLog fromDomain(TrainingLog entity) =>
      IsarTrainingLog.fromDomain(entity);

  @override
  String domainIdOf(TrainingLog entity) => entity.id;

  @override
  Map<String, dynamic> toDataJson(TrainingLog entity) => entity.toJson();

  // ── TrainingLog CRUD ────────────────────────────────────────────

  @override
  Future<Result<List<TrainingLog>>> fetchByHorse(String horseId) async {
    return Result.tryFuture(() async {
      final stored = await collection
          .filter()
          .horseIdEqualTo(horseId)
          .findAll();
      return stored.map(toDomain).toList();
    });
  }

  // ── PerformanceRecord CRUD ──────────────────────────────────────

  @override
  Future<Result<List<PerformanceRecord>>> fetchPerformanceByHorse(
    String horseId,
  ) async {
    return Result.tryFuture(() async {
      final stored = await storage.performanceRecords
          .filter()
          .horseIdEqualTo(horseId)
          .findAll();
      return stored.map((e) => e.toDomain()).toList();
    });
  }

  @override
  Future<Result<PerformanceRecord>> savePerformance(
    PerformanceRecord record,
  ) async {
    return Result.tryFuture(() async {
      final existing = await storage.performanceRecords
          .filter()
          .domainIdEqualTo(record.id)
          .findFirst();
      final isNew = existing == null;

      final isarRecord = IsarPerformanceRecord.fromDomain(record);
      if (!isNew) {
        isarRecord.id = existing.id;
      }
      await storage.performanceRecords.isar.writeTxn(() async {
        await storage.performanceRecords.put(isarRecord);
      });

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'performance',
          entityId: record.id,
          action: isNew ? SyncAction.create : SyncAction.update,
          data: record.toJson(),
          timestamp: DateTime.now(),
        ),
      );

      return record;
    });
  }

  @override
  Future<Result<void>> deletePerformance(String id) async {
    return Result.tryFuture(() async {
      final toDelete = await storage.performanceRecords
          .filter()
          .domainIdEqualTo(id)
          .findFirst();
      if (toDelete != null) {
        await storage.performanceRecords.isar.writeTxn(() async {
          await storage.performanceRecords.delete(toDelete.id);
        });
        syncQueue.enqueue(
          SyncQueueItem(
            entityType: 'performance',
            entityId: id,
            action: SyncAction.delete,
            data: {},
            timestamp: DateTime.now(),
          ),
        );
      }
    });
  }
}
