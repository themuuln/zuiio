import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/core/widgets/loading_state.dart';

void main() {
  group('SkeletonLoader layout', () {
    testWidgets('renders content without a nested vertical viewport', (
      tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          home: CustomScrollView(
            slivers: [
              SliverList.list(
                children: [
                  SkeletonLoader(
                    items: 2,
                    itemBuilder: (_, _) => const SizedBox(height: 40),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
      await tester.pump();

      expect(tester.takeException(), isNull);
      expect(find.byType(ListView), findsNothing);
    });

    testWidgets('keeps a standalone loader scrollable when constrained', (
      tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          home: Scaffold(
            body: SizedBox(
              height: 200,
              child: SkeletonLoader(
                items: 2,
                itemBuilder: (_, _) => const SizedBox(height: 40),
              ),
            ),
          ),
        ),
      );
      await tester.pump();

      expect(tester.takeException(), isNull);
      expect(find.byType(ListView), findsOneWidget);
    });
  });
}
