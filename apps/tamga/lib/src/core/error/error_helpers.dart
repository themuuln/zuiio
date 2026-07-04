import 'dart:io';

import 'app_exception.dart';

/// Convert any error to a user-friendly Mongolian error message.
///
/// Returns an appropriate message based on error type:
/// - Network errors → "Сүлжээнд холбогдож чадсангүй" message
/// - Storage errors → "Хадгалах зай" or upload-specific message
/// - Auth errors → "Нэвтрэх" message
/// - Known AppException codes → code-specific messages
/// - Unknown errors → generic "алдаа гарлаа" message
///
/// Use this in all catch blocks to ensure users never see raw
/// exception text (English stack traces or system errors).
String friendlyErrorMessage(dynamic error) {
  // ── Network errors ──────────────────────────────────────────────
  if (error is SocketException) {
    return 'Сүлжээнд холбогдож чадсангүй. '
        'Интернет холболтоо шалгаад дахин оролдоно уу.';
  }

  if (error is HandshakeException) {
    return 'Сүлжээний аюулгүй холболт тогтоож чадсангүй. '
        'Дахин оролдоно уу.';
  }

  if (error is HttpException) {
    return 'Сүлжээний алдаа гарлаа. Дахин оролдоно уу.';
  }

  // ── AppException with known codes ─────────────────────────────
  if (error is AppException) {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Сүлжээнд холбогдож чадсангүй. Дахин оролдоно уу.';
      case 'REPORT_FAILED':
      case 'FIELD_UPDATE_FAILED':
        return 'Мэдээлэл хадгалахад алдаа гарлаа. Дахин оролдоно уу.';
      case 'STATUS_UPDATE_FAILED':
        return 'Төлөв шинэчлэхэд алдаа гарлаа. Дахин оролдоно уу.';
      case 'EXPIRY_CHECK_FAILED':
        return 'Зарын хугацааг шалгахад алдаа гарлаа. Дахин оролдоно уу.';
      case 'UPLOAD_FAILED':
        return 'Зураг ачаалахад алдаа гарлаа. Дахин оролдоно уу.';
      case 'AUTH_REQUIRED':
        return error.message; // Already clean Mongolian
      case 'RENEWAL_NOT_ALLOWED':
        return error.message; // Already clean Mongolian
      default:
        return 'Түр зуурын алдаа гарлаа. Дахин оролдоно уу.';
    }
  }

  // ── Fallback for completely unknown errors ─────────────────────
  return 'Түр зуурын алдаа гарлаа. Дахин оролдоно уу.';
}

/// Map an error to a context-specific submission error message.
///
/// [contextLabel] is the action that failed, e.g. 'хадгалахад',
/// 'ши-нэчлэхэд', 'ачаалахад'.
String contextualErrorMessage(String contextLabel, dynamic error) {
  final baseMessage = friendlyErrorMessage(error);
  return '$contextLabel $baseMessage';
}
