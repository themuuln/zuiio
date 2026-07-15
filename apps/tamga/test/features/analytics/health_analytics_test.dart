import 'package:flutter_test/flutter_test.dart';

import 'package:tamga/src/shared/domain/health_log.dart'
    show HealthLog, LogType;
import 'package:tamga/src/features/analytics/domain/health_analytics.dart'
    show HealthAnalytics;

void main() {
  group('HealthAnalytics', () {
    final logs = [
      HealthLog(
        id: '1',
        horseId: 'horse1',
        logType: LogType.vaccination,
        date: DateTime(2025, 6, 1),
        notes: 'Rabies vaccine',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
      HealthLog(
        id: '2',
        horseId: 'horse1',
        logType: LogType.deworming,
        date: DateTime(2026, 1, 15),
        notes: 'Deworming',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
      HealthLog(
        id: '3',
        horseId: 'horse2',
        logType: LogType.vaccination,
        date: DateTime(2025, 12, 1),
        notes: 'Flu vaccine',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
      HealthLog(
        id: '4',
        horseId: 'horse2',
        logType: LogType.treatment,
        date: DateTime(2026, 3, 10),
        notes: 'Injury treatment',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
      HealthLog(
        id: '5',
        horseId: 'horse3',
        logType: LogType.vaccination,
        date: DateTime(2026, 1, 10),
        notes: 'Tetanus vaccine',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
      HealthLog(
        id: '6',
        horseId: 'horse2',
        logType: LogType.vetVisit,
        date: DateTime(2026, 2, 5),
        notes: 'Regular checkup',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
    ];

    test('vaccinationRate returns correct percentage of vaccinated horses', () {
      // 3 horses total, all 3 have vaccination records
      final analytics = HealthAnalytics(healthLogs: logs, totalHorses: 3);
      expect(analytics.vaccinationRate, 1.0);
    });

    test('vaccinationRate is 0 when no horses', () {
      final analytics = HealthAnalytics(healthLogs: [], totalHorses: 0);
      expect(analytics.vaccinationRate, 0.0);
    });

    test('vaccinationRate is partial when some horses not vaccinated', () {
      // Only horse1 and horse2 have vaccinations (out of 3 horses)
      final logsWithoutHorse3Vaccination = logs
          .where(
            (l) => l.horseId != 'horse3' || l.logType != LogType.vaccination,
          )
          .toList();

      // Add some non-vaccination logs for horse3
      logsWithoutHorse3Vaccination.add(
        HealthLog(
          id: '7',
          horseId: 'horse3',
          logType: LogType.treatment,
          date: DateTime(2026, 4, 1),
          notes: 'Treatment',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      );
      // horse3 has no vaccination, so rate = 2/3
      final analytics = HealthAnalytics(
        healthLogs: logsWithoutHorse3Vaccination,
        totalHorses: 3,
      );
      expect(analytics.vaccinationRate, 2 / 3);
    });

    test('upcomingDueItems detects vaccination due within 30 days', () {
      // If recent vaccination was June 1, 2025, due date is June 1, 2026
      // Current date is June 18, 2026, so it's 17 days overdue... hmm
      // Actually the due date is +1 year = June 1, 2026, and today is June 18, 2026
      // So daysUntilDue = June 1, 2026 - June 18, 2026 = -17 (already past due)
      // Our check is daysUntilDue >= 0 && daysUntilDue <= 30
      // So this would not be included since it's in the past
      //
      // Let me create a scenario where the vaccination is due soon
      final nearExpiryLogs = [
        HealthLog(
          id: '10',
          horseId: 'horse1',
          logType: LogType.vaccination,
          date: DateTime(2025, 7, 1),
          notes: 'Vaccination',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
        HealthLog(
          id: '11',
          horseId: 'horse2',
          logType: LogType.vaccination,
          date: DateTime(2025, 12, 20),
          notes: 'Vaccination',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      ];
      // horse1 vaccination on July 1, 2025, due July 1, 2026
      // That's 13 days from today (June 18, 2026)
      // horse2 vaccination on Dec 20, 2025, due Dec 20, 2026
      // That's 185 days from today... too far
      final analytics = HealthAnalytics(
        healthLogs: nearExpiryLogs,
        totalHorses: 2,
      );

      // horse1 should be in upcoming due items (13 days until due)
      final horse1Items = analytics.upcomingDueItems.where(
        (i) => i.horseId == 'horse1',
      );
      expect(horse1Items.isNotEmpty, true);
      expect(horse1Items.first.logType, LogType.vaccination);

      // horse2 should not be in upcoming due items (185 days away)
      final horse2Items = analytics.upcomingDueItems.where(
        (i) => i.horseId == 'horse2',
      );
      expect(horse2Items.isEmpty, true);
    });

    test('upcomingDueItems returns empty when no logs', () {
      final analytics = HealthAnalytics(healthLogs: [], totalHorses: 2);
      expect(analytics.upcomingDueItems, []);
    });

    test('healthTrends groups logs by month and counts by type', () {
      final analytics = HealthAnalytics(healthLogs: logs, totalHorses: 3);
      expect(analytics.healthTrends.isNotEmpty, true);

      // Count unique months
      final months = analytics.healthTrends
          .map((p) => '${p.date.year}-${p.date.month}')
          .toSet();
      expect(months.length, greaterThanOrEqualTo(4));
    });

    test('healthTrends returns empty when no logs have dates', () {
      final logsWithoutDates = [
        HealthLog(
          id: '1',
          horseId: 'horse1',
          logType: LogType.vaccination,
          date: null,
          notes: 'No date',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      ];
      final analytics = HealthAnalytics(
        healthLogs: logsWithoutDates,
        totalHorses: 1,
      );
      expect(analytics.healthTrends, []);
    });

    test('empty returns correct static empty instance', () {
      final analytics = HealthAnalytics.empty;
      expect(analytics.healthLogs, []);
      expect(analytics.totalHorses, 0);
      expect(analytics.vaccinationRate, 0.0);
      expect(analytics.upcomingDueItems, []);
      expect(analytics.healthTrends, []);
    });
  });
}
