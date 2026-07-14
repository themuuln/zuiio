import 'package:isar/isar.dart';

import '../../../map/domain/search_area.dart';

part 'isar_search_area.g.dart';

/// Isar collection for offline persistence of [SearchArea].
@collection
class IsarSearchArea {
  IsarSearchArea();

  Id id = Isar.autoIncrement;

  /// Domain model's String ID.
  @Index(unique: true, replace: true)
  late String domainId;

  late String name;
  late double centerLat;
  late double centerLng;
  late double radiusKm;
  late int color;
  late bool isActive;
  late String createdBy;
  late DateTime createdAt;

  factory IsarSearchArea.fromDomain(SearchArea area) {
    return IsarSearchArea()
      ..domainId = area.id
      ..name = area.name
      ..centerLat = area.centerLat
      ..centerLng = area.centerLng
      ..radiusKm = area.radiusKm
      ..color = area.color
      ..isActive = area.isActive
      ..createdBy = area.createdBy
      ..createdAt = area.createdAt;
  }

  SearchArea toDomain() {
    return SearchArea(
      id: domainId,
      name: name,
      centerLat: centerLat,
      centerLng: centerLng,
      radiusKm: radiusKm,
      color: color,
      isActive: isActive,
      createdBy: createdBy,
      createdAt: createdAt,
    );
  }
}
