import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/data/supabase_repository_mixin.dart';
import '../../../core/error/result.dart';
import '../../../app/supabase_bootstrap.dart';
import '../domain/profile_settings.dart';

/// Supabase cloud implementation for the profiles table.
///
/// Maps [ProfileSettings] ↔ Supabase row via the domain model's built-in
/// `fromSupabaseJson` / `toSupabaseJson`.
class SupabaseProfileRepository with SupabaseRepositoryMixin {
  SupabaseProfileRepository({SupabaseClient? client})
    : _client = client ?? getConfiguredSupabaseClient();

  final SupabaseClient? _client;

  @override
  SupabaseClient? get client => _client;

  // ── CRUD ─────────────────────────────────────────────────────────

  /// Fetch the current user's profile settings from Supabase.
  Future<Result<ProfileSettings>> get() async {
    try {
      final client = safeClient;
      if (client == null) {
        return const Result.ok(ProfileSettings(autoSyncEnabled: false));
      }

      final userId = await currentUserId;
      if (userId == null) {
        return const Result.ok(ProfileSettings(autoSyncEnabled: false));
      }

      final response = await client
          .from('profiles')
          .select()
          .eq('owner_id', userId)
          .maybeSingle();

      if (response == null) {
        return const Result.ok(ProfileSettings(autoSyncEnabled: false));
      }

      return Result.ok(ProfileSettings.fromSupabaseJson(response));
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Update the current user's profile settings in Supabase.
  Future<Result<ProfileSettings>> update(ProfileSettings profile) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      final userId = await currentUserId;
      if (userId == null) return Result.fail(noClientError());

      final data = profile.toSupabaseJson(ownerId: userId);
      await client.from('profiles').upsert(data);

      return Result.ok(profile);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

}
