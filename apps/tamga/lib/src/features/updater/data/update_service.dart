import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:open_filex/open_filex.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../app/app_config.dart';
import '../domain/app_version.dart';

/// Result of an update check.
sealed class UpdateCheckResult {
  const UpdateCheckResult();
}

/// No update is available — local app is current or ahead.
class UpToDate extends UpdateCheckResult {
  const UpToDate();
}

/// A new version is available and ready to install.
class UpdateAvailable extends UpdateCheckResult {
  final AppVersion version;

  const UpdateAvailable(this.version);
}

/// Check failed (network, config, etc).
class UpdateCheckFailed extends UpdateCheckResult {
  final String message;

  const UpdateCheckFailed(this.message);
}

/// Core service that checks for app updates, downloads APKs,
/// verifies integrity, and launches the Android package installer.
class UpdateService {
  UpdateService({SupabaseClient? supabase}) : _supabase = supabase;

  final SupabaseClient? _supabase;

  /// Fetch the latest version from the `app_versions` table.
  Future<UpdateCheckResult> checkForUpdate() async {
    try {
      if (!AppConfig.isSupabaseConfigured) {
        return const UpdateCheckFailed('Supabase not configured');
      }

      final supabase = _supabase ?? Supabase.instance.client;

      final response = await supabase
          .from('app_versions')
          .select()
          .order('version_code', ascending: false)
          .limit(1)
          .single();

      final remote = AppVersion.fromJson(response);
      final info = await PackageInfo.fromPlatform();
      final currentCode = int.tryParse(info.buildNumber) ?? 0;

      if (remote.versionCode <= currentCode) {
        return const UpToDate();
      }

      return UpdateAvailable(remote);
    } catch (e) {
      return UpdateCheckFailed('Failed to check for update: $e');
    }
  }

  /// Download and install the given version's APK.
  ///
  /// Returns `null` on success, or an error message string on failure.
  Future<String?> downloadAndInstall(AppVersion version) async {
    try {
      if (!AppConfig.isSupabaseConfigured) {
        return 'Supabase not configured';
      }

      final supabase = _supabase ?? Supabase.instance.client;

      // ── Free space note ──
      // Dart's Directory.stat().size returns the directory entry size (negligible),
      // not available disk space. A proper free-space check would need a
      // platform-specific plugin. For now, we rely on the try-catch around the
      // download to surface out-of-space errors naturally.

      // ── Download APK ──
      final tempDir = await getTemporaryDirectory();
      final filePath = '${tempDir.path}/tamga-${version.versionName}.apk';
      final file = File(filePath);

      final bytes = await supabase.storage
          .from('apks')
          .download(version.storagePath);
      await file.writeAsBytes(bytes);

      // ── Verify SHA-256 ──
      final hash = sha256.convert(bytes).toString();
      if (hash != version.sha256Hash) {
        // Delete corrupted file
        await file.delete();
        return 'Татаж авсан файл гэмтсэн байна. Дахин оролдоно уу.';
      }

      // ── Launch system installer ──
      final result = await OpenFilex.open(filePath);
      if (result.type != ResultType.done) {
        return 'Суулгагчийг нээхэд алдаа гарлаа.';
      }

      return null; // success
    } catch (e) {
      return 'Апп шинэчлэхэд алдаа гарлаа: $e';
    }
  }
}
