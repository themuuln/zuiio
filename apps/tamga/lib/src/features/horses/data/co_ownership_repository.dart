import 'package:isar/isar.dart';

import '../../../app/supabase_bootstrap.dart';
import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../../core/sync/sync_queue.dart';
import '../../shared/data/isar_storage.dart';
import '../../shared/data/isar_schemas/isar_co_ownership_record.dart';
import '../domain/co_ownership.dart';

abstract class CoOwnershipRepository {
  Future<Result<List<CoOwnershipRecord>>> fetchCoOwners(String horseId);
  Future<Result<List<CoOwnershipRecord>>> saveCoOwner(CoOwnershipRecord record);
  Future<Result<List<CoOwnershipRecord>>> deleteCoOwner(String id);

  /// Pull co-ownership records from Supabase and reconcile with local storage.
  /// Returns the count of records pulled, or 0 if offline/unavailable.
  Future<Result<int>> syncCoOwnership();

  /// Real-time co-owner stream (Supabase only).
  Stream<List<CoOwnershipRecord>>? watchCoOwners(String horseId) => null;
}

class LocalCoOwnershipRepository implements CoOwnershipRepository {
  LocalCoOwnershipRepository({
    required IsarStorage storage,
    required SyncQueue syncQueue,
  }) : _storage = storage,
       _syncQueue = syncQueue;

  final IsarStorage _storage;
  final SyncQueue _syncQueue;

  static List<CoOwnershipRecord> get _seed => [
    CoOwnershipRecord(
      id: 'coowner-1',
      horseId: 'khan-khuleg',
      coOwnerName: 'Батсуурь',
      phone: '99112233',
      role: 'Туслах уяач',
      permissions: ['read', 'write_events'],
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    ),
    CoOwnershipRecord(
      id: 'coowner-2',
      horseId: 'altan-shuurga',
      coOwnerName: 'Дорж',
      phone: '88997766',
      role: 'Холбоотон уяач',
      permissions: ['read'],
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    ),
  ];

  @override
  Future<Result<List<CoOwnershipRecord>>> fetchCoOwners(String horseId) async {
    try {
      final stored = await _storage.coOwnershipRecords
          .filter()
          .horseIdEqualTo(horseId)
          .findAll();
      if (stored.isEmpty) {
        // Seed if empty
        final seeded = await _seedIfEmpty();
        return Result.ok(
          seeded.where((item) => item.horseId == horseId).toList(),
        );
      }
      return Result.ok(stored.map((e) => e.toDomain()).toList());
    } catch (e) {
      return Result.fail(
        AppException.withDetail('FETCH_CO_OWNERS_ERROR', e.toString()),
      );
    }
  }

  @override
  Future<Result<List<CoOwnershipRecord>>> saveCoOwner(
    CoOwnershipRecord record,
  ) async {
    try {
      final local = await _readLocal();
      final index = local.indexWhere((item) => item.id == record.id);
      final isNew = index < 0;
      final next = [...local];
      if (index >= 0) {
        next[index] = record;
      } else {
        next.add(record);
      }

      // Replace local collection within a write transaction
      await _storage.coOwnershipRecords.isar.writeTxn(() async {
        await _storage.coOwnershipRecords.where().deleteAll();
        await _storage.coOwnershipRecords.putAll(
          next.map(IsarCoOwnershipRecord.fromDomain).toList(),
        );
      });

      _syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'co_ownership',
          entityId: record.id,
          action: isNew ? SyncAction.create : SyncAction.update,
          data: record.toJson(),
          timestamp: DateTime.now(),
        ),
      );

      return Result.ok(
        next.where((item) => item.horseId == record.horseId).toList(),
      );
    } catch (e) {
      return Result.fail(
        AppException.withDetail('SAVE_CO_OWNER_ERROR', e.toString()),
      );
    }
  }

  @override
  Future<Result<List<CoOwnershipRecord>>> deleteCoOwner(String id) async {
    try {
      final local = await _readLocal();
      final next = local.where((item) => item.id != id).toList();

      // Replace local collection within a write transaction
      await _storage.coOwnershipRecords.isar.writeTxn(() async {
        await _storage.coOwnershipRecords.where().deleteAll();
        await _storage.coOwnershipRecords.putAll(
          next.map(IsarCoOwnershipRecord.fromDomain).toList(),
        );
      });

      _syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'co_ownership',
          entityId: id,
          action: SyncAction.delete,
          data: {},
          timestamp: DateTime.now(),
        ),
      );

      return Result.ok(next);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('DELETE_CO_OWNER_ERROR', e.toString()),
      );
    }
  }

  @override
  Stream<List<CoOwnershipRecord>>? watchCoOwners(String horseId) => null;

  @override
  Future<Result<int>> syncCoOwnership() async {
    try {
      final local = await _readLocal();
      final client = getConfiguredSupabaseClient();
      final userId = await ensureSupabaseUserId();
      if (client == null || userId == null) {
        return Result.ok(0);
      }

      // Push local changes to cloud first
      await client
          .from('co_ownerships')
          .upsert(
            local
                .map(
                  (item) => {
                    'id': item.id,
                    'horse_id': item.horseId,
                    'co_owner_name': item.coOwnerName,
                    'phone': item.phone,
                    'role': item.role,
                    'permissions': item.permissions,
                    'owner_id': userId,
                  },
                )
                .toList(),
          );

      // Then fetch all co-ownerships from cloud
      final response = await client
          .from('co_ownerships')
          .select()
          .order('created_at');
      final remote = (response as List<dynamic>)
          .map(
            (item) => CoOwnershipRecord(
              id: item['id'] as String,
              horseId: item['horse_id'] as String,
              coOwnerName: item['co_owner_name'] as String? ?? '',
              phone: item['phone'] as String? ?? '',
              role: item['role'] as String? ?? 'Туслах уяач',
              permissions: item['permissions'] != null
                  ? List<String>.from(item['permissions'] as List)
                  : const [],
              createdAt:
                  DateTime.tryParse(item['created_at'] as String? ?? '') ??
                  DateTime.now(),
              updatedAt:
                  DateTime.tryParse(item['updated_at'] as String? ?? '') ??
                  DateTime.now(),
            ),
          )
          .toList();

      // Replace local collection with remote data
      await _storage.coOwnershipRecords.isar.writeTxn(() async {
        await _storage.coOwnershipRecords.where().deleteAll();
        await _storage.coOwnershipRecords.putAll(
          remote.map(IsarCoOwnershipRecord.fromDomain).toList(),
        );
      });

      return Result.ok(remote.length);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('SYNC_CO_OWNERSHIP_ERROR', e.toString()),
      );
    }
  }

  Future<List<CoOwnershipRecord>> _readLocal() async {
    final stored = await _storage.coOwnershipRecords.where().findAll();
    if (stored.isEmpty) {
      // Seed on first read within a write transaction
      await _storage.coOwnershipRecords.isar.writeTxn(() async {
        await _storage.coOwnershipRecords.putAll(
          _seed.map(IsarCoOwnershipRecord.fromDomain).toList(),
        );
      });
      return _seed;
    }
    return stored.map((e) => e.toDomain()).toList();
  }

  Future<List<CoOwnershipRecord>> _seedIfEmpty() async {
    final stored = await _storage.coOwnershipRecords.where().findAll();
    if (stored.isEmpty) {
      await _storage.coOwnershipRecords.isar.writeTxn(() async {
        await _storage.coOwnershipRecords.putAll(
          _seed.map(IsarCoOwnershipRecord.fromDomain).toList(),
        );
      });
      return _seed;
    }
    return stored.map((e) => e.toDomain()).toList();
  }
}
