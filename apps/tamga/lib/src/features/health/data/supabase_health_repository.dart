import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/data/supabase_repository_mixin.dart';
import '../../../core/error/result.dart';
import '../../../app/supabase_bootstrap.dart';
import '../../../shared/domain/health_log.dart';
import '../../shared/data/pagination/paginated_result.dart';
import 'health_repository.dart';

/// Supabase cloud implementation for health_logs (medical + farrier).
///
/// Each method maps [HealthLog] ↔ Supabase row via the domain model's
/// built-in `fromSupabaseJson` / `toSupabaseJson`.
class SupabaseHealthRepository with SupabaseRepositoryMixin implements HealthRepository {
  SupabaseHealthRepository({SupabaseClient? client})
    : _client = client ?? getConfiguredSupabaseClient();

  final SupabaseClient? _client;

  @override
  SupabaseClient? get client => _client;

  // ── Medical logs ─────────────────────────────────────────────────

  /// Fetch all health logs from Supabase.
  @override
  Future<Result<List<HealthLog>>> fetchAll() async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final response = await client
          .from('health_logs')
          .select()
          .order('date', ascending: false);

      final logs = (response as List<dynamic>)
          .map((row) => HealthLog.fromSupabaseJson(row as Map<String, dynamic>))
          .toList();

      return Result.ok(logs);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Fetch medical logs for a horse from Supabase.
  @override
  Future<Result<List<HealthLog>>> fetchMedicalLogs(String horseId) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final response = await client
          .from('health_logs')
          .select()
          .eq('horse_id', horseId)
          .eq('log_type', 'medical')
          .order('date', ascending: false);

      final logs = (response as List<dynamic>)
          .map((row) => HealthLog.fromSupabaseJson(row as Map<String, dynamic>))
          .toList();

      return Result.ok(logs);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Fetch all health logs (medical only) for a horse.
  @override
  Future<Result<List<HealthLog>>> fetchAllByHorse(String horseId) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final response = await client
          .from('health_logs')
          .select()
          .eq('horse_id', horseId)
          .order('date', ascending: false);

      final logs = (response as List<dynamic>)
          .map((row) => HealthLog.fromSupabaseJson(row as Map<String, dynamic>))
          .toList();

      return Result.ok(logs);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Upsert a health log (medical or farrier) to Supabase.
  @override
  Future<Result<HealthLog>> saveHealthLog(HealthLog log) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      final userId = await currentUserId;
      if (userId == null) {
        return Result.fail(noClientError());
      }

      final data = log.toSupabaseJson(ownerId: userId);
      await client.from('health_logs').upsert(data);

      return Result.ok(log);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Delete a health log by id.
  @override
  Future<Result<void>> deleteHealthLog(String horseId, String logId) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      await client
          .from('health_logs')
          .delete()
          .eq('id', logId)
          .eq('horse_id', horseId);

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Fetch health logs paginated.
  @override
  Future<Result<PaginatedResult<HealthLog>>> fetchAllByHorsePaginated({
    required String horseId,
    required int page,
    required int limit,
  }) async {
    try {
      final client = safeClient;
      if (client == null) {
        return const Result.ok(PaginatedResult(items: [], totalCount: 0));
      }

      final offset = (page - 1) * limit;

      // Get total count first
      final countResponse = await client
          .from('health_logs')
          .select('id')
          .eq('horse_id', horseId)
          .count();
      final totalCount = countResponse.count;

      final response = await client
          .from('health_logs')
          .select()
          .eq('horse_id', horseId)
          .order('date', ascending: false)
          .range(offset, offset + limit - 1);

      final logs = (response as List<dynamic>)
          .map((row) => HealthLog.fromSupabaseJson(row as Map<String, dynamic>))
          .toList();

      return Result.ok(PaginatedResult(items: logs, totalCount: totalCount));
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

}
