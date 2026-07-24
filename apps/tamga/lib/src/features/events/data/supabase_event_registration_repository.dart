import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/data/supabase_repository_mixin.dart';
import '../../../core/error/result.dart';
import '../../../app/supabase_bootstrap.dart';
import '../../../shared/domain/event_registration.dart';
import 'event_registration_repository.dart';

/// Supabase cloud implementation of [EventRegistrationRepository].
///
/// Maps [EventRegistration] ↔ Supabase row via the domain model's built-in
/// `fromSupabaseJson` / `toSupabaseJson`.
class SupabaseEventRegistrationRepository
    with SupabaseRepositoryMixin
    implements EventRegistrationRepository {
  SupabaseEventRegistrationRepository({SupabaseClient? client})
    : _client = client ?? getConfiguredSupabaseClient();

  final SupabaseClient? _client;

  @override
  SupabaseClient? get client => _client;

  // ── CRUD ─────────────────────────────────────────────────────────

  @override
  Future<Result<List<EventRegistration>>> fetchRegistrations(
    String eventId,
  ) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final response = await client
          .from('event_registrations')
          .select()
          .eq('event_id', eventId)
          .order('registered_at', ascending: false);

      final registrations = (response as List<dynamic>)
          .map(
            (row) =>
                EventRegistration.fromSupabaseJson(row as Map<String, dynamic>),
          )
          .toList();

      return Result.ok(registrations);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<List<EventRegistration>>> fetchRegistrationsByHorse(
    String horseId,
  ) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final response = await client
          .from('event_registrations')
          .select()
          .eq('horse_id', horseId)
          .order('registered_at', ascending: false);

      final registrations = (response as List<dynamic>)
          .map(
            (row) =>
                EventRegistration.fromSupabaseJson(row as Map<String, dynamic>),
          )
          .toList();

      return Result.ok(registrations);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<EventRegistration>> registerHorse({
    required String eventId,
    required String horseId,
    required String ownerId,
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

      final registration = EventRegistration(
        id: _generateId(),
        eventId: eventId,
        horseId: horseId,
        ownerId: ownerId,
        registeredAt: DateTime.now(),
        status: RegistrationStatus.registered,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await client
          .from('event_registrations')
          .upsert(registration.toSupabaseJson());

      return Result.ok(registration);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<EventRegistration>> cancelRegistration(String id) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      // Fetch existing to get the current data
      final response = await client
          .from('event_registrations')
          .select()
          .eq('id', id)
          .single();

      final existing = EventRegistration.fromSupabaseJson(response);
      final updated = existing.copyWith(status: RegistrationStatus.cancelled);

      await client.from('event_registrations').upsert(updated.toSupabaseJson());

      return Result.ok(updated);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────

  String _generateId() =>
      'reg_${DateTime.now().millisecondsSinceEpoch}_${_randomSuffix()}';

  String _randomSuffix() =>
      DateTime.now().microsecondsSinceEpoch.toRadixString(36);
}
