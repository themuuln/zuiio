import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:path/path.dart' as p;

import '../../error/app_exception.dart';
import '../../error/result.dart';
import 'media_storage_service.dart';
import 'media_upload_result.dart';

/// Cloudflare R2 storage implementation for videos.
///
/// Uses presigned URLs for upload/download. The signing endpoint is
/// a Cloudflare Worker or Supabase Edge Function that holds the
/// R2 credentials securely.
///
/// Flow:
/// 1. App calls [signingEndpoint] to get a presigned upload URL
/// 2. App uploads file directly to R2 via the presigned URL
/// 3. App stores the R2 object key in the database
///
/// Environment variables required:
/// - `R2_SIGNING_ENDPOINT` — URL of the signing Worker/Edge Function
/// - `R2_PUBLIC_DOMAIN` — Custom domain or r2.dev URL for public access
class R2MediaStorage implements MediaStorageService {
  R2MediaStorage({
    required this.signingEndpoint,
    required this.publicDomain,
    http.Client? httpClient,
  }) : _http = httpClient ?? http.Client();

  /// URL of the Cloudflare Worker / Edge Function that generates
  /// presigned URLs. The worker should accept:
  ///   POST {signingEndpoint}
  ///   Body: { "key": "videos/{path}", "action": "put" | "get", "expires": 3600 }
  ///   Response: { "url": "https://..." }
  final String signingEndpoint;

  /// Public domain for constructing direct URLs after upload.
  /// Example: `https://pub-xxx.r2.dev` or `https://videos.tamga.mn`
  final String publicDomain;

  final http.Client _http;

  // ── Upload ────────────────────────────────────────────────────

  @override
  Future<Result<MediaUploadResult>> upload({
    required File file,
    required String path,
    required MediaCategory category,
  }) async {
    if (category != MediaCategory.video) {
      return Result.fail(
        const AppException(
          message: 'R2MediaStorage only supports video uploads',
          code: 'WRONG_STORAGE_BACKEND',
        ),
      );
    }

    return Result.tryFuture(() async {
      final bytes = await file.readAsBytes();
      final mimeType = _mimeTypeFromPath(path);

      // 1. Get presigned upload URL from signing service
      final presignedUrl = await _getPresignedUrl(
        key: path,
        action: 'put',
        contentType: mimeType,
      );

      // 2. Upload directly to R2
      final response = await _http.put(
        Uri.parse(presignedUrl),
        headers: {'Content-Type': mimeType},
        body: bytes,
      );

      if (response.statusCode != 200 && response.statusCode != 201) {
        throw AppException.withDetail(
          'R2_UPLOAD_FAILED',
          'R2 upload failed with status ${response.statusCode}',
          details: {'statusCode': response.statusCode, 'body': response.body},
        );
      }

      // 3. Construct public URL
      final publicUrl = '$publicDomain/$path';

      return MediaUploadResult(
        url: publicUrl,
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
    if (category != MediaCategory.video) {
      return Result.fail(
        const AppException(
          message: 'R2MediaStorage only supports video operations',
          code: 'WRONG_STORAGE_BACKEND',
        ),
      );
    }

    return Result.tryFuture(() async {
      final presignedUrl = await _getPresignedUrl(key: path, action: 'delete');

      final response = await _http.delete(Uri.parse(presignedUrl));

      if (response.statusCode != 204 && response.statusCode != 200) {
        throw AppException.withDetail(
          'R2_DELETE_FAILED',
          'R2 delete failed with status ${response.statusCode}',
          details: {'statusCode': response.statusCode},
        );
      }
    });
  }

  // ── Signed URLs ───────────────────────────────────────────────

  @override
  Future<Result<String>> getSignedUrl({
    required String path,
    required MediaCategory category,
    Duration expiry = const Duration(hours: 1),
  }) async {
    if (category != MediaCategory.video) {
      return Result.fail(
        const AppException(
          message: 'R2MediaStorage only supports video operations',
          code: 'WRONG_STORAGE_BACKEND',
        ),
      );
    }

    return Result.tryFuture(() async {
      return await _getPresignedUrl(
        key: path,
        action: 'get',
        expires: expiry.inSeconds,
      );
    });
  }

  // ── Exists ────────────────────────────────────────────────────

  @override
  Future<Result<bool>> exists({
    required String path,
    required MediaCategory category,
  }) async {
    if (category != MediaCategory.video) {
      return Result.fail(
        const AppException(
          message: 'R2MediaStorage only supports video operations',
          code: 'WRONG_STORAGE_BACKEND',
        ),
      );
    }

    return Result.tryFuture(() async {
      final url = '$publicDomain/$path';
      final response = await _http.head(Uri.parse(url));
      return response.statusCode == 200;
    });
  }

  // ── List ──────────────────────────────────────────────────────

  @override
  Future<Result<List<String>>> listPaths({
    required String prefix,
    required MediaCategory category,
  }) async {
    return Result.fail(
      const AppException(
        message: 'R2 list not yet implemented — use database to track paths',
        code: 'NOT_IMPLEMENTED',
      ),
    );
  }

  // ── Internal ──────────────────────────────────────────────────

  Future<String> _getPresignedUrl({
    required String key,
    required String action,
    String? contentType,
    int expires = 3600,
  }) async {
    final body = <String, dynamic>{
      'key': key,
      'action': action,
      'expires': expires,
    };
    if (contentType != null) {
      body['contentType'] = contentType;
    }

    final response = await _http.post(
      Uri.parse(signingEndpoint),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );

    if (response.statusCode != 200) {
      throw AppException.withDetail(
        'R2_SIGNING_FAILED',
        'Failed to get presigned URL from signing service',
        details: {'statusCode': response.statusCode, 'body': response.body},
      );
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return data['url'] as String;
  }

  String _mimeTypeFromPath(String path) {
    final ext = p.extension(path).toLowerCase();
    return switch (ext) {
      '.mp4' => 'video/mp4',
      '.mov' => 'video/quicktime',
      '.avi' => 'video/x-msvideo',
      '.webm' => 'video/webm',
      '.mkv' => 'video/x-matroska',
      _ => 'video/mp4',
    };
  }
}
