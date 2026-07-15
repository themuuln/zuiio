/// Мал эмнэлгийн профайлын домэйн загвар.
///
/// Тодорхой мал эмчийн мэргэжил, лиценз, боловсрол, зөвлөгөөний
/// хураамж болон аялалын нэмэлт төлбөрийг төлөөлнө.
class VetProfile {
  const VetProfile({
    required this.id,
    required this.providerId,
    this.specialization = const [],
    this.licenseNumber,
    this.education,
    this.experienceYears,
    this.consultationFee,
    this.travelSurcharge,
    this.availableDays = const [],
  });

  final String id;
  final String providerId;
  final List<String> specialization;
  final String? licenseNumber;
  final String? education;
  final int? experienceYears;
  final int? consultationFee;
  final int? travelSurcharge;
  final List<String> availableDays;

  // ── JSON Serialization ────────────────────────────────────────────

  factory VetProfile.fromJson(Map<String, dynamic> json) {
    return VetProfile(
      id: json['id'] as String,
      providerId: json['providerId'] as String,
      specialization: List<String>.from(
        json['specialization'] as List<dynamic>? ?? [],
      ),
      licenseNumber: json['licenseNumber'] as String?,
      education: json['education'] as String?,
      experienceYears: json['experienceYears'] as int?,
      consultationFee: json['consultationFee'] as int?,
      travelSurcharge: json['travelSurcharge'] as int?,
      availableDays: List<String>.from(
        json['availableDays'] as List<dynamic>? ?? [],
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'providerId': providerId,
      'specialization': specialization,
      'licenseNumber': licenseNumber,
      'education': education,
      'experienceYears': experienceYears,
      'consultationFee': consultationFee,
      'travelSurcharge': travelSurcharge,
      'availableDays': availableDays,
    };
  }

  // ── Supabase Serialization ────────────────────────────────────────

  factory VetProfile.fromSupabaseJson(Map<String, dynamic> row) {
    return VetProfile(
      id: row['id'] as String,
      providerId: row['provider_id'] as String,
      specialization:
          (row['specialization'] as List<dynamic>?)?.cast<String>() ?? [],
      licenseNumber: row['license_number'] as String?,
      education: row['education'] as String?,
      experienceYears: row['experience_years'] as int?,
      consultationFee: row['consultation_fee'] as int?,
      travelSurcharge: row['travel_surcharge'] as int?,
      availableDays:
          (row['available_days'] as List<dynamic>?)?.cast<String>() ?? [],
    );
  }

  Map<String, dynamic> toSupabaseJson() {
    return {
      'id': id,
      'provider_id': providerId,
      'specialization': specialization,
      'license_number': licenseNumber,
      'education': education,
      'experience_years': experienceYears,
      'consultation_fee': consultationFee,
      'travel_surcharge': travelSurcharge,
      'available_days': availableDays,
    };
  }
}
