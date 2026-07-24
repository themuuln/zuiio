import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tamga/src/features/analytics/presentation/widgets/stat_card.dart';

void main() {
  group('StatCard', () {
    testWidgets('renders label and value', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatCard(
              label: 'Total Horses',
              value: '42',
            ),
          ),
        ),
      );

      expect(find.text('Total Horses'), findsOneWidget);
      expect(find.text('42'), findsOneWidget);
    });

    testWidgets('renders with icon', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatCard(
              label: 'Revenue',
              value: '₮5,000,000',
              icon: Icons.attach_money,
              color: Colors.green,
            ),
          ),
        ),
      );

      expect(find.text('Revenue'), findsOneWidget);
      expect(find.text('₮5,000,000'), findsOneWidget);
      expect(find.byIcon(Icons.attach_money), findsOneWidget);
    });

    testWidgets('renders with trend indicator', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatCard(
              label: 'Active Listings',
              value: '12',
              trend: '+20%',
              trendIcon: Icons.trending_up,
              trendColor: Colors.green,
            ),
          ),
        ),
      );

      expect(find.text('Active Listings'), findsOneWidget);
      expect(find.text('12'), findsOneWidget);
      expect(find.text('+20%'), findsOneWidget);
      expect(find.byIcon(Icons.trending_up), findsOneWidget);
    });

    testWidgets('renders loading state', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatCard.loading(),
          ),
        ),
      );

      expect(find.text('Уншиж байна...'), findsOneWidget);
      expect(find.text('---'), findsOneWidget);
    });

    testWidgets('renders error state', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatCard.error(message: 'Failed to load'),
          ),
        ),
      );

      expect(find.text('Failed to load'), findsOneWidget);
      expect(find.text('!'), findsOneWidget);
      expect(find.byIcon(Icons.error_outline), findsOneWidget);
    });

    testWidgets('renders empty state', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatCard.empty(label: 'No data available'),
          ),
        ),
      );

      expect(find.text('No data available'), findsOneWidget);
      expect(find.text('0'), findsOneWidget);
    });
  });
}
