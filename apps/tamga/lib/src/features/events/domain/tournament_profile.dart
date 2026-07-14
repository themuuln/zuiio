/// Морины тэмцээний нийтлэг профайл.
///
/// Нэг дор бүх тэмцээний үр дүнг харуулж, зах зээлийн итгэлцлийг нэмэгдүүлнэ.
library;

/// Морины тэмцээний нийтлэг профайл.
class TournamentProfile {
  const TournamentProfile({
    required this.horseId,
    required this.horseName,
    this.totalRaces = 0,
    this.firstPlace = 0,
    this.secondPlace = 0,
    this.thirdPlace = 0,
    this.participationCount = 0,
    this.totalPrizeMoney = 0,
    this.recentResults = const [],
    this.bestAchievement,
    this.lastRaceDate,
  });

  /// Морины ID.
  final String horseId;

  /// Морины нэр.
  final String horseName;

  /// Нийт уралдааны тоо.
  final int totalRaces;

  /// 1-р байр.
  final int firstPlace;

  /// 2-р байр.
  final int secondPlace;

  /// 3-р байр.
  final int thirdPlace;

  /// Оролцсон тэмцээний тоо.
  final int participationCount;

  /// Нийт шагналын мөнгө (₮).
  final double totalPrizeMoney;

  /// Сүүлийн үр дүнгүүд.
  final List<TournamentResult> recentResults;

  /// Хамгийн сайн амжилт.
  final String? bestAchievement;

  /// Сүүлийн уралдааны огноо.
  final DateTime? lastRaceDate;

  /// Ялалтын хувь.
  double get winRate => totalRaces > 0 ? (firstPlace / totalRaces * 100) : 0;

  /// Тодорхойлолт текст.
  String get summaryText {
    if (totalRaces == 0) {
      return 'Тэмцээний түүх байхгүй';
    }
    return '$totalRaces уралдаан, $firstPlace ялалт (${winRate.toStringAsFixed(0)}%)';
  }

  /// Шагналын мөнгөн дүн.
  String get prizeMoneyText {
    if (totalPrizeMoney == 0) return 'Шагнал байхгүй';
    return '${totalPrizeMoney.toStringAsFixed(0)}₮';
  }
}

/// Тэмцээний нэгэн үр дүн.
class TournamentResult {
  const TournamentResult({
    required this.eventId,
    required this.eventName,
    required this.date,
    required this.place,
    required this.participants,
    this.prize,
    this.notes = '',
  });

  /// Арга хэмжээний ID.
  final String eventId;

  /// Арга хэмжээний нэр.
  final String eventName;

  /// Огноо.
  final DateTime date;

  /// Байр.
  final int place;

  /// Оролцогчдын тоо.
  final int participants;

  /// Шагналын мөнгө.
  final double? prize;

  /// Нэмэлт тэмдэглэл.
  final String notes;

  /// Байрын текст.
  String get placeText => '$place-р байр';

  /// Шагналын мөнгөний текст.
  String get prizeText => prize != null ? '${prize!.toStringAsFixed(0)}₮' : '';

  /// Амжилттай эсэх (1-3-р байр).
  bool get isPodium => place <= 3;
}

/// Тэмцээний профайлыг үүсгэх туслах.
class TournamentProfileBuilder {
  /// Event жагсаалтаас TournamentProfile үүсгэх.
  static TournamentProfile fromEvents({
    required String horseId,
    required String horseName,
    required List<Map<String, dynamic>> events,
  }) {
    int firstPlace = 0;
    int secondPlace = 0;
    int thirdPlace = 0;
    double totalPrize = 0;
    DateTime? lastDate;
    String? bestAchievement;

    final results = <TournamentResult>[];

    for (final event in events) {
      final place = event['place'] as int? ?? 0;
      final prize = (event['prize'] as num?)?.toDouble();
      final dateStr = event['date'] as String?;
      final date = dateStr != null ? DateTime.tryParse(dateStr) : null;

      if (place == 1) firstPlace++;
      if (place == 2) secondPlace++;
      if (place == 3) thirdPlace++;
      if (prize != null) totalPrize += prize;

      if (date != null && (lastDate == null || date.isAfter(lastDate))) {
        lastDate = date;
      }

      if (place == 1 && bestAchievement == null) {
        bestAchievement = event['name'] as String?;
      }

      results.add(
        TournamentResult(
          eventId: event['id'] as String? ?? '',
          eventName: event['name'] as String? ?? '',
          date: date ?? DateTime.now(),
          place: place,
          participants: event['participants'] as int? ?? 0,
          prize: prize,
          notes: event['notes'] as String? ?? '',
        ),
      );
    }

    // Хугацааны дарааллаар эрэмбэлэх (шинэ нь эхэнд).
    results.sort((a, b) => b.date.compareTo(a.date));

    return TournamentProfile(
      horseId: horseId,
      horseName: horseName,
      totalRaces: events.length,
      firstPlace: firstPlace,
      secondPlace: secondPlace,
      thirdPlace: thirdPlace,
      participationCount: events.length,
      totalPrizeMoney: totalPrize,
      recentResults: results.take(10).toList(),
      bestAchievement: bestAchievement,
      lastRaceDate: lastDate,
    );
  }
}
