import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/shared/domain/event.dart';

// ═══════════════════════════════════════════════════════════════════
// VAL-EVENTS-001: EventType enum
// ═══════════════════════════════════════════════════════════════════
void main() {
  group('VAL-EVENTS-001: EventType enum', () {
    test('contains exactly 4 values: race, auction, expo, training', () {
      final values = EventType.values;

      expect(values.length, 4);
      expect(values, contains(EventType.race));
      expect(values, contains(EventType.auction));
      expect(values, contains(EventType.expo));
      expect(values, contains(EventType.training));
    });

    test('displayName returns correct Mongolian labels for each type', () {
      expect(EventType.race.displayName, 'Уралдаан');
      expect(EventType.auction.displayName, 'Дуудлага худалдаа');
      expect(EventType.expo.displayName, 'Үзэсгэлэн худалдаа');
      expect(EventType.training.displayName, 'Сургалт/Зөвлөгөө');
    });

    test('displayName is non-empty for all values', () {
      for (final type in EventType.values) {
        expect(type.displayName.isNotEmpty, isTrue,
            reason: '${type.name} should have a non-empty displayName');
      }
    });

    test('each EventType.name matches expected serialized name', () {
      expect(EventType.race.name, 'race');
      expect(EventType.auction.name, 'auction');
      expect(EventType.expo.name, 'expo');
      expect(EventType.training.name, 'training');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Event domain model
  // ═══════════════════════════════════════════════════════════════════
  group('Event', () {
    // ── Constructor ─────────────────────────────────────────

    test('constructor assigns all required fields', () {
      final event = Event(
        id: 'evt-1',
        horseId: 'horse-1',
        title: 'Уралдаан',
        eventType: EventType.race,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(event.id, 'evt-1');
      expect(event.horseId, 'horse-1');
      expect(event.title, 'Уралдаан');
      expect(event.eventType, EventType.race);
    });

    test('constructor default values for optional fields', () {
      final event = Event(
        id: 'evt-1',
        horseId: 'horse-1',
        title: 'Test',
        eventType: EventType.race,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(event.ownerId, '');
      expect(event.date, isNull);
      expect(event.horseName, isNull);
      expect(event.location, isNull);
      expect(event.latitude, isNull);
      expect(event.longitude, isNull);
      expect(event.result, isNull);
      expect(event.prizeAmount, isNull);
      expect(event.organizerName, isNull);
      expect(event.organizerPhone, isNull);
      expect(event.organizerEmail, isNull);
      expect(event.isFeatured, false);
      expect(event.registrationEnabled, false);
      expect(event.address, isNull);
      expect(event.notes, isNull);
      expect(event.photoUrls, []);
    });

    test('constructor assigns all fields including new fields', () {
      final event = Event(
        id: 'evt-2',
        horseId: 'horse-2',
        title: 'Дуудлага',
        eventType: EventType.auction,
        ownerId: 'user-1',
        date: DateTime(2026, 7, 15),
        horseName: 'Хан Хүлэг',
        location: 'Улаанбаатар',
        latitude: 47.92,
        longitude: 106.92,
        result: '1-р байр',
        prizeAmount: 500000,
        organizerName: 'Тэмцээний зохион байгуулагч',
        organizerPhone: '+976-9911-1111',
        organizerEmail: 'organizer@example.com',
        isFeatured: true,
        registrationEnabled: true,
        address: 'Төв цэнгэлдэх',
        notes: 'Жич',
        photoUrls: ['https://example.com/photo.jpg'],
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(event.id, 'evt-2');
      expect(event.horseId, 'horse-2');
      expect(event.title, 'Дуудлага');
      expect(event.eventType, EventType.auction);
      expect(event.ownerId, 'user-1');
      expect(event.date, DateTime(2026, 7, 15));
      expect(event.horseName, 'Хан Хүлэг');
      expect(event.location, 'Улаанбаатар');
      expect(event.latitude, 47.92);
      expect(event.longitude, 106.92);
      expect(event.result, '1-р байр');
      expect(event.prizeAmount, 500000);
      expect(event.organizerName, 'Тэмцээний зохион байгуулагч');
      expect(event.organizerPhone, '+976-9911-1111');
      expect(event.organizerEmail, 'organizer@example.com');
      expect(event.isFeatured, true);
      expect(event.registrationEnabled, true);
      expect(event.address, 'Төв цэнгэлдэх');
      expect(event.notes, 'Жич');
      expect(event.photoUrls, ['https://example.com/photo.jpg']);
    });

    // ── copyWith ────────────────────────────────────────────

    test('copyWith updates specified fields', () {
      final event = Event(
        id: 'evt-1',
        horseId: 'horse-1',
        title: 'Original',
        eventType: EventType.race,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final updated = event.copyWith(
        title: 'Updated',
        eventType: EventType.expo,
        isFeatured: true,
      );
      expect(updated.id, 'evt-1');
      expect(updated.title, 'Updated');
      expect(updated.eventType, EventType.expo);
      expect(updated.isFeatured, true);
    });

    test('copyWith with no args returns identical object', () {
      final event = Event(
        id: 'evt-1',
        horseId: 'horse-1',
        title: 'Test',
        eventType: EventType.race,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final same = event.copyWith();
      expect(same.id, event.id);
      expect(same.title, event.title);
      expect(same.eventType, event.eventType);
    });

    test('copyWith preserves unchanged fields', () {
      final event = Event(
        id: 'evt-1',
        horseId: 'horse-1',
        title: 'Test',
        eventType: EventType.training,
        ownerId: 'user-1',
        date: DateTime(2026, 7, 15),
        location: 'Улаанбаатар',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final updated = event.copyWith(title: 'New Title');
      expect(updated.id, 'evt-1');
      expect(updated.horseId, 'horse-1');
      expect(updated.eventType, EventType.training);
      expect(updated.ownerId, 'user-1');
      expect(updated.date, DateTime(2026, 7, 15));
      expect(updated.location, 'Улаанбаатар');
      expect(updated.title, 'New Title');
    });

    // ── Equality ────────────────────────────────────────────

    test('equality — identical events are equal', () {
      final a = Event(
        id: 'evt-1',
        horseId: 'horse-1',
        title: 'Уралдаан',
        eventType: EventType.race,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final b = Event(
        id: 'evt-1',
        horseId: 'horse-1',
        title: 'Уралдаан',
        eventType: EventType.race,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(a, b);
    });

    test('equality — different id makes events not equal', () {
      final a = Event(
        id: 'evt-1',
        horseId: 'horse-1',
        title: 'Уралдаан',
        eventType: EventType.race,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final b = Event(
        id: 'evt-2',
        horseId: 'horse-1',
        title: 'Уралдаан',
        eventType: EventType.race,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(a == b, false);
    });

    test('equality — different horseId makes events not equal', () {
      final a = Event(
        id: 'evt-1',
        horseId: 'horse-1',
        title: 'Уралдаан',
        eventType: EventType.race,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final b = Event(
        id: 'evt-1',
        horseId: 'horse-2',
        title: 'Уралдаан',
        eventType: EventType.race,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(a == b, false);
    });

    // ── isUpcoming ──────────────────────────────────────────

    test('isUpcoming returns true when date is null', () {
      final event = Event(
        id: 'evt-1',
        horseId: 'horse-1',
        title: 'Upcoming',
        eventType: EventType.race,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(event.isUpcoming, true);
    });

    test('isUpcoming returns true for future date', () {
      final event = Event(
        id: 'evt-1',
        horseId: 'horse-1',
        title: 'Future',
        eventType: EventType.race,
        date: DateTime.now().add(const Duration(days: 30)),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(event.isUpcoming, true);
    });

    test('isUpcoming returns false for past date', () {
      final event = Event(
        id: 'evt-1',
        horseId: 'horse-1',
        title: 'Past',
        eventType: EventType.race,
        date: DateTime.now().subtract(const Duration(days: 30)),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(event.isUpcoming, false);
    });

    // ── Serialization — Local JSON ──────────────────────────

    test('toJson serializes all fields including new fields', () {
      final event = Event(
        id: 'evt-1',
        horseId: 'horse-1',
        title: 'Уралдаан',
        eventType: EventType.race,
        ownerId: 'user-1',
        date: DateTime(2026, 7, 15, 10, 0),
        horseName: 'Хан Хүлэг',
        location: 'Улаанбаатар',
        latitude: 47.92,
        longitude: 106.92,
        result: '1-р байр',
        prizeAmount: 500000,
        organizerName: 'Зохион байгуулагч',
        organizerPhone: '+976-9911-1111',
        organizerEmail: 'org@example.com',
        isFeatured: true,
        registrationEnabled: true,
        address: 'Төв цэнгэлдэх',
        notes: 'Жич',
        photoUrls: ['https://example.com/photo.jpg'],
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final json = event.toJson();

      expect(json['id'], 'evt-1');
      expect(json['horseId'], 'horse-1');
      expect(json['title'], 'Уралдаан');
      expect(json['eventType'], 'race');
      expect(json['ownerId'], 'user-1');
      expect(json['date'], '2026-07-15T10:00:00.000');
      expect(json['horseName'], 'Хан Хүлэг');
      expect(json['location'], 'Улаанбаатар');
      expect(json['latitude'], 47.92);
      expect(json['longitude'], 106.92);
      expect(json['result'], '1-р байр');
      expect(json['prizeAmount'], 500000);
      expect(json['organizerName'], 'Зохион байгуулагч');
      expect(json['organizerPhone'], '+976-9911-1111');
      expect(json['organizerEmail'], 'org@example.com');
      expect(json['isFeatured'], true);
      expect(json['registrationEnabled'], true);
      expect(json['address'], 'Төв цэнгэлдэх');
      expect(json['notes'], 'Жич');
      expect(json['photoUrls'], ['https://example.com/photo.jpg']);
    });

    test('fromJson / toJson round-trip', () {
      final original = Event(
        id: 'evt-1',
        horseId: 'horse-1',
        title: 'Full Event',
        eventType: EventType.expo,
        ownerId: 'user-1',
        date: DateTime(2026, 8, 20),
        horseName: 'Test Horse',
        location: 'Дархан',
        latitude: 49.48,
        longitude: 105.92,
        result: '2-р байр',
        prizeAmount: 300000,
        organizerName: 'Organizer',
        organizerPhone: '+976-9900-0000',
        organizerEmail: 'org@test.mn',
        isFeatured: true,
        registrationEnabled: false,
        address: 'Address',
        notes: 'Note',
        photoUrls: ['https://example.com/a.jpg'],
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final json = original.toJson();
      final restored = Event.fromJson(json);

      expect(restored.id, original.id);
      expect(restored.horseId, original.horseId);
      expect(restored.title, original.title);
      expect(restored.eventType, original.eventType);
      expect(restored.ownerId, original.ownerId);
      expect(restored.date, original.date);
      expect(restored.horseName, original.horseName);
      expect(restored.location, original.location);
      expect(restored.latitude, original.latitude);
      expect(restored.longitude, original.longitude);
      expect(restored.result, original.result);
      expect(restored.prizeAmount, original.prizeAmount);
      expect(restored.organizerName, original.organizerName);
      expect(restored.organizerPhone, original.organizerPhone);
      expect(restored.organizerEmail, original.organizerEmail);
      expect(restored.isFeatured, original.isFeatured);
      expect(restored.registrationEnabled, original.registrationEnabled);
      expect(restored.address, original.address);
      expect(restored.notes, original.notes);
      expect(restored.photoUrls, original.photoUrls);
    });

    test('fromJson handles null optional fields', () {
      final json = {
        'id': 'evt-1',
        'horseId': 'horse-1',
        'title': 'Minimal',
        'eventType': 'race',
        'ownerId': '',
        'photoUrls': <String>[],
        'createdAt': '2026-01-01T00:00:00.000',
        'updatedAt': '2026-01-01T00:00:00.000',
      };
      final event = Event.fromJson(json);
      expect(event.date, isNull);
      expect(event.latitude, isNull);
      expect(event.longitude, isNull);
      expect(event.organizerName, isNull);
      expect(event.organizerPhone, isNull);
      expect(event.organizerEmail, isNull);
      expect(event.isFeatured, false);
      expect(event.registrationEnabled, false);
    });

    // ── Serialization — Supabase JSON ───────────────────────

    test('toSupabaseJson uses snake_case keys', () {
      final event = Event(
        id: 'evt-1',
        horseId: 'horse-1',
        title: 'Test',
        eventType: EventType.race,
        ownerId: 'user-1',
        date: DateTime(2026, 7, 15),
        latitude: 47.92,
        longitude: 106.92,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final json = event.toSupabaseJson(ownerId: 'user-1');

      expect(json['owner_id'], 'user-1');
      expect(json['id'], 'evt-1');
      expect(json['horse_id'], 'horse-1');
      expect(json['title'], 'Test');
      expect(json['event_type'], 'race');
      expect(json['latitude'], 47.92);
      expect(json['longitude'], 106.92);
      expect(json['updated_at'], isA<String>());
    });

    test('fromSupabaseJson / toSupabaseJson round-trip', () {
      final original = Event(
        id: 'evt-1',
        horseId: 'horse-1',
        title: 'Supabase Event',
        eventType: EventType.auction,
        ownerId: 'user-1',
        date: DateTime(2026, 9, 1),
        horseName: 'Морин',
        location: 'Ховд',
        latitude: 47.0,
        longitude: 91.0,
        isFeatured: true,
        registrationEnabled: true,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final json = original.toSupabaseJson(ownerId: 'user-1');
      final restored = Event.fromSupabaseJson(json);

      expect(restored.id, original.id);
      expect(restored.horseId, original.horseId);
      expect(restored.title, original.title);
      expect(restored.eventType, original.eventType);
      expect(restored.ownerId, original.ownerId);
      expect(restored.date, original.date);
      expect(restored.horseName, original.horseName);
      expect(restored.location, original.location);
      expect(restored.latitude, original.latitude);
      expect(restored.longitude, original.longitude);
      expect(restored.isFeatured, original.isFeatured);
      expect(restored.registrationEnabled, original.registrationEnabled);
    });

    // ── toString ────────────────────────────────────────────

    test('toString includes key fields', () {
      final event = Event(
        id: 'evt-1',
        horseId: 'horse-1',
        title: 'Уралдаан',
        eventType: EventType.race,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final str = event.toString();
      expect(str, contains('evt-1'));
      expect(str, contains('Уралдаан'));
      expect(str, contains('race'));
    });
  });
}
