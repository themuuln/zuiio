/// Үржүүлэгчийн нийтийн профайл.
///
/// Зах зээл дээрх худалдагчийн үржүүлэгчийн мэдээллийг харуулахад ашиглана.
class BreederProfile {
  const BreederProfile({
    required this.id,
    required this.displayName,
    this.locationLabel = '',
    this.memberSince,
    this.totalHorses = 0,
    this.achievements = const [],
    this.recentListings = const [],
    this.averageRating = 0.0,
    this.totalRatings = 0,
  });

  /// Хэрэглэгчийн / Худалдагчийн ID.
  final String id;

  /// Үржүүлэгчийн нэр.
  final String displayName;

  /// Байршил (аймаг, сум).
  final String locationLabel;

  /// Гишүүнээр элссэн огноо.
  final DateTime? memberSince;

  /// Нийт морины тоо.
  final int totalHorses;

  /// Амжилт / тэмдэг.
  final List<String> achievements;

  /// Сүүлийн зарууд.
  final List<BreederListingPreview> recentListings;

  /// Дундаж үнэлгээ (1-5).
  final double averageRating;

  /// Нийт үнэлгээний тоо.
  final int totalRatings;

  // ── Helpers ──────────────────────────────────────────────────

  /// Гишүүнээр элссэн хугацаа (жилээр).
  int get memberSinceYears {
    if (memberSince == null) return 0;
    return DateTime.now().year - memberSince!.year;
  }

  /// Гишүүнээр элссэн огнооны текст.
  String get memberSinceLabel {
    if (memberSince == null) return '—';
    final years = memberSinceYears;
    if (years <= 0) {
      return 'Энэ жил элссэн';
    }
    return '$years жил';
  }

  // ── CopyWith ─────────────────────────────────────────────────

  BreederProfile copyWith({
    String? id,
    String? displayName,
    String? locationLabel,
    DateTime? memberSince,
    bool clearMemberSince = false,
    int? totalHorses,
    List<String>? achievements,
    List<BreederListingPreview>? recentListings,
    double? averageRating,
    int? totalRatings,
  }) {
    return BreederProfile(
      id: id ?? this.id,
      displayName: displayName ?? this.displayName,
      locationLabel: locationLabel ?? this.locationLabel,
      memberSince: clearMemberSince ? null : (memberSince ?? this.memberSince),
      totalHorses: totalHorses ?? this.totalHorses,
      achievements: achievements ?? this.achievements,
      recentListings: recentListings ?? this.recentListings,
      averageRating: averageRating ?? this.averageRating,
      totalRatings: totalRatings ?? this.totalRatings,
    );
  }

  // ── Serialization ────────────────────────────────────────────

  factory BreederProfile.fromJson(Map<String, dynamic> json) {
    return BreederProfile(
      id: json['id'] as String,
      displayName: json['displayName'] as String,
      locationLabel: json['locationLabel'] as String? ?? '',
      memberSince: json['memberSince'] != null
          ? DateTime.tryParse(json['memberSince'] as String)
          : null,
      totalHorses: json['totalHorses'] as int? ?? 0,
      achievements:
          (json['achievements'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      recentListings:
          (json['recentListings'] as List<dynamic>?)
              ?.map(
                (e) =>
                    BreederListingPreview.fromJson(e as Map<String, dynamic>),
              )
              .toList() ??
          [],
      averageRating: (json['averageRating'] as num?)?.toDouble() ?? 0.0,
      totalRatings: json['totalRatings'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'displayName': displayName,
      'locationLabel': locationLabel,
      'memberSince': memberSince?.toIso8601String(),
      'totalHorses': totalHorses,
      'achievements': achievements,
      'recentListings': recentListings.map((l) => l.toJson()).toList(),
      'averageRating': averageRating,
      'totalRatings': totalRatings,
    };
  }

  // ── Equality ─────────────────────────────────────────────────

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is BreederProfile &&
          id == other.id &&
          displayName == other.displayName &&
          totalHorses == other.totalHorses &&
          averageRating == other.averageRating;

  @override
  int get hashCode => Object.hash(id, displayName, totalHorses, averageRating);

  @override
  String toString() =>
      'BreederProfile(id: $id, displayName: $displayName, '
      'totalHorses: $totalHorses, avgRating: $averageRating)';
}

/// Үржүүлэгчийн зарын урьдчилсан харагдац.
class BreederListingPreview {
  const BreederListingPreview({
    required this.id,
    required this.title,
    required this.priceAmount,
    required this.currency,
    this.thumbnailUrl,
    this.status = '',
  });

  /// Зарын ID.
  final String id;

  /// Зарын гарчиг.
  final String title;

  /// Үнэ.
  final int priceAmount;

  /// Валют (MNT, USD).
  final String currency;

  /// Зургийн холбоос.
  final String? thumbnailUrl;

  /// Зарын төлөв.
  final String status;

  // ── Formatted price ──────────────────────────────────────────

  /// Форматлагдсан үнэ.
  String get formattedPrice {
    if (currency == 'MNT') {
      return '${priceAmount.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')} ₮';
    }
    return '\$$priceAmount';
  }

  // ── CopyWith ─────────────────────────────────────────────────

  BreederListingPreview copyWith({
    String? id,
    String? title,
    int? priceAmount,
    String? currency,
    String? thumbnailUrl,
    bool clearThumbnailUrl = false,
    String? status,
  }) {
    return BreederListingPreview(
      id: id ?? this.id,
      title: title ?? this.title,
      priceAmount: priceAmount ?? this.priceAmount,
      currency: currency ?? this.currency,
      thumbnailUrl: clearThumbnailUrl
          ? null
          : (thumbnailUrl ?? this.thumbnailUrl),
      status: status ?? this.status,
    );
  }

  // ── Serialization ────────────────────────────────────────────

  factory BreederListingPreview.fromJson(Map<String, dynamic> json) {
    return BreederListingPreview(
      id: json['id'] as String,
      title: json['title'] as String,
      priceAmount: json['priceAmount'] as int,
      currency: json['currency'] as String? ?? 'MNT',
      thumbnailUrl: json['thumbnailUrl'] as String?,
      status: json['status'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'priceAmount': priceAmount,
      'currency': currency,
      'thumbnailUrl': thumbnailUrl,
      'status': status,
    };
  }

  // ── Equality ─────────────────────────────────────────────────

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is BreederListingPreview &&
          id == other.id &&
          title == other.title &&
          priceAmount == other.priceAmount;

  @override
  int get hashCode => Object.hash(id, title, priceAmount);

  @override
  String toString() =>
      'BreederListingPreview(id: $id, title: $title, price: $priceAmount $currency)';
}
