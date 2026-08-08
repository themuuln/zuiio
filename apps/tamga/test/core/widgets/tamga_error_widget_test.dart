import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/widgets/tamga_error_widget.dart';
import 'package:tamga/l10n/generated/app_localizations.dart';
import 'package:tamga/src/core/theme/tamga_design_system.dart';

/// Wraps the given widget in a MaterialApp with proper Tamga theme.
Widget wrapInApp(Widget widget) {
  return MaterialApp(
    locale: const Locale('mn'),
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    theme: TamgaDesignSystem.buildThemeData(Brightness.light),
    home: widget,
  );
}

/// TamgaErrorWidget-ийн widget тестүүд.
///
/// Баталгаажуулах зүйлс:
/// - Стандарт bilingual мессеж харуулна
/// - Хэрэглэгчийн мессеж дамжуулж болно
/// - Retry товч зөв ажиллана
/// - Stack trace харагдахгүй
/// - App-ийн theme-ийг ашиглана
void main() {
  group('TamgaErrorWidget', () {
    testWidgets(
      'shows default bilingual error message without custom message',
      (WidgetTester tester) async {
        await tester.pumpWidget(wrapInApp(const TamgaErrorWidget()));

        // Default bilingual message should be visible (combined in one string)
        // Default error message should be visible
        expect(find.textContaining('Алдаа гарлаа'), findsOneWidget);
        // Subtitle explanation should be visible
        expect(find.textContaining('Уучлаарай'), findsOneWidget);
        expect(find.textContaining('unexpected error'), findsOneWidget);

        // Error icon should be visible
        expect(find.byIcon(Icons.error_outline_rounded), findsOneWidget);

        // Stack trace should NOT be visible
        expect(find.textContaining('ErrorWidget'), findsNothing);
        expect(find.textContaining('Stack trace'), findsNothing);
        expect(find.textContaining('Exception'), findsNothing);
      },
    );

    testWidgets('shows custom message when provided', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        wrapInApp(const TamgaErrorWidget(message: 'Custom error message')),
      );

      expect(find.text('Custom error message'), findsOneWidget);
    });

    testWidgets('shows retry button when onRetry is provided', (
      WidgetTester tester,
    ) async {
      var retryCalled = false;

      await tester.pumpWidget(
        wrapInApp(TamgaErrorWidget(onRetry: () => retryCalled = true)),
      );

      // Retry button should be visible with bilingual text
      expect(find.text('Дахин оролдох / Retry'), findsOneWidget);
      expect(find.byIcon(Icons.refresh_rounded), findsOneWidget);

      // Tap the retry button
      await tester.tap(find.text('Дахин оролдох / Retry'));
      expect(retryCalled, isTrue);
    });

    testWidgets('hides retry button when onRetry is null', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(wrapInApp(const TamgaErrorWidget()));

      // Retry button should NOT be visible
      expect(find.text('Дахин оролдох / Retry'), findsNothing);
      expect(find.byIcon(Icons.refresh_rounded), findsNothing);
    });

    testWidgets('renders with Column layout', (WidgetTester tester) async {
      await tester.pumpWidget(wrapInApp(const TamgaErrorWidget()));

      // Should have a Column layout for proper vertical arrangement
      expect(find.byType(Column), findsOneWidget);
    });

    testWidgets('shows subtitle explanation without stack traces', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(wrapInApp(const TamgaErrorWidget()));

      // Subtitle should explain the error in a user-friendly way
      expect(
        find.textContaining('Уучлаарай, гэнэтийн алдаа гарлаа'),
        findsOneWidget,
      );
      expect(
        find.textContaining('Sorry, an unexpected error occurred'),
        findsOneWidget,
      );
    });

    testWidgets('retry button has refresh icon', (WidgetTester tester) async {
      await tester.pumpWidget(wrapInApp(TamgaErrorWidget(onRetry: () {})));

      // The retry button icon should be visible
      expect(find.byIcon(Icons.refresh_rounded), findsOneWidget);
    });
  });
}
