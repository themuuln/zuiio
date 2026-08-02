import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/features/shared/data/pagination/pagination_state.dart';
import 'package:tamga/src/features/horses/application/horses_providers.dart';
import 'package:tamga/src/features/horses/domain/horse_record.dart';
import 'package:tamga/src/features/market/application/market_providers.dart';
import 'package:tamga/src/features/horses/presentation/horse_empty_states.dart';
import 'package:tamga/src/features/horses/presentation/horses_screen.dart';

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

/// Creates a pagination notifier with a loaded, finite page.
class _LoadedHorsesNotifier extends PaginationNotifier<HorseRecord> {
  _LoadedHorsesNotifier(List<HorseRecord> items)
    : super(fetchPage: (_, _) async => items, pageSize: 20) {
    state = PaginationState<HorseRecord>(
      items: items,
      isLoading: false,
      hasMore: false,
      currentPage: 1,
    );
  }
}

HorseRecord _horse({
  required String id,
  required String name,
  required bool household,
  required String coat,
  required int birthYear,
  String? region,
}) {
  final now = DateTime(2026, 8, 1);
  return HorseRecord(
    id: id,
    name: name,
    gender: HorseGender.mare,
    coat: coat,
    birthYear: birthYear,
    region: region,
    isOwnedByHousehold: household,
    createdAt: now,
    updatedAt: now,
  );
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
            theme: AppTheme.light(),
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
            theme: AppTheme.light(),
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

    testWidgets('shows summary, search, and horse rows for loaded data', (
      tester,
    ) async {
      final horses = [
        _horse(
          id: 'horse-1',
          name: 'Хан Хүлэг',
          household: true,
          coat: 'Хээр',
          birthYear: 2019,
          region: 'Төв',
        ),
        _horse(
          id: 'horse-2',
          name: 'Цагаан Салхи',
          household: false,
          coat: 'Цагаан',
          birthYear: 2021,
          region: 'Архангай',
        ),
      ];

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            paginatedHorsesProvider.overrideWith(
              (ref) => _LoadedHorsesNotifier(horses),
            ),
            horsesProvider.overrideWith((ref) async => horses),
            digitalCertificateProvider.overrideWith(
              (ref, horseId) async => null,
            ),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: Scaffold(body: const HorsesScreen()),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Таны сүрэг'), findsOneWidget);
      expect(find.byType(TextField), findsOneWidget);
      expect(find.text('Хан Хүлэг'), findsOneWidget);
      expect(find.text('Цагаан Салхи'), findsOneWidget);

      await tester.enterText(find.byType(TextField), 'Төв');
      await tester.pump();

      expect(find.text('Хан Хүлэг'), findsOneWidget);
      expect(find.text('Цагаан Салхи'), findsNothing);

      await tester.enterText(find.byType(TextField), '');
      await tester.pump();

      final externalFilter = find.byKey(
        const ValueKey('horse_filter_external'),
      );
      expect(externalFilter, findsOneWidget);
      expect(tester.getSize(externalFilter).height, greaterThanOrEqualTo(44));

      await tester.tap(externalFilter);
      await tester.pump();

      expect(find.text('Хан Хүлэг'), findsNothing);
      expect(find.text('Цагаан Салхи'), findsOneWidget);
    });

    testWidgets('empty state uses the screen add-horse callback', (
      tester,
    ) async {
      var didTap = false;

      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          home: EmptyHorsesState(onAddHorse: () => didTap = true),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.text('Морь нэмэх'));

      expect(didTap, isTrue);
    });
  });
}
