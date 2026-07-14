import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/teams/domain/team_invitation.dart';
import 'package:tamga/src/features/teams/domain/team_member.dart';

void main() {
  // ══════════════════════════════════════════════════════════════
  // InvitationStatus enum
  // ══════════════════════════════════════════════════════════════
  group('InvitationStatus enum', () {
    test('has 3 values', () {
      expect(InvitationStatus.values, hasLength(3));
    });

    test('values have correct names', () {
      expect(InvitationStatus.pending.name, 'pending');
      expect(InvitationStatus.accepted.name, 'accepted');
      expect(InvitationStatus.declined.name, 'declined');
    });

    test('displayName returns Mongolian labels', () {
      expect(InvitationStatus.pending.displayName, 'Хүлээгдэж буй');
      expect(InvitationStatus.accepted.displayName, 'Хүлээн зөвшөөрөгдсөн');
      expect(InvitationStatus.declined.displayName, 'Татгалзсан');
    });
  });

  // ══════════════════════════════════════════════════════════════
  // TeamInvitation domain model
  // ══════════════════════════════════════════════════════════════
  group('TeamInvitation domain model', () {
    test('has all required fields', () {
      final now = DateTime(2026, 6, 18);
      final invitation = TeamInvitation(
        id: 'inv-1',
        teamId: 'team-1',
        teamName: 'Миний баг',
        invitedUserId: 'user-2',
        invitedByUserId: 'user-1',
        role: TeamRole.viewer,
        status: InvitationStatus.pending,
        createdAt: now,
      );

      expect(invitation.id, 'inv-1');
      expect(invitation.teamId, 'team-1');
      expect(invitation.teamName, 'Миний баг');
      expect(invitation.invitedUserId, 'user-2');
      expect(invitation.invitedByUserId, 'user-1');
      expect(invitation.role, TeamRole.viewer);
      expect(invitation.status, InvitationStatus.pending);
      expect(invitation.createdAt, now);
    });

    test('has sensible defaults for status', () {
      final now = DateTime(2026, 6, 18);
      final invitation = TeamInvitation(
        id: 'inv-1',
        teamId: 'team-1',
        teamName: 'Баг',
        invitedUserId: 'user-2',
        invitedByUserId: 'user-1',
        role: TeamRole.viewer,
        createdAt: now,
      );

      expect(invitation.status, InvitationStatus.pending);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // copyWith
  // ══════════════════════════════════════════════════════════════
  group('TeamInvitation copyWith', () {
    test('preserves unchanged fields', () {
      final now = DateTime(2026, 6, 18);
      final invitation = TeamInvitation(
        id: 'inv-1',
        teamId: 'team-1',
        teamName: 'Баг',
        invitedUserId: 'user-2',
        invitedByUserId: 'user-1',
        role: TeamRole.viewer,
        createdAt: now,
      );
      final updated = invitation.copyWith(status: InvitationStatus.accepted);
      expect(updated.id, 'inv-1');
      expect(updated.teamId, 'team-1');
      expect(updated.teamName, 'Баг');
      expect(updated.invitedUserId, 'user-2');
      expect(updated.invitedByUserId, 'user-1');
      expect(updated.role, TeamRole.viewer);
      expect(updated.status, InvitationStatus.accepted);
      expect(updated.createdAt, now);
    });

    test('updates multiple fields', () {
      final now = DateTime(2026, 6, 18);
      final invitation = TeamInvitation(
        id: 'inv-1',
        teamId: 'team-1',
        teamName: 'Баг',
        invitedUserId: 'user-2',
        invitedByUserId: 'user-1',
        role: TeamRole.viewer,
        createdAt: now,
      );
      final updated = invitation.copyWith(
        role: TeamRole.manager,
        status: InvitationStatus.declined,
      );
      expect(updated.role, TeamRole.manager);
      expect(updated.status, InvitationStatus.declined);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Serialization
  // ══════════════════════════════════════════════════════════════
  group('TeamInvitation serialization', () {
    test('toJson / fromJson round-trip', () {
      final now = DateTime(2026, 6, 18, 10, 0, 0, 0, 0);
      final invitation = TeamInvitation(
        id: 'inv-1',
        teamId: 'team-1',
        teamName: 'Миний баг',
        invitedUserId: 'user-2',
        invitedByUserId: 'user-1',
        role: TeamRole.manager,
        status: InvitationStatus.pending,
        createdAt: now,
      );

      final json = invitation.toJson();
      final restored = TeamInvitation.fromJson(json);

      expect(restored.id, invitation.id);
      expect(restored.teamId, invitation.teamId);
      expect(restored.teamName, invitation.teamName);
      expect(restored.invitedUserId, invitation.invitedUserId);
      expect(restored.invitedByUserId, invitation.invitedByUserId);
      expect(restored.role, invitation.role);
      expect(restored.status, invitation.status);
      expect(restored.createdAt, invitation.createdAt);
    });

    test('toSupabaseJson / fromSupabaseJson round-trip', () {
      final now = DateTime(2026, 6, 18, 10, 0, 0, 0, 0);
      final invitation = TeamInvitation(
        id: 'inv-1',
        teamId: 'team-1',
        teamName: 'Миний баг',
        invitedUserId: 'user-2',
        invitedByUserId: 'user-1',
        role: TeamRole.manager,
        status: InvitationStatus.pending,
        createdAt: now,
      );

      final json = invitation.toSupabaseJson();
      expect(json['team_id'], 'team-1');
      expect(json['team_name'], 'Миний баг');
      expect(json['invited_user_id'], 'user-2');
      expect(json['invited_by_user_id'], 'user-1');
      expect(json['role'], 'manager');
      expect(json['status'], 'pending');
      expect(json['updated_at'], isA<String>());

      final restored = TeamInvitation.fromSupabaseJson(json);
      expect(restored.id, invitation.id);
      expect(restored.teamId, invitation.teamId);
      expect(restored.teamName, invitation.teamName);
      expect(restored.invitedUserId, invitation.invitedUserId);
      expect(restored.invitedByUserId, invitation.invitedByUserId);
      expect(restored.role, invitation.role);
      expect(restored.status, invitation.status);
    });

    test('toJson uses camelCase keys', () {
      final now = DateTime(2026, 6, 18);
      final invitation = TeamInvitation(
        id: 'inv-1',
        teamId: 't1',
        teamName: 'Баг',
        invitedUserId: 'u2',
        invitedByUserId: 'u1',
        role: TeamRole.viewer,
        createdAt: now,
      );
      final json = invitation.toJson();
      expect(json.containsKey('teamId'), isTrue);
      expect(json.containsKey('teamName'), isTrue);
      expect(json.containsKey('invitedUserId'), isTrue);
      expect(json.containsKey('invitedByUserId'), isTrue);
      expect(json.containsKey('team_id'), isFalse);
      expect(json.containsKey('team_name'), isFalse);
    });

    test('toSupabaseJson uses snake_case keys', () {
      final now = DateTime(2026, 6, 18);
      final invitation = TeamInvitation(
        id: 'inv-1',
        teamId: 't1',
        teamName: 'Баг',
        invitedUserId: 'u2',
        invitedByUserId: 'u1',
        role: TeamRole.viewer,
        createdAt: now,
      );
      final json = invitation.toSupabaseJson();
      expect(json.containsKey('team_id'), isTrue);
      expect(json.containsKey('team_name'), isTrue);
      expect(json.containsKey('invited_user_id'), isTrue);
      expect(json.containsKey('invited_by_user_id'), isTrue);
      expect(json.containsKey('teamId'), isFalse);
      expect(json.containsKey('teamName'), isFalse);
    });

    test('fromJson defaults status to pending', () {
      final json = {
        'id': 'inv-1',
        'teamId': 't1',
        'teamName': 'Баг',
        'invitedUserId': 'u2',
        'invitedByUserId': 'u1',
        'role': 'viewer',
        'createdAt': '2026-06-18T10:00:00.000',
      };
      final invitation = TeamInvitation.fromJson(json);
      expect(invitation.status, InvitationStatus.pending);
      expect(invitation.role, TeamRole.viewer);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Equality
  // ══════════════════════════════════════════════════════════════
  group('TeamInvitation equality', () {
    test('two invitations with same id are equal', () {
      final now = DateTime(2026, 6, 18);
      final a = TeamInvitation(
        id: 'inv-1',
        teamId: 't1',
        teamName: 'Баг',
        invitedUserId: 'u2',
        invitedByUserId: 'u1',
        role: TeamRole.manager,
        createdAt: now,
      );
      final b = TeamInvitation(
        id: 'inv-1',
        teamId: 't1',
        teamName: 'Баг',
        invitedUserId: 'u2',
        invitedByUserId: 'u1',
        role: TeamRole.manager,
        createdAt: now,
      );
      expect(a, b);
    });

    test('two invitations with different ids are not equal', () {
      final now = DateTime(2026, 6, 18);
      final a = TeamInvitation(
        id: 'inv-1',
        teamId: 't1',
        teamName: 'Баг',
        invitedUserId: 'u2',
        invitedByUserId: 'u1',
        role: TeamRole.manager,
        createdAt: now,
      );
      final b = TeamInvitation(
        id: 'inv-2',
        teamId: 't1',
        teamName: 'Баг',
        invitedUserId: 'u2',
        invitedByUserId: 'u1',
        role: TeamRole.manager,
        createdAt: now,
      );
      expect(a == b, isFalse);
    });

    test('toString includes key fields', () {
      final now = DateTime(2026, 6, 18);
      final invitation = TeamInvitation(
        id: 'inv-1',
        teamId: 't1',
        teamName: 'Баг',
        invitedUserId: 'u2',
        invitedByUserId: 'u1',
        role: TeamRole.vet,
        createdAt: now,
      );
      final str = invitation.toString();
      expect(str, contains('inv-1'));
      expect(str, contains('pending'));
    });
  });
}
