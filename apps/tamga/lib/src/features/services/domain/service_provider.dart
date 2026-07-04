import 'service_provider_type.dart';

/// Үйлчилгээ үзүүлэгчийн домэйн загвар.
///
/// Гэрэл зурагчин, мал эмнэлэг гэх мэт үйлчилгээ үзүүлэгчдийг төлөөлнө.
class ServiceProvider {
  const ServiceProvider({
    required this.id,
    required this.userId,
    required this.providerType,
    this.businessName,
    this.phone,
    this.locationAimag,
    this.locationSum,
    this.isVerified = false,
    this.rating = 0,
  });

  final String id;
  final String userId;
  final ServiceProviderType providerType;
  final String? businessName;
  final String? phone;
  final String? locationAimag;
  final String? locationSum;
  final bool isVerified;
  final double rating;

  // ── JSON Serialization ────────────────────────────────────────────

  factory ServiceProvider.fromJson(Map<String, dynamic> json) {
    return ServiceProvider(
      id: json['id'] as String,
      userId: json['userId'] as String,
      providerType: ServiceProviderType.values.byName(
        json['providerType'] as String,
      ),
      businessName: json['businessName'] as String?,
      phone: json['phone'] as String?,
      locationAimag: json['locationAimag'] as String?,
      locationSum: json['locationSum'] as String?,
      isVerified: json['isVerified'] as bool? ?? false,
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'providerType': providerType.name,
      'businessName': businessName,
      'phone': phone,
      'locationAimag': locationAimag,
      'locationSum': locationSum,
      'isVerified': isVerified,
      'rating': rating,
    };
  }

  // ── Supabase Serialization ────────────────────────────────────────

  factory ServiceProvider.fromSupabaseJson(Map<String, dynamic> row) {
    return ServiceProvider(
      id: row['id'] as String,
      userId: row['user_id'] as String,
      providerType: ServiceProviderType.values.byName(
        row['provider_type'] as String,
      ),
      businessName: row['business_name'] as String?,
      phone: row['phone'] as String?,
      locationAimag: row['location_aimag'] as String?,
      locationSum: row['location_sum'] as String?,
      isVerified: row['is_verified'] as bool? ?? false,
      rating: (row['rating'] as num?)?.toDouble() ?? 0,
    );
  }

  Map<String, dynamic> toSupabaseJson() {
    return {
      'id': id,
      'user_id': userId,
      'provider_type': providerType.name,
      'business_name': businessName,
      'phone': phone,
      'location_aimag': locationAimag,
      'location_sum': locationSum,
      'is_verified': isVerified,
      'rating': rating,
    };
  }
}
