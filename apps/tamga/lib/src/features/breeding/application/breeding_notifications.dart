import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/services/local_notification_service.dart';
import '../../../core/services/notification_types.dart';
import '../data/breeding_repository.dart';
import '../data/gestation_calculator.dart';
import '../domain/breeding_record.dart';
import 'breeding_providers.dart';

/// Төллөлтийн огнооны notification handler.
///
/// Хээлтсэн эх морь төллөх хугацаа ойртсон үед
/// сануулга notification илгээх.
///
/// Гурван түвшний сануулга:
/// - 30 хоногийн өмнө: анхааралтай ажиглана уу
/// - 14 хоногийн өмнө: эмчтэй зөвлөнө үү
/// - 7 хоногийн өмнө: бэлтгэлээ шалгана уу
class BreedingNotifications {
  BreedingNotifications({
    required LocalNotificationService localNotification,
    required BreedingRepository breedingRepository,
  }) : _localNotification = localNotification,
       _breedingRepository = breedingRepository;

  final LocalNotificationService _localNotification;
  final BreedingRepository _breedingRepository;

  /// Бүх идэвхтэй төллөлтийн бүртгэлийг шалгаж, notification илгээх.
  ///
  /// Returns the number of notifications sent.
  Future<int> checkAllBreedingRecords() async {
    int notificationsSent = 0;

    final result = await _breedingRepository.fetchBreedingRecords();
    final records = result.getOrThrow();

    for (final record in records) {
      // Зөвхөн идэвхтэй (хээлтсэн) бүртгэлийг шалгах.
      if (record.status != 'Хээлтсэн') continue;

      final sent = await _checkRecord(record);
      notificationsSent += sent;
    }

    debugPrint(
      '[BreedingNotifications] Total breeding notifications sent: '
      '$notificationsSent',
    );
    return notificationsSent;
  }

  /// Нэг төллөлтийн бүртгэлийг шалгах.
  Future<int> _checkRecord(BreedingRecord record) async {
    int sent = 0;

    // GestationCalculator-ийн activeReminders ашиглах.
    final reminders = GestationCalculator.activeReminders(
      record.expectedFoalingDate,
    );

    for (final reminder in reminders) {
      if (!reminder.shouldNotify) continue;

      final title = 'Төллөх хугацаа оиртлоо';
      final body = _buildBody(record, reminder);

      await _localNotification.showNotification(
        title: title,
        body: body,
        type: NotificationType.breedingDue,
        referenceId: record.id,
        referenceType: 'breeding_record',
      );

      debugPrint(
        '[BreedingNotifications] Breeding reminder sent: '
        '${record.damName} — ${reminder.daysBeforeDue} days '
        '(${reminder.urgency.name})',
      );
      sent++;
    }

    // Хугацаа хэтрэсэн бол нэмэлт мэдэгдэл.
    if (record.isOverdue && record.status == 'Хээлтсэн') {
      await _sendOverdueAlert(record);
      sent++;
    }

    return sent;
  }

  /// Хугацаа хэтэрсэн төллөлтийн мэдэгдэл.
  Future<void> _sendOverdueAlert(BreedingRecord record) async {
    final daysOverdue = DateTime.now()
        .difference(record.expectedFoalingDate)
        .inDays;

    final title = 'Төллөх хугацаа хэтэрсэн!';
    final body =
        '${record.damName} эх морь $daysOverdue хоног хэтэрсэн. '
        'Эмчид яаралтай хандана уу!';

    await _localNotification.showNotification(
      title: title,
      body: body,
      type: NotificationType.breedingDue,
      referenceId: record.id,
      referenceType: 'breeding_record',
    );

    debugPrint(
      '[BreedingNotifications] Overdue alert sent: ${record.damName} '
      '($daysOverdue days overdue)',
    );
  }

  /// Notification-ийн body үүсгэх.
  String _buildBody(BreedingRecord record, GestationReminder reminder) {
    final damName = record.damName.isNotEmpty ? record.damName : 'Эх морь';

    if (reminder.daysBeforeDue <= 7) {
      return '$damName төллөхөд ${reminder.daysBeforeDue} хоног үлдлээ. '
          'Бэлтгэлээ шалгана уу.';
    }
    if (reminder.daysBeforeDue <= 14) {
      return '$damName төллөхөд ${reminder.daysBeforeDue} хоног үлдлээ. '
          'Эмчтэй зөвлөнө үү.';
    }
    return '$damName төллөхөд ${reminder.daysBeforeDue} хоног үлдлээ. '
        'Анхааралтай ажиглана уу.';
  }

  /// Эх морь тодорхойлох үед (хээлтсэн) дуудах — шинэ сануулга тооцоолох.
  Future<void> onBreedingRecordUpdated(String recordId) async {
    debugPrint('[BreedingNotifications] Breeding record updated: $recordId');
    // Бүх бүртгэлийг дахин шалгах — нэг бүртгэл шинэчлэгдсэн бол
    // бусад ч гэсэн шалгах шаардлагатай болно.
    await checkAllBreedingRecords();
  }
}

// ── Riverpod Providers ──────────────────────────────────────────

/// BreedingNotifications provider.
final breedingNotificationsProvider = FutureProvider<BreedingNotifications>((
  ref,
) async {
  return BreedingNotifications(
    localNotification: LocalNotificationService.instance,
    breedingRepository: await ref.watch(breedingRepositoryProvider.future),
  );
});
