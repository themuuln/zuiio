import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/horses/application/horses_providers.dart';
import 'package:tamga/src/features/map/presentation/report_lost_horse_screen.dart';

void main() {
  testWidgets('shows identity step and validates before continuing', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [horsesProvider.overrideWith((ref) async => [])],
        child: const MaterialApp(home: ReportLostHorseScreen()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Амьтнаа таних мэдээлэл'), findsOneWidget);
    expect(find.text('Зар хадгалах / Save report'), findsNothing);

    // ── Localized identity card is present ──
    expect(find.text('Хүйс / Gender'), findsOneWidget);
    expect(find.text('Нас / Age (optional)'), findsOneWidget);
    expect(find.text('Үүлдэр / Breed (optional)'), findsOneWidget);
    expect(find.text('Малын тоо / Count'), findsOneWidget);
    expect(find.text('Хайх радиус / Search radius'), findsOneWidget);
    expect(
      find.text('Хөдөлсөн зүг / Likely direction (optional)'),
      findsOneWidget,
    );
    expect(
      find.text('Нууц баталгаажуулах тэмдэг / Private mark (optional)'),
      findsOneWidget,
    );
    expect(
      find.text('Холбоо барих утас / Contact phone (optional)'),
      findsOneWidget,
    );

    await tester.tap(find.text('Үргэлжлүүлэх / Continue'));
    await tester.pump();

    expect(find.textContaining('таних мэдээллээс'), findsOneWidget);
  });

  testWidgets(
    'coat color typed into the autocomplete satisfies identity validation',
    (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [horsesProvider.overrideWith((ref) async => [])],
          child: const MaterialApp(home: ReportLostHorseScreen()),
        ),
      );
      await tester.pumpAndSettle();

      // Type into the coat field (fires onChanged, which must reach the draft),
      // then select a suggestion — the real-user flow that commits the value
      // and closes the options overlay that otherwise covers the bottom action.
      // pumpAndSettle lets the async options overlay insert itself (the
      // optionsBuilder runs asynchronously before the OverlayPortal shows).
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Зүс / Coat color (optional)'),
        'Хээр',
      );
      await tester.pumpAndSettle();
      await tester.tap(find.text('Хээр алаг'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Үргэлжлүүлэх / Continue'));
      await tester.pumpAndSettle();

      // Identity validation passes with the coat color, so step 2 shows.
      expect(find.textContaining('таних мэдээллээс'), findsNothing);
      expect(find.text('Сүүлд үзэгдсэн газар'), findsWidgets);
    },
  );

  testWidgets('age chips and direction pills toggle selection', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [horsesProvider.overrideWith((ref) async => [])],
        child: const MaterialApp(home: ReportLostHorseScreen()),
      ),
    );
    await tester.pumpAndSettle();

    // Age multi-select ('Даага' is unique to the age chips)
    await tester.ensureVisible(find.text('Даага'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Даага'));
    await tester.pump();
    expect(
      tester
          .widget<FilterChip>(
            find.ancestor(
              of: find.text('Даага'),
              matching: find.byType(FilterChip),
            ),
          )
          .selected,
      isTrue,
    );

    // Direction pills are single-select (scroll into view — the grouped
    // identity cards place direction below the fold)
    await tester.ensureVisible(find.text('Баруун хойд'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Баруун хойд'));
    await tester.pump();
    expect(find.text('Баруун хойд'), findsOneWidget);
  });
}
