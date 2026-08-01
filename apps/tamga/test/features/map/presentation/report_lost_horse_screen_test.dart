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

    await tester.tap(find.text('Үргэлжлүүлэх / Continue'));
    await tester.pump();

    expect(find.textContaining('таних мэдээллээс'), findsOneWidget);
  });
}
