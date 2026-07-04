import '../../../core/error/result.dart';
import '../domain/team.dart';
import '../domain/team_invitation.dart';
import '../domain/team_member.dart';

/// Result-д суурилсан TeamRepository interface.
abstract class TeamRepository {
  /// Шинэ баг үүсгэх.
  Future<Result<Team>> createTeam(Team team);

  /// Багийн мэдээллийг авах.
  Future<Result<Team>> getTeam(String teamId);

  /// Багийн бүх гишүүдийг авах.
  Future<Result<List<TeamMember>>> getMembers(String teamId);

  /// Багт шинэ гишүүн урих.
  Future<Result<TeamMember>> inviteMember(TeamMember member);

  /// Гишүүнийг багаас хасах.
  Future<Result<void>> removeMember(String teamId, String userId);

  /// Гишүүний дүрийг шинэчлэх.
  Future<Result<TeamMember>> updateRole(
    String teamId,
    String userId,
    TeamRole newRole, {
    List<TeamPermission>? permissions,
  });

  /// Хэрэглэгчийн бүх багуудыг авах.
  Future<Result<List<Team>>> getUserTeams(String userId);

  // ── Invitation Methods ───────────────────────────────────────────

  /// Шинэ урилга үүсгэх (pending төлөвтэй).
  Future<Result<TeamInvitation>> createInvitation(TeamInvitation invitation);

  /// Хэрэглэгчийн хүлээгдэж буй урилгуудыг авах.
  Future<Result<List<TeamInvitation>>> getPendingInvitations(String userId);

  /// Урилгыг хүлээн зөвшөөрөх: TeamMember үүсгэж, урилгын төлөвийг шинэчлэх.
  Future<Result<TeamMember>> acceptInvitation(String invitationId);

  /// Урилгаас татгалзах: урилгын төлөвийг declined болгох.
  Future<Result<void>> declineInvitation(String invitationId);
}
