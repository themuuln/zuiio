import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tamga/src/features/analytics/domain/health_analytics.dart'
    show HealthTrendPoint;
import 'package:tamga/src/shared/domain/health_log.dart' show LogType;
import 'package:tamga/src/features/analytics/presentation/widgets/health_timeline_chart.dart';

void main() {
  group('HealthTimelineChart', () {
    testWidgets('renders loading state', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: Scaffold(body: HealthTimelineChart.loading())),
      );

      expect(
        find.text('Эрүүл мэндийн хандлага ачааллаж байна...'),
        findsOneWidget,
      );
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('renders empty state', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: HealthTimelineChart(healthTrends: [])),
        ),
      );

      expect(find.text('Эрүүл мэндийн бүртгэл байхгүй'), findsOneWidget);
    });

    testWidgets('renders with health trend data', (tester) async {
      final trends = [
        HealthTrendPoint(
          date: DateTime(2026, 1),
          count: 3,
          logType: LogType.vaccination,
        ),
        HealthTrendPoint(
          date: DateTime(2026, 1),
          count: 1,
          logType: LogType.deworming,
        ),
        HealthTrendPoint(
          date: DateTime(2026, 2),
          count: 2,
          logType: LogType.vaccination,
        ),
      ];

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SizedBox(
              height: 300,
              child: HealthTimelineChart(healthTrends: trends),
            ),
          ),
        ),
      );

      // Should show title
      expect(find.text('Эрүүл мэндийн хандлага'), findsOneWidget);

      // Should show legend entries
      expect(find.text('Вакцинжуулалт'), findsOneWidget);
      expect(find.text('Туулгалт'), findsOneWidget);
    });
  });
}
