/// Cloud sync-ийн тохиргоо.
///
/// Нэмэлт параметрүүдийг энд нэмнэ — жишээ нь batch size,
/// retry хугацаа, periodic sync давтамж гэх мэт.
class SyncConfig {
  const SyncConfig({
    this.pullOnStart = true,
    this.pushOnChanges = true,
    this.periodicInterval = const Duration(minutes: 15),
    this.maxRetries = 5,
    this.batchSize = 50,
  });

  /// App эхлэхэд таталт хийх эсэх.
  final bool pullOnStart;

  /// Локал өөрчлөлттэй болгүй илгээх эсэх.
  final bool pushOnChanges;

  /// Periodic sync-ийн давтамж.
  final Duration periodicInterval;

  /// Дахин оролдох хамгийн их тоо.
  final int maxRetries;

  /// Нэг удаа боловсруулах хамгийн их item тоо.
  final int batchSize;
}
