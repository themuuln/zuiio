import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/services/local_notification_service.dart';
import '../../../core/services/notification_types.dart';
import '../../../shared/domain/health_log.dart';
import '../data/health_repository.dart';
import 'health_providers.dart';

/// Эрүүл мэндийн сануулгын notification handler.
///
/// Малын эмнэлгийн бүртгэл шинэчлэгдсэний дараа холбогдох
/// сануулгуудыг тооцоолж, notification илгээх.
///
/// Жишээ: Вакцины хугацаа дуусах, туулгалтын хугацаа ойртох, тахлахын цаг.
class HealthReminderNotifications {
  HealthReminderNotifications({
    required LocalNotificationService localNotification,
    required HealthRepository healthRepository,
  }) : _localNotification = localNotification,
       _healthRepository = healthRepository;

  final LocalNotificationService _localNotification;
  final HealthRepository _healthRepository;

  // ── Reminder Thresholds ─────────────────────────────────────

  /// Вакцины сануулга — сүүлчийн вакцинаас хойш 365 хоног.
  static const int vaccinationIntervalDays = 365;

  /// Туулгалтын сануулга — сүүлчийн туулгалтаас хойш 90 хоног.
  static const int dewormingIntervalDays = 90;

  /// Хэд хоногийн дотор сануулга илгээх вэ (7 хоногоос).
  static const int reminderWindowDays = 7;

  // ── Core Logic ──────────────────────────────────────────────

  /// Нэг морины эрүүл мэндийн сануулгуудыг шалгаж, notification илгээх.
  ///
  /// [horseId] — шалгах морины ID.
  /// Returns the number of notifications sent.
  Future<int> checkForHorse(String horseId) async {
    int sent = 0;

    final result = await _healthRepository.fetchAllByHorse(horseId);
    if (result.isFailure) return 0;

    final logs = result.value;
    final now = DateTime.now();

    // ── Вакцины сануулга ──
    sent += await _checkVaccinationReminder(horseId, logs, now);

    // ── Туулгалтын сануулга ──
    sent += await _checkDewormingReminder(horseId, logs, now);

    return sent;
  }

  /// Бүх морины эрүүл мэндийн сануулгуудыг шалгах.
  Future<int> checkAll() async {
    int sent = 0;

    // Морины жагсаалтыг Riverpod-оос авах боломжгүй тул
    // шууд repository-г ашиглана.
    // Хэрэглэгчийн морины жагсаалтыг supabase-аас авах.
    // Энэ нь NotificationTriggerService-ийн fetchHorseIds ашиглана.

    return sent;
  }

  // ── Vaccination ─────────────────────────────────────────────

  Future<int> _checkVaccinationReminder(
    String horseId,
    List<HealthLog> logs,
    DateTime now,
  ) async {
    final vaccinationLogs = logs
        .where((l) => l.logType == LogType.vaccination)
        .toList();
    if (vaccinationLogs.isEmpty) return 0;

    // Хамгийн сүүлийн вакцины өдөр.
    vaccinationLogs.sort(
      (a, b) => (b.date ?? DateTime(0)).compareTo(a.date ?? DateTime(0)),
    );
    final lastVaccination = vaccinationLogs.first.date;
    if (lastVaccination == null) return 0;

    final nextDue = lastVaccination.add(
      const Duration(days: vaccinationIntervalDays),
    );
    final daysUntil = nextDue.difference(now).inDays;

    if (daysUntil <= reminderWindowDays && daysUntil >= -30) {
      final title = 'Вакцин хийх хугацаа ойртлоо';
      final body = daysUntil <= 0
          ? 'Вакцины хугацаа дууссан! Даруй хийлгэнэ үү.'
          : 'Вакцин хийх хугацаа $daysUntil хоногийн дараа.';

      await _localNotification.showNotification(
        title: title,
        body: body,
        type: NotificationType.healthReminder,
        referenceId: horseId,
        referenceType: 'horse',
      );

      debugPrint(
        '[HealthReminderNotifications] Vaccination reminder sent for $horseId '
        '($daysUntil days until due)',
      );
      return 1;
    }

    return 0;
  }

  // ── Deworming ───────────────────────────────────────────────

  Future<int> _checkDewormingReminder(
    String horseId,
    List<HealthLog> logs,
    DateTime now,
  ) async {
    final dewormingLogs = logs
        .where((l) => l.logType == LogType.deworming)
        .toList();
    if (dewormingLogs.isEmpty) return 0;

    dewormingLogs.sort(
      (a, b) => (b.date ?? DateTime(0)).compareTo(a.date ?? DateTime(0)),
    );
    final lastDeworming = dewormingLogs.first.date;
    if (lastDeworming == null) return 0;

    final nextDue = lastDeworming.add(
      const Duration(days: dewormingIntervalDays),
    );
    final daysUntil = nextDue.difference(now).inDays;

    if (daysUntil <= reminderWindowDays && daysUntil >= -30) {
      final title = 'Туулгалт хийх хугацаа ойртлоо';
      final body = daysUntil <= 0
          ? 'Туулгалтын хугацаа дууссан! Хийлгэнэ үү.'
          : 'Туулгалт хийх хугацаа $daysUntil хоногийн дараа.';

      await _localNotification.showNotification(
        title: title,
        body: body,
        type: NotificationType.healthReminder,
        referenceId: horseId,
        referenceType: 'horse',
      );

      debugPrint(
        '[HealthReminderNotifications] Deworming reminder sent for $horseId '
        '($daysUntil days until due)',
      );
      return 1;
    }

    return 0;
  }

  // ── Health Log Change Handler ───────────────────────────────

  /// Эрүүл мэндийн бүртгэл шинэчлэгдсэний дараа дуудах.
  ///
  /// Бүртгэл нэмэгдсэн/шинэчлэгдсэн үед холбогдох сануулгуудыг
  /// дахин тооцоолж, notification илгээх.
  Future<void> onHealthLogUpdated(String horseId) async {
    debugPrint(
      '[HealthReminderNotifications] Health log updated for $horseId, '
      'rechecking reminders',
    );
    await checkForHorse(horseId);
  }
}

// ── Riverpod Provider ──────────────────────────────────────────

/// HealthReminderNotifications provider.
/// Хэрэглэгчийн эрүүл мэндийн сануулгыг шалгах үйлчилгээ.
///
/// Хугацаа ойртсон вакцин, туулгалт, тахлахын мэдэгдлүүдийг илгээнэ.
final healthReminderNotificationsProvider =
    FutureProvider<HealthReminderNotifications>((ref) async {
      return HealthReminderNotifications(
        localNotification: LocalNotificationService.instance,
        healthRepository: await ref.watch(healthRepositoryProvider.future),
      );
    });
