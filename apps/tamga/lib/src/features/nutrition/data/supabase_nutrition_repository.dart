import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/data/supabase_repository_mixin.dart';
import '../../../core/error/result.dart';
import '../../../app/supabase_bootstrap.dart';
import '../domain/feed_schedule.dart';
import '../domain/feed_log.dart';
import 'nutrition_repository.dart';

/// Supabase cloud implementation for feed_schedules and feed_logs.
///
/// Each method maps domain model ↔ Supabase row via the model's built-in
/// `fromSupabaseJson` / `toSupabaseJson`.
class SupabaseNutritionRepository
    with SupabaseRepositoryMixin
    implements NutritionRepository {
  SupabaseNutritionRepository({SupabaseClient? client})
    : _client = client ?? getConfiguredSupabaseClient();

  final SupabaseClient? _client;

  @override
  SupabaseClient? get client => _client;

  // ── FeedSchedule CRUD ───────────────────────────────────────────

  @override
  Future<Result<List<FeedSchedule>>> fetchSchedules(String horseId) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final response = await client
          .from('feed_schedules')
          .select()
          .eq('horse_id', horseId)
          .order('start_date', ascending: false);

      final schedules = (response as List<dynamic>)
          .map(
            (row) => FeedSchedule.fromSupabaseJson(row as Map<String, dynamic>),
          )
          .toList();

      return Result.ok(schedules);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<FeedSchedule>> saveSchedule(FeedSchedule schedule) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      final userId = await currentUserId;
      if (userId == null) {
        return Result.fail(noClientError());
      }

      final data = schedule.toSupabaseJson(ownerId: userId);
      await client.from('feed_schedules').upsert(data);

      return Result.ok(schedule);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<void>> deleteSchedule(String id) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      await client.from('feed_schedules').delete().eq('id', id);

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  // ── FeedLog CRUD ────────────────────────────────────────────────

  @override
  Future<Result<List<FeedLog>>> fetchLogs(String horseId) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final response = await client
          .from('feed_logs')
          .select()
          .eq('horse_id', horseId)
          .order('date', ascending: false);

      final logs = (response as List<dynamic>)
          .map((row) => FeedLog.fromSupabaseJson(row as Map<String, dynamic>))
          .toList();

      return Result.ok(logs);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<List<FeedLog>>> fetchLogsByDateRange(
    String horseId,
    DateTime startDate,
    DateTime endDate,
  ) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final response = await client
          .from('feed_logs')
          .select()
          .eq('horse_id', horseId)
          .gte('date', startDate.toIso8601String())
          .lte('date', endDate.toIso8601String())
          .order('date', ascending: true);

      final logs = (response as List<dynamic>)
          .map((row) => FeedLog.fromSupabaseJson(row as Map<String, dynamic>))
          .toList();

      return Result.ok(logs);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<FeedLog>> saveLog(FeedLog log) async {
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
      await client.from('feed_logs').upsert(data);

      return Result.ok(log);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<void>> deleteLog(String id) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      await client.from('feed_logs').delete().eq('id', id);

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }
}
