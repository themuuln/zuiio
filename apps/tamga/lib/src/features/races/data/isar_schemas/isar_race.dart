import 'package:isar/isar.dart';

import '../../domain/race.dart';

part 'isar_race.g.dart';

@collection
class IsarRace {
  IsarRace();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;
  late String name;
  String? location;
  DateTime? date;
  @enumerated
  late RaceType raceType;
  @enumerated
  late RaceStatus raceStatus;
  int? maxEntries;
  int? entryFee;
  String? organizerId;
  String? description;
  String? prizeDistribution;

  factory IsarRace.fromDomain(Race race) {
    return IsarRace()
      ..domainId = race.id
      ..name = race.name
      ..location = race.location
      ..date = race.date
      ..raceType = race.type
      ..raceStatus = race.status
      ..maxEntries = race.maxEntries
      ..entryFee = race.entryFee > 0 ? race.entryFee : null
      ..organizerId = race.organizerId.isEmpty ? null : race.organizerId
      ..description = race.description
      ..prizeDistribution = race.prizeDistribution;
  }

  Race toDomain() {
    return Race(
      id: domainId,
      name: name,
      location: location,
      date: date,
      type: raceType,
      status: raceStatus,
      maxEntries: maxEntries,
      entryFee: entryFee ?? 0,
      organizerId: organizerId ?? '',
      description: description,
      prizeDistribution: prizeDistribution,
    );
  }
}
