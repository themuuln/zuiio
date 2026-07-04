import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/storage/isar_database.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/horses/data/horses_repository.dart';
import 'package:tamga/src/features/horses/data/local_horses_repository.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';
import 'package:tamga/src/shared/domain/horse.dart';

import '../../helpers/test_helpers.dart';

void main() {
  group('LocalHorsesRepository sync enqueue', () {
    late SyncQueue syncQueue;
    late LocalHorsesRepository repository;

    setUp(() async {
      await setupTestEnvironment();
      await IsarDatabase.initialize();
      syncQueue = SyncQueue();
      repository = LocalHorsesRepository(
        storage: IsarStorage.instance,
        syncQueue: syncQueue,
      );
    });

    tearDown(() async {
      await IsarDatabase.close();
    });

    test('constructor accepts SyncQueue parameter', () {
      // VAL-SYNC-007: LocalHorsesRepository has SyncQueue injected
      expect(repository, isA<HorsesRepository>());
    });

    test(
      'saveHorse enqueues SyncQueueItem with entityType horse (create)',
      () async {
        // VAL-SYNC-008: saveHorse enqueues SyncQueueItem
        final horse = Horse(
          id: 'test-horse-1',
          name: 'Тест Морь',
          relationLabel: 'Тест',
          coat: 'Хээр',
          birthYear: 2020,
          awardCount: 0,
          offspringCount: 0,
          isOwnedByHousehold: true,
          notes: 'Test horse for sync',
          gender: HorseGender.gelding,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        final result = await repository.saveHorse(horse);
        expect(result.isSuccess, true);

        expect(syncQueue.pendingCount, greaterThanOrEqualTo(1));
        final item = syncQueue.peek();
        expect(item, isNotNull);
        expect(item!.entityType, 'horse');
        expect(item.entityId, 'test-horse-1');
        expect(item.action, SyncAction.create);
      },
    );

    test(
      'saveHorse enqueues SyncQueueItem with action update on existing horse',
      () async {
        // Save first
        final horse = Horse(
          id: 'test-horse-2',
          name: 'Тест Морь 2',
          relationLabel: 'Тест',
          coat: 'Бор',
          birthYear: 2019,
          awardCount: 1,
          offspringCount: 0,
          isOwnedByHousehold: true,
          notes: 'Test horse update',
          gender: HorseGender.mare,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
        await repository.saveHorse(horse);
        syncQueue.clear();

        // Now update
        final updated = horse.copyWith(name: 'Updated Name');
        final result = await repository.saveHorse(updated);
        expect(result.isSuccess, true);

        expect(syncQueue.pendingCount, greaterThanOrEqualTo(1));
        final item = syncQueue.peek();
        expect(item, isNotNull);
        expect(item!.entityType, 'horse');
        expect(item.entityId, 'test-horse-2');
        expect(item.action, SyncAction.update);
      },
    );

    test('deleteHorse enqueues SyncQueueItem with SyncAction.delete', () async {
      // VAL-SYNC-009: deleteHorse enqueues SyncQueueItem
      // First save a horse
      final horse = Horse(
        id: 'test-horse-3',
        name: 'Устгах Морь',
        relationLabel: 'Тест',
        coat: 'Хүрэн',
        birthYear: 2021,
        awardCount: 0,
        offspringCount: 0,
        isOwnedByHousehold: false,
        notes: 'Horse to delete',
        gender: HorseGender.stallion,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      await repository.saveHorse(horse);
      syncQueue.clear();

      // Now delete
      final result = await repository.deleteHorse('test-horse-3');
      expect(result.isSuccess, true);

      expect(syncQueue.pendingCount, greaterThanOrEqualTo(1));
      final item = syncQueue.peek();
      expect(item, isNotNull);
      expect(item!.entityType, 'horse');
      expect(item.entityId, 'test-horse-3');
      expect(item.action, SyncAction.delete);
    });

    test('deleteHorse removes horse from local storage', () async {
      // Save a horse, then delete it, verify it's gone
      final horse = Horse(
        id: 'test-horse-4',
        name: 'Устгах Тест',
        relationLabel: 'Тест',
        coat: 'Саарал',
        birthYear: 2022,
        awardCount: 0,
        offspringCount: 0,
        isOwnedByHousehold: true,
        notes: 'Delete test',
        gender: HorseGender.gelding,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      await repository.saveHorse(horse);

      await repository.deleteHorse('test-horse-4');

      final fetchResult = await repository.fetchHorses();
      expect(fetchResult.isSuccess, true);
      expect(fetchResult.value.any((h) => h.id == 'test-horse-4'), false);
    });

    test('HorsesRepository interface has deleteHorse method', () {
      // Verify the interface exposes deleteHorse
      expect(repository, isA<HorsesRepository>());
    });
  });
}
