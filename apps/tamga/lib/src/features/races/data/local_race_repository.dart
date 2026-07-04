import 'package:isar/isar.dart';
import 'package:uuid/uuid.dart';

import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../../core/sync/sync_queue.dart';
import '../../shared/data/isar_storage.dart';
import '../domain/race.dart';
import 'isar_schemas/isar_race.dart';
import 'race_repository.dart';

/// Isar болон SyncQueue-д суурилсан RaceRepository хэрэгжилт.
///
/// Бүх уралдааны үйлдлийг локал Isar-д хадгаж,
/// SyncQueue-д нэмж, дараа нь Supabase руу синк хийнэ.
class LocalRaceRepository implements RaceRepository {
  LocalRaceRepository({
    required IsarStorage storage,
    required SyncQueue syncQueue,
  }) : _storage = storage,
       _syncQueue = syncQueue;

  final IsarStorage _storage;
  final SyncQueue _syncQueue;

  @override
  Future<Result<List<Race>>> fetchAll() async {
    return Result.tryFuture(() async {
      final stored = await _storage.races.where().findAll();
      return stored.map((e) => e.toDomain()).toList();
    });
  }

  @override
  Future<Result<Race>> fetchById(String id) async {
    return Result.tryFuture(() async {
      final stored = await _storage.races
          .filter()
          .domainIdEqualTo(id)
          .findFirst();

      if (stored == null) {
        throw AppException(
          message: 'Уралдаан олдсонгүй',
          code: 'RACE_NOT_FOUND',
          details: {'raceId': id},
        );
      }

      return stored.toDomain();
    });
  }

  @override
  Future<Result<List<Race>>> fetchByType(RaceType type) async {
    return Result.tryFuture(() async {
      final stored = await _storage.races
          .filter()
          .raceTypeEqualTo(type)
          .findAll();
      return stored.map((e) => e.toDomain()).toList();
    });
  }

  @override
  Future<Result<Race>> create(Race race) async {
    return Result.tryFuture(() async {
      final id = race.id.isEmpty ? const Uuid().v4() : race.id;
      final now = DateTime.now();

      final raceWithId = race.copyWith(id: id);

      final isarRace = IsarRace.fromDomain(raceWithId);
      await _storage.races.isar.writeTxn(() async {
        await _storage.races.put(isarRace);
      });

      _syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'race',
          entityId: id,
          action: SyncAction.create,
          data: raceWithId.toJson(),
          timestamp: now,
        ),
      );

      return raceWithId;
    });
  }

  @override
  Future<Result<Race>> update(Race race) async {
    return Result.tryFuture(() async {
      final existing = await _storage.races
          .filter()
          .domainIdEqualTo(race.id)
          .findFirst();

      if (existing == null) {
        throw AppException(
          message: 'Уралдаан олдсонгүй',
          code: 'RACE_NOT_FOUND',
          details: {'raceId': race.id},
        );
      }

      final isarRace = IsarRace.fromDomain(race);
      isarRace.id = existing.id;

      await _storage.races.isar.writeTxn(() async {
        await _storage.races.put(isarRace);
      });

      _syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'race',
          entityId: race.id,
          action: SyncAction.update,
          data: race.toJson(),
          timestamp: DateTime.now(),
        ),
      );

      return race;
    });
  }

  @override
  Future<Result<void>> delete(String id) async {
    return Result.tryFuture(() async {
      final toDelete = await _storage.races
          .filter()
          .domainIdEqualTo(id)
          .findFirst();

      if (toDelete != null) {
        await _storage.races.isar.writeTxn(() async {
          await _storage.races.delete(toDelete.id);
        });

        _syncQueue.enqueue(
          SyncQueueItem(
            entityType: 'race',
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
