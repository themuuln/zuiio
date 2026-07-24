import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/error/app_exception.dart';
import 'package:tamga/src/core/error/error_helpers.dart';

void main() {
  group('friendlyErrorMessage', () {
    // ── SocketException → Network error ──────────────────────────

    test('SocketException returns network error in Mongolian', () {
      final error = const SocketException('Connection refused');
      final message = friendlyErrorMessage(error);

      expect(message, contains('Сүлжээнд холбогдож чадсангүй'));
      expect(message, contains('Интернет холболтоо шалгаад'));
      // Should NOT contain raw exception text
      expect(message, isNot(contains('SocketException')));
      expect(message, isNot(contains('Connection refused')));
    });

    test('SocketException with host lookup failure', () {
      final error = const SocketException(
        'host lookup failed',
        osError: OSError('nodename nor servname provided'),
      );
      final message = friendlyErrorMessage(error);

      expect(message, contains('Сүлжээнд холбогдож чадсангүй'));
      expect(message, isNot(contains('nodename')));
    });

    // ── HandshakeException → Network error ───────────────────────

    test('HandshakeException returns network error in Mongolian', () {
      final error = HandshakeException('TLS negotiation failed');
      final message = friendlyErrorMessage(error);

      expect(message, contains('аюулгүй холболт тогтоож чадсангүй'));
      expect(message, isNot(contains('TLS')));
    });

    // ── HttpException → Network error ────────────────────────────

    test('HttpException returns network error in Mongolian', () {
      final error = const HttpException('Bad Gateway');
      final message = friendlyErrorMessage(error);

      expect(message, contains('Сүлжээний алдаа'));
      expect(message, isNot(contains('Bad Gateway')));
    });

    // ── AppException: NETWORK_ERROR code ─────────────────────────

    test('AppException with NETWORK_ERROR code shows network message', () {
      final error = AppException.withDetail(
        'NETWORK_ERROR',
        'raw network error text',
        details: {'status': 503},
      );
      final message = friendlyErrorMessage(error);

      expect(message, contains('Сүлжээнд холбогдож чадсангүй'));
      expect(message, isNot(contains('raw network error text')));
    });

    // ── AppException: REPORT_FAILED code ─────────────────────────

    test('AppException with REPORT_FAILED code shows save error', () {
      final error = AppException.withDetail(
        'REPORT_FAILED',
        'Хаяж морийн мэдээлэл хадгалсангүй: PostgrestException: insert failed',
      );
      final message = friendlyErrorMessage(error);

      expect(message, contains('Мэдээлэл хадгалахад алдаа гарлаа'));
      expect(message, isNot(contains('PostgrestException')));
    });

    // ── AppException: STATUS_UPDATE_FAILED code ──────────────────

    test('AppException with STATUS_UPDATE_FAILED code shows status error', () {
      final error = AppException.withDetail(
        'STATUS_UPDATE_FAILED',
        'Төлөв шинэчилсэнгүй: some error',
      );
      final message = friendlyErrorMessage(error);

      expect(message, contains('Төлөв шинэчлэхэд алдаа гарлаа'));
      expect(message, isNot(contains('some error')));
    });

    // ── AppException: FIELD_UPDATE_FAILED code ───────────────────

    test('AppException with FIELD_UPDATE_FAILED code shows save error', () {
      final error = AppException.withDetail(
        'FIELD_UPDATE_FAILED',
        'Мэдээлэл шинэчилсэнгүй: timeout',
      );
      final message = friendlyErrorMessage(error);

      expect(message, contains('Мэдээлэл хадгалахад алдаа гарлаа'));
    });

    // ── AppException: EXPIRY_CHECK_FAILED code ───────────────────

    test('AppException with EXPIRY_CHECK_FAILED code shows expiry error', () {
      final error = AppException.withDetail(
        'EXPIRY_CHECK_FAILED',
        'expiry check failed',
      );
      final message = friendlyErrorMessage(error);

      expect(message, contains('хугацааг шалгахад алдаа гарлаа'));
    });

    // ── AppException: UPLOAD_FAILED code ─────────────────────────

    test('AppException with UPLOAD_FAILED code shows upload error', () {
      final error = AppException.withDetail(
        'UPLOAD_FAILED',
        'upload failed: something',
      );
      final message = friendlyErrorMessage(error);

      expect(message, contains('Зураг ачаалахад алдаа гарлаа'));
    });

    // ── AppException: AUTH_REQUIRED code (preserves message) ─────

    test('AppException with AUTH_REQUIRED code preserves message', () {
      final error = AppException.authRequired;
      final message = friendlyErrorMessage(error);

      // AUTH_REQUIRED message is already clean Mongolian
      expect(message, 'Нэвтрэх шаардлагатай');
    });

    // ── AppException: RENEWAL_NOT_ALLOWED code (preserves message) ──

    test('AppException with RENEWAL_NOT_ALLOWED code preserves message', () {
      final error = AppException.withDetail(
        'RENEWAL_NOT_ALLOWED',
        'Энгийн зарыг сунгах боломжгүй',
      );
      final message = friendlyErrorMessage(error);

      expect(message, 'Энгийн зарыг сунгах боломжгүй');
    });

    // ── AppException: unknown code → generic ─────────────────────

    test('AppException with unknown code returns generic message', () {
      final error = AppException.withDetail(
        'UNKNOWN_CODE_123',
        'Something unexpected happened',
      );
      final message = friendlyErrorMessage(error);

      expect(message, contains('Түр зуурын алдаа гарлаа'));
      expect(message, isNot(contains('Something unexpected')));
    });

    // ── Non-AppException, non-network errors → generic ───────────

    test('generic Exception returns generic message', () {
      final error = Exception('Something broke');
      final message = friendlyErrorMessage(error);

      expect(message, 'Түр зуурын алдаа гарлаа. Дахин оролдоно уу.');
      expect(message, isNot(contains('Something broke')));
    });

    test('ArgumentError returns generic message', () {
      final error = ArgumentError('invalid value');
      final message = friendlyErrorMessage(error);

      expect(message, contains('Түр зуурын алдаа гарлаа'));
      expect(message, isNot(contains('invalid value')));
    });

    test('null error returns generic message', () {
      final message = friendlyErrorMessage(null);

      expect(message, 'Түр зуурын алдаа гарлаа. Дахин оролдоно уу.');
    });

    test('string error returns generic message', () {
      final message = friendlyErrorMessage('some error occurred');

      expect(message, 'Түр зуурын алдаа гарлаа. Дахин оролдоно уу.');
    });

    // ── Edge case: AppException.default constants ──────────────────

    test('AppException.networkError constant is properly mapped', () {
      final error = AppException.networkError;
      final message = friendlyErrorMessage(error);

      expect(message, contains('Сүлжээнд холбогдож чадсангүй'));
    });

    test('AppException.storageFull constant returns generic', () {
      final error = AppException.storageFull;
      final message = friendlyErrorMessage(error);

      expect(message, 'Түр зуурын алдаа гарлаа. Дахин оролдоно уу.');
    });

    test('AppException.unknown constant returns generic', () {
      final error = AppException.unknown;
      final message = friendlyErrorMessage(error);

      expect(message, 'Түр зуурын алдаа гарлаа. Дахин оролдоно уу.');
    });

    // ── contextualErrorMessage ───────────────────────────────────

    test('contextualErrorMessage wraps friendlyErrorMessage', () {
      final error = const SocketException('Connection refused');
      final message = contextualErrorMessage('хадгалахад', error);

      expect(message, contains('Сүлжээнд холбогдож чадсангүй'));
    });
  });
}
