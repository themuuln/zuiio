import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/teams/domain/team.dart';

void main() {
  // ══════════════════════════════════════════════════════════════
  // VAL-TEAM-001: Team domain model exists
  // ══════════════════════════════════════════════════════════════
  group('Team domain model', () {
    test('has all required fields', () {
      final now = DateTime(2026, 6, 18);
      final team = Team(
        id: 'team-1',
        name: 'Миний баг',
        ownerUserId: 'user-1',
        memberCount: 3,
        horseCount: 12,
        createdAt: now,
      );

      expect(team.id, 'team-1');
      expect(team.name, 'Миний баг');
      expect(team.ownerUserId, 'user-1');
      expect(team.memberCount, 3);
      expect(team.horseCount, 12);
      expect(team.createdAt, now);
    });

    test('has sensible defaults', () {
      final now = DateTime(2026, 6, 18);
      final team = Team(
        id: 'team-1',
        name: 'Баг',
        ownerUserId: 'user-1',
        createdAt: now,
      );

      expect(team.memberCount, 1);
      expect(team.horseCount, 0);
    });

    test('incrementHorseCount adds one', () {
      final now = DateTime(2026, 6, 18);
      final team = Team(
        id: 'team-1',
        name: 'Баг',
        ownerUserId: 'user-1',
        horseCount: 5,
        createdAt: now,
      );
      final updated = team.incrementHorseCount();
      expect(updated.horseCount, 6);
    });

    test('decrementHorseCount subtracts one', () {
      final now = DateTime(2026, 6, 18);
      final team = Team(
        id: 'team-1',
        name: 'Баг',
        ownerUserId: 'user-1',
        horseCount: 5,
        createdAt: now,
      );
      final updated = team.decrementHorseCount();
      expect(updated.horseCount, 4);
    });

    test('decrementHorseCount never goes below 0', () {
      final now = DateTime(2026, 6, 18);
      final team = Team(
        id: 'team-1',
        name: 'Баг',
        ownerUserId: 'user-1',
        horseCount: 0,
        createdAt: now,
      );
      final updated = team.decrementHorseCount();
      expect(updated.horseCount, 0);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // TEAM-001: copyWith
  // ══════════════════════════════════════════════════════════════
  group('Team copyWith', () {
    test('preserves unchanged fields', () {
      final now = DateTime(2026, 6, 18);
      final team = Team(
        id: 'team-1',
        name: 'Миний баг',
        ownerUserId: 'user-1',
        memberCount: 3,
        horseCount: 12,
        createdAt: now,
      );
      final updated = team.copyWith(name: 'Шинэ баг');
      expect(updated.id, 'team-1');
      expect(updated.name, 'Шинэ баг');
      expect(updated.ownerUserId, 'user-1');
      expect(updated.memberCount, 3);
      expect(updated.horseCount, 12);
      expect(updated.createdAt, now);
    });

    test('updates multiple fields', () {
      final now = DateTime(2026, 6, 18);
      final team = Team(
        id: 'team-1',
        name: 'Баг',
        ownerUserId: 'user-1',
        createdAt: now,
      );
      final updated = team.copyWith(
        name: 'Шинэ баг',
        memberCount: 5,
        horseCount: 10,
      );
      expect(updated.name, 'Шинэ баг');
      expect(updated.memberCount, 5);
      expect(updated.horseCount, 10);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-TEAM-001: Serialization
  // ══════════════════════════════════════════════════════════════
  group('Team serialization', () {
    test('toJson / fromJson round-trip', () {
      final now = DateTime(2026, 6, 18, 10, 0, 0, 0, 0);
      final team = Team(
        id: 'team-1',
        name: 'Миний баг',
        ownerUserId: 'user-1',
        memberCount: 5,
        horseCount: 12,
        createdAt: now,
      );

      final json = team.toJson();
      final restored = Team.fromJson(json);

      expect(restored.id, team.id);
      expect(restored.name, team.name);
      expect(restored.ownerUserId, team.ownerUserId);
      expect(restored.memberCount, team.memberCount);
      expect(restored.horseCount, team.horseCount);
      expect(restored.createdAt, team.createdAt);
    });

    test('toSupabaseJson / fromSupabaseJson round-trip', () {
      final now = DateTime(2026, 6, 18, 10, 0, 0, 0, 0);
      final team = Team(
        id: 'team-1',
        name: 'Миний баг',
        ownerUserId: 'user-1',
        memberCount: 5,
        horseCount: 12,
        createdAt: now,
      );

      final json = team.toSupabaseJson();
      expect(json['name'], 'Миний баг');
      expect(json['owner_user_id'], 'user-1');
      // member_count column was dropped — not in toSupabaseJson
      expect(json.containsKey('member_count'), isFalse);
      expect(json['horse_count'], 12);
      expect(json['updated_at'], isA<String>());

      final restored = Team.fromSupabaseJson(json);
      expect(restored.id, team.id);
      expect(restored.name, team.name);
      expect(restored.ownerUserId, team.ownerUserId);
      // memberCount defaults to 0 since member_count column was dropped
      expect(restored.memberCount, 0);
      expect(restored.horseCount, team.horseCount);
    });

    test('toJson uses camelCase keys', () {
      final now = DateTime(2026, 6, 18);
      final team = Team(
        id: 't1',
        name: 'Test',
        ownerUserId: 'u1',
        createdAt: now,
      );
      final json = team.toJson();
      expect(json.containsKey('ownerUserId'), isTrue);
      expect(json.containsKey('memberCount'), isTrue);
      expect(json.containsKey('horseCount'), isTrue);
      expect(json.containsKey('createdAt'), isTrue);
      expect(json.containsKey('owner_user_id'), isFalse);
      expect(json.containsKey('member_count'), isFalse);
    });

    test('toSupabaseJson uses snake_case keys', () {
      final now = DateTime(2026, 6, 18);
      final team = Team(
        id: 't1',
        name: 'Test',
        ownerUserId: 'u1',
        createdAt: now,
      );
      final json = team.toSupabaseJson();
      expect(json.containsKey('owner_user_id'), isTrue);
      // member_count column was dropped
      expect(json.containsKey('member_count'), isFalse);
      expect(json.containsKey('horse_count'), isTrue);
      expect(json.containsKey('created_at'), isTrue);
      expect(json.containsKey('ownerUserId'), isFalse);
      expect(json.containsKey('memberCount'), isFalse);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-TEAM-001: Equality
  // ══════════════════════════════════════════════════════════════
  group('Team equality', () {
    test('two teams with same id are equal', () {
      final now = DateTime(2026, 6, 18);
      final a = Team(
        id: 't1',
        name: 'Баг',
        ownerUserId: 'u1',
        createdAt: now,
      );
      final b = Team(
        id: 't1',
        name: 'Баг',
        ownerUserId: 'u1',
        createdAt: now,
      );
      expect(a, b);
    });

    test('two teams with different ids are not equal', () {
      final now = DateTime(2026, 6, 18);
      final a = Team(
        id: 't1',
        name: 'Баг',
        ownerUserId: 'u1',
        createdAt: now,
      );
      final b = Team(
        id: 't2',
        name: 'Баг',
        ownerUserId: 'u1',
        createdAt: now,
      );
      expect(a == b, isFalse);
    });

    test('toString includes key fields', () {
      final now = DateTime(2026, 6, 18);
      final team = Team(
        id: 't1',
        name: 'Тест баг',
        ownerUserId: 'u1',
        createdAt: now,
      );
      final str = team.toString();
      expect(str, contains('t1'));
      expect(str, contains('Тест баг'));
    });
  });
}
