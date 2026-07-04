import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/features/shared/data/pagination/pagination_state.dart';
import 'package:tamga/src/features/events/application/events_providers.dart';
import 'package:tamga/src/shared/domain/event.dart';
import 'package:tamga/src/features/events/presentation/events_screen.dart';

/// Creates a PaginationNotifier that immediately starts in an error state.
class _ErrorEventsNotifier extends PaginationNotifier<Event> {
  _ErrorEventsNotifier()
    : super(
        fetchPage: (_, _) async => throw UnimplementedError(),
        pageSize: 20,
      ) {
    state = PaginationState<Event>(
      error: 'Test network error',
      isLoading: false,
      hasMore: false,
    );
  }
}

/// Creates a PaginationNotifier that starts in a loading state with no items.
class _LoadingEventsNotifier extends PaginationNotifier<Event> {
  _LoadingEventsNotifier()
    : super(
        fetchPage: (_, _) async => throw UnimplementedError(),
        pageSize: 20,
      ) {
    state = const PaginationState<Event>(
      isLoading: true,
      items: [],
      hasMore: true,
    );
  }
}

void main() {
  group('EventsScreen pagination states', () {
    testWidgets('shows centered loading indicator on first page load', (
      tester,
    ) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            paginatedEventsProvider.overrideWith(
              (ref) => _LoadingEventsNotifier(),
            ),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const Scaffold(body: EventsScreen()),
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
            paginatedEventsProvider.overrideWith(
              (ref) => _ErrorEventsNotifier(),
            ),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const Scaffold(body: EventsScreen()),
          ),
        ),
      );

      // Allow the widget tree to settle
      await tester.pumpAndSettle();

      // Verify error message is displayed
      expect(find.text('Ачаалахад алдаа гарлаа'), findsOneWidget);

      // Verify retry button is displayed (TamgaErrorWidget uses bilingual label)
      expect(find.text('Дахин оролдох / Retry'), findsOneWidget);
    });
  });
}
