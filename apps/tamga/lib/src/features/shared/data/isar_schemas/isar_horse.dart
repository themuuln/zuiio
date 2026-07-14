import 'package:isar/isar.dart';

import '../../../../shared/domain/horse.dart';

part 'isar_horse.g.dart';

@collection
class IsarHorse {
  IsarHorse();

  Id id = Isar.autoIncrement;

  /// Domain model's String ID (e.g. 'khan-khuleg').
  @Index(unique: true, replace: true)
  late String domainId;

  late String name;
  late String relationLabel;
  late String coat;
  late int birthYear;
  late int awardCount;
  late int offspringCount;
  late bool isOwnedByHousehold;
  late String notes;
  @enumerated
  late HorseGender gender;
  @Index()
  String? lineageRootId;
  String? ownerStampSvg;
  late DateTime createdAt;
  late DateTime updatedAt;

  factory IsarHorse.fromDomain(Horse horse) {
    return IsarHorse()
      ..domainId = horse.id
      ..name = horse.name
      ..relationLabel = horse.relationLabel
      ..coat = horse.coat
      ..birthYear = horse.birthYear
      ..awardCount = horse.awardCount
      ..offspringCount = horse.offspringCount
      ..isOwnedByHousehold = horse.isOwnedByHousehold
      ..notes = horse.notes
      ..gender = horse.gender
      ..lineageRootId = horse.lineageRootId
      ..ownerStampSvg = horse.ownerStampSvg
      ..createdAt = horse.createdAt
      ..updatedAt = horse.updatedAt;
  }

  Horse toDomain() {
    return Horse(
      id: domainId,
      name: name,
      relationLabel: relationLabel,
      coat: coat,
      birthYear: birthYear,
      awardCount: awardCount,
      offspringCount: offspringCount,
      isOwnedByHousehold: isOwnedByHousehold,
      notes: notes,
      gender: gender,
      lineageRootId: lineageRootId,
      ownerStampSvg: ownerStampSvg,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
