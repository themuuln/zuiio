/// Хадгалсан хайлтын загвар.
///
/// Хэрэглэгчийн хадгалсан шүүлтүүрийн тохиргоог хадгална.
/// Шинэ зар нийтлэгдэх үед тохирох хайлтуудыг шалгаж,
/// тохирсон тохиолдолд мэдэгдэл илгээнэ.
class SavedSearch {
  const SavedSearch({
    required this.id,
    required this.userId,
    required this.filters,
    required this.name,
    required this.createdAt,
    this.lastNotifiedAt,
  });

  /// Хайлтын ID.
  final String id;

  /// Хэрэглэгчийн ID.
  final String userId;

  /// Хадгалсан шүүлтүүрийн тохиргоо (MarketFilters-ийн Map хэлбэр).
  ///
  /// Түлхүүрүүд: saleType, verifiedOnly, location, minPrice, maxPrice, breed, sort, query
  final Map<String, dynamic> filters;

  /// Хайлтын нэр.
  final String name;

  /// Үүсгэсэн огноо.
  final DateTime createdAt;

  /// Хамгийн сүүлд мэдэгдэл илгээсэн огноо (`null` бол хараахан илгээгээгүй).
  final DateTime? lastNotifiedAt;

  // ── Copy ─────────────────────────────────────────────────────────

  SavedSearch copyWith({
    String? id,
    String? userId,
    Map<String, dynamic>? filters,
    String? name,
    DateTime? createdAt,
    Object? lastNotifiedAt = _sentinel,
  }) {
    return SavedSearch(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      filters: filters ?? this.filters,
      name: name ?? this.name,
      createdAt: createdAt ?? this.createdAt,
      lastNotifiedAt: lastNotifiedAt == _sentinel
          ? this.lastNotifiedAt
          : lastNotifiedAt as DateTime?,
    );
  }

  // ── Serialization ────────────────────────────────────────────────

  factory SavedSearch.fromJson(Map<String, dynamic> json) {
    return SavedSearch(
      id: json['id'] as String,
      userId: json['userId'] as String,
      filters: Map<String, dynamic>.from(json['filters'] as Map),
      name: json['name'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      lastNotifiedAt: json['lastNotifiedAt'] != null
          ? DateTime.parse(json['lastNotifiedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'filters': filters,
      'name': name,
      'createdAt': createdAt.toIso8601String(),
      'lastNotifiedAt': lastNotifiedAt?.toIso8601String(),
    };
  }

  // ── Equality ─────────────────────────────────────────────────────

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is SavedSearch &&
          id == other.id &&
          userId == other.userId &&
          name == other.name;

  @override
  int get hashCode => Object.hash(id, userId, name);

  @override
  String toString() => 'SavedSearch(id: $id, name: $name, userId: $userId)';
}

const _sentinel = Object();
