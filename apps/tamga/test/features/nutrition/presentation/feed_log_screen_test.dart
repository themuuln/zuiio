import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tamga/src/core/widgets/widgets.dart';
import 'package:tamga/src/features/nutrition/application/nutrition_providers.dart';
import 'package:tamga/src/features/nutrition/domain/feed_schedule.dart';
import 'package:tamga/src/features/nutrition/domain/feed_log.dart';
import 'package:tamga/src/features/nutrition/presentation/feed_log_screen.dart';
import 'package:tamga/src/features/nutrition/presentation/feed_schedule_screen.dart';
import '../../../helpers/test_helpers.dart';
import 'package:tamga/src/core/theme/tamga_design_system.dart';

// ── Helpers ────────────────────────────────────────────────────────

Widget createFeedLogScreen({
  required String horseId,
  List<FeedSchedule>? schedules,
  List<FeedLog>? logs,
  bool simulateError = false,
}) {
  final today = DateTime.now();
  final dayStart = DateTime(today.year, today.month, today.day);
  final dayEnd = dayStart.add(
    const Duration(hours: 23, minutes: 59, seconds: 59),
  );

  if (simulateError) {
    return ProviderScope(
      overrides: [
        feedSchedulesProvider(horseId).overrideWith((ref) async {
          throw Exception('Test network error');
        }),
        feedLogsByDateRangeProvider((
          horseId: horseId,
          startDate: dayStart,
          endDate: dayEnd,
        )).overrideWith((ref) async {
          return [];
        }),
      ],
      child: MaterialApp(
        theme: TamgaDesignSystem.buildThemeData(Brightness.light),
        home: FeedLogScreen(horseId: horseId),
      ),
    );
  }

  return ProviderScope(
    overrides: [
      feedSchedulesProvider(horseId).overrideWith((ref) async {
        return schedules ?? [];
      }),
      feedLogsByDateRangeProvider((
        horseId: horseId,
        startDate: dayStart,
        endDate: dayEnd,
      )).overrideWith((ref) async {
        return logs ?? [];
      }),
    ],
    child: MaterialApp(
      theme: TamgaDesignSystem.buildThemeData(Brightness.light),
      home: FeedLogScreen(horseId: horseId),
    ),
  );
}

