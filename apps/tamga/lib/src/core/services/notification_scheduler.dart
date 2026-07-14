import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/breeding/application/breeding_notifications.dart';
import '../../features/health/application/health_reminder_notifications.dart';
import '../../features/market/application/market_notifications.dart';

/// Мэдэгдлийн scheduler — бүх notification эх сурвалжуудыг хугацаатайгаар шалгана.
///
/// Товлогч:
/// - Эрүүл мэндийн сануулга: 6 цаг тутамд
/// - Төллөлтийн огноо: өдөр бүр
/// - Зах зээлийн шинэчлэл: 6 цаг тутамд (эсвэл app нээх үед)
/// - Геоференцийн мэдэгдэл: шууд (GeofenceMonitor-оос)
///
/// Timer-д суурилсан — workmanager нэмэлтгүйгээр ажиллана.
class NotificationScheduler {
  NotificationScheduler({
    required HealthReminderNotifications healthNotifications,
    required BreedingNotifications breedingNotifications,
    required MarketNotifications marketNotifications,
  }) : _healthNotifications = healthNotifications,
       _breedingNotifications = breedingNotifications,
       _marketNotifications = marketNotifications;

  final HealthReminderNotifications _healthNotifications;
  final BreedingNotifications _breedingNotifications;
  final MarketNotifications _marketNotifications;

  // ── Timer Configuration ─────────────────────────────────────

  /// Эрүүл мэндийн сануулга шалгах хугацаа (6 цаг).
  static const Duration healthCheckInterval = Duration(hours: 6);

  /// Төллөлтийн огноо шалгах хугацаа (24 цаг).
  static const Duration breedingCheckInterval = Duration(hours: 24);

  /// Зах зээлийн шинэчлэл шалгах хугацаа (6 цаг).
  static const Duration marketCheckInterval = Duration(hours: 6);

  // ── State ───────────────────────────────────────────────────

  Timer? _healthTimer;
  Timer? _breedingTimer;
  Timer? _marketTimer;

  bool _isRunning = false;

  /// Scheduler ажиллаж байгаа эсэх.
  bool get isRunning => _isRunning;

  /// Сүүлчийн шалгалтын цагууд.
  DateTime? _lastHealthCheck;
  DateTime? _lastBreedingCheck;
  DateTime? _lastMarketCheck;

  DateTime? get lastHealthCheck => _lastHealthCheck;
  DateTime? get lastBreedingCheck => _lastBreedingCheck;
  DateTime? get lastMarketCheck => _lastMarketCheck;

  // ── Lifecycle ───────────────────────────────────────────────

  /// Scheduler-ийг эхлүүлэх — бүх timer-уудыг асаана.
  void start() {
    if (_isRunning) return;
    _isRunning = true;

    debugPrint('[NotificationScheduler] Starting...');

    // Эхний шалгалтыг шууд хийх.
    _runHealthCheck();
    _runBreedingCheck();
    _runMarketCheck();

    // Тогтмол timer-уудыг эхлүүлэх.
    _healthTimer = Timer.periodic(healthCheckInterval, (_) {
      _runHealthCheck();
    });

    _breedingTimer = Timer.periodic(breedingCheckInterval, (_) {
      _runBreedingCheck();
    });

    _marketTimer = Timer.periodic(marketCheckInterval, (_) {
      _runMarketCheck();
    });

    debugPrint('[NotificationScheduler] Started with intervals:');
    debugPrint('  Health: ${healthCheckInterval.inHours}h');
    debugPrint('  Breeding: ${breedingCheckInterval.inHours}h');
    debugPrint('  Market: ${marketCheckInterval.inHours}h');
  }

  /// Scheduler-ийг зогсоох — бүх timer-уудыг зогсооно.
  void stop() {
    if (!_isRunning) return;
    _isRunning = false;

    _healthTimer?.cancel();
    _breedingTimer?.cancel();
    _marketTimer?.cancel();

    _healthTimer = null;
    _breedingTimer = null;
    _marketTimer = null;

    debugPrint('[NotificationScheduler] Stopped');
  }

  /// Ресурсуудыг чөлөөлөх.
  void dispose() {
    stop();
  }

  // ── Manual Triggers ─────────────────────────────────────────

  /// Эрүүл мэндийн шалгалтыг гар нь дарж эхлүүлэх.
  Future<void> triggerHealthCheck() async {
    await _runHealthCheck();
  }

