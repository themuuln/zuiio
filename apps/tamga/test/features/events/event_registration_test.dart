import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/storage/isar_database.dart';

import '../../helpers/test_helpers.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';
import 'package:tamga/src/shared/domain/event_registration.dart';
import 'package:tamga/src/features/events/data/event_registration_repository.dart';
import 'package:tamga/src/features/events/data/local_event_registration_repository.dart';

void main() {
  group('EventRegistration Domain Model', () {
    test('has all required fields', () {
      final now = DateTime.now();
      final reg = EventRegistration(
        id: 'reg-1',
        eventId: 'evt-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        registeredAt: now,
        status: RegistrationStatus.registered,
        notes: 'Тэмдэглэл',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      expect(reg.id, 'reg-1');
      expect(reg.eventId, 'evt-1');
      expect(reg.horseId, 'horse-1');
      expect(reg.ownerId, 'user-1');
      expect(reg.registeredAt, now);
      expect(reg.status, RegistrationStatus.registered);
      expect(reg.notes, 'Тэмдэглэл');
    });

    test('supports status enum values', () {
      expect(RegistrationStatus.values, hasLength(3));
      expect(RegistrationStatus.registered.name, 'registered');
      expect(RegistrationStatus.confirmed.name, 'confirmed');
      expect(RegistrationStatus.cancelled.name, 'cancelled');
    });

    test('status displayName returns Mongolian labels', () {
      expect(RegistrationStatus.registered.displayName, 'Бүртгэгдсэн');
      expect(RegistrationStatus.confirmed.displayName, 'Баталгаажсан');
      expect(RegistrationStatus.cancelled.displayName, 'Цуцлагдсан');
    });

    test('copyWith preserves unchanged fields', () {
      final reg = EventRegistration(
        id: 'reg-1',
        eventId: 'evt-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        registeredAt: DateTime(2026, 6, 1),
        status: RegistrationStatus.registered,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final updated = reg.copyWith(status: RegistrationStatus.confirmed);
      expect(updated.id, 'reg-1');
      expect(updated.eventId, 'evt-1');
      expect(updated.horseId, 'horse-1');
      expect(updated.ownerId, 'user-1');
      expect(updated.status, RegistrationStatus.confirmed);
      expect(updated.notes, isNull);
    });

    test('toJson / fromJson round-trip', () {
      final reg = EventRegistration(
        id: 'reg-1',
        eventId: 'evt-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        registeredAt: DateTime(2026, 6, 1, 10, 30, 0, 0, 0),
        status: RegistrationStatus.registered,
        notes: 'Тэмдэглэл',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final json = reg.toJson();
      final restored = EventRegistration.fromJson(json);

      expect(restored.id, reg.id);
      expect(restored.eventId, reg.eventId);
      expect(restored.horseId, reg.horseId);
      expect(restored.ownerId, reg.ownerId);
      expect(restored.registeredAt, reg.registeredAt);
      expect(restored.status, reg.status);
      expect(restored.notes, reg.notes);
    });

    test('toSupabaseJson / fromSupabaseJson round-trip', () {
      final reg = EventRegistration(
        id: 'reg-1',
        eventId: 'evt-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        registeredAt: DateTime(2026, 6, 1, 10, 30, 0, 0, 0),
        status: RegistrationStatus.registered,
        notes: 'Тэмдэглэл',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final json = reg.toSupabaseJson();
      expect(json['event_id'], 'evt-1');
      expect(json['horse_id'], 'horse-1');
      expect(json['owner_id'], 'user-1');
      expect(json['status'], 'registered');

      final restored = EventRegistration.fromSupabaseJson(json);
      expect(restored.id, reg.id);
      expect(restored.eventId, reg.eventId);
      expect(restored.horseId, reg.horseId);
      expect(restored.ownerId, reg.ownerId);
      expect(restored.status, reg.status);
      expect(restored.notes, reg.notes);
    });

    test('equality works correctly', () {
      final a = EventRegistration(
        id: 'reg-1',
        eventId: 'evt-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        registeredAt: DateTime(2026, 6, 1),
        status: RegistrationStatus.registered,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final b = EventRegistration(
        id: 'reg-1',
        eventId: 'evt-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        registeredAt: DateTime(2026, 6, 1),
        status: RegistrationStatus.registered,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final c = EventRegistration(
        id: 'reg-2',
        eventId: 'evt-1',
        horseId: 'horse-2',
        ownerId: 'user-1',
        registeredAt: DateTime(2026, 6, 1),
        status: RegistrationStatus.registered,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      expect(a, b);
      expect(a == c, false);
    });

    test('default status is registered and notes is null', () {
      final reg = EventRegistration(
        id: 'reg-default',
        eventId: 'evt-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        registeredAt: DateTime(2026, 6, 1),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(reg.status, RegistrationStatus.registered);
      expect(reg.notes, isNull);
    });

    test('copyWith updates status', () {
      final reg = EventRegistration(
        id: 'reg-1',
        eventId: 'evt-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        registeredAt: DateTime(2026, 6, 1),
        status: RegistrationStatus.registered,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final cancelled = reg.copyWith(status: RegistrationStatus.cancelled);
      expect(cancelled.status, RegistrationStatus.cancelled);
      expect(cancelled.id, reg.id);
    });

    test('toSupabaseJson uses snake_case keys and includes updated_at', () {
      final reg = EventRegistration(
        id: 'reg-1',
        eventId: 'evt-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        registeredAt: DateTime(2026, 6, 1),
        status: RegistrationStatus.confirmed,
        notes: 'Confirmed',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final json = reg.toSupabaseJson();
      expect(json['event_id'], 'evt-1');
      expect(json['horse_id'], 'horse-1');
      expect(json['owner_id'], 'user-1');
      expect(json['registered_at'], isA<String>());
      expect(json['status'], 'confirmed');
      expect(json['notes'], 'Confirmed');
      expect(json['updated_at'], isA<String>());
    });

    test('fromJson handles null notes', () {
      final json = {
        'id': 'reg-1',
        'eventId': 'evt-1',
        'horseId': 'horse-1',
        'ownerId': 'user-1',
        'registeredAt': '2026-06-01T00:00:00.000',
        'status': 'registered',
        'createdAt': '2026-01-01T00:00:00.000',
        'updatedAt': '2026-01-01T00:00:00.000',
      };
      final reg = EventRegistration.fromJson(json);
      expect(reg.id, 'reg-1');
      expect(reg.notes, isNull);
      expect(reg.status, RegistrationStatus.registered);
    });

    test('toString includes key fields', () {
      final reg = EventRegistration(
        id: 'reg-1',
        eventId: 'evt-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        registeredAt: DateTime(2026, 6, 1),
        status: RegistrationStatus.registered,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final str = reg.toString();
      expect(str, contains('reg-1'));
      expect(str, contains('evt-1'));
      expect(str, contains('horse-1'));
      expect(str, contains('registered'));
    });
  });

  group('LocalEventRegistrationRepository', () {
    late SyncQueue syncQueue;
    late EventRegistrationRepository repository;

    setUp(() async {
      await setupTestEnvironment();
      await IsarDatabase.initialize();
      syncQueue = SyncQueue();
      repository = LocalEventRegistrationRepository(
        storage: IsarStorage.instance,
        syncQueue: syncQueue,
      );
    });

    tearDown(() async {
      await IsarDatabase.close();
    });

    test(
      'fetchRegistrations returns empty list for an event with no registrations',
      () async {
        final result = await repository.fetchRegistrations('evt-nonexistent');
        expect(result.isSuccess, true);
        expect(result.value, isEmpty);
      },
    );

    test('registerHorse creates a new registration', () async {
      final result = await repository.registerHorse(
        eventId: 'evt-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
      );

      expect(result.isSuccess, true);
      final reg = result.value;
      expect(reg.eventId, 'evt-1');
      expect(reg.horseId, 'horse-1');
      expect(reg.ownerId, 'user-1');
      expect(reg.status, RegistrationStatus.registered);
      expect(reg.notes, isNull);
    });

    test('registerHorse enqueues sync create action', () async {
      await repository.registerHorse(
        eventId: 'evt-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
      );

      expect(syncQueue.pendingCount, 1);
      final item = syncQueue.peek()!;
      expect(item.entityType, 'event_registration');
      expect(item.action, SyncAction.create);
    });

    test('registerHorse prevents duplicate registration', () async {
      await repository.registerHorse(
        eventId: 'evt-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
      );

      final duplicate = await repository.registerHorse(
        eventId: 'evt-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
      );

      expect(duplicate.isFailure, true);
    });

    test(
      'fetchRegistrations returns registrations for a specific event',
      () async {
        await repository.registerHorse(
          eventId: 'evt-1',
          horseId: 'horse-1',
          ownerId: 'user-1',
        );
        await repository.registerHorse(
          eventId: 'evt-1',
          horseId: 'horse-2',
          ownerId: 'user-1',
        );
        await repository.registerHorse(
          eventId: 'evt-2',
          horseId: 'horse-3',
          ownerId: 'user-1',
        );

        final result = await repository.fetchRegistrations('evt-1');
        expect(result.isSuccess, true);
        expect(result.value.length, 2);
        expect(result.value.every((r) => r.eventId == 'evt-1'), true);
      },
    );

    test('cancelRegistration updates status to cancelled', () async {
      final reg = await repository.registerHorse(
        eventId: 'evt-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
      );

      syncQueue.clear();

      final cancelResult = await repository.cancelRegistration(reg.value.id);
      expect(cancelResult.isSuccess, true);

      // After cancellation, fetch should still include it but with cancelled status
      final registrations = await repository.fetchRegistrations('evt-1');
      expect(registrations.value.length, 1);
      expect(registrations.value.first.status, RegistrationStatus.cancelled);
    });

    test('cancelRegistration enqueues sync update action', () async {
      final reg = await repository.registerHorse(
        eventId: 'evt-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
      );

      syncQueue.clear();
      await repository.cancelRegistration(reg.value.id);

      expect(syncQueue.pendingCount, 1);
      final item = syncQueue.peek()!;
      expect(item.entityType, 'event_registration');
      expect(item.action, SyncAction.update);
      expect(item.entityId, reg.value.id);
    });

    test(
      'cancelRegistration returns failure for non-existent registration',
      () async {
        final result = await repository.cancelRegistration('nonexistent');
        expect(result.isFailure, true);
      },
    );
  });
}
