// ── Enums ──

/// Морины нүүрний тэмдэг.
enum FaceMarking {
  none,
  star,
  strip,
  snip,
  blaze,
  bald,
  other;

  String get displayName => switch (this) {
    FaceMarking.none => 'Үгүй',
    FaceMarking.star => 'Од',
    FaceMarking.strip => 'Зураас',
    FaceMarking.snip => 'Толбо',
    FaceMarking.blaze => 'Цагаан зураас',
    FaceMarking.bald => 'Бүтэн цагаан',
    FaceMarking.other => 'Бусад',
  };

  static FaceMarking fromString(String value) {
    for (final m in FaceMarking.values) {
      if (m.name == value) return m;
    }
    return FaceMarking.none;
  }
}

/// Морины хөлийн тэмдэг.
enum LegMarking {
  none,
  stocking,
  sock,
  pastern,
  coronet,
  other;

  String get displayName => switch (this) {
    LegMarking.none => 'Үгүй',
    LegMarking.stocking => 'Улгалga',
    LegMarking.sock => 'Оймс',
    LegMarking.pastern => 'Шагайн дээр',
    LegMarking.coronet => 'Мөчир',
    LegMarking.other => 'Бусад',
  };

  static LegMarking fromString(String value) {
    for (final m in LegMarking.values) {
      if (m.name == value) return m;
    }
    return LegMarking.none;
  }
}

/// Хөлийн байрлал.
enum LegPosition {
  leftFront,
  rightFront,
  leftHind,
  rightHind;

  String get displayName => switch (this) {
    LegPosition.leftFront => 'Зүүн урд',
    LegPosition.rightFront => 'Баруун урд',
    LegPosition.leftHind => 'Зүүн хойд',
    LegPosition.rightHind => 'Баруун хойд',
  };

  static LegPosition fromString(String value) {
    for (final p in LegPosition.values) {
      if (p.name == value) return p;
    }
    return LegPosition.leftFront;
  }
}

// ── Data Model ──

/// Морины биеийн тэмдэг.
///
/// Нүүр, хөл, биеийн тэмдгүүдийг бүтэцлэсэн хэлбэрээр хадгална.
/// Plain class with manual JSON serialization (freezed not needed here).
class HorseMarkings {
  const HorseMarkings({
    this.faceMarking = FaceMarking.none,
    this.faceMarkingDescription = '',
    this.legMarkings = const {},
    this.bodyMarkings = '',
  });

  final FaceMarking faceMarking;
  final String faceMarkingDescription;
  final Map<String, LegMarking> legMarkings;
  final String bodyMarkings;

  HorseMarkings copyWith({
    FaceMarking? faceMarking,
    String? faceMarkingDescription,
    Map<String, LegMarking>? legMarkings,
    String? bodyMarkings,
  }) {
    return HorseMarkings(
      faceMarking: faceMarking ?? this.faceMarking,
      faceMarkingDescription:
          faceMarkingDescription ?? this.faceMarkingDescription,
      legMarkings: legMarkings ?? this.legMarkings,
      bodyMarkings: bodyMarkings ?? this.bodyMarkings,
    );
  }

  factory HorseMarkings.fromJson(Map<String, dynamic> json) {
    return HorseMarkings(
      faceMarking: FaceMarking.fromString(
        json['faceMarking'] as String? ?? 'none',
      ),
      faceMarkingDescription: json['faceMarkingDescription'] as String? ?? '',
      legMarkings:
          (json['legMarkings'] as Map<String, dynamic>?)?.map(
            (k, v) => MapEntry(k, LegMarking.fromString(v as String)),
          ) ??
          {},
      bodyMarkings: json['bodyMarkings'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'faceMarking': faceMarking.name,
      'faceMarkingDescription': faceMarkingDescription,
      'legMarkings': legMarkings.map((k, v) => MapEntry(k, v.name)),
      'bodyMarkings': bodyMarkings,
    };
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is HorseMarkings &&
          runtimeType == other.runtimeType &&
          faceMarking == other.faceMarking &&
          faceMarkingDescription == other.faceMarkingDescription &&
          bodyMarkings == other.bodyMarkings;

  @override
  int get hashCode =>
      faceMarking.hashCode ^
      faceMarkingDescription.hashCode ^
      bodyMarkings.hashCode;
}