  /// Төллөлтийн шалгалтыг гар нь дарж эхлүүлэх.
  Future<void> triggerBreedingCheck() async {
    await _runBreedingCheck();
  }

  /// Зах зээлийн шалгалтыг гар нь дарж эхлүүлэх.
  Future<void> triggerMarketCheck() async {
    await _runMarketCheck();
  }

  /// Бүх шалгалтуудыг нэгэн зэрэг хийх (app нээх үед).
  Future<void> triggerAllChecks() async {
    debugPrint('[NotificationScheduler] Triggering all checks...');

    await Future.wait([
      _runHealthCheck(),
      _runBreedingCheck(),
      _runMarketCheck(),
    ]);

    debugPrint('[NotificationScheduler] All checks completed');
  }

  // ── Internal Check Methods ──────────────────────────────────

  /// Эрүүл мэндийн сануулгуудыг шалгах.
  Future<void> _runHealthCheck() async {
    try {
      debugPrint('[NotificationScheduler] Running health check...');
      _lastHealthCheck = DateTime.now();

      final sent = await _healthNotifications.checkAll();
      debugPrint('[NotificationScheduler] Health check: $sent notifications');
    } catch (e) {
      debugPrint('[NotificationScheduler] Health check failed: $e');
    }
  }

  /// Төллөлтийн сануулгуудыг шалгах.
  Future<void> _runBreedingCheck() async {
    try {
      debugPrint('[NotificationScheduler] Running breeding check...');
      _lastBreedingCheck = DateTime.now();

      final sent = await _breedingNotifications.checkAllBreedingRecords();
      debugPrint('[NotificationScheduler] Breeding check: $sent notifications');
    } catch (e) {
      debugPrint('[NotificationScheduler] Breeding check failed: $e');
    }
  }

  /// Зах зээлийн шинэчлэлүүдийг шалгах.
  Future<void> _runMarketCheck() async {
    try {
      debugPrint('[NotificationScheduler] Running market check...');
      _lastMarketCheck = DateTime.now();

      final sent = await _marketNotifications.checkNewInquiries();
      debugPrint('[NotificationScheduler] Market check: $sent notifications');
    } catch (e) {
      debugPrint('[NotificationScheduler] Market check failed: $e');
    }
  }

  // ── Status ──────────────────────────────────────────────────

  /// Scheduler-ийн төлөв мэдээлэл.
  Map<String, dynamic> getStatus() {
    return {
      'isRunning': _isRunning,
      'lastHealthCheck': _lastHealthCheck?.toIso8601String(),
      'lastBreedingCheck': _lastBreedingCheck?.toIso8601String(),
      'lastMarketCheck': _lastMarketCheck?.toIso8601String(),
      'healthInterval': healthCheckInterval.inHours,
      'breedingInterval': breedingCheckInterval.inHours,
      'marketInterval': marketCheckInterval.inHours,
    };
  }
}

// ── Riverpod Providers ──────────────────────────────────────────

/// NotificationScheduler provider.
///
/// Бүх dependency-г Riverpod-оос авч, scheduler-ийг эхлүүлнэ.
final notificationSchedulerProvider = FutureProvider<NotificationScheduler>((
  ref,
) async {
  final healthNotifications = await ref.watch(
    healthReminderNotificationsProvider.future,
  );
  final breedingNotifications = await ref.watch(
    breedingNotificationsProvider.future,
  );
  final marketNotifications = await ref.watch(
    marketNotificationsProvider.future,
  );

  final scheduler = NotificationScheduler(
    healthNotifications: healthNotifications,
    breedingNotifications: breedingNotifications,
    marketNotifications: marketNotifications,
  );

  // Scheduler-ийг эхлүүлэх.
  scheduler.start();

  // Provider dispose болоход scheduler-ийг зогсоох.
  ref.onDispose(() {
    scheduler.dispose();
  });

  return scheduler;
});

/// Scheduler-ийн статусыг хянах provider.
final schedulerStatusProvider = Provider<Map<String, dynamic>>((ref) {
  final schedulerAsync = ref.watch(notificationSchedulerProvider);
  return schedulerAsync.when(
    data: (scheduler) => scheduler.getStatus(),
    loading: () => {'isRunning': false, 'status': 'loading'},
    error: (_, _) => {'isRunning': false, 'status': 'error'},
  );
});
