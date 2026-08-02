import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:tamga/src/core/error/app_exception.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/core/services/local_notification_service.dart';
import 'package:tamga/src/core/services/notification_types.dart';
import 'package:tamga/src/features/breeding/application/breeding_notifications.dart';
import 'package:tamga/src/features/breeding/data/breeding_repository.dart';
import 'package:tamga/src/features/breeding/domain/breeding_record.dart';

class MockBreedingRepository extends Mock implements BreedingRepository {}

class MockLocalNotificationService extends Mock
    implements LocalNotificationService {}

/// Creates a record with an expected foaling date relative to now so the
/// time-based reminder scheduling is deterministic. The extra hour of margin
/// keeps `inDays` arithmetic stable against microsecond clock skew.
BreedingRecord _createRecord({
  String id = 'br-1',
  String status = 'Хээлтсэн',
  DateTime? expectedFoalingDate,
}) {
  return BreedingRecord(
    id: id,
    sireId: 'sire-1',
    sireName: 'Тэмүүлэн',
    damId: 'dam-1',
    damName: 'Алтан',
    breedingDate: DateTime(2026, 1, 1),
    expectedFoalingDate:
        expectedFoalingDate ?? DateTime.now().add(const Duration(days: 60)),
    status: status,
    herdLabel: 'Улаанбаатар',
    notes: '',
    createdAt: DateTime(2026, 1, 1),
    updatedAt: DateTime(2026, 1, 1),
  );
}

void main() {
  late MockBreedingRepository mockRepository;
  late MockLocalNotificationService mockNotification;
  late List<String> titles;
  late List<String> bodies;
  late List<String> referenceIds;
  late BreedingNotifications service;

  setUp(() {
    mockRepository = MockBreedingRepository();
    mockNotification = MockLocalNotificationService();
    titles = [];
    bodies = [];
    referenceIds = [];

    when(
      () => mockNotification.showNotification(
        title: any(named: 'title'),
        body: any(named: 'body'),
        type: NotificationType.breedingDue,
        referenceId: any(named: 'referenceId'),
        referenceType: any(named: 'referenceType'),
      ),
    ).thenAnswer((invocation) async {
      titles.add(invocation.namedArguments[#title] as String);
      bodies.add(invocation.namedArguments[#body] as String);
      referenceIds.add(invocation.namedArguments[#referenceId] as String);
      return const Result.ok(null);
    });

    service = BreedingNotifications(
      localNotification: mockNotification,
      breedingRepository: mockRepository,
    );
  });

  group('checkAllBreedingRecords', () {
    test('sends nothing for non-active and far-out records', () async {
      final records = [
        _createRecord(
          id: 'br-foaled',
          status: 'Төллөсөн',
          expectedFoalingDate: DateTime.now().subtract(
            const Duration(days: 3, hours: 1),
          ),
        ),
        _createRecord(
          id: 'br-far',
          expectedFoalingDate: DateTime.now().add(
            const Duration(days: 60, hours: 1),
          ),
        ),
      ];
      when(
        () => mockRepository.fetchBreedingRecords(),
      ).thenAnswer((_) async => Result.ok(records));

      final sent = await service.checkAllBreedingRecords();

      expect(sent, 0);
      expect(titles, isEmpty);
      verifyNever(
        () => mockNotification.showNotification(
          title: any(named: 'title'),
          body: any(named: 'body'),
          type: NotificationType.breedingDue,
          referenceId: any(named: 'referenceId'),
          referenceType: any(named: 'referenceType'),
        ),
      );
    });

    test(
      'sends breedingDue notifications for an active record within 7 days',
      () async {
        final record = _createRecord(
          id: 'br-soon',
          expectedFoalingDate: DateTime.now().add(
            const Duration(days: 5, hours: 1),
          ),
        );
        when(
          () => mockRepository.fetchBreedingRecords(),
        ).thenAnswer((_) async => Result.ok([record]));

        final sent = await service.checkAllBreedingRecords();

        // All three thresholds (30/14/7 days) are urgent at 5 days remaining.
        expect(sent, 3);
        expect(titles, hasLength(3));
        expect(titles.toSet(), {'Төллөх хугацаа оиртлоо'});
        expect(bodies.every((b) => b.contains('Алтан')), isTrue);
        expect(bodies.every((b) => b.contains('хоног үлдлээ')), isTrue);
        expect(referenceIds.toSet(), {'br-soon'});
        verify(
          () => mockNotification.showNotification(
            title: any(named: 'title'),
            body: any(named: 'body'),
            type: NotificationType.breedingDue,
            referenceId: any(named: 'referenceId'),
            referenceType: any(named: 'referenceType'),
          ),
        ).called(3);
      },
    );

    test(
      'sends critical reminders plus an overdue alert for an overdue record',
      () async {
        final record = _createRecord(
          expectedFoalingDate: DateTime.now().subtract(
            const Duration(days: 3, hours: 1),
          ),
        );
        when(
          () => mockRepository.fetchBreedingRecords(),
        ).thenAnswer((_) async => Result.ok([record]));

        final sent = await service.checkAllBreedingRecords();

        // 3 critical reminders (30/14/7) + 1 overdue alert.
        expect(sent, 4);
        expect(
          titles.where((t) => t == 'Төллөх хугацаа хэтэрсэн!'),
          hasLength(1),
        );
        expect(bodies.any((b) => b.contains('3 хоног хэтэрсэн')), isTrue);
        expect(referenceIds, hasLength(4));
        expect(referenceIds.every((id) => id == 'br-1'), isTrue);
      },
    );

    test('propagates repository failure', () async {
      when(() => mockRepository.fetchBreedingRecords()).thenAnswer(
        (_) async => Result.fail(
          const AppException(code: 'FETCH_BREEDING_ERROR', message: 'Алдаа'),
        ),
      );

      expect(service.checkAllBreedingRecords(), throwsA(isA<AppException>()));
    });
  });

  group('onBreedingRecordUpdated', () {
    test('re-checks all records', () async {
      final record = _createRecord(
        expectedFoalingDate: DateTime.now().add(
          const Duration(days: 5, hours: 1),
        ),
      );
      when(
        () => mockRepository.fetchBreedingRecords(),
      ).thenAnswer((_) async => Result.ok([record]));

      await service.onBreedingRecordUpdated('br-1');

      expect(titles, hasLength(3));
      expect(referenceIds.toSet(), {'br-1'});
    });
  });
}
