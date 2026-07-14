import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/theme/design_tokens.dart';
import 'package:tamga/src/core/widgets/widgets.dart';

void main() {
  group('TamgaToast', () {
    Widget buildApp({required void Function(BuildContext) onPress}) {
      return MaterialApp(
        theme: ThemeData(extensions: const [TamgaColors.light]),
        home: Scaffold(
          body: Builder(
            builder: (context) => ElevatedButton(
              onPressed: () => onPress(context),
              child: const Text('Show'),
            ),
          ),
        ),
      );
    }

    testWidgets('show displays message text', (tester) async {
      await tester.pumpWidget(
        buildApp(onPress: (ctx) => TamgaToast.show(ctx, 'Test message')),
      );

      // Tap button to show toast
      await tester.tap(find.text('Show'));
      await tester.pump(const Duration(milliseconds: 200));

      // Toast should be visible
      expect(find.text('Test message'), findsOneWidget);
    });

    testWidgets('showError displays error toast', (tester) async {
      await tester.pumpWidget(
        buildApp(onPress: (ctx) => TamgaToast.showError(ctx, 'Error occurred')),
      );

      // Tap button to show error toast
      await tester.tap(find.text('Show'));
      await tester.pump(const Duration(milliseconds: 200));

      expect(find.text('Error occurred'), findsOneWidget);
    });

    testWidgets('showSuccess displays success toast', (tester) async {
      await tester.pumpWidget(
        buildApp(onPress: (ctx) => TamgaToast.showSuccess(ctx, 'Success!')),
      );

      // Tap button to show success toast
      await tester.tap(find.text('Show'));
      await tester.pump(const Duration(milliseconds: 200));

      expect(find.text('Success!'), findsOneWidget);
    });
  });
}
