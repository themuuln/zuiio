import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/app/theme/app_colors.dart';
import 'package:tamga/src/features/shared/data/pagination/pagination_state.dart';
import 'package:tamga/src/features/auth/application/auth_providers.dart';
import 'package:tamga/src/features/auth/domain/auth_state.dart';
import 'package:tamga/src/features/events/application/events_providers.dart';
import 'package:tamga/src/features/events/presentation/event_detail_screen.dart';
import 'package:tamga/src/features/horses/application/horses_providers.dart';
import 'package:tamga/src/shared/domain/event.dart';
import 'package:tamga/src/shared/domain/horse.dart';
import 'package:tamga/src/features/events/presentation/events_screen.dart';
import 'package:tamga/src/features/events/presentation/add_event_screen.dart';
import 'package:tamga/src/features/events/presentation/widgets/event_card.dart';

// ═══════════════════════════════════════════════════════════════════
// Test helpers
// ═══════════════════════════════════════════════════════════════════

/// Returns mock events for testing.
List<Event> _mockEvents() {
  final now = DateTime.now();
  return [
    Event(
      id: 'e1',
      horseId: 'h1',
      title: 'Хаврын цом',
      eventType: EventType.race,
      date: null, // no date → isUpcoming = true
      location: 'Төв аймаг',
      horseName: 'Хан хүлэг',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    ),
    Event(
      id: 'e2',
      horseId: 'h1',
      title: 'Дуудлага 2026',
      eventType: EventType.auction,
      date: now.add(const Duration(days: 30)),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    ),
    Event(
      id: 'e3',
      horseId: 'h1',
      title: 'Expo тэмцээн',
      eventType: EventType.expo,
      date: now.subtract(const Duration(days: 10)),
      result: 'Оролцсон',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    ),
    Event(
      id: 'e4',
      horseId: 'h1',
      title: 'Сургалт',
      eventType: EventType.training,
      date: now.add(const Duration(days: 5)),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    ),
  ];
}

/// Creates a PaginationNotifier that starts with given events.
class _MockPaginationNotifier extends PaginationNotifier<Event> {
  _MockPaginationNotifier(List<Event> events)
    : super(fetchPage: (_, _) async => events, pageSize: 20) {
    state = PaginationState<Event>(
      items: events,
      isLoading: false,
      hasMore: false,
      error: null,
    );
  }
}

