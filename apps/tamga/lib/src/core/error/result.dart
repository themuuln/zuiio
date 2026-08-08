import 'app_exception.dart';

/// Бүх repository болон service layer-ийн буцах төрөл.
///
/// Алдааг throw хийхийн оронд Result-ээр илэрхийлнэ:
/// ```dart
/// Future<Result<Horse>> fetchHorse(String id) async { ... }
/// ```
sealed class Result<T> {
  const Result._();

  const factory Result.ok(T value) = Ok<T>;

  const factory Result.fail(AppException error) = Fail<T>;

  bool get isSuccess => this is Ok<T>;
  bool get isFailure => this is Fail<T>;

  T get value => (this as Ok<T>).value;
  AppException get error => (this as Fail<T>).error;

  /// Амжилттай бол утга, алдаатай бол throw.
  T getOrThrow() => switch (this) {
    Ok(value: final v) => v,
    Fail(error: final e) => throw e,
  };

  /// Амжилттай бол утга, алдаатай бол fallback.
  T getOrDefault(T fallback) => switch (this) {
    Ok(value: final v) => v,
    Fail() => fallback,
  };

  /// Утгыг хувиргах. Алдаатай бол дамжуулна.
  Result<R> map<R>(R Function(T) transform) => switch (this) {
    Ok(value: final v) => Result.ok(transform(v)),
    Fail(error: final e) => Result.fail(e),
  };

  /// Алдааг хувиргах. Амжилттай бол дамжуулна.
  Result<T> mapError(AppException Function(AppException) transform) =>
      switch (this) {
        Ok() => this,
        Fail(error: final e) => Result.fail(transform(e)),
      };

  /// Pattern matching.
  void when({
    required void Function(T) onSuccess,
    required void Function(AppException) onFailure,
  }) {
    switch (this) {
      case Ok(value: final v):
        onSuccess(v);
      case Fail(error: final e):
        onFailure(e);
    }
  }

  /// Sync function-ийг Result болгон боох.
  static Result<T> trySync<T>(T Function() fn) {
    try {
      return Result.ok(fn());
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'SYNC_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  /// Async function-ийг Result болгон боох.
  static Future<Result<T>> tryFuture<T>(Future<T> Function() fn) async {
    try {
      return Result.ok(await fn());
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'ASYNC_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Result<T> &&
          runtimeType == other.runtimeType &&
          _equalValue(this, other);

  @override
  int get hashCode => Object.hash(runtimeType, _hashValue(this));

  static bool _equalValue<T>(Result<T> a, Result<T> b) => switch ((a, b)) {
    (Ok(value: final va), Ok(value: final vb)) => va == vb,
    (Fail(error: final ea), Fail(error: final eb)) => ea == eb,
    _ => false,
  };

  static int _hashValue<T>(Result<T> r) => switch (r) {
    Ok(value: final v) => v.hashCode,
    Fail(error: final e) => e.hashCode,
  };
}

class Ok<T> extends Result<T> {
  const Ok(this.value) : super._();
  @override
  final T value;

  @override
  String toString() => 'Ok($value)';
}

class Fail<T> extends Result<T> {
  const Fail(this.error) : super._();
  @override
  final AppException error;

  @override
  String toString() => 'Fail(${error.code})';
}

/// AsyncResult нь Result-ийг Future-ээр боох туслах.
class AsyncResult<T> {
  const AsyncResult._();

  static Future<Result<T>> ok<T>(Future<T> future) async {
    try {
      return Result.ok(await future);
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'ASYNC_OK_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  static Future<Result<T>> fail<T>(Future<AppException> errorFuture) async {
    try {
      return Result.fail(await errorFuture);
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'ASYNC_FAIL_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }
}
