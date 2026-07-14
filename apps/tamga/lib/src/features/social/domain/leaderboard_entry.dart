/// Үржүүлэгчийн чансааны (leaderboard) нэг мөр.
///
/// Үржүүлэгчийн үзүүлэлтүүдийн хураангуй — нийт оноо,
/// идэвхтэй зарууд, гүйцэтгэсэн борлуулалт, дундаж үнэлгээ, морины тоо.
class LeaderboardEntry {
  const LeaderboardEntry({
    required this.rank,
    required this.breederId,
    required this.breederName,
    this.locationLabel = '',
    required this.totalScore,
    this.activeListingsCount = 0,
    this.completedSalesCount = 0,
    this.averageRating = 0.0,
    this.horseCount = 0,
  });

  /// Чансааны дугаар.
  final int rank;

  /// Үржүүлэгчийн ID.
  final String breederId;

  /// Үржүүлэгчийн нэр.
  final String breederName;

  /// Байршил (аймаг, сум).
  final String locationLabel;

  /// Нийт оноо.
  final int totalScore;

  /// Идэвхтэй заруудын тоо.
  final int activeListingsCount;

  /// Гүйцэтгэсэн борлуулалтын тоо.
  final int completedSalesCount;

  /// Дундаж үнэлгээ (1-5).
  final double averageRating;

  /// Морины тоо.
  final int horseCount;

  // ── CopyWith ──────────────────────────────────────────────────

  LeaderboardEntry copyWith({
    int? rank,
    String? breederId,
    String? breederName,
    String? locationLabel,
    int? totalScore,
    int? activeListingsCount,
    int? completedSalesCount,
    double? averageRating,
    int? horseCount,
  }) {
    return LeaderboardEntry(
      rank: rank ?? this.rank,
      breederId: breederId ?? this.breederId,
      breederName: breederName ?? this.breederName,
      locationLabel: locationLabel ?? this.locationLabel,
      totalScore: totalScore ?? this.totalScore,
      activeListingsCount: activeListingsCount ?? this.activeListingsCount,
      completedSalesCount: completedSalesCount ?? this.completedSalesCount,
      averageRating: averageRating ?? this.averageRating,
      horseCount: horseCount ?? this.horseCount,
    );
  }

  // ── Serialization ────────────────────────────────────────────

  factory LeaderboardEntry.fromJson(Map<String, dynamic> json) {
    return LeaderboardEntry(
      rank: json['rank'] as int,
      breederId: json['breederId'] as String,
      breederName: json['breederName'] as String,
      locationLabel: json['locationLabel'] as String? ?? '',
      totalScore: json['totalScore'] as int,
      activeListingsCount: json['activeListingsCount'] as int? ?? 0,
      completedSalesCount: json['completedSalesCount'] as int? ?? 0,
      averageRating: (json['averageRating'] as num?)?.toDouble() ?? 0.0,
      horseCount: json['horseCount'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'rank': rank,
      'breederId': breederId,
      'breederName': breederName,
      'locationLabel': locationLabel,
      'totalScore': totalScore,
      'activeListingsCount': activeListingsCount,
      'completedSalesCount': completedSalesCount,
      'averageRating': averageRating,
      'horseCount': horseCount,
    };
  }

  // ── Equality ─────────────────────────────────────────────────

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is LeaderboardEntry &&
          rank == other.rank &&
          breederId == other.breederId &&
          totalScore == other.totalScore;

  @override
  int get hashCode => Object.hash(rank, breederId, totalScore);

  @override
  String toString() =>
      'LeaderboardEntry(rank: $rank, breederId: $breederId, '
      'name: $breederName, score: $totalScore)';
}

/// Хугацааны шүүлтүүрийн төрөл.
enum LeaderboardTimePeriod {
  /// Сүүлийн 7 хоног.
  last7d,

  /// Сүүлийн 30 хоног.
  last30d,

  /// Бүх хугацаа.
  all,
}

extension LeaderboardTimePeriodLabel on LeaderboardTimePeriod {
  String get label => switch (this) {
    LeaderboardTimePeriod.last7d => '7 хоног',
    LeaderboardTimePeriod.last30d => '30 хоног',
    LeaderboardTimePeriod.all => 'Бүгд',
  };
}
