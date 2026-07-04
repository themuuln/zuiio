import 'dart:convert';

import 'package:http/http.dart' as http;
import '../../app/app_config.dart';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../app/supabase_bootstrap.dart';
import '../../features/breeding/application/breeding_providers.dart';
import '../../features/breeding/data/breeding_repository.dart';
import '../../features/breeding/data/gestation_calculator.dart';
import '../../features/health/application/health_providers.dart';
import '../../features/health/data/health_repository.dart';
import '../../features/map/domain/geofence_alert.dart';
import '../../features/map/domain/map_enums.dart';
import '../../features/market/application/market_providers.dart';
import '../../features/market/data/market_repository.dart';
import '../../features/market/domain/market_safety.dart';
import '../domain/notification_preferences.dart';
import 'local_notification_service.dart';
import 'notification_service.dart';
import 'notification_types.dart';

/// Төвлөрсөн notification trigger үйлчилгээ.
///
/// Бүх мэдэгдлийн эх сурвалжийг шалгаж, тохирох notification илгээх:
/// - Эрүүл мэндийн сануулга (вакцин, тахлалт, эмчийн үзлэг)
/// - Геоференцийн мэдэгдэл (хаяж морь, хайх бүс)
/// - Төллөлтийн огноо
/// - Зах зээлийн шинэчлэл (зар сонирхсон хүн)
///
/// Нэгэн зэрэг local notification ба FCM push хоёул илгээнэ.
class NotificationTriggerService {
  NotificationTriggerService({
    required LocalNotificationService localNotification,
    required HealthRepository healthRepository,
    required BreedingRepository breedingRepository,
    required MarketRepository marketRepository,
    NotificationService? pushNotification,
    SupabaseClient? client,
  }) : _localNotification = localNotification,
       _healthRepository = healthRepository,
       _breedingRepository = breedingRepository,
       _marketRepository = marketRepository,
       _pushNotification = pushNotification,
       _client = client ?? getConfiguredSupabaseClient();

  final LocalNotificationService _localNotification;
  final HealthRepository _healthRepository;
  final BreedingRepository _breedingRepository;
  final MarketRepository _marketRepository;
  final NotificationService? _pushNotification;
  final SupabaseClient? _client;

  // ── Health Reminders ─────────────────────────────────────────

  /// Эрүүл мэндийн сануулгуудыг шалгаж, хугацаа ойртсон бол notification илгээх.
  ///
  /// [horseIds] — шалгах морины жагсаалт. Хоосон бол бүх морийг шалгана.
  Future<int> checkHealthReminders({List<String>? horseIds}) async {
    final prefs = await _getPreferences();
    if (!prefs.isTypeEnabled(NotificationPreferenceType.health)) return 0;

    final userId = currentSupabaseUserId();
    if (userId == null) return 0;

    int notificationsSent = 0;

    // Хэрэв horseIds өгөөгүй бол эмнэлгийн бүртгэлтэй бүх морийг олох.
    final targetHorseIds =
        horseIds ?? await _fetchHorseIdsWithHealthLogs(userId);

    for (final horseId in targetHorseIds) {
      final result = await _healthRepository.fetchAllByHorse(horseId);
      if (result.isFailure) continue;

      final logs = result.value;
      final reminders = _calculateHealthReminders(logs);

      for (final reminder in reminders) {
        if (_shouldNotifyForReminder(reminder)) {
          await _sendNotification(
            title: reminder.title,
            body: reminder.body,
            type: NotificationType.healthReminder,
            referenceId: horseId,
            referenceType: 'horse',
          );
          notificationsSent++;
        }
      }
    }

    debugPrint(
      '[NotificationTriggerService] Health reminders sent: $notificationsSent',
    );
    return notificationsSent;
  }

  /// Эрүүл мэндийн бүртгэлээс сануулгуудыг тооцоолох.
  List<_HealthReminder> _calculateHealthReminders(List<dynamic> logs) {
    final reminders = <_HealthReminder>[];
    final now = DateTime.now();

    // Төрөл бүрийн хамгийн сүүлийн өдрийг олох.
    final lastByType = <String, DateTime?>{};
    for (final log in logs) {
      if (log.date == null) continue;
      final key = log.logType.name;
      final existing = lastByType[key];
      if (existing == null || log.date!.isAfter(existing)) {
        lastByType[key] = log.date!;
      }
    }

    // Вакцины сануулга — сүүлчийн вакцинаас хойш 365 хоног.
    final lastVaccination = lastByType['vaccination'];
    if (lastVaccination != null) {
      final nextDue = lastVaccination.add(const Duration(days: 365));
      final daysUntil = nextDue.difference(now).inDays;
      if (daysUntil <= 7 && daysUntil >= -30) {
        reminders.add(
          _HealthReminder(
            type: 'vaccination',
            title: 'Вакцин хийх хугацаа ойртлоо',
            body: daysUntil <= 0
                ? 'Вакцины хугацаа дууссан! Даруй хийлгэнэ үү.'
                : 'Вакцин хийх хугацаа $daysUntil хоногийн дараа.',
            nextDue: nextDue,
          ),
        );
      }
    }

    // Туулгалтын сануулга — сүүлчийн туулгалтаас хойш 90 хоног.
    final lastDeworming = lastByType['deworming'];
    if (lastDeworming != null) {
      final nextDue = lastDeworming.add(const Duration(days: 90));
      final daysUntil = nextDue.difference(now).inDays;
      if (daysUntil <= 7 && daysUntil >= -30) {
        reminders.add(
          _HealthReminder(
            type: 'deworming',
            title: 'Туулгалт хийх хугацаа ойртлоо',
            body: daysUntil <= 0
                ? 'Туулгалтын хугацаа дууссан! Хийлгэнэ үү.'
                : 'Туулгалт хийх хугацаа $daysUntil хоногийн дараа.',
            nextDue: nextDue,
          ),
        );
      }
    }

    return reminders;
  }

