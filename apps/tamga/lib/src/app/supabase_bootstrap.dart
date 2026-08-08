import 'package:supabase_flutter/supabase_flutter.dart';

import 'app_config.dart';

/// Initializes Supabase if credentials are configured in the environment.
///
/// Deep link handling for OAuth callbacks is configured via:
/// - Platform URL scheme `io.supabase.tamga` registered in iOS/macOS Info.plist
///   and Android AndroidManifest.xml
/// - `FlutterAuthClientOptions(detectSessionInUri: true)` enables the built-in
///   deep link observer in [SupabaseAuth], which automatically detects auth
///   callback URIs (PKCE `code`, implicit `access_token`) via the `app_links`
///   package and exchanges them for a valid session via [GoTrueClient.getSessionFromUrl].
///
/// Expected OAuth callback URL format: `io.supabase.tamga://login-callback/`
Future<void> initializeSupabaseIfConfigured() async {
  if (!AppConfig.isSupabaseConfigured) {
    return;
  }

  await Supabase.initialize(
    url: AppConfig.supabaseUrl,
    publishableKey: AppConfig.supabasePublishableKey,
    authOptions: const FlutterAuthClientOptions(detectSessionInUri: true),
  );
}

SupabaseClient? getConfiguredSupabaseClient() {
  if (!AppConfig.isSupabaseConfigured) {
    return null;
  }

  try {
    return Supabase.instance.client;
  } catch (_) {
    return null;
  }
}

String? currentSupabaseUserId() {
  final client = getConfiguredSupabaseClient();
  return client?.auth.currentUser?.id;
}

Future<String?> ensureSupabaseUserId() async {
  final client = getConfiguredSupabaseClient();
  if (client == null) {
    return null;
  }

  final existingUserId = client.auth.currentUser?.id;
  if (existingUserId != null) {
    return existingUserId;
  }

  try {
    await client.auth.signInAnonymously();
    return client.auth.currentUser?.id;
  } on AuthException {
    return null;
  }
}
