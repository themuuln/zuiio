import 'dart:ui' show SemanticsAction, Tristate;

import 'package:flutter/material.dart';

import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/core/widgets/tamga_choice_pill.dart';

void main() {
  testWidgets('exposes selected state and a 44dp touch target', (tester) async {
    var tapped = false;

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light(),
        home: Scaffold(
          body: TamgaChoicePill(
            label: 'Адуу',
            selected: true,
            onTap: () => tapped = true,
          ),
        ),
      ),
    );
    await tester.pump();

    final node = tester.getSemantics(find.byType(TamgaChoicePill));
    expect(node.flagsCollection.isButton, isTrue);
    expect(node.flagsCollection.isSelected, Tristate.isTrue);
    expect(node.getSemanticsData().hasAction(SemanticsAction.tap), isTrue);
    expect(node.label, 'Адуу');
    expect(tester.getSize(find.byType(TamgaChoicePill)).height, 44);

    await tester.tap(find.byType(TamgaChoicePill));
    expect(tapped, isTrue);
  });
}
