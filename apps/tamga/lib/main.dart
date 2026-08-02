import 'dart:async';
import 'dart:convert';
import 'dart:io' show Platform;

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:marionette_flutter/marionette_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'firebase_options.dart';
import 'src/app/app.dart';
import 'src/app/router/app_router.dart';
import 'src/app/supabase_bootstrap.dart';
import 'src/core/error/crash_reporter.dart';
import 'src/core/error/error_boundary.dart';
import 'src/core/features/feature_flags.dart';
import 'src/core/services/local_notification_service.dart';
import 'src/core/services/notification_service.dart';
import 'src/core/services/notification_types.dart';
import 'src/core/storage/isar_database.dart';
import 'src/features/updater/presentation/update_overlay.dart';

import 'src/core/sync/connection_status.dart';
import 'ui/shadcn/components/control/button/button.dart' as shadcn;

export 'src/app/app.dart';

/// Firebase-ийн background message handler.
/// Тусгай топ-LEVEL async function байх ёстой.
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Firebase ачаалсан байх ёстой (background isolate-д).
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
}

void main() {
  // Declared here so it's accessible from both the guarded zone and its error handler.
  FirebaseCrashReporter? crashReporter;

  // runZonedGuarded нь баригдаагүй async алдаануудыг барьж,
  // crash reporting service руу илгээнэ.
  runZonedGuarded(
    () async {
      // ── Widget binding — inside the same zone as runApp ──
      // MarionetteBinding enables AI-driven UI testing via MCP (debug mode only).
      // Must be the only binding in the process — skip in test runner.
      if (kDebugMode && !Platform.environment.containsKey('FLUTTER_TEST')) {
        final logCollector = PrintLogCollector();
        MarionetteBinding.ensureInitialized(
          MarionetteConfiguration(
            // Recognize shadcn custom Button as interactive.
            isInteractiveWidget: (type) => type == shadcn.Button,
            // Collect logs for get_logs.
            logCollector: logCollector,
            // Extract labels from custom shadcn buttons for text matching.
            extractText: (element) {
              final widget = element.widget;
              if (widget is shadcn.Button && widget.child is Text) {
                return (widget.child as Text).data;
              }
              return null;
            },
          ),
        );

        // Tee debugPrint into the log collector so get_logs captures console output.
        final defaultDebugPrint = debugPrint;
        debugPrint = (String? message, {int? wrapWidth}) {
          if (message != null) logCollector.addLog(message);
          defaultDebugPrint(message, wrapWidth: wrapWidth);
        };
      } else {
        WidgetsFlutterBinding.ensureInitialized();
      }
      // ── Image cache config ──
      PaintingBinding.instance.imageCache.maximumSize = 500;
      PaintingBinding.instance.imageCache.maximumSizeBytes = 100 * 1024 * 1024;

      // Firebase эхлүүлэх — GoogleService-Info.plist байхгүй бол алдаа гаргахгүй.
      try {
        await Firebase.initializeApp(
          options: DefaultFirebaseOptions.currentPlatform,
        );
      } catch (e) {
        debugPrint('[main] Firebase init skipped: $e');
      }

      // Firebase-ийн background message handler register.
      // Push notification feature flag унтраалттай бол алгасна.
      final prefs = await SharedPreferences.getInstance();
      final pushEnabled =
          prefs.getBool(FeatureFlag.pushNotifications.storageKey) ??
          FeatureFlag.pushNotifications.defaultValue;

      if (pushEnabled) {
        try {
          FirebaseMessaging.onBackgroundMessage(
            _firebaseMessagingBackgroundHandler,
          );
        } catch (_) {
          // Background handler register амжилтгүй бол алдаа гаргахгүй.
        }
      }

      await IsarDatabase.initialize();
      await initializeSupabaseIfConfigured();

      // Local notification service — Apple Dev account шаарддаггүй тул үргэлж эхлүүлнэ.
      await LocalNotificationService.instance.initialize(
        onNotificationTap: (payload) {
          debugPrint('[main] Notification tapped: ${payload.type.key}');
        },
      );

      // Push notification (FCM) services — зөвхөн feature flag идэвхтэй үед.
      if (pushEnabled) {
        final notificationService = NotificationService();
        await notificationService.initialize();
      }

      // ── Read onboarding state BEFORE runApp ──
      // This avoids any GoRouter redirects or navigation during the first frame.
      final raw = prefs.getString('onboarding.data');
      final isOnboardingCompleted = raw != null && raw.isNotEmpty
          ? (jsonDecode(raw) as Map?)?.containsKey('isCompleted') == true
                ? (jsonDecode(raw) as Map)['isCompleted'] as bool? ?? false
                : false
          : false;
      final initialRoute = isOnboardingCompleted ? '/home' : '/onboarding';

      // ── Global error boundary ──
      crashReporter = FirebaseCrashReporter();
      await configureErrorHandling(
        reporter: crashReporter!,
        onRetry: () {
          // Retry товч дархад app-ийг дахин ачаалах.
          runApp(
            ProviderScope(
              overrides: [initialRouteProvider.overrideWithValue(initialRoute)],
              child: const UpdateOverlay(child: TamgaApp()),
            ),
          );
        },
      );

      runApp(
        ProviderScope(
          overrides: [initialRouteProvider.overrideWithValue(initialRoute)],
          child: const UpdateOverlay(child: TamgaApp()),
        ),
      );

      // Connection monitor must start after runApp — platform callbacks
      // can request frames before the engine is ready otherwise.
      await ConnectionMonitor.instance.start();
    },
    (Object error, StackTrace stack) {
      // Баригдаагүй async алдаануудыг crash reporting руу илгээнэ.
      crashReporter?.recordError(error, stack);
      debugPrint('[main] Unhandled async error: $error');
    },
  );
}
