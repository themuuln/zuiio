import 'package:supabase_flutter/supabase_flutter.dart';

/// Shared Supabase Auth adapter for Zuiio Flutter products.
///
/// Provides [signInWithZuiio] for custom OIDC federation to Zuiio ID,
/// replacing per-app Google/Apple/password repositories with a single
/// shared adapter.
///
/// Usage:
/// ```dart
/// final auth = ZuiioAuth(Supabase.instance.client);
/// final result = await auth.signInWithZuiio(
///   redirectTo: 'zuiio-zer://auth/callback',
/// );
/// ```
final class ZuiioAuth {
  const ZuiioAuth(this.client);

  /// The Supabase client for the product project.
  final SupabaseClient client;

  /// The custom OIDC provider identifier registered on every product
  /// Supabase project that federates to Zuiio ID.
  static const String _provider = 'custom:zuiio';

  /// Initiates SSO login through the Zuiio identity provider.
  ///
  /// Opens an external browser for authentication. The browser redirects
  /// back to [redirectTo] (typically `zuiio-<product>://auth/callback`)
  /// with a PKCE code that the product exchanges for a local session.
  ///
  /// Returns `true` if authentication was successful, `false` if the
  /// user cancelled or an error occurred.
  Future<bool> signInWithZuiio({required String redirectTo}) async {
    try {
      final response = await client.auth.signInWithOAuth(
        _provider,
        redirectTo: redirectTo,
        authScreenLaunchMode: LaunchMode.externalApplication,
      );

      return response.isNotEmpty;
    } catch (_) {
      return false;
    }
  }

  /// Signs out the user from the product-local Supabase session.
  ///
  /// Does not sign out from the central Zuiio identity — the user
  /// must sign out from the identity project separately if they want
  /// global sign-out.
  Future<void> signOut() async {
    await client.auth.signOut(scope: Scope.local);
  }

  /// Stream of authentication state changes.
  ///
  /// Emits the current [AuthState] whenever the session changes.
  /// Use this to drive navigation and UI updates.
  Stream<AuthState> get onAuthStateChange =>
      client.auth.onAuthStateChange;
}
