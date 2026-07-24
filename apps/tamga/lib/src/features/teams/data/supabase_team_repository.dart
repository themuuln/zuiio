import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/data/supabase_repository_mixin.dart';
import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../../app/supabase_bootstrap.dart';
import '../domain/team.dart';
import '../domain/team_invitation.dart';
import '../domain/team_member.dart';
import 'team_repository.dart';

/// Supabase cloud implementation of [TeamRepository].
///
/// Maps [Team] ↔ Supabase row via the domain model's built-in
/// `fromSupabaseJson` / `toSupabaseJson`.
class SupabaseTeamRepository with SupabaseRepositoryMixin implements TeamRepository {
  SupabaseTeamRepository({SupabaseClient? client})
    : _client = client ?? getConfiguredSupabaseClient();

  final SupabaseClient? _client;

  @override
  SupabaseClient? get client => _client;

  // ── CRUD ─────────────────────────────────────────────────────────

  @override
  Future<Result<Team>> createTeam(Team team) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      final data = team.toSupabaseJson();
      await client.from('teams').insert(data);

      // Add owner as a member
      await client.from('team_members').insert({
        'id': data['id'],
        'team_id': team.id,
        'user_id': team.ownerUserId,
        'role': 'owner',
        'permissions': TeamRole.owner.defaultPermissions
            .map((p) => p.name)
            .toList(),
        'joined_at': team.createdAt.toIso8601String(),
      });

      return Result.ok(team);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<Team>> getTeam(String teamId) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      final response = await client
          .from('teams')
          .select()
          .eq('id', teamId)
          .single();

      return Result.ok(Team.fromSupabaseJson(response));
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<List<TeamMember>>> getMembers(String teamId) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      final response = await client
          .from('team_members')
          .select()
          .eq('team_id', teamId);

      final members = (response as List<dynamic>)
          .map(
            (row) => TeamMember.fromSupabaseJson(row as Map<String, dynamic>),
          )
          .toList();

      return Result.ok(members);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<TeamMember>> inviteMember(TeamMember member) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      await client.from('team_members').insert(member.toSupabaseJson());

      // Member count is computed via COUNT query in code, not stored as column
      return Result.ok(member);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<void>> removeMember(String teamId, String userId) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      await client
          .from('team_members')
          .delete()
          .eq('team_id', teamId)
          .eq('user_id', userId);

      // Member count is computed via COUNT query in code, not stored as column
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<TeamMember>> updateRole(
    String teamId,
    String userId,
    TeamRole newRole, {
    List<TeamPermission>? permissions,
  }) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      final updateData = <String, dynamic>{
        'role': newRole.name,
      };
      if (permissions != null) {
        updateData['permissions'] =
            permissions.map((p) => p.name).toList();
      }

      await client
          .from('team_members')
          .update(updateData)
          .eq('team_id', teamId)
          .eq('user_id', userId);

      // Fetch updated member
      final response = await client
          .from('team_members')
          .select()
          .eq('team_id', teamId)
          .eq('user_id', userId)
          .single();

      return Result.ok(TeamMember.fromSupabaseJson(response));
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<List<Team>>> getUserTeams(String userId) async {
    try {
      final client = safeClient;
      if (client == null) {
        return const Result.ok([]);
      }

      // Find teams where user is a member via team_members
      final memberTeams = await client
          .from('team_members')
          .select('team_id')
          .eq('user_id', userId);

      final teamIds =
          (memberTeams as List<dynamic>)
              .map((row) => row['team_id'] as String)
              .toList();

      if (teamIds.isEmpty) {
        return const Result.ok([]);
      }

      final filterStr = teamIds.map((id) => 'id.eq.$id').join(',');
      final response = await client
          .from('teams')
          .select()
          .or(filterStr);

      final teams = (response as List<dynamic>)
          .map((row) => Team.fromSupabaseJson(row as Map<String, dynamic>))
          .toList();

      return Result.ok(teams);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  // ── Invitation Methods ───────────────────────────────────────────

  @override
  Future<Result<TeamInvitation>> createInvitation(
    TeamInvitation invitation,
  ) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      await client.from('team_invitations').insert(invitation.toSupabaseJson());
      return Result.ok(invitation);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<List<TeamInvitation>>> getPendingInvitations(
    String userId,
  ) async {
    try {
      final client = safeClient;
      if (client == null) {
        return const Result.ok([]);
      }

      final response = await client
          .from('team_invitations')
          .select()
          .eq('invited_user_id', userId)
          .eq('status', 'pending');

      final invitations = (response as List<dynamic>)
          .map(
            (row) =>
                TeamInvitation.fromSupabaseJson(row as Map<String, dynamic>),
          )
          .toList();

      return Result.ok(invitations);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<TeamMember>> acceptInvitation(String invitationId) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      // Get the invitation
      final invResponse = await client
          .from('team_invitations')
          .select()
          .eq('id', invitationId)
          .single();

      final invitation =
          TeamInvitation.fromSupabaseJson(invResponse);

      if (invitation.status != InvitationStatus.pending) {
        return Result.fail(AppException(
          message: 'Урилга идэвхтэй биш байна',
          code: 'INVITATION_NOT_PENDING',
        ));
      }

      // Create the team member (member count is computed via COUNT query in code)
      await client.from('team_members').insert({
        'id': invitationId,
        'team_id': invitation.teamId,
        'user_id': invitation.invitedUserId,
        'role': invitation.role.name,
        'permissions': <String>[],
        'joined_at': DateTime.now().toIso8601String(),
      });

      // Update invitation status
      await client
          .from('team_invitations')
          .update({'status': 'accepted'})
          .eq('id', invitationId);

      final member = TeamMember(
        id: invitationId,
        teamId: invitation.teamId,
        userId: invitation.invitedUserId,
        role: invitation.role,
        joinedAt: DateTime.now(),
      );

      return Result.ok(member);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<void>> declineInvitation(String invitationId) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      await client
          .from('team_invitations')
          .update({'status': 'declined'})
          .eq('id', invitationId);

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }
}
