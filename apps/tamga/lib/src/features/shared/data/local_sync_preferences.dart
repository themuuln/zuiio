import 'package:isar/isar.dart';

import '../../../core/storage/isar_database.dart';
import 'isar_schemas/isar_profile_settings.dart';
import 'local_json_store.dart';

abstract final class LocalSyncPreferences {
  static const profileSettingsKey = 'profile.settings';

  static bool isAutoSyncEnabled(LocalJsonStore store) {
    final settings = store.readObject(profileSettingsKey);
    return settings?['autoSyncEnabled'] == true;
  }

  /// Read auto-sync from Isar (replaces the LocalJsonStore variant).
  static Future<bool> isAutoSyncEnabledFromStorage() async {
    final db = IsarDatabase.instance;
    final collection = db.collection<IsarProfileSettings>();
    final all = await collection.where().findAll();
    final settings = all.isNotEmpty ? all.first : null;
    return settings?.autoSyncEnabled ?? false;
  }
}
