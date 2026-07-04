import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:tamga/main.dart';

void main() {
  // SKIP: Requires full Supabase/Isar integration setup — run as integration test
  testWidgets('renders lineage shell and thin feature tabs', skip: true, (
    WidgetTester tester,
  ) async {
    Future<void> pumpView() async {
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));
      await tester.pump(const Duration(milliseconds: 300));
      await tester.pump(const Duration(milliseconds: 300));
    }

    SharedPreferences.setMockInitialValues({
      'onboarding.data': '{"isCompleted":true}',
    });
    await tester.pumpWidget(const ProviderScope(child: TamgaApp()));
    await pumpView();

    expect(find.text('Tamga'), findsWidgets);
    expect(find.text('Өрхийн удам мод'), findsOneWidget);
    expect(find.text('Морьд'), findsOneWidget);
    expect(find.text('Уралдаан'), findsOneWidget);
    expect(find.text('Зах'), findsOneWidget);
    expect(find.text('Профайл'), findsOneWidget);

    await tester.tap(find.text('Морьд'));
    await pumpView();
    expect(find.text('Морьдын бүртгэл'), findsOneWidget);
    expect(find.byTooltip('Морь нэмэх'), findsOneWidget);
    expect(
      find.text(
        'Thin local-first registry. Lineage, events, search feature-үүд энэ жагсаалтыг дахин ашиглана.',
      ),
      findsOneWidget,
    );

    await tester.tap(find.text('Уралдаан'));
    await pumpView();
    expect(find.text('Уралдааны feed'), findsOneWidget);
    expect(find.byTooltip('Event нэмэх'), findsOneWidget);
    expect(
      find.text(
        'Thin events module нь local-first award timeline болон upcoming preview-ийг нэг жагсаалтад авчирна.',
      ),
      findsOneWidget,
    );

    await tester.tap(find.text('Зах'));
    await pumpView();
    expect(find.text('Итгэлцэлтэй адууны худалдаа'), findsOneWidget);
    expect(find.byTooltip('Зар нэмэх'), findsOneWidget);
    await tester.drag(
      find.byType(CustomScrollView).last,
      const Offset(0, -500),
    );
    await pumpView();
    expect(find.text('Шандас Гал - trade санал сонсоно'), findsOneWidget);
    expect(find.textContaining('Trust'), findsWidgets);

    await tester.tap(find.text('Профайл'));
    await pumpView();
    expect(find.text('Өрхийн профайл'), findsOneWidget);
  });
}
