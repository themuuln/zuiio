import 'package:freezed_annotation/freezed_annotation.dart';

part 'app_version.freezed.dart';

/// Remote app version record fetched from `app_versions` table.
@freezed
class AppVersion with _$AppVersion {
  const factory AppVersion({
    required int versionCode,
    required String versionName,
    required String storagePath,
    required String sha256Hash,
    @Default('') String changelog,
    @Default(false) bool forceUpdate,
  }) = _AppVersion;

  factory AppVersion.fromJson(Map<String, dynamic> json) {
    return AppVersion(
      versionCode: json['version_code'] as int,
      versionName: json['version_name'] as String,
      storagePath: json['storage_path'] as String,
      sha256Hash: json['sha256_hash'] as String,
      changelog: json['changelog'] as String? ?? '',
      forceUpdate: json['force_update'] as bool? ?? false,
    );
  }
}
