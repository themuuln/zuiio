/// Уралдаан, дуудлага худалдаа, үзэсгэлэн, сургалтын төрөл.
enum EventType {
  race,
  auction,
  expo,
  training;

  /// Монгол хэл дээрх төрлийн нэр.
  String get displayName => switch (this) {
    EventType.race => 'Уралдаан',
    EventType.auction => 'Дуудлага худалдаа',
    EventType.expo => 'Үзэсгэлэн худалдаа',
    EventType.training => 'Сургалт/Зөвлөгөө',
  };
}

/// Тэмцээн, уралдааны нэгдсэн domain model.
///
/// Хуучин EventRecord-ийг орлоно. Бүх serialization-ийг нэг дор:
/// - `toJson()` / `fromJson()` — локал хадгалалтад (camelCase)
/// - `toSupabaseJson()` / `fromSupabaseJson()` — Supabase-д (snake_case)
/// Арга хэмжээний нэгдсэн domain model.
///
/// Хуучин EventRecord-ийг орлоно. Бүх serialization-ийг нэг дор:
/// - `toJson()` / `fromJson()` — локал хадгалалтад (camelCase)
/// - `toSupabaseJson()` / `fromSupabaseJson()` — Supabase-д (snake_case)
class Event {
  const Event({
    required this.id,
    required this.horseId,
    required this.title,
    required this.eventType,
    required this.createdAt,
    required this.updatedAt,
    this.ownerId = '',
    this.date,
    this.horseName,
    this.location,
    this.latitude,
    this.longitude,
    this.result,
    this.prizeAmount,
    this.organizerName,
    this.organizerPhone,
    this.organizerEmail,
    this.isFeatured = false,
    this.registrationEnabled = false,
    this.address,
    this.notes,
    this.photoUrls = const [],
  });

  final String id;
  final String horseId;
  final String title;
  final EventType eventType;
  final String ownerId;
  final DateTime? date;
  final String? horseName;
  final String? location;
  final double? latitude;
  final double? longitude;
  final String? result;
  final int? prizeAmount;
  final String? organizerName;
  final String? organizerPhone;
  final String? organizerEmail;
  final bool isFeatured;
  final bool registrationEnabled;
  final String? address;
  final String? notes;
  final List<String> photoUrls;
  final DateTime createdAt;
  final DateTime updatedAt;

  bool get isUpcoming => date == null || date!.isAfter(DateTime.now());

  Event copyWith({
    String? id,
    String? horseId,
    String? title,
    EventType? eventType,
    String? ownerId,
    DateTime? date,
    String? horseName,
    String? location,
    double? latitude,
    double? longitude,
    String? result,
    int? prizeAmount,
    String? organizerName,
    String? organizerPhone,
    String? organizerEmail,
    bool? isFeatured,
    bool? registrationEnabled,
    String? address,
    String? notes,
    List<String>? photoUrls,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Event(
      id: id ?? this.id,
      horseId: horseId ?? this.horseId,
      title: title ?? this.title,
      eventType: eventType ?? this.eventType,
      ownerId: ownerId ?? this.ownerId,
      date: date ?? this.date,
      horseName: horseName ?? this.horseName,
      location: location ?? this.location,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      result: result ?? this.result,
      prizeAmount: prizeAmount ?? this.prizeAmount,
      organizerName: organizerName ?? this.organizerName,
      organizerPhone: organizerPhone ?? this.organizerPhone,
      organizerEmail: organizerEmail ?? this.organizerEmail,
      isFeatured: isFeatured ?? this.isFeatured,
      registrationEnabled: registrationEnabled ?? this.registrationEnabled,
      address: address ?? this.address,
      notes: notes ?? this.notes,
      photoUrls: photoUrls ?? this.photoUrls,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  // ============================================================
  // Local JSON (camelCase)
  // ============================================================

  factory Event.fromJson(Map<String, dynamic> json) {
    return Event(
      id: json['id'] as String,
      horseId: json['horseId'] as String,
      title: json['title'] as String,
      eventType: EventType.values.byName(json['eventType'] as String),
      ownerId: json['ownerId'] as String? ?? '',
      date: json['date'] != null
          ? DateTime.parse(json['date'] as String)
          : null,
      horseName: json['horseName'] as String?,
      location: json['location'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      result: json['result'] as String?,
      prizeAmount: json['prizeAmount'] as int?,
      organizerName: json['organizerName'] as String?,
      organizerPhone: json['organizerPhone'] as String?,
      organizerEmail: json['organizerEmail'] as String?,
      isFeatured: json['isFeatured'] as bool? ?? false,
      registrationEnabled: json['registrationEnabled'] as bool? ?? false,
      address: json['address'] as String?,
      notes: json['notes'] as String?,
      photoUrls:
          (json['photoUrls'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'horseId': horseId,
      'title': title,
      'eventType': eventType.name,
      'ownerId': ownerId,
      'date': date?.toIso8601String(),
      'horseName': horseName,
      'location': location,
      'latitude': latitude,
      'longitude': longitude,
      'result': result,
      'prizeAmount': prizeAmount,
      'organizerName': organizerName,
      'organizerPhone': organizerPhone,
      'organizerEmail': organizerEmail,
      'isFeatured': isFeatured,
      'registrationEnabled': registrationEnabled,
      'address': address,
      'notes': notes,
      'photoUrls': photoUrls,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  // ============================================================
  // Supabase JSON (snake_case)
  // ============================================================

  factory Event.fromSupabaseJson(Map<String, dynamic> json) {
    return Event(
      id: json['id'] as String,
      horseId: json['horse_id'] as String,
      title: json['title'] as String,
      eventType: EventType.values.byName(json['event_type'] as String),
      ownerId: json['owner_id'] as String? ?? '',
      date: json['date'] != null
          ? DateTime.parse(json['date'] as String)
          : null,
      horseName: json['horse_name'] as String?,
      location: json['location'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      result: json['result'] as String?,
      prizeAmount: json['prize_amount'] as int?,
      organizerName: json['organizer_name'] as String?,
      organizerPhone: json['organizer_phone'] as String?,
      organizerEmail: json['organizer_email'] as String?,
      isFeatured: json['is_featured'] as bool? ?? false,
      registrationEnabled: json['registration_enabled'] as bool? ?? false,
      address: json['address'] as String?,
      notes: json['notes'] as String?,
      photoUrls:
          (json['photo_urls'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      createdAt:
          DateTime.tryParse(json['created_at'] as String? ?? '') ??
          DateTime.now(),
      updatedAt:
          DateTime.tryParse(json['updated_at'] as String? ?? '') ??
          DateTime.now(),
    );
  }

  Map<String, dynamic> toSupabaseJson({required String ownerId}) {
    return {
      'owner_id': ownerId,
      'id': id,
      'horse_id': horseId,
      'title': title,
      'event_type': eventType.name,
      'date': date?.toIso8601String(),
      'horse_name': horseName,
      'location': location,
      'latitude': latitude,
      'longitude': longitude,
      'result': result,
      'prize_amount': prizeAmount,
      'organizer_name': organizerName,
      'organizer_phone': organizerPhone,
      'organizer_email': organizerEmail,
      'is_featured': isFeatured,
      'registration_enabled': registrationEnabled,
      'address': address,
      'notes': notes,
      'photo_urls': photoUrls,
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
      other is Event &&
          id == other.id &&
          horseId == other.horseId &&
          title == other.title &&
          ownerId == other.ownerId;

  @override
  int get hashCode => Object.hash(id, horseId, title, ownerId);

  @override
  String toString() => 'Event(id: $id, title: $title, type: ${eventType.name})';
}