  /// Энэ сануулгыг илгээх ёстой эсэхийг шалгах ( давтагдахаас сэргийлэх ).
  bool _shouldNotifyForReminder(_HealthReminder reminder) {
    // Хугацаа 30 хоногоос хэтрээгүй бол илгээх.
    final daysUntil = reminder.nextDue.difference(DateTime.now()).inDays;
    return daysUntil <= 7 && daysUntil >= -30;
  }

  /// Эрүүл мэндийн бүртгэлтэй морины жагсаалтыг авах.
  Future<List<String>> _fetchHorseIdsWithHealthLogs(String userId) async {
    // Supabase-аас хэрэглэгчийн морины жагсаалтыг авах.
    try {
      final client = _client;
      if (client == null) return <String>[];

      final response = await client
          .from('horses')
          .select('id')
          .eq('owner_id', userId);

      return (response as List).map((e) => e['id'] as String).toList();
    } catch (e) {
      debugPrint('[NotificationTriggerService] Fetch horse IDs failed: $e');
      return <String>[];
    }
  }

  // ── Breeding Due Dates ──────────────────────────────────────

  /// Төллөлтийн огнооны сануулгуудыг шалгаж, notification илгээх.
  Future<int> checkBreedingDueDates() async {
    final prefs = await _getPreferences();
    if (!prefs.isTypeEnabled(NotificationPreferenceType.breeding)) return 0;

    int notificationsSent = 0;

    final result = await _breedingRepository.fetchBreedingRecords();
    final records = result.getOrThrow();

    for (final record in records) {
      // Зөвхөн идэвхтэй (хээлтсэн) бүртгэлийг шалгах.
      if (record.status != 'Хээлтсэн') continue;

      final reminders = GestationCalculator.activeReminders(
        record.expectedFoalingDate,
      );

      for (final reminder in reminders) {
        if (reminder.shouldNotify) {
          await _sendNotification(
            title: 'Төллөх хугацаа ойртлоо',
            body: reminder.message,
            type: NotificationType.breedingDue,
            referenceId: record.id,
            referenceType: 'breeding_record',
          );
          notificationsSent++;
        }
      }
    }

    debugPrint(
      '[NotificationTriggerService] Breeding notifications sent: $notificationsSent',
    );
    return notificationsSent;
  }

  // ── Marketplace Inquiries ────────────────────────────────────

  /// Шинэ зах зээлийн сонирхлыг шалгаж, notification илгээх.
  ///
  /// [lastCheckedAt] — өмнөх шалгалтын цаг. Үүнээс хойшхи шинэ сонирхлуудыг олно.
  Future<int> checkMarketplaceInquiries({DateTime? lastCheckedAt}) async {
    final prefs = await _getPreferences();
    if (!prefs.isTypeEnabled(NotificationPreferenceType.market)) return 0;

    final userId = currentSupabaseUserId();
    if (userId == null) return 0;

    int notificationsSent = 0;

    try {
      final client = _client;
      if (client == null) return 0;

      // Хэрэглэгчийн зарын жагсаалтыг авах.
      final listingsResult = await _marketRepository.fetchListingsBySeller(
        userId,
      );
      if (listingsResult.isFailure) return 0;

      final cutoff =
          lastCheckedAt ?? DateTime.now().subtract(const Duration(hours: 6));

      for (final listing in listingsResult.value) {
        final inquiriesResult = await _marketRepository.fetchInquiries(
          listing.id,
        );
        final inquiries = inquiriesResult.getOrThrow();

        // Шинэ сонирхлуудыг шүүх.
        final newInquiries = inquiries.where((inquiry) {
          return inquiry.createdAt.isAfter(cutoff) &&
              inquiry.status == MarketInquiryStatus.newInquiry;
        }).toList();

        for (final _ in newInquiries) {
          await _sendNotification(
            title: 'Танай зард сонирхсон хүн байна',
            body: '"${listing.title}" зард шинэ сонирхол ирлээ.',
            type: NotificationType.marketListingUpdate,
            referenceId: listing.id,
            referenceType: 'market_listing',
          );
          notificationsSent++;
        }
      }
    } catch (e) {
      debugPrint('[NotificationTriggerService] Marketplace check failed: $e');
    }

    debugPrint(
      '[NotificationTriggerService] Market notifications sent: $notificationsSent',
    );
    return notificationsSent;
  }

