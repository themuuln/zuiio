import 'package:isar/isar.dart';

import '../../../teams/domain/team_member.dart';

part 'isar_team_member.g.dart';

/// Isar collection for [TeamMember].
@collection
class IsarTeamMember {
  IsarTeamMember();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;
  @Index()
  late String teamId;
  @Index()
  late String userId;
  @enumerated
  late TeamRole role;
  List<String>? permissions; // Stored as list of permission names
  late DateTime joinedAt;

  factory IsarTeamMember.fromDomain(TeamMember member) {
    return IsarTeamMember()
      ..domainId = member.id
      ..teamId = member.teamId
      ..userId = member.userId
      ..role = member.role
      ..permissions =
          member.permissions.isNotEmpty
              ? member.permissions.map((p) => p.name).toList()
              : null
      ..joinedAt = member.joinedAt;
  }

  TeamMember toDomain() {
    return TeamMember(
      id: domainId,
      teamId: teamId,
      userId: userId,
      role: role,
      permissions:
          permissions
                  ?.map((e) => TeamPermission.values.byName(e))
                  .toList() ??
              [],
      joinedAt: joinedAt,
    );
  }
}
