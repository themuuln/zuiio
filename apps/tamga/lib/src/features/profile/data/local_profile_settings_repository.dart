import 'package:isar/isar.dart';

import '../../../app/supabase_bootstrap.dart';
import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../shared/data/isar_storage.dart';
import '../../shared/data/isar_schemas/isar_profile_settings.dart';
import '../domain/profile_settings.dart';
import 'profile_settings_repository.dart';

class LocalProfileSettingsRepository implements ProfileSettingsRepository {
  const LocalProfileSettingsRepository(this._storage);

  final IsarStorage _storage;

  static const _defaultSettings = ProfileSettings(autoSyncEnabled: false);

  @override
  Future<Result<ProfileSettings>> fetchSettings() async {
    try {
      final stored = await _storage.profileSettings.where().findFirst();
      if (stored == null) {
        await saveSettings(_defaultSettings);
        return Result.ok(_defaultSettings);
      }
      return Result.ok(stored.toDomain());
    } catch (e) {
      return Result.fail(
        AppException.withDetail('FETCH_SETTINGS_ERROR', e.toString()),
      );
    }
  }

  @override
  Future<Result<void>> saveSettings(ProfileSettings settings) async {
    try {
      final isarSettings = IsarProfileSettings.fromDomain(settings);
      // Upsert by domainId
      final existing = await _storage.profileSettings
          .filter()
          .domainIdEqualTo('default')
          .findFirst();
      if (existing != null) {
        isarSettings.id = existing.id;
      }
      await _storage.profileSettings.put(isarSettings);
      await syncSettings(settings);
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('SAVE_SETTINGS_ERROR', e.toString()),
      );
    }
  }

  @override
  Future<Result<ProfileSettings>> syncSettings(ProfileSettings settings) async {
    try {
      final client = getConfiguredSupabaseClient();
      final userId = await ensureSupabaseUserId();
      if (client == null || userId == null) {
        return Result.ok(settings);
      }

      await client
          .from('profile_settings')
          .upsert(settings.toSupabaseJson(ownerId: userId));
      final response = await client.from('profile_settings').select().single();
      final remote = ProfileSettings.fromSupabaseJson(response);

      // Save remote to local
      final isarSettings = IsarProfileSettings.fromDomain(remote);
      final existing = await _storage.profileSettings
          .filter()
          .domainIdEqualTo('default')
          .findFirst();
      if (existing != null) {
        isarSettings.id = existing.id;
      }
      await _storage.profileSettings.put(isarSettings);
      return Result.ok(remote);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('SYNC_SETTINGS_ERROR', e.toString()),
      );
    }
  }
}
