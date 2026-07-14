import 'package:isar/isar.dart';

import '../../domain/race_entry.dart';

part 'isar_race_entry.g.dart';

@collection
class IsarRaceEntry {
  IsarRaceEntry();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;
  late String raceId;
  @Index()
  late String horseId;
  late String ownerId;
  String? jockeyName;
  @enumerated
  late RaceEntryStatus entryStatus;
  String? result;
  int? placement;
  int? prize;

  factory IsarRaceEntry.fromDomain(RaceEntry entry) {
    return IsarRaceEntry()
      ..domainId = entry.id
      ..raceId = entry.raceId
      ..horseId = entry.horseId
      ..ownerId = entry.ownerId
      ..jockeyName = entry.jockeyName
      ..entryStatus = entry.status
      ..result = entry.result
      ..placement = entry.placement
      ..prize = entry.prize;
  }

  RaceEntry toDomain() {
    return RaceEntry(
      id: domainId,
      raceId: raceId,
      horseId: horseId,
      ownerId: ownerId,
      jockeyName: jockeyName,
      status: entryStatus,
      result: result,
      placement: placement,
      prize: prize,
    );
  }
}
