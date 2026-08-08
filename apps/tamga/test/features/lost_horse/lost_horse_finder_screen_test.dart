import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:tamga/l10n/generated/app_localizations.dart';
import 'package:tamga/src/features/lost_horse/presentation/lost_horse_finder_screen.dart';
import 'package:tamga/src/core/theme/tamga_design_system.dart';

void main() {
  group('LostHorseFinderScreen', () {
    testWidgets('renders title and tabs', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            locale: const Locale('mn'),
            localizationsDelegates: AppLocalizations.localizationsDelegates,
            supportedLocales: AppLocalizations.supportedLocales,
            theme: TamgaDesignSystem.buildThemeData(Brightness.light),
            home: const LostHorseFinderScreen(),
          ),
        ),
      );

      // Verify the app bar title
      expect(find.text('Эрэл хайгуул'), findsOneWidget);

      // Verify tab labels
      expect(find.text('Жагсаалт'), findsOneWidget);
      expect(find.text('Газрын зураг'), findsOneWidget);
    });

    testWidgets('renders FAB with correct label', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            locale: const Locale('mn'),
            localizationsDelegates: AppLocalizations.localizationsDelegates,
            supportedLocales: AppLocalizations.supportedLocales,
            theme: TamgaDesignSystem.buildThemeData(Brightness.light),
            home: const LostHorseFinderScreen(),
          ),
        ),
      );

      // Verify the FAB label
      expect(find.text('Хаяж морь бүртгэх'), findsOneWidget);
    });

    testWidgets('renders tab icons', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            locale: const Locale('mn'),
            localizationsDelegates: AppLocalizations.localizationsDelegates,
            supportedLocales: AppLocalizations.supportedLocales,
            theme: TamgaDesignSystem.buildThemeData(Brightness.light),
            home: const LostHorseFinderScreen(),
          ),
        ),
      );

      // Verify tab icons are present
      expect(find.byIcon(Icons.list_alt), findsOneWidget);
      expect(find.byIcon(Icons.map_outlined), findsOneWidget);
    });

    testWidgets('shows premium upgrade button in app bar', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            locale: const Locale('mn'),
            localizationsDelegates: AppLocalizations.localizationsDelegates,
            supportedLocales: AppLocalizations.supportedLocales,
            theme: TamgaDesignSystem.buildThemeData(Brightness.light),
            home: const LostHorseFinderScreen(),
          ),
        ),
      );

      // Verify premium icon button
      expect(find.byIcon(Icons.workspace_premium_outlined), findsOneWidget);
    });
  });
}
