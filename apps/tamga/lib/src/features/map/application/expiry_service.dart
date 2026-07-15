import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../../core/services/local_notification_service.dart';
import '../../../core/services/notification_types.dart';
import '../data/map_repository.dart';
import '../domain/lost_horse_report.dart';
import '../domain/map_enums.dart';
import 'map_providers.dart';

// ── Constants ──────────────────────────────────────────────────────

/// Renewal prompt label shown 24h before expiry.
const String kRenewalPromptTitle = 'Сунгах уу?';

/// Renewal prompt body text.
const String kRenewalPromptBody =
    'Таны хаяж морийн зар дуусах гэж байна. Сунгах уу?';

/// Hours before expiry to trigger the renewal notification.
const int kRenewalNotificationHoursBefore = 24;

// ── Providers ──────────────────────────────────────────────────────

/// Provider for the expiry service.
final expiryServiceProvider = Provider<ExpiryService>((ref) {
  final repository = ref.watch(mapRepositoryProvider);
  return ExpiryService(repository: repository);
});

// ── ExpiryService ──────────────────────────────────────────────────

/// Manages auto-expiry and renewal for lost horse reports.
///
/// Handles:
/// - Checking and marking expired paid reports
/// - Scheduling local renewal notifications 24h before expiry
/// - Processing report renewal (extends expiry by tier duration)
class ExpiryService {
  ExpiryService({required MapRepository repository}) : _repository = repository;

  final MapRepository _repository;

  // ── Check & mark expired reports ──────────────────────────────────

  /// Check a single report and mark it as expired if its [expiresAt] has passed.
  ///
  /// Free reports never expire. Returns `true` if the report was marked
  /// as expired, `false` otherwise.
  Future<Result<bool>> checkAndExpire(LostHorseReport report) async {
    if (!_isExpired(report)) return const Result.ok(false);

    final result = await _repository.updateLostHorseFields(report.id, {
      'status': 'expired',
    });

    return result.map((_) => true);
  }

  /// Check all active paid reports and mark expired ones.
  ///
  /// Returns the count of reports that were marked as expired.
  Future<Result<int>> checkAndExpireAll() async {
    try {
      final reportsResult = await _repository.getActiveLostHorses();
      if (reportsResult.isFailure) {
        return Result.fail(reportsResult.error);
      }

      final reports = reportsResult.value;
      int expiredCount = 0;
      for (final report in reports) {
        if (_isExpired(report)) {
          final expireResult = await _repository.updateLostHorseFields(
            report.id,
            {'status': 'expired'},
          );
          if (expireResult.isSuccess) {
            expiredCount++;
          }
        }
      }
      return Result.ok(expiredCount);
    } catch (e) {
      return Result.fail(
        AppException(
          code: 'EXPIRY_CHECK_FAILED',
          message: 'Хугацаа дууссан зарыг шалгахад алдаа гарлаа: $e',
        ),
      );
    }
  }

  /// Whether the report has expired (paid tier with expiresAt in the past).
  bool _isExpired(LostHorseReport report) {
    if (report.status != LostHorseStatus.active) return false;
    if (!report.pricingTier.isPaid) return false;
    if (report.expiresAt == null) return false;
    return DateTime.now().isAfter(report.expiresAt!);
  }

  // ── Renewal notification scheduling ──────────────────────────────

  /// Schedule a local renewal notification for a report.
  ///
  /// The notification fires 24 hours before [report.expiresAt].
  /// Returns the notification ID (based on report creation timestamp)
  /// or `null` if scheduling is not applicable.
  Future<Result<int?>> scheduleRenewalNotification(
    LostHorseReport report,
  ) async {
    if (!report.pricingTier.isPaid || report.expiresAt == null) {
      return const Result.ok(null);
    }

    final fireAt = report.expiresAt!.subtract(
      const Duration(hours: kRenewalNotificationHoursBefore),
    );

    // Notification ID derived from report creation date for uniqueness.
    final notificationId = report.createdAt.millisecondsSinceEpoch ~/ 1000;

    final localService = LocalNotificationService.instance;

    final result = await localService.scheduleNotification(
      id: notificationId,
      title: kRenewalPromptTitle,
      body: kRenewalPromptBody,
      scheduledDate: fireAt,
      type: NotificationType.lostHorseRenewal,
      referenceId: report.id,
      referenceType: 'lost_horse_report',
    );

    return result.map((_) => notificationId);
  }

