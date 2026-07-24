/// Худалдагчийн үнэлгээний бичлэг.
///
/// Худалдан авагчийн үлдээсэн 1-5 одтой үнэлгээ болон сэтгэгдэл.
class SellerRating {
  const SellerRating({
    required this.id,
    required this.listingId,
    required this.sellerId,
    required this.buyerId,
    required this.rating,
    required this.review,
    required this.createdAt,
    this.sellerResponse,
    this.responseAt,
  });

  /// Үнэлгээний ID.
  final String id;

  /// Холбогдох зарын ID.
  final String listingId;

  /// Худалдагчийн ID.
  final String sellerId;

  /// Худалдан авагчийн ID.
  final String buyerId;

  /// Үнэлгээ (1-5).
  final int rating;

  /// Сэтгэгдэл текст.
  final String review;

  /// Үнэлсэн огноо.
  final DateTime createdAt;

  /// Худалдагчийн хариу (null бол хариу өгөөгүй).
  final String? sellerResponse;

  /// Хариулсан огноо.
  final DateTime? responseAt;

  /// Худалдагч хариу өгсөн эсэх.
  bool get hasResponse => sellerResponse != null && sellerResponse!.isNotEmpty;

  // ── CopyWith ──────────────────────────────────────────────────────

  SellerRating copyWith({
    String? id,
    String? listingId,
    String? sellerId,
    String? buyerId,
    int? rating,
    String? review,
    DateTime? createdAt,
    String? sellerResponse,
    bool clearResponse = false,
    DateTime? responseAt,
    bool clearResponseAt = false,
  }) {
    return SellerRating(
      id: id ?? this.id,
      listingId: listingId ?? this.listingId,
      sellerId: sellerId ?? this.sellerId,
      buyerId: buyerId ?? this.buyerId,
      rating: rating ?? this.rating,
      review: review ?? this.review,
      createdAt: createdAt ?? this.createdAt,
      sellerResponse: clearResponse ? null : (sellerResponse ?? this.sellerResponse),
      responseAt: clearResponseAt ? null : (responseAt ?? this.responseAt),
    );
  }

  // ── Serialization ────────────────────────────────────────────────

  factory SellerRating.fromJson(Map<String, dynamic> json) {
    return SellerRating(
      id: json['id'] as String,
      listingId: json['listingId'] as String,
      sellerId: json['sellerId'] as String,
      buyerId: json['buyerId'] as String,
      rating: json['rating'] as int,
      review: json['review'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      sellerResponse: json['sellerResponse'] as String?,
      responseAt: json['responseAt'] != null
          ? DateTime.parse(json['responseAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'listingId': listingId,
      'sellerId': sellerId,
      'buyerId': buyerId,
      'rating': rating,
      'review': review,
      'createdAt': createdAt.toIso8601String(),
      'sellerResponse': sellerResponse,
      'responseAt': responseAt?.toIso8601String(),
    };
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is SellerRating &&
          id == other.id &&
          rating == other.rating &&
          review == other.review &&
          sellerResponse == other.sellerResponse;

  @override
  int get hashCode => Object.hash(id, rating, review, sellerResponse);

  @override
  String toString() =>
      'SellerRating(id: $id, sellerId: $sellerId, rating: $rating, hasResponse: $hasResponse)';
}

/// Худалдагчийн үнэлгээний хураангуй.
///
/// Дундаж үнэлгээ, нийт тоо, тархалт (5: N, 4: N, ...).
class SellerRatingSummary {
  const SellerRatingSummary({
    required this.averageRating,
    required this.totalCount,
    required this.distribution,
  });

  /// Дундаж үнэлгээ (0.0 - 5.0).
  final double averageRating;

  /// Нийт үнэлгээний тоо.
  final int totalCount;

  /// Тархалт (rating -> тоо). Түлхүүр нь 1-5.
  final Map<int, int> distribution;

  /// Үнэлгээтэй эсэх.
  bool get hasRatings => totalCount > 0;

  /// Хамгийн олон сонгогдсон үнэлгээ.
  int? get mostCommonRating {
    if (totalCount == 0 || distribution.isEmpty) return null;
    return distribution.entries
        .reduce((a, b) => a.value >= b.value ? a : b)
        .key;
  }

  /// Өгөгдсөн үнэлгээний хувь.
  double percentageFor(int rating) {
    if (totalCount == 0) return 0.0;
    return (distribution[rating] ?? 0) / totalCount;
  }

  // ── Factory ──────────────────────────────────────────────────────

  /// Үнэлгээнүүдийн жагсаалтаас хураангуй үүсгэх.
  factory SellerRatingSummary.fromRatings(List<SellerRating> ratings) {
    if (ratings.isEmpty) {
      return const SellerRatingSummary(
        averageRating: 0.0,
        totalCount: 0,
        distribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
      );
    }

    final distribution = <int, int>{1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
    var sum = 0;

    for (final r in ratings) {
      final clamped = r.rating.clamp(1, 5);
      distribution[clamped] = (distribution[clamped] ?? 0) + 1;
      sum += clamped;
    }

    return SellerRatingSummary(
      averageRating: sum / ratings.length,
      totalCount: ratings.length,
      distribution: distribution,
    );
  }

  factory SellerRatingSummary.fromJson(Map<String, dynamic> json) {
    return SellerRatingSummary(
      averageRating: (json['averageRating'] as num).toDouble(),
      totalCount: json['totalCount'] as int,
      distribution: Map<int, int>.from(
        (json['distribution'] as Map<String, dynamic>).map(
          (k, v) => MapEntry(int.parse(k), v as int),
        ),
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'averageRating': averageRating,
      'totalCount': totalCount,
      'distribution': distribution.map((k, v) => MapEntry(k.toString(), v)),
    };
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is SellerRatingSummary &&
          averageRating == other.averageRating &&
          totalCount == other.totalCount;

  @override
  int get hashCode => Object.hash(averageRating, totalCount);

  @override
  String toString() =>
      'SellerRatingSummary(avg: $averageRating, count: $totalCount, distribution: $distribution)';
}
