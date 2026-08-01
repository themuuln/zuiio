import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../error/app_exception.dart';
import '../../error/result.dart';
import 'media_storage_service.dart';
import 'media_upload_result.dart';

/// Supabase Storage implementation for photos and documents.
///
/// Bucket mapping:
/// - [MediaCategory.photo] → `horse-photos` (public read)
/// - [MediaCategory.recoveryPhoto] → `lost-horse-reports` (private, owner read)
/// - [MediaCategory.document] → `documents` (private, owner read/write)
class SupabaseMediaStorage implements MediaStorageService {
  SupabaseMediaStorage({SupabaseClient? client})
    : _client = client ?? Supabase.instance.client;

  final SupabaseClient _client;

  // ── Bucket mapping ────────────────────────────────────────────
  static const _bucketMap = {
    MediaCategory.photo: 'horse-photos',
    MediaCategory.recoveryPhoto: 'lost-horse-reports',
    MediaCategory.recoverySightingPhoto: 'lost-horse-sightings',
    MediaCategory.document: 'documents',
  };

  String _bucket(MediaCategory category) =>
      _bucketMap[category] ??
      (throw AppException.withDetail(
        'INVALID_CATEGORY',
        'SupabaseStorage does not support category: $category',
      ));

  // ── Upload ────────────────────────────────────────────────────

  @override
  Future<Result<MediaUploadResult>> upload({
    required File file,
    required String path,
    required MediaCategory category,
  }) async {
    if (category == MediaCategory.video) {
      return Result.fail(
        const AppException(
          message: 'Videos must use R2 storage',
          code: 'WRONG_STORAGE_BACKEND',
        ),
      );
    }

    return Result.tryFuture(() async {
      final bucket = _bucket(category);
      final bytes = await file.readAsBytes();
      final mimeType = _mimeTypeFromPath(path);

      await _client.storage
          .from(bucket)
          .uploadBinary(
            path,
            bytes,
            fileOptions: FileOptions(contentType: mimeType, upsert: true),
          );
      final url = switch (category) {
        MediaCategory.recoveryPhoto ||
        MediaCategory.recoverySightingPhoto => path,
        _ => _client.storage.from(bucket).getPublicUrl(path),
      };

      return MediaUploadResult(
        url: url,
        path: path,
        fileSize: bytes.length,
        mimeType: mimeType,
      );
    });
  }

  // ── Delete ────────────────────────────────────────────────────

  @override
  Future<Result<void>> delete({
    required String path,
    required MediaCategory category,
  }) async {
    if (category == MediaCategory.video) {
      return Result.fail(
        const AppException(
          message: 'Videos must use R2 storage',
          code: 'WRONG_STORAGE_BACKEND',
        ),
      );
    }

    return Result.tryFuture(() async {
      final bucket = _bucket(category);
      await _client.storage.from(bucket).remove([path]);
    });
  }

  // ── Signed URLs ───────────────────────────────────────────────

  @override
  Future<Result<String>> getSignedUrl({
    required String path,
    required MediaCategory category,
    Duration expiry = const Duration(hours: 1),
  }) async {
    if (category == MediaCategory.video) {
      return Result.fail(
        const AppException(
          message: 'Videos must use R2 storage',
          code: 'WRONG_STORAGE_BACKEND',
        ),
      );
    }

    return Result.tryFuture(() async {
      final bucket = _bucket(category);

      // Public buckets use direct URL, private buckets use signed URLs
      if (category == MediaCategory.photo) {
        return _client.storage.from(bucket).getPublicUrl(path);
      }

      // Documents are private — generate signed URL
      final signedUrl = await _client.storage
          .from(bucket)
          .createSignedUrl(path, expiry.inSeconds);
      return signedUrl;
    });
  }

  // ── Exists ────────────────────────────────────────────────────

  @override
  Future<Result<bool>> exists({
    required String path,
    required MediaCategory category,
  }) async {
    if (category == MediaCategory.video) {
      return Result.fail(
        const AppException(
          message: 'Videos must use R2 storage',
          code: 'WRONG_STORAGE_BACKEND',
        ),
      );
    }

    return Result.tryFuture(() async {
      final bucket = _bucket(category);
      try {
        await _client.storage.from(bucket).download(path);
        return true;
      } catch (_) {
        return false;
      }
    });
  }

  // ── List ──────────────────────────────────────────────────────

  @override
  Future<Result<List<String>>> listPaths({
    required String prefix,
    required MediaCategory category,
  }) async {
    if (category == MediaCategory.video) {
      return Result.fail(
        const AppException(
          message: 'Videos must use R2 storage',
          code: 'WRONG_STORAGE_BACKEND',
        ),
      );
    }

    return Result.tryFuture(() async {
      final bucket = _bucket(category);
      final files = await _client.storage.from(bucket).list(path: prefix);
      return files.map((f) => '$prefix/${f.name}').toList();
    });
  }

  // ── Helpers ───────────────────────────────────────────────────

  String _mimeTypeFromPath(String path) {
    final ext = p.extension(path).toLowerCase();
    return switch (ext) {
      '.jpg' || '.jpeg' => 'image/jpeg',
      '.png' => 'image/png',
      '.webp' => 'image/webp',
      '.gif' => 'image/gif',
      '.pdf' => 'application/pdf',
      '.doc' || '.docx' => 'application/msword',
      _ => 'application/octet-stream',
    };
  }
}
