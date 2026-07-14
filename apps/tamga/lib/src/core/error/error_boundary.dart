import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../widgets/tamga_error_widget.dart';
import 'crash_reporter.dart';

/// Глобал error boundary тохируулах функц.
///
/// Дараах тохиргоог хийж гүйцэтгэнэ:
/// 1. [CrashReporter]-ийг эхлүүлэх (амжилтгүй бол app crash-ддаггүй)
/// 2. [FlutterError.onError] тохируулах — framework алдааг crash reporting руу илгээнэ
/// 3. [ErrorWidget.builder] тохируулах — хэрэглэгчдэд ээлтэй widget харуулна
///
/// [reporter] — ашиглах crash reporting service (тестэд [NoOpCrashReporter]).
/// [onRetry] — ErrorWidget дээрх retry товч дархад дуудагдах callback.
///
/// ```dart
/// final reporter = FirebaseCrashReporter();
/// await configureErrorHandling(reporter: reporter);
/// ```
Future<void> configureErrorHandling({
  required CrashReporter reporter,
  VoidCallback? onRetry,
}) async {
  // ── 1. Crash reporter-ийг эхлүүлэх ──
  // Амжилтгүй бол зөвхөн debugPrint хэвлээд app crash-ддаггүй.
  try {
    await reporter.initialize();
  } catch (e, stack) {
    debugPrint('[ErrorBoundary] Crash reporter init failed: $e');
    if (kDebugMode) {
      debugPrint('  Stack: $stack');
    }
  }

  // ── 2. FlutterError.onError — framework-ийн алдааг crash reporting руу ──
  FlutterError.onError = (FlutterErrorDetails details) {
    // Алдааг crash reporting service руу илгээнэ (stack null бол default ашиглах)
    reporter.recordError(
      details.exception,
      details.stack ?? StackTrace.current,
    );

    // Debug mode-д console дээр харуулах
    FlutterError.dumpErrorToConsole(details);
  };

  // ── 3. ErrorWidget.builder — хэрэглэгчдэд ээлтэй widget ──
  ErrorWidget.builder = (FlutterErrorDetails details) {
    // Алдааг crash reporting руу илгээнэ (stack null бол default ашиглах)
    reporter.recordError(
      details.exception,
      details.stack ?? StackTrace.current,
    );

    // Хэрэглэгчдэд ээлтэй widget — stack trace харуулахгүй
    return TamgaErrorWidget(
      message: null, // default bilingual message
      onRetry: onRetry,
    );
  };
}
