/// Үйлчилгээний үнийн загвар.
///
/// Нийт дүнг тооцохдоо:
/// consultationFee + (horseCount * perHorseFee) + travelSurcharge
class ServicePricing {
  const ServicePricing({
    required this.consultationFee,
    required this.perHorseFee,
    required this.travelSurcharge,
  });

  final int consultationFee;
  final int perHorseFee;
  final int travelSurcharge;

  /// Нийт дүнг тооцох (төгрөгөөр).
  int total({int horseCount = 1}) {
    return consultationFee + (horseCount * perHorseFee) + travelSurcharge;
  }

  // ── Serialization ──────────────────────────────────────────────────

  factory ServicePricing.fromJson(Map<String, dynamic> json) {
    return ServicePricing(
      consultationFee: json['consultationFee'] as int,
      perHorseFee: json['perHorseFee'] as int,
      travelSurcharge: json['travelSurcharge'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'consultationFee': consultationFee,
      'perHorseFee': perHorseFee,
      'travelSurcharge': travelSurcharge,
    };
  }
}
