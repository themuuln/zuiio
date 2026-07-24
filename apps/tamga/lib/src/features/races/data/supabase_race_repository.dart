import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/data/supabase_repository_mixin.dart';
import '../../../core/error/result.dart';
import '../../../app/supabase_bootstrap.dart';
import '../domain/race.dart';
import 'race_repository.dart';

/// Supabase cloud implementation of [RaceRepository].
///
/// Maps [Race] ↔ Supabase row via the domain model's built-in
/// `fromSupabaseJson` / `toSupabaseJson`.
class SupabaseRaceRepository
    with SupabaseRepositoryMixin
    implements RaceRepository {
  SupabaseRaceRepository({SupabaseClient? client})
    : _client = client ?? getConfiguredSupabaseClient();

  final SupabaseClient? _client;

  @override
  SupabaseClient? get client => _client;

  // ── CRUD ─────────────────────────────────────────────────────────

  @override
  Future<Result<List<Race>>> fetchAll() async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final response = await client
          .from('races')
          .select()
          .order('date', ascending: false);

      final races = (response as List<dynamic>)
          .map((row) => Race.fromSupabaseJson(row as Map<String, dynamic>))
          .toList();

      return Result.ok(races);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<Race>> fetchById(String id) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      final response = await client
          .from('races')
          .select()
          .eq('id', id)
          .single();

      return Result.ok(Race.fromSupabaseJson(response));
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<List<Race>>> fetchByType(RaceType type) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final response = await client
          .from('races')
          .select()
          .eq('type', type.name)
          .order('date', ascending: false);

      final races = (response as List<dynamic>)
          .map((row) => Race.fromSupabaseJson(row as Map<String, dynamic>))
          .toList();

      return Result.ok(races);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<Race>> create(Race race) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      final userId = await currentUserId;
      if (userId == null) {
        return Result.fail(noClientError());
      }

      final data = race.toSupabaseJson();
      data['organizer_id'] = userId;
      await client.from('races').insert(data);

      return Result.ok(race);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<Race>> update(Race race) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      await client.from('races').upsert(race.toSupabaseJson());

      return Result.ok(race);
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

      await client.from('races').delete().eq('id', id);

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }
}
