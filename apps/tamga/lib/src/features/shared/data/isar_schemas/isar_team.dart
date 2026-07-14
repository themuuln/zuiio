import 'package:isar/isar.dart';

import '../../../teams/domain/team.dart';

part 'isar_team.g.dart';

/// Isar collection for [Team].
@collection
class IsarTeam {
  IsarTeam();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;
  late String name;
  late String ownerUserId;
  late int memberCount;
  late int horseCount;
  late DateTime createdAt;

  factory IsarTeam.fromDomain(Team team) {
    return IsarTeam()
      ..domainId = team.id
      ..name = team.name
      ..ownerUserId = team.ownerUserId
      ..memberCount = team.memberCount
      ..horseCount = team.horseCount
      ..createdAt = team.createdAt;
  }

  Team toDomain() {
    return Team(
      id: domainId,
      name: name,
      ownerUserId: ownerUserId,
      memberCount: memberCount,
      horseCount: horseCount,
      createdAt: createdAt,
    );
  }
}
