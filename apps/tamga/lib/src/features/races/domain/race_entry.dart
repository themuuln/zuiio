/// Уралдаанд морины бүртгэлийн төлөв.
enum RaceEntryStatus {
  registered,
  confirmed,
  competed,
  scratched;

  /// Монгол хэл дээрх төлвийн нэр.
  String get displayName => switch (this) {
    RaceEntryStatus.registered => 'Бүртгэгдсэн',
    RaceEntryStatus.confirmed => 'Баталгаажсан',
    RaceEntryStatus.competed => 'Оролцсон',
    RaceEntryStatus.scratched => 'Татгалзсан',
  };
}

/// Уралдаанд морины бүртгэлийн domain model.
///
/// - `id` — бүртгэлийн өвөрмөц ID
/// - `raceId` — уралдааны ID
/// - `horseId` — морины ID
/// - `ownerId` — бүртгүүлсэн хэрэглэгчийн ID
/// - `jockeyName` — морьтны нэр
/// - `status` — бүртгэлийн төлөв (registered/confirmed/competed/scratched)
/// - `result` — уралдааны дүн (цаг/амжилт)
/// - `placement` — байр (1, 2, 3, ...)
/// - `prize` — шагналын мөнгө
///
/// Бүх serialization-ийг нэг дор:
/// - `toJson()` / `fromJson()` — локал хадгалалтад (camelCase)
/// - `toSupabaseJson()` / `fromSupabaseJson()` — Supabase-д (snake_case)
class RaceEntry {
  const RaceEntry({
    required this.id,
    required this.raceId,
    required this.horseId,
    required this.ownerId,
    this.jockeyName,
    this.status = RaceEntryStatus.registered,
    this.result,
    this.placement,
    this.prize,
  });

  final String id;
  final String raceId;
  final String horseId;
  final String ownerId;
  final String? jockeyName;
  final RaceEntryStatus status;
  final String? result;
  final int? placement;
  final int? prize;

  RaceEntry copyWith({
    String? id,
    String? raceId,
    String? horseId,
    String? ownerId,
    String? jockeyName,
    RaceEntryStatus? status,
    String? result,
    int? placement,
    int? prize,
  }) {
    return RaceEntry(
      id: id ?? this.id,
      raceId: raceId ?? this.raceId,
      horseId: horseId ?? this.horseId,
      ownerId: ownerId ?? this.ownerId,
      jockeyName: jockeyName ?? this.jockeyName,
      status: status ?? this.status,
      result: result ?? this.result,
      placement: placement ?? this.placement,
      prize: prize ?? this.prize,
    );
  }

  // ============================================================
  // Local JSON (camelCase)
  // ============================================================

  factory RaceEntry.fromJson(Map<String, dynamic> json) {
    return RaceEntry(
      id: json['id'] as String,
      raceId: json['raceId'] as String,
      horseId: json['horseId'] as String,
      ownerId: json['ownerId'] as String? ?? '',
      jockeyName: json['jockeyName'] as String?,
      status: RaceEntryStatus.values.byName(
        json['status'] as String? ?? 'registered',
      ),
      result: json['result'] as String?,
      placement: json['placement'] as int?,
      prize: json['prize'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'raceId': raceId,
      'horseId': horseId,
      'ownerId': ownerId,
      'jockeyName': jockeyName,
      'status': status.name,
      'result': result,
      'placement': placement,
      'prize': prize,
    };
  }

  // ============================================================
  // Supabase JSON (snake_case)
  // ============================================================

  factory RaceEntry.fromSupabaseJson(Map<String, dynamic> json) {
    return RaceEntry(
      id: json['id'] as String,
      raceId: json['race_id'] as String,
      horseId: json['horse_id'] as String,
      ownerId: json['owner_id'] as String? ?? '',
      jockeyName: json['jockey_name'] as String?,
      status: RaceEntryStatus.values.byName(
        json['status'] as String? ?? 'registered',
      ),
      result: json['result'] as String?,
      placement: json['placement'] as int?,
      prize: json['prize'] as int?,
    );
  }

  Map<String, dynamic> toSupabaseJson() {
    return {
      'id': id,
      'race_id': raceId,
      'horse_id': horseId,
      'owner_id': ownerId,
      'jockey_name': jockeyName,
      'status': status.name,
      'result': result,
      'placement': placement,
      'prize': prize,
      'updated_at': DateTime.now().toIso8601String(),
    };
  }

  // ============================================================
  // Equality
  // ============================================================

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is RaceEntry &&
          id == other.id &&
          raceId == other.raceId &&
          horseId == other.horseId &&
          ownerId == other.ownerId;

  @override
  int get hashCode => Object.hash(id, raceId, horseId, ownerId);

  @override
  String toString() =>
      'RaceEntry(id: $id, raceId: $raceId, horseId: $horseId, '
      'status: ${status.name})';
}
