/// Хамтран өмчлөлийн Supabase repository.
/// Cloud дээрх co_ownership мэдээллийг удирдана.
library;

import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/data/supabase_repository_mixin.dart';
import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../../app/supabase_bootstrap.dart';
import '../domain/co_ownership.dart';
import 'co_ownership_repository.dart';

/// Хамтран өмчлөлийн cloud repository.
class SupabaseCoOwnershipRepository with SupabaseRepositoryMixin implements CoOwnershipRepository {
  const SupabaseCoOwnershipRepository._(this._client);
  factory SupabaseCoOwnershipRepository() =>
      SupabaseCoOwnershipRepository._(Supabase.instance.client);

  final SupabaseClient _client;

  @override
  SupabaseClient? get client => _client;

  // ── Read ──

  @override
  Future<Result<List<CoOwnershipRecord>>> fetchCoOwners(String horseId) async {
    try {
      final data = await _client
          .from('co_ownerships')
          .select()
          .eq('horse_id', horseId)
          .order('created_at');

      final records = data
          .map(
            (row) => CoOwnershipRecord(
              id: row['id'] as String,
              horseId: row['horse_id'] as String,
              coOwnerName: row['co_owner_name'] as String? ?? '',
              phone: row['phone'] as String? ?? '',
              role: row['role'] as String? ?? 'Туслах уяач',
              permissions: row['permissions'] != null
                  ? List<String>.from(row['permissions'] as List)
                  : const [],
              createdAt:
                  DateTime.tryParse(row['created_at'] as String? ?? '') ??
                  DateTime.now(),
              updatedAt:
                  DateTime.tryParse(row['updated_at'] as String? ?? '') ??
                  DateTime.now(),
            ),
          )
          .toList();

      return Result.ok(records);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('FETCH_CO_OWNERS_ERROR', e.toString()),
      );
    }
  }

  // ── Write ──

  @override
  Future<Result<List<CoOwnershipRecord>>> saveCoOwner(
    CoOwnershipRecord record,
  ) async {
    try {
      final userId = await ensureSupabaseUserId();
      if (userId == null) {
        return Result.fail(
          const AppException(
            message: 'Supabase session үүсээгүй байна',
            code: 'NO_SUPABASE_USER',
          ),
        );
      }

      final upsertData = {
        'id': record.id,
        'horse_id': record.horseId,
        'co_owner_name': record.coOwnerName,
        'phone': record.phone,
        'role': record.role,
        'permissions': record.permissions,
        'owner_id': userId,
      };

      await _client.from('co_ownerships').upsert(upsertData);

      // Мөрийг эргүүлж уншина.
      return fetchCoOwners(record.horseId);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('SAVE_CO_OWNER_ERROR', e.toString()),
      );
    }
  }

  @override
  Future<Result<List<CoOwnershipRecord>>> deleteCoOwner(String id) async {
    try {
      await _client.from('co_ownerships').delete().eq('id', id);
      return const Result.ok([]);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('DELETE_CO_OWNER_ERROR', e.toString()),
      );
    }
  }

  // ── Sync ──

  @override
  Future<Result<int>> syncCoOwnership() async {
    // Cloud repository is already the source of truth; nothing to sync.
    return const Result.ok(0);
  }

  // ── Realtime ──

  @override
  Stream<List<CoOwnershipRecord>> watchCoOwners(String horseId) {
    return _client
        .from('co_ownerships')
        .stream(primaryKey: ['id'])
        .eq('horse_id', horseId)
        .order('created_at')
        .map(
          (rows) => rows
              .map(
                (row) => CoOwnershipRecord(
                  id: row['id'] as String,
                  horseId: row['horse_id'] as String,
                  coOwnerName: row['co_owner_name'] as String? ?? '',
                  phone: row['phone'] as String? ?? '',
                  role: row['role'] as String? ?? 'Туслах уяач',
                  permissions: row['permissions'] != null
                      ? List<String>.from(row['permissions'] as List)
                      : const [],
                  createdAt:
                      DateTime.tryParse(row['created_at'] as String? ?? '') ??
                      DateTime.now(),
                  updatedAt:
                      DateTime.tryParse(row['updated_at'] as String? ?? '') ??
                      DateTime.now(),
                ),
              )
              .toList(),
        );
  }
}
