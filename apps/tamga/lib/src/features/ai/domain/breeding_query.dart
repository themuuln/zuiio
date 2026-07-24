/// Үржүүлгийн шинжилгээний асуулт (breeding analysis query).
///
/// Аав (sire) болон ээж (dam) морины ID-г агуулна.
class BreedingQuery {
  const BreedingQuery({required this.sireId, required this.damId});

  /// Аав морины ID.
  final String sireId;

  /// Ээж морины ID.
  final String damId;

  // ── Serialization ────────────────────────────────────────

  Map<String, dynamic> toJson() => {'sireId': sireId, 'damId': damId};

  factory BreedingQuery.fromJson(Map<String, dynamic> json) {
    return BreedingQuery(
      sireId: json['sireId'] as String,
      damId: json['damId'] as String,
    );
  }

  // ── Equality ─────────────────────────────────────────────

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is BreedingQuery &&
          runtimeType == other.runtimeType &&
          sireId == other.sireId &&
          damId == other.damId;

  @override
  int get hashCode => Object.hash(sireId, damId);

  @override
  String toString() => 'BreedingQuery(sireId: $sireId, damId: $damId)';
}
