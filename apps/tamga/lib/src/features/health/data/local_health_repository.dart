import 'package:isar/isar.dart';

import '../../../core/data/local_repository.dart';
import '../../../core/error/result.dart';
import '../../../shared/domain/health_log.dart';
import '../../shared/data/isar_schemas/isar_health_log.dart';
import '../../shared/data/pagination/paginated_result.dart';
import 'health_repository.dart';

/// Local-first HealthRepository implementation backed by Isar.
class LocalHealthRepository extends LocalRepository<HealthLog, IsarHealthLog>
    implements HealthRepository {
  LocalHealthRepository({
    required super.storage,
    required super.syncQueue,
    super.syncStorage,
  });

  @override
  IsarCollection<IsarHealthLog> get collection => storage.healthLogs;

  @override
  String get entityType => 'health';

  @override
  HealthLog toDomain(IsarHealthLog entity) => entity.toDomain();

  @override
  IsarHealthLog fromDomain(HealthLog entity) =>
      IsarHealthLog.fromDomain(entity);

  @override
  String domainIdOf(HealthLog entity) => entity.id;

  @override
  Map<String, dynamic> toDataJson(HealthLog entity) => entity.toJson();

  @override
  Future<Result<List<HealthLog>>> fetchAll() => findAll();

  @override
  Future<Result<List<HealthLog>>> fetchMedicalLogs(String horseId) async {
    return Result.tryFuture(() async {
      final stored = await collection
          .filter()
          .horseIdEqualTo(horseId)
          .findAll();
      return stored.map(toDomain).toList();
    });
  }

  @override
  Future<Result<List<HealthLog>>> fetchAllByHorse(String horseId) async {
    return Result.tryFuture(() async {
      final stored = await collection
          .filter()
          .horseIdEqualTo(horseId)
          .findAll();
      return stored.map(toDomain).toList();
    });
  }

  @override
  Future<Result<PaginatedResult<HealthLog>>> fetchAllByHorsePaginated({
    required String horseId,
    required int page,
    required int limit,
  }) async {
    return Result.tryFuture(() async {
      final totalCount = await collection
          .where()
          .horseIdEqualTo(horseId)
          .count();
      final stored = await collection
          .where()
          .horseIdEqualTo(horseId)
          .offset(page * limit)
          .limit(limit)
          .findAll();
      return PaginatedResult(
        items: stored.map(toDomain).toList(),
        totalCount: totalCount,
      );
    });
  }

  @override
  Future<Result<HealthLog>> saveHealthLog(HealthLog log) => save(log);

  @override
  Future<Result<void>> deleteHealthLog(String horseId, String logId) =>
      delete(logId);
}
