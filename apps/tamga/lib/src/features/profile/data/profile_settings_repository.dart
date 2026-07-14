import '../../../core/error/result.dart';
import '../domain/profile_settings.dart';

abstract interface class ProfileSettingsRepository {
  Future<Result<ProfileSettings>> fetchSettings();
  Future<Result<void>> saveSettings(ProfileSettings settings);
  Future<Result<ProfileSettings>> syncSettings(ProfileSettings settings);
}
