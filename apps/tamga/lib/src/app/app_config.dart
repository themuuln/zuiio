/// Application configuration loaded from compile-time defines.
///
/// Set via `--dart-define-from-file=dart_defines.json` or individual
/// `--dart-define=KEY=val` flags.
///
/// On macOS, use `keychain-env dart-define tamga` to generate the JSON
/// from Keychain secrets, then pass it to Flutter:
///   keychain-env run tamga -- flutter run --dart-define-from-file=dart_defines.json
abstract final class AppConfig {
  static String get supabaseUrl {
    return const String.fromEnvironment('SUPABASE_URL');
  }

  static String get supabasePublishableKey {
    return const String.fromEnvironment('SUPABASE_PUBLISHABLE_KEY');
  }

  static bool get isSupabaseConfigured =>
      supabaseUrl.isNotEmpty && supabasePublishableKey.isNotEmpty;

  /// Feature tour enabled эсэх. Түр зогсоосон — true болгож идэвхжүүлнэ.
  static const bool featureTourEnabled = false;
}
