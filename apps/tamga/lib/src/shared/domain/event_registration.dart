/// Арга хэмжээнд морь бүртгүүлэх төлөв.
enum RegistrationStatus {
  registered,
  confirmed,
  cancelled;

  /// Монгол хэл дээрх төлвийн нэр.
  String get displayName => switch (this) {
    RegistrationStatus.registered => 'Бүртгэгдсэн',
    RegistrationStatus.confirmed => 'Баталгаажсан',
    RegistrationStatus.cancelled => 'Цуцлагдсан',
  };
}

/// Арга хэмжээнд морины бүртгэлийн domain model.
///
/// - `id` — бүртгэлийн өвөрмөц ID
/// - `eventId` — арга хэмжээний ID
/// - `horseId` — морины ID
/// - `ownerId` — бүртгүүлсэн хэрэглэгчийн ID
/// - `registeredAt` — бүртгүүлсэн огноо
/// - `status` — бүртгэлийн төлөв (registered, confirmed, cancelled)
/// - `notes` — нэмэлт тэмдэглэл
///
/// Бүх serialization-ийг нэг дор:
/// - `toJson()` / `fromJson()` — локал хадгалалтад (camelCase)
/// - `toSupabaseJson()` / `fromSupabaseJson()` — Supabase-д (snake_case)
class EventRegistration {
  const EventRegistration({
    required this.id,
    required this.eventId,
    required this.horseId,
    required this.ownerId,
    required this.registeredAt,
    required this.createdAt,
    required this.updatedAt,
    this.status = RegistrationStatus.registered,
    this.notes,
  });

  final String id;
  final String eventId;
  final String horseId;
  final String ownerId;
  final DateTime registeredAt;
  final RegistrationStatus status;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  EventRegistration copyWith({
    String? id,
    String? eventId,
    String? horseId,
    String? ownerId,
    DateTime? registeredAt,
    RegistrationStatus? status,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return EventRegistration(
      id: id ?? this.id,
      eventId: eventId ?? this.eventId,
      horseId: horseId ?? this.horseId,
      ownerId: ownerId ?? this.ownerId,
      registeredAt: registeredAt ?? this.registeredAt,
      status: status ?? this.status,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  // ============================================================
  // Local JSON (camelCase)
  // ============================================================

  factory EventRegistration.fromJson(Map<String, dynamic> json) {
    return EventRegistration(
      id: json['id'] as String,
      eventId: json['eventId'] as String,
      horseId: json['horseId'] as String,
      ownerId: json['ownerId'] as String,
      registeredAt: DateTime.parse(json['registeredAt'] as String),
      status: RegistrationStatus.values.byName(
        json['status'] as String? ?? 'registered',
      ),
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'eventId': eventId,
      'horseId': horseId,
      'ownerId': ownerId,
      'registeredAt': registeredAt.toIso8601String(),
      'status': status.name,
      'notes': notes,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  // ============================================================
  // Supabase JSON (snake_case)
  // ============================================================

  factory EventRegistration.fromSupabaseJson(Map<String, dynamic> json) {
    return EventRegistration(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      horseId: json['horse_id'] as String,
      ownerId: json['owner_id'] as String,
      registeredAt: DateTime.parse(json['registered_at'] as String),
      status: RegistrationStatus.values.byName(
        json['status'] as String? ?? 'registered',
      ),
      notes: json['notes'] as String?,
      createdAt:
          DateTime.tryParse(json['created_at'] as String? ?? '') ??
          DateTime.now(),
      updatedAt:
          DateTime.tryParse(json['updated_at'] as String? ?? '') ??
          DateTime.now(),
    );
  }

  Map<String, dynamic> toSupabaseJson() {
    return {
      'id': id,
      'event_id': eventId,
      'horse_id': horseId,
      'owner_id': ownerId,
      'registered_at': registeredAt.toIso8601String(),
      'status': status.name,
      'notes': notes,
      'created_at': createdAt.toIso8601String(),
      'updated_at': DateTime.now().toIso8601String(),
    };
  }

  // ============================================================
  // Equality
  // ============================================================

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is EventRegistration &&
          id == other.id &&
          eventId == other.eventId &&
          horseId == other.horseId;

  @override
  int get hashCode => Object.hash(id, eventId, horseId);

  @override
  String toString() =>
      'EventRegistration(id: $id, eventId: $eventId, horseId: $horseId, '
      'status: ${status.name})';
}
