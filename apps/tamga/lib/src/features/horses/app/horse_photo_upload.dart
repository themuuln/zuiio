import 'dart:io';

import 'package:flutter/foundation.dart' show debugPrint;
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../app/supabase_bootstrap.dart';
import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../../core/storage/cloud/media_storage_service.dart';
import '../../../core/storage/cloud/supabase_media_storage.dart';

/// Upload a photo for a horse and persist the URL.
///
/// Compresses the image before upload to reduce bandwidth and storage.
/// Returns the new photo URL on success.
Future<Result<String>> uploadHorsePhoto({
  required String horseId,
  required ImageSource source,
}) async {
  final picker = ImagePicker();
  final xFile = await picker.pickImage(
    source: source,
    maxWidth: 2048,
    maxHeight: 2048,
    imageQuality: 85,
  );

  if (xFile == null) {
    return Result.fail(
      const AppException(
        message: 'Зураг сонгосонгүй',
        code: 'NO_IMAGE_SELECTED',
      ),
    );
  }

  final userId = currentSupabaseUserId();
  if (userId == null) {
    return Result.fail(
      const AppException(
        message: 'Нэвтрэх шаардлагатай',
        code: 'AUTH_REQUIRED',
      ),
    );
  }

  // Compress the image
  final compressedFile = await _compressImage(File(xFile.path));
  if (compressedFile == null) {
    return Result.fail(
      const AppException(
        message: 'Зураг шахахад алдаа гарлаа',
        code: 'COMPRESSION_FAILED',
      ),
    );
  }

  final storage = SupabaseMediaStorage();

  final path =
      'horse-photos/$userId/$horseId/${DateTime.now().millisecondsSinceEpoch}.jpg';

  final uploadResult = await storage.upload(
    file: compressedFile,
    path: path,
    category: MediaCategory.photo,
  );

  // Clean up compressed file
  try {
    await compressedFile.delete();
  } catch (e) {
    debugPrint('[HorsePhotoUpload] Failed to delete temp file: $e');
  }

  return uploadResult.map((upload) {
    // Update Supabase
    _addPhotoToSupabase(horseId, upload.url);
    return upload.url;
  });
}

/// Compress an image file for upload.
///
/// Target: ~200-500 KB, max 2048px on longest side.
Future<File?> _compressImage(File file) async {
  try {
    final dir = await getTemporaryDirectory();
    final targetPath =
        '${dir.path}/${DateTime.now().millisecondsSinceEpoch}.jpg';

    final result = await FlutterImageCompress.compressAndGetFile(
      file.absolute.path,
      targetPath,
      quality: 80,
      minWidth: 1024,
      minHeight: 1024,
      format: CompressFormat.jpeg,
    );

    if (result == null) return null;
    return File(result.path);
  } catch (_) {
    return null;
  }
}

/// Add photo URL to Supabase horses table.
Future<void> _addPhotoToSupabase(String horseId, String url) async {
  try {
    final client = Supabase.instance.client;

    // Fetch current photo_urls
    final result = await client
        .from('horses')
        .select('photo_urls')
        .eq('id', horseId)
        .single();

    final current =
        (result['photo_urls'] as List<dynamic>?)
            ?.map((e) => e as String)
            .toList() ??
        [];

    // Append new URL
    await client
        .from('horses')
        .update({
          'photo_urls': [...current, url],
          'updated_at': DateTime.now().toIso8601String(),
        })
        .eq('id', horseId);
  } catch (_) {
    // Best-effort — will sync later
  }
}
