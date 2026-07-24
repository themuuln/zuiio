import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/teams/domain/team_member.dart';

void main() {
  // ══════════════════════════════════════════════════════════════
  // VAL-TEAM-002: TeamRole enum
  // ══════════════════════════════════════════════════════════════
  group('TeamRole enum', () {
    test('has 5 values', () {
      expect(TeamRole.values, hasLength(5));
    });

    test('values have correct names', () {
      expect(TeamRole.owner.name, 'owner');
      expect(TeamRole.manager.name, 'manager');
      expect(TeamRole.vet.name, 'vet');
      expect(TeamRole.groom.name, 'groom');
      expect(TeamRole.viewer.name, 'viewer');
    });

    test('displayName returns Mongolian labels', () {
      expect(TeamRole.owner.displayName, 'Эзэмшигч');
      expect(TeamRole.manager.displayName, 'Менежер');
      expect(TeamRole.vet.displayName, 'Эмч');
      expect(TeamRole.groom.displayName, 'Тэжээвэр');
      expect(TeamRole.viewer.displayName, 'Үзэгч');
    });

    test('owner has all permissions', () {
      expect(
        TeamRole.owner.defaultPermissions,
        containsAll(TeamPermission.values),
      );
    });

    test('manager has management permissions', () {
      final perms = TeamRole.manager.defaultPermissions;
      expect(perms, contains(TeamPermission.inviteMembers));
      expect(perms, contains(TeamPermission.removeMembers));
      expect(perms, contains(TeamPermission.updateRoles));
      expect(perms, contains(TeamPermission.manageHorses));
      expect(perms, contains(TeamPermission.viewFinancial));
    });

    test('vet has health-related permissions', () {
      final perms = TeamRole.vet.defaultPermissions;
      expect(perms, contains(TeamPermission.viewHealth));
      expect(perms, contains(TeamPermission.manageHealth));
      expect(perms, isNot(contains(TeamPermission.inviteMembers)));
      expect(perms, isNot(contains(TeamPermission.manageHorses)));
    });

    test('groom has training-related permissions', () {
      final perms = TeamRole.groom.defaultPermissions;
      expect(perms, contains(TeamPermission.viewTraining));
      expect(perms, contains(TeamPermission.manageTraining));
      expect(perms, isNot(contains(TeamPermission.inviteMembers)));
      expect(perms, isNot(contains(TeamPermission.manageHealth)));
    });

    test('viewer has only read permissions', () {
      final perms = TeamRole.viewer.defaultPermissions;
      expect(perms, contains(TeamPermission.viewHealth));
      expect(perms, contains(TeamPermission.viewTraining));
      expect(perms, isNot(contains(TeamPermission.inviteMembers)));
      expect(perms, isNot(contains(TeamPermission.manageHealth)));
      expect(perms, isNot(contains(TeamPermission.manageTraining)));
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-TEAM-002: TeamPermission enum
  // ══════════════════════════════════════════════════════════════
  group('TeamPermission enum', () {
    test('has all permission types', () {
      expect(TeamPermission.values, hasLength(9));
    });

    test('displayName returns Mongolian labels', () {
      expect(TeamPermission.inviteMembers.displayName, 'Гишүүд урих');
      expect(TeamPermission.removeMembers.displayName, 'Гишүүд хасах');
      expect(TeamPermission.updateRoles.displayName, 'Дүр өөрчлөх');
      expect(TeamPermission.manageHorses.displayName, 'Морь удирдах');
      expect(TeamPermission.viewHealth.displayName, 'Эрүүл мэнд харах');
      expect(TeamPermission.manageHealth.displayName, 'Эрүүл мэнд удирдах');
      expect(TeamPermission.viewTraining.displayName, 'Сургалт харах');
      expect(TeamPermission.manageTraining.displayName, 'Сургалт удирдах');
      expect(TeamPermission.viewFinancial.displayName, 'Санхүү харах');
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-TEAM-002: TeamMember domain model
  // ══════════════════════════════════════════════════════════════
  group('TeamMember domain model', () {
    test('has all required fields', () {
      final now = DateTime(2026, 6, 18);
      final member = TeamMember(
        id: 'member-1',
        teamId: 'team-1',
        userId: 'user-1',
        role: TeamRole.manager,
        permissions: [TeamPermission.inviteMembers],
        joinedAt: now,
      );

      expect(member.id, 'member-1');
      expect(member.teamId, 'team-1');
      expect(member.userId, 'user-1');
      expect(member.role, TeamRole.manager);
      expect(member.permissions, [TeamPermission.inviteMembers]);
      expect(member.joinedAt, now);
    });

    test('has sensible defaults for permissions', () {
      final now = DateTime(2026, 6, 18);
      final member = TeamMember(
        id: 'member-1',
        teamId: 'team-1',
        userId: 'user-1',
        role: TeamRole.viewer,
        joinedAt: now,
      );

      expect(member.permissions, isEmpty);
    });

    test(
      'effectivePermissions returns role defaults when permissions empty',
      () {
        final now = DateTime(2026, 6, 18);
        final member = TeamMember(
          id: 'member-1',
          teamId: 'team-1',
          userId: 'user-1',
          role: TeamRole.vet,
          joinedAt: now,
        );

        final effective = member.effectivePermissions;
        expect(effective, TeamRole.vet.defaultPermissions);
        expect(effective, contains(TeamPermission.viewHealth));
        expect(effective, contains(TeamPermission.manageHealth));
      },
    );

    test('effectivePermissions returns custom permissions when set', () {
      final now = DateTime(2026, 6, 18);
      final member = TeamMember(
        id: 'member-1',
        teamId: 'team-1',
        userId: 'user-1',
        role: TeamRole.viewer,
        permissions: [TeamPermission.manageHorses, TeamPermission.viewHealth],
        joinedAt: now,
      );

      final effective = member.effectivePermissions;
      expect(effective, [
        TeamPermission.manageHorses,
        TeamPermission.viewHealth,
      ]);
    });

    test('hasPermission checks effective permissions', () {
      final now = DateTime(2026, 6, 18);
      final member = TeamMember(
        id: 'member-1',
        teamId: 'team-1',
        userId: 'user-1',
        role: TeamRole.owner,
        joinedAt: now,
      );

      expect(member.hasPermission(TeamPermission.inviteMembers), isTrue);
      expect(member.hasPermission(TeamPermission.manageHorses), isTrue);
      expect(member.hasPermission(TeamPermission.viewFinancial), isTrue);
    });

    test('hasPermission returns false for missing permission', () {
      final now = DateTime(2026, 6, 18);
      final member = TeamMember(
        id: 'member-1',
        teamId: 'team-1',
        userId: 'user-1',
        role: TeamRole.viewer,
        joinedAt: now,
      );

      expect(member.hasPermission(TeamPermission.inviteMembers), isFalse);
      expect(member.hasPermission(TeamPermission.manageHealth), isFalse);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-TEAM-002: copyWith
  // ══════════════════════════════════════════════════════════════
  group('TeamMember copyWith', () {
    test('preserves unchanged fields', () {
      final now = DateTime(2026, 6, 18);
      final member = TeamMember(
        id: 'member-1',
        teamId: 'team-1',
        userId: 'user-1',
        role: TeamRole.viewer,
        joinedAt: now,
      );
      final updated = member.copyWith(role: TeamRole.manager);
      expect(updated.id, 'member-1');
      expect(updated.teamId, 'team-1');
      expect(updated.userId, 'user-1');
      expect(updated.role, TeamRole.manager);
      expect(updated.joinedAt, now);
    });

    test('updates multiple fields', () {
      final now = DateTime(2026, 6, 18);
      final member = TeamMember(
        id: 'member-1',
        teamId: 'team-1',
        userId: 'user-1',
        role: TeamRole.viewer,
        joinedAt: now,
      );
      final updated = member.copyWith(
        role: TeamRole.manager,
        permissions: [TeamPermission.inviteMembers],
      );
      expect(updated.role, TeamRole.manager);
      expect(updated.permissions, [TeamPermission.inviteMembers]);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-TEAM-002: Serialization
  // ══════════════════════════════════════════════════════════════
  group('TeamMember serialization', () {
    test('toJson / fromJson round-trip', () {
      final now = DateTime(2026, 6, 18, 10, 0, 0, 0, 0);
      final member = TeamMember(
        id: 'member-1',
        teamId: 'team-1',
        userId: 'user-1',
        role: TeamRole.manager,
        permissions: [
          TeamPermission.inviteMembers,
          TeamPermission.manageHorses,
        ],
        joinedAt: now,
      );

      final json = member.toJson();
      final restored = TeamMember.fromJson(json);

      expect(restored.id, member.id);
      expect(restored.teamId, member.teamId);
      expect(restored.userId, member.userId);
      expect(restored.role, member.role);
      expect(restored.permissions, member.permissions);
      expect(restored.joinedAt, member.joinedAt);
    });

    test('toSupabaseJson / fromSupabaseJson round-trip', () {
      final now = DateTime(2026, 6, 18, 10, 0, 0, 0, 0);
      final member = TeamMember(
        id: 'member-1',
        teamId: 'team-1',
        userId: 'user-1',
        role: TeamRole.manager,
        permissions: [TeamPermission.inviteMembers],
        joinedAt: now,
      );

      final json = member.toSupabaseJson();
      expect(json['team_id'], 'team-1');
      expect(json['user_id'], 'user-1');
      expect(json['role'], 'manager');
      expect(json['permissions'], ['inviteMembers']);
      expect(json['updated_at'], isA<String>());

      final restored = TeamMember.fromSupabaseJson(json);
      expect(restored.id, member.id);
      expect(restored.teamId, member.teamId);
      expect(restored.userId, member.userId);
      expect(restored.role, member.role);
      expect(restored.permissions, member.permissions);
    });

    test('toJson uses camelCase keys', () {
      final now = DateTime(2026, 6, 18);
      final member = TeamMember(
        id: 'm1',
        teamId: 't1',
        userId: 'u1',
        role: TeamRole.viewer,
        joinedAt: now,
      );
      final json = member.toJson();
      expect(json.containsKey('teamId'), isTrue);
      expect(json.containsKey('userId'), isTrue);
      expect(json.containsKey('joinedAt'), isTrue);
      expect(json.containsKey('team_id'), isFalse);
      expect(json.containsKey('user_id'), isFalse);
    });

    test('toSupabaseJson uses snake_case keys', () {
      final now = DateTime(2026, 6, 18);
      final member = TeamMember(
        id: 'm1',
        teamId: 't1',
        userId: 'u1',
        role: TeamRole.viewer,
        joinedAt: now,
      );
      final json = member.toSupabaseJson();
      expect(json.containsKey('team_id'), isTrue);
      expect(json.containsKey('user_id'), isTrue);
      expect(json.containsKey('joined_at'), isTrue);
      expect(json.containsKey('teamId'), isFalse);
      expect(json.containsKey('userId'), isFalse);
    });

    test('fromJson handles empty permissions', () {
      final json = {
        'id': 'm1',
        'teamId': 't1',
        'userId': 'u1',
        'role': 'viewer',
        'joinedAt': '2026-06-18T10:00:00.000',
      };
      final member = TeamMember.fromJson(json);
      expect(member.permissions, isEmpty);
      expect(member.role, TeamRole.viewer);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-TEAM-002: Equality
  // ══════════════════════════════════════════════════════════════
  group('TeamMember equality', () {
    test('two members with same id are equal', () {
      final now = DateTime(2026, 6, 18);
      final a = TeamMember(
        id: 'm1',
        teamId: 't1',
        userId: 'u1',
        role: TeamRole.manager,
        joinedAt: now,
      );
      final b = TeamMember(
        id: 'm1',
        teamId: 't1',
        userId: 'u1',
        role: TeamRole.manager,
        joinedAt: now,
      );
      expect(a, b);
    });

    test('two members with different ids are not equal', () {
      final now = DateTime(2026, 6, 18);
      final a = TeamMember(
        id: 'm1',
        teamId: 't1',
        userId: 'u1',
        role: TeamRole.manager,
        joinedAt: now,
      );
      final b = TeamMember(
        id: 'm2',
        teamId: 't1',
        userId: 'u1',
        role: TeamRole.manager,
        joinedAt: now,
      );
      expect(a == b, isFalse);
    });

    test('toString includes key fields', () {
      final now = DateTime(2026, 6, 18);
      final member = TeamMember(
        id: 'm1',
        teamId: 't1',
        userId: 'u1',
        role: TeamRole.vet,
        joinedAt: now,
      );
      final str = member.toString();
      expect(str, contains('m1'));
      expect(str, contains('vet'));
    });
  });
}
