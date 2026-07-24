import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/data/supabase_repository_mixin.dart';
import '../../../core/error/result.dart';
import '../../../app/supabase_bootstrap.dart';
import '../domain/breeding_record.dart';

/// Supabase cloud implementation for the breeding_records table.
///
/// Maps [BreedingRecord] ↔ Supabase row via the domain model's built-in
/// `fromSupabaseJson` / `toSupabaseJson`.
class SupabaseBreedingRepository with SupabaseRepositoryMixin {
  SupabaseBreedingRepository({SupabaseClient? client})
    : _client = client ?? getConfiguredSupabaseClient();

  final SupabaseClient? _client;

  @override
  SupabaseClient? get client => _client;

  // ── CRUD ─────────────────────────────────────────────────────────

  /// List breeding records for the current user.
  Future<Result<List<BreedingRecord>>> list() async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final userId = await currentUserId;
      if (userId == null) return const Result.ok([]);

      final response = await client
          .from('breeding_records')
          .select()
          .eq('owner_id', userId)
          .order('breeding_date', ascending: false);

      final records = (response as List<dynamic>)
          .map(
            (row) =>
                BreedingRecord.fromSupabaseJson(row as Map<String, dynamic>),
          )
          .toList();

      return Result.ok(records);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Create or update a breeding record.
  Future<Result<BreedingRecord>> create(BreedingRecord record) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      final userId = await currentUserId;
      if (userId == null) return Result.fail(noClientError());

      final data = record.toSupabaseJson(ownerId: userId);
      await client.from('breeding_records').upsert(data);

      return Result.ok(record);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Update an existing breeding record.
  Future<Result<BreedingRecord>> update(BreedingRecord record) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      final userId = await currentUserId;
      if (userId == null) return Result.fail(noClientError());

      final data = record.toSupabaseJson(ownerId: userId);
      await client.from('breeding_records').upsert(data);

      return Result.ok(record);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Delete a breeding record by id.
  Future<Result<void>> delete(String id) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      await client.from('breeding_records').delete().eq('id', id);

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }
}
