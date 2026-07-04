import 'package:isar/isar.dart';

import '../../../map/domain/horse_location.dart';

part 'isar_horse_location.g.dart';

/// Isar collection for offline persistence of [HorseLocation].
@collection
class IsarHorseLocation {
  IsarHorseLocation();

  Id id = Isar.autoIncrement;

  /// Domain model's String ID (horseId).
  @Index(unique: true, replace: true)
  late String domainId;

  late String horseName;
  late String ownerId;
  late String ownerName;
  late double lat;
  late double lng;
  late DateTime lastUpdated;
  late bool isVisible;
  String? coatColor;

  factory IsarHorseLocation.fromDomain(HorseLocation location) {
    return IsarHorseLocation()
      ..domainId = location.horseId
      ..horseName = location.horseName
      ..ownerId = location.ownerId
      ..ownerName = location.ownerName
      ..lat = location.lat
      ..lng = location.lng
      ..lastUpdated = location.lastUpdated
      ..isVisible = location.isVisible
      ..coatColor = location.coatColor;
  }

  HorseLocation toDomain() {
    return HorseLocation(
      horseId: domainId,
      horseName: horseName,
      ownerId: ownerId,
      ownerName: ownerName,
      lat: lat,
      lng: lng,
      lastUpdated: lastUpdated,
      isVisible: isVisible,
      coatColor: coatColor,
    );
  }
}
