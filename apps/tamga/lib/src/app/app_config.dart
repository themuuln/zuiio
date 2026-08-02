import 'package:flutter/services.dart';

/// Runtime application configuration loaded from the bundled environment file.
///
/// `dev.sh` copies the local `.env` file into the generated asset before
/// launching Flutter. The fallback asset keeps the app runnable in offline mode
/// when no local credentials are configured.
abstract final class AppConfig {
  static const _generatedEnvironmentAsset = 'assets/config/generated.env';
  static const _fallbackEnvironmentAsset = 'assets/config/default.env';

  static String _supabaseUrl = '';
  static String _supabasePublishableKey = '';

  static String get supabaseUrl => _supabaseUrl;

  static String get supabasePublishableKey => _supabasePublishableKey;

  static bool get isSupabaseConfigured =>
      supabaseUrl.isNotEmpty && supabasePublishableKey.isNotEmpty;

  /// Feature tour enabled эсэх. Түр зогсоосон — true болгож идэвхжүүлнэ.
  static const bool featureTourEnabled = false;

  static Future<void> load() async {
    final contents =
        await _loadAsset(_generatedEnvironmentAsset) ??
        await _loadAsset(_fallbackEnvironmentAsset);
    final values = contents == null
        ? const <String, String>{}
        : parseDotEnv(contents);

    _supabaseUrl =
        values['SUPABASE_URL'] ?? values['EXPO_PUBLIC_SUPABASE_URL'] ?? '';
    _supabasePublishableKey =
        values['SUPABASE_PUBLISHABLE_KEY'] ??
        values['EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] ??
        '';
  }

  static Future<String?> _loadAsset(String assetPath) async {
    try {
      return await rootBundle.loadString(assetPath);
    } catch (_) {
      return null;
    }
  }
}

/// Parses the simple KEY=value format used by Tamga's local `.env` file.
Map<String, String> parseDotEnv(String contents) {
  final values = <String, String>{};

  for (final rawLine in contents.split('\n')) {
    final line = rawLine.trim();
    if (line.isEmpty || line.startsWith('#')) {
      continue;
    }

    final separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    final key = line.substring(0, separatorIndex).trim();
    var value = line.substring(separatorIndex + 1).trim();
    if (value.length >= 2 &&
        ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'")))) {
      value = value.substring(1, value.length - 1);
    }
    values[key] = value;
  }

  return values;
}
