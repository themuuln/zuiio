import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/app_config.dart';
import 'media_storage_router.dart';
import 'r2_media_storage.dart';
import 'supabase_media_storage.dart';

/// Supabase MediaStorage — photos and documents.
///
/// Only available when Supabase is configured.
final supabaseStorageProvider = Provider<SupabaseMediaStorage?>((ref) {
  if (!AppConfig.isSupabaseConfigured) return null;
  return SupabaseMediaStorage();
});

/// R2 MediaStorage — videos.
///
/// Configure via environment:
/// - `R2_SIGNING_ENDPOINT` — Cloudflare Worker URL
/// - `R2_PUBLIC_DOMAIN` — Public CDN URL
final r2StorageProvider = Provider<R2MediaStorage?>((ref) {
  // TODO: Read from AppConfig or .env when R2 is set up
  // For now, return null until R2 credentials are configured
  return null;
});

/// Unified media storage router.
///
/// Routes to Supabase Storage for photos/docs, R2 for videos.
/// Falls back to Supabase-only if R2 is not configured.
final mediaStorageProvider = Provider<MediaStorageRouter>((ref) {
  final supabase = ref.watch(supabaseStorageProvider);
  final r2 = ref.watch(r2StorageProvider);

  if (supabase == null) {
    throw StateError(
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env',
    );
  }

  // Fallback: use Supabase for everything if R2 is not configured
  final r2Storage = r2 ?? _NoOpR2Storage();

  return MediaStorageRouter(supabase: supabase, r2: r2Storage);
});

/// Placeholder R2 storage when R2 is not configured.
///
/// Returns errors for video operations, prompting the user to configure R2.
class _NoOpR2Storage extends R2MediaStorage {
  _NoOpR2Storage() : super(signingEndpoint: '', publicDomain: '');
}
