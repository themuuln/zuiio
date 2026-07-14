import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/error/crash_reporter.dart';

/// CrashReporter-ийн тестүүд.
///
/// FirebaseCrashReporter-ийн initialize нь Firebase байхгүй үед ч
/// app crash-ддаггүй гэдгийг баталгаажуулна.
/// NoOpCrashReporter нь бүх дуудалтанд алдаа гаргахгүйг шалгана.
void main() {
  group('NoOpCrashReporter', () {
    late NoOpCrashReporter reporter;

    setUp(() {
      reporter = NoOpCrashReporter();
    });

    test('initialize does not throw', () async {
      await expectLater(reporter.initialize(), completes);
    });

    test('recordError does not throw', () {
      expect(
        () => reporter.recordError('test error', StackTrace.current),
        returnsNormally,
      );
    });

    test('log does not throw', () {
      expect(() => reporter.log('test message'), returnsNormally);
    });
  });

  group('FirebaseCrashReporter', () {
    late FirebaseCrashReporter reporter;

    setUp(() {
      reporter = FirebaseCrashReporter();
    });

    test(
      'initialize does not crash when Firebase is not initialized',
      () async {
        // Firebase эхлээгүй байхад Crashlytics эхлэхгүй ч
        // app crash-дахгүй, зөвхөн debugPrint хэвлээд зогсоно.
        await expectLater(reporter.initialize(), completes);
      },
    );

    test('recordError does not crash when not initialized', () {
      // Initialize хийгээгүй байхад recordError дуудахад алдаа гаргахгүй.
      expect(
        () => reporter.recordError('test', StackTrace.current),
        returnsNormally,
      );
    });

    test('log does not crash when not initialized', () {
      expect(() => reporter.log('test'), returnsNormally);
    });

    test('initialize is idempotent', () async {
      // initialize-ийг олон удаа дуудахад асуудалгүй ажиллана.
      await expectLater(reporter.initialize(), completes);
      await expectLater(reporter.initialize(), completes);
      await expectLater(reporter.initialize(), completes);
    });

    test('all methods are safe when not initialized', () async {
      // Initialize хийгээгүй ч бүх метод дуудагдахад алдаа гаргахгүй.
      reporter.log('before init');
      reporter.recordError('before init error', StackTrace.current);

      await reporter.initialize();

      reporter.log('after init');
      reporter.recordError('after init error', StackTrace.current);
    });
  });
}
