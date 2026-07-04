/// Уралдааны төрөл.
///
/// Тэмцээний цар хүрээг тодорхойлно.
enum RaceType {
  naadam,
  regional,
  local;

  /// Монгол хэл дээрх төрлийн нэр.
  String get displayName => switch (this) {
    RaceType.naadam => 'Наадам',
    RaceType.regional => 'Бүс',
    RaceType.local => 'Орон нутгийн',
  };
}

/// Уралдааны төлөв.
enum RaceStatus {
  upcoming,
  ongoing,
  completed,
  cancelled;

  /// Монгол хэл дээрх төлвийн нэр.
  String get displayName => switch (this) {
    RaceStatus.upcoming => 'Удахгүй',
    RaceStatus.ongoing => 'Үргэлжилж буй',
    RaceStatus.completed => 'Дууссан',
    RaceStatus.cancelled => 'Цуцлагдсан',
  };
}

/// Уралдааны domain model.
///
/// - `id` — уралдааны өвөрмөц ID
/// - `name` — уралдааны нэр
/// - `location` — уралдааны байршил
/// - `date` — уралдааны огноо
/// - `type` — уралдааны төрөл (naadam/regional/local)
/// - `status` — уралдааны төлөв (upcoming/ongoing/completed/cancelled)
/// - `maxEntries` — оролцогчдын дээд тоо (null бол хязгааргүй)
/// - `entryFee` — оролцооны төлбөр (төгрөгөөр)
/// - `organizerId` — зохион байгуулагчийн ID
/// - `description` — уралдааны тодорхойлолт
/// - `prizeDistribution` — шагналын хуваарилалт
///
/// Бүх serialization-ийг нэг дор:
/// - `toJson()` / `fromJson()` — локал хадгалалтад (camelCase)
/// - `toSupabaseJson()` / `fromSupabaseJson()` — Supabase-д (snake_case)
class Race {
  const Race({
    required this.id,
    required this.name,
    this.location,
    this.date,
    this.type = RaceType.local,
    this.status = RaceStatus.upcoming,
    this.maxEntries,
    this.entryFee = 0,
    this.organizerId = '',
    this.description,
    this.prizeDistribution,
  });

  final String id;
  final String name;
  final String? location;
  final DateTime? date;
  final RaceType type;
  final RaceStatus status;
  final int? maxEntries;
  final int entryFee;
  final String organizerId;
  final String? description;
  final String? prizeDistribution;

  /// Уралдаан ирээдүйд болох уу?
  bool get isUpcoming => status == RaceStatus.upcoming;

  /// Уралдаан дууссан уу?
  bool get isCompleted => status == RaceStatus.completed;

  /// Оролцогчдын дээд тоо тогтоогдсон эсэх.
  bool get hasMaxEntries => maxEntries != null && maxEntries! > 0;

  Race copyWith({
    String? id,
    String? name,
    String? location,
    DateTime? date,
    RaceType? type,
    RaceStatus? status,
    int? maxEntries,
    int? entryFee,
    String? organizerId,
    String? description,
    String? prizeDistribution,
  }) {
    return Race(
      id: id ?? this.id,
      name: name ?? this.name,
      location: location ?? this.location,
      date: date ?? this.date,
      type: type ?? this.type,
      status: status ?? this.status,
      maxEntries: maxEntries ?? this.maxEntries,
      entryFee: entryFee ?? this.entryFee,
      organizerId: organizerId ?? this.organizerId,
      description: description ?? this.description,
      prizeDistribution: prizeDistribution ?? this.prizeDistribution,
    );
  }

  // ============================================================
  // Local JSON (camelCase)
  // ============================================================

  factory Race.fromJson(Map<String, dynamic> json) {
    return Race(
      id: json['id'] as String,
      name: json['name'] as String,
      location: json['location'] as String?,
      date: json['date'] != null
          ? DateTime.parse(json['date'] as String)
          : null,
      type: RaceType.values.byName(json['type'] as String? ?? 'local'),
      status: RaceStatus.values.byName(json['status'] as String? ?? 'upcoming'),
      maxEntries: json['maxEntries'] as int?,
      entryFee: json['entryFee'] as int? ?? 0,
      organizerId: json['organizerId'] as String? ?? '',
      description: json['description'] as String?,
      prizeDistribution: json['prizeDistribution'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'location': location,
      'date': date?.toIso8601String(),
      'type': type.name,
      'status': status.name,
      'maxEntries': maxEntries,
      'entryFee': entryFee,
      'organizerId': organizerId,
      'description': description,
      'prizeDistribution': prizeDistribution,
    };
  }

  // ============================================================
  // Supabase JSON (snake_case)
  // ============================================================

  factory Race.fromSupabaseJson(Map<String, dynamic> json) {
    return Race(
      id: json['id'] as String,
      name: json['name'] as String,
      location: json['location'] as String?,
      date: json['date'] != null
          ? DateTime.parse(json['date'] as String)
          : null,
      type: RaceType.values.byName(json['type'] as String? ?? 'local'),
      status: RaceStatus.values.byName(json['status'] as String? ?? 'upcoming'),
      maxEntries: json['max_entries'] as int?,
      entryFee: json['entry_fee'] as int? ?? 0,
      organizerId: json['organizer_id'] as String? ?? '',
      description: json['description'] as String?,
      prizeDistribution: json['prize_distribution'] as String?,
    );
  }

  Map<String, dynamic> toSupabaseJson() {
    return {
      'id': id,
      'name': name,
      'location': location,
      'date': date?.toIso8601String(),
      'type': type.name,
      'status': status.name,
      'max_entries': maxEntries,
      'entry_fee': entryFee,
      'organizer_id': organizerId,
      'description': description,
      'prize_distribution': prizeDistribution,
      'updated_at': DateTime.now().toIso8601String(),
    };
  }

  // ============================================================
  // Equality
  // ============================================================

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Race &&
          id == other.id &&
          name == other.name &&
          type == other.type &&
          status == other.status;

  @override
  int get hashCode => Object.hash(id, name, type, status);

  @override
  String toString() => 'Race(id: $id, name: $name, type: ${type.name})';
}
