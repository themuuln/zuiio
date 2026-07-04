/// Зориуд гаргасан exception — алдааг хянах, хэрэглэгчдэд харуулахад зориулагдсан.
///
/// ```dart
/// throw const AppException(
///   message: 'Морь олдсонгүй',
///   code: 'HORSE_NOT_FOUND',
///   details: {'horseId': id},
/// );
/// ```
class AppException implements Exception {
  const AppException({required this.message, required this.code, this.details});

  final String code;
  final String message;
  final Map<String, dynamic>? details;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AppException && code == other.code && message == other.message;

  @override
  int get hashCode => Object.hash(code, message);

  @override
  String toString() => 'AppException[$code]: $message';

  // ── Common error factories ──────────────────────────────────────────

  static const horseNotFound = AppException(
    message: 'Морь олдсонгүй',
    code: 'HORSE_NOT_FOUND',
  );

  static const syncFailed = AppException(
    message: 'Синхрончлолд алдаа гарлаа',
    code: 'SYNC_FAILED',
  );

  static const networkError = AppException(
    message: 'Сүлжээнд холбогдож чадсангүй',
    code: 'NETWORK_ERROR',
  );

  static const storageFull = AppException(
    message: 'Дүүрсэн хадгалах зай',
    code: 'STORAGE_FULL',
  );

  static const authRequired = AppException(
    message: 'Нэвтрэх шаардлагатай',
    code: 'AUTH_REQUIRED',
  );

  static const unknown = AppException(
    message: 'Тодорхойгүй алдаа',
    code: 'UNKNOWN',
  );

  static AppException withDetail(
    String code,
    String message, {
    Map<String, dynamic>? details,
  }) {
    return AppException(message: message, code: code, details: details);
  }
}
