import 'dart:io';

import '../../../core/error/result.dart';
import 'media_upload_result.dart';

/// Supported media categories for storage routing.
enum MediaCategory {
  /// Horse photos, profile avatars, event photos → Supabase Storage.
  photo,

  /// Private photos attached to a recovery report.
  recoveryPhoto,

  /// Private photos attached to a community sighting.
  recoverySightingPhoto,

  /// Documents (vet certs, insurance, registration) → Supabase Storage.
  document,

  /// Race videos, training videos → Cloudflare R2.
  video,
}

/// Abstract interface for cloud media storage.
///
/// Implementations:
/// - [SupabaseMediaStorage] — photos and documents (Supabase Storage)
/// - [R2MediaStorage] — videos (Cloudflare R2)
abstract class MediaStorageService {
  /// Upload a file and return the public/signed URL.
  ///
  /// [path] is the storage path (e.g. `horse-photos/{horseId}/{uuid}.jpg`).
  /// The service determines bucket and access based on [category].
  Future<Result<MediaUploadResult>> upload({
    required File file,
    required String path,
    required MediaCategory category,
  });

  /// Delete a file by its storage path.
  Future<Result<void>> delete({
    required String path,
    required MediaCategory category,
  });

  /// Get a signed URL for private files (documents, R2 videos).
  ///
  /// Public files (horse photos) return the direct URL.
  Future<Result<String>> getSignedUrl({
    required String path,
    required MediaCategory category,
    Duration expiry = const Duration(hours: 1),
  });

  /// Check if a file exists at the given path.
  Future<Result<bool>> exists({
    required String path,
    required MediaCategory category,
  });

  /// List files under a prefix (e.g. all photos for a horse).
  Future<Result<List<String>>> listPaths({
    required String prefix,
    required MediaCategory category,
  });
}
