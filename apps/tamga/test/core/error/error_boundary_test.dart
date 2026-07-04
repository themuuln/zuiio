import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/core/error/crash_reporter.dart';
import 'package:tamga/src/core/error/error_boundary.dart';

/// Error boundary тохируулгын тестүүд.
///
/// Баталгаажуулах зүйлс:
/// - [configureErrorHandling] нь [FlutterError.onError]-ийг тохируулна
/// - [configureErrorHandling] нь [ErrorWidget.builder]-ийг тохируулна
/// - ErrorWidget.builder нь [TamgaErrorWidget]-ийг буцаана
/// - Crash reporter-ийн initialize амжилтгүй бол app crash-ддаггүй
void main() {
  group('configureErrorHandling (unit tests)', () {
    late CrashReporter reporter;

    setUp(() {
      reporter = NoOpCrashReporter();
    });

    test('sets FlutterError.onError', () async {
      await configureErrorHandling(reporter: reporter);

      // After configureErrorHandling, onError should be set
      expect(FlutterError.onError, isNotNull);
    });

    test('sets ErrorWidget.builder', () async {
      await configureErrorHandling(reporter: reporter);

      // configureErrorHandling-ийн дараа ErrorWidget.builder тохирсон байх ёстой
      expect(ErrorWidget.builder, isNotNull);
    });

    test('does not crash when reporter.initialize fails', () async {
      // initialize-д алдаа гаргадаг reporter
      final failingReporter = _FailingCrashReporter();

      // configureErrorHandling нь crash-дахгүй байх ёстой
      await expectLater(
        configureErrorHandling(reporter: failingReporter),
        completes,
      );

      // FlutterError.onError тохирсон байх ёстой (initialize алдаа гарсан ч)
      expect(FlutterError.onError, isNotNull);
    });

    test('FlutterError.onError calls reporter.recordError', () async {
      final trackingReporter = _TrackingCrashReporter();

      await configureErrorHandling(reporter: trackingReporter);

      // FlutterError.onError-ийг дуудахад reporter.recordError дуудагдах ёстой
      FlutterError.onError!(
        FlutterErrorDetails(
          exception: Exception('test framework error'),
          stack: StackTrace.current,
        ),
      );

      expect(trackingReporter.lastError, isNotNull);
      expect(
        trackingReporter.lastError.toString(),
        contains('test framework error'),
      );
    });
  });

  group('configureErrorHandling (widget tests)', () {
    /// Resets global error handlers so widget tests can run cleanly.
    /// These are set by configureErrorHandling and can interfere with
    /// Flutter's test error tracking.
    void resetGlobalHandlers() {
      FlutterError.onError = null;
      // ErrorWidget.builder is non-nullable — set to default behavior
      ErrorWidget.builder = (FlutterErrorDetails details) =>
          ErrorWidget(details.exception);
    }

    setUp(() {
      resetGlobalHandlers();
    });

    tearDown(() {
      resetGlobalHandlers();
    });

    testWidgets('ErrorWidget.builder returns TamgaErrorWidget', (
      WidgetTester tester,
    ) async {
      final reporter = NoOpCrashReporter();
      await configureErrorHandling(reporter: reporter);

      // ErrorWidget.builder-ийг дуудахад TamgaErrorWidget буцах ёстой
      final details = FlutterErrorDetails(
        exception: Exception('test error'),
        stack: StackTrace.current,
      );
      final builtWidget = ErrorWidget.builder(details);

      // Widget-ийг MaterialApp дотор харуулах (Tamga theme-тэй)
      await tester.pumpWidget(
        MaterialApp(theme: AppTheme.light(), home: builtWidget),
      );

      // TamgaErrorWidget-ийн default bilingual мессеж харагдах ёстой
      expect(find.textContaining('Алдаа гарлаа'), findsOneWidget);
      expect(find.textContaining('Something went wrong'), findsOneWidget);

      // Stack trace харагдахгүй байх ёстой
      expect(find.textContaining('Exception'), findsNothing);
    });

    testWidgets(
      'ErrorWidget.builder returns widget with retry button when onRetry provided',
      (WidgetTester tester) async {
        var retryCalled = false;
        final reporter = NoOpCrashReporter();
        await configureErrorHandling(
          reporter: reporter,
          onRetry: () => retryCalled = true,
        );

        final details = FlutterErrorDetails(
          exception: Exception('test'),
          stack: StackTrace.current,
        );
        final builtWidget = ErrorWidget.builder(details);

        await tester.pumpWidget(
          MaterialApp(theme: AppTheme.light(), home: builtWidget),
        );

        // Retry товч харагдах ёстой
        expect(find.text('Дахин оролдох / Retry'), findsOneWidget);

        // Retry товч дархад callback ажиллах ёстой
        await tester.tap(find.text('Дахин оролдох / Retry'));
        expect(retryCalled, isTrue);
      },
    );
  });
}

/// Тестэнд зориулсан crash reporter — initialize дээр алдаа гаргана.
class _FailingCrashReporter implements CrashReporter {
  @override
  Future<void> initialize() async {
    throw Exception('Simulated init failure');
  }

  @override
  void recordError(Object error, StackTrace stackTrace) {
    // no-op
  }

  @override
  void log(String message) {
    // no-op
  }
}

/// Тестэнд зориулсан crash reporter — сүүлийн алдааг хянадаг.
class _TrackingCrashReporter implements CrashReporter {
  Object? lastError;
  StackTrace? lastStackTrace;

  @override
  Future<void> initialize() async {
    // no-op
  }

  @override
  void recordError(Object error, StackTrace stackTrace) {
    lastError = error;
    lastStackTrace = stackTrace;
  }

  @override
  void log(String message) {
    // no-op
  }
}
