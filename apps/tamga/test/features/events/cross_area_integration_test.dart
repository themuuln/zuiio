/// Хөндлөн интеграцийн тестүүд — Partner Dashboard, Featured Events,
/// TournamentProfile, Events жагсаалтын хоорондын урсгалыг баталгаажуулна.
///
/// VAL-CROSS-001: Онцлох арга хэмжээ үүсгэх → нүүр хуудсанд харагдах
/// VAL-CROSS-002: Арга хэмжээ дуусгах → TournamentProfile шинэчлэгдэх
/// VAL-CROSS-004: Арга хэмжээ засах → Events жагсаалтад тусгагдах
library;

import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/features/events/application/auto_achievement_service.dart';
import 'package:tamga/src/features/events/application/events_providers.dart';
import 'package:tamga/src/features/events/data/event_repository.dart';
import 'package:tamga/src/features/events/domain/tournament_profile.dart';
import 'package:tamga/src/shared/domain/event.dart';

// ── Mock EventRepository ───────────────────────────────────────────

class MockEventRepository extends EventRepository {
  List<Event> _events = [];

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

/// Өнгөрсөн огноо (auto-achievement тооцоход).
final _pastDate = DateTime.now().subtract(const Duration(days: 10));

/// Ирээдүйн огноо.
final _futureDate = DateTime.now().add(const Duration(days: 30));

void main() {
  // ═══════════════════════════════════════════════════════════════════
  // VAL-CROSS-001: Featured event from Partner Dashboard → Home page
  // ═══════════════════════════════════════════════════════════════════
  group(
    'VAL-CROSS-001: Creating featured event from Partner Dashboard makes it appear on home page',
    () {
      test('creating featured event updates featuredEventsProvider', () async {
        final mockRepo = MockEventRepository();
        final ownerId = 'test-user-1';

        // Initially no events
        mockRepo.setEvents([]);

        // Provider container with mock repository
        final container = ProviderContainer(
          overrides: [
            localEventRepositoryProvider.overrideWith((ref) => mockRepo),
          ],
        );

        // Initially no featured events
        var featuredEvents = await container.read(
          featuredEventsProvider.future,
        );
        expect(featuredEvents, isEmpty);

        // Create a featured event (as Partner Dashboard would)
        final featuredEvent = Event(
          id: 'feat-evt-1',
          horseId: 'horse-1',
          title: 'Онцлох тэмцээн',
          eventType: EventType.race,
          ownerId: ownerId,
          date: _futureDate,
          isFeatured: true,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        final saveResult = await mockRepo.saveEvent(featuredEvent);
        expect(saveResult.isSuccess, true);

        // Need to invalidate the provider to see the new event
        container.invalidate(featuredEventsProvider);

        // Now featured events should include the new event
        featuredEvents = await container.read(featuredEventsProvider.future);
        expect(featuredEvents.length, 1);
        expect(featuredEvents.first.title, 'Онцлох тэмцээн');
        expect(featuredEvents.first.isFeatured, true);

        // Non-featured events should NOT appear in featured events
        final nonFeaturedEvent = Event(
          id: 'normal-evt-1',
          horseId: 'horse-1',
          title: 'Энгийн тэмцээн',
          eventType: EventType.training,
          ownerId: ownerId,
          isFeatured: false,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        await mockRepo.saveEvent(nonFeaturedEvent);
        container.invalidate(featuredEventsProvider);

        featuredEvents = await container.read(featuredEventsProvider.future);
        expect(featuredEvents.length, 1); // Still only 1 featured
        expect(featuredEvents.first.title, 'Онцлох тэмцээн');

        container.dispose();
      });

      test(
        'partner dashboard events include newly created featured event',
        () async {
          final mockRepo = MockEventRepository();
          final ownerId = 'test-user-1';

          mockRepo.setEvents([]);

          final container = ProviderContainer(
            overrides: [
              localEventRepositoryProvider.overrideWith((ref) => mockRepo),
              // Override authStateProvider to return authenticated user
              // We use eventRepositoryProvider for all lookups
            ],
          );

          // Create a featured event via repo (simulating Partner Dashboard save)
          final event = Event(
            id: 'evt-1',
            horseId: 'horse-1',
            title: 'Онцлох тэмцээн',
            eventType: EventType.race,
            ownerId: ownerId,
            isFeatured: true,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          );

          await mockRepo.saveEvent(event);

          // Verify the event is in the repo's data store
          final allEvents = await mockRepo.fetchEventsByOwner(ownerId);
          expect(allEvents.isSuccess, true);
          expect(allEvents.value.length, 1);
          expect(allEvents.value.first.isFeatured, true);

          container.dispose();
        },
      );
    },
  );

  // ═══════════════════════════════════════════════════════════════════
  // VAL-CROSS-002: Completing event from Partner Dashboard → TournamentProfile
  // ═══════════════════════════════════════════════════════════════════
  group(
    'VAL-CROSS-002: Completing event from Partner Dashboard updates TournamentProfile',
    () {
      late AutoAchievementService service;

      setUp(() {
        service = const AutoAchievementService();
      });

      test(
        'auto-achievement updates TournamentProfile when event is completed',
        () {
          // Initial TournamentProfile
          final profile = TournamentProfile(
            horseId: 'horse-1',
            horseName: 'Хан хүлэг',
            totalRaces: 5,
            firstPlace: 2,
            secondPlace: 1,
            thirdPlace: 0,
            participationCount: 5,
            totalPrizeMoney: 1000000,
            recentResults: [],
            bestAchievement: null,
            lastRaceDate: null,
          );

          // Completed event with 1st place result (simulating Partner Dashboard)
          final completedEvent = Event(
            id: 'evt-completed',
            horseId: 'horse-1',
            title: 'Хаврын цом',
            eventType: EventType.race,
            date: _pastDate,
            result: '1-р байр',
            prizeAmount: 2000000,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          );

          // Process the completed event
          final updatedProfile = service.processCompletedEvent(
            currentProfile: profile,
            completedEvent: completedEvent,
          );

          // TournamentProfile should be updated
          expect(updatedProfile.totalRaces, 6);
          expect(updatedProfile.firstPlace, 3); // 2 + 1
          expect(updatedProfile.secondPlace, 1); // unchanged
          expect(updatedProfile.thirdPlace, 0); // unchanged
          expect(updatedProfile.totalPrizeMoney, 3000000); // 1M + 2M
          expect(
            updatedProfile.bestAchievement,
            'Хаврын цом',
          ); // best achievement updated
          expect(updatedProfile.lastRaceDate, _pastDate);

          // Recent results should include the new event
          expect(updatedProfile.recentResults.length, 1);
          expect(updatedProfile.recentResults.first.eventName, 'Хаврын цом');
          expect(updatedProfile.recentResults.first.place, 1);
          expect(updatedProfile.recentResults.first.prize, 2000000);
        },
      );

      test('completed event with 2nd place increments secondPlace counter', () {
        final profile = TournamentProfile(
          horseId: 'horse-1',
          horseName: 'Хан хүлэг',
          totalRaces: 5,
          firstPlace: 2,
          secondPlace: 1,
          thirdPlace: 0,
          participationCount: 5,
          totalPrizeMoney: 1000000,
          recentResults: [],
          bestAchievement: null,
          lastRaceDate: null,
        );

        final completedEvent = Event(
          id: 'evt-2nd',
          horseId: 'horse-1',
          title: 'Намрын цом',
          eventType: EventType.race,
          date: _pastDate,
          result: '2-р байр',
          prizeAmount: 500000,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        final updated = service.processCompletedEvent(
          currentProfile: profile,
          completedEvent: completedEvent,
        );

        expect(updated.totalRaces, 6);
        expect(updated.firstPlace, 2); // unchanged
        expect(updated.secondPlace, 2); // incremented
        expect(updated.thirdPlace, 0);
        expect(updated.totalPrizeMoney, 1500000);
      });

      test(
        'non-completed event (no result) does not update TournamentProfile',
        () {
          final profile = TournamentProfile(
            horseId: 'horse-1',
            horseName: 'Хан хүлэг',
            totalRaces: 5,
            firstPlace: 2,
            secondPlace: 1,
            thirdPlace: 0,
            participationCount: 5,
            totalPrizeMoney: 1000000,
            recentResults: [],
            bestAchievement: null,
            lastRaceDate: null,
          );

          // Event saved without result (not yet completed)
          final nonCompletedEvent = Event(
            id: 'evt-nc',
            horseId: 'horse-1',
            title: 'Дуусаагүй',
            eventType: EventType.race,
            date: _pastDate,
            // result is null — not completed
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          );

          final updated = service.processCompletedEvent(
            currentProfile: profile,
            completedEvent: nonCompletedEvent,
          );

          // Profile should be unchanged
          expect(updated.totalRaces, 5);
          expect(updated.firstPlace, 2);
          expect(updated.secondPlace, 1);
          expect(updated.totalPrizeMoney, 1000000);
        },
      );

      test('isCompleted detects properly formed completed events', () {
        // Completed event: has result AND past date
        final completed = Event(
          id: 'e1',
          horseId: 'h1',
          title: 'Дууссан',
          eventType: EventType.race,
          date: _pastDate,
          result: 'Түрүү',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
        expect(service.isCompleted(completed), true);

        // Future date with result = not completed
        final futureEvent = Event(
          id: 'e2',
          horseId: 'h1',
          title: 'Ирээдүйн',
          eventType: EventType.race,
          date: _futureDate,
          result: 'Түрүү',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
        expect(service.isCompleted(futureEvent), false);

        // Past date without result = not completed
        final noResult = Event(
          id: 'e3',
          horseId: 'h1',
          title: 'Үр дүнгүй',
          eventType: EventType.race,
          date: _pastDate,
          // no result
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
        expect(service.isCompleted(noResult), false);
      });
    },
  );

  // ═══════════════════════════════════════════════════════════════════
  // VAL-CROSS-004: Editing event from Partner Dashboard → Events list
  // ═══════════════════════════════════════════════════════════════════
  group(
    'VAL-CROSS-004: Editing event from Partner Dashboard reflects in Events list',
    () {
      test('editing event title via repo updates events list', () async {
        final mockRepo = MockEventRepository();
        final ownerId = 'partner-1';

        // Initial event with original title
        final originalEvent = Event(
          id: 'evt-1',
          horseId: 'horse-1',
          title: 'Хуучин гарчиг',
          eventType: EventType.race,
          ownerId: ownerId,
          date: _futureDate,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        await mockRepo.saveEvent(originalEvent);

        // Verify original title in events list
        var allEvents = await mockRepo.fetchEvents();
        expect(allEvents.isSuccess, true);
        expect(allEvents.value.length, 1);
        expect(allEvents.value.first.title, 'Хуучин гарчиг');

        // Edit event (as Partner Dashboard would) — change title
        final editedEvent = originalEvent.copyWith(title: 'Шинэ гарчиг');

        final saveResult = await mockRepo.saveEvent(editedEvent);
        expect(saveResult.isSuccess, true);

        // Verify updated title in events list
        allEvents = await mockRepo.fetchEvents();
        expect(allEvents.value.length, 1);
        expect(allEvents.value.first.title, 'Шинэ гарчиг');
        expect(allEvents.value.first.title, isNot('Хуучин гарчиг'));
      });

      test('editing event date updates it in the events list', () async {
        final mockRepo = MockEventRepository();

        final originalEvent = Event(
          id: 'evt-2',
          horseId: 'horse-1',
          title: 'Тэмцээн',
          eventType: EventType.auction,
          ownerId: 'partner-1',
          date: DateTime(2026, 1, 1),
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        await mockRepo.saveEvent(originalEvent);

        // Edit date
        final editedEvent = originalEvent.copyWith(date: DateTime(2026, 6, 15));
        await mockRepo.saveEvent(editedEvent);

        final events = await mockRepo.fetchEvents();
        expect(events.value.first.date, DateTime(2026, 6, 15));
      });

      test('editing event type updates it in the events list', () async {
        final mockRepo = MockEventRepository();

        final originalEvent = Event(
          id: 'evt-3',
          horseId: 'horse-1',
          title: 'Тэмцээн',
          eventType: EventType.race,
          ownerId: 'partner-1',
          date: _futureDate,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        await mockRepo.saveEvent(originalEvent);

        // Edit type
        final editedEvent = originalEvent.copyWith(
          eventType: EventType.training,
        );
        await mockRepo.saveEvent(editedEvent);

        final events = await mockRepo.fetchEvents();
        expect(events.value.first.eventType, EventType.training);
      });

      test(
        'editing event title is reflected via eventsProvider in ProviderContainer',
        () async {
          final mockRepo = MockEventRepository();
          final initialEvent = Event(
            id: 'evt-provider',
            horseId: 'horse-1',
            title: 'Анхны гарчиг',
            eventType: EventType.race,
            ownerId: 'partner-1',
            date: _futureDate,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          );

          await mockRepo.saveEvent(initialEvent);

          final container = ProviderContainer(
            overrides: [
              localEventRepositoryProvider.overrideWith((ref) => mockRepo),
            ],
          );

          // Read events via provider
          var events = await container.read(eventsProvider.future);
          expect(events.length, 1);
          expect(events.first.title, 'Анхны гарчиг');

          // Edit event via repo (simulating Partner Dashboard save)
          final edited = initialEvent.copyWith(title: 'Зассан гарчиг');
          await mockRepo.saveEvent(edited);

          // Invalidate provider
          container.invalidate(eventsProvider);

          // Read again
          events = await container.read(eventsProvider.future);
          expect(events.length, 1);
          expect(events.first.title, 'Зассан гарчиг');

          container.dispose();
        },
      );
    },
  );
}
