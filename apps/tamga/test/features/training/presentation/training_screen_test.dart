import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tamga/src/core/widgets/widgets.dart';
import 'package:tamga/src/features/training/application/training_providers.dart';
import 'package:tamga/src/features/training/domain/training_log.dart';
import 'package:tamga/src/features/training/presentation/training_screen.dart';
import 'package:tamga/src/features/training/presentation/widgets/weekly_chart.dart';
import '../../../helpers/test_helpers.dart';
import 'package:tamga/src/core/theme/tamga_design_system.dart';

// ── Helpers ────────────────────────────────────────────────────────

Widget createTrainingScreen({
  required String horseId,
  List<TrainingLog>? logs,
  bool simulateError = false,
}) {
  if (simulateError) {
    return ProviderScope(
      overrides: [
        trainingLogsProvider(horseId).overrideWith((ref) async {
          throw Exception('Test network error');
        }),
      ],
      child: MaterialApp(
        theme: TamgaDesignSystem.buildThemeData(Brightness.light),
        home: TrainingScreen(horseId: horseId),
      ),
    );
  }

  return ProviderScope(
    overrides: [
      trainingLogsProvider(horseId).overrideWith((ref) async {
        return logs ?? [];
      }),
    ],
    child: MaterialApp(
      theme: TamgaDesignSystem.buildThemeData(Brightness.light),
      home: TrainingScreen(horseId: horseId),
    ),
  );
}

void main() {
  group('TrainingScreen — VAL-TRAIN-005', () {
    // ════════════════════════════════════════════════════════════════
    // Loading state
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows loading indicator while fetching logs', (tester) async {
      final completer = Completer<List<TrainingLog>>();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            trainingLogsProvider(
              'horse-1',
            ).overrideWith((ref) => completer.future),
          ],
          child: MaterialApp(
            theme: TamgaDesignSystem.buildThemeData(Brightness.light),
            home: const TrainingScreen(horseId: 'horse-1'),
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
      await tester.pumpWidget(
        createTrainingScreen(horseId: 'horse-1', simulateError: true),
      );
      await tester.pumpAndSettle();

      expect(find.byType(TamgaErrorWidget), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════════
    // Empty state
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows empty state when no training logs exist', (
      tester,
    ) async {
      await tester.pumpWidget(
        createTrainingScreen(horseId: 'horse-1', logs: []),
      );
      await tester.pumpAndSettle();

      expect(find.text('Дасгалжуулалтын бүртгэл байхгүй'), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════════
    // List display
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows training log list with log tiles', (tester) async {
      final logs = [
        createMockTrainingLog(
          id: 'tl-1',
          type: TrainingLogType.gallop,
          durationMinutes: 30,
          distanceKm: 5.0,
          notes: 'Хурдан давхилт',
          date: DateTime(2026, 6, 1),
        ),
        createMockTrainingLog(
          id: 'tl-2',
          type: TrainingLogType.sprint,
          durationMinutes: 20,
          distanceKm: 3.0,
          notes: 'Богино зайн хурд',
          date: DateTime(2026, 6, 2),
          handlerName: 'Дорж',
        ),
      ];

      await tester.pumpWidget(
        createTrainingScreen(horseId: 'horse-1', logs: logs),
      );
      await tester.pumpAndSettle();

      // Show type names (appear in both filter chips and log tiles)
      expect(find.text('Хурдалгаа'), findsAtLeast(1));
      expect(find.text('Спринт'), findsAtLeast(1));

      // Should show duration info
      expect(find.textContaining('30 мин'), findsOneWidget);
      expect(find.textContaining('20 мин'), findsOneWidget);

      // Should show distance info
      expect(find.textContaining('5.0 км'), findsOneWidget);
      expect(find.textContaining('3.0 км'), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════════
    // Weekly chart
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows weekly bar chart', (tester) async {
      final now = DateTime(2026, 6, 18); // Thursday
      final logs = [
        createMockTrainingLog(
          id: 'tl-1',
          type: TrainingLogType.gallop,
          durationMinutes: 30,
          date: now.subtract(const Duration(days: 1)), // Wednesday
        ),
        createMockTrainingLog(
          id: 'tl-2',
          type: TrainingLogType.sprint,
          durationMinutes: 20,
          date: now, // Thursday
        ),
      ];

      await tester.pumpWidget(
        createTrainingScreen(horseId: 'horse-1', logs: logs),
      );
      await tester.pumpAndSettle();

      expect(find.byType(WeeklyBarChart), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════════
    // Filter chips
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows filter chips for TrainingLogType', (tester) async {
      final logs = [
        createMockTrainingLog(id: 'tl-1', type: TrainingLogType.gallop),
        createMockTrainingLog(id: 'tl-2', type: TrainingLogType.sprint),
        createMockTrainingLog(id: 'tl-3', type: TrainingLogType.endurance),
        createMockTrainingLog(id: 'tl-4', type: TrainingLogType.rest),
      ];

      await tester.pumpWidget(
        createTrainingScreen(horseId: 'horse-1', logs: logs),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // Should show all type filter options
      expect(find.text('Бүгд'), findsOneWidget);
      // Type names appear in both filter chips and log tiles
      expect(find.text('Хурдалгаа'), findsAtLeast(1));
      expect(find.text('Спринт'), findsAtLeast(1));
      expect(find.text('Тэвчээр'), findsAtLeast(1));
      expect(find.text('Амралт'), findsAtLeast(1));
    });

    // ════════════════════════════════════════════════════════════════
    // Filter by type
    // ════════════════════════════════════════════════════════════════
    testWidgets('filters list when filter chip is tapped', (tester) async {
      final logs = [
        createMockTrainingLog(
          id: 'tl-1',
          type: TrainingLogType.gallop,
          durationMinutes: 30,
          distanceKm: null,
          notes: '',
        ),
        createMockTrainingLog(
          id: 'tl-2',
          type: TrainingLogType.sprint,
          durationMinutes: 20,
          distanceKm: null,
          notes: '',
        ),
      ];

      await tester.pumpWidget(
        createTrainingScreen(horseId: 'horse-1', logs: logs),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // Tap on sprint filter chip
      final sprintChips = find.text('Спринт');
      await tester.ensureVisible(sprintChips.first);
      await tester.pump();
      await tester.tap(sprintChips.first);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 200));

      // Sprint log tile should still be visible
      expect(find.text('20 мин'), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════════
    // FAB
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows FAB to add new training log', (tester) async {
      await tester.pumpWidget(
        createTrainingScreen(horseId: 'horse-1', logs: []),
      );
      await tester.pumpAndSettle();

      expect(find.byType(FloatingActionButton), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════════
    // Source verification: screen exists
    // ════════════════════════════════════════════════════════════════
    test('TrainingScreen class exists', () {
      // Just verify the import works and class compiles
      expect(TrainingScreen, isA<Type>());
    });
  });
}
