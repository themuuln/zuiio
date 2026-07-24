import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/races/domain/race_entry.dart';

void main() {
  // ══════════════════════════════════════════════════════════════
  // VAL-RACE-006: RaceEntry domain model exists with all required fields
  // ══════════════════════════════════════════════════════════════
  group('RaceEntry domain model', () {
    test('has all required fields with defaults', () {
      final entry = RaceEntry(
        id: 'entry-1',
        raceId: 'race-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
      );

      expect(entry.id, 'entry-1');
      expect(entry.raceId, 'race-1');
      expect(entry.horseId, 'horse-1');
      expect(entry.ownerId, 'user-1');
      expect(entry.jockeyName, isNull);
      expect(entry.status, RaceEntryStatus.registered);
      expect(entry.result, isNull);
      expect(entry.placement, isNull);
      expect(entry.prize, isNull);
    });

    test('constructs with all fields', () {
      final entry = RaceEntry(
        id: 'entry-1',
        raceId: 'race-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        jockeyName: 'Бат',
        status: RaceEntryStatus.confirmed,
        result: '2:30.5',
        placement: 1,
        prize: 1000000,
      );

      expect(entry.id, 'entry-1');
      expect(entry.raceId, 'race-1');
      expect(entry.horseId, 'horse-1');
      expect(entry.ownerId, 'user-1');
      expect(entry.jockeyName, 'Бат');
      expect(entry.status, RaceEntryStatus.confirmed);
      expect(entry.result, '2:30.5');
      expect(entry.placement, 1);
      expect(entry.prize, 1000000);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-RACE-007: RaceEntryStatus enum has correct values and display names
  // ══════════════════════════════════════════════════════════════
  group('RaceEntryStatus enum', () {
    test('has 4 values', () {
      expect(RaceEntryStatus.values, hasLength(4));
    });

    test('values have correct names', () {
      expect(RaceEntryStatus.registered.name, 'registered');
      expect(RaceEntryStatus.confirmed.name, 'confirmed');
      expect(RaceEntryStatus.competed.name, 'competed');
      expect(RaceEntryStatus.scratched.name, 'scratched');
    });

    test('displayName returns Mongolian labels', () {
      expect(RaceEntryStatus.registered.displayName, 'Бүртгэгдсэн');
      expect(RaceEntryStatus.confirmed.displayName, 'Баталгаажсан');
      expect(RaceEntryStatus.competed.displayName, 'Оролцсон');
      expect(RaceEntryStatus.scratched.displayName, 'Татгалзсан');
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-RACE-008: RaceEntry serialization round-trips correctly
  // ══════════════════════════════════════════════════════════════
  group('RaceEntry serialization', () {
    test('toJson / fromJson round-trip', () {
      final entry = RaceEntry(
        id: 'entry-1',
        raceId: 'race-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        jockeyName: 'Бат',
        status: RaceEntryStatus.confirmed,
        result: '2:30.5',
        placement: 1,
        prize: 1000000,
      );

      final json = entry.toJson();
      final restored = RaceEntry.fromJson(json);

      expect(restored.id, entry.id);
      expect(restored.raceId, entry.raceId);
      expect(restored.horseId, entry.horseId);
      expect(restored.ownerId, entry.ownerId);
      expect(restored.jockeyName, entry.jockeyName);
      expect(restored.status, entry.status);
      expect(restored.result, entry.result);
      expect(restored.placement, entry.placement);
      expect(restored.prize, entry.prize);
    });

    test('toSupabaseJson / fromSupabaseJson round-trip', () {
      final entry = RaceEntry(
        id: 'entry-1',
        raceId: 'race-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        jockeyName: 'Бат',
        status: RaceEntryStatus.competed,
        result: '2:30.5',
        placement: 1,
        prize: 1000000,
      );

      final json = entry.toSupabaseJson();
      expect(json['race_id'], 'race-1');
      expect(json['horse_id'], 'horse-1');
      expect(json['jockey_name'], 'Бат');
      expect(json['status'], 'competed');
      expect(json['placement'], 1);
      expect(json['updated_at'], isA<String>());

      final restored = RaceEntry.fromSupabaseJson(json);
      expect(restored.id, entry.id);
      expect(restored.raceId, entry.raceId);
      expect(restored.horseId, entry.horseId);
      expect(restored.jockeyName, entry.jockeyName);
      expect(restored.status, entry.status);
      expect(restored.result, entry.result);
      expect(restored.placement, entry.placement);
      expect(restored.prize, entry.prize);
    });

    test('fromJson handles null values', () {
      final json = {
        'id': 'entry-1',
        'raceId': 'race-1',
        'horseId': 'horse-1',
        'ownerId': 'user-1',
      };
      final entry = RaceEntry.fromJson(json);
      expect(entry.jockeyName, isNull);
      expect(entry.status, RaceEntryStatus.registered);
      expect(entry.result, isNull);
      expect(entry.placement, isNull);
      expect(entry.prize, isNull);
    });

    test('toSupabaseJson uses snake_case keys', () {
      final entry = RaceEntry(
        id: 'e1',
        raceId: 'r1',
        horseId: 'h1',
        ownerId: 'u1',
        jockeyName: 'Name',
      );
      final json = entry.toSupabaseJson();
      expect(json.containsKey('race_id'), isTrue);
      expect(json.containsKey('horse_id'), isTrue);
      expect(json.containsKey('jockey_name'), isTrue);
      expect(json.containsKey('updated_at'), isTrue);
      // camelCase keys should not be present in supabase JSON
      expect(json.containsKey('raceId'), isFalse);
      expect(json.containsKey('horseId'), isFalse);
      expect(json.containsKey('jockeyName'), isFalse);
    });

    test('toJson uses camelCase keys', () {
      final entry = RaceEntry(
        id: 'e1',
        raceId: 'r1',
        horseId: 'h1',
        ownerId: 'u1',
      );
      final json = entry.toJson();
      expect(json.containsKey('raceId'), isTrue);
      expect(json.containsKey('horseId'), isTrue);
      expect(json.containsKey('jockeyName'), isTrue);
      // snake_case keys should not be present in local JSON
      expect(json.containsKey('race_id'), isFalse);
      expect(json.containsKey('horse_id'), isFalse);
      expect(json.containsKey('jockey_name'), isFalse);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-RACE-009: RaceEntry equality is correct
  // ══════════════════════════════════════════════════════════════
  group('RaceEntry equality and copyWith', () {
    test('two entries with same id are equal', () {
      final a = RaceEntry(id: 'e1', raceId: 'r1', horseId: 'h1', ownerId: 'u1');
      final b = RaceEntry(id: 'e1', raceId: 'r1', horseId: 'h1', ownerId: 'u1');
      expect(a, b);
    });

    test('two entries with different ids are not equal', () {
      final a = RaceEntry(id: 'e1', raceId: 'r1', horseId: 'h1', ownerId: 'u1');
      final b = RaceEntry(id: 'e2', raceId: 'r1', horseId: 'h1', ownerId: 'u1');
      expect(a == b, isFalse);
    });

    test('copyWith preserves unchanged fields', () {
      final entry = RaceEntry(
        id: 'e1',
        raceId: 'r1',
        horseId: 'h1',
        ownerId: 'u1',
        jockeyName: 'Original',
        status: RaceEntryStatus.registered,
        result: null,
        placement: null,
        prize: null,
      );
      final updated = entry.copyWith(
        status: RaceEntryStatus.competed,
        result: '1:30',
        placement: 1,
        prize: 500000,
      );
      expect(updated.id, 'e1');
      expect(updated.raceId, 'r1');
      expect(updated.horseId, 'h1');
      expect(updated.ownerId, 'u1');
      expect(updated.jockeyName, 'Original');
      expect(updated.status, RaceEntryStatus.competed);
      expect(updated.result, '1:30');
      expect(updated.placement, 1);
      expect(updated.prize, 500000);
    });

    test('copyWith sets status to scratched for cancellation', () {
      final entry = RaceEntry(
        id: 'e1',
        raceId: 'r1',
        horseId: 'h1',
        ownerId: 'u1',
        status: RaceEntryStatus.registered,
      );
      final cancelled = entry.copyWith(status: RaceEntryStatus.scratched);
      expect(cancelled.status, RaceEntryStatus.scratched);
    });

    test('toString includes key fields', () {
      final entry = RaceEntry(
        id: 'e1',
        raceId: 'r1',
        horseId: 'h1',
        ownerId: 'u1',
        status: RaceEntryStatus.registered,
      );
      final str = entry.toString();
      expect(str, contains('e1'));
      expect(str, contains('r1'));
      expect(str, contains('h1'));
      expect(str, contains('registered'));
    });
  });
}
