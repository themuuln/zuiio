/// Үржүүлгийн аналитикийн домэйн модел.
///
/// Үржүүлгийн бүртгэлээр хээлтүүлгийн тоо, төллөлтийн амжилтын хувь,
/// сүүлийн үеийн бүртгэлүүдийг тооцоолно.
class BreedingAnalytics {
  const BreedingAnalytics({
    required this.activeBreedings,
    required this.totalBreedings,
    required this.foalingSuccessRate,
    required this.recentBreedings,
  });

  /// Идэвхтэй хээлтүүлгийн тоо.
  final int activeBreedings;

  /// Нийт хээлтүүлгийн тоо.
  final int totalBreedings;

  /// Төллөлтийн амжилтын хувь (0.0 – 100.0).
  final double foalingSuccessRate;

  /// Сүүлийн үеийн хээлтүүлгийн бүртгэлүүд.
  final List<BreedingRecordSummary> recentBreedings;

  /// Хоосон аналитик.
  static const empty = BreedingAnalytics(
    activeBreedings: 0,
    totalBreedings: 0,
    foalingSuccessRate: 0,
    recentBreedings: [],
  );

  /// Supabase RPC хариунаас үүсгэх.
  factory BreedingAnalytics.fromJson(Map<String, dynamic> json) {
    final records = json['breeding_records'];
    return BreedingAnalytics(
      activeBreedings: (json['active_breedings'] as num?)?.toInt() ?? 0,
      totalBreedings: (json['total_breedings'] as num?)?.toInt() ?? 0,
      foalingSuccessRate:
          (json['foaling_success_rate'] as num?)?.toDouble() ?? 0.0,
      recentBreedings: records is List
          ? records
                .map(
                  (r) =>
                      BreedingRecordSummary.fromJson(r as Map<String, dynamic>),
                )
                .toList()
          : [],
    );
  }

  Map<String, dynamic> toJson() => {
    'active_breedings': activeBreedings,
    'total_breedings': totalBreedings,
    'foaling_success_rate': foalingSuccessRate,
    'breeding_records': recentBreedings.map((r) => r.toJson()).toList(),
  };
}

/// Хээлтүүлгийн бүртгэлийн товч.
class BreedingRecordSummary {
  const BreedingRecordSummary({
    required this.sireName,
    required this.damName,
    required this.breedingDate,
    required this.expectedFoalingDate,
    required this.status,
  });

  final String sireName;
  final String damName;
  final DateTime breedingDate;
  final DateTime expectedFoalingDate;
  final String status;

  factory BreedingRecordSummary.fromJson(Map<String, dynamic> json) {
    return BreedingRecordSummary(
      sireName: json['sire_name'] as String? ?? '',
      damName: json['dam_name'] as String? ?? '',
      breedingDate: DateTime.parse(json['breeding_date'] as String),
      expectedFoalingDate: DateTime.parse(
        json['expected_foaling_date'] as String,
      ),
      status: json['status'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'sire_name': sireName,
    'dam_name': damName,
    'breeding_date': breedingDate.toIso8601String(),
    'expected_foaling_date': expectedFoalingDate.toIso8601String(),
    'status': status,
  };

  String get statusDisplayName {
    switch (status) {
      case 'active':
        return 'Идэвхтэй';
      case 'foaled':
        return 'Төллөсөн';
      case 'aborted':
        return 'Цуцалсан';
      default:
        return status;
    }
  }
}
