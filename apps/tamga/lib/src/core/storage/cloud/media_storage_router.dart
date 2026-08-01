import 'dart:io';

import '../../error/result.dart';
import 'media_storage_service.dart';
import 'media_upload_result.dart';
import 'r2_media_storage.dart';
import 'supabase_media_storage.dart';

/// Unified media storage that routes to the correct backend based
/// on [MediaCategory].
///
/// - Photos → Supabase Storage (public read, owner write)
/// - Documents → Supabase Storage (private, owner read/write)
/// - Videos → Cloudflare R2 (presigned URLs, zero egress)
///
/// Usage:
/// ```dart
/// final storage = MediaStorageRouter(
///   supabase: SupabaseMediaStorage(),
///   r2: R2MediaStorage(
///     signingEndpoint: 'https://r2-signer.tamga.workers.dev',
///     publicDomain: 'https://videos.tamga.mn',
///   ),
/// );
///
/// final result = await storage.upload(
///   file: imageFile,
///   path: 'horse-photos/$horseId/$uuid.jpg',
///   category: MediaCategory.photo,
/// );
/// ```
class MediaStorageRouter implements MediaStorageService {
  MediaStorageRouter({
    required SupabaseMediaStorage supabase,
    required R2MediaStorage r2,
  }) : _supabase = supabase,
       _r2 = r2;

  final SupabaseMediaStorage _supabase;
  final R2MediaStorage _r2;

  // ── Routing ───────────────────────────────────────────────────

  MediaStorageService _backend(MediaCategory category) => switch (category) {
    MediaCategory.photo ||
    MediaCategory.recoveryPhoto ||
    MediaCategory.recoverySightingPhoto ||
    MediaCategory.document => _supabase,
    MediaCategory.video => _r2,
  };

  // ── MediaStorageService implementation ────────────────────────

  @override
  Future<Result<MediaUploadResult>> upload({
    required File file,
    required String path,
    required MediaCategory category,
  }) {
    return _backend(
      category,
    ).upload(file: file, path: path, category: category);
  }

  @override
  Future<Result<void>> delete({
    required String path,
    required MediaCategory category,
  }) {
    return _backend(category).delete(path: path, category: category);
  }

  @override
  Future<Result<String>> getSignedUrl({
    required String path,
    required MediaCategory category,
    Duration expiry = const Duration(hours: 1),
  }) {
    return _backend(
      category,
    ).getSignedUrl(path: path, category: category, expiry: expiry);
  }

  @override
  Future<Result<bool>> exists({
    required String path,
    required MediaCategory category,
  }) {
    return _backend(category).exists(path: path, category: category);
  }

  @override
  Future<Result<List<String>>> listPaths({
    required String prefix,
    required MediaCategory category,
  }) {
    return _backend(category).listPaths(prefix: prefix, category: category);
  }

  // ── Convenience: path generators ──────────────────────────────

  /// Generate a storage path for a horse photo.
  ///
  /// Pattern: `horse-photos/{horseId}/{uuid}.jpg`
  static String horsePhotoPath({
    required String horseId,
    required String userId,
    String extension = 'jpg',
  }) {
    final uuid = _uuid();
    return 'horse-photos/$userId/$horseId/$uuid.$extension';
  }

  /// Generate a storage path for an event photo.
  ///
  /// Pattern: `horse-photos/{userId}/events/{uuid}.jpg`
  static String eventPhotoPath({
    required String userId,
    String extension = 'jpg',
  }) {
    final uuid = _uuid();
    return 'horse-photos/$userId/events/$uuid.$extension';
  }

  /// Generate a storage path for a race video.
  ///
  /// Pattern: `videos/{userId}/{horseId}/{uuid}.mp4`
  static String raceVideoPath({
    required String horseId,
    required String userId,
    String extension = 'mp4',
  }) {
    final uuid = _uuid();
    return 'videos/$userId/$horseId/$uuid.$extension';
  }

  /// Generate a storage path for a document.
  ///
  /// Pattern: `documents/{userId}/{horseId}/{uuid}.pdf`
  static String documentPath({
    required String horseId,
    required String userId,
    String extension = 'pdf',
  }) {
    final uuid = _uuid();
    return 'documents/$userId/$horseId/$uuid.$extension';
  }

  /// Generate a storage path for a market listing photo.
  ///
  /// Pattern: `horse-photos/{userId}/market/{uuid}.jpg`
  static String marketPhotoPath({
    required String userId,
    String extension = 'jpg',
  }) {
    final uuid = _uuid();
    return 'horse-photos/$userId/market/$uuid.$extension';
  }

  /// Generate a private path for a lost-horse report photo.
  ///
  /// The owner id is the first path segment so Storage RLS can enforce
  /// owner-only access.
  static String lostHorsePhotoPath({
    required String reportId,
    required String userId,
    String extension = 'jpg',
  }) {
    final uuid = _uuid();
    return '$userId/$reportId/$uuid.$extension';
  }

  /// Generate a private path for a lost-horse tamga photo.
  static String lostHorseTamgaPath({
    required String reportId,
    required String userId,
    String extension = 'jpg',
  }) {
    final uuid = _uuid();
    return '$userId/$reportId/tamga-$uuid.$extension';
  }

  // ── Helpers ───────────────────────────────────────────────────

  /// Simple UUID v4 generator (no dependency needed).
  static String _uuid() {
    final random = List<int>.generate(
      16,
      (_) => DateTime.now().microsecondsSinceEpoch.hashCode & 0xFF,
    );
    // Rough UUID v4 — good enough for file paths
    return '${_hex(random.sublist(0, 4))}-'
        '${_hex(random.sublist(4, 6))}-'
        '${_hex([(random[6] & 0x0F) | 0x40, random[7]])}-'
        '${_hex([(random[8] & 0x3F) | 0x80, random[9]])}-'
        '${_hex(random.sublist(10, 16))}';
  }

  static String _hex(List<int> bytes) =>
      bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
}
