import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/features/races/domain/race.dart';
import 'package:tamga/src/features/races/presentation/race_form_screen.dart';
import '../../../helpers/test_helpers.dart';

// ── Helper to create a ProviderScope wrapper ────────────────────────

Widget createRaceFormScreen({
  Race? initialRace,
}) {
  return ProviderScope(
    child: MaterialApp(
      theme: AppTheme.light(),
      home: RaceFormScreen(initialRace: initialRace),
    ),
  );
}

void main() {
  group('RaceFormScreen', () {
    // ════════════════════════════════════════════════════════════
    // VAL-RACE-030: Organizer can create race
    // ════════════════════════════════════════════════════════════
    testWidgets('create mode shows all required fields and save button', (
      tester,
    ) async {
      await tester.pumpWidget(createRaceFormScreen());
      await tester.pumpAndSettle();

      // Verify title
      expect(find.text('Уралдаан үүсгэх'), findsOneWidget);

      // Verify form fields exist
      expect(find.text('Уралдааны нэр *'), findsOneWidget);
      expect(find.text('Огноо *'), findsOneWidget);
      expect(find.text('Байршил'), findsOneWidget);
      expect(find.text('Төрөл *'), findsOneWidget);
      expect(find.text('Оролцогчдын дээд тоо'), findsOneWidget);
      expect(find.text('Оролцооны төлбөр (₮)'), findsOneWidget);
      expect(find.text('Тодорхойлолт'), findsOneWidget);
      expect(find.text('Шагналын хуваарилалт'), findsOneWidget);

      // Verify save button
      expect(find.text('Хадгалах'), findsOneWidget);
    });

    testWidgets('create mode validates required name field', (tester) async {
      await tester.pumpWidget(createRaceFormScreen());
      await tester.pumpAndSettle();

      // Tap save without entering name
      await tester.tap(find.text('Хадгалах'));
      await tester.pumpAndSettle();

      // Should show validation error
      expect(find.text('Нэр шаардлагатай'), findsOneWidget);
    });

    testWidgets('create mode allows entering all race fields', (tester) async {
      await tester.pumpWidget(createRaceFormScreen());
      await tester.pumpAndSettle();

      // Enter race name
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Уралдааны нэр *'),
        'Төв аймгийн наадам',
      );

      // Enter location
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Байршил'),
        'Төв аймаг',
      );

      // Enter max entries
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Оролцогчдын дээд тоо'),
        '50',
      );

      // Enter entry fee
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Оролцооны төлбөр (₮)'),
        '10000',
      );

      // Enter description
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Тодорхойлолт'),
        'Уралдааны тодорхойлолт',
      );

      // Enter prize distribution
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Шагналын хуваарилалт'),
        '1-р байр: 500,000₮',
      );

      // Verify text was entered
      expect(
        find.text('Төв аймгийн наадам'),
        findsOneWidget,
      );
    });

    // ════════════════════════════════════════════════════════════
    // VAL-RACE-031: Organizer can edit existing race
    // ════════════════════════════════════════════════════════════
    testWidgets('edit mode shows existing race data', (tester) async {
      final existingRace = createMockRace(
        id: 'race-1',
        name: 'Одоо байгаа уралдаан',
        location: 'Улаанбаатар',
        type: RaceType.naadam,
        maxEntries: 30,
        entryFee: 5000,
        description: 'Тэмцээний тодорхойлолт',
        prizeDistribution: '1: 1 сая',
      );

      await tester.pumpWidget(
        createRaceFormScreen(initialRace: existingRace),
      );
      await tester.pumpAndSettle();

      // Verify title shows edit
      expect(find.text('Уралдаан засах'), findsOneWidget);

      // Verify existing data is populated
      expect(find.text('Одоо байгаа уралдаан'), findsOneWidget);
      expect(find.text('Наадам'), findsOneWidget);
    });
  });
}
