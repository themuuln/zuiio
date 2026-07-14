import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../app/supabase_bootstrap.dart';
import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../domain/event_record.dart';

/// Supabase cloud implementation for the events table.
///
/// Maps [EventRecord] ↔ Supabase row via the domain model's built-in
/// `fromSupabaseJson` / `toSupabaseJson`.
class SupabaseEventsRepository {
  SupabaseEventsRepository({SupabaseClient? client})
    : _client = client ?? getConfiguredSupabaseClient();

  final SupabaseClient? _client;

  // ── Helpers ──────────────────────────────────────────────────────

  SupabaseClient? get _safe => _client;

  Future<String?> get _userId async => ensureSupabaseUserId();

  AppException _wrap(Object e) {
    if (e is PostgrestException) {
      return AppException(
        message: e.message,
        code: e.code ?? 'SUPABASE_ERROR',
        details: {'hint': e.hint, 'details': e.details},
      );
    }
    return AppException(message: e.toString(), code: 'UNKNOWN_ERROR');
  }

  // ── CRUD ─────────────────────────────────────────────────────────

  /// List all events for the current user, ordered by date.
  Future<Result<List<EventRecord>>> list() async {
    try {
      final client = _safe;
      if (client == null) return const Result.ok([]);

      final userId = await _userId;
      if (userId == null) return const Result.ok([]);

      final response = await client
          .from('events')
          .select()
          .eq('owner_id', userId)
          .order('date_label');

      final events = (response as List<dynamic>)
          .map(
            (row) => EventRecord.fromSupabaseJson(row as Map<String, dynamic>),
          )
          .toList();

      return Result.ok(events);
    } catch (e) {
      return Result.fail(_wrap(e));
    }
  }

  /// List events for a specific horse.
  Future<Result<List<EventRecord>>> listByHorse(String horseId) async {
    try {
      final client = _safe;
      if (client == null) return const Result.ok([]);

      final response = await client
          .from('events')
          .select()
          .eq('horse_id', horseId)
          .order('date_label');

      final events = (response as List<dynamic>)
          .map(
            (row) => EventRecord.fromSupabaseJson(row as Map<String, dynamic>),
          )
          .toList();

      return Result.ok(events);
    } catch (e) {
      return Result.fail(_wrap(e));
    }
  }

  /// Create or update an event.
  Future<Result<EventRecord>> create(EventRecord event) async {
    try {
      final client = _safe;
      if (client == null) {
        return Result.fail(_noClient());
      }

      final userId = await _userId;
      if (userId == null) {
        return Result.fail(_noClient());
      }

      final data = event.toSupabaseJson(ownerId: userId);
      await client.from('events').upsert(data);

      return Result.ok(event);
    } catch (e) {
      return Result.fail(_wrap(e));
    }
  }

  /// Update an existing event.
  Future<Result<EventRecord>> update(EventRecord event) async {
    try {
      final client = _safe;
      if (client == null) {
        return Result.fail(_noClient());
      }

      final userId = await _userId;
      if (userId == null) {
        return Result.fail(_noClient());
      }

      final data = event.toSupabaseJson(ownerId: userId);
      await client.from('events').upsert(data);

      return Result.ok(event);
    } catch (e) {
      return Result.fail(_wrap(e));
    }
  }

  /// Delete an event by id.
  Future<Result<void>> delete(String id) async {
    try {
      final client = _safe;
      if (client == null) {
        return Result.fail(_noClient());
      }

      await client.from('events').delete().eq('id', id);

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(_wrap(e));
    }
  }

  AppException _noClient() {
    return const AppException(
      message: 'Supabase тохиргоо байхгүй байна',
      code: 'SUPABASE_NOT_CONFIGURED',
    );
  }
}
