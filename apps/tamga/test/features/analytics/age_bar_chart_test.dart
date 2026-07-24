import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tamga/src/features/analytics/domain/herd_analytics.dart'
    show AgeBucket;
import 'package:tamga/src/features/analytics/presentation/widgets/age_bar_chart.dart';

void main() {
  group('AgeBarChart', () {
    testWidgets('renders loading state', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: AgeBarChart.loading(),
          ),
        ),
      );

      expect(find.text('Насны хуваарилалт ачааллаж байна...'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('renders empty state', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AgeBarChart(ageDistribution: []),
          ),
        ),
      );

      expect(find.text('Насны мэдээлэл байхгүй'), findsOneWidget);
    });

    testWidgets('renders with age distribution data', (tester) async {
      final ageBuckets = [
        AgeBucket(label: '0-1', count: 3),
        AgeBucket(label: '2-3', count: 5),
        AgeBucket(label: '4-5', count: 2),
      ];

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SizedBox(
              height: 300,
              child: AgeBarChart(ageDistribution: ageBuckets),
            ),
          ),
        ),
      );

      // Should show title
      expect(find.text('Насны хуваарилалт'), findsOneWidget);

      // Should show bucket labels
      expect(find.text('0-1'), findsOneWidget);
      expect(find.text('2-3'), findsOneWidget);
      expect(find.text('4-5'), findsOneWidget);
    });
  });
}
