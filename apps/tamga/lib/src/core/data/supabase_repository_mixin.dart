import 'package:supabase_flutter/supabase_flutter.dart';

import '../../app/supabase_bootstrap.dart';
import '../error/app_exception.dart';

/// Shared helper mixin for Supabase repositories.
///
/// Provides [safeClient], [currentUserId], [wrapError], and [noClientError]
/// to eliminate the ~20-line boilerplate duplicated across all Supabase
/// repositories.
///
/// Implementing classes must expose a [SupabaseClient?] as [client].
mixin SupabaseRepositoryMixin on Object {
  /// The Supabase client instance. Implementing classes must provide this.
  SupabaseClient? get client;

  /// Null-safe client accessor.
  SupabaseClient? get safeClient => client;

  /// Current authenticated user ID.
  Future<String?> get currentUserId async => ensureSupabaseUserId();

  /// Wrap a caught exception into an [AppException].
  AppException wrapError(Object e) {
    if (e is PostgrestException) {
      return AppException(
        message: e.message,
        code: e.code ?? 'SUPABASE_ERROR',
        details: {'hint': e.hint, 'details': e.details},
      );
    }
    return AppException(message: e.toString(), code: 'UNKNOWN_ERROR');
  }

  /// Error for when Supabase client is not configured.
  AppException noClientError() {
    return const AppException(
      message: 'Supabase тохиргоо байхгүй байна',
      code: 'SUPABASE_NOT_CONFIGURED',
    );
  }
}
