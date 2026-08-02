import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/features/shell/presentation/fab_menu.dart';

/// Marker screen rendering a unique text so navigation can be asserted.
class _MarkerScreen extends StatelessWidget {
  const _MarkerScreen({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Scaffold(body: Center(child: Text(text)));
  }
}

/// Builds a GoRouter with a home at '/' and marker routes for the FAB actions.
GoRouter _buildRouter({required Widget home}) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(path: '/', builder: (_, _) => home),
      GoRoute(
        path: '/market/create',
        builder: (_, _) => const _MarkerScreen(text: 'MARKET_CREATE'),
      ),
      GoRoute(
        path: '/events',
        builder: (_, _) => const _MarkerScreen(text: 'EVENTS'),
      ),
      GoRoute(
        path: '/breeding',
        builder: (_, _) => const _MarkerScreen(text: 'BREEDING'),
      ),
      GoRoute(
        path: '/lost-horse/report',
        builder: (_, _) => const _MarkerScreen(text: 'LOST_HORSE_REPORT'),
      ),
      GoRoute(
        path: '/payment',
        builder: (_, _) => const _MarkerScreen(text: 'PAYMENT'),
      ),
    ],
  );
}

Widget _buildApp({required Widget home}) {
  return MaterialApp.router(
    theme: AppTheme.light(),
    routerConfig: _buildRouter(home: home),
  );
}

void main() {
  group('FabMenu', () {
    testWidgets('renders collapsed with only the main FAB visible', (
      tester,
    ) async {
      await tester.pumpWidget(_buildApp(home: const Scaffold(body: FabMenu())));
      await tester.pumpAndSettle();

      expect(find.byType(FloatingActionButton), findsOneWidget);
      // Menu labels stay in the tree (needed for the stagger-in animation)
      // but their own Opacity widget must be 0 until the FAB is tapped.
      Opacity labelOpacity(String label) => tester.widget<Opacity>(
        find
            .ancestor(of: find.text(label), matching: find.byType(Opacity))
            .first,
      );
      expect(labelOpacity('Зар нэмэх').opacity, 0.0);
      expect(labelOpacity('Төлбөр').opacity, 0.0);
    });

    testWidgets('tapping the FAB expands and shows all five action labels', (
      tester,
    ) async {
      await tester.pumpWidget(_buildApp(home: const Scaffold(body: FabMenu())));
      await tester.pumpAndSettle();

      await tester.tap(find.byType(FloatingActionButton));
      await tester.pumpAndSettle();

      for (final label in [
        'Зар нэмэх',
        'Уралдаан',
        'Үржүүлэлт',
        'Алдсан морь',
        'Төлбөр',
      ]) {
        expect(find.text(label), findsOneWidget);
      }
    });

    testWidgets('tapping an action navigates to its route', (tester) async {
      await tester.pumpWidget(_buildApp(home: const Scaffold(body: FabMenu())));
      await tester.pumpAndSettle();

      await tester.tap(find.byType(FloatingActionButton));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Алдсан морь'));
      await tester.pumpAndSettle();

      expect(find.text('LOST_HORSE_REPORT'), findsOneWidget);
    });

    testWidgets('tapping the backdrop collapses the menu', (tester) async {
      await tester.pumpWidget(_buildApp(home: const Scaffold(body: FabMenu())));
      await tester.pumpAndSettle();

      await tester.tap(find.byType(FloatingActionButton));
      await tester.pumpAndSettle();
      Opacity labelOpacity(String label) => tester.widget<Opacity>(
        find
            .ancestor(of: find.text(label), matching: find.byType(Opacity))
            .first,
      );
      expect(labelOpacity('Зар нэмэх').opacity, 1.0);

      // Tap the backdrop (top-left, away from the fan-out items).
      await tester.tapAt(const Offset(20, 20));
      await tester.pumpAndSettle();

      expect(labelOpacity('Зар нэмэх').opacity, 0.0);
    });
  });
}
