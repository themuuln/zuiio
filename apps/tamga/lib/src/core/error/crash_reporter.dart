import 'package:flutter/foundation.dart';

// ignore: depend_on_referenced_packages
import 'package:firebase_crashlytics/firebase_crashlytics.dart';

/// Хэрэглэгчийн төхөөрөмж дээр гарсан алдааг мэдээлэх интерфейс.
///
/// Crash reporting service (Firebase Crashlytics, Sentry гэх мэт) -ийг
/// хийсвэрлэж, тест болон өөр impl-ээр солих боломжтой.
///
/// ```dart
/// final reporter = FirebaseCrashReporter();
/// await reporter.initialize();
/// reporter.recordError(error, stackTrace);
/// ```
abstract class CrashReporter {
  /// Crash reporting service-ийг эхлүүлнэ.
  ///
  /// Алдаа гарвал зөвхөн [debugPrint] хэвлээд үргэлжлүүлнэ (app crash-ддаггүй).
  Future<void> initialize();

  /// Алдаа болон stack trace-ийг мэдээлнэ.
  void recordError(Object error, StackTrace stackTrace);

  /// Breadcrumb / log message мэдээлэх.
  void log(String message);
}

/// Firebase Crashlytics дээр суурилсан [CrashReporter] хэрэгжилт.
///
/// Firebase аль хэдийн эхэлсэн байх ёстой ([Firebase.initializeApp] дуудагдсан).
class FirebaseCrashReporter implements CrashReporter {
  bool _initialized = false;

  @override
  Future<void> initialize() async {
    if (_initialized) return;
    try {
      // FirebaseCrashlytics нь Firebase.initializeApp() дуудагдсаны дараа
      // автоматаар эхэлдэг. Энд зөвхөн sentry гэх мэт нэмэлт тохиргоо хийх,
      // эсвэл Crashlytics-ийн бэлэн байдлыг шалгах.
      //
      // Check if Crashlytics is available by accessing the instance.
      // This can throw if Firebase wasn't initialized yet.
      await FirebaseCrashlytics.instance.setCrashlyticsCollectionEnabled(true);
      _initialized = true;
      debugPrint('[CrashReporter] Firebase Crashlytics initialized');
    } catch (e, stack) {
      // Crashlytics эхлэхгүй бол app crash-дах ёсгүй.
      debugPrint('[CrashReporter] Failed to initialize Crashlytics: $e');
      if (kDebugMode) {
        debugPrint('  Stack: $stack');
      }
    }
  }

  @override
  void recordError(Object error, StackTrace stackTrace) {
    if (!_initialized) {
      debugPrint('[CrashReporter] Crashlytics not initialized, skipping error');
      return;
    }
    try {
      FirebaseCrashlytics.instance.recordError(error, stackTrace, fatal: true);
    } catch (e) {
      debugPrint('[CrashReporter] Failed to record error: $e');
    }
  }

  @override
  void log(String message) {
    if (!_initialized) return;
    try {
      FirebaseCrashlytics.instance.log(message);
    } catch (e) {
      debugPrint('[CrashReporter] Failed to log: $e');
    }
  }
}

/// Тест болон crash reporting шаардлагагүй үед ашиглах хоосон [CrashReporter].
///
/// Бүх дуудалт зөвхөн [debugPrint] хэвлээд буцаад өнгөрнө.
class NoOpCrashReporter implements CrashReporter {
  @override
  Future<void> initialize() async {
    debugPrint('[CrashReporter] NoOpCrashReporter initialized (no-op)');
  }

  @override
  void recordError(Object error, StackTrace stackTrace) {
    debugPrint('[CrashReporter] NoOp: error=$error');
  }

  @override
  void log(String message) {
    debugPrint('[CrashReporter] NoOp: log=$message');
  }
}
