import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/storage/isar_database.dart';

import '../../helpers/test_helpers.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';
import 'package:tamga/src/shared/domain/event.dart';
import 'package:tamga/src/features/events/data/local_event_repository.dart';

void main() {
  group('LocalEventRepository', () {
    late SyncQueue syncQueue;
    late LocalEventRepository repository;

    setUp(() async {
      await setupTestEnvironment();
      await IsarDatabase.initialize();
      syncQueue = SyncQueue();
      repository = LocalEventRepository(
        storage: IsarStorage.instance,
        syncQueue: syncQueue,
      );
    });

    tearDown(() async {
      await IsarDatabase.close();
    });

    test('fetchEvents returns empty list on first call', () async {
      final result = await repository.fetchEvents();
      expect(result.isSuccess, true);
      expect(result.value, isEmpty);
    });

    test('saveEvent adds a new event', () async {
      final event = Event(
        id: 'evt-1',
        horseId: 'khan-khuleg',
        title: 'Наадам',
        eventType: EventType.race,
        date: DateTime(2026, 7, 11),
        location: 'Төв аймаг',
        notes: 'Улсын наадам',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final result = await repository.saveEvent(event);
      expect(result.isSuccess, true);
      expect(result.value.id, 'evt-1');

      final fetch = await repository.fetchEvents();
      expect(fetch.value.length, 1);
    });

    test('saveEvent enqueues sync create action', () async {
      await repository.saveEvent(
        Event(
          id: 'evt-2',
          horseId: 'h1',
          title: 'Test',
          eventType: EventType.race,
          date: DateTime.now(),
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      );
      expect(syncQueue.pendingCount, 1);
      expect(syncQueue.peek()!.action, SyncAction.create);
      expect(syncQueue.peek()!.entityType, 'event');
    });

    test('saveEvent updates existing event', () async {
      await repository.saveEvent(
        Event(
          id: 'evt-1',
          horseId: 'h1',
          title: 'Original',
          eventType: EventType.race,
          date: DateTime(2026, 1, 1),
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      );
      syncQueue.clear();

      await repository.saveEvent(
        Event(
          id: 'evt-1',
          horseId: 'h1',
          title: 'Updated',
          eventType: EventType.race,
          date: DateTime(2026, 1, 1),
          result: '1-р байр',
          prizeAmount: 500000,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      );

      final fetch = await repository.fetchEvents();
      expect(fetch.value.length, 1);
      expect(fetch.value.first.title, 'Updated');
      expect(fetch.value.first.result, '1-р байр');
      expect(fetch.value.first.prizeAmount, 500000);

      expect(syncQueue.peek()!.action, SyncAction.update);
    });

    test('deleteEvent removes and enqueues delete', () async {
      await repository.saveEvent(
        Event(
          id: 'evt-1',
          horseId: 'h1',
          title: 'To Delete',
          eventType: EventType.training,
          date: DateTime.now(),
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      );
      syncQueue.clear();

      final del = await repository.deleteEvent('evt-1');
      expect(del.isSuccess, true);

      final fetch = await repository.fetchEvents();
      expect(fetch.value, isEmpty);

      expect(syncQueue.pendingCount, 1);
      expect(syncQueue.peek()!.action, SyncAction.delete);
    });

    test('fetchEventsByHorse returns only events for that horse', () async {
      await repository.saveEvent(
        Event(
          id: 'e1',
          horseId: 'h1',
          title: 'Race 1',
          eventType: EventType.race,
          date: DateTime(2026, 1, 1),
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      );
      await repository.saveEvent(
        Event(
          id: 'e2',
          horseId: 'h2',
          title: 'Race 2',
          eventType: EventType.race,
          date: DateTime(2026, 1, 2),
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      );
      await repository.saveEvent(
        Event(
          id: 'e3',
          horseId: 'h1',
          title: 'Race 3',
          eventType: EventType.auction,
          date: DateTime(2026, 1, 3),
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      );

      final horse1Events = await repository.fetchEventsByHorse('h1');
      expect(horse1Events.isSuccess, true);
      expect(horse1Events.value.length, 2);
      expect(horse1Events.value.every((e) => e.horseId == 'h1'), true);
    });

    test('model has correct equality', () {
      final e1 = Event(
        id: 'e1',
        horseId: 'h1',
        title: 'Test',
        eventType: EventType.race,
        date: null,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final e2 = Event(
        id: 'e1',
        horseId: 'h1',
        title: 'Test',
        eventType: EventType.race,
        date: null,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final e3 = Event(
        id: 'e2',
        horseId: 'h1',
        title: 'Test',
        eventType: EventType.race,
        date: null,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(e1, e2);
      expect(e1 == e3, false);
    });

    // ══════════════════════════════════════════════════════════════
    // VAL-EVENTS-034: Network failure — data preservation + sync
    // ══════════════════════════════════════════════════════════════
    test(
      'network failure simulation: event persists locally and SyncQueue has pending item',
      () async {
        // This test validates the offline-first resilience pattern:
        // LocalEventRepository always saves to Isar first and enqueues
        // to SyncQueue. Even if cloud sync fails later, the data
        // remains safe in Isar and the SyncQueue item stays pending.

        final event = Event(
          id: 'evt-net-1',
          horseId: 'h1',
          title: 'Сүлжээний алдаа',
          eventType: EventType.race,
          date: DateTime(2026, 7, 11),
          location: 'Тест байршил',
          organizerName: 'Тест зохион байгуулагч',
          organizerPhone: '99119911',
          isFeatured: false,
          registrationEnabled: true,
          notes: 'Сүлжээ тасарсан үед хадгалах тест',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        // Step 1: Save the event — always succeeds locally
        final result = await repository.saveEvent(event);
        expect(
          result.isSuccess,
          true,
          reason: 'Local save should succeed even when offline',
        );
        expect(result.value.id, 'evt-net-1');
        expect(result.value.title, 'Сүлжээний алдаа');

        // Step 2: Verify event persists in Isar (data preserved locally)
        final fetch = await repository.fetchEvents();
        expect(fetch.isSuccess, true);
        final savedEvents = fetch.value
            .where((e) => e.id == 'evt-net-1')
            .toList();
        expect(
          savedEvents.length,
          1,
          reason: 'Event must be readable from Isar after save',
        );

        final saved = savedEvents.first;
        expect(saved.title, 'Сүлжээний алдаа');
        expect(saved.location, 'Тест байршил');
        expect(saved.organizerName, 'Тест зохион байгуулагч');
        expect(saved.organizerPhone, '99119911');
        expect(saved.eventType, EventType.race);
        expect(saved.isFeatured, false);
        expect(saved.registrationEnabled, true);
        expect(saved.notes, 'Сүлжээ тасарсан үед хадгалах тест');

        // Step 3: Verify SyncQueue has a pending item for later cloud sync
        expect(
          syncQueue.pendingCount,
          greaterThanOrEqualTo(1),
          reason: 'SyncQueue must have a pending item',
        );

        final pendingItem = syncQueue.peek()!;
        expect(pendingItem.entityType, 'event');
        expect(pendingItem.entityId, 'evt-net-1');
        expect(pendingItem.action, SyncAction.create);
        expect(
          pendingItem.status,
          SyncItemStatus.pending,
          reason: 'SyncQueue item should be pending until synced',
        );

        // Step 4: Verify the SyncQueue item data matches the event
        expect(pendingItem.data['title'], 'Сүлжээний алдаа');
        expect(pendingItem.data['location'], 'Тест байршил');
        expect(pendingItem.data['eventType'], 'race');
      },
    );

    test(
      'fetchFeaturedEvents returns only featured events after offline save',
      () async {
        final featuredEvent = Event(
          id: 'evt-feat-1',
          horseId: 'h1',
          title: 'Онцлох үйл явдал',
          eventType: EventType.auction,
          date: DateTime(2026, 8, 1),
          isFeatured: true,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
        final nonFeaturedEvent = Event(
          id: 'evt-nonfeat-1',
          horseId: 'h1',
          title: 'Энгийн үйл явдал',
          eventType: EventType.training,
          date: DateTime(2026, 8, 15),
          isFeatured: false,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        await repository.saveEvent(featuredEvent);
        await repository.saveEvent(nonFeaturedEvent);

        final featured = await repository.fetchFeaturedEvents();
        expect(featured.isSuccess, true);
        expect(featured.value.length, 1);
        expect(featured.value.first.id, 'evt-feat-1');
        expect(featured.value.first.title, 'Онцлох үйл явдал');
      },
    );
  });
}
