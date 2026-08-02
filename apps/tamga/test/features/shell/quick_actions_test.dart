import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/features/shell/presentation/quick_actions.dart';

/// Marker screen rendering a unique text so navigation can be asserted.
class _MarkerScreen extends StatelessWidget {
  const _MarkerScreen({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Scaffold(body: Center(child: Text(text)));
  }
}

/// Builds a GoRouter with a home at '/' and marker routes for the actions.
GoRouter _buildRouter({required Widget home}) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(path: '/', builder: (_, _) => home),
      GoRoute(
        path: '/profile',
        builder: (_, _) => const _MarkerScreen(text: 'PROFILE'),
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
        path: '/market',
        builder: (_, _) => const _MarkerScreen(text: 'MARKET'),
      ),
      GoRoute(
        path: '/lineage',
        builder: (_, _) => const _MarkerScreen(text: 'LINEAGE'),
      ),
    ],
  );
}

Widget _buildApp({required String userRole}) {
  return MaterialApp.router(
    theme: AppTheme.light(),
    routerConfig: _buildRouter(
      home: Scaffold(body: QuickActions(userRole: userRole)),
    ),
  );
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  group('QuickActions', () {
    testWidgets('casual role renders header and two action cards', (
      tester,
    ) async {
      await tester.pumpWidget(_buildApp(userRole: 'casual'));
      await tester.pumpAndSettle();

      expect(find.text('Эхлэх үйлдлүүд'), findsOneWidget);
      expect(find.text('Морь нэмэх'), findsOneWidget);
      expect(find.text('Удам харах'), findsOneWidget);
    });

    testWidgets('breeder role renders three action cards', (tester) async {
      await tester.pumpWidget(_buildApp(userRole: 'breeder'));
      await tester.pumpAndSettle();

      expect(find.text('Морь нэмэх'), findsOneWidget);
      expect(find.text('Уралдаан нэмэх'), findsOneWidget);
      expect(find.text('Үржүүлэлт'), findsOneWidget);
    });

    testWidgets('stable role renders three action cards', (tester) async {
      await tester.pumpWidget(_buildApp(userRole: 'stable'));
      await tester.pumpAndSettle();

      expect(find.text('Морь нэмэх'), findsOneWidget);
      expect(find.text('Зах дээр зарах'), findsOneWidget);
      expect(find.text('Хэрэглэгч нэмэх'), findsOneWidget);
    });

    testWidgets('tapping an action card navigates to its route', (
      tester,
    ) async {
      await tester.pumpWidget(_buildApp(userRole: 'casual'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Удам харах'));
      await tester.pumpAndSettle();

      expect(find.text('LINEAGE'), findsOneWidget);
    });

    testWidgets(
      'dismissing hides the section and persists for future renders',
      (tester) async {
        await tester.pumpWidget(_buildApp(userRole: 'casual'));
        await tester.pumpAndSettle();
        expect(find.text('Эхлэх үйлдлүүд'), findsOneWidget);

        await tester.tap(find.byTooltip('Хаах'));
        await tester.pumpAndSettle();
        expect(find.text('Эхлэх үйлдлүүд'), findsNothing);

        // A fresh QuickActions build with the same preferences stays hidden.
        await tester.pumpWidget(_buildApp(userRole: 'casual'));
        await tester.pumpAndSettle();
        expect(find.text('Эхлэх үйлдлүүд'), findsNothing);
      },
    );
  });
}
