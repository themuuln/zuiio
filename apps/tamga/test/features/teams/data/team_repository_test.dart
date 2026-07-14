import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/storage/isar_database.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/teams/data/local_team_repository.dart';
import 'package:tamga/src/features/teams/data/team_repository.dart';
import 'package:tamga/src/features/teams/domain/team.dart';
import 'package:tamga/src/features/teams/domain/team_invitation.dart';
import 'package:tamga/src/features/teams/domain/team_member.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';

import '../../../helpers/test_helpers.dart';

void main() {
  group('LocalTeamRepository', () {
    late SyncQueue syncQueue;
    late TeamRepository repository;

    setUp(() async {
      await setupTestEnvironment();
      await IsarDatabase.initialize();
      syncQueue = SyncQueue();
      repository = LocalTeamRepository(
        storage: IsarStorage.instance,
        syncQueue: syncQueue,
      );
    });

    tearDown(() async {
      await IsarDatabase.close();
    });

    // ════════════════════════════════════════════════════════════
    // VAL-TEAM-003: createTeam
    // ════════════════════════════════════════════════════════════
    test('createTeam creates a new team', () async {
      final now = DateTime(2026, 6, 18);
      final team = Team(
        id: 'team-1',
        name: 'Миний баг',
        ownerUserId: 'user-1',
        memberCount: 1,
        createdAt: now,
      );

      final result = await repository.createTeam(team);
      expect(result.isSuccess, true);
      expect(result.value.id, 'team-1');
      expect(result.value.name, 'Миний баг');
      expect(result.value.ownerUserId, 'user-1');
    });

    test('createTeam generates UUID when id is empty', () async {
      final now = DateTime(2026, 6, 18);
      final team = Team(
        id: '',
        name: 'Auto ID',
        ownerUserId: 'user-1',
        createdAt: now,
      );

      final result = await repository.createTeam(team);
      expect(result.isSuccess, true);
      expect(result.value.id, isNotEmpty);
      expect(result.value.id, isNot(''));
    });

    test('createTeam enqueues sync create action and creates owner member', () async {
      final now = DateTime(2026, 6, 18);
      final team = Team(
        id: 'team-2',
        name: 'Sync test',
        ownerUserId: 'user-1',
        createdAt: now,
      );

      await repository.createTeam(team);

      // Should have 2 pending items: team + owner member
      expect(syncQueue.pendingCount, 2);
      final items = syncQueue.toList();
      expect(items.any((i) => i.entityType == 'team'), isTrue);
      expect(items.any((i) => i.entityType == 'team_member'), isTrue);
    });

    // ════════════════════════════════════════════════════════════
    // VAL-TEAM-003: getTeam
    // ════════════════════════════════════════════════════════════
    test('getTeam returns a specific team', () async {
      final now = DateTime(2026, 6, 18);
      await repository.createTeam(Team(
        id: 'team-1',
        name: 'Баг 1',
        ownerUserId: 'user-1',
        createdAt: now,
      ));
      await repository.createTeam(Team(
        id: 'team-2',
        name: 'Баг 2',
        ownerUserId: 'user-2',
        createdAt: now,
      ));

      final result = await repository.getTeam('team-2');
      expect(result.isSuccess, true);
      expect(result.value.id, 'team-2');
      expect(result.value.name, 'Баг 2');
    });

    test('getTeam fails for non-existent team', () async {
      final result = await repository.getTeam('nonexistent');
      expect(result.isFailure, true);
    });

    // ════════════════════════════════════════════════════════════
    // VAL-TEAM-003: inviteMember
    // ════════════════════════════════════════════════════════════
    test('inviteMember adds a member and updates team member count', () async {
      final now = DateTime(2026, 6, 18);
      await repository.createTeam(Team(
        id: 'team-1',
        name: 'Баг',
        ownerUserId: 'user-1',
        createdAt: now,
      ));
      syncQueue.clear();

      final member = TeamMember(
        id: 'member-2',
        teamId: 'team-1',
        userId: 'user-2',
        role: TeamRole.viewer,
        joinedAt: now,
      );

      final result = await repository.inviteMember(member);
      expect(result.isSuccess, true);
      expect(result.value.role, TeamRole.viewer);

      // Check member was added
      final membersResult = await repository.getMembers('team-1');
      expect(membersResult.value.length, 2);

      expect(syncQueue.pendingCount, 1);
      expect(syncQueue.peek()!.entityType, 'team_member');
    });

    // ════════════════════════════════════════════════════════════
    // VAL-TEAM-003: removeMember
    // ════════════════════════════════════════════════════════════
    test('removeMember removes a member and decrements count', () async {
      final now = DateTime(2026, 6, 18);
      await repository.createTeam(Team(
        id: 'team-1',
        name: 'Баг',
        ownerUserId: 'user-1',
        createdAt: now,
      ));

      // Add a second member
      await repository.inviteMember(TeamMember(
        id: 'member-2',
        teamId: 'team-1',
        userId: 'user-2',
        role: TeamRole.viewer,
        joinedAt: now,
      ));
      syncQueue.clear();

      // Remove user-2
      final result = await repository.removeMember('team-1', 'user-2');
      expect(result.isSuccess, true);

      // Check member was removed
      final membersResult = await repository.getMembers('team-1');
      expect(membersResult.value.length, 1);
      expect(membersResult.value.first.userId, 'user-1');

      expect(syncQueue.pendingCount, 1);
      expect(syncQueue.peek()!.action, SyncAction.delete);
    });

    test('removeMember for non-existent member succeeds silently', () async {
      final result = await repository.removeMember('team-none', 'user-none');
      expect(result.isSuccess, true);
    });

    // ════════════════════════════════════════════════════════════
    // VAL-TEAM-003: updateRole
    // ════════════════════════════════════════════════════════════
    test('updateRole changes a member role', () async {
      final now = DateTime(2026, 6, 18);
      await repository.createTeam(Team(
        id: 'team-1',
        name: 'Баг',
        ownerUserId: 'user-1',
        createdAt: now,
      ));
      syncQueue.clear(); // Clear createTeam items

      // user-1 is already owner (auto-created by createTeam)
      final result = await repository.updateRole(
        'team-1',
        'user-1',
        TeamRole.manager,
      );

      expect(result.isSuccess, true);
      expect(result.value.role, TeamRole.manager);

      // Verify persisted
      final membersResult = await repository.getMembers('team-1');
      final updatedMember = membersResult.value
          .firstWhere((m) => m.userId == 'user-1');
      expect(updatedMember.role, TeamRole.manager);

      expect(syncQueue.pendingCount, 1);
      expect(syncQueue.peek()!.action, SyncAction.update);
    });

    test('updateRole fails for non-existent member', () async {
      final result = await repository.updateRole(
        'team-none',
        'user-none',
        TeamRole.viewer,
      );
      expect(result.isFailure, true);
    });

    test('updateRole with custom permissions', () async {
      final now = DateTime(2026, 6, 18);
      await repository.createTeam(Team(
        id: 'team-1',
        name: 'Баг',
        ownerUserId: 'user-1',
        createdAt: now,
      ));

      final result = await repository.updateRole(
        'team-1',
        'user-1',
        TeamRole.viewer,
        permissions: [TeamPermission.manageHorses],
      );

      expect(result.isSuccess, true);
      expect(result.value.role, TeamRole.viewer);
      expect(result.value.permissions, [TeamPermission.manageHorses]);
      expect(result.value.effectivePermissions, [TeamPermission.manageHorses]);
    });

    // ════════════════════════════════════════════════════════════
    // VAL-TEAM-003: getMembers
    // ════════════════════════════════════════════════════════════
    test('getMembers returns all team members', () async {
      final now = DateTime(2026, 6, 18);
      await repository.createTeam(Team(
        id: 'team-1',
        name: 'Баг',
        ownerUserId: 'user-1',
        createdAt: now,
      ));

      // createTeam auto-creates owner member, so we have at least 1 member
      final result = await repository.getMembers('team-1');
      expect(result.isSuccess, true);
      expect(result.value.length, 1);
      expect(result.value.first.userId, 'user-1');
      expect(result.value.first.role, TeamRole.owner);
    });

    test('getMembers returns empty for non-existent team', () async {
      final result = await repository.getMembers('team-none');
      expect(result.isSuccess, true);
      expect(result.value, isEmpty);
    });

    // ════════════════════════════════════════════════════════════
    // VAL-TEAM-003: getUserTeams
    // ════════════════════════════════════════════════════════════
    test('getUserTeams returns teams for a user', () async {
      final now = DateTime(2026, 6, 18);
      await repository.createTeam(Team(
        id: 'team-1',
        name: 'Баг 1',
        ownerUserId: 'user-1',
        createdAt: now,
      ));
      await repository.createTeam(Team(
        id: 'team-2',
        name: 'Баг 2',
        ownerUserId: 'user-2',
        createdAt: now,
      ));

      // Add user-1 to team-2 as member
      await repository.inviteMember(TeamMember(
        id: 'member-3',
        teamId: 'team-2',
        userId: 'user-1',
        role: TeamRole.viewer,
        joinedAt: now,
      ));

      final result = await repository.getUserTeams('user-1');
      expect(result.isSuccess, true);
      expect(result.value.length, 2); // Owns team-1, member of team-2

      final teamNames = result.value.map((t) => t.name).toSet();
      expect(teamNames, contains('Баг 1'));
      expect(teamNames, contains('Баг 2'));
    });

    test('getUserTeams returns empty for user with no teams', () async {
      final result = await repository.getUserTeams('user-none');
      expect(result.isSuccess, true);
      expect(result.value, isEmpty);
    });

    // ════════════════════════════════════════════════════════════
    // VAL-TEAM-003: offline-first: Isar + SyncQueue
    // ════════════════════════════════════════════════════════════
    test('offline-first: data persists in Isar and SyncQueue has pending items',
        () async {
      final now = DateTime(2026, 6, 18);
      final team = Team(
        id: 'team-offline-1',
        name: 'Офлайн баг',
        ownerUserId: 'user-1',
        memberCount: 1,
        createdAt: now,
      );

      final result = await repository.createTeam(team);
      expect(result.isSuccess, true,
          reason: 'Local create should succeed even when offline');

      // Verify it persists in Isar
      final fetchResult = await repository.getTeam('team-offline-1');
      expect(fetchResult.isSuccess, true);
      expect(fetchResult.value.name, 'Офлайн баг');

      // Verify SyncQueue has pending items
      expect(syncQueue.pendingCount, greaterThanOrEqualTo(1));
      final pendingItems = syncQueue.toList();
      expect(
        pendingItems.any((i) => i.entityId == 'team-offline-1'),
        isTrue,
        reason: 'SyncQueue should have pending item for offline team',
      );
    });

    // ════════════════════════════════════════════════════════════
    // Invitation Flow Tests
    // ════════════════════════════════════════════════════════════
    group('invitation flow', () {
      test('createInvitation creates a pending invitation', () async {
        final now = DateTime(2026, 6, 18);
        await repository.createTeam(Team(
          id: 'team-1',
          name: 'Тест баг',
          ownerUserId: 'user-1',
          createdAt: now,
        ));

        final invitation = TeamInvitation(
          id: 'inv-1',
          teamId: 'team-1',
          teamName: 'Тест баг',
          invitedUserId: 'user-2',
          invitedByUserId: 'user-1',
          role: TeamRole.viewer,
          createdAt: now,
        );

        final result = await repository.createInvitation(invitation);
        expect(result.isSuccess, true);
        expect(result.value.status, InvitationStatus.pending);
        expect(result.value.teamName, 'Тест баг');
        expect(result.value.role, TeamRole.viewer);

        // Should be in sync queue
        expect(syncQueue.pendingCount, greaterThanOrEqualTo(1));
        final items = syncQueue.toList();
        expect(
          items.any((i) => i.entityId == 'inv-1'),
          isTrue,
          reason: 'SyncQueue should have pending item for invitation',
        );
      });

      test('getPendingInvitations returns only pending invitations for user', () async {
        final now = DateTime(2026, 6, 18);
        await repository.createTeam(Team(
          id: 'team-1',
          name: 'Баг 1',
          ownerUserId: 'user-1',
          createdAt: now,
        ));
        await repository.createTeam(Team(
          id: 'team-2',
          name: 'Баг 2',
          ownerUserId: 'user-2',
          createdAt: now,
        ));

        // Create pending invitation for user-3
        await repository.createInvitation(TeamInvitation(
          id: 'inv-1',
          teamId: 'team-1',
          teamName: 'Баг 1',
          invitedUserId: 'user-3',
          invitedByUserId: 'user-1',
          role: TeamRole.viewer,
          createdAt: now,
        ));

        // Create another pending invitation for user-3
        await repository.createInvitation(TeamInvitation(
          id: 'inv-2',
          teamId: 'team-2',
          teamName: 'Баг 2',
          invitedUserId: 'user-3',
          invitedByUserId: 'user-2',
          role: TeamRole.manager,
          createdAt: now,
        ));

        // Create an invitation for user-4 (should not appear for user-3)
        await repository.createInvitation(TeamInvitation(
          id: 'inv-3',
          teamId: 'team-1',
          teamName: 'Баг 1',
          invitedUserId: 'user-4',
          invitedByUserId: 'user-1',
          role: TeamRole.vet,
          createdAt: now,
        ));

        final result = await repository.getPendingInvitations('user-3');
        expect(result.isSuccess, true);
        expect(result.value.length, 2);

        final ids = result.value.map((i) => i.id).toSet();
        expect(ids, contains('inv-1'));
        expect(ids, contains('inv-2'));
        expect(ids, isNot(contains('inv-3')));
      });

      test('getPendingInvitations returns empty list when no invitations', () async {
        final result = await repository.getPendingInvitations('user-none');
        expect(result.isSuccess, true);
        expect(result.value, isEmpty);
      });

      test('acceptInvitation creates team member and updates invitation status', () async {
        final now = DateTime(2026, 6, 18);
        await repository.createTeam(Team(
          id: 'team-1',
          name: 'Тест баг',
          ownerUserId: 'user-1',
          createdAt: now,
        ));

        await repository.createInvitation(TeamInvitation(
          id: 'inv-1',
          teamId: 'team-1',
          teamName: 'Тест баг',
          invitedUserId: 'user-2',
          invitedByUserId: 'user-1',
          role: TeamRole.manager,
          createdAt: now,
        ));

        syncQueue.clear();

        final result = await repository.acceptInvitation('inv-1');
        expect(result.isSuccess, true);

        // Should return the created team member
        final member = result.value;
        expect(member.teamId, 'team-1');
        expect(member.userId, 'user-2');
        expect(member.role, TeamRole.manager);

        // Check member was added
        final membersResult = await repository.getMembers('team-1');
        expect(membersResult.value.length, 2); // owner + user-2
        expect(membersResult.value.any((m) => m.userId == 'user-2'), isTrue);

        // Check invitation is no longer pending
        final pendingResult = await repository.getPendingInvitations('user-2');
        expect(pendingResult.value, isEmpty);

        // SyncQueue should have items
        expect(syncQueue.pendingCount, greaterThanOrEqualTo(1));
      });

      test('declineInvitation updates invitation status to declined', () async {
        final now = DateTime(2026, 6, 18);
        await repository.createTeam(Team(
          id: 'team-1',
          name: 'Тест баг',
          ownerUserId: 'user-1',
          createdAt: now,
        ));

        await repository.createInvitation(TeamInvitation(
          id: 'inv-1',
          teamId: 'team-1',
          teamName: 'Тест баг',
          invitedUserId: 'user-2',
          invitedByUserId: 'user-1',
          role: TeamRole.viewer,
          createdAt: now,
        ));

        syncQueue.clear();

        final result = await repository.declineInvitation('inv-1');
        expect(result.isSuccess, true);

        // Check invitation no longer appears as pending
        final pendingResult = await repository.getPendingInvitations('user-2');
        expect(pendingResult.value, isEmpty);

        // Check member was NOT added
        final membersResult = await repository.getMembers('team-1');
        expect(membersResult.value.length, 1); // only owner
      });

      test('acceptInvitation fails for non-existent invitation', () async {
        final result = await repository.acceptInvitation('inv-none');
        expect(result.isFailure, true);
      });

      test('declineInvitation fails for non-existent invitation', () async {
        final result = await repository.declineInvitation('inv-none');
        expect(result.isFailure, true);
      });

      test('acceptInvitation fails for already accepted invitation', () async {
        final now = DateTime(2026, 6, 18);
        await repository.createTeam(Team(
          id: 'team-1',
          name: 'Тест баг',
          ownerUserId: 'user-1',
          createdAt: now,
        ));

        await repository.createInvitation(TeamInvitation(
          id: 'inv-1',
          teamId: 'team-1',
          teamName: 'Тест баг',
          invitedUserId: 'user-2',
          invitedByUserId: 'user-1',
          role: TeamRole.viewer,
          createdAt: now,
        ));

        // Accept once
        await repository.acceptInvitation('inv-1');

        // Accept again should fail
        final result = await repository.acceptInvitation('inv-1');
        expect(result.isFailure, true);
      });
    });
  });
}
