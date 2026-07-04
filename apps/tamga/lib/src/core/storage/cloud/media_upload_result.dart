/// Upload result returned by [MediaStorageService].
///
/// Contains the public URL and metadata for the uploaded file.
class MediaUploadResult {
  const MediaUploadResult({
    required this.url,
    required this.path,
    required this.fileSize,
    required this.mimeType,
  });

  /// Public or signed URL for accessing the file.
  final String url;

  /// Storage path (e.g. `horse-photos/{userId}/{uuid}.jpg`).
  final String path;

  /// File size in bytes.
  final int fileSize;

  /// MIME type (e.g. `image/jpeg`, `video/mp4`).
  final String mimeType;

  @override
  String toString() =>
      'MediaUploadResult(url: $url, path: $path, size: $fileSize)';
}
