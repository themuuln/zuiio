import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:tamga/src/core/error/app_exception.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/core/services/local_notification_service.dart';
import 'package:tamga/src/core/services/notification_types.dart';
import 'package:tamga/src/features/health/application/health_reminder_notifications.dart';
import 'package:tamga/src/features/health/data/health_repository.dart';
import 'package:tamga/src/shared/domain/health_log.dart';

import '../../../helpers/test_helpers.dart';

class MockHealthRepository extends Mock implements HealthRepository {}

class MockLocalNotificationService extends Mock
    implements LocalNotificationService {}

void main() {
  late MockHealthRepository mockRepo;
  late MockLocalNotificationService mockNotification;
  late HealthReminderNotifications service;

  setUpAll(() {
    registerFallbackValue(NotificationType.healthReminder);
  });

  setUp(() {
    mockRepo = MockHealthRepository();
    mockNotification = MockLocalNotificationService();
    service = HealthReminderNotifications(
      localNotification: mockNotification,
      healthRepository: mockRepo,
    );
  });

  // All dates computed relative to DateTime.now() because the
  // service calls DateTime.now() internally. The one-hour margin keeps
  // `Duration.inDays` arithmetic stable against microsecond clock skew.

  // ── Vaccination: due soon ───────────────────────────────────

  test('vaccination due in 3 days sends reminder with exact body', () async {
    final now = DateTime.now();
    // nextDue = lastVacc + 365 = now + 3d 1h → daysUntil = 3
    final lastVacc = now.subtract(const Duration(days: 361, hours: 23));
    final logs = [
      createMockHealthLog(
        id: 'v1',
        horseId: 'h1',
        logType: LogType.vaccination,
        date: lastVacc,
      ),
    ];

    when(
      () => mockRepo.fetchAllByHorse('h1'),
    ).thenAnswer((_) async => Result.ok(logs));
    when(
      () => mockNotification.showNotification(
        title: any(named: 'title'),
        body: any(named: 'body'),
        type: any(named: 'type'),
        referenceId: any(named: 'referenceId'),
        referenceType: any(named: 'referenceType'),
      ),
    ).thenAnswer((_) async => const Result.ok(null));

    final sent = await service.checkForHorse('h1');
    expect(sent, 1);

    verify(
      () => mockNotification.showNotification(
        title: 'Вакцин хийх хугацаа ойртлоо',
        body: 'Вакцин хийх хугацаа 3 хоногийн дараа.',
        type: NotificationType.healthReminder,
        referenceId: 'h1',
        referenceType: 'horse',
      ),
    ).called(1);
  });

  // ── Vaccination: outside window ─────────────────────────────

  test('vaccination due beyond 7-day window sends no notification', () async {
    final now = DateTime.now();
    // lastVacc placed so nextDue = now + 8d 1h → daysUntil = 8 > 7
    final lastVacc = now.subtract(const Duration(days: 356, hours: 23));
    final logs = [
      createMockHealthLog(
        id: 'v1',
        horseId: 'h1',
        logType: LogType.vaccination,
        date: lastVacc,
      ),
    ];

    when(
      () => mockRepo.fetchAllByHorse('h1'),
    ).thenAnswer((_) async => Result.ok(logs));

    final sent = await service.checkForHorse('h1');
    expect(sent, 0);
    verifyZeroInteractions(mockNotification);
  });

  // ── Vaccination: overdue ────────────────────────────────────

  test('vaccination overdue by 2 days sends overdue body', () async {
    final now = DateTime.now();
    // lastVacc placed so nextDue = now - 2d → daysUntil = -2
    final lastVacc = now.subtract(const Duration(days: 367));
    final logs = [
      createMockHealthLog(
        id: 'v1',
        horseId: 'h1',
        logType: LogType.vaccination,
        date: lastVacc,
      ),
    ];

    when(
      () => mockRepo.fetchAllByHorse('h1'),
    ).thenAnswer((_) async => Result.ok(logs));
    when(
      () => mockNotification.showNotification(
        title: any(named: 'title'),
        body: any(named: 'body'),
        type: any(named: 'type'),
        referenceId: any(named: 'referenceId'),
        referenceType: any(named: 'referenceType'),
      ),
    ).thenAnswer((_) async => const Result.ok(null));

    final sent = await service.checkForHorse('h1');
    expect(sent, 1);

    final captured = verify(
      () => mockNotification.showNotification(
        title: captureAny(named: 'title'),
        body: captureAny(named: 'body'),
        type: any(named: 'type'),
        referenceId: any(named: 'referenceId'),
        referenceType: any(named: 'referenceType'),
      ),
    ).captured;

    expect(captured[0], 'Вакцин хийх хугацаа ойртлоо');
    expect(captured[1], 'Вакцины хугацаа дууссан! Даруй хийлгэнэ үү.');
  });

  // ── Latest vaccination wins ─────────────────────────────────

  test('latest vaccination log determines due date', () async {
    final now = DateTime.now();
    final logs = [
      // Older log: nextDue far in the past (overdue > 30 → no send)
      createMockHealthLog(
        id: 'old',
        horseId: 'h1',
        logType: LogType.vaccination,
        date: now.subtract(const Duration(days: 2 * 365)),
      ),
      // Newer log: nextDue = now + 3d 1h → daysUntil = 3 → sends upcoming
      createMockHealthLog(
        id: 'new',
        horseId: 'h1',
        logType: LogType.vaccination,
        date: now.subtract(const Duration(days: 361, hours: 23)),
      ),
    ];

    when(
      () => mockRepo.fetchAllByHorse('h1'),
    ).thenAnswer((_) async => Result.ok(logs));
    when(
      () => mockNotification.showNotification(
        title: any(named: 'title'),
        body: any(named: 'body'),
        type: any(named: 'type'),
        referenceId: any(named: 'referenceId'),
        referenceType: any(named: 'referenceType'),
      ),
    ).thenAnswer((_) async => const Result.ok(null));

    final sent = await service.checkForHorse('h1');
    expect(sent, 1);

    // The older log (overdue beyond the send window) must not send, so
    // exactly one notification is produced and its body is the upcoming
    // version, not the overdue version — proves the newer log was used.
    final captured = verify(
      () => mockNotification.showNotification(
        title: any(named: 'title'),
        body: captureAny(named: 'body'),
        type: any(named: 'type'),
        referenceId: any(named: 'referenceId'),
        referenceType: any(named: 'referenceType'),
      ),
    ).captured;

    expect(captured.single, isNot(contains('дууссан')));
  });

  // ── Deworming ───────────────────────────────────────────────

  test('deworming due in 5 days sends deworming title', () async {
    final now = DateTime.now();
    // dewormingIntervalDays = 90. lastDeworming placed so that
    // nextDue = now + 5d 1h → daysUntil = 5.
    final lastDeworming = now.subtract(const Duration(days: 84, hours: 23));
    final logs = [
      createMockHealthLog(
        id: 'd1',
        horseId: 'h1',
        logType: LogType.deworming,
        date: lastDeworming,
      ),
    ];

    when(
      () => mockRepo.fetchAllByHorse('h1'),
    ).thenAnswer((_) async => Result.ok(logs));
    when(
      () => mockNotification.showNotification(
        title: any(named: 'title'),
        body: any(named: 'body'),
        type: any(named: 'type'),
        referenceId: any(named: 'referenceId'),
        referenceType: any(named: 'referenceType'),
      ),
    ).thenAnswer((_) async => const Result.ok(null));

    final sent = await service.checkForHorse('h1');
    expect(sent, 1);

    verify(
      () => mockNotification.showNotification(
        title: 'Туулгалт хийх хугацаа ойртлоо',
        body: 'Туулгалт хийх хугацаа 5 хоногийн дараа.',
        type: NotificationType.healthReminder,
        referenceId: 'h1',
        referenceType: 'horse',
      ),
    ).called(1);
  });

  // ── Repository failure ──────────────────────────────────────

  test('repository failure returns 0 and sends no notification', () async {
    when(() => mockRepo.fetchAllByHorse('h1')).thenAnswer(
      (_) async =>
          const Result.fail(AppException(message: 'fail', code: 'ERR')),
    );

    final sent = await service.checkForHorse('h1');
    expect(sent, 0);
    verifyZeroInteractions(mockNotification);
  });
}