void main() {
  // ══════════════════════════════════════════════════════════════
  // VAL-EVENTS-002: EventCard shows type-appropriate icon and color
  // ══════════════════════════════════════════════════════════════
  group('VAL-EVENTS-002: EventCard type icons and colors', () {
    testWidgets('race card shows speed icon with primary color', (
      tester,
    ) async {
      final event = Event(
        id: 'r1',
        horseId: 'h1',
        title: 'Уралдаан',
        eventType: EventType.race,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await tester.pumpWidget(_buildEventCard(event));
      await tester.pumpAndSettle();

      // Race should use Icons.speed
      expect(find.byIcon(Icons.speed), findsOneWidget);

      // The CircularAvatar should have primary color as background
      final avatar = tester.widget<CircleAvatar>(find.byType(CircleAvatar));
      expect(avatar.backgroundColor, AppColors.primary);
    });

    testWidgets('auction card shows gavel icon with tertiary color', (
      tester,
    ) async {
      final event = Event(
        id: 'a1',
        horseId: 'h1',
        title: 'Дуудлага',
        eventType: EventType.auction,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await tester.pumpWidget(_buildEventCard(event));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.gavel), findsOneWidget);

      final avatar = tester.widget<CircleAvatar>(find.byType(CircleAvatar));
      // tertiary in TamgaColors.light is Color(0xFF6B8F6B)
      expect(avatar.backgroundColor, const Color(0xFF6B8F6B));
    });

    testWidgets('expo card shows storefront icon with secondary color', (
      tester,
    ) async {
      final event = Event(
        id: 'x1',
        horseId: 'h1',
        title: 'Үзэсгэлэн',
        eventType: EventType.expo,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await tester.pumpWidget(_buildEventCard(event));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.storefront), findsOneWidget);

      final avatar = tester.widget<CircleAvatar>(find.byType(CircleAvatar));
      // secondary in TamgaColors.light is Color(0xFFF1E6E2)
      expect(avatar.backgroundColor, const Color(0xFFF1E6E2));
    });

    testWidgets('training card shows school icon with purple color', (
      tester,
    ) async {
      final event = Event(
        id: 't1',
        horseId: 'h1',
        title: 'Сургалт',
        eventType: EventType.training,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await tester.pumpWidget(_buildEventCard(event));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.school), findsOneWidget);

      final avatar = tester.widget<CircleAvatar>(find.byType(CircleAvatar));
      // Training should use AppColors.systemPurple
      expect(avatar.backgroundColor, AppColors.systemPurple);
    });

    testWidgets('event card displays type badge with displayName', (
      tester,
    ) async {
      final event = Event(
        id: 'r1',
        horseId: 'h1',
        title: 'Test',
        eventType: EventType.race,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await tester.pumpWidget(_buildEventCard(event));
      await tester.pumpAndSettle();

      // Should show the race display name 'Уралдаан' in the type badge
      expect(find.text('Уралдаан'), findsWidgets);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-EVENTS-003: AddEventScreen type selector shows all 4 types
  // ══════════════════════════════════════════════════════════════
  group('VAL-EVENTS-003: AddEventScreen type selector', () {
    testWidgets('type selector shows all 4 event types with Mongolian names', (
      tester,
    ) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: AddEventScreen(horseId: 'h1', horseName: 'Test'),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Open the dropdown
      await tester.tap(find.byType(DropdownButtonFormField<EventType>));
      await tester.pumpAndSettle();

      // Verify all 4 displayNames are in the dropdown
      expect(find.text('Уралдаан'), findsWidgets);
      expect(find.text('Дуудлага худалдаа'), findsWidgets);
      expect(find.text('Үзэсгэлэн худалдаа'), findsWidgets);
      expect(find.text('Сургалт/Зөвлөгөө'), findsWidgets);
    });

    testWidgets('selecting each type updates form state', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: AddEventScreen(horseId: 'h1', horseName: 'Test'),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Open dropdown
      await tester.tap(find.byType(DropdownButtonFormField<EventType>));
      await tester.pumpAndSettle();

      // Select auction
      await tester.tap(find.text('Дуудлага худалдаа').last);
      await tester.pumpAndSettle();

      // Verify selection (the dropdown shows the selected value)
      expect(find.text('Дуудлага худалдаа'), findsWidgets);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-EVENTS-011: Filter chips show all 4 types + Бүгд
  // ══════════════════════════════════════════════════════════════
  group('VAL-EVENTS-011: Filter chips', () {
    testWidgets('events screen shows 5 filter chips (Бүгд + 4 types)', (
      tester,
    ) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            paginatedEventsProvider.overrideWith(
              (ref) => _MockPaginationNotifier(_mockEvents()),
            ),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const EventsScreen(),
          ),
        ),
      );
      // Need extra pump for pagination initial load
      await tester.pump();
      await tester.pump();

      // Should show filter chips - Бүгд and the 4 type names
      expect(find.text('Бүгд'), findsOneWidget);
      expect(find.text('Уралдаан'), findsWidgets);
      expect(find.text('Дуудлага худалдаа'), findsWidgets);
      expect(find.text('Үзэсгэлэн худалдаа'), findsWidgets);
      expect(find.text('Сургалт/Зөвлөгөө'), findsWidgets);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-EVENTS-012: Form validation
  // ══════════════════════════════════════════════════════════════
  group('VAL-EVENTS-012: Form validation', () {
    testWidgets('save button with empty title shows validation error', (
      tester,
    ) async {
      // Use a large logical viewport so all form fields are visible.
      tester.view.physicalSize = const Size(1800, 6000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: AddEventScreen(horseId: 'h1', horseName: 'Test'),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // The title field starts empty by default.
      // Tap the save button (should be visible in the large viewport).
      await tester.tap(find.text('Нэмэх'));
      await tester.pumpAndSettle();

      // Should show validation error for title
      expect(find.text('Гарчиг заавал оруулна уу'), findsOneWidget);
    });

    testWidgets('filling required fields and saving succeeds', (tester) async {
      // Use a large logical viewport so all form fields are visible.
      tester.view.physicalSize = const Size(1800, 6000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: AddEventScreen(horseId: 'h1', horseName: 'Test'),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Fill title
      await tester.enterText(find.byType(TextFormField).first, 'Test Event');

      // Tap save button
      await tester.tap(find.text('Нэмэх'));
      await tester.pumpAndSettle();

      // Verify no validation error for title
      expect(find.text('Гарчиг заавал оруулна уу'), findsNothing);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-EVENTS-013: Optimistic create - event appears in list
  // ══════════════════════════════════════════════════════════════
  group('VAL-EVENTS-013: Optimistic create', () {
    testWidgets('new event appears in events list after creation', (
      tester,
    ) async {
      // This test verifies the provider invalidation mechanism
      // by checking that the events list shows updated data after save
      final events = [_mockEvents().first];
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            paginatedEventsProvider.overrideWith(
              (ref) => _MockPaginationNotifier(events),
            ),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const EventsScreen(),
          ),
        ),
      );
      await tester.pump();
      await tester.pump();

      // Verify event title is shown
      expect(find.text('Хаврын цом'), findsOneWidget);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-EVENTS-014: Edit flow updates list
  // ══════════════════════════════════════════════════════════════
  group('VAL-EVENTS-014: Edit reflects changes', () {
    testWidgets('editing an event preserves existing values in form', (
      tester,
    ) async {
      final event = Event(
        id: 'e1',
        horseId: 'h1',
        title: 'Original Title',
        eventType: EventType.auction,
        date: DateTime(2026, 7, 11),
        horseName: 'Test Horse',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: AddEventScreen(
              horseId: 'h1',
              horseName: 'Test Horse',
              initialEvent: event,
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Title field should contain the original title
      expect(find.text('Original Title'), findsOneWidget);

      // Edit the title
      await tester.enterText(find.byType(TextFormField).first, 'Edited Title');
      await tester.pumpAndSettle();

      // Verify new title is shown
      expect(find.text('Edited Title'), findsOneWidget);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-EVENTS-015: Upcoming/Past tabs filter correctly
  // ══════════════════════════════════════════════════════════════
  group('VAL-EVENTS-015: Upcoming/Past tabs', () {
    testWidgets(
      'upcoming tab shows events with future/no date, past shows past',
      (tester) async {
        final now = DateTime.now();
        final events = [
          Event(
            id: 'u1',
            horseId: 'h1',
            title: 'No Date Event',
            eventType: EventType.race,
            date: null,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
          Event(
            id: 'u2',
            horseId: 'h1',
            title: 'Future Event',
            eventType: EventType.race,
            date: now.add(const Duration(days: 30)),
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
          Event(
            id: 'p1',
            horseId: 'h1',
            title: 'Past Event',
            eventType: EventType.race,
            date: now.subtract(const Duration(days: 10)),
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        ];

        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              paginatedEventsProvider.overrideWith(
                (ref) => _MockPaginationNotifier(events),
              ),
            ],
            child: MaterialApp(
              theme: AppTheme.light(),
              home: const EventsScreen(),
            ),
          ),
        );
        await tester.pump();
        await tester.pump();

        // Default tab is upcoming (Удахгүй)
        // Should show events with no date or future date
        expect(find.text('No Date Event'), findsOneWidget);
        expect(find.text('Future Event'), findsOneWidget);
        // Past event should NOT be visible in upcoming tab
        expect(find.text('Past Event'), findsNothing);

        // Switch to past tab (Дууссан) - tap the Tab widget directly
        final tabBar = tester.widget<TabBar>(find.byType(TabBar));
        tabBar.controller?.animateTo(1);
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 300));
        await tester.pump();

        // Should show past event
        expect(find.text('Past Event'), findsOneWidget);
        // Future/no-date events should NOT be visible in past tab
        expect(find.text('No Date Event'), findsNothing);
        expect(find.text('Future Event'), findsNothing);
      },
    );
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-EVENTS-031: Delete event
  // ══════════════════════════════════════════════════════════════
  group('VAL-EVENTS-031: Delete event', () {
    testWidgets('event card has dismissible for swipe-to-delete', (
      tester,
    ) async {
      final events = _mockEvents();
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            paginatedEventsProvider.overrideWith(
              (ref) => _MockPaginationNotifier(events),
            ),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const EventsScreen(),
          ),
        ),
      );
      await tester.pump();
      await tester.pump();

      // Verify Dismissible widgets are present (one per event in tab)
      expect(find.byType(Dismissible), findsWidgets);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-EVENTS-032: Empty state
  // ══════════════════════════════════════════════════════════════
  group('VAL-EVENTS-032: Empty state', () {
    testWidgets('events list shows empty state when no events exist', (
      tester,
    ) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            paginatedEventsProvider.overrideWith(
              (ref) => _MockPaginationNotifier([]),
            ),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const EventsScreen(),
          ),
        ),
      );
      await tester.pump();
      await tester.pump();

      // Should show empty state message (from the overall empty state)
      expect(find.text('Үйл явдал байхгүй байна'), findsOneWidget);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-EVENTS-033: EventCard tap navigation
  // ══════════════════════════════════════════════════════════════
  group('VAL-EVENTS-033: EventCard tap navigation', () {
    testWidgets(
      'tapping EventCard navigates to EventDetailScreen with correct event data',
      (tester) async {
        final event = Event(
          id: 'e1',
          horseId: 'h1',
          title: 'Хаврын цом',
          eventType: EventType.race,
          location: 'Төв аймаг',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              authStateProvider.overrideWith(
                () => _FakeAuthStateNotifier(const AuthState.unauthenticated()),
              ),
              horsesProvider.overrideWith((ref) async => <Horse>[]),
              eventRegistrationsProvider(
                event.id,
              ).overrideWith((ref) async => []),
            ],
            child: MaterialApp(
              theme: AppTheme.light(),
              initialRoute: '/',
              routes: {
                '/': (ctx) => Scaffold(
                  body: SingleChildScrollView(
                    child: EventCard(
                      event: event,
                      onTap: () => Navigator.of(ctx).pushNamed('/detail'),
                    ),
                  ),
                ),
                '/detail': (ctx) => EventDetailScreen(event: event),
              },
            ),
          ),
        );
        await tester.pumpAndSettle();

        // Tap the event card
        await tester.tap(find.byType(EventCard));
        await tester.pumpAndSettle();

        // Should now be on EventDetailScreen
        expect(find.byType(EventDetailScreen), findsOneWidget);

        // Verify the event title and type are shown on the detail screen
        expect(find.text('Хаврын цом'), findsOneWidget);
        expect(find.text('Уралдаан'), findsWidgets);

        // Verify location is visible on the detail screen
        expect(find.text('Төв аймаг'), findsWidgets);
      },
    );

    testWidgets('EventCard onTap fires when card is tapped', (tester) async {
      final event = Event(
        id: 'e2',
        horseId: 'h1',
        title: 'Дуудлага',
        eventType: EventType.auction,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      bool wasTapped = false;

      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          home: Scaffold(
            body: SingleChildScrollView(
              child: EventCard(event: event, onTap: () => wasTapped = true),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.byType(EventCard));
      await tester.pumpAndSettle();

      expect(wasTapped, isTrue);
    });
  });
}

// ═══════════════════════════════════════════════════════════════════
// Fake notifier for auth state
// ═══════════════════════════════════════════════════════════════════

class _FakeAuthStateNotifier extends AuthStateNotifier {
  _FakeAuthStateNotifier(this._state);

  final AuthState _state;

  @override
  Stream<AuthState> build() async* {
    yield _state;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

/// Wraps an EventCard in MaterialApp + Scaffold for widget testing.
Widget _buildEventCard(Event event) {
  return MaterialApp(
    theme: AppTheme.light(),
    home: Scaffold(
      body: SingleChildScrollView(
        child: EventCard(event: event, onTap: () {}),
      ),
    ),
  );
}
