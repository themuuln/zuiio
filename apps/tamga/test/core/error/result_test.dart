import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/core/error/app_exception.dart';

void main() {
  group('Result<T>', () {
    test('Ok stores value and isSuccess is true', () {
      const result = Result<int>.ok(42);
      expect(result.isSuccess, true);
      expect(result.isFailure, false);
      expect(result.value, 42);
    });

    test('Fail stores exception and isSuccess is false', () {
      final result = Result<int>.fail(
        const AppException(message: 'something went wrong', code: 'ERR_1'),
      );
      expect(result.isSuccess, false);
      expect(result.isFailure, true);
      expect(result.error, isA<AppException>());
      expect(result.error.message, 'something went wrong');
      expect(result.error.code, 'ERR_1');
    });

    test('getOrThrow returns value on Ok', () {
      const result = Result<String>.ok('hello');
      expect(result.getOrThrow(), 'hello');
    });

    test('getOrThrow throws on Fail', () {
      final result = Result<String>.fail(
        const AppException(message: 'fail', code: 'ERR_2'),
      );
      expect(() => result.getOrThrow(), throwsA(isA<AppException>()));
    });

    test('getOrDefault returns value on Ok', () {
      const result = Result<int>.ok(10);
      expect(result.getOrDefault(99), 10);
    });

    test('getOrDefault returns fallback on Fail', () {
      final result = Result<int>.fail(
        const AppException(message: 'fail', code: 'ERR_3'),
      );
      expect(result.getOrDefault(99), 99);
    });

    test('map transforms value on Ok', () {
      const result = Result<int>.ok(5);
      final mapped = result.map((v) => v * 2);
      expect(mapped.value, 10);
    });

    test('map passes through error on Fail', () {
      final result = Result<int>.fail(
        const AppException(message: 'fail', code: 'ERR_4'),
      );
      final mapped = result.map((v) => v * 2);
      expect(mapped.isFailure, true);
      expect(mapped.error.message, 'fail');
    });

    test('mapError transforms error on Fail', () {
      final result = Result<int>.fail(
        const AppException(message: 'original', code: 'ERR_5'),
      );
      final mapped = result.mapError(
        (e) => AppException(message: 'wrapped: ${e.message}', code: 'ERR_WRAP'),
      );
      expect(mapped.isFailure, true);
      expect(mapped.error.message, 'wrapped: original');
    });

    test('mapError passes through value on Ok', () {
      const result = Result<int>.ok(42);
      final mapped = result.mapError(
        (e) => AppException(message: 'ignored', code: 'IGNORE'),
      );
      expect(mapped.isSuccess, true);
      expect(mapped.value, 42);
    });

    test('equality — two Ok with same value are equal', () {
      const result1 = Result<int>.ok(1);
      const result2 = Result<int>.ok(1);
      expect(result1, result2);
    });

    test('equality — two Fail with same error are equal', () {
      final result1 = Result<int>.fail(
        const AppException(message: 'err', code: 'E1'),
      );
      final result2 = Result<int>.fail(
        const AppException(message: 'err', code: 'E1'),
      );
      expect(result1, result2);
    });

    test('equality — Ok and Fail are not equal', () {
      const ok = Result<int>.ok(1);
      final fail = Result<int>.fail(
        const AppException(message: 'err', code: 'E1'),
      );
      expect(ok == fail, false);
    });

    test('AsyncResult — ok variant creates success', () async {
      final result = await AsyncResult.ok(Future.value(42));
      expect(result.isSuccess, true);
      expect(result.value, 42);
    });

    test('AsyncResult — fail variant creates failure', () async {
      final result = await AsyncResult.fail(
        Future.value(const AppException(message: 'async fail', code: 'E_A1')),
      );
      expect(result.isFailure, true);
      expect(result.error.message, 'async fail');
    });

    test('trySync catches sync errors', () {
      final result = Result.trySync(() => 42);
      expect(result.isSuccess, true);
      expect(result.value, 42);
    });

    test('trySync catches thrown exceptions', () {
      final result = Result.trySync(() => throw Exception('boom'));
      expect(result.isFailure, true);
      expect(result.error, isA<AppException>());
    });

    test('tryFuture catches async errors', () async {
      final result = await Result.tryFuture(
        () => Future.error(Exception('async boom')),
      );
      expect(result.isFailure, true);
      expect(result.error.code, 'ASYNC_ERROR');
    });

    test(
      'tryFuture preserves AppException code, message, and details',
      () async {
        final thrown = AppException(
          message: 'Conversation not found: missing',
          code: 'CONVERSATION_NOT_FOUND',
          details: {'conversationId': 'missing'},
        );

        final result = await Result.tryFuture(() => Future.error(thrown));

        expect(result.isFailure, true);
        expect(result.error, same(thrown));
        expect(result.error.code, 'CONVERSATION_NOT_FOUND');
        expect(result.error.message, 'Conversation not found: missing');
        expect(result.error.details, {'conversationId': 'missing'});
      },
    );

    test('tryFuture wraps generic exceptions as ASYNC_ERROR', () async {
      final result = await Result.tryFuture(
        () async => throw StateError('generic boom'),
      );

      expect(result.isFailure, true);
      expect(result.error.code, 'ASYNC_ERROR');
      expect(result.error.message, contains('generic boom'));
      expect(result.error.details, isNotNull);
    });

    test('when — calls onSuccess on Ok', () {
      const result = Result<int>.ok(42);
      final calls = <int>[];
      result.when(onSuccess: (v) => calls.add(v), onFailure: (_) {});
      expect(calls, [42]);
    });

    test('when — calls onFailure on Fail', () {
      final result = Result<int>.fail(
        const AppException(message: 'err', code: 'E2'),
      );
      final calls = <AppException>[];
      result.when(onSuccess: (_) {}, onFailure: (e) => calls.add(e));
      expect(calls.length, 1);
      expect(calls[0].message, 'err');
    });
  });

  group('AppException', () {
    test('stores code, message, and optional details', () {
      final exception = AppException(
        message: 'Not found',
        code: 'NOT_FOUND',
        details: {'horseId': 'abc-123'},
      );
      expect(exception.code, 'NOT_FOUND');
      expect(exception.message, 'Not found');
      expect(exception.details, {'horseId': 'abc-123'});
    });

    test('two exceptions with same code and message are equal', () {
      const e1 = AppException(message: 'err', code: 'E1');
      const e2 = AppException(message: 'err', code: 'E1');
      expect(e1, e2);
    });

    test('toString includes code and message', () {
      const exception = AppException(message: 'failed', code: 'ERR');
      expect(exception.toString(), contains('ERR'));
      expect(exception.toString(), contains('failed'));
    });
  });
}
