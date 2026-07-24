import 'dart:convert';

import 'package:isar/isar.dart';

import '../../../market/domain/saved_search.dart';

part 'isar_saved_search.g.dart';

/// Isar-д хадгалах хадгалсан хайлтын схем.
@collection
class IsarSavedSearch {
  IsarSavedSearch();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;

  @Index()
  late String userId;

  /// Шүүлтүүрийн тохиргоог JSON тэмдэгт мөр хэлбэрээр хадгалах.
  late String filtersJson;

  late String name;
  late DateTime createdAt;
  DateTime? lastNotifiedAt;

  factory IsarSavedSearch.fromDomain(SavedSearch search) {
    return IsarSavedSearch()
      ..domainId = search.id
      ..userId = search.userId
      ..filtersJson = jsonEncode(search.filters)
      ..name = search.name
      ..createdAt = search.createdAt
      ..lastNotifiedAt = search.lastNotifiedAt;
  }

  SavedSearch toDomain() {
    return SavedSearch(
      id: domainId,
      userId: userId,
      filters: Map<String, dynamic>.from(
        jsonDecode(filtersJson) as Map,
      ),
      name: name,
      createdAt: createdAt,
      lastNotifiedAt: lastNotifiedAt,
    );
  }
}
