import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/services/local_notification_service.dart';
import '../../../core/services/notification_trigger_service.dart';
import '../../../core/services/notification_types.dart';
import '../domain/geofence_alert.dart';
import '../domain/map_enums.dart';

/// Геоференцийн мэдэгдлийн handler.
///
/// GeofenceMonitor-оос ирсэн мэдэгдлүүдийг хүлээж авч,
/// тохирох notification илгээх.
///
/// Priority:
/// - Lost horse alerts → urgent (хаяж морь)
/// - Custom geofence alerts → medium (хэрэглэгчийн бүс)
class GeofenceNotificationHandler {
  GeofenceNotificationHandler({
    required LocalNotificationService localNotification,
    required NotificationTriggerService triggerService,
  }) : _localNotification = localNotification,
       _triggerService = triggerService;

  final LocalNotificationService _localNotification;
  final NotificationTriggerService _triggerService;

  /// Geofence alert ирсэн үед дуудах — notification илгээх.
  ///
  /// [alert] — GeofenceMonitor-оос үүссэн мэдэгдэл.
  Future<void> onGeofenceAlert(GeofenceAlert alert) async {
    debugPrint(
      '[GeofenceNotificationHandler] Alert received: '
      '${alert.alertType.name} at ${alert.geofenceName}',
    );

    // Төвлөрсөн trigger service-рүү дамжуулах.
    await _triggerService.sendGeofenceAlert(alert);

    // Priority тооцуулга:
    // Lost horse alerts нь urgent priorityтай байх ёстой.
    // Энэ нь notification channel-ийн importance-аар тохируулна.
  }

  /// Хаяж морийн мэдэгдэл илгээх — urgent priority.
  ///
  /// Хаяж морь ойрхон байгаа бол хэрэглэгчид яаралтай мэдэгдэх.
  Future<void> sendLostHorseAlert({
    required String horseName,
    required double distanceKm,
    required double lat,
    required double lng,
  }) async {
    final title = 'Хаяж морь ойрхон байна';
    final body = horseName.isNotEmpty
        ? '"$horseName" морь танаас ${distanceKm.toStringAsFixed(1)} км-т байна.'
        : 'Хаяж морь танаас ${distanceKm.toStringAsFixed(1)} км-т байна.';

    await _localNotification.showNotification(
      title: title,
      body: body,
      type: NotificationType.geofenceAlert,
      referenceType: 'lost_horse',
    );

    debugPrint(
      '[GeofenceNotificationHandler] Lost horse alert sent: '
      '$horseName at ${distanceKm.toStringAsFixed(1)}km',
    );
  }

  /// Хэрэглэгчийн хайх бүсийн мэдэгдэл — medium priority.
  ///
  /// Хэрэглэгч өөрийн бүсээс гарсан/орсон.
  Future<void> sendSearchAreaAlert({
    required String areaName,
    required GeofenceAlertType alertType,
  }) async {
    final isEntering = alertType == GeofenceAlertType.entered;
    final title = isEntering ? 'Хайх бүсэнд орлоо' : 'Хайх бүсээс гарлао';
    final body = '"$areaName" бүсэд ${isEntering ? 'орлоо' : 'гарлао'}.';

    await _localNotification.showNotification(
      title: title,
      body: body,
      type: NotificationType.geofenceAlert,
      referenceType: 'search_area',
    );

    debugPrint(
      '[GeofenceNotificationHandler] Search area alert sent: '
      '$areaName ${alertType.name}',
    );
  }
}

// ── Riverpod Providers ──────────────────────────────────────────

/// GeofenceNotificationHandler provider.
/// GeofenceNotificationHandler provider.
///
/// Тухайн handler нь geofence alert-уудыг хүлээж авч notification илгээнэ.
final geofenceNotificationHandlerProvider =
    FutureProvider<GeofenceNotificationHandler>((ref) async {
      final triggerService = await ref.watch(
        notificationTriggerServiceProvider.future,
      );
      return GeofenceNotificationHandler(
        localNotification: LocalNotificationService.instance,
        triggerService: triggerService,
      );
    });
