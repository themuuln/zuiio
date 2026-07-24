import 'package:isar/isar.dart';
import 'package:uuid/uuid.dart';

import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../../core/sync/sync_queue.dart';
import '../../../features/shared/data/isar_storage.dart';
import '../../../features/shared/data/isar_schemas/isar_team.dart';
import '../../../features/shared/data/isar_schemas/isar_team_invitation.dart';
import '../../../features/shared/data/isar_schemas/isar_team_member.dart';
import '../domain/team.dart';
import '../domain/team_invitation.dart';
import '../domain/team_member.dart';
import 'team_repository.dart';

/// Isar болон SyncQueue-д суурилсан TeamRepository хэрэгжилт.
///
/// Бүх багийн үйлдлийг локал Isar-д хадгаж,
/// SyncQueue-д нэмж, дараа нь Supabase руу синк хийнэ.
class LocalTeamRepository implements TeamRepository {
  LocalTeamRepository({
    required IsarStorage storage,
    required SyncQueue syncQueue,
  }) : _storage = storage,
       _syncQueue = syncQueue;

  final IsarStorage _storage;
  final SyncQueue _syncQueue;

  @override
  Future<Result<Team>> createTeam(Team team) async {
    return Result.tryFuture(() async {
      final id = team.id.isEmpty ? const Uuid().v4() : team.id;
      final now = DateTime.now();

      final teamWithId = team.copyWith(id: id, createdAt: now);

      final isarTeam = IsarTeam.fromDomain(teamWithId);
      await _storage.teams.isar.writeTxn(() async {
        await _storage.teams.put(isarTeam);
      });

      // Also add the owner as a member
      final ownerMember = TeamMember(
        id: const Uuid().v4(),
        teamId: id,
        userId: teamWithId.ownerUserId,
        role: TeamRole.owner,
        permissions: TeamRole.owner.defaultPermissions,
        joinedAt: now,
      );

      final isarMember = IsarTeamMember.fromDomain(ownerMember);
      await _storage.teamMembers.isar.writeTxn(() async {
        await _storage.teamMembers.put(isarMember);
      });

      _syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'team',
          entityId: id,
          action: SyncAction.create,
          data: teamWithId.toJson(),
          timestamp: now,
        ),
      );

      _syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'team_member',
          entityId: ownerMember.id,
          action: SyncAction.create,
          data: ownerMember.toJson(),
          timestamp: now,
        ),
      );

      return teamWithId;
    });
  }

  @override
  Future<Result<Team>> getTeam(String teamId) async {
    return Result.tryFuture(() async {
      final stored = await _storage.teams
          .filter()
          .domainIdEqualTo(teamId)
          .findFirst();

      if (stored == null) {
        throw AppException(
          message: 'Баг олдсонгүй',
          code: 'TEAM_NOT_FOUND',
          details: {'teamId': teamId},
        );
      }

      return stored.toDomain();
    });
  }

  @override
  Future<Result<List<TeamMember>>> getMembers(String teamId) async {
    return Result.tryFuture(() async {
      final stored = await _storage.teamMembers
          .filter()
          .teamIdEqualTo(teamId)
          .findAll();
      return stored.map((e) => e.toDomain()).toList();
    });
  }

  @override
  Future<Result<TeamMember>> inviteMember(TeamMember member) async {
    return Result.tryFuture(() async {
      final id = member.id.isEmpty ? const Uuid().v4() : member.id;
      final now = DateTime.now();

      final memberWithId = member.copyWith(id: id, joinedAt: now);

      final isarMember = IsarTeamMember.fromDomain(memberWithId);
      await _storage.teamMembers.isar.writeTxn(() async {
        await _storage.teamMembers.put(isarMember);
      });

      // Member count is no longer tracked on the team model;
      // computed via COUNT query in application code

      _syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'team_member',
          entityId: id,
          action: SyncAction.create,
          data: memberWithId.toJson(),
          timestamp: now,
        ),
      );

      return memberWithId;
    });
  }

  @override
  Future<Result<void>> removeMember(String teamId, String userId) async {
    return Result.tryFuture(() async {
      final toDelete = await _storage.teamMembers
          .filter()
          .teamIdEqualTo(teamId)
          .and()
          .userIdEqualTo(userId)
          .findFirst();

      if (toDelete != null) {
        await _storage.teamMembers.isar.writeTxn(() async {
          await _storage.teamMembers.delete(toDelete.id);
        });

        // Member count is no longer tracked on the team model;
        // computed via COUNT query in application code

        _syncQueue.enqueue(
          SyncQueueItem(
            entityType: 'team_member',
            entityId: toDelete.domainId,
            action: SyncAction.delete,
            data: {},
            timestamp: DateTime.now(),
          ),
        );
      }
    });
  }

  @override
  Future<Result<TeamMember>> updateRole(
    String teamId,
    String userId,
    TeamRole newRole, {
    List<TeamPermission>? permissions,
  }) async {
    return Result.tryFuture(() async {
      final existing = await _storage.teamMembers
          .filter()
          .teamIdEqualTo(teamId)
          .and()
          .userIdEqualTo(userId)
          .findFirst();

      if (existing == null) {
        throw AppException(
          message: 'Гишүүн олдсонгүй',
          code: 'MEMBER_NOT_FOUND',
          details: {'teamId': teamId, 'userId': userId},
        );
      }

      final domain = existing.toDomain();
      final updated = domain.copyWith(
        role: newRole,
        permissions: permissions,
      );

      final isarMember = IsarTeamMember.fromDomain(updated);
      isarMember.id = existing.id;

      await _storage.teamMembers.isar.writeTxn(() async {
        await _storage.teamMembers.put(isarMember);
      });

      _syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'team_member',
          entityId: updated.id,
          action: SyncAction.update,
          data: updated.toJson(),
          timestamp: DateTime.now(),
        ),
      );

      return updated;
    });
  }

  @override
  Future<Result<List<Team>>> getUserTeams(String userId) async {
    return Result.tryFuture(() async {
      // Find all teams where the user is a member
      final members = await _storage.teamMembers
          .filter()
          .userIdEqualTo(userId)
          .findAll();
      final userTeamIds = members.map((m) => m.teamId).toSet();

      final allTeams = await _storage.teams.where().findAll();
      return allTeams
          .map((e) => e.toDomain())
          .where((t) => userTeamIds.contains(t.id))
          .toList();
    });
  }

  // ── Invitation Methods ───────────────────────────────────────────

  @override
  Future<Result<TeamInvitation>> createInvitation(
    TeamInvitation invitation,
  ) async {
    return Result.tryFuture(() async {
      final id = invitation.id.isEmpty ? const Uuid().v4() : invitation.id;
      final now = DateTime.now();

      final invitationWithId = invitation.copyWith(id: id, createdAt: now);

      final isarInvitation = IsarTeamInvitation.fromDomain(invitationWithId);
      await _storage.teamInvitations.isar.writeTxn(() async {
        await _storage.teamInvitations.put(isarInvitation);
      });

      _syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'team_invitation',
          entityId: id,
          action: SyncAction.create,
          data: invitationWithId.toJson(),
          timestamp: now,
        ),
      );

      return invitationWithId;
    });
  }

  @override
  Future<Result<List<TeamInvitation>>> getPendingInvitations(
    String userId,
  ) async {
    return Result.tryFuture(() async {
      final stored = await _storage.teamInvitations
          .filter()
          .invitedUserIdEqualTo(userId)
          .statusEqualTo(InvitationStatus.pending)
          .findAll();
      return stored.map((e) => e.toDomain()).toList();
    });
  }

  @override
  Future<Result<TeamMember>> acceptInvitation(String invitationId) async {
    return Result.tryFuture(() async {
      final stored = await _storage.teamInvitations
          .filter()
          .domainIdEqualTo(invitationId)
          .findFirst();

      if (stored == null) {
        throw AppException(
          message: 'Урилга олдсонгүй',
          code: 'INVITATION_NOT_FOUND',
          details: {'invitationId': invitationId},
        );
      }

      final invitation = stored.toDomain();
      if (invitation.status != InvitationStatus.pending) {
        throw AppException(
          message: 'Урилга идэвхтэй биш байна',
          code: 'INVITATION_NOT_PENDING',
          details: {
            'invitationId': invitationId,
            'status': invitation.status.name,
          },
        );
      }

      // Create the team member
      final member = TeamMember(
        id: const Uuid().v4(),
        teamId: invitation.teamId,
        userId: invitation.invitedUserId,
        role: invitation.role,
        joinedAt: DateTime.now(),
      );

      final isarMember = IsarTeamMember.fromDomain(member);
      await _storage.teamMembers.isar.writeTxn(() async {
        await _storage.teamMembers.put(isarMember);
      });

      // Member count is no longer tracked on the team model;
      // computed via COUNT query in application code

      // Update invitation status to accepted
      final updatedInvitation = invitation.copyWith(
        status: InvitationStatus.accepted,
      );
      final isarUpdatedInvitation =
          IsarTeamInvitation.fromDomain(updatedInvitation);
      isarUpdatedInvitation.id = stored.id;
      await _storage.teamInvitations.isar.writeTxn(() async {
        await _storage.teamInvitations.put(isarUpdatedInvitation);
      });

      final now = DateTime.now();

      _syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'team_member',
          entityId: member.id,
          action: SyncAction.create,
          data: member.toJson(),
          timestamp: now,
        ),
      );

      _syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'team_invitation',
          entityId: invitationId,
          action: SyncAction.update,
          data: updatedInvitation.toJson(),
          timestamp: now,
        ),
      );

      return member;
    });
  }

  @override
  Future<Result<void>> declineInvitation(String invitationId) async {
    return Result.tryFuture(() async {
      final stored = await _storage.teamInvitations
          .filter()
          .domainIdEqualTo(invitationId)
          .findFirst();

      if (stored == null) {
        throw AppException(
          message: 'Урилга олдсонгүй',
          code: 'INVITATION_NOT_FOUND',
          details: {'invitationId': invitationId},
        );
      }

      final invitation = stored.toDomain();
      if (invitation.status != InvitationStatus.pending) {
        throw AppException(
          message: 'Урилга идэвхтэй биш байна',
          code: 'INVITATION_NOT_PENDING',
          details: {
            'invitationId': invitationId,
            'status': invitation.status.name,
          },
        );
      }

      final updatedInvitation = invitation.copyWith(
        status: InvitationStatus.declined,
      );
      final isarUpdatedInvitation =
          IsarTeamInvitation.fromDomain(updatedInvitation);
      isarUpdatedInvitation.id = stored.id;
      await _storage.teamInvitations.isar.writeTxn(() async {
        await _storage.teamInvitations.put(isarUpdatedInvitation);
      });

      _syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'team_invitation',
          entityId: invitationId,
          action: SyncAction.update,
          data: updatedInvitation.toJson(),
          timestamp: DateTime.now(),
        ),
      );
    });
  }
}
