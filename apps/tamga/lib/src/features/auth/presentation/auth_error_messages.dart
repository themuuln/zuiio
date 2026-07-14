import 'package:supabase_flutter/supabase_flutter.dart' show AuthException;

import '../../../core/error/app_exception.dart';

/// Auth алдаануудыг хэрэглэгчдэд ойлгомжтой, хоёр хэлээр харуулах туслах функц.
///
/// [error] нь [AppException], [AuthException] эсвэл бусад төрлийн алдаа байж болно.
/// Буцах утга нь Монгол (эхний мөр) + Англи (хоёр дахь мөр) форматтай текст.
///
/// ```dart
/// setState(() => _errorMessage = formatAuthErrorMessage(e));
/// ```
String formatAuthErrorMessage(Object error) {
  // ── AppException ────────────────────────────────────────────
  if (error is AppException) {
    final message = error.message.toLowerCase();
    final code = error.code;

    // Supabase тохиргоогүй
    if (code == 'SUPABASE_NOT_CONFIGURED') {
      return 'Системийн тохиргоо дутуу байна\nSystem configuration is incomplete';
    }

    // Нэвтрэх мэдээлэл буруу
    if (message.contains('invalid login credentials') ||
        message.contains('invalid email or password')) {
      return 'Имэйл эсвэл нууц үг буруу байна\nInvalid email or password';
    }

    // Бүртгэл аль хэдийн үүссэн
    if (message.contains('user already registered')) {
      return 'Бүртгэл аль хэдийн үүссэн байна\nUser already registered';
    }

    // Имэйл баталгаажаагүй
    if (message.contains('email not confirmed')) {
      return 'Имэйл хаяг баталгаажаагүй байна\nEmail not confirmed';
    }

    // Нууц үг хэт богино
    if (message.contains('password should be at least') ||
        message.contains('password is too short') ||
        message.contains('weak password')) {
      return 'Нууц үг хэт богино байна (6 тэмдэгтээс дээш)\nPassword is too short (minimum 6 characters)';
    }

    // Имэйл хаяг буруу
    if (message.contains('invalid email')) {
      return 'Имэйл хаяг буруу байна\nInvalid email address';
    }

    // Хэт олон хүсэлт
    if (message.contains('email rate limit exceeded') ||
        message.contains('too many requests')) {
      return 'Хэт олон хүсэлт илгээсэн байна. Түр хүлээнэ үү.\nToo many requests. Please wait.';
    }

    // Бүртгүүлэх боломжгүй
    if (message.contains('sign up not allowed') ||
        message.contains('signup not allowed')) {
      return 'Бүртгүүлэх боломжгүй байна\nSign up is not allowed';
    }

    // Хэрэглэгч олдсонгүй
    if (message.contains('resource not found') ||
        message.contains('user not found')) {
      return 'Хэрэглэгч олдсонгүй\nUser not found';
    }

    // Сүлжээний алдаа
    if (message.contains('network') ||
        message.contains('connection') ||
        message.contains('timeout') ||
        message.contains('internet')) {
      return 'Сүлжээний холбоо тасарсан. Холболтоо шалгана уу.\nNetwork error. Check your connection.';
    }

    // Anonymous нэвтрэлтийн алдаа
    if (message.contains('anonymous') ||
        code == 'ANONYMOUS_SIGNIN_FAILED' ||
        code == 'SIGNIN_FAILED' ||
        code == 'SIGNUP_FAILED') {
      if (code == 'SIGNIN_FAILED') {
        return 'Нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.\nLogin failed. Please try again.';
      }
      if (code == 'SIGNUP_FAILED') {
        return 'Бүртгүүлэхэд алдаа гарлаа. Дахин оролдоно уу.\nRegistration failed. Please try again.';
      }
      return 'Нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.\nLogin failed. Please try again.';
    }

    // Ерөнхий алдаа
    return 'Алдаа гарлаа. Дахин оролдоно уу.\nAn error occurred. Please try again.';
  }

  // ── Supabase AuthException ──────────────────────────────────
  if (error is AuthException) {
    return _formatAuthException(error);
  }

  // ── Бусад төрлийн алдаа ─────────────────────────────────────
  return 'Алдаа гарлаа. Дахин оролдоно уу.\nAn error occurred. Please try again.';
}

/// Supabase-ийн [AuthException]-г хоёр хэлээр харуулах.
String _formatAuthException(AuthException error) {
  final message = error.message.toLowerCase();

  if (message.contains('invalid login credentials') ||
      message.contains('invalid email or password')) {
    return 'Имэйл эсвэл нууц үг буруу байна\nInvalid email or password';
  }
  if (message.contains('user already registered')) {
    return 'Бүртгэл аль хэдийн үүссэн байна\nUser already registered';
  }
  if (message.contains('email not confirmed')) {
    return 'Имэйл хаяг баталгаажаагүй байна\nEmail not confirmed';
  }
  if (message.contains('password should be at least') ||
      message.contains('weak password')) {
    return 'Нууц үг хэт богино байна (6 тэмдэгтээс дээш)\nPassword is too short (minimum 6 characters)';
  }
  if (message.contains('invalid email')) {
    return 'Имэйл хаяг буруу байна\nInvalid email address';
  }
  if (message.contains('email rate limit exceeded') ||
      message.contains('too many requests')) {
    return 'Хэт олон хүсэлт илгээсэн байна. Түр хүлээнэ үү.\nToo many requests. Please wait.';
  }
  if (message.contains('network') ||
      message.contains('connection') ||
      message.contains('timeout')) {
    return 'Сүлжээний холбоо тасарсан. Холболтоо шалгана уу.\nNetwork error. Check your connection.';
  }

  return 'Алдаа гарлаа. Дахин оролдоно уу.\nAn error occurred. Please try again.';
}
