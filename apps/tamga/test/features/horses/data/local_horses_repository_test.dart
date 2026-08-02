import 'package:flutter_test/flutter_test.dart';
import 'package:isar/isar.dart';
import 'package:tamga/src/core/storage/isar_database.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/horses/data/local_horses_repository.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';
import 'package:tamga/src/shared/domain/horse.dart';

import '../../../helpers/test_helpers.dart';

Horse _horse({
  String id = 'h1',
  String name = 'Тест Морь',
  bool isOwnedByHousehold = true,
}) {
  return Horse(
    id: id,
    ownerId: 'owner-1',
    name: name,
    relationLabel: '',
    coat: 'Хээр',
    birthYear: 2020,
    awardCount: 0,
    offspringCount: 0,
    isOwnedByHousehold: isOwnedByHousehold,
    notes: '',
    gender: HorseGender.gelding,
    createdAt: DateTime(2026, 1, 1),
    updatedAt: DateTime(2026, 1, 1),
  );
}

void main() {
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

  group('LocalHorsesRepository', () {
    test('fetchHorses seeds six default horses on an empty database', () async {
      final result = await repository.fetchHorses();

      expect(result.isSuccess, true);
      expect(result.value, hasLength(6));
      expect(result.value.map((h) => h.id), contains('khan-khuleg'));
      expect(result.value.every((h) => h.id.isNotEmpty), true);
    });

    test(
      'fetchHorses returns saved horses without contacting network',
      () async {
        await repository.saveHorse(_horse(id: 'saved-1', name: 'Хадгалсан'));

        final result = await repository.fetchHorses();

        expect(result.isSuccess, true);
        expect(result.value.any((h) => h.id == 'saved-1'), true);
        expect(
          result.value.singleWhere((h) => h.id == 'saved-1').name,
          'Хадгалсан',
        );
      },
    );

    test(
      'fetchHorsesPaginated seeds when empty and reports the total',
      () async {
        final result = await repository.fetchHorsesPaginated(page: 0, limit: 3);

        expect(result.isSuccess, true);
        expect(result.value.items, hasLength(3));
        expect(result.value.totalCount, 6);
      },
    );

    test('fetchHorsesPaginated returns successive pages', () async {
      final page0 = (await repository.fetchHorsesPaginated(
        page: 0,
        limit: 2,
      )).value;
      final page1 = (await repository.fetchHorsesPaginated(
        page: 1,
        limit: 2,
      )).value;
      final page2 = (await repository.fetchHorsesPaginated(
        page: 2,
        limit: 2,
      )).value;

      expect(page0.items, hasLength(2));
      expect(page1.items, hasLength(2));
      expect(page2.items, hasLength(2));
      expect(page0.totalCount, 6);
      expect(page0.items.first.id, isNot(page1.items.first.id));
      final page0Ids = page0.items.map((h) => h.id).toSet();
      expect(
        page2.items.map((h) => h.id).toSet().intersection(page0Ids),
        isEmpty,
      );
    });

    test('fetchHorsesPaginated beyond the data returns empty items', () async {
      final result = await repository.fetchHorsesPaginated(page: 99, limit: 10);

      expect(result.isSuccess, true);
      expect(result.value.items, isEmpty);
      expect(result.value.totalCount, 6);
    });

    test('fetchHorsesPaginated seeding is idempotent', () async {
      await repository.fetchHorsesPaginated(page: 0, limit: 3);

      final second = await repository.fetchHorsesPaginated(page: 0, limit: 10);

      expect(second.value.totalCount, 6);
      expect(second.value.items, hasLength(6));
    });

    test('saveHorse persists the horse to Isar storage', () async {
      final result = await repository.saveHorse(_horse(id: 'persist-1'));

      expect(result.isSuccess, true);
      expect(result.value.id, 'persist-1');

      final stored = await IsarStorage.instance.horses.where().findAll();
      expect(stored.any((e) => e.domainId == 'persist-1'), true);
    });

    test('saveHorse on an existing id updates without duplicating', () async {
      await repository.saveHorse(_horse(id: 'upd-1', name: 'Хуучин нэр'));

      final result = await repository.saveHorse(
        _horse(id: 'upd-1', name: 'Шинэ нэр'),
      );

      expect(result.isSuccess, true);
      final horses = (await repository.fetchHorses()).value;
      final matches = horses.where((h) => h.id == 'upd-1').toList();
      expect(matches, hasLength(1));
      expect(matches.single.name, 'Шинэ нэр');
    });

    test('deleteHorse for a missing id is a successful no-op', () async {
      final result = await repository.deleteHorse('missing-horse');

      expect(result.isSuccess, true);
      expect(syncQueue.pendingCount, 0);
    });
  });
}
