import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/core/widgets/widgets.dart';
import 'package:tamga/src/features/races/application/race_providers.dart';
import 'package:tamga/src/features/races/domain/race.dart';
import 'package:tamga/src/features/races/presentation/race_list_screen.dart';
import 'package:tamga/src/features/races/presentation/race_detail_screen.dart';
import '../../../helpers/test_helpers.dart';

// ── Helper to create a ProviderScope wrapper ────────────────────────

/// Creates a [ProviderScope] wrapping the screen under test.
///
/// Overrides [racesProvider] with the provided [races] list, or simulates
/// loading/error states.
Widget createRaceListScreen({List<Race>? races, bool simulateError = false}) {
  if (simulateError) {
    return ProviderScope(
      overrides: [
        racesProvider.overrideWith((ref) async {
          throw Exception('Test network error');
        }),
      ],
      child: MaterialApp(theme: AppTheme.light(), home: const RaceListScreen()),
    );
  }

  return ProviderScope(
    overrides: [
      racesProvider.overrideWith((ref) async {
        return races ?? [];
      }),
    ],
    child: MaterialApp(theme: AppTheme.light(), home: const RaceListScreen()),
  );
}

void main() {
  group('RaceListScreen', () {
    // ════════════════════════════════════════════════════════════
    // VAL-RACE-034: Race list has loading state
    // ════════════════════════════════════════════════════════════
    testWidgets('shows centered CircularProgressIndicator while loading', (
      tester,
    ) async {
      // Use a Completer to keep the provider in loading state
      final completer = Completer<List<Race>>();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [racesProvider.overrideWith((ref) => completer.future)],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const RaceListScreen(),
          ),
        ),
      );

      await tester.pump();

      // Should show loading indicator
      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      // Complete the future to clean up
      completer.complete([]);
    });

    // ════════════════════════════════════════════════════════════
    // VAL-RACE-035: Error state at list level
    // ════════════════════════════════════════════════════════════
    testWidgets('shows TamgaErrorWidget with retry on error', (tester) async {
      await tester.pumpWidget(createRaceListScreen(simulateError: true));

      // Allow the error to propagate
      await tester.pumpAndSettle();

      // Verify TamgaErrorWidget is shown
      expect(find.byType(TamgaErrorWidget), findsOneWidget);

      // Verify the error message
      expect(find.text('Уралдаан ачаалахад алдаа гарлаа'), findsOneWidget);

      // Verify retry button exists
      expect(find.text('Дахин оролдох / Retry'), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════
    // VAL-RACE-033: Race has empty state
    // ════════════════════════════════════════════════════════════
    testWidgets('shows empty state when no races exist', (tester) async {
      await tester.pumpWidget(createRaceListScreen(races: []));

      // Allow the data to render
      await tester.pumpAndSettle();

      // Verify empty state message
      expect(find.text('Уралдаан байхгүй байна'), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════
    // VAL-RACE-019: Race list screen shows upcoming and past races
    // ════════════════════════════════════════════════════════════
    testWidgets('shows upcoming and past tabs', (tester) async {
      final now = DateTime.now();
      final races = <Race>[
        createMockRace(
          id: 'r1',
          name: 'Upcoming Race',
          status: RaceStatus.upcoming,
          date: now.add(const Duration(days: 7)),
        ),
        createMockRace(
          id: 'r2',
          name: 'Past Race',
          status: RaceStatus.completed,
          date: now.subtract(const Duration(days: 7)),
        ),
      ];

      await tester.pumpWidget(createRaceListScreen(races: races));
      await tester.pumpAndSettle();

      // Verify tabs exist
      expect(find.text('Удахгүй'), findsWidgets);
      expect(find.text('Дууссан'), findsWidgets);

      // Verify the upcoming race name is visible on first tab
      expect(find.text('Upcoming Race'), findsOneWidget);

      // Switch to past tab
      await tester.tap(find.text('Дууссан').last);
      await tester.pumpAndSettle();

      // Verify the past race name is visible
      expect(find.text('Past Race'), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════
    // VAL-RACE-020: Race list screen filter by type
    // ════════════════════════════════════════════════════════════
    testWidgets('filter chips show and filter by type', (tester) async {
      final now = DateTime.now();
      final races = <Race>[
        createMockRace(
          id: 'r1',
          name: 'Naadam Race',
          type: RaceType.naadam,
          status: RaceStatus.upcoming,
          date: now.add(const Duration(days: 7)),
        ),
        createMockRace(
          id: 'r2',
          name: 'Local Race',
          type: RaceType.local,
          status: RaceStatus.upcoming,
          date: now.add(const Duration(days: 7)),
        ),
      ];

      await tester.pumpWidget(createRaceListScreen(races: races));
      await tester.pumpAndSettle();

      // Verify filter chips exist
      expect(find.text('Бүгд'), findsOneWidget);
      expect(find.text('Наадам'), findsOneWidget);
      expect(find.text('Бүс'), findsOneWidget);
      expect(find.text('Орон нутгийн'), findsOneWidget);

      // Verify both races shown initially
      expect(find.text('Naadam Race'), findsOneWidget);
      expect(find.text('Local Race'), findsOneWidget);

      // Tap "Наадам" filter chip
      await tester.tap(find.text('Наадам'));
      await tester.pumpAndSettle();

      // Only naadam race should be shown
      expect(find.text('Naadam Race'), findsOneWidget);
      expect(find.text('Local Race'), findsNothing);
    });

    // ════════════════════════════════════════════════════════════
    // VAL-RACE-021: Race list screen navigation to detail
    // ════════════════════════════════════════════════════════════
    testWidgets('tapping a race navigates to detail screen', (tester) async {
      final now = DateTime.now();
      final races = <Race>[
        createMockRace(
          id: 'r1',
          name: 'Test Race',
          status: RaceStatus.upcoming,
          date: now.add(const Duration(days: 7)),
        ),
      ];

      await tester.pumpWidget(createRaceListScreen(races: races));
      await tester.pumpAndSettle();

      // Tap the race card
      await tester.tap(find.text('Test Race'));
      await tester.pumpAndSettle();

      // Verify we navigated to detail screen
      expect(find.byType(RaceDetailScreen), findsOneWidget);
    });
  });
}
