import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/data/supabase_repository_mixin.dart';
import '../../../core/error/result.dart';
import '../../../app/supabase_bootstrap.dart';
import '../../../shared/domain/event.dart';
import 'event_repository.dart';

/// Supabase cloud implementation of [EventRepository].
///
/// Maps [Event] ↔ Supabase row via the domain model's built-in
/// `fromSupabaseJson` / `toSupabaseJson`.
class SupabaseEventRepository with SupabaseRepositoryMixin implements EventRepository {
  SupabaseEventRepository({SupabaseClient? client})
    : _client = client ?? getConfiguredSupabaseClient();

  final SupabaseClient? _client;

  @override
  SupabaseClient? get client => _client;

  // ── CRUD ─────────────────────────────────────────────────────────

  @override
  Future<Result<List<Event>>> fetchEvents() async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final userId = await currentUserId;
      if (userId == null) return const Result.ok([]);

      final response = await client
          .from('events')
          .select()
          .eq('owner_id', userId)
          .order('date', ascending: false);

      final events = (response as List<dynamic>)
          .map(
            (row) => Event.fromSupabaseJson(row as Map<String, dynamic>),
          )
          .toList();

      return Result.ok(events);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<List<Event>>> fetchEventsByHorse(String horseId) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final response = await client
          .from('events')
          .select()
          .eq('horse_id', horseId)
          .order('date', ascending: false);

      final events = (response as List<dynamic>)
          .map(
            (row) => Event.fromSupabaseJson(row as Map<String, dynamic>),
          )
          .toList();

      return Result.ok(events);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<List<Event>>> fetchEventsByOwner(String ownerId) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final response = await client
          .from('events')
          .select()
          .eq('owner_id', ownerId)
          .order('date', ascending: false);

      final events = (response as List<dynamic>)
          .map(
            (row) => Event.fromSupabaseJson(row as Map<String, dynamic>),
          )
          .toList();

      return Result.ok(events);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<List<Event>>> fetchFeaturedEvents() async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final response = await client
          .from('events')
          .select()
          .eq('is_featured', true)
          .order('date', ascending: false);

      final events = (response as List<dynamic>)
          .map(
            (row) => Event.fromSupabaseJson(row as Map<String, dynamic>),
          )
          .toList();

      return Result.ok(events);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<Event>> saveEvent(Event event) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      final userId = await currentUserId;
      if (userId == null) {
        return Result.fail(noClientError());
      }

      final data = event.toSupabaseJson(ownerId: userId);
      await client.from('events').upsert(data);

      return Result.ok(event);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<void>> deleteEvent(String id) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      await client.from('events').delete().eq('id', id);

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

}
