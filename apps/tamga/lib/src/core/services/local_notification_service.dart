import 'dart:async';

import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter/foundation.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest_all.dart' as tz;

import '../error/app_exception.dart';
import '../error/result.dart';
import 'notification_types.dart';

/// Тухайн төхөөрөмж дээрх local notification үйлчилгээ.
///
/// - Сануулга цаг товлох (вакцин, тахлалт)
/// - Цуцлах
/// - Notification товшсон үед handler
///
/// Firebase-ийн бүртгэлгүй үед ч ажиллана — зөвхөн local.
class LocalNotificationService {
  LocalNotificationService._();

  static final LocalNotificationService instance = LocalNotificationService._();

  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();

  bool _initialized = false;
  bool get isInitialized => _initialized;

  /// Notification товшсон үед дуудагдах callback.
  /// Параметр: NotificationPayload (parse хийсэн).
  void Function(NotificationPayload)? _onNotificationTap;

  // ── Initialization ────────────────────────────────────────────

  /// Local notification service-ийг эхлүүлэх.
  Future<Result<void>> initialize({
    void Function(NotificationPayload)? onNotificationTap,
  }) async {
    if (_initialized) return const Result.ok(null);

    try {
      // Timezone тохиргоо — scheduled notification-д хэрэгтэй.
      tz.initializeTimeZones();

      // Android тохиргоо.
      const androidSettings = AndroidInitializationSettings(
        '@mipmap/ic_launcher',
      );

      // iOS тохиргоо.
      const iosSettings = DarwinInitializationSettings(
        requestAlertPermission: false,
        requestBadgePermission: false,
        requestSoundPermission: false,
      );

      const initSettings = InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      );

      await _plugin.initialize(
        settings: initSettings,
        onDidReceiveNotificationResponse: _handleNotificationResponse,
      );

      _onNotificationTap = onNotificationTap;
      _initialized = true;

      debugPrint('[LocalNotificationService] Initialized');
      return const Result.ok(null);
    } catch (e) {
      debugPrint('[LocalNotificationService] Init failed: $e');
      return Result.fail(
        AppException(
          message: 'Локал мэдэгдэл эхлүүлэхэд алдаа гарлаа',
          code: 'LOCAL_NOTIFICATION_INIT_ERROR',
          details: {'error': e.toString()},
        ),
      );
    }
  }

  // ── Permission ────────────────────────────────────────────────

  /// iOS-д notification permission хүсэх.
  Future<bool> requestIOSPermission() async {
    try {
      final result = await _plugin
          .resolvePlatformSpecificImplementation<
            IOSFlutterLocalNotificationsPlugin
          >()
          ?.requestPermissions(alert: true, badge: true, sound: true);
      return result ?? false;
    } catch (e) {
      debugPrint('[LocalNotificationService] iOS permission failed: $e');
      return false;
    }
  }

  // ── Immediate Notification ───────────────────────────────────

  /// Шууд notification илгээх (ямар нэг сануулга өгөхөд).
  Future<Result<void>> showNotification({
    required String title,
    required String body,
    required NotificationType type,
    String? referenceId,
    String? referenceType,
  }) async {
    if (!_initialized) {
      return const Result.fail(
        AppException(
          message: 'Локал мэдэгдэл эхлүүлээгүй байна',
          code: 'LOCAL_NOTIFICATION_NOT_INITIALIZED',
        ),
      );
    }

    try {
      final payload = NotificationPayload(
        type: type,
        source: NotificationSource.local,
        referenceId: referenceId,
        referenceType: referenceType,
        title: title,
        body: body,
      );

      await _plugin.show(
        id: DateTime.now().millisecondsSinceEpoch ~/ 1000, // unique id
        title: title,
        body: body,
        notificationDetails: _notificationDetails(type),
        payload: payload.toPayloadString(),
      );

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException(
          message: 'Мэдэгдэл илгээхэд алдаа гарлаа',
          code: 'LOCAL_NOTIFICATION_SHOW_ERROR',
          details: {'error': e.toString()},
        ),
      );
    }
  }

  // ── Scheduled Notification ───────────────────────────────────

  /// Ирээдүйн цагт сануулга товлох (жишээ: вакцины өдөр, тахлалтын өдөр).
  ///
  /// [scheduledDate] — хэзээ харуулах вэ.
  /// [id] — цуцлахдаа ашиглах давтагдашгүй ID.
  Future<Result<void>> scheduleNotification({
    required int id,
    required String title,
    required String body,
    required DateTime scheduledDate,
    required NotificationType type,
    String? referenceId,
    String? referenceType,
  }) async {
    if (!_initialized) {
      return const Result.fail(
        AppException(
          message: 'Локал мэдэгдэл эхлүүлээгүй байна',
          code: 'LOCAL_NOTIFICATION_NOT_INITIALIZED',
        ),
      );
    }

    try {
      final payload = NotificationPayload(
        type: type,
        source: NotificationSource.local,
        referenceId: referenceId,
        referenceType: referenceType,
        title: title,
        body: body,
      );

      final tzScheduledDate = tz.TZDateTime.from(scheduledDate, tz.local);

      // Хугацаа өнгөрсөн бол шууд харуулах.
      if (tzScheduledDate.isBefore(tz.TZDateTime.now(tz.local))) {
        return showNotification(
          title: title,
          body: body,
          type: type,
          referenceId: referenceId,
          referenceType: referenceType,
        );
      }

      await _plugin.zonedSchedule(
        id: id,
        title: title,
        body: body,
        scheduledDate: tzScheduledDate,
        notificationDetails: _notificationDetails(type),
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
        payload: payload.toPayloadString(),
      );

      debugPrint(
        '[LocalNotificationService] Scheduled: $id at '
        '${scheduledDate.toIso8601String()}',
      );

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException(
          message: 'Сануулга товлоход алдаа гарлаа',
          code: 'LOCAL_NOTIFICATION_SCHEDULE_ERROR',
          details: {'error': e.toString()},
        ),
      );
    }
  }

  // ── Cancel ───────────────────────────────────────────────────

  /// Нэг notification-ийг цуцлах.
  Future<Result<void>> cancelNotification(int id) async {
    if (!_initialized) return const Result.ok(null);

    try {
      await _plugin.cancel(id: id);
      debugPrint('[LocalNotificationService] Cancelled notification: $id');
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException(
          message: 'Мэдэгдэл цуцлахад алдаа гарлаа',
          code: 'LOCAL_NOTIFICATION_CANCEL_ERROR',
          details: {'error': e.toString()},
        ),
      );
    }
  }

  /// Тодорхой төрлийн бүх notification-ийг цуцлах.
  Future<Result<void>> cancelAllByType(NotificationType type) async {
    if (!_initialized) return const Result.ok(null);

    try {
      final pending = await _plugin.pendingNotificationRequests();
      for (final request in pending) {
        if (request.payload != null) {
          final payload = NotificationPayload.fromPayloadString(
            request.payload!,
          );
          if (payload.type == type) {
            await _plugin.cancel(id: request.id);
          }
        }
      }
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException(
          message: 'Мэдэгдлүүд цуцлахад алдаа гарлаа',
          code: 'LOCAL_NOTIFICATION_CANCEL_ALL_ERROR',
          details: {'error': e.toString()},
        ),
      );
    }
  }

  /// Бүх notification-ийг цуцлах.
  Future<Result<void>> cancelAll() async {
    if (!_initialized) return const Result.ok(null);

    try {
      await _plugin.cancelAll();
      debugPrint('[LocalNotificationService] Cancelled all notifications');
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException(
          message: 'Бүх мэдэгдэл цуцлахад алдаа гарлаа',
          code: 'LOCAL_NOTIFICATION_CANCEL_ALL_ERROR',
          details: {'error': e.toString()},
        ),
      );
    }
  }

  // ── Query ────────────────────────────────────────────────────

  /// Товшсон notification-уудыг авах.
  Future<Result<List<PendingNotificationRequest>>>
  getPendingNotifications() async {
    if (!_initialized) return const Result.ok([]);

    try {
      final pending = await _plugin.pendingNotificationRequests();
      return Result.ok(pending);
    } catch (e) {
      return Result.fail(
        AppException(
          message: 'Хүлээгдэж буй мэдэгдлүүдийг авахад алдаа гарлаа',
          code: 'LOCAL_NOTIFICATION_PENDING_ERROR',
          details: {'error': e.toString()},
        ),
      );
    }
  }

  // ── Notification Details ─────────────────────────────────────

  /// Төрөл бүрийн notification-ийн детайсыг буцаана.
  NotificationDetails _notificationDetails(NotificationType type) {
    final androidDetails = AndroidNotificationDetails(
      type.channelId,
      type.channelName,
      channelDescription: type.channelDescription,
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    return NotificationDetails(android: androidDetails, iOS: iosDetails);
  }

  // ── Handler ──────────────────────────────────────────────────

  /// Notification response handler — товшсон үед callback дуудна.
  void _handleNotificationResponse(NotificationResponse response) {
    if (response.payload == null) return;

    try {
      final payload = NotificationPayload.fromPayloadString(response.payload!);
      debugPrint(
        '[LocalNotificationService] Notification tapped: '
        '${payload.type.key}',
      );
      _onNotificationTap?.call(payload);
    } catch (e) {
      debugPrint('[LocalNotificationService] Payload parse error: $e');
    }
  }
}