  /// Cancel any previously scheduled renewal notification for a report.
  Future<Result<void>> cancelRenewalNotification(LostHorseReport report) async {
    final notificationId = report.createdAt.millisecondsSinceEpoch ~/ 1000;
    return LocalNotificationService.instance.cancelNotification(notificationId);
  }

  // ── Renewal ──────────────────────────────────────────────────────

  /// Renew a report by extending its expiry by the tier's duration.
  ///
  /// If the report was expired, it is reactivated (status = active).
  /// A new renewal notification is scheduled for the new expiry.
  Future<Result<LostHorseReport>> renewReport(LostHorseReport report) async {
    if (!report.pricingTier.isPaid) {
      return Result.fail(
        AppException(
          code: 'RENEWAL_NOT_ALLOWED',
          message: 'Энгийн зарыг сунгах боломжгүй',
        ),
      );
    }

    final durationDays = report.pricingTier.durationDays;
    if (durationDays == null) {
      return Result.fail(
        AppException(
          code: 'RENEWAL_NOT_ALLOWED',
          message: 'Энэ зарыг сунгах боломжгүй',
        ),
      );
    }

    final now = DateTime.now();
    final newExpiresAt = now.add(Duration(days: durationDays));

    // Update status, expiry, and renewal flag.
    final updateResult = await _repository.updateLostHorseFields(report.id, {
      'status': 'active',
      'expires_at': newExpiresAt.toIso8601String(),
      'renewal_requested': true,
    });

    if (updateResult.isFailure) {
      return Result.fail(updateResult.error);
    }

    final renewed = report.copyWith(
      status: LostHorseStatus.active,
      expiresAt: newExpiresAt,
      renewalRequested: true,
    );

    // Schedule notification for the new expiry.
    await scheduleRenewalNotification(renewed);

    debugPrint(
      '[ExpiryService] Report ${report.id} renewed, '
      'new expiry: ${newExpiresAt.toIso8601String()}',
    );

    return Result.ok(renewed);
  }

  // ── Queries ──────────────────────────────────────────────────────

  /// Whether a report is nearing expiry (within [kRenewalNotificationHoursBefore] hours).
  static bool isNearingExpiry(LostHorseReport report) {
    if (!report.pricingTier.isPaid || report.expiresAt == null) return false;
    if (report.status != LostHorseStatus.active) return false;

    final now = DateTime.now();
    final threshold = report.expiresAt!.subtract(
      const Duration(hours: kRenewalNotificationHoursBefore),
    );

    return now.isAfter(threshold) && now.isBefore(report.expiresAt!);
  }

  /// Whether a report can be renewed (paid tier, not free).
  static bool canBeRenewed(LostHorseReport report) {
    return report.pricingTier.isPaid;
  }

  /// The number of hours until this report expires.
  static double? hoursUntilExpiry(LostHorseReport report) {
    if (report.expiresAt == null) return null;
    return report.expiresAt!.difference(DateTime.now()).inHours.toDouble();
  }
}

// ── Notification tap handler for renewal ───────────────────────────

/// Handle notification tap for lost horse renewal.
///
/// Call this from the [LocalNotificationService] tap handler to navigate
/// the user to the renewal flow for a [LostHorseReport].
///
/// Returns the report ID if the payload was a renewal notification, or
/// `null` if the payload was for a different notification type.
Future<String?> handleRenewalNotificationTap(
  NotificationPayload payload,
) async {
  if (payload.type != NotificationType.lostHorseRenewal) return null;
  if (payload.referenceId == null) return null;

  // Return the report ID so the UI layer can navigate to it.
  return payload.referenceId;
}
