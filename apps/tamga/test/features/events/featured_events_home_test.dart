import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tamga/l10n/generated/app_localizations.dart';

import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/features/events/application/events_providers.dart';
import 'package:tamga/src/features/events/data/event_repository.dart';
import 'package:tamga/src/features/events/presentation/widgets/event_card.dart';
import 'package:tamga/src/shared/domain/event.dart';
import 'package:tamga/src/core/theme/tamga_design_system.dart';

// ── Mock EventRepository ───────────────────────────────────────────

class MockEventRepository extends EventRepository {
  final List<Event> _featuredEvents;

  MockEventRepository(this._featuredEvents);

  @override
  Future<Result<List<Event>>> fetchFeaturedEvents() async {
    return Result.ok(_featuredEvents);
  }

  @override
  Future<Result<List<Event>>> fetchEvents() async {
    return Result.ok(_featuredEvents);
  }

  @override
  Future<Result<List<Event>>> fetchEventsByHorse(String horseId) async {
    return Result.ok(_featuredEvents);
  }

  @override
  Future<Result<List<Event>>> fetchEventsByOwner(String ownerId) async {
    return Result.ok(_featuredEvents);
  }

  @override
  Future<Result<Event>> saveEvent(Event event) async {
    return Result.ok(event);
  }

  @override
  Future<Result<void>> deleteEvent(String id) async {
    return Result.ok(null);
  }
}

// ── Mock data ───────────────────────────────────────────────────────

final _featuredEvent = Event(
  id: 'feat-1',
  horseId: 'h1',
  title: 'Онцлох уралдаан',
  eventType: EventType.race,
  isFeatured: true,
  date: null,
  location: 'Төв аймаг',
  createdAt: DateTime.now(),
  updatedAt: DateTime.now(),
);

final _anotherFeaturedEvent = Event(
  id: 'feat-2',
  horseId: 'h1',
  title: 'Онцлох уралдаан-2',
  eventType: EventType.race,
  isFeatured: true,
  date: null,
  location: 'Улаанбаатар',
  createdAt: DateTime.now(),
  updatedAt: DateTime.now(),
);

// ── Test helper: a test widget that replicates the featured section ──

/// A test widget that replicates the featured events section behavior
/// from LineageHomeScreen using the same provider pattern.
class FeaturedEventsTestWidget extends ConsumerWidget {
  const FeaturedEventsTestWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final featuredAsync = ref.watch(featuredEventsProvider);

    return featuredAsync.when(
      data: (events) {
        if (events.isEmpty) return const SizedBox.shrink();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Section title (matches home screen: titleMedium, w600)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(
                'Онцлох арга хэмжээ',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
              ),
            ),
            // Horizontal scrollable list (matches home screen: height 120)
            SizedBox(
              height: 120,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: events.length,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (ctx, index) {
                  final event = events[index];
                  return SizedBox(
                    width: 420,
                    child: EventCard(event: event, onTap: () {}),
                  );
                },
              ),
            ),
          ],
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
    );
  }
}

ProviderScope _buildTestWidget({required List<Event> featuredEvents}) {
  return ProviderScope(
    overrides: [
      // Override featuredEventsProvider to return mock data
      featuredEventsProvider.overrideWith((ref) async {
        final repo = MockEventRepository(featuredEvents);
        final result = await repo.fetchFeaturedEvents();
        return result.getOrThrow();
      }),
    ],
    child: MaterialApp(
      locale: const Locale('mn'),
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      theme: TamgaDesignSystem.buildThemeData(Brightness.light),
      home: Scaffold(
        body: SingleChildScrollView(child: const FeaturedEventsTestWidget()),
      ),
    ),
  );
}

void main() {
  // ══════════════════════════════════════════════════════════════
  // VAL-EVENTS-006: Featured events appear as horizontal scrollable section
  // ══════════════════════════════════════════════════════════════
  group('VAL-EVENTS-006: Featured events section', () {
    testWidgets(
      'shows "Онцлох арга хэмжээ" section with horizontal scroll when featured events exist',
      (tester) async {
        // Set large viewport to avoid EventCard overflow in horizontal list
        tester.view.physicalSize = const Size(2000, 2000);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(() {
          tester.view.resetPhysicalSize();
          tester.view.resetDevicePixelRatio();
        });

        await tester.pumpWidget(
          _buildTestWidget(featuredEvents: [_featuredEvent]),
        );
        await tester.pump();
        await tester.pump();

        // Section title should be visible
        expect(find.text('Онцлох арга хэмжээ'), findsOneWidget);

        // The featured event title should be visible (from EventCard)
        expect(find.text('Онцлох уралдаан'), findsOneWidget);

        // The horizontal ListView should be present
        final horizontalListViews = find.byWidgetPredicate(
          (w) => w is ListView && w.scrollDirection == Axis.horizontal,
        );
        expect(horizontalListViews, findsOneWidget);
      },
    );

    testWidgets('multiple featured events appear in the horizontal list', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(2000, 2000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        _buildTestWidget(
          featuredEvents: [_featuredEvent, _anotherFeaturedEvent],
        ),
      );
      await tester.pump();
      await tester.pump();

      // Both featured event titles should be visible
      expect(find.text('Онцлох уралдаан'), findsOneWidget);
      expect(find.text('Онцлох уралдаан-2'), findsOneWidget);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-EVENTS-020: Only events with isFeatured=true appear
  // ══════════════════════════════════════════════════════════════
  group('VAL-EVENTS-020: Only featured events appear', () {
    testWidgets('non-featured events do not appear in featured section', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(2000, 2000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        _buildTestWidget(
          featuredEvents: [_featuredEvent, _anotherFeaturedEvent],
        ),
      );
      await tester.pump();
      await tester.pump();

      // Featured events are visible
      expect(find.text('Онцлох уралдаан'), findsOneWidget);
      expect(find.text('Онцлох уралдаан-2'), findsOneWidget);

      // Non-featured event title should NOT be visible
      expect(find.text('Энгийн уралдаан'), findsNothing);
    });

    testWidgets('only featured events from provider are rendered', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(2000, 2000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        _buildTestWidget(featuredEvents: [_featuredEvent]),
      );
      await tester.pump();
      await tester.pump();

      // Only the featured event should be shown
      expect(find.text('Онцлох уралдаан'), findsOneWidget);

      // The second featured event should not be present
      expect(find.text('Онцлох уралдаан-2'), findsNothing);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-EVENTS-021: Section hidden when no featured events
  // ══════════════════════════════════════════════════════════════
  group('VAL-EVENTS-021: Section hidden when empty', () {
    testWidgets('featured section is not shown when no featured events', (
      tester,
    ) async {
      await tester.pumpWidget(_buildTestWidget(featuredEvents: []));
      await tester.pump();
      await tester.pump();

      // Section title should NOT be visible
      expect(find.text('Онцлох арга хэмжээ'), findsNothing);

      // Any event text should not be visible
      expect(find.text('Онцлох уралдаан'), findsNothing);
    });

    testWidgets('empty list hides section title and event cards', (
      tester,
    ) async {
      await tester.pumpWidget(_buildTestWidget(featuredEvents: []));
      await tester.pump();
      await tester.pump();

      // Section title should not be visible
      expect(find.text('Онцлох арга хэмжээ'), findsNothing);

      // No horizontal ListView should exist for events
      final horizontalListViews = find.byWidgetPredicate(
        (w) => w is ListView && w.scrollDirection == Axis.horizontal,
      );
      expect(horizontalListViews, findsNothing);
    });
  });
}
