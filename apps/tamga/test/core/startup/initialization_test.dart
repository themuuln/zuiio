import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/core/error/app_exception.dart';

void main() {
  group('Core startup dependencies', () {
    test('Result.ok compiles and works', () {
      const ok = Result.ok('hello');
      expect(ok.isSuccess, isTrue);
      expect(ok.value, 'hello');
    });

    test('Result.fail works with AppException', () {
      const fail = Result<int>.fail(
        AppException(message: 'test error', code: 'TEST'),
      );
      expect(fail.isFailure, isTrue);
    });
  });
}
