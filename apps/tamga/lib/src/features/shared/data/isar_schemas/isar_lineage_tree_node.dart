import 'package:isar/isar.dart';

import '../../../lineage/domain/lineage_tree_node.dart';

part 'isar_lineage_tree_node.g.dart';

@collection
class IsarLineageTreeNode {
  IsarLineageTreeNode();

  Id id = Isar.autoIncrement;

  /// Domain model's String ID (e.g. 'tenger-khuleg').
  @Index(unique: true, replace: true)
  late String domainId;

  /// The root horse id this node belongs to (for snapshot grouping).
  @Index()
  late String rootId;

  late String name;
  late String relationLabel;
  late String coat;
  late int birthYear;
  late int awardCount;
  late int offspringCount;
  late bool isOwnedByHousehold;
  late int generation;
  late int branchOrder;
  late int sortOrder;
  late bool isRoot;
  late int hiddenBranchCount;
  String? photoUrl;
  String? sex;
  String? tamgaNo;
  String? region;
  double? speedIndex;

  factory IsarLineageTreeNode.fromDomain(
    LineageTreeNode node, {
    required String rootId,
  }) {
    return IsarLineageTreeNode()
      ..domainId = node.id
      ..rootId = rootId
      ..name = node.name
      ..relationLabel = node.relationLabel
      ..coat = node.coat
      ..birthYear = node.birthYear
      ..awardCount = node.awardCount
      ..offspringCount = node.offspringCount
      ..isOwnedByHousehold = node.isOwnedByHousehold
      ..generation = node.generation
      ..branchOrder = node.branchOrder
      ..sortOrder = node.sortOrder
      ..isRoot = node.isRoot
      ..hiddenBranchCount = node.hiddenBranchCount
      ..photoUrl = node.photoUrl
      ..sex = node.sex
      ..tamgaNo = node.tamgaNo
      ..region = node.region
      ..speedIndex = node.speedIndex;
  }

  LineageTreeNode toDomain() {
    return LineageTreeNode(
      id: domainId,
      name: name,
      relationLabel: relationLabel,
      coat: coat,
      birthYear: birthYear,
      awardCount: awardCount,
      offspringCount: offspringCount,
      isOwnedByHousehold: isOwnedByHousehold,
      generation: generation,
      branchOrder: branchOrder,
      sortOrder: sortOrder,
      isRoot: isRoot,
      hiddenBranchCount: hiddenBranchCount,
      photoUrl: photoUrl,
      sex: sex,
      tamgaNo: tamgaNo,
      region: region,
      speedIndex: speedIndex,
    );
  }
}
