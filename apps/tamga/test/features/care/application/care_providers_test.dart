import 'package:flutter_test/flutter_test.dart';

import 'package:tamga/src/features/breeding/domain/breeding_record.dart';
import 'package:tamga/src/features/care/application/care_providers.dart';
import 'package:tamga/src/shared/domain/event.dart';
import 'package:tamga/src/shared/domain/health_log.dart';
import 'package:tamga/src/shared/domain/horse.dart';

void main() {
  test('builds actionable care tasks from current records', () {
    final now = DateTime.now();
    final horses = [
      _horse(id: 'h1', name: 'Хан Хүлэг', now: now),
      _horse(id: 'h2', name: 'Цагаан Салхи', now: now),
    ];
    final healthLogs = [
      _healthLog(
        id: 'vaccination-old',
        horseId: 'h1',
        logType: LogType.vaccination,
        date: now.subtract(const Duration(days: 400)),
        now: now,
      ),
      _healthLog(
        id: 'vaccination-latest',
        horseId: 'h1',
        logType: LogType.vaccination,
        date: now.subtract(const Duration(days: 366)),
        now: now,
      ),
      _healthLog(
        id: 'deworming',
        horseId: 'h2',
        logType: LogType.deworming,
        date: now.subtract(const Duration(days: 85)),
        now: now,
      ),
    ];
    final events = [
      Event(
        id: 'event-soon',
        horseId: 'h1',
        title: 'Хаврын уралдаан',
        eventType: EventType.race,
        date: now.add(const Duration(days: 3)),
        createdAt: now,
        updatedAt: now,
        location: 'Төв аймаг',
      ),
      Event(
        id: 'event-far',
        horseId: 'h2',
        title: 'Намрын үзэсгэлэн',
        eventType: EventType.expo,
        date: now.add(const Duration(days: 31)),
        createdAt: now,
        updatedAt: now,
      ),
    ];
    final breedingRecords = [
      BreedingRecord(
        id: 'breeding-open',
        sireId: 'sire',
        sireName: 'Сүлд',
        damId: 'h2',
        damName: 'Цагаан Салхи',
        breedingDate: now.subtract(const Duration(days: 320)),
        expectedFoalingDate: now.add(const Duration(days: 20)),
        status: 'Хээлтсэн',
        herdLabel: 'Өрх',
        notes: '',
        createdAt: now,
        updatedAt: now,
      ),
      BreedingRecord(
        id: 'breeding-complete',
        sireId: 'sire',
        sireName: 'Сүлд',
        damId: 'h1',
        damName: 'Хан Хүлэг',
        breedingDate: now.subtract(const Duration(days: 340)),
        expectedFoalingDate: now.subtract(const Duration(days: 5)),
        status: 'Төллөсөн',
        herdLabel: 'Өрх',
        notes: '',
        actualFoalingDate: now.subtract(const Duration(days: 2)),
        createdAt: now,
        updatedAt: now,
      ),
    ];

    final overview = buildCareOverview(
      horses: horses,
      healthLogs: healthLogs,
      events: events,
      breedingRecords: breedingRecords,
      now: now,
    );

    expect(
      overview.tasks.map((task) => task.id),
      containsAll(<String>[
        'h1:vaccination',
        'h2:deworming',
        'breeding:breeding-open',
        'event:event-soon',
      ]),
    );
    expect(overview.tasks, hasLength(4));
    expect(overview.upcomingEvents.map((event) => event.id), ['event-soon']);
    expect(overview.monitoredHorseIds, containsAll(<String>['h1', 'h2']));
    expect(overview.attentionHorseIds, containsAll(<String>['h1', 'h2']));
    expect(overview.overdueCount, 1);
    expect(overview.dueSoonCount, 3);
  });

  test('does not invent work for unknown or distant records', () {
    final now = DateTime.now();
    final overview = buildCareOverview(
      horses: [_horse(id: 'h1', name: 'Морь', now: now)],
      healthLogs: [
        _healthLog(
          id: 'treatment',
          horseId: 'h1',
          logType: LogType.treatment,
          date: now.subtract(const Duration(days: 10)),
          now: now,
        ),
      ],
      events: const [],
      breedingRecords: const [],
      now: now,
    );

    expect(overview.tasks, isEmpty);
    expect(overview.healthLogCount, 1);
    expect(overview.monitoredHorseIds, {'h1'});
    expect(overview.attentionHorseIds, isEmpty);
  });
}

Horse _horse({
  required String id,
  required String name,
  required DateTime now,
}) {
  return Horse(
    id: id,
    name: name,
    gender: HorseGender.gelding,
    createdAt: now,
    updatedAt: now,
  );
}

HealthLog _healthLog({
  required String id,
  required String horseId,
  required LogType logType,
  required DateTime date,
  required DateTime now,
}) {
  return HealthLog(
    id: id,
    horseId: horseId,
    logType: logType,
    date: date,
    createdAt: now,
    updatedAt: now,
  );
}
