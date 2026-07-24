/// Цус ойртолтын эрсдэлийн түвшин.
enum InbreedingRisk {
  low('Бага'),
  medium('Дунд'),
  high('Өндөр');

  const InbreedingRisk(this.displayName);

  final String displayName;

  static InbreedingRisk fromString(String value) {
    switch (value.toLowerCase()) {
      case 'low':
        return InbreedingRisk.low;
      case 'medium':
        return InbreedingRisk.medium;
      case 'high':
        return InbreedingRisk.high;
      default:
        return InbreedingRisk.medium;
    }
  }
}

/// Үржүүлгийн шинжилгээний үр дүн.
///
/// Аав/ээж морины нийцлийн дүн шинжилгээг агуулна:
/// - Цус ойртолтын эрсдэл (inbreedingRisk, riskScore)
/// - Эрүүл мэндийн нийцлийн тэмдэглэл (healthNotes)
/// - Өнгөний удамшлын таамаглал (colorPredictions)
/// - Үүлдрийн зөвлөмж (breedSuggestions)
class BreedingAdvice {
  const BreedingAdvice({
    required this.inbreedingRisk,
    required this.riskScore,
    required this.healthNotes,
    required this.colorPredictions,
    required this.breedSuggestions,
    this.quota,
  });

  /// Цус ойртолтын эрсдэлийн түвшин.
  final InbreedingRisk inbreedingRisk;

  /// Цус ойртолтын эрсдэлийн оноо (0-100).
  ///
  /// 0 = эрсдэлгүй, 100 = маш өндөр эрсдэл.
  final int riskScore;

  /// Эрүүл мэндийн нийцлийн талаарх дэлгэрэнгүй тэмдэглэл.
  final String healthNotes;

  /// Өнгөний удамшлын таамаглалууд.
  final List<String> colorPredictions;

  /// Үүлдрийн зөвлөмжүүд.
  final List<String> breedSuggestions;

  /// Квотын мэдээлэл (Edge Function-оос буцаагдсан).
  final BreedingQuota? quota;

  // ── Serialization ────────────────────────────────────────

  factory BreedingAdvice.fromJson(Map<String, dynamic> json) {
    return BreedingAdvice(
      inbreedingRisk:
          InbreedingRisk.fromString(json['inbreedingRisk'] as String? ?? 'medium'),
      riskScore: json['riskScore'] as int? ?? 50,
      healthNotes: json['healthNotes'] as String? ?? '',
      colorPredictions: (json['colorPredictions'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      breedSuggestions: (json['breedSuggestions'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      quota: json['quota'] != null
          ? BreedingQuota.fromJson(json['quota'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'inbreedingRisk': inbreedingRisk.name,
    'riskScore': riskScore,
    'healthNotes': healthNotes,
    'colorPredictions': colorPredictions,
    'breedSuggestions': breedSuggestions,
    if (quota != null) 'quota': quota!.toJson(),
  };

  // ── Helpers ──────────────────────────────────────────────

  /// Эрсдэлийн түвшинг харуулах өнгө.
  ///
  /// Green = бага, Yellow/Orange = дунд, Red = өндөр.
  String get riskColorLabel {
    switch (inbreedingRisk) {
      case InbreedingRisk.low:
        return 'green';
      case InbreedingRisk.medium:
        return 'yellow';
      case InbreedingRisk.high:
        return 'red';
    }
  }

  /// Эрсдэлийн оноог хүний ойлгох хэлбэрээр буцаах.
  String get riskScoreLabel {
    if (riskScore < 30) return 'Бага эрсдэлтэй';
    if (riskScore < 60) return 'Дунд зэргийн эрсдэлтэй';
    return 'Өндөр эрсдэлтэй';
  }

  // ── Equality ─────────────────────────────────────────────

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is BreedingAdvice &&
          runtimeType == other.runtimeType &&
          inbreedingRisk == other.inbreedingRisk &&
          riskScore == other.riskScore &&
          healthNotes == other.healthNotes &&
          _listEquals(colorPredictions, other.colorPredictions) &&
          _listEquals(breedSuggestions, other.breedSuggestions);

  static bool _listEquals(List<String> a, List<String> b) {
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (a[i] != b[i]) return false;
    }
    return true;
  }

  @override
  int get hashCode => Object.hash(
        inbreedingRisk,
        riskScore,
        healthNotes,
        Object.hashAll(colorPredictions),
        Object.hashAll(breedSuggestions),
      );

  @override
  String toString() =>
      'BreedingAdvice(inbreedingRisk: ${inbreedingRisk.name}, riskScore: $riskScore)';
}

/// Үлдэгдэл квотын мэдээлэл.
class BreedingQuota {
  const BreedingQuota({
    required this.tier,
    this.limit,
    this.remaining,
  });

  /// Хэрэглэгчийн түвшин.
  final String tier;

  /// Сарын нийт хязгаар. `null` = хязгааргүй.
  final int? limit;

  /// Үлдсэн тоо. `null` = хязгааргүй.
  final int? remaining;

  factory BreedingQuota.fromJson(Map<String, dynamic> json) {
    return BreedingQuota(
      tier: json['tier'] as String? ?? 'free',
      limit: json['limit'] as int?,
      remaining: json['remaining'] as int?,
    );
  }

  Map<String, dynamic> toJson() => {
    'tier': tier,
    'limit': limit,
    'remaining': remaining,
  };

  @override
  String toString() =>
      'BreedingQuota(tier: $tier, limit: $limit, remaining: $remaining)';
}
