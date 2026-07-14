import 'package:isar/isar.dart';

import '../../../lineage/domain/lineage_root.dart';

part 'isar_lineage_root.g.dart';

@collection
class IsarLineageRoot {
  IsarLineageRoot();

  Id id = Isar.autoIncrement;

  /// Domain model's String ID (e.g. 'khan-khuleg').
  @Index(unique: true, replace: true)
  late String domainId;

  late String name;
  late String coat;
  late int birthYear;
  late int offspringCount;
  late int awardCount;
  late String notes;

  factory IsarLineageRoot.fromDomain(LineageRoot root) {
    return IsarLineageRoot()
      ..domainId = root.id
      ..name = root.name
      ..coat = root.coat
      ..birthYear = root.birthYear
      ..offspringCount = root.offspringCount
      ..awardCount = root.awardCount
      ..notes = root.notes;
  }

  LineageRoot toDomain() {
    return LineageRoot(
      id: domainId,
      name: name,
      coat: coat,
      birthYear: birthYear,
      offspringCount: offspringCount,
      awardCount: awardCount,
      notes: notes,
    );
  }
}
