import 'package:isar/isar.dart';

import '../../../profile/domain/profile_settings.dart';

part 'isar_profile_settings.g.dart';

@collection
class IsarProfileSettings {
  IsarProfileSettings();

  Id id = Isar.autoIncrement;

  /// Singleton key — always 'default'.
  @Index(unique: true, replace: true)
  late String domainId;
  late bool autoSyncEnabled;
  DateTime? lastSyncCheckAt;
  late String role;
  late String rank;

  factory IsarProfileSettings.fromDomain(ProfileSettings settings) {
    return IsarProfileSettings()
      ..domainId = 'default'
      ..autoSyncEnabled = settings.autoSyncEnabled
      ..lastSyncCheckAt = settings.lastSyncCheckAt
      ..role = settings.role
      ..rank = settings.rank;
  }

  ProfileSettings toDomain() {
    return ProfileSettings(
      autoSyncEnabled: autoSyncEnabled,
      lastSyncCheckAt: lastSyncCheckAt,
      role: role,
      rank: rank,
    );
  }
}
