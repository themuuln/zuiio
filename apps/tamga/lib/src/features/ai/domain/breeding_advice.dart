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

/// Үржүүлгийн зөвлөмжийн төрөл.
enum OverallRecommendation {
  breed('Үржүүлэх боломжтой'),
  avoid('Үржүүлэхгүй'),
  consultVet('Эмчтэй зөвлөлцөх');

  const OverallRecommendation(this.displayName);

  final String displayName;

  static OverallRecommendation fromString(String value) {
    switch (value.toLowerCase()) {
      case 'breed':
        return OverallRecommendation.breed;
      case 'avoid':
        return OverallRecommendation.avoid;
      case 'consult_vet':
        return OverallRecommendation.consultVet;
      default:
        return OverallRecommendation.consultVet;
    }
  }
}

/// Өнгөний удамшлын таамаглал нэг сонголт.
class CoatColorPrediction {
  const CoatColorPrediction({required this.color, required this.probability});

  /// Өнгөний нэр (Монгол + Англи).
  final String color;

  /// Магадлал (0-100).
  final int probability;

  factory CoatColorPrediction.fromJson(Map<String, dynamic> json) {
    return CoatColorPrediction(
      color: json['color'] as String? ?? 'Мэдэгдэхгүй',
      probability: json['probability'] as int? ?? 50,
    );
  }

  Map<String, dynamic> toJson() => {'color': color, 'probability': probability};

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CoatColorPrediction &&
          runtimeType == other.runtimeType &&
          color == other.color &&
          probability == other.probability;

  @override
  int get hashCode => Object.hash(color, probability);

  @override
  String toString() =>
      'CoatColorPrediction(color: $color, probability: $probability%)';
}

/// Нийтлэг өвөг мэдээлэл.
class CommonAncestor {
  const CommonAncestor({required this.name, required this.generationsApart});

  /// Өвгийн нэр.
  final String name;

  /// Хэдэн үеийн зайд байгаа.
  final int generationsApart;

