import 'dart:convert';

import 'package:isar/isar.dart';

import '../../../../shared/domain/horse.dart';
import '../../../../shared/domain/horse_breed_lineage.dart';
import '../../../../shared/domain/horse_coat_color.dart';
import '../../../../shared/domain/horse_markings.dart';

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

  // ── Previously missing from Isar (restored) ──
  String? microchipId;
  String? registrationNo;
  List<String>? photoUrls;
  DateTime? registrationDate;
  late bool tamgaVerified;
  late bool stateVerified;

  // ── New fields ──
  String? sireId;
  String? damId;
  int? coatColorIndex;
  int? breedLineageIndex;
  String? region;
  String? sum;
  String? markingsJson;
  String? tamgaBrandClan;
  int? tamgaBrandGeneration;

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
      ..updatedAt = horse.updatedAt
      // Restored fields
      ..microchipId = horse.microchipId
      ..registrationNo = horse.registrationNo
      ..photoUrls = horse.photoUrls.isNotEmpty ? horse.photoUrls : null
      ..registrationDate = horse.registrationDate
      ..tamgaVerified = horse.tamgaVerified
      ..stateVerified = horse.stateVerified
      // New fields
      ..sireId = horse.sireId
      ..damId = horse.damId
      ..coatColorIndex = horse.coatColor?.index
      ..breedLineageIndex = horse.breedLineage?.index
      ..region = horse.region
      ..sum = horse.sum
      ..markingsJson = horse.markings != null
          ? jsonEncode(horse.markings!.toJson())
          : null
      ..tamgaBrandClan = horse.tamgaBrandClan
      ..tamgaBrandGeneration = horse.tamgaBrandGeneration;
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
      // Restored fields
      microchipId: microchipId,
      registrationNo: registrationNo,
      photoUrls: photoUrls?.toList() ?? [],
      registrationDate: registrationDate,
      tamgaVerified: tamgaVerified,
      stateVerified: stateVerified,
      // New fields
      sireId: sireId,
      damId: damId,
      coatColor: coatColorIndex != null
          ? MongolianCoatColor.values[coatColorIndex!]
          : null,
      breedLineage: breedLineageIndex != null
          ? MongolianBreedLineage.values[breedLineageIndex!]
          : null,
      region: region,
      sum: sum,
      markings: markingsJson != null
          ? HorseMarkings.fromJson(
              jsonDecode(markingsJson!) as Map<String, dynamic>,
            )
          : null,
      tamgaBrandClan: tamgaBrandClan,
      tamgaBrandGeneration: tamgaBrandGeneration,
    );
  }
}
