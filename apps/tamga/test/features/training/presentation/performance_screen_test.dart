import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/core/widgets/widgets.dart';
import 'package:tamga/src/features/training/application/training_providers.dart';
import 'package:tamga/src/features/training/domain/performance_record.dart';
import 'package:tamga/src/features/training/presentation/performance_screen.dart';
import 'package:tamga/src/features/training/presentation/widgets/performance_chart.dart';
import '../../../helpers/test_helpers.dart';

// ── Helpers ────────────────────────────────────────────────────────

Widget createPerformanceScreen({
  required String horseId,
  List<PerformanceRecord>? records,
  bool simulateError = false,
}) {
  if (simulateError) {
    return ProviderScope(
      overrides: [
        performanceRecordsProvider(horseId).overrideWith((ref) async {
          throw Exception('Test network error');
        }),
      ],
      child: MaterialApp(
        theme: AppTheme.light(),
        home: PerformanceScreen(horseId: horseId),
      ),
    );
  }

  return ProviderScope(
    overrides: [
      performanceRecordsProvider(horseId).overrideWith((ref) async {
        return records ?? [];
      }),
    ],
    child: MaterialApp(
      theme: AppTheme.light(),
      home: PerformanceScreen(horseId: horseId),
    ),
  );
}

void main() {
  group('PerformanceScreen — VAL-TRAIN-009', () {
    // ════════════════════════════════════════════════════════════════
    // Loading state
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows loading indicator while fetching records', (
      tester,
    ) async {
      final completer = Completer<List<PerformanceRecord>>();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            performanceRecordsProvider('horse-1').overrideWith(
              (ref) => completer.future,
            ),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const PerformanceScreen(horseId: 'horse-1'),
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
      await tester.pumpWidget(createPerformanceScreen(
        horseId: 'horse-1',
        simulateError: true,
      ));
      await tester.pumpAndSettle();

      expect(find.byType(TamgaErrorWidget), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════════
    // Empty state
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows empty state when no performance records exist', (
      tester,
    ) async {
      await tester.pumpWidget(createPerformanceScreen(
        horseId: 'horse-1',
        records: [],
      ));
      await tester.pumpAndSettle();

      expect(find.text('Гүйцэтгэлийн үзүүлэлт байхгүй'), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════════
    // List display
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows performance records with metric, value, unit', (
      tester,
    ) async {
      final records = [
        createMockPerformanceRecord(
          id: 'pr-1',
          metric: MetricType.speed,
          value: 45.0,
          unit: 'км/ц',
          notes: 'Хурд хэмжилт',
        ),
        createMockPerformanceRecord(
          id: 'pr-2',
          metric: MetricType.weight,
          value: 350.0,
          unit: 'кг',
          notes: 'Жин хэмжилт',
        ),
      ];

      await tester.pumpWidget(createPerformanceScreen(
        horseId: 'horse-1',
        records: records,
      ));
      await tester.pumpAndSettle();

      // Should show value with unit text (more specific than metric name)
      expect(find.text('45.0 км/ц'), findsOneWidget);
      expect(find.text('350.0 кг'), findsOneWidget);

      // Should show notes
      expect(find.text('Хурд хэмжилт'), findsOneWidget);
      expect(find.text('Жин хэмжилт'), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════════
    // Filter chips
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows filter chips for MetricType', (tester) async {
      final records = [
        createMockPerformanceRecord(
          id: 'pr-1',
          metric: MetricType.speed,
          value: 45.0,
        ),
        createMockPerformanceRecord(
          id: 'pr-2',
          metric: MetricType.weight,
          value: 350.0,
        ),
      ];

      await tester.pumpWidget(createPerformanceScreen(
        horseId: 'horse-1',
        records: records,
      ));
      await tester.pumpAndSettle();

      // Should show filter chip labels (at least find them in the scrollable row)
      expect(find.text('Бүгд'), findsOneWidget);
      // "Хурд" and "Жин" appear as both filter chips and metric titles - use atLeast
      expect(find.text('Хурд'), findsAtLeast(1));
      expect(find.text('Тэвчээр'), findsOneWidget);
      expect(find.text('Жин'), findsAtLeast(1));
      expect(find.text('Биеийн байдал'), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════════
    // Trend chart
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows trend chart when records exist', (tester) async {
      final records = [
        createMockPerformanceRecord(
          id: 'pr-1',
          metric: MetricType.speed,
          value: 45.0,
        ),
        createMockPerformanceRecord(
          id: 'pr-2',
          metric: MetricType.speed,
          value: 50.0,
        ),
      ];

      await tester.pumpWidget(createPerformanceScreen(
        horseId: 'horse-1',
        records: records,
      ));
      await tester.pumpAndSettle();

      expect(find.byType(PerformanceTrendChart), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════════
    // FAB
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows FAB to add new measurement', (tester) async {
      await tester.pumpWidget(createPerformanceScreen(
        horseId: 'horse-1',
        records: [],
      ));
      await tester.pumpAndSettle();

      expect(find.byType(FloatingActionButton), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════════
    // Source verification
    // ════════════════════════════════════════════════════════════════
    test('PerformanceScreen class exists', () {
      expect(PerformanceScreen, isA<Type>());
    });
  });
}