  factory CommonAncestor.fromJson(Map<String, dynamic> json) {
    return CommonAncestor(
      name: json['name'] as String? ?? 'Мэдэгдэхгүй',
      generationsApart: json['generationsApart'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'name': name,
    'generationsApart': generationsApart,
  };

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CommonAncestor &&
          runtimeType == other.runtimeType &&
          name == other.name &&
          generationsApart == other.generationsApart;

  @override
  int get hashCode => Object.hash(name, generationsApart);
}

/// Үржүүлгийн шинжилгээний үр дүн (Gemini-ээс буцсан нэмэлт талбаруудтай).
///
/// Аав/ээж морины нийцлийн дүн шинжилгээг агуулна:
/// - Нийцлийн оноо (compatibilityScore)
/// - Цус ойртолтын эрсдэл (inbreedingRisk, riskScore, commonAncestors)
/// - Өнгөний таамаглал (coatColorPredictions)
/// - Эрүүл мэндийн эрсдэл (healthRisks, healthNotes)
/// - Үржүүлгийн цонх (breedingWindow)
/// - Нийт зөвлөмж (overallRecommendation)
/// - Монгол үүлдрийн зөвлөмж (mongolianBreedNotes)
class BreedingAdvice {
  const BreedingAdvice({
    required this.compatibilityScore,
    required this.inbreedingRisk,
    required this.riskScore,
    required this.coatColorPredictions,
    required this.healthRisks,
    required this.healthNotes,
    required this.breedingWindow,
    required this.overallRecommendation,
    required this.breedSuggestions,
    required this.mongolianBreedNotes,
    required this.commonAncestors,
    this.quota,
    this.cached = false,
  });

  /// Нийцлийн оноо (0-100). 100 = хамгийн тохиромжтой.
  final int compatibilityScore;

  /// Цус ойртолтын эрсдэлийн түвшин.
  final InbreedingRisk inbreedingRisk;

  /// Цус ойртолтын эрсдэлийн оноо (0-100).
  final int riskScore;

  /// Өнгөний удамшлын таамаглалууд (өнгө + магадлал).
  final List<CoatColorPrediction> coatColorPredictions;

  /// Эрүүл мэндийн эрсдэлүүд.
  final List<String> healthRisks;

  /// Эрүүл мэндийн нийцлийн талаарх дэлгэрэнгүй тэмдэглэл.
  final String healthNotes;

  /// Зөвлөсөн үржүүлгийн цонх.
  final String breedingWindow;

  /// Нийт зөвлөмж (breed/avoid/consult_vet).
  final OverallRecommendation overallRecommendation;

  /// Үүлдрийн зөвлөмжүүд.
  final List<String> breedSuggestions;

  /// Монгол үүлдрийн тусгай зөвлөмж.
  final String mongolianBreedNotes;

  /// Нийтлэг өвгүүд.
  final List<CommonAncestor> commonAncestors;

  /// Квотын мэдээлэл (Edge Function-оос буцаагдсан).
  final BreedingQuota? quota;

  /// Кэшээс авсан эсэх.
  final bool cached;

  // ── Serialization ────────────────────────────────────────

  factory BreedingAdvice.fromJson(Map<String, dynamic> json) {
    return BreedingAdvice(
      compatibilityScore: json['compatibilityScore'] as int? ?? 50,
      inbreedingRisk: InbreedingRisk.fromString(
        json['inbreedingRisk'] as String? ?? 'medium',
      ),
      riskScore: json['riskScore'] as int? ?? 50,
      coatColorPredictions:
          (json['coatColorPredictions'] as List<dynamic>?)
              ?.map(
                (e) => CoatColorPrediction.fromJson(e as Map<String, dynamic>),
              )
              .toList() ??
          [],
      healthRisks:
          (json['healthRisks'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      healthNotes: json['healthNotes'] as String? ?? '',
      breedingWindow: json['breedingWindow'] as String? ?? '',
      overallRecommendation: OverallRecommendation.fromString(
        json['overallRecommendation'] as String? ?? 'consult_vet',
      ),
      breedSuggestions:
          (json['breedSuggestions'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      mongolianBreedNotes: json['mongolianBreedNotes'] as String? ?? '',
      commonAncestors:
          (json['commonAncestors'] as List<dynamic>?)
              ?.map((e) => CommonAncestor.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      quota: json['quota'] != null
          ? BreedingQuota.fromJson(json['quota'] as Map<String, dynamic>)
          : null,
      cached: json['cached'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    'compatibilityScore': compatibilityScore,
    'inbreedingRisk': inbreedingRisk.name,
    'riskScore': riskScore,
    'coatColorPredictions': coatColorPredictions
        .map((e) => e.toJson())
        .toList(),
    'healthRisks': healthRisks,
    'healthNotes': healthNotes,
    'breedingWindow': breedingWindow,
    'overallRecommendation': overallRecommendation.name,
    'breedSuggestions': breedSuggestions,
    'mongolianBreedNotes': mongolianBreedNotes,
    'commonAncestors': commonAncestors.map((e) => e.toJson()).toList(),
    if (quota != null) 'quota': quota!.toJson(),
    'cached': cached,
  };

  // ── Helpers ──────────────────────────────────────────────

  /// Эрсдэлийн түвшинг харуулах өнгө.
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

  /// Нийцлийн оноог хүний ойлгох хэлбэрээр буцаах.
  String get compatibilityLabel {
    if (compatibilityScore >= 80) return 'Маш тохиромжтой';
    if (compatibilityScore >= 60) return 'Тохиромжтой';
    if (compatibilityScore >= 40) return 'Дунд зэрэг';
    return 'Бага тохиромжтой';
  }

  // ── Equality ─────────────────────────────────────────────

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is BreedingAdvice &&
          runtimeType == other.runtimeType &&
          compatibilityScore == other.compatibilityScore &&
          inbreedingRisk == other.inbreedingRisk &&
          riskScore == other.riskScore &&
          overallRecommendation == other.overallRecommendation &&
          _listEquals(healthRisks, other.healthRisks) &&
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
    compatibilityScore,
    inbreedingRisk,
    riskScore,
    overallRecommendation,
    Object.hashAll(healthRisks),
    Object.hashAll(breedSuggestions),
  );

  @override
  String toString() =>
      'BreedingAdvice(compatibilityScore: $compatibilityScore, '
      'inbreedingRisk: ${inbreedingRisk.name}, riskScore: $riskScore, '
      'recommendation: ${overallRecommendation.name})';
}

/// Үлдэгдэл квотын мэдээлэл.
class BreedingQuota {
  const BreedingQuota({required this.tier, this.limit, this.remaining});

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
