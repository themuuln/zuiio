/// A user's opt-in region for lost-horse alerts.
class LostHorseAlertSubscription {
  const LostHorseAlertSubscription({
    this.id,
    required this.userId,
    required this.locationAimag,
    this.locationSum,
    this.locationBag,
    this.pushEnabled = true,
    this.smsEnabled = false,
    this.revokedAt,
    this.consentedAt,
    this.createdAt,
    this.updatedAt,
  });

  final String? id;
  final String userId;
  final String locationAimag;
  final String? locationSum;
  final String? locationBag;
  final bool pushEnabled;
  final bool smsEnabled;
  final DateTime? revokedAt;
  final DateTime? consentedAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  bool get isActive => revokedAt == null;

  Map<String, dynamic> toJson() => {
    if (id != null) 'id': id,
    'user_id': userId,
    'location_aimag': locationAimag,
    'location_sum': locationSum,
    'location_bag': locationBag,
    'push_enabled': pushEnabled,
    'sms_enabled': smsEnabled,
    if (revokedAt != null) 'revoked_at': revokedAt!.toIso8601String(),
  };

  factory LostHorseAlertSubscription.fromJson(Map<String, dynamic> json) {
    return LostHorseAlertSubscription(
      id: json['id'] as String?,
      userId: json['user_id'] as String,
      locationAimag: json['location_aimag'] as String,
      locationSum: json['location_sum'] as String?,
      locationBag: json['location_bag'] as String?,
      pushEnabled: json['push_enabled'] as bool? ?? true,
      smsEnabled: json['sms_enabled'] as bool? ?? false,
      revokedAt: _parseDate(json['revoked_at']),
      consentedAt: _parseDate(json['consented_at']),
      createdAt: _parseDate(json['created_at']),
      updatedAt: _parseDate(json['updated_at']),
    );
  }

  static DateTime? _parseDate(Object? value) {
    return value is String ? DateTime.tryParse(value) : null;
  }
}
