import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tamga/src/shared/domain/horse.dart' show HorseGender;
import 'package:tamga/src/features/analytics/presentation/widgets/gender_pie_chart.dart';

void main() {
  group('GenderPieChart', () {
    testWidgets('renders loading state', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: GenderPieChart.loading(),
          ),
        ),
      );

      expect(find.text('Хүйсний мэдээлэл ачааллаж байна...'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('renders empty state', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GenderPieChart(genderSplit: {}),
          ),
        ),
      );

      expect(find.text('Хүйсний мэдээлэл байхгүй'), findsOneWidget);
    });

    testWidgets('renders with gender split data', (tester) async {
      final genderSplit = {
        HorseGender.stallion: 3,
        HorseGender.mare: 5,
        HorseGender.gelding: 2,
      };

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SizedBox(
              height: 300,
              child: GenderPieChart(genderSplit: genderSplit),
            ),
          ),
        ),
      );

      // Should show title
      expect(find.text('Хүйсний харьцаа'), findsOneWidget);

      // Should show legend entries with counts
      expect(find.textContaining('3'), findsWidgets);
      expect(find.textContaining('5'), findsWidgets);
      expect(find.textContaining('2'), findsWidgets);

      // Should show gender display names
      expect(find.textContaining('Азарга'), findsWidgets);
      expect(find.textContaining('Гүү'), findsWidgets);
      expect(find.textContaining('Морь'), findsWidgets);
    });
  });
}
