import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/core/widgets/widgets.dart';
import 'package:tamga/src/features/nutrition/application/nutrition_providers.dart';
import 'package:tamga/src/features/nutrition/domain/feed_schedule.dart';
import 'package:tamga/src/features/nutrition/presentation/feed_schedule_screen.dart';
import '../../../helpers/test_helpers.dart';

// ── Helpers ────────────────────────────────────────────────────────

Widget createFeedScheduleScreen({
  required String horseId,
  List<FeedSchedule>? schedules,
  bool simulateError = false,
}) {
  if (simulateError) {
    return ProviderScope(
      overrides: [
        feedSchedulesProvider(horseId).overrideWith((ref) async {
          throw Exception('Test network error');
        }),
      ],
      child: MaterialApp(
        theme: AppTheme.light(),
        home: FeedScheduleScreen(horseId: horseId),
      ),
    );
  }

  return ProviderScope(
    overrides: [
      feedSchedulesProvider(horseId).overrideWith((ref) async {
        return schedules ?? [];
      }),
    ],
    child: MaterialApp(
      theme: AppTheme.light(),
      home: FeedScheduleScreen(horseId: horseId),
    ),
  );
}

void main() {
  group('FeedScheduleScreen — VAL-NUTR-005', () {
    // ════════════════════════════════════════════════════════════════
    // Loading state
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows loading indicator while fetching schedules', (
      tester,
    ) async {
      final completer = Completer<List<FeedSchedule>>();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            feedSchedulesProvider('horse-1').overrideWith(
              (ref) => completer.future,
            ),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const FeedScheduleScreen(horseId: 'horse-1'),
          ),
        ),
      );

      await tester.pump();
      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      completer.complete([]);
    });

    // ════════════════════════════════════════════════════════════════
    // Error state
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows error widget on fetch failure', (tester) async {
      await tester.pumpWidget(createFeedScheduleScreen(
        horseId: 'horse-1',
        simulateError: true,
      ));
      await tester.pumpAndSettle();

      expect(find.byType(TamgaErrorWidget), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════════
    // Empty state
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows empty state when no schedules exist', (tester) async {
      await tester.pumpWidget(createFeedScheduleScreen(
        horseId: 'horse-1',
        schedules: [],
      ));
      await tester.pumpAndSettle();

      expect(find.text('Тэжээлийн хуваарь байхгүй'), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════════
    // List display
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows feed schedule list with schedule tiles', (
      tester,
    ) async {
      final schedules = [
        createMockFeedSchedule(
          id: 'fs-1',
          feedType: FeedType.hay,
          quantityKg: 5.0,
          frequency: 'Өдөр бүр',
          notes: 'Өвс',
          startDate: DateTime(2026, 6, 1),
        ),
        createMockFeedSchedule(
          id: 'fs-2',
          feedType: FeedType.grain,
          quantityKg: 2.0,
          frequency: 'Өдөрт 2 удаа',
          notes: 'Тэжээл',
          startDate: DateTime(2026, 6, 1),
        ),
      ];

      await tester.pumpWidget(createFeedScheduleScreen(
        horseId: 'horse-1',
        schedules: schedules,
      ));
      await tester.pumpAndSettle();

      // Show feed type names
      expect(find.text('Өвс'), findsAtLeast(1));
      expect(find.text('Тэжээл'), findsAtLeast(1));

      // Show amounts and frequency
      expect(find.textContaining('5.0 кг · Өдөр бүр'), findsOneWidget);
      expect(find.textContaining('2.0 кг · Өдөрт 2 удаа'), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════════
    // FAB
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows FAB to add new feed schedule', (tester) async {
      await tester.pumpWidget(createFeedScheduleScreen(
        horseId: 'horse-1',
        schedules: [],
      ));
      await tester.pumpAndSettle();

      expect(find.byType(FloatingActionButton), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════════
    // Active/inactive status
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows active badge for current schedule', (tester) async {
      final schedules = [
        createMockFeedSchedule(
          id: 'fs-1',
          feedType: FeedType.hay,
          quantityKg: 5.0,
          frequency: 'Өдөр бүр',
          startDate: DateTime(2026, 6, 1),
          endDate: DateTime(2026, 12, 31),
        ),
      ];

      await tester.pumpWidget(createFeedScheduleScreen(
        horseId: 'horse-1',
        schedules: schedules,
      ));
      await tester.pumpAndSettle();

      // Should show active status
      expect(find.text('Идэвхтэй'), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════════
    // Source verification
    // ════════════════════════════════════════════════════════════════
    test('FeedScheduleScreen class exists', () {
      expect(FeedScheduleScreen, isA<Type>());
    });
  });
}
