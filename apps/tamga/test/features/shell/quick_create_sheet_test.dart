import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:tamga/l10n/generated/app_localizations.dart';
import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/features/horses/application/horses_providers.dart';
import 'package:tamga/src/features/horses/domain/horse_record.dart';
import 'package:tamga/src/features/shell/presentation/quick_create_sheet.dart';

/// Marker screen rendering a unique text so navigation can be asserted.
class _MarkerScreen extends StatelessWidget {
  const _MarkerScreen({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Scaffold(body: Center(child: Text(text)));
  }
}

/// Home screen that can push the [QuickCreateSheet] route and proves we
/// returned to it after dismissing the sheet.
class _LauncherScreen extends StatelessWidget {
  const _LauncherScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('LAUNCHER'),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () =>
                  Navigator.push(context, QuickCreateSheetRoute.route()),
              child: const Text('Open quick create'),
            ),
          ],
        ),
      ),
    );
  }
}

GoRouter _buildRouter() {
  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(path: '/', builder: (_, _) => const _LauncherScreen()),
      GoRoute(
        path: '/market/create',
        builder: (_, _) => const _MarkerScreen(text: 'MARKET_CREATE'),
      ),
      GoRoute(
        path: '/lost-horse/report',
        builder: (_, _) => const _MarkerScreen(text: 'LOST_HORSE_REPORT'),
      ),
      GoRoute(
        path: '/events',
        builder: (_, _) => const _MarkerScreen(text: 'EVENTS'),
      ),
      GoRoute(
        path: '/payment',
        builder: (_, _) => const _MarkerScreen(text: 'PAYMENT'),
      ),
    ],
  );
}

Widget _buildApp({Locale locale = const Locale('en')}) {
  return ProviderScope(
    overrides: [
      // The horse editor (reached via the "Horses" action) reads this
      // provider for the sire/dam dropdowns.
      horsesProvider.overrideWith((_) async => <HorseRecord>[]),
    ],
    child: MaterialApp.router(
      locale: locale,
      theme: AppTheme.light(),
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      routerConfig: _buildRouter(),
    ),
  );
}

/// Pumps the app and opens the quick create sheet via the launcher button.
Future<void> _openSheet(WidgetTester tester) async {
  await tester.pumpWidget(_buildApp());
  await tester.pumpAndSettle();
  await tester.tap(find.text('Open quick create'));
  await tester.pumpAndSettle();
}

/// Tall viewport so the whole sheet content is laid out without scrolling.
void _useTallViewport(WidgetTester tester) {
  tester.view.physicalSize = const Size(800, 3200);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.reset);
}

void main() {
  group('QuickCreateSheet', () {
    testWidgets('opens as a bottom sheet with header and all five actions', (
      tester,
    ) async {
      _useTallViewport(tester);
      await _openSheet(tester);

      expect(find.text('Шинэ зүйл үүсгэх'), findsOneWidget);
      expect(find.text('Хурдан үүсгэх зүйлээ сонгоно уу'), findsOneWidget);

      // Primary (English) labels of all five action tiles.
      expect(find.text('Horses'), findsOneWidget);
      expect(find.text('Зар'), findsOneWidget);
      expect(find.text('Search'), findsOneWidget);
      // 'Race' also appears as a recent-activity chip label.
      expect(find.text('Race'), findsAtLeastNWidgets(1));
      expect(find.text('Subscription'), findsOneWidget);

      // Recent activity section is part of the sheet content.
      expect(find.text('Саяхан нэмсэн'), findsOneWidget);
      expect(find.text('0 морь бүртгэгдсэн'), findsOneWidget);
    });

    testWidgets('renders bilingual labels for the Mongolian locale', (
      tester,
    ) async {
      _useTallViewport(tester);

      await tester.pumpWidget(_buildApp(locale: const Locale('mn')));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Open quick create'));
      await tester.pumpAndSettle();

      // Mongolian primary labels.
      expect(find.text('Морьд'), findsOneWidget);
      expect(find.text('Зар'), findsOneWidget);
      expect(find.text('Морь хайх'), findsOneWidget);
      // 'Уралдаан' also appears as a recent-activity chip label.
      expect(find.text('Уралдаан'), findsAtLeastNWidgets(1));
      expect(find.text('Захиалгын багц'), findsOneWidget);

      // English secondary labels stay visible next to the Mongolian ones.
      expect(find.text('Add Horse'), findsOneWidget);
      expect(find.text('Market Listing'), findsOneWidget);
      expect(find.text('Report Lost Horse'), findsOneWidget);
      expect(find.text('Add Event'), findsOneWidget);
      expect(find.text('Payment'), findsOneWidget);
    });

    testWidgets('tapping the Зар action navigates to the market create route', (
      tester,
    ) async {
      _useTallViewport(tester);
      await _openSheet(tester);

      await tester.tap(find.text('Зар'));
      await tester.pumpAndSettle();

      expect(find.text('MARKET_CREATE'), findsOneWidget);
    });

    testWidgets(
      'Horses action opens the horse form; Save validates and Cancel closes',
      (tester) async {
        _useTallViewport(tester);
        await _openSheet(tester);

        // The horse tile label is 'Horses' in the EN locale.
        await tester.tap(find.text('Horses'));
        await tester.pumpAndSettle();

        // Form fields are present.
        expect(find.text('Морь нэмэх'), findsOneWidget);
        expect(find.text('Нэр'), findsOneWidget);
        expect(find.text('Зүс'), findsOneWidget);
        expect(find.text('Save'), findsOneWidget);
        expect(find.text('Cancel'), findsOneWidget);

        // Submitting an empty form shows the validation toast. The form is
        // taller than the half-height sheet, so expand it to full screen first.
        await tester.drag(find.text('Морь нэмэх'), const Offset(0, -2000));
        await tester.pumpAndSettle();
        await tester.ensureVisible(find.text('Save'));
        await tester.pumpAndSettle();
        await tester.tap(find.text('Save'));
        await tester.pump();
        expect(
          find.text('Шаардлагатай талбаруудыг бөглөнө үү.'),
          findsOneWidget,
        );

        // Cancel pops the form back to the launcher.
        await tester.ensureVisible(find.text('Cancel'));
        await tester.pumpAndSettle();
        await tester.tap(find.text('Cancel'));
        await tester.pumpAndSettle();

        expect(find.text('LAUNCHER'), findsOneWidget);
        expect(find.text('Морь нэмэх'), findsNothing);
      },
    );

    testWidgets('tapping the barrier dismisses the sheet', (tester) async {
      _useTallViewport(tester);
      await _openSheet(tester);
      expect(find.text('Шинэ зүйл үүсгэх'), findsOneWidget);

      // Top-left corner is over the modal barrier (sheet is bottom-anchored).
      await tester.tapAt(const Offset(20, 20));
      await tester.pumpAndSettle();

      expect(find.text('Шинэ зүйл үүсгэх'), findsNothing);
      expect(find.text('LAUNCHER'), findsOneWidget);
    });
  });
}
