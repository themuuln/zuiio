import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/storage/isar_database.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/races/data/local_race_repository.dart';
import 'package:tamga/src/features/races/data/race_repository.dart';
import 'package:tamga/src/features/races/domain/race.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';

import '../../../helpers/test_helpers.dart';

void main() {
  group('LocalRaceRepository', () {
    late SyncQueue syncQueue;
    late RaceRepository repository;

    setUp(() async {
      await setupTestEnvironment();
      await IsarDatabase.initialize();
      syncQueue = SyncQueue();
      repository = LocalRaceRepository(
        storage: IsarStorage.instance,
        syncQueue: syncQueue,
      );
    });

    tearDown(() async {
      await IsarDatabase.close();
    });

    test('fetchAll returns empty list on first call', () async {
      final result = await repository.fetchAll();
      expect(result.isSuccess, true);
      expect(result.value, isEmpty);
    });

    test('create adds a new race', () async {
      final race = Race(
        id: 'race-1',
        name: 'Наадам',
        type: RaceType.naadam,
        date: DateTime(2026, 7, 11),
        location: 'Төв аймаг',
        maxEntries: 50,
        entryFee: 10000,
        description: 'Улсын наадам',
      );

      final result = await repository.create(race);
      expect(result.isSuccess, true);
      expect(result.value.id, 'race-1');
      expect(result.value.name, 'Наадам');

      final fetch = await repository.fetchAll();
      expect(fetch.isSuccess, true);
      expect(fetch.value.length, 1);
    });

    test('create enqueues sync create action', () async {
      await repository.create(
        Race(id: 'race-2', name: 'Test Race', type: RaceType.local),
      );
      expect(syncQueue.pendingCount, 1);
      expect(syncQueue.peek()!.action, SyncAction.create);
      expect(syncQueue.peek()!.entityType, 'race');
    });

    test('create generates UUID when id is empty', () async {
      final race = Race(
        id: '',
        name: 'Auto ID Race',
        type: RaceType.local,
      );

      final result = await repository.create(race);
      expect(result.isSuccess, true);
      expect(result.value.id, isNotEmpty);
      expect(result.value.id, isNot(''));
    });

    test('update modifies existing race', () async {
      final date = DateTime(2026, 7, 1);
      await repository.create(
        Race(
          id: 'race-1',
          name: 'Original',
          type: RaceType.local,
          date: date,
          maxEntries: 30,
        ),
      );
      syncQueue.clear();

      final updateResult = await repository.update(
        Race(
          id: 'race-1',
          name: 'Updated',
          type: RaceType.naadam,
          date: date,
          maxEntries: 50,
          entryFee: 20000,
          description: 'Шинэчилсэн',
        ),
      );

      expect(updateResult.isSuccess, true);
      expect(updateResult.value.name, 'Updated');
      expect(updateResult.value.type, RaceType.naadam);
      expect(updateResult.value.maxEntries, 50);
      expect(updateResult.value.entryFee, 20000);
      expect(updateResult.value.description, 'Шинэчилсэн');

      final fetch = await repository.fetchAll();
      expect(fetch.value.length, 1);
      expect(fetch.value.first.name, 'Updated');

      expect(syncQueue.pendingCount, 1);
      expect(syncQueue.peek()!.action, SyncAction.update);
    });

    test('update fails for non-existent race', () async {
      final result = await repository.update(
        Race(id: 'nonexistent', name: 'Ghost'),
      );
      expect(result.isFailure, true);
    });

    test('delete removes and enqueues delete', () async {
      await repository.create(
        Race(id: 'race-1', name: 'To Delete', type: RaceType.local),
      );
      syncQueue.clear();

      final del = await repository.delete('race-1');
      expect(del.isSuccess, true);

      final fetch = await repository.fetchAll();
      expect(fetch.value, isEmpty);

      expect(syncQueue.pendingCount, 1);
      expect(syncQueue.peek()!.action, SyncAction.delete);
    });

    test('fetchById returns a specific race', () async {
      await repository.create(
        Race(id: 'race-1', name: 'Race One', type: RaceType.naadam),
      );
      await repository.create(
        Race(id: 'race-2', name: 'Race Two', type: RaceType.regional),
      );

      final result = await repository.fetchById('race-2');
      expect(result.isSuccess, true);
      expect(result.value.id, 'race-2');
      expect(result.value.name, 'Race Two');
    });

    test('fetchById fails for non-existent race', () async {
      final result = await repository.fetchById('nonexistent');
      expect(result.isFailure, true);
    });

    test('fetchByType returns only races of that type', () async {
      await repository.create(
        Race(id: 'r1', name: 'Naadam Race', type: RaceType.naadam),
      );
      await repository.create(
        Race(id: 'r2', name: 'Regional Race', type: RaceType.regional),
      );
      await repository.create(
        Race(id: 'r3', name: 'Local Race', type: RaceType.local),
      );

      final naadamRaces = await repository.fetchByType(RaceType.naadam);
      expect(naadamRaces.isSuccess, true);
      expect(naadamRaces.value.length, 1);
      expect(naadamRaces.value.first.id, 'r1');

      final allRaces = await repository.fetchAll();
      expect(allRaces.value.length, 3);
    });

    // ════════════════════════════════════════════════════════════
    // VAL-RACE-012: LocalRaceRepository stores in Isar and enqueues to SyncQueue
    // ════════════════════════════════════════════════════════════
    test('offline-first: data persists in Isar and SyncQueue has pending item',
        () async {
      final race = Race(
        id: 'race-offline-1',
        name: 'Офлайн тест',
        type: RaceType.local,
        date: DateTime(2026, 8, 1),
        location: 'Тест',
        maxEntries: 20,
        entryFee: 5000,
        description: 'Офлайн үед хадгалах тест',
      );

      final result = await repository.create(race);
      expect(result.isSuccess, true,
          reason: 'Local create should succeed even when offline');

      final fetch = await repository.fetchAll();
      expect(fetch.isSuccess, true);
      final saved = fetch.value.where((r) => r.id == 'race-offline-1').toList();
      expect(saved.length, 1);
      expect(saved.first.name, 'Офлайн тест');
      expect(saved.first.location, 'Тест');
      expect(saved.first.maxEntries, 20);
      expect(saved.first.entryFee, 5000);

      expect(syncQueue.pendingCount, greaterThanOrEqualTo(1));
      final pendingItem = syncQueue.peek()!;
      expect(pendingItem.entityType, 'race');
      expect(pendingItem.entityId, 'race-offline-1');
      expect(pendingItem.action, SyncAction.create);
      expect(pendingItem.status, SyncItemStatus.pending);
    });
  });
}
