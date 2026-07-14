/// Мэдэгдлийн тохиргоо — хэрэглэгч бүр мэдэгдлүүдийг идэвхжүүлэх/унтраах боломжтой.
///
/// ProfileSettings-д нэмэлт болгон ашиглах эсвэл тусдаа хадгалах боломжтой.
class NotificationPreferences {
  const NotificationPreferences({
    this.notificationsEnabled = true,
    this.healthRemindersEnabled = true,
    this.breedingAlertsEnabled = true,
    this.marketUpdatesEnabled = true,
    this.geofenceAlertsEnabled = true,
    this.paymentNotificationsEnabled = true,
  });

  /// Бүх мэдэгдлийг идэвхжүүлсэн эсэх.
  final bool notificationsEnabled;

  /// Эрүүл мэндийн сануулга (вакцин, тахлалт, эмчийн үзлэг).
  final bool healthRemindersEnabled;

  /// Төллөлтийн огнооны сануулга.
  final bool breedingAlertsEnabled;

  /// Зах зээлийн шинэчлэл (зар сонирхсон хүн).
  final bool marketUpdatesEnabled;

  /// Геоференцийн мэдэгдэл (хаяж морь, хайх бүс).
  final bool geofenceAlertsEnabled;

  /// Төлбөр баталгаажсан мэдэгдэл.
  final bool paymentNotificationsEnabled;

  /// Тухайн төрлийн мэдэгдэл идэвхтэй эсэхийг шалгах.
  ///
  /// Бүх мэдэгдэл унтраалттай бол хэн ч идэвхгүй.
  bool isTypeEnabled(NotificationPreferenceType type) {
    if (!notificationsEnabled) return false;
    return switch (type) {
      NotificationPreferenceType.health => healthRemindersEnabled,
      NotificationPreferenceType.breeding => breedingAlertsEnabled,
      NotificationPreferenceType.market => marketUpdatesEnabled,
      NotificationPreferenceType.geofence => geofenceAlertsEnabled,
      NotificationPreferenceType.payment => paymentNotificationsEnabled,
    };
  }

  NotificationPreferences copyWith({
    bool? notificationsEnabled,
    bool? healthRemindersEnabled,
    bool? breedingAlertsEnabled,
    bool? marketUpdatesEnabled,
    bool? geofenceAlertsEnabled,
    bool? paymentNotificationsEnabled,
  }) {
    return NotificationPreferences(
      notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
      healthRemindersEnabled:
          healthRemindersEnabled ?? this.healthRemindersEnabled,
      breedingAlertsEnabled:
          breedingAlertsEnabled ?? this.breedingAlertsEnabled,
      marketUpdatesEnabled: marketUpdatesEnabled ?? this.marketUpdatesEnabled,
      geofenceAlertsEnabled:
          geofenceAlertsEnabled ?? this.geofenceAlertsEnabled,
      paymentNotificationsEnabled:
          paymentNotificationsEnabled ?? this.paymentNotificationsEnabled,
    );
  }

  factory NotificationPreferences.fromJson(Map<String, dynamic> json) {
    return NotificationPreferences(
      notificationsEnabled: json['notifications_enabled'] as bool? ?? true,
      healthRemindersEnabled: json['health_reminders_enabled'] as bool? ?? true,
      breedingAlertsEnabled: json['breeding_alerts_enabled'] as bool? ?? true,
      marketUpdatesEnabled: json['market_updates_enabled'] as bool? ?? true,
      geofenceAlertsEnabled: json['geofence_alerts_enabled'] as bool? ?? true,
      paymentNotificationsEnabled:
          json['payment_notifications_enabled'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'notifications_enabled': notificationsEnabled,
      'health_reminders_enabled': healthRemindersEnabled,
      'breeding_alerts_enabled': breedingAlertsEnabled,
      'market_updates_enabled': marketUpdatesEnabled,
      'geofence_alerts_enabled': geofenceAlertsEnabled,
      'payment_notifications_enabled': paymentNotificationsEnabled,
    };
  }

  /// Default — бүх мэдэгдэл идэвхтэй.
  static const defaults = NotificationPreferences();
}

/// Мэдэгдлийн төрөл — тохиргоод ашиглах ангилал.
enum NotificationPreferenceType { health, breeding, market, geofence, payment }
