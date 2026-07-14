import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/stable/domain/stable_member.dart';

void main() {
  // ── Helpers ────────────────────────────────────────────────────

  StableMember createMember({
    String id = 'member-1',
    String stableId = 'stable-1',
    String displayName = 'Баттулга',
    String phone = '99112233',
    StableRole role = StableRole.staff,
    bool isActive = true,
    String? email,
    List<String> horseIds = const ['horse-1'],
  }) {
    return StableMember(
      id: id,
      stableId: stableId,
      displayName: displayName,
      phone: phone,
      role: role,
      joinedAt: DateTime(2025, 3, 1),
      isActive: isActive,
      email: email,
      horseIds: horseIds,
    );
  }

  // ── Construction ──────────────────────────────────────────────

  group('StableMember construction', () {
    test('creates with required fields', () {
      final member = createMember();

      expect(member.id, 'member-1');
      expect(member.stableId, 'stable-1');
      expect(member.displayName, 'Баттулга');
      expect(member.phone, '99112233');
      expect(member.role, StableRole.staff);
      expect(member.isActive, isTrue);
      expect(member.horseIds, ['horse-1']);
    });

    test('defaults isActive to true', () {
      final member = StableMember(
        id: 'm1',
        stableId: 's1',
        displayName: 'Test',
        phone: '99112233',
        role: StableRole.client,
        joinedAt: DateTime(2025, 1, 1),
      );

      expect(member.isActive, isTrue);
      expect(member.horseIds, isEmpty);
      expect(member.email, isNull);
    });
  });

  // ── roleLabel ─────────────────────────────────────────────────

  group('roleLabel', () {
    test('owner returns correct label', () {
      final member = createMember(role: StableRole.owner);
      expect(member.roleLabel, 'Эзэмшигч');
    });

    test('staff returns correct label', () {
      final member = createMember(role: StableRole.staff);
      expect(member.roleLabel, 'Ажилтан');
    });

    test('client returns correct label', () {
      final member = createMember(role: StableRole.client);
      expect(member.roleLabel, 'Үйлчлүүлэгч');
    });
  });

  // ── copyWith ──────────────────────────────────────────────────

  group('copyWith', () {
    test('remains identical with no arguments', () {
      final member = createMember();
      final copy = member.copyWith();

      expect(copy.id, member.id);
      expect(copy.displayName, member.displayName);
      expect(copy.phone, member.phone);
    });

    test('overrides specified fields', () {
      final member = createMember();
      final copy = member.copyWith(
        displayName: 'Дуламсүрэн',
        role: StableRole.client,
        isActive: false,
      );

      expect(copy.displayName, 'Дуламсүрэн');
      expect(copy.role, StableRole.client);
      expect(copy.isActive, isFalse);
      expect(copy.id, member.id); // unchanged
    });

    test('replaces horseIds list', () {
      final member = createMember(horseIds: ['horse-1']);
      final copy = member.copyWith(horseIds: ['horse-2', 'horse-3']);

      expect(copy.horseIds, ['horse-2', 'horse-3']);
      expect(member.horseIds, ['horse-1']); // original unmodified
    });
  });

  // ── JSON serialization ────────────────────────────────────────

  group('JSON serialization', () {
    test('round-trips with all fields', () {
      final member = createMember(
        id: 'member-2',
        stableId: 'stable-1',
        displayName: 'Дуламсүрэн',
        phone: '88776655',
        email: 'dulam@test.mn',
        role: StableRole.client,
      );
      final json = member.toJson();
      final restored = StableMember.fromJson(json);

      expect(restored.id, member.id);
      expect(restored.displayName, member.displayName);
      expect(restored.phone, member.phone);
      expect(restored.email, member.email);
      expect(restored.role, member.role);
      expect(restored.joinedAt, member.joinedAt);
      expect(restored.isActive, member.isActive);
      expect(restored.horseIds, member.horseIds);
    });

    test('handles null email', () {
      final member = createMember();
      final json = member.toJson();
      final restored = StableMember.fromJson(json);

      expect(restored.email, isNull);
    });

    test('handles isActive default (null)', () {
      final json = {
        'id': 'm1',
        'stableId': 's1',
        'displayName': 'Test',
        'phone': '99112233',
        'role': 'client',
        'joinedAt': '2025-01-01T00:00:00.000',
      };
      final restored = StableMember.fromJson(json);

      expect(restored.isActive, isTrue);
    });

    test('handles empty horseIds', () {
      final member = createMember(horseIds: []);
      final json = member.toJson();
      final restored = StableMember.fromJson(json);

      expect(restored.horseIds, isEmpty);
    });
  });
}
