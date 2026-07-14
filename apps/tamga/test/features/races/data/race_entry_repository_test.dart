import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/storage/isar_database.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/races/data/local_race_entry_repository.dart';
import 'package:tamga/src/features/races/data/local_race_repository.dart';
import 'package:tamga/src/features/races/data/race_entry_repository.dart';
import 'package:tamga/src/features/races/data/race_repository.dart';
import 'package:tamga/src/features/races/domain/race.dart';
import 'package:tamga/src/features/races/domain/race_entry.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';

import '../../../helpers/test_helpers.dart';

void main() {
  group('LocalRaceEntryRepository', () {
    late SyncQueue syncQueue;
    late RaceRepository raceRepository;
    late RaceEntryRepository repository;

    setUp(() async {
      await setupTestEnvironment();
      await IsarDatabase.initialize();
      syncQueue = SyncQueue();
      raceRepository = LocalRaceRepository(
        storage: IsarStorage.instance,
        syncQueue: syncQueue,
      );
      repository = LocalRaceEntryRepository(
        storage: IsarStorage.instance,
        syncQueue: syncQueue,
        raceRepository: raceRepository,
      );

      // Create a race for entries to reference
      await raceRepository.create(
        Race(
          id: 'race-1',
          name: 'Test Race',
          type: RaceType.local,
          maxEntries: 10,
        ),
      );
      await raceRepository.create(
        Race(
          id: 'race-full',
          name: 'Full Race',
          type: RaceType.local,
          maxEntries: 1,
        ),
      );
    });

    tearDown(() async {
      await IsarDatabase.close();
    });

    test('fetchByRace returns empty list for race with no entries', () async {
      final result = await repository.fetchByRace('race-nonexistent');
      expect(result.isSuccess, true);
      expect(result.value, isEmpty);
    });

    test('register creates a new entry', () async {
      final result = await repository.register(
        raceId: 'race-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        jockeyName: 'Бат',
      );

      expect(result.isSuccess, true);
      final entry = result.value;
      expect(entry.raceId, 'race-1');
      expect(entry.horseId, 'horse-1');
      expect(entry.ownerId, 'user-1');
      expect(entry.jockeyName, 'Бат');
      expect(entry.status, RaceEntryStatus.registered);
    });

    test('register with empty jockeyName', () async {
      final result = await repository.register(
        raceId: 'race-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        jockeyName: '',
      );

      expect(result.isSuccess, true);
      expect(result.value.jockeyName, '');
    });

    test('register enqueues sync create action', () async {
      syncQueue.clear();
      await repository.register(
        raceId: 'race-1',
        horseId: 'horse-2',
        ownerId: 'user-1',
        jockeyName: 'Дорж',
      );

      expect(syncQueue.pendingCount, 1);
      final item = syncQueue.peek()!;
      expect(item.entityType, 'race_entry');
      expect(item.action, SyncAction.create);
    });

    // ════════════════════════════════════════════════════════════
    // VAL-RACE-014: Duplicate registration is prevented
    // ════════════════════════════════════════════════════════════
    test('register prevents duplicate registration', () async {
      await repository.register(
        raceId: 'race-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        jockeyName: 'Бат',
      );

      final duplicate = await repository.register(
        raceId: 'race-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        jockeyName: 'Бат',
      );

      expect(duplicate.isFailure, true);
      expect(duplicate.error.code, 'DUPLICATE_RACE_REGISTRATION');
    });

    test('same horse can register for different races', () async {
      await raceRepository.create(
        Race(id: 'race-2', name: 'Another Race', type: RaceType.local),
      );

      await repository.register(
        raceId: 'race-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        jockeyName: 'Бат',
      );

      final second = await repository.register(
        raceId: 'race-2',
        horseId: 'horse-1',
        ownerId: 'user-1',
        jockeyName: 'Бат',
      );

      expect(second.isSuccess, true);
    });

    // ════════════════════════════════════════════════════════════
    // VAL-RACE-015: Entry limit enforcement
    // ════════════════════════════════════════════════════════════
    test('entry limit enforcement prevents registration when full', () async {
      // Fill the race with maxEntries=1
      await repository.register(
        raceId: 'race-full',
        horseId: 'horse-1',
        ownerId: 'user-1',
        jockeyName: 'Бат',
      );

      // Second attempt should fail
      final blocked = await repository.register(
        raceId: 'race-full',
        horseId: 'horse-2',
        ownerId: 'user-1',
        jockeyName: 'Дорж',
      );

      expect(blocked.isFailure, true);
      expect(blocked.error.code, 'RACE_ENTRY_LIMIT_EXCEEDED');
    });

    test('registration succeeds when limit not reached', () async {
      await repository.register(
        raceId: 'race-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        jockeyName: 'Бат',
      );

      final second = await repository.register(
        raceId: 'race-1',
        horseId: 'horse-2',
        ownerId: 'user-1',
        jockeyName: 'Дорж',
      );

      expect(second.isSuccess, true);
    });

    test('fetchByRace returns entries for a specific race', () async {
      await repository.register(
        raceId: 'race-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        jockeyName: 'Бат',
      );
      await repository.register(
        raceId: 'race-1',
        horseId: 'horse-2',
        ownerId: 'user-1',
        jockeyName: 'Дорж',
      );

      final entries = await repository.fetchByRace('race-1');
      expect(entries.isSuccess, true);
      expect(entries.value.length, 2);
      expect(entries.value.every((e) => e.raceId == 'race-1'), true);
    });

    test('fetchByHorse returns entries for a specific horse', () async {
      await repository.register(
        raceId: 'race-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        jockeyName: 'Бат',
      );

      final entries = await repository.fetchByHorse('horse-1');
      expect(entries.isSuccess, true);
      expect(entries.value.length, 1);
      expect(entries.value.first.horseId, 'horse-1');
    });

    // ════════════════════════════════════════════════════════════
    // VAL-RACE-016: Cancel entry updates status to scratched
    // ════════════════════════════════════════════════════════════
    test('cancel sets status to scratched (not deleted)', () async {
      final reg = await repository.register(
        raceId: 'race-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        jockeyName: 'Бат',
      );

      syncQueue.clear();

      final cancelResult = await repository.cancel(reg.value.id);
      expect(cancelResult.isSuccess, true);
      expect(cancelResult.value.status, RaceEntryStatus.scratched);

      // Entry should still exist in the race
      final entries = await repository.fetchByRace('race-1');
      expect(entries.value.length, 1);
      expect(entries.value.first.status, RaceEntryStatus.scratched);
    });

    test('cancel enqueues sync update action', () async {
      final reg = await repository.register(
        raceId: 'race-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        jockeyName: 'Бат',
      );

      syncQueue.clear();
      await repository.cancel(reg.value.id);

      expect(syncQueue.pendingCount, 1);
      final item = syncQueue.peek()!;
      expect(item.entityType, 'race_entry');
      expect(item.action, SyncAction.update);
      expect(item.entityId, reg.value.id);
    });

    test('cancel fails for non-existent entry', () async {
      final result = await repository.cancel('nonexistent');
      expect(result.isFailure, true);
    });

    // ════════════════════════════════════════════════════════════
    // VAL-RACE-017: Update entry result works correctly
    // ════════════════════════════════════════════════════════════
    test('updateResult sets status to competed with placement/prize', () async {
      final reg = await repository.register(
        raceId: 'race-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        jockeyName: 'Бат',
      );

      syncQueue.clear();

      final updated = await repository.updateResult(
        id: reg.value.id,
        result: '2:30.5',
        placement: 1,
        prize: 500000,
      );

      expect(updated.isSuccess, true);
      expect(updated.value.status, RaceEntryStatus.competed);
      expect(updated.value.result, '2:30.5');
      expect(updated.value.placement, 1);
      expect(updated.value.prize, 500000);
    });

    test('updateResult enqueues sync update action', () async {
      final reg = await repository.register(
        raceId: 'race-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        jockeyName: 'Бат',
      );

      syncQueue.clear();
      await repository.updateResult(
        id: reg.value.id,
        result: '1:30',
        placement: 2,
        prize: 250000,
      );

      expect(syncQueue.pendingCount, 1);
      final item = syncQueue.peek()!;
      expect(item.entityType, 'race_entry');
      expect(item.action, SyncAction.update);
      expect(item.entityId, reg.value.id);
    });

    test('updateResult fails for non-existent entry', () async {
      final result = await repository.updateResult(
        id: 'nonexistent',
        result: '1:30',
        placement: 1,
        prize: 100000,
      );
      expect(result.isFailure, true);
    });

    // ════════════════════════════════════════════════════════════
    // VAL-RACE-013: LocalRaceEntryRepository stores in Isar and enqueues
    // ════════════════════════════════════════════════════════════
    test('offline-first: data persists in Isar and SyncQueue has pending item',
        () async {
      final regResult = await repository.register(
        raceId: 'race-1',
        horseId: 'horse-offline',
        ownerId: 'user-1',
        jockeyName: 'Офлайн морьтон',
      );

      expect(regResult.isSuccess, true,
          reason: 'Local register should succeed even when offline');
      final entryId = regResult.value.id;

      // Verify in Isar
      final fetched = await repository.fetchByRace('race-1');
      expect(fetched.isSuccess, true);
      final saved = fetched.value.where((e) => e.id == entryId).toList();
      expect(saved.length, 1);
      expect(saved.first.jockeyName, 'Офлайн морьтон');
      expect(saved.first.status, RaceEntryStatus.registered);

      // Verify SyncQueue
      expect(syncQueue.pendingCount, greaterThanOrEqualTo(1));
      // Find our item (may not be the first since we created other entries)
      final pendingItems = syncQueue
          .toList()
          .where((item) => item.entityId == entryId)
          .toList();
      expect(pendingItems.length, 1);
      expect(pendingItems.first.entityType, 'race_entry');
      expect(pendingItems.first.action, SyncAction.create);
    });
  });
}
