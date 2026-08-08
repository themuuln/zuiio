import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:tamga/l10n/generated/app_localizations.dart';
import 'package:tamga/src/features/shared/data/pagination/pagination_state.dart';
import 'package:tamga/src/features/horses/application/horses_providers.dart';
import 'package:tamga/src/features/horses/domain/horse_record.dart';
import 'package:tamga/src/features/horses/presentation/horses_screen.dart';
import 'package:tamga/src/core/theme/tamga_design_system.dart';

/// Creates a PaginationNotifier that immediately starts in an error state.
class _ErrorPaginationNotifier extends PaginationNotifier<HorseRecord> {
  _ErrorPaginationNotifier()
    : super(
        fetchPage: (_, _) async => throw UnimplementedError(),
        pageSize: 20,
      ) {
    state = PaginationState<HorseRecord>(
      error: 'Test network error',
      isLoading: false,
      hasMore: false,
    );
  }
}

/// Creates a PaginationNotifier that starts in a loading state with no items.
class _LoadingHorsesNotifier extends PaginationNotifier<HorseRecord> {
  _LoadingHorsesNotifier()
    : super(
        fetchPage: (_, _) async => throw UnimplementedError(),
        pageSize: 20,
      ) {
    state = const PaginationState<HorseRecord>(
      isLoading: true,
      items: [],
      hasMore: true,
    );
  }
}

void main() {
  group('HorsesScreen pagination states', () {
    testWidgets('shows centered loading indicator on first page load', (
      tester,
    ) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            paginatedHorsesProvider.overrideWith(
              (ref) => _LoadingHorsesNotifier(),
            ),
          ],
          child: MaterialApp(
            locale: const Locale('mn'),
            localizationsDelegates: AppLocalizations.localizationsDelegates,
            supportedLocales: AppLocalizations.supportedLocales,
            theme: TamgaDesignSystem.buildThemeData(Brightness.light),
            home: Scaffold(body: const HorsesScreen()),
          ),
        ),
      );

      // Pump to let the widget build
      await tester.pump();

      // Verify centered CircularProgressIndicator is shown
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('shows error card with retry when pagination fails', (
      tester,
    ) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            paginatedHorsesProvider.overrideWith(
              (ref) => _ErrorPaginationNotifier(),
            ),
          ],
          child: MaterialApp(
            locale: const Locale('mn'),
            localizationsDelegates: AppLocalizations.localizationsDelegates,
            supportedLocales: AppLocalizations.supportedLocales,
            theme: TamgaDesignSystem.buildThemeData(Brightness.light),
            home: Scaffold(body: const HorsesScreen()),
          ),
        ),
      );

      // Allow the widget tree to settle
      await tester.pumpAndSettle();

      // Verify error message is displayed
      expect(find.text('Ачаалахад алдаа гарлаа'), findsOneWidget);
      expect(find.text('Failed to load'), findsOneWidget);

      // Verify retry button is displayed
      expect(find.text('Дахин оролдох'), findsOneWidget);
    });
  });
}
