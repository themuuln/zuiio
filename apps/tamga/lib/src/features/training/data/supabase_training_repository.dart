import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/data/supabase_repository_mixin.dart';
import '../../../core/error/result.dart';
import '../../../app/supabase_bootstrap.dart';
import '../domain/training_log.dart';
import '../domain/performance_record.dart';
import 'training_repository.dart';

/// Supabase cloud implementation for training_logs and performance_records.
///
/// Each method maps domain model ↔ Supabase row via the model's built-in
/// `fromSupabaseJson` / `toSupabaseJson`.
class SupabaseTrainingRepository with SupabaseRepositoryMixin implements TrainingRepository {
  SupabaseTrainingRepository({SupabaseClient? client})
    : _client = client ?? getConfiguredSupabaseClient();

  final SupabaseClient? _client;

  @override
  SupabaseClient? get client => _client;

  // ── TrainingLog CRUD ────────────────────────────────────────────

  @override
  Future<Result<List<TrainingLog>>> fetchByHorse(String horseId) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final response = await client
          .from('training_logs')
          .select()
          .eq('horse_id', horseId)
          .order('date', ascending: false);

      final logs = (response as List<dynamic>)
          .map(
            (row) => TrainingLog.fromSupabaseJson(row as Map<String, dynamic>),
          )
          .toList();

      return Result.ok(logs);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<TrainingLog>> save(TrainingLog log) async {
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
      await client.from('training_logs').upsert(data);

      return Result.ok(log);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<void>> delete(String id) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      await client.from('training_logs').delete().eq('id', id);

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  // ── PerformanceRecord CRUD ──────────────────────────────────────

  @override
  Future<Result<List<PerformanceRecord>>> fetchPerformanceByHorse(
      String horseId) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final response = await client
          .from('performance_records')
          .select()
          .eq('horse_id', horseId)
          .order('date', ascending: false);

      final records = (response as List<dynamic>)
          .map(
            (row) =>
                PerformanceRecord.fromSupabaseJson(row as Map<String, dynamic>),
          )
          .toList();

      return Result.ok(records);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<PerformanceRecord>> savePerformance(
      PerformanceRecord record) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      final userId = await currentUserId;
      if (userId == null) {
        return Result.fail(noClientError());
      }

      final data = record.toSupabaseJson(ownerId: userId);
      await client.from('performance_records').upsert(data);

      return Result.ok(record);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<void>> deletePerformance(String id) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      await client.from('performance_records').delete().eq('id', id);

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

}
