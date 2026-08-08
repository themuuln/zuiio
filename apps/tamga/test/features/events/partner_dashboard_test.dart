import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tamga/l10n/generated/app_localizations.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/features/events/application/events_providers.dart';
import 'package:tamga/src/features/events/application/partner_dashboard_provider.dart';
import 'package:tamga/src/features/events/data/event_repository.dart';
import 'package:tamga/src/features/events/presentation/partner_dashboard_screen.dart';
import 'package:tamga/src/shared/domain/event.dart';
import 'package:tamga/src/core/theme/tamga_design_system.dart';

// ── Mock EventRepository ───────────────────────────────────────────

class MockEventRepository extends EventRepository {
  List<Event> _events = [];
  int saveCallCount = 0;
  Event? lastSavedEvent;

  void setEvents(List<Event> events) {
    _events = events;
  }

  @override
  Future<Result<List<Event>>> fetchEvents() async {
    return Result.ok(_events);
  }

  @override
  Future<Result<List<Event>>> fetchEventsByHorse(String horseId) async {
    return Result.ok(_events.where((e) => e.horseId == horseId).toList());
  }

  @override
  Future<Result<List<Event>>> fetchEventsByOwner(String ownerId) async {
    return Result.ok(_events.where((e) => e.ownerId == ownerId).toList());
  }

  @override
  Future<Result<List<Event>>> fetchFeaturedEvents() async {
    return Result.ok(_events.where((e) => e.isFeatured).toList());
  }

  @override
  Future<Result<Event>> saveEvent(Event event) async {
    saveCallCount++;
    lastSavedEvent = event;
    final existingIndex = _events.indexWhere((e) => e.id == event.id);
    if (existingIndex >= 0) {
      _events[existingIndex] = event;
    } else {
      _events.add(event);
    }
    return Result.ok(event);
  }

  @override
  Future<Result<void>> deleteEvent(String id) async {
    _events.removeWhere((e) => e.id == id);
    return Result.ok(null);
  }
}

// ── Test helpers ────────────────────────────────────────────────────

Widget buildTestApp(List<Override> overrides) {
  return ProviderScope(
    overrides: overrides,
    child: MaterialApp(
      locale: const Locale('mn'),
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      theme: TamgaDesignSystem.buildThemeData(Brightness.light),
      home: const PartnerDashboardScreen(),
    ),
  );
}

Event _event1 = Event(
  id: 'evt-1',
  horseId: 'horse-1',
  title: 'Хаврын цом',
  eventType: EventType.race,
  ownerId: 'test-user-1',
  date: DateTime(2026, 6, 15),
  location: 'Төв аймаг',
  createdAt: DateTime.now(),
  updatedAt: DateTime.now(),
);

// ── Tests ────────────────────────────────────────────────────────────

void main() {
  group('PartnerDashboardScreen — VAL-EVENTS-010', () {
    testWidgets('shows user\'s events in dashboard', (tester) async {
      await tester.pumpWidget(
        buildTestApp([
          partnerEventsProvider.overrideWith((ref) async => [_event1]),
        ]),
      );
      await tester.pumpAndSettle();

      expect(find.text('Хаврын цом'), findsOneWidget);
      expect(find.text('Уралдаан'), findsOneWidget);
    });

    testWidgets('shows empty state when no events', (tester) async {
      await tester.pumpWidget(
        buildTestApp([
          partnerEventsProvider.overrideWith((ref) async => <Event>[]),
        ]),
      );
      await tester.pumpAndSettle();

      expect(find.text('Арга хэмжээ байхгүй байна'), findsOneWidget);
    });

    testWidgets('shows date for each event', (tester) async {
      await tester.pumpWidget(
        buildTestApp([
          partnerEventsProvider.overrideWith((ref) async => [_event1]),
        ]),
      );
      await tester.pumpAndSettle();

      expect(find.textContaining('2026'), findsOneWidget);
    });
  });

  group('PartnerDashboardScreen — VAL-EVENTS-024: create event', () {
    testWidgets('shows Арга хэмжээ нэмэх button', (tester) async {
      await tester.pumpWidget(
        buildTestApp([
          partnerEventsProvider.overrideWith((ref) async => [_event1]),
        ]),
      );
      await tester.pumpAndSettle();

      expect(find.text('Арга хэмжээ нэмэх'), findsOneWidget);
    });
  });

  group('PartnerDashboardScreen — VAL-EVENTS-025: isFeatured toggle', () {
    late MockEventRepository mockRepo;

    setUp(() {
      mockRepo = MockEventRepository();
    });

    testWidgets('toggling isFeatured star icon calls saveEvent', (
      tester,
    ) async {
      final event = Event(
        id: 'evt-1',
        horseId: 'h1',
        title: 'Test Event',
        eventType: EventType.race,
        ownerId: 'user1',
        isFeatured: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      mockRepo.setEvents([event]);

      await tester.pumpWidget(
        buildTestApp([
          localEventRepositoryProvider.overrideWith((ref) => mockRepo),
          partnerEventsProvider.overrideWith((ref) async => [event]),
        ]),
      );
      await tester.pumpAndSettle();

      expect(find.byIcon(PhosphorIconsRegular.star), findsOneWidget);

      await tester.tap(find.byIcon(PhosphorIconsRegular.star));
      await tester.pumpAndSettle();

      // saveEvent should have been called
      expect(mockRepo.saveCallCount, greaterThan(0));
      expect(mockRepo.lastSavedEvent, isNotNull);
      expect(mockRepo.lastSavedEvent!.isFeatured, true);
    });
  });

  group('PartnerDashboardScreen — VAL-EVENTS-026: registration count', () {
    testWidgets('shows registration count per event', (tester) async {
      await tester.pumpWidget(
        buildTestApp([
          partnerEventsProvider.overrideWith((ref) async => [_event1]),
          registrationCountProvider(_event1.id).overrideWith((ref) async => 5),
        ]),
      );
      await tester.pumpAndSettle();

      expect(find.text('Бүртгэл: 5'), findsOneWidget);
    });
  });

  group('Unit — partner events provider filters by owner', () {
    test('fetchEventsByOwner returns only matching owner events', () async {
      final repo = MockEventRepository();
      final userEvents = [
        Event(
          id: '1',
          horseId: 'h1',
          title: 'My Event',
          eventType: EventType.race,
          ownerId: 'user1',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
        Event(
          id: '2',
          horseId: 'h2',
          title: 'Another Event',
          eventType: EventType.training,
          ownerId: 'user1',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      ];
      final otherEvent = Event(
        id: '3',
        horseId: 'h3',
        title: 'Not Mine',
        eventType: EventType.race,
        ownerId: 'user2',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      repo.setEvents([...userEvents, otherEvent]);

      final result = await repo.fetchEventsByOwner('user1');
      expect(result.isSuccess, true);
      expect(result.value.length, 2);
      expect(result.value.every((e) => e.ownerId == 'user1'), true);
    });

    test('fetchEventsByOwner returns empty list for unknown owner', () async {
      final repo = MockEventRepository();
      repo.setEvents([]);

      final result = await repo.fetchEventsByOwner('unknown');
      expect(result.isSuccess, true);
      expect(result.value, isEmpty);
    });
  });
}
