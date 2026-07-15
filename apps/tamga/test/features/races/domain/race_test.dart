import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/races/domain/race.dart';

void main() {
  // ══════════════════════════════════════════════════════════════
  // VAL-RACE-001: Race domain model exists with all required fields
  // ══════════════════════════════════════════════════════════════
  group('Race domain model', () {
    test('has all required fields with sensible defaults', () {
      final race = Race(id: 'race-1', name: 'Сур харваа');

      expect(race.id, 'race-1');
      expect(race.name, 'Сур харваа');
      expect(race.location, isNull);
      expect(race.date, isNull);
      expect(race.type, RaceType.local);
      expect(race.status, RaceStatus.upcoming);
      expect(race.maxEntries, isNull);
      expect(race.entryFee, 0);
      expect(race.organizerId, '');
      expect(race.description, isNull);
      expect(race.prizeDistribution, isNull);
    });

    test('constructs with all fields', () {
      final date = DateTime(2026, 7, 11);
      final race = Race(
        id: 'race-1',
        name: 'Улсын наадам',
        location: 'Төв аймаг',
        date: date,
        type: RaceType.naadam,
        status: RaceStatus.upcoming,
        maxEntries: 100,
        entryFee: 50000,
        organizerId: 'org-1',
        description: 'Улсын наадмын уралдаан',
        prizeDistribution: '1-р байр: 5 сая төгрөг',
      );

      expect(race.id, 'race-1');
      expect(race.name, 'Улсын наадам');
      expect(race.location, 'Төв аймаг');
      expect(race.date, date);
      expect(race.type, RaceType.naadam);
      expect(race.status, RaceStatus.upcoming);
      expect(race.maxEntries, 100);
      expect(race.entryFee, 50000);
      expect(race.organizerId, 'org-1');
      expect(race.description, 'Улсын наадмын уралдаан');
      expect(race.prizeDistribution, '1-р байр: 5 сая төгрөг');
    });

    test('isUpcoming returns true for upcoming status', () {
      final race = Race(id: '1', name: 'Test', status: RaceStatus.upcoming);
      expect(race.isUpcoming, isTrue);
      expect(race.isCompleted, isFalse);
    });

    test('isCompleted returns true for completed status', () {
      final race = Race(id: '1', name: 'Test', status: RaceStatus.completed);
      expect(race.isCompleted, isTrue);
      expect(race.isUpcoming, isFalse);
    });

    test('hasMaxEntries returns true when maxEntries is positive', () {
      final race = Race(id: '1', name: 'Test', maxEntries: 10);
      expect(race.hasMaxEntries, isTrue);
    });

    test('hasMaxEntries returns false when maxEntries is null', () {
      final race = Race(id: '1', name: 'Test', maxEntries: null);
      expect(race.hasMaxEntries, isFalse);
    });

    test('hasMaxEntries returns false when maxEntries is 0', () {
      final race = Race(id: '1', name: 'Test', maxEntries: 0);
      expect(race.hasMaxEntries, isFalse);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-RACE-002: RaceStatus enum has correct values and display names
  // ══════════════════════════════════════════════════════════════
  group('RaceStatus enum', () {
    test('has 4 values', () {
      expect(RaceStatus.values, hasLength(4));
    });

    test('values have correct names', () {
      expect(RaceStatus.upcoming.name, 'upcoming');
      expect(RaceStatus.ongoing.name, 'ongoing');
      expect(RaceStatus.completed.name, 'completed');
      expect(RaceStatus.cancelled.name, 'cancelled');
    });

    test('displayName returns Mongolian labels', () {
      expect(RaceStatus.upcoming.displayName, 'Удахгүй');
      expect(RaceStatus.ongoing.displayName, 'Үргэлжилж буй');
      expect(RaceStatus.completed.displayName, 'Дууссан');
      expect(RaceStatus.cancelled.displayName, 'Цуцлагдсан');
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-RACE-003: RaceType enum has correct values and display names
  // ══════════════════════════════════════════════════════════════
  group('RaceType enum', () {
    test('has 3 values', () {
      expect(RaceType.values, hasLength(3));
    });

    test('values have correct names', () {
      expect(RaceType.naadam.name, 'naadam');
      expect(RaceType.regional.name, 'regional');
      expect(RaceType.local.name, 'local');
    });

    test('displayName returns Mongolian labels', () {
      expect(RaceType.naadam.displayName, 'Наадам');
      expect(RaceType.regional.displayName, 'Бүс');
      expect(RaceType.local.displayName, 'Орон нутгийн');
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-RACE-004: Race serialization round-trips correctly
  // ══════════════════════════════════════════════════════════════
  group('Race serialization', () {
    test('toJson / fromJson round-trip', () {
      final race = Race(
        id: 'race-1',
        name: 'Уралдаан',
        location: 'Байршил',
        date: DateTime(2026, 7, 11, 10, 0, 0, 0, 0),
        type: RaceType.naadam,
        status: RaceStatus.upcoming,
        maxEntries: 50,
        entryFee: 20000,
        organizerId: 'org-1',
        description: 'Тэмцээн',
        prizeDistribution: '1: 1 сая',
      );

      final json = race.toJson();
      final restored = Race.fromJson(json);

      expect(restored.id, race.id);
      expect(restored.name, race.name);
      expect(restored.location, race.location);
      expect(restored.date, race.date);
      expect(restored.type, race.type);
      expect(restored.status, race.status);
      expect(restored.maxEntries, race.maxEntries);
      expect(restored.entryFee, race.entryFee);
      expect(restored.organizerId, race.organizerId);
      expect(restored.description, race.description);
      expect(restored.prizeDistribution, race.prizeDistribution);
    });

    test('toSupabaseJson / fromSupabaseJson round-trip', () {
      final race = Race(
        id: 'race-1',
        name: 'Уралдаан',
        location: 'Байршил',
        date: DateTime(2026, 7, 11, 10, 0, 0, 0, 0),
        type: RaceType.naadam,
        status: RaceStatus.upcoming,
        maxEntries: 50,
        entryFee: 20000,
        organizerId: 'org-1',
        description: 'Тэмцээн',
        prizeDistribution: '1: 1 сая',
      );

      final json = race.toSupabaseJson();
      expect(json['type'], 'naadam');
      expect(json['max_entries'], 50);
      expect(json['entry_fee'], 20000);
      expect(json['prize_distribution'], '1: 1 сая');
      expect(json['updated_at'], isA<String>());

      final restored = Race.fromSupabaseJson(json);
      expect(restored.id, race.id);
      expect(restored.name, race.name);
      expect(restored.type, race.type);
      expect(restored.status, race.status);
      expect(restored.maxEntries, race.maxEntries);
      expect(restored.entryFee, race.entryFee);
      expect(restored.prizeDistribution, race.prizeDistribution);
    });

    test('fromJson handles null values', () {
      final json = {
        'id': 'race-1',
        'name': 'Simple Race',
        'type': 'local',
        'status': 'upcoming',
      };
      final race = Race.fromJson(json);
      expect(race.id, 'race-1');
      expect(race.name, 'Simple Race');
      expect(race.location, isNull);
      expect(race.date, isNull);
      expect(race.type, RaceType.local);
      expect(race.status, RaceStatus.upcoming);
      expect(race.maxEntries, isNull);
      expect(race.entryFee, 0);
      expect(race.organizerId, '');
    });

    test('fromSupabaseJson handles null values', () {
      final json = {
        'id': 'race-1',
        'name': 'Simple Race',
        'type': 'local',
        'status': 'upcoming',
      };
      final race = Race.fromSupabaseJson(json);
      expect(race.id, 'race-1');
      expect(race.name, 'Simple Race');
      expect(race.type, RaceType.local);
      expect(race.status, RaceStatus.upcoming);
      expect(race.location, isNull);
      expect(race.maxEntries, isNull);
      expect(race.entryFee, 0);
    });

    test('toSupabaseJson uses snake_case keys', () {
      final race = Race(
        id: 'r1',
        name: 'Test',
        type: RaceType.regional,
        status: RaceStatus.ongoing,
      );
      final json = race.toSupabaseJson();
      expect(json['id'], 'r1');
      expect(json['name'], 'Test');
      expect(json.containsKey('max_entries'), isTrue);
      expect(json.containsKey('entry_fee'), isTrue);
      expect(json.containsKey('organizer_id'), isTrue);
      expect(json.containsKey('prize_distribution'), isTrue);
      expect(json.containsKey('updated_at'), isTrue);
      // Make sure camelCase keys are NOT in the supabase JSON
      expect(json.containsKey('maxEntries'), isFalse);
      expect(json.containsKey('entryFee'), isFalse);
      expect(json.containsKey('organizerId'), isFalse);
      expect(json.containsKey('prizeDistribution'), isFalse);
    });

    test('toJson uses camelCase keys', () {
      final race = Race(id: 'r1', name: 'Test');
      final json = race.toJson();
      expect(json.containsKey('maxEntries'), isTrue);
      expect(json.containsKey('entryFee'), isTrue);
      expect(json.containsKey('organizerId'), isTrue);
      expect(json.containsKey('prizeDistribution'), isTrue);
      // Make sure snake_case keys are NOT in the local JSON
      expect(json.containsKey('max_entries'), isFalse);
      expect(json.containsKey('entry_fee'), isFalse);
      expect(json.containsKey('organizer_id'), isFalse);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-RACE-005: Race equality is correct
  // ══════════════════════════════════════════════════════════════
  group('Race equality and copyWith', () {
    test('two races with same id are equal', () {
      final a = Race(id: 'r1', name: 'Race A', type: RaceType.naadam);
      final b = Race(id: 'r1', name: 'Race A', type: RaceType.naadam);
      expect(a, b);
    });

    test('two races with different ids are not equal', () {
      final a = Race(id: 'r1', name: 'Race');
      final b = Race(id: 'r2', name: 'Race');
      expect(a == b, isFalse);
    });

    test('copyWith preserves unchanged fields', () {
      final race = Race(
        id: 'r1',
        name: 'Original',
        location: 'Location',
        description: 'Desc',
      );
      final updated = race.copyWith(name: 'Updated');
      expect(updated.id, 'r1');
      expect(updated.name, 'Updated');
      expect(updated.location, 'Location');
      expect(updated.description, 'Desc');
    });

    test('copyWith updates multiple fields', () {
      final race = Race(id: 'r1', name: 'Old');
      final updated = race.copyWith(
        name: 'New',
        status: RaceStatus.completed,
        maxEntries: 10,
      );
      expect(updated.name, 'New');
      expect(updated.status, RaceStatus.completed);
      expect(updated.maxEntries, 10);
      expect(updated.id, 'r1');
    });

    test('toString includes key fields', () {
      final race = Race(id: 'r1', name: 'Тест', type: RaceType.local);
      final str = race.toString();
      expect(str, contains('r1'));
      expect(str, contains('Тест'));
      expect(str, contains('local'));
    });
  });
}
