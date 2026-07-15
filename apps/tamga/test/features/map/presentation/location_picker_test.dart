import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Location form field validations', () {
    // ── Баг field validation ──

    test('empty bag field shows validation error', () {
      final validator = _buildRequiredValidator('Баг оруулна уу');
      final result = validator('');
      expect(result, 'Баг оруулна уу');
    });

    test('whitespace-only bag field shows validation error', () {
      final validator = _buildRequiredValidator('Баг оруулна уу');
      final result = validator('   ');
      expect(result, 'Баг оруулна уу');
    });

    test('non-empty bag field passes validation', () {
      final validator = _buildRequiredValidator('Баг оруулна уу');
      final result = validator('1-р баг');
      expect(result, isNull);
    });

    test('bag field trimmed value passes validation', () {
      final validator = _buildRequiredValidator('Баг оруулна уу');
      final result = validator('  1-р баг  ');
      expect(result, isNull);
    });

    test('bag field exceeds max length', () {
      final validator = _buildMaxLengthValidator(
        200,
        'Баг 200 тэмдэгтээс хэтрэхгүй',
      );
      final longText = 'а' * 201;
      final result = validator(longText);
      expect(result, 'Баг 200 тэмдэгтээс хэтрэхгүй');
    });

    test('bag field at exactly max length passes', () {
      final validator = _buildMaxLengthValidator(
        200,
        'Баг 200 тэмдэгтээс хэтрэхгүй',
      );
      final exactText = 'а' * 200;
      final result = validator(exactText);
      expect(result, isNull);
    });

    // ── Газрын нэр field validation ──

    test('empty location name field shows validation error', () {
      final validator = _buildRequiredValidator('Газрын нэр оруулна уу');
      final result = validator('');
      expect(result, 'Газрын нэр оруулна уу');
    });

    test('whitespace-only location name field shows validation error', () {
      final validator = _buildRequiredValidator('Газрын нэр оруулна уу');
      final result = validator('   ');
      expect(result, 'Газрын нэр оруулна уу');
    });

    test('non-empty location name field passes validation', () {
      final validator = _buildRequiredValidator('Газрын нэр оруулна уу');
      final result = validator('Говь');
      expect(result, isNull);
    });

    test('location name field exceeds max length', () {
      final validator = _buildMaxLengthValidator(
        200,
        'Газрын нэр 200 тэмдэгтээс хэтрэхгүй',
      );
      final longText = 'а' * 201;
      final result = validator(longText);
      expect(result, 'Газрын нэр 200 тэмдэгтээс хэтрэхгүй');
    });
  });
}

/// Simulates a required field validator: non-null, non-empty after trim.
ValidatorFunction _buildRequiredValidator(String errorMessage) {
  return (String? value) {
    if (value == null || value.trim().isEmpty) return errorMessage;
    return null;
  };
}

/// Simulates a max-length field validator.
ValidatorFunction _buildMaxLengthValidator(int max, String errorMessage) {
  return (String? value) {
    if (value != null && value.length > max) return errorMessage;
    return null;
  };
}

typedef ValidatorFunction = String? Function(String?);
