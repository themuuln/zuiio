import 'package:isar/isar.dart';

import '../../../app/supabase_bootstrap.dart';
import '../../../core/data/local_repository.dart';
import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../../core/sync/sync_queue.dart';
import '../../shared/data/isar_schemas/isar_horse.dart';
import '../../shared/data/local_sync_preferences.dart';
import '../../shared/data/pagination/paginated_result.dart';
import '../domain/horse_record.dart';
import 'horses_repository.dart';

class LocalHorsesRepository extends LocalRepository<HorseRecord, IsarHorse>
    implements HorsesRepository {
  LocalHorsesRepository({
    required super.storage,
    required super.syncQueue,
    super.syncStorage,
  });

  @override
  IsarCollection<IsarHorse> get collection => storage.horses;

  @override
  String get entityType => 'horse';

  @override
  HorseRecord toDomain(IsarHorse entity) => entity.toDomain();

  @override
  IsarHorse fromDomain(HorseRecord entity) => IsarHorse.fromDomain(entity);

  @override
  String domainIdOf(HorseRecord entity) => entity.id;

  @override
  Map<String, dynamic> toDataJson(HorseRecord entity) => entity.toJson();

  @override
  Future<Result<List<HorseRecord>>> fetchHorses() async {
    try {
      final local = await _readLocal();
      if (!await LocalSyncPreferences.isAutoSyncEnabledFromStorage()) {
        return Result.ok(local);
      }
      return syncHorses();
    } catch (e) {
      return Result.fail(
        AppException.withDetail('FETCH_HORSES_ERROR', e.toString()),
      );
    }
  }

  @override
  Future<Result<PaginatedResult<HorseRecord>>> fetchHorsesPaginated({
    required int page,
    required int limit,
  }) async {
    return Result.tryFuture(() async {
      final stored = await collection
          .where()
          .offset(page * limit)
          .limit(limit)
          .findAll();
      final totalCount = await collection.where().count();
      return PaginatedResult(
        items: stored.map(toDomain).toList(),
        totalCount: totalCount,
      );
    });
  }

  @override
  Future<Result<List<HorseRecord>>> syncHorses() async {
    try {
      final local = await _readLocal();
      final client = getConfiguredSupabaseClient();
      final userId = await ensureSupabaseUserId();
      if (client == null || userId == null) {
        return Result.ok(local);
      }

      await client
          .from('horses')
          .upsert(
            local.map((item) => item.toSupabaseJson(ownerId: userId)).toList(),
          );
      final response = await client.from('horses').select().order('birth_year');
      final remote = (response as List<dynamic>)
          .map(
            (item) =>
                HorseRecord.fromSupabaseJson(item as Map<String, dynamic>),
          )
          .toList();

      // Replace local collection with remote data
      await collection.isar.writeTxn(() async {
        await collection.where().deleteAll();
        await collection.putAll(remote.map(IsarHorse.fromDomain).toList());
      });

      return Result.ok(remote);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('SYNC_HORSES_ERROR', e.toString()),
      );
    }
  }

  @override
  Future<Result<HorseRecord>> saveHorse(HorseRecord horse) async {
    try {
      final local = await _readLocal();
      final index = local.indexWhere((item) => item.id == horse.id);
      final next = [...local];
      if (index >= 0) {
        next[index] = horse;
      } else {
        next.add(horse);
      }

      // Replace local collection
      await collection.isar.writeTxn(() async {
        await collection.where().deleteAll();
        await collection.putAll(next.map(IsarHorse.fromDomain).toList());
      });

      final item = SyncQueueItem(
        entityType: 'horse',
        entityId: horse.id,
        action: index >= 0 ? SyncAction.update : SyncAction.create,
        data: horse.toJson(),
        timestamp: DateTime.now(),
      );
      syncQueue.enqueue(item);
      await persistEnqueue(item);

      if (!await LocalSyncPreferences.isAutoSyncEnabledFromStorage()) {
        return Result.ok(horse);
      }

      // Sync and return the saved horse
      await syncHorses();
      return Result.ok(horse);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('SAVE_HORSE_ERROR', e.toString()),
      );
    }
  }

  @override
  Future<Result<void>> deleteHorse(String id) async {
    try {
      final toDelete = await collection.filter().domainIdEqualTo(id).findAll();
      if (toDelete.isEmpty) {
        return const Result.ok(null);
      }

      await collection.isar.writeTxn(() async {
        for (final item in toDelete) {
          await collection.delete(item.id);
        }
      });

      final item = SyncQueueItem(
        entityType: 'horse',
        entityId: id,
        action: SyncAction.delete,
        data: {},
        timestamp: DateTime.now(),
      );
      syncQueue.enqueue(item);
      await persistEnqueue(item);

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('DELETE_HORSE_ERROR', e.toString()),
      );
    }
  }

  Future<List<HorseRecord>> _readLocal() async {
    final stored = await collection.where().findAll();
    return stored.map(toDomain).toList();
  }
}
