class LineageTreeNode {
  const LineageTreeNode({
    required this.id,
    required this.name,
    required this.relationLabel,
    required this.coat,
    required this.birthYear,
    required this.awardCount,
    required this.offspringCount,
    required this.isOwnedByHousehold,
    required this.generation,
    required this.branchOrder,
    required this.sortOrder,
    this.isRoot = false,
    this.hiddenBranchCount = 0,
    this.photoUrl,
    this.sex,
    this.tamgaNo,
    this.region,
    this.speedIndex,
  });

  final String id;
  final String name;
  final String relationLabel;
  final String coat;
  final int birthYear;
  final int awardCount;
  final int offspringCount;
  final bool isOwnedByHousehold;
  final int generation;
  final int branchOrder;
  final int sortOrder;
  final bool isRoot;
  final int hiddenBranchCount;

  /// Зургийн URL.
  final String? photoUrl;

  /// Хүйс: 'stallion' | 'mare' | 'gelding' | 'foal'.
  final String? sex;

  /// Тамгын дугаар.
  final String? tamgaNo;

  /// Нутаг / аймаг.
  final String? region;

  /// Хурдын индекс (км/мин).
  final double? speedIndex;
}
