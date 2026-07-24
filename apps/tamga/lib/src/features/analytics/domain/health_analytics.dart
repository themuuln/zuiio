import '../../../shared/domain/health_log.dart';

/// Хугацаа дуусах дөхсөн эрүүл мэндийн бүртгэл.
class UpcomingDueItem {
  const UpcomingDueItem({
    required this.horseId,
    required this.horseName,
    required this.logType,
    required this.lastDate,
    required this.dueDate,
    required this.daysUntilDue,
  });

  final String horseId;
  final String horseName;
  final LogType logType;
  final DateTime lastDate;
  final DateTime dueDate;
  final int daysUntilDue;
}

/// Эрүүл мэндийн хандлагын цэг (timeline graph-д зориулагдсан).
class HealthTrendPoint {
  const HealthTrendPoint({
    required this.date,
    required this.count,
    required this.logType,
  });

  final DateTime date;
  final int count;
  final LogType logType;
}

/// Эрүүл мэндийн аналитикийн домэйн модел.
///
/// Эрүүл мэндийн бүртгэлээр вакцинжуулалтын хувь,
/// удахгүй хийх шаардлагатай зүйлс, эрүүл мэндийн
/// хандлагыг тооцоолно.
class HealthAnalytics {
  HealthAnalytics({required this.healthLogs, required this.totalHorses})
    : vaccinationRate = _computeVaccinationRate(healthLogs, totalHorses),
      upcomingDueItems = _computeUpcomingDueItems(healthLogs),
      healthTrends = _computeHealthTrends(healthLogs);

  /// Эрүүл мэндийн бүртгэлүүд.
  final List<HealthLog> healthLogs;

  /// Нийт морины тоо (хувь тооцоололд хэрэглэгдэнэ).
  final int totalHorses;

  /// Вакцинжуулалтын хувь (0.0 - 1.0).
  final double vaccinationRate;

  /// Удахгүй хийх шаардлагатай зүйлс.
  final List<UpcomingDueItem> upcomingDueItems;

  /// Эрүүл мэндийн хандлага (сар/долоо хоног тутам).
  final List<HealthTrendPoint> healthTrends;

  /// Хоосон аналитик.
  static final empty = HealthAnalytics(healthLogs: [], totalHorses: 0);

  // ── Тооцоолол ─────────────────────────────────────────────────

  static double _computeVaccinationRate(List<HealthLog> logs, int totalHorses) {
    if (totalHorses == 0) return 0.0;

    // Вакцин хийлгэсэн морины тоо
    final vaccinatedHorseIds = <String>{};
    for (final log in logs) {
      if (log.logType == LogType.vaccination) {
        vaccinatedHorseIds.add(log.horseId);
      }
    }

    return vaccinatedHorseIds.length / totalHorses;
  }

  static List<UpcomingDueItem> _computeUpcomingDueItems(List<HealthLog> logs) {
    // Вакцины хугацаа: сүүлийн вакцин хийлгэснээс хойш 1 жил
    // Туулгалт: 6 сар
    // Эмчилгээ: тогтмол биш
    final now = DateTime.now();
    final dueItems = <UpcomingDueItem>[];

    // Сүүлчийн вакцины бүртгэлийг морь тус бүрээр бүлэглэх
    final horseVaccinations = <String, HealthLog>{};
    final horseDewormings = <String, HealthLog>{};

    for (final log in logs) {
      if (log.logType == LogType.vaccination) {
        final existing = horseVaccinations[log.horseId];
        if (existing == null ||
            (log.date != null &&
                existing.date != null &&
                log.date!.isAfter(existing.date!))) {
          horseVaccinations[log.horseId] = log;
        }
      } else if (log.logType == LogType.deworming) {
        final existing = horseDewormings[log.horseId];
        if (existing == null ||
            (log.date != null &&
                existing.date != null &&
                log.date!.isAfter(existing.date!))) {
          horseDewormings[log.horseId] = log;
        }
      }
    }

    // Вакцины хугацаа дуусахыг шалгах
    for (final entry in horseVaccinations.entries) {
      final log = entry.value;
      if (log.date == null) continue;
      final dueDate = DateTime(
        log.date!.year + 1,
        log.date!.month,
        log.date!.day,
      );
      final daysUntilDue = dueDate.difference(now).inDays;
      if (daysUntilDue <= 30 && daysUntilDue >= 0) {
        dueItems.add(
          UpcomingDueItem(
            horseId: log.horseId,
            horseName: log.horseId, // Таних тэмдэг (нэрийг provider-ээр нэмнэ)
            logType: log.logType,
            lastDate: log.date!,
            dueDate: dueDate,
            daysUntilDue: daysUntilDue,
          ),
        );
      }
    }

    // Туулгалтын хугацаа дуусахыг шалгах
    for (final entry in horseDewormings.entries) {
      final log = entry.value;
      if (log.date == null) continue;
      final dueDate = DateTime(
        log.date!.year,
        log.date!.month + 6,
        log.date!.day,
      );
      final daysUntilDue = dueDate.difference(now).inDays;
      if (daysUntilDue <= 30 && daysUntilDue >= 0) {
        dueItems.add(
          UpcomingDueItem(
            horseId: log.horseId,
            horseName: log.horseId,
            logType: log.logType,
            lastDate: log.date!,
            dueDate: dueDate,
            daysUntilDue: daysUntilDue,
          ),
        );
      }
    }

    // Хугацаагаар эрэмбэлэх
    dueItems.sort((a, b) => a.daysUntilDue.compareTo(b.daysUntilDue));
    return dueItems;
  }

  static List<HealthTrendPoint> _computeHealthTrends(List<HealthLog> logs) {
    if (logs.isEmpty) return [];

    // Эрүүл мэндийн бүртгэлийг сараар бүлэглэх
    final monthlyCounts = <_MonthKey, Map<LogType, int>>{};

    for (final log in logs) {
      if (log.date == null) continue;
      final key = _MonthKey.fromDate(log.date!);
      monthlyCounts.putIfAbsent(key, () => {});
      monthlyCounts[key]![log.logType] =
          (monthlyCounts[key]![log.logType] ?? 0) + 1;
    }

    // Эрэмбэлээд цэг болгох
    final sortedKeys = monthlyCounts.keys.toList()..sort();
    final points = <HealthTrendPoint>[];
    for (final key in sortedKeys) {
      for (final entry in monthlyCounts[key]!.entries) {
        points.add(
          HealthTrendPoint(
            date: DateTime(key.year, key.month),
            count: entry.value,
            logType: entry.key,
          ),
        );
      }
    }

    return points;
  }
}

/// Сар-жилийг төлөөлөх туслах класс.
class _MonthKey implements Comparable<_MonthKey> {
  const _MonthKey({required this.year, required this.month});

  factory _MonthKey.fromDate(DateTime date) {
    return _MonthKey(year: date.year, month: date.month);
  }

  final int year;
  final int month;

  @override
  int compareTo(_MonthKey other) {
    final yearCmp = year.compareTo(other.year);
    return yearCmp != 0 ? yearCmp : month.compareTo(other.month);
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is _MonthKey && year == other.year && month == other.month;

  @override
  int get hashCode => Object.hash(year, month);

  @override
  String toString() => '$year-$month';
}
