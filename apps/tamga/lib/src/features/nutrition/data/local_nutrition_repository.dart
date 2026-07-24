import 'package:isar/isar.dart';

import '../../../core/data/local_repository.dart';
import '../../../core/error/result.dart';
import '../../../core/sync/sync_queue.dart';
import '../../../features/shared/data/isar_schemas/isar_feed_schedule.dart';
import '../../../features/shared/data/isar_schemas/isar_feed_log.dart';
import '../domain/feed_schedule.dart';
import '../domain/feed_log.dart';
import 'nutrition_repository.dart';

/// Local-first [NutritionRepository] implementation backed by Isar.
class LocalNutritionRepository
    extends LocalRepository<FeedSchedule, IsarFeedSchedule>
    implements NutritionRepository {
  LocalNutritionRepository({required super.storage, required super.syncQueue});

  @override
  IsarCollection<IsarFeedSchedule> get collection => storage.feedSchedules;

  @override
  String get entityType => 'feed_schedule';

  @override
  FeedSchedule toDomain(IsarFeedSchedule entity) => entity.toDomain();

  @override
  IsarFeedSchedule fromDomain(FeedSchedule entity) =>
      IsarFeedSchedule.fromDomain(entity);

  @override
  String domainIdOf(FeedSchedule entity) => entity.id;

  @override
  Map<String, dynamic> toDataJson(FeedSchedule entity) => entity.toJson();

  // ── FeedSchedule CRUD ───────────────────────────────────────────

  @override
  Future<Result<List<FeedSchedule>>> fetchSchedules(String horseId) async {
    return Result.tryFuture(() async {
      final stored = await collection
          .filter()
          .horseIdEqualTo(horseId)
          .findAll();
      return stored.map(toDomain).toList();
    });
  }

  @override
  Future<Result<FeedSchedule>> saveSchedule(FeedSchedule schedule) =>
      save(schedule);

  @override
  Future<Result<void>> deleteSchedule(String id) => delete(id);

  // ── FeedLog CRUD ────────────────────────────────────────────────

  @override
  Future<Result<List<FeedLog>>> fetchLogs(String horseId) async {
    return Result.tryFuture(() async {
      final stored = await storage.feedLogs
          .filter()
          .horseIdEqualTo(horseId)
          .findAll();
      return stored.map((e) => e.toDomain()).toList();
    });
  }

  @override
  Future<Result<List<FeedLog>>> fetchLogsByDateRange(
    String horseId,
    DateTime startDate,
    DateTime endDate,
  ) async {
    return Result.tryFuture(() async {
      final stored = await storage.feedLogs
          .filter()
          .horseIdEqualTo(horseId)
          .dateGreaterThan(startDate.subtract(const Duration(days: 1)))
          .dateLessThan(endDate.add(const Duration(days: 1)))
          .findAll();
      return stored.map((e) => e.toDomain()).toList();
    });
  }

  @override
  Future<Result<FeedLog>> saveLog(FeedLog log) async {
    return Result.tryFuture(() async {
      final existing = await storage.feedLogs
          .filter()
          .domainIdEqualTo(log.id)
          .findFirst();
      final isNew = existing == null;

      final isarLog = IsarFeedLog.fromDomain(log);
      if (!isNew) {
        isarLog.id = existing.id;
      }
      await storage.feedLogs.isar.writeTxn(() async {
        await storage.feedLogs.put(isarLog);
      });

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'feed_log',
          entityId: log.id,
          action: isNew ? SyncAction.create : SyncAction.update,
          data: log.toJson(),
          timestamp: DateTime.now(),
        ),
      );

      return log;
    });
  }

  @override
  Future<Result<void>> deleteLog(String id) async {
    return Result.tryFuture(() async {
      final toDelete = await storage.feedLogs
          .filter()
          .domainIdEqualTo(id)
          .findFirst();
      if (toDelete != null) {
        await storage.feedLogs.isar.writeTxn(() async {
          await storage.feedLogs.delete(toDelete.id);
        });
        syncQueue.enqueue(
          SyncQueueItem(
            entityType: 'feed_log',
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