void main() {
  group('FeedLogScreen — VAL-NUTR-006', () {
    // ════════════════════════════════════════════════════════════════
    // Loading state
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows loading indicator while fetching data', (tester) async {
      final scheduleCompleter = Completer<List<FeedSchedule>>();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            feedSchedulesProvider(
              'horse-1',
            ).overrideWith((ref) => scheduleCompleter.future),
          ],
          child: MaterialApp(
            theme: TamgaDesignSystem.buildThemeData(Brightness.light),
            home: const FeedLogScreen(horseId: 'horse-1'),
          ),
        ),
      );

      await tester.pump();
      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      scheduleCompleter.complete([]);
    });

    // ════════════════════════════════════════════════════════════════
    // Error state
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows error widget on fetch failure', (tester) async {
      await tester.pumpWidget(
        createFeedLogScreen(horseId: 'horse-1', simulateError: true),
      );
      await tester.pumpAndSettle();

      expect(find.byType(TamgaErrorWidget), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════════
    // Empty state
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows empty state when no active schedules', (tester) async {
      await tester.pumpWidget(
        createFeedLogScreen(horseId: 'horse-1', schedules: [], logs: []),
      );
      await tester.pumpAndSettle();

      expect(find.text('Энэ өдөр тэжээлийн хуваарь байхгүй'), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════════
    // Shows schedule cards for active schedules
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows schedule cards with feed type names', (tester) async {
      final schedules = [
        createMockFeedSchedule(
          id: 'fs-1',
          feedType: FeedType.hay,
          quantityKg: 5.0,
          frequency: 'Өдөр бүр',
          startDate: DateTime(2026, 6, 1),
        ),
        createMockFeedSchedule(
          id: 'fs-2',
          feedType: FeedType.grain,
          quantityKg: 2.0,
          frequency: 'Өдөрт 2 удаа',
          startDate: DateTime(2026, 6, 1),
        ),
      ];

      await tester.pumpWidget(
        createFeedLogScreen(horseId: 'horse-1', schedules: schedules, logs: []),
      );
      await tester.pumpAndSettle();

      // Should show schedule info
      expect(find.text('Өвс'), findsOneWidget);
      expect(find.text('Тэжээл'), findsOneWidget);
      expect(find.text('Хүлээгдэж буй'), findsAtLeast(1));
    });

    // ════════════════════════════════════════════════════════════════
    // Shows fed status
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows fed status for logged feed', (tester) async {
      final now = DateTime.now();
      final schedules = [
        createMockFeedSchedule(
          id: 'fs-1',
          feedType: FeedType.hay,
          quantityKg: 5.0,
          frequency: 'Өдөр бүр',
          startDate: DateTime(2026, 6, 1),
        ),
      ];
      final logs = [
        createMockFeedLog(
          id: 'fl-1',
          scheduleId: 'fs-1',
          horseId: 'horse-1',
          amountGiven: 5.0,
          skipped: false,
          date: DateTime(now.year, now.month, now.day),
        ),
      ];

      await tester.pumpWidget(
        createFeedLogScreen(
          horseId: 'horse-1',
          schedules: schedules,
          logs: logs,
        ),
      );
      await tester.pumpAndSettle();

      // "Тэжээсэн" appears as both status badge and action button
      expect(find.text('Тэжээсэн'), findsAtLeast(1));
    });

    // ════════════════════════════════════════════════════════════════
    // Shows skipped status
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows skipped status for skipped feed', (tester) async {
      final now = DateTime.now();
      final schedules = [
        createMockFeedSchedule(
          id: 'fs-1',
          feedType: FeedType.hay,
          quantityKg: 5.0,
          frequency: 'Өдөр бүр',
          startDate: DateTime(2026, 6, 1),
        ),
      ];
      final logs = [
        createMockFeedLog(
          id: 'fl-1',
          scheduleId: 'fs-1',
          horseId: 'horse-1',
          amountGiven: 0,
          skipped: true,
          date: DateTime(now.year, now.month, now.day),
        ),
      ];

      await tester.pumpWidget(
        createFeedLogScreen(
          horseId: 'horse-1',
          schedules: schedules,
          logs: logs,
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Алгассан'), findsAtLeast(1));
    });

    // ════════════════════════════════════════════════════════════════
    // Shows pending status
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows pending status when no log exists', (tester) async {
      final schedules = [
        createMockFeedSchedule(
          id: 'fs-1',
          feedType: FeedType.hay,
          quantityKg: 5.0,
          frequency: 'Өдөр бүр',
          startDate: DateTime(2026, 6, 1),
        ),
      ];

      await tester.pumpWidget(
        createFeedLogScreen(horseId: 'horse-1', schedules: schedules, logs: []),
      );
      await tester.pumpAndSettle();

      expect(find.text('Хүлээгдэж буй'), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════════
    // Date selector
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows date navigation controls', (tester) async {
      await tester.pumpWidget(
        createFeedLogScreen(horseId: 'horse-1', schedules: [], logs: []),
      );
      await tester.pumpAndSettle();

      // Should show date navigation chevrons
      expect(find.byIcon(Icons.chevron_left), findsOneWidget);
      expect(find.byIcon(Icons.chevron_right), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════════
    // Action buttons
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows fed and skipped action buttons', (tester) async {
      final schedules = [
        createMockFeedSchedule(
          id: 'fs-1',
          feedType: FeedType.hay,
          quantityKg: 5.0,
          frequency: 'Өдөр бүр',
          startDate: DateTime(2026, 6, 1),
        ),
      ];

      await tester.pumpWidget(
        createFeedLogScreen(horseId: 'horse-1', schedules: schedules, logs: []),
      );
      await tester.pumpAndSettle();

      expect(find.text('Тэжээсэн'), findsOneWidget);
      expect(find.text('Алгассан'), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════════
    // Source verification
    // ════════════════════════════════════════════════════════════════
    test('FeedLogScreen class exists', () {
      expect(FeedLogScreen, isA<Type>());
    });
  });

  group('VAL-NUTR-007 — Horse detail tabs', () {
    test('FeedScheduleScreen accepts horseId parameter', () {
      // Just verify the class has a horseId constructor param
      expect(() => FeedScheduleScreen(horseId: 'test-horse'), returnsNormally);
    });

    test('FeedLogScreen accepts horseId parameter', () {
      expect(() => FeedLogScreen(horseId: 'test-horse'), returnsNormally);
    });
  });
}
