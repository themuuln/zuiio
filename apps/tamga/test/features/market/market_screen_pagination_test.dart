import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';

import 'package:tamga/l10n/generated/app_localizations.dart';
import 'package:tamga/src/features/market/application/market_providers.dart';
import 'package:tamga/src/features/market/data/market_repository.dart';
import 'package:tamga/src/features/market/presentation/market_screen.dart';
import 'package:tamga/src/features/horses/application/horses_providers.dart';
import 'package:tamga/src/features/horses/domain/horse_record.dart';
import 'package:tamga/src/features/events/application/events_providers.dart';
import 'package:tamga/src/shared/domain/event.dart';
import 'package:tamga/src/core/theme/tamga_design_system.dart';

/// A mock [MarketRepository] that throws on any method call.
class _MockMarketRepository extends Mock implements MarketRepository {}

/// A [MarketCatalogNotifier] that starts in a loading state with no items.
class _LoadingMarketNotifier extends MarketCatalogNotifier {
  _LoadingMarketNotifier()
    : super(repository: _MockMarketRepository(), pageSize: 20) {
    state = const MarketCatalogPaginationState(isLoading: true);
  }
}

void main() {
  group('MarketScreen pagination states', () {
    testWidgets('shows centered loading indicator on first page load', (
      tester,
    ) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            paginatedMarketCatalogProvider.overrideWith(
              (ref) => _LoadingMarketNotifier(),
            ),
            marketFiltersProvider.overrideWith((ref) => const MarketFilters()),
            horsesProvider.overrideWith((ref) => <HorseRecord>[]),
            eventsProvider.overrideWith((ref) => <Event>[]),
            favoriteListingIdsProvider.overrideWith((ref) => <String>[]),
          ],
          child: MaterialApp(
            locale: const Locale('mn'),
            localizationsDelegates: AppLocalizations.localizationsDelegates,
            supportedLocales: AppLocalizations.supportedLocales,
            theme: TamgaDesignSystem.buildThemeData(Brightness.light),
            home: const MarketScreen(),
          ),
        ),
      );

      // Pump to let the widget build
      await tester.pump();

      // Verify centered CircularProgressIndicator is shown
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });
  });
}
