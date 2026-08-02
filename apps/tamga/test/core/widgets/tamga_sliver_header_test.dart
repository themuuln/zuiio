import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/core/widgets/tamga_sliver_header.dart';

void main() {
  testWidgets('renders title, subtitle, and action in a sliver layout', (
    tester,
  ) async {
    var actionPressed = false;

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light(),
        home: CustomScrollView(
          slivers: [
            TamgaSliverHeader(
              title: 'Зах',
              subtitle: 'Морь, малын зарууд',
              actions: [
                IconButton(
                  onPressed: () => actionPressed = true,
                  icon: const Icon(Icons.favorite_border),
                ),
              ],
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 400)),
          ],
        ),
      ),
    );
    await tester.pump();

    expect(tester.takeException(), isNull);
    expect(find.byType(SliverAppBar), findsOneWidget);
    expect(find.text('Зах'), findsOneWidget);
    expect(find.text('Морь, малын зарууд'), findsOneWidget);
    expect(find.byIcon(Icons.favorite_border), findsOneWidget);

    await tester.tap(find.byIcon(Icons.favorite_border));
    expect(actionPressed, isTrue);
  });

  testWidgets('keeps a standard-height toolbar without a subtitle', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light(),
        home: const CustomScrollView(
          slivers: [
            TamgaSliverHeader(title: 'Угшил'),
            SliverToBoxAdapter(child: SizedBox(height: 400)),
          ],
        ),
      ),
    );
    await tester.pump();

    expect(tester.takeException(), isNull);
    expect(find.text('Угшил'), findsOneWidget);
    expect(find.byType(SliverAppBar), findsOneWidget);
  });
}
