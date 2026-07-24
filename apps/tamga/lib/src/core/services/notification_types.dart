/// Мэдэгдлийн төрөл — бүх push notification-ийн ангилал.
enum NotificationType {
  /// Эмнэлгийн сануулга (вакцин, тахлал).
  healthReminder,

  /// Төллөлтийн огноо.
  breedingDue,

  /// Зах зээлийн жагсаалтын шинэчлэл.
  marketListingUpdate,

  /// Захиалгын хугацаа дуусах сануулга.
  subscriptionExpiry,

  /// Геоференцийн мэдэгдэл (хаяж морь, хайх бүс).
  geofenceAlert,

  /// Төлбөр баталгаажсан мэдэгдэл.
  paymentVerified,

  /// Хаяж морийн зар сунгах сануулга.
  lostHorseRenewal,
}

/// Мэдэгдлийн төрөл болон түүний metadata.
extension NotificationTypeX on NotificationType {
  /// Supabase-д хадгалагдах key.
  String get key => switch (this) {
    NotificationType.healthReminder => 'health_reminder',
    NotificationType.breedingDue => 'breeding_due',
    NotificationType.marketListingUpdate => 'market_listing_update',
    NotificationType.subscriptionExpiry => 'subscription_expiry',
    NotificationType.geofenceAlert => 'geofence_alert',
    NotificationType.paymentVerified => 'payment_verified',
    NotificationType.lostHorseRenewal => 'lost_horse_renewal',
  };

  /// Монгол нэр.
  String get label => switch (this) {
    NotificationType.healthReminder => 'Эмнэлгийн сануулга',
    NotificationType.breedingDue => 'Төллөлтийн сануулга',
    NotificationType.marketListingUpdate => 'Зах зээлийн шинэчлэл',
    NotificationType.subscriptionExpiry => 'Захиалгын хугацаа',
    NotificationType.geofenceAlert => 'Геоференцийн мэдэгдэл',
    NotificationType.paymentVerified => 'Төлбөр баталгаажсан',
    NotificationType.lostHorseRenewal => 'Хаяж морийн зар',
  };

  /// English name.
  String get labelEn => switch (this) {
    NotificationType.healthReminder => 'Health Reminder',
    NotificationType.breedingDue => 'Breeding Due',
    NotificationType.marketListingUpdate => 'Market Listing Update',
    NotificationType.subscriptionExpiry => 'Subscription Expiry',
    NotificationType.geofenceAlert => 'Geofence Alert',
    NotificationType.paymentVerified => 'Payment Verified',
    NotificationType.lostHorseRenewal => 'Lost Horse Renewal',
  };

  /// Тухайн төрлийн мэдэгдлийн channel id (iOS/Android).
  String get channelId => switch (this) {
    NotificationType.healthReminder => 'health_reminders',
    NotificationType.breedingDue => 'breeding_alerts',
    NotificationType.marketListingUpdate => 'market_updates',
    NotificationType.subscriptionExpiry => 'subscription_alerts',
    NotificationType.geofenceAlert => 'geofence_alerts',
    NotificationType.paymentVerified => 'payment_alerts',
    NotificationType.lostHorseRenewal => 'lost_horse_renewals',
  };

  /// Тухайн төрлийн default channel нэр.
  String get channelName => switch (this) {
    NotificationType.healthReminder => 'Эмнэлгийн сануулгууд',
    NotificationType.breedingDue => 'Төллөлтийн сануулгууд',
    NotificationType.marketListingUpdate => 'Зах зээлийн мэдээллүүд',
    NotificationType.subscriptionExpiry => 'Захиалгын сануулгууд',
    NotificationType.geofenceAlert => 'Геоференцийн мэдэгдлүүд',
    NotificationType.paymentVerified => 'Төлбөрийн мэдэгдлүүд',
    NotificationType.lostHorseRenewal => 'Хаяж морийн сануулгууд',
  };

  /// Тухайн төрлийн channel тайлбар.
  String get channelDescription => switch (this) {
    NotificationType.healthReminder =>
      'Малын эмнэлгийн вакцин, тахлалтын сануулгууд',
    NotificationType.breedingDue => 'Хээлтэлтийн төллөлтийн огнооны сануулгууд',
    NotificationType.marketListingUpdate =>
      'Зах зээлийн жагсаалтын шинэчлэлүүд',
    NotificationType.subscriptionExpiry =>
      'Захиалгын хугацаа дуусах сануулгууд',
    NotificationType.geofenceAlert =>
      'Геоференцийн хязгаараас гарсан/орсон мэдэгдлүүд',
    NotificationType.paymentVerified =>
      'Төлбөр баталгаажсан ба захиалга идэвхжсэн мэдэгдлүүд',
    NotificationType.lostHorseRenewal => 'Хаяж морийн зар сунгах сануулгууд',
  };

  /// String-ээс NotificationType руу хувиргах.
  static NotificationType? fromKey(String key) {
    return NotificationType.values.where((t) => t.key == key).firstOrNull;
  }
}

/// Мэдэгдлийн гарал — local эсвэл remote.
enum NotificationSource {
  /// Тухайн төхөөрөмж дээрх local notification.
  local,

  /// Firebase Messaging-ээр ирсэн remote notification.
  remote,
}

/// Мэдэгдлийн payload — notification товшсон үед дамжуулагдах мэдээлэл.
class NotificationPayload {
  const NotificationPayload({
    required this.type,
    required this.source,
    this.referenceId,
    this.referenceType,
    this.title,
    this.body,
  });

  /// Мэдэгдлийн төрөл.
  final NotificationType type;

  /// Мэдэгдлийн гарал.
  final NotificationSource source;

  /// Холбогдох обьектийн ID (жишээ: horseId, listingId).
  final String? referenceId;

  /// Холбогдох обьектийн төрөл (жишээ: 'horse', 'listing', 'subscription').
  final String? referenceType;

  final String? title;
  final String? body;

  /// Local notification-д хадгалагдах JSON payload.
  String toPayloadString() {
    final parts = <String>['type=${type.key}', 'source=${source.name}'];
    if (referenceId != null) parts.add('referenceId=$referenceId');
    if (referenceType != null) parts.add('referenceType=$referenceType');
    return parts.join('&');
  }

  /// Local notification payload-оос буцааж унших.
  factory NotificationPayload.fromPayloadString(String payload) {
    final map = <String, String>{};
    for (final part in payload.split('&')) {
      final kv = part.split('=');
      if (kv.length == 2) map[kv[0]] = kv[1];
    }

    final typeKey = map['type'] ?? '';
    final type = NotificationTypeX.fromKey(typeKey);

    return NotificationPayload(
      type: type ?? NotificationType.healthReminder,
      source: map['source'] == 'remote'
          ? NotificationSource.remote
          : NotificationSource.local,
      referenceId: map['referenceId'],
      referenceType: map['referenceType'],
    );
  }
}
