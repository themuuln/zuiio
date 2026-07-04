import 'package:isar/isar.dart';
import 'package:uuid/uuid.dart';

import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../../core/sync/sync_queue.dart';
import '../../shared/data/isar_storage.dart';
import '../domain/race_entry.dart';
import 'isar_schemas/isar_race_entry.dart';
import 'race_entry_repository.dart';
import 'race_repository.dart';

/// Isar болон SyncQueue-д суурилсан RaceEntryRepository хэрэгжилт.
///
/// Бүх бүртгэлийн үйлдлийг локал Isar-д хадгаж,
/// SyncQueue-д нэмж, дараа нь Supabase руу синк хийнэ.
///
/// Давхар бүртгэлээс сэргийлж, оролцогчдын тоог хязгаарлана.
class LocalRaceEntryRepository implements RaceEntryRepository {
  LocalRaceEntryRepository({
    required IsarStorage storage,
    required SyncQueue syncQueue,
    required RaceRepository raceRepository,
  }) : _storage = storage,
       _syncQueue = syncQueue,
       _raceRepository = raceRepository;

  final IsarStorage _storage;
  final SyncQueue _syncQueue;
  final RaceRepository _raceRepository;

  @override
  Future<Result<List<RaceEntry>>> fetchByRace(String raceId) async {
    return Result.tryFuture(() async {
      final stored = await _storage.raceEntries
          .filter()
          .raceIdEqualTo(raceId)
          .findAll();
      return stored.map((e) => e.toDomain()).toList();
    });
  }

  @override
  Future<Result<List<RaceEntry>>> fetchByHorse(String horseId) async {
    return Result.tryFuture(() async {
      final stored = await _storage.raceEntries
          .filter()
          .horseIdEqualTo(horseId)
          .findAll();
      return stored.map((e) => e.toDomain()).toList();
    });
  }

  @override
  Future<Result<RaceEntry>> register({
    required String raceId,
    required String horseId,
    required String ownerId,
    required String jockeyName,
  }) async {
    try {
      // ── Duplicate check ──────────────────────────────────────
      final existing = await _storage.raceEntries
          .filter()
          .raceIdEqualTo(raceId)
          .and()
          .horseIdEqualTo(horseId)
          .and()
          .entryStatusEqualTo(RaceEntryStatus.registered)
          .findFirst();

      if (existing != null) {
        return Result.fail(DuplicateRegistrationException(raceId, horseId));
      }

      // ── Entry limit enforcement ───────────────────────────────
      final raceResult = await _raceRepository.fetchById(raceId);
      if (raceResult.isSuccess) {
        final race = raceResult.value;
        if (race.maxEntries != null && race.maxEntries! > 0) {
          final currentEntries = await _storage.raceEntries
              .filter()
              .raceIdEqualTo(raceId)
              .and()
              .entryStatusEqualTo(RaceEntryStatus.registered)
              .count();

          if (currentEntries >= race.maxEntries!) {
            return Result.fail(
              RaceEntryLimitException(raceId, race.maxEntries!),
            );
          }
        }
      }

      final id = const Uuid().v4();
      final now = DateTime.now();

      final entry = RaceEntry(
        id: id,
        raceId: raceId,
        horseId: horseId,
        ownerId: ownerId,
        jockeyName: jockeyName,
        status: RaceEntryStatus.registered,
      );

      final isarEntry = IsarRaceEntry.fromDomain(entry);
      await _storage.raceEntries.isar.writeTxn(() async {
        await _storage.raceEntries.put(isarEntry);
      });

      _syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'race_entry',
          entityId: id,
          action: SyncAction.create,
          data: entry.toJson(),
          timestamp: now,
        ),
      );

      return Result.ok(entry);
    } catch (e, stack) {
      if (e is AppException) {
        return Result.fail(e);
      }
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'ASYNC_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  @override
  Future<Result<RaceEntry>> cancel(String id) async {
    return Result.tryFuture(() async {
      final existing = await _storage.raceEntries
          .filter()
          .domainIdEqualTo(id)
          .findFirst();

      if (existing == null) {
        throw AppException(
          message: 'Бүртгэл олдсонгүй',
          code: 'ENTRY_NOT_FOUND',
        );
      }

      final updated = existing.toDomain().copyWith(
        status: RaceEntryStatus.scratched,
      );

      final isarEntry = IsarRaceEntry.fromDomain(updated);
      isarEntry.id = existing.id;

      await _storage.raceEntries.isar.writeTxn(() async {
        await _storage.raceEntries.put(isarEntry);
      });

      _syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'race_entry',
          entityId: id,
          action: SyncAction.update,
          data: updated.toJson(),
          timestamp: DateTime.now(),
        ),
      );

      return updated;
    });
  }

  @override
  Future<Result<RaceEntry>> updateResult({
    required String id,
    required String result,
    required int placement,
    required int prize,
  }) async {
    return Result.tryFuture(() async {
      final existing = await _storage.raceEntries
          .filter()
          .domainIdEqualTo(id)
          .findFirst();

      if (existing == null) {
        throw AppException(
          message: 'Бүртгэл олдсонгүй',
          code: 'ENTRY_NOT_FOUND',
        );
      }

      final updated = existing.toDomain().copyWith(
        status: RaceEntryStatus.competed,
        result: result,
        placement: placement,
        prize: prize,
      );

      final isarEntry = IsarRaceEntry.fromDomain(updated);
      isarEntry.id = existing.id;

      await _storage.raceEntries.isar.writeTxn(() async {
        await _storage.raceEntries.put(isarEntry);
      });

      _syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'race_entry',
          entityId: id,
          action: SyncAction.update,
          data: updated.toJson(),
          timestamp: DateTime.now(),
        ),
      );

      return updated;
    });
  }
}

// ── Custom Exceptions ──────────────────────────────────────────────

/// Давхар бүртгэлийн үед гаргах алдаа.
class DuplicateRegistrationException extends AppException {
  DuplicateRegistrationException(String raceId, String horseId)
    : super(
        message: 'Энэ морь аль хэдийн бүртгэгдсэн байна',
        code: 'DUPLICATE_RACE_REGISTRATION',
        details: {'raceId': raceId, 'horseId': horseId},
      );
}

/// Уралдааны оролцогчдын тооны хязгаарт хүрсэн үед гаргах алдаа.
class RaceEntryLimitException extends AppException {
  RaceEntryLimitException(String raceId, int maxEntries)
    : super(
        message: 'Уралдааны бүртгэл дүүрсэн байна',
        code: 'RACE_ENTRY_LIMIT_EXCEEDED',
        details: {'raceId': raceId, 'maxEntries': maxEntries},
      );
}
