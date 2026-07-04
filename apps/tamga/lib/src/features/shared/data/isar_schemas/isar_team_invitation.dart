import 'package:isar/isar.dart';

import '../../../teams/domain/team_invitation.dart';
import '../../../teams/domain/team_member.dart';

part 'isar_team_invitation.g.dart';

/// Isar collection for [TeamInvitation].
@collection
class IsarTeamInvitation {
  IsarTeamInvitation();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;
  late String teamId;
  late String teamName;
  @Index()
  late String invitedUserId;
  late String invitedByUserId;
  @enumerated
  late TeamRole role;
  @enumerated
  late InvitationStatus status;
  late DateTime createdAt;

  factory IsarTeamInvitation.fromDomain(TeamInvitation invitation) {
    return IsarTeamInvitation()
      ..domainId = invitation.id
      ..teamId = invitation.teamId
      ..teamName = invitation.teamName
      ..invitedUserId = invitation.invitedUserId
      ..invitedByUserId = invitation.invitedByUserId
      ..role = invitation.role
      ..status = invitation.status
      ..createdAt = invitation.createdAt;
  }

  TeamInvitation toDomain() {
    return TeamInvitation(
      id: domainId,
      teamId: teamId,
      teamName: teamName,
      invitedUserId: invitedUserId,
      invitedByUserId: invitedByUserId,
      role: role,
      status: status,
      createdAt: createdAt,
    );
  }
}
