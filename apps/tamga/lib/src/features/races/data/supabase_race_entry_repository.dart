import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/data/supabase_repository_mixin.dart';
import '../../../core/error/result.dart';
import '../../../app/supabase_bootstrap.dart';
import '../domain/race_entry.dart';
import 'race_entry_repository.dart';

/// Supabase cloud implementation of [RaceEntryRepository].
///
/// Maps [RaceEntry] ↔ Supabase row via the domain model's built-in
/// `fromSupabaseJson` / `toSupabaseJson`.
class SupabaseRaceEntryRepository with SupabaseRepositoryMixin implements RaceEntryRepository {
  SupabaseRaceEntryRepository({SupabaseClient? client})
    : _client = client ?? getConfiguredSupabaseClient();

  final SupabaseClient? _client;

  @override
  SupabaseClient? get client => _client;

  // ── CRUD ─────────────────────────────────────────────────────────

  @override
  Future<Result<List<RaceEntry>>> fetchByRace(String raceId) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final response = await client
          .from('race_entries')
          .select()
          .eq('race_id', raceId)
          .order('placement', ascending: true);

      final entries = (response as List<dynamic>)
          .map(
            (row) =>
                RaceEntry.fromSupabaseJson(row as Map<String, dynamic>),
          )
          .toList();

      return Result.ok(entries);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<List<RaceEntry>>> fetchByHorse(String horseId) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final response = await client
          .from('race_entries')
          .select()
          .eq('horse_id', horseId)
          .order('created_at', ascending: false);

      final entries = (response as List<dynamic>)
          .map(
            (row) =>
                RaceEntry.fromSupabaseJson(row as Map<String, dynamic>),
          )
          .toList();

      return Result.ok(entries);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<RaceEntry>> register({
    required String raceId,
    required String horseId,
    required String ownerId,
    required String jockeyName,
  }) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      final userId = await currentUserId;
      if (userId == null) {
        return Result.fail(noClientError());
      }

      final entry = RaceEntry(
        id: _generateId(),
        raceId: raceId,
        horseId: horseId,
        ownerId: ownerId,
        jockeyName: jockeyName,
        status: RaceEntryStatus.registered,
      );

      await client.from('race_entries').upsert(
        entry.toSupabaseJson(),
      );

      return Result.ok(entry);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<RaceEntry>> cancel(String id) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      // Fetch existing to get the current data
      final response = await client
          .from('race_entries')
          .select()
          .eq('id', id)
          .single();

      final existing = RaceEntry.fromSupabaseJson(response);
      final updated = existing.copyWith(status: RaceEntryStatus.scratched);

      await client.from('race_entries').upsert(
        updated.toSupabaseJson(),
      );

      return Result.ok(updated);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<RaceEntry>> updateResult({
    required String id,
    required String result,
    required int placement,
    required int prize,
  }) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      // Fetch existing to get the current data
      final response = await client
          .from('race_entries')
          .select()
          .eq('id', id)
          .single();

      final existing = RaceEntry.fromSupabaseJson(response);
      final updated = existing.copyWith(
        status: RaceEntryStatus.competed,
        result: result,
        placement: placement,
        prize: prize,
      );

      await client.from('race_entries').upsert(
        updated.toSupabaseJson(),
      );

      return Result.ok(updated);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────

  String _generateId() =>
      're_${DateTime.now().millisecondsSinceEpoch}_${_randomSuffix()}';

  String _randomSuffix() =>
      DateTime.now().microsecondsSinceEpoch.toRadixString(36);

}
