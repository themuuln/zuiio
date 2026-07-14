class EventRecord {
  const EventRecord({
    required this.id,
    required this.title,
    required this.horseId,
    required this.horseName,
    required this.eventType,
    required this.dateLabel,
    required this.placeLabel,
    required this.awardLabel,
    required this.notes,
    required this.isUpcoming,
    this.photoUrls = const [],
  });

  final String id;
  final String title;
  final String horseId;
  final String horseName;
  final String eventType;
  final String dateLabel;
  final String placeLabel;
  final String awardLabel;
  final String notes;
  final bool isUpcoming;
  final List<String> photoUrls;

  EventRecord copyWith({
    String? id,
    String? title,
    String? horseId,
    String? horseName,
    String? eventType,
    String? dateLabel,
    String? placeLabel,
    String? awardLabel,
    String? notes,
    bool? isUpcoming,
    List<String>? photoUrls,
  }) {
    return EventRecord(
      id: id ?? this.id,
      title: title ?? this.title,
      horseId: horseId ?? this.horseId,
      horseName: horseName ?? this.horseName,
      eventType: eventType ?? this.eventType,
      dateLabel: dateLabel ?? this.dateLabel,
      placeLabel: placeLabel ?? this.placeLabel,
      awardLabel: awardLabel ?? this.awardLabel,
      notes: notes ?? this.notes,
      isUpcoming: isUpcoming ?? this.isUpcoming,
      photoUrls: photoUrls ?? this.photoUrls,
    );
  }

  factory EventRecord.fromJson(Map<String, dynamic> json) {
    return EventRecord(
      id: json['id'] as String,
      title: json['title'] as String,
      horseId: json['horseId'] as String,
      horseName: json['horseName'] as String,
      eventType: json['eventType'] as String,
      dateLabel: json['dateLabel'] as String,
      placeLabel: json['placeLabel'] as String,
      awardLabel: json['awardLabel'] as String,
      notes: json['notes'] as String,
      isUpcoming: json['isUpcoming'] as bool,
      photoUrls:
          (json['photoUrls'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
    );
  }

  factory EventRecord.fromSupabaseJson(Map<String, dynamic> json) {
    return EventRecord(
      id: json['id'] as String,
      title: json['title'] as String,
      horseId: json['horse_id'] as String,
      horseName: json['horse_name'] as String,
      eventType: json['event_type'] as String,
      dateLabel: json['date_label'] as String,
      placeLabel: json['place_label'] as String,
      awardLabel: json['award_label'] as String,
      notes: json['notes'] as String,
      isUpcoming: json['is_upcoming'] as bool,
      photoUrls:
          (json['photo_urls'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toSupabaseJson({required String ownerId}) {
    return {
      'owner_id': ownerId,
      'id': id,
      'title': title,
      'horse_id': horseId,
      'horse_name': horseName,
      'event_type': eventType,
      'date_label': dateLabel,
      'place_label': placeLabel,
      'award_label': awardLabel,
      'notes': notes,
      'is_upcoming': isUpcoming,
      'photo_urls': photoUrls,
      'updated_at': DateTime.now().toIso8601String(),
    };
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'horseId': horseId,
      'horseName': horseName,
      'eventType': eventType,
      'dateLabel': dateLabel,
      'placeLabel': placeLabel,
      'awardLabel': awardLabel,
      'notes': notes,
      'isUpcoming': isUpcoming,
      'photoUrls': photoUrls,
    };
  }
}