  // ── Geofence Alerts ──────────────────────────────────────────

  /// Геоференцийн мэдэгдлийг илгээх — GeofenceMonitor-оос дуудна.
  Future<void> sendGeofenceAlert(GeofenceAlert alert) async {
    final prefs = await _getPreferences();
    if (!prefs.isTypeEnabled(NotificationPreferenceType.geofence)) return;

    final title = alert.alertType == GeofenceAlertType.entered
        ? 'Хайх бүсэнд орлоо'
        : 'Хайх бүсээс гарлао';

    final body = alert.horseName.isNotEmpty
        ? '"${alert.horseName}" морь ${alert.geofenceName} бүсэд '
              '${alert.alertType == GeofenceAlertType.entered ? 'орлоо' : 'гарлао'}.'
        : '${alert.geofenceName} бүсэд '
              '${alert.alertType == GeofenceAlertType.entered ? 'орлоо' : 'гарлао'}.';

    await _sendNotification(
      title: title,
      body: body,
      type: NotificationType.geofenceAlert,
      referenceId: alert.geofenceId,
      referenceType: 'geofence',
    );
  }

  // ── Notification Sending ────────────────────────────────────

  /// Local notification ба FCM push хоёул илгээх.
  Future<void> _sendNotification({
    required String title,
    required String body,
    required NotificationType type,
    String? referenceId,
    String? referenceType,
  }) async {
    // Local notification илгээх.
    await _localNotification.showNotification(
      title: title,
      body: body,
      type: type,
      referenceId: referenceId,
      referenceType: referenceType,
    );

    // FCM push илгээх — Edge Function-ээр.
    if (_pushNotification != null && _pushNotification.isAvailable) {
      try {
        final supabaseUrl = AppConfig.supabaseUrl;
        if (supabaseUrl.isEmpty) return;

        final userId = currentSupabaseUserId();
        if (userId == null) return;

        final response = await http.post(
          Uri.parse('$supabaseUrl/functions/v1/payment-notification'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${AppConfig.supabasePublishableKey}',
          },
          body: jsonEncode({
            'user_id': userId,
            'title': title,
            'body': body,
            'type': type.key,
            'reference_id': referenceId,
          }),
        );

        if (response.statusCode != 200) {
          debugPrint(
            '[NotificationTriggerService] Edge Function error: ${response.statusCode}',
          );
        }
      } catch (e) {
        debugPrint('[NotificationTriggerService] FCM push failed: $e');
      }
    }
  }

  // ── Preferences ─────────────────────────────────────────────

  /// Хэрэглэгчийн мэдэгдлийн тохиргоог авах.
  Future<NotificationPreferences> _getPreferences() async {
    try {
      final client = _client;
      if (client == null) return NotificationPreferences.defaults;

      final userId = currentSupabaseUserId();
      if (userId == null) return NotificationPreferences.defaults;

      final response = await client
          .from('profiles')
          .select(
            'notifications_enabled, '
            'notify_health_reminders, '
            'notify_breeding_alerts, '
            'notify_market_updates, '
            'notify_subscription_expiry, '
            'notify_geofence_alerts, '
            'notify_payment_notifications',
          )
          .eq('id', userId)
          .maybeSingle();

      if (response == null) return NotificationPreferences.defaults;

      return NotificationPreferences(
        notificationsEnabled:
            response['notifications_enabled'] as bool? ?? true,
        healthRemindersEnabled:
            response['notify_health_reminders'] as bool? ?? true,
        breedingAlertsEnabled:
            response['notify_breeding_alerts'] as bool? ?? true,
        marketUpdatesEnabled:
            response['notify_market_updates'] as bool? ?? true,
        geofenceAlertsEnabled:
            response['notify_geofence_alerts'] as bool? ?? true,
        paymentNotificationsEnabled:
            response['notify_payment_notifications'] as bool? ?? true,
      );
    } catch (e) {
      debugPrint('[NotificationTriggerService] Preferences fetch failed: $e');
      return NotificationPreferences.defaults;
    }
  }
}

// ── Internal Types ──────────────────────────────────────────────

/// Эрүүл мэндийн сануулгын дотоод төлөөлөл.
class _HealthReminder {
  const _HealthReminder({
    required this.type,
    required this.title,
    required this.body,
    required this.nextDue,
  });

  final String type;
  final String title;
  final String body;
  final DateTime nextDue;
}

// ── Riverpod Providers ──────────────────────────────────────────

/// NotificationTriggerService provider.
///
/// Repository provider-уудыг хүлээж авч, төвлөрсөн trigger үйлчилгээ үүсгэнэ.
final notificationTriggerServiceProvider =
    FutureProvider<NotificationTriggerService>((ref) async {
      return NotificationTriggerService(
        localNotification: LocalNotificationService.instance,
        healthRepository: await ref.watch(healthRepositoryProvider.future),
        breedingRepository: await ref.watch(breedingRepositoryProvider.future),
        marketRepository: await ref.watch(marketRepositoryProvider.future),
        pushNotification: ref.watch(notificationServiceProvider),
      );
    });

/// NotificationService provider.
final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService();
});
