import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/features/events/application/auto_achievement_service.dart';
import 'package:tamga/src/features/events/application/auto_achievement_provider.dart';
import 'package:tamga/src/features/events/data/event_registration_repository.dart';
import 'package:tamga/src/features/events/domain/tournament_profile.dart';
import 'package:tamga/src/shared/domain/event.dart';
import 'package:tamga/src/shared/domain/event_registration.dart';

// ── Mock classes ─────────────────────────────────────────────────────

class MockEventRegistrationRepository extends Mock
    implements EventRegistrationRepository {}

// ── Test constants ───────────────────────────────────────────────────

/// Одоогоос 10 хоногийн өмнөх огноо (өнгөрсөн).
final _pastDate = DateTime.now().subtract(const Duration(days: 10));

/// Одоогоос 10 хоногийн дараах огноо (ирээдүй).
final _futureDate = DateTime.now().add(const Duration(days: 10));

/// Суурь профайл.
final _baseProfile = TournamentProfile(
  horseId: 'horse-1',
  horseName: 'Хан хүлэг',
  totalRaces: 5,
  firstPlace: 2,
  secondPlace: 1,
  thirdPlace: 0,
  participationCount: 5,
  totalPrizeMoney: 1000000,
  recentResults: [
    TournamentResult(
      eventId: 'old-1',
      eventName: 'Өмнөх тэмцээн',
      date: DateTime(2026, 5, 1),
      place: 1,
      participants: 10,
      prize: 500000,
    ),
    TournamentResult(
      eventId: 'old-2',
      eventName: 'Урьдчилсан',
      date: DateTime(2026, 3, 1),
      place: 2,
      participants: 8,
      prize: 300000,
    ),
  ],
  bestAchievement: 'Өмнөх тэмцээн',
  lastRaceDate: DateTime(2026, 5, 1),
);

void main() {
  // ═══════════════════════════════════════════════════════════════════
  // AutoAchievementService
  // ═══════════════════════════════════════════════════════════════════
  group('AutoAchievementService', () {
    late AutoAchievementService service;

    setUp(() {
      service = const AutoAchievementService();
    });

    // ── isCompleted ──────────────────────────────────────────────────

    test('isCompleted returns true for event with result and past date', () {
      final event = Event(
        id: 'e1',
        horseId: 'h1',
        title: 'Дууссан тэмцээн',
        eventType: EventType.race,
        date: _pastDate,
        result: '1-р байр',
        prizeAmount: 500000,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      expect(service.isCompleted(event), isTrue);
    });

    test('isCompleted returns false for event with result but future date', () {
      final event = Event(
        id: 'e2',
        horseId: 'h1',
        title: 'Ирээдүйн тэмцээн',
        eventType: EventType.race,
        date: _futureDate,
        result: '1-р байр',
        prizeAmount: 500000,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      expect(service.isCompleted(event), isFalse);
    });

    test('isCompleted returns false for event with no result', () {
      final event = Event(
        id: 'e3',
        horseId: 'h1',
        title: 'Тэмцээн',
        eventType: EventType.race,
        date: _pastDate,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      expect(service.isCompleted(event), isFalse);
    });

    test('isCompleted returns false for event with empty result', () {
      final event = Event(
        id: 'e4',
        horseId: 'h1',
        title: 'Тэмцээн',
        eventType: EventType.race,
        date: _pastDate,
        result: '',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      expect(service.isCompleted(event), isFalse);
    });

    test('isCompleted returns false for event with no date (upcoming)', () {
      final event = Event(
        id: 'e5',
        horseId: 'h1',
        title: 'Тэмцээн',
        eventType: EventType.race,
        date: null,
        result: '1-р байр',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      expect(service.isCompleted(event), isFalse);
    });

    // ── parsePlace ───────────────────────────────────────────────────

    test('parsePlace returns 1 for "Түрүү"', () {
      expect(service.parsePlace('Түрүү'), 1);
    });

    test('parsePlace returns 1 for "түрүү" (lowercase)', () {
      expect(service.parsePlace('түрүү'), 1);
    });

    test('parsePlace returns 1 for "1-р байр"', () {
      expect(service.parsePlace('1-р байр'), 1);
    });

    test('parsePlace returns 2 for "2-р байр"', () {
      expect(service.parsePlace('2-р байр'), 2);
    });

    test('parsePlace returns 3 for "3-р байр"', () {
      expect(service.parsePlace('3-р байр'), 3);
    });

    test('parsePlace returns 0 for "Оролцсон"', () {
      expect(service.parsePlace('Оролцсон'), 0);
    });

    test('parsePlace returns 0 for "Амжилттай"', () {
      expect(service.parsePlace('Амжилттай'), 0);
    });

    test('parsePlace returns 0 for empty string', () {
      expect(service.parsePlace(''), 0);
    });

    // ── processCompletedEvent ────────────────────────────────────────

    test(
      'processCompletedEvent increments firstPlace for 1st place result',
      () {
        final completedEvent = Event(
          id: 'new-1',
          horseId: 'h1',
          title: 'Шинэ тэмцээн',
          eventType: EventType.race,
          date: _pastDate,
          result: '1-р байр',
          prizeAmount: 1000000,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        final updated = service.processCompletedEvent(
          currentProfile: _baseProfile,
          completedEvent: completedEvent,
        );

        expect(updated.firstPlace, _baseProfile.firstPlace + 1);
        expect(updated.totalRaces, _baseProfile.totalRaces + 1);
      },
    );

    test('processCompletedEvent increments prize money total', () {
      final completedEvent = Event(
        id: 'new-2',
        horseId: 'h1',
        title: 'Шинэ тэмцээн',
        eventType: EventType.race,
        date: _pastDate,
        result: '2-р байр',
        prizeAmount: 750000,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final updated = service.processCompletedEvent(
        currentProfile: _baseProfile,
        completedEvent: completedEvent,
      );

      expect(
        updated.totalPrizeMoney,
        _baseProfile.totalPrizeMoney + 750000,
      );
      expect(updated.secondPlace, _baseProfile.secondPlace + 1);
    });

    test('processCompletedEvent adds completed event to recent results', () {
      final completedEvent = Event(
        id: 'new-3',
        horseId: 'h1',
        title: 'Шинэ тэмцээн',
        eventType: EventType.race,
        date: _pastDate,
        result: '3-р байр',
        prizeAmount: 250000,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final updated = service.processCompletedEvent(
        currentProfile: _baseProfile,
        completedEvent: completedEvent,
      );

      // Recent results should start with the new result (newest first)
      expect(updated.recentResults.length, _baseProfile.recentResults.length + 1);
      expect(updated.recentResults.first.eventId, 'new-3');
      expect(updated.recentResults.first.eventName, 'Шинэ тэмцээн');
      expect(updated.recentResults.first.place, 3);
      expect(updated.recentResults.first.prize, 250000);
      expect(updated.thirdPlace, _baseProfile.thirdPlace + 1);
    });

    test(
      'processCompletedEvent returns unchanged profile for non-completed event',
      () {
        // Event with no result (not completed)
        final nonCompletedEvent = Event(
          id: 'new-4',
          horseId: 'h1',
          title: 'Дуусаагүй',
          eventType: EventType.race,
          date: _pastDate,
          // result is null — not completed
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        final updated = service.processCompletedEvent(
          currentProfile: _baseProfile,
          completedEvent: nonCompletedEvent,
        );

        // Profile should remain unchanged
        expect(updated.totalRaces, _baseProfile.totalRaces);
        expect(updated.firstPlace, _baseProfile.firstPlace);
        expect(updated.totalPrizeMoney, _baseProfile.totalPrizeMoney);
        expect(updated.recentResults.length, _baseProfile.recentResults.length);
      },
    );

    test(
      'processCompletedEvent sets bestAchievement if first 1st place win',
      () {
        // Profile with no bestAchievement and no wins
        final noWinProfile = TournamentProfile(
          horseId: 'horse-1',
          horseName: 'Хан хүлэг',
          totalRaces: 3,
          firstPlace: 0,
          secondPlace: 0,
          thirdPlace: 0,
          participationCount: 3,
          totalPrizeMoney: 0,
          recentResults: [],
          bestAchievement: null,
          lastRaceDate: null,
        );

        final completedEvent = Event(
          id: 'new-5',
          horseId: 'h1',
          title: 'Анхны ялалт',
          eventType: EventType.race,
          date: _pastDate,
          result: 'Түрүү',
          prizeAmount: 1000000,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        final updated = service.processCompletedEvent(
          currentProfile: noWinProfile,
          completedEvent: completedEvent,
        );

        expect(updated.bestAchievement, 'Анхны ялалт');
      },
    );

    test(
      'processCompletedEvent with no prize sets prize to null in result',
      () {
        final completedEvent = Event(
          id: 'new-6',
          horseId: 'h1',
          title: 'Шагналгүй',
          eventType: EventType.race,
          date: _pastDate,
          result: '1-р байр',
          // prizeAmount is null
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        final updated = service.processCompletedEvent(
          currentProfile: _baseProfile,
          completedEvent: completedEvent,
        );

        expect(updated.totalPrizeMoney, _baseProfile.totalPrizeMoney);
        expect(updated.recentResults.first.prize, isNull);
      },
    );
  });

  // ═══════════════════════════════════════════════════════════════════
  // VAL-EVENTS-005: Auto-achievement integration
  // ═══════════════════════════════════════════════════════════════════
  group('VAL-EVENTS-005: Auto-achievement', () {
    test('TournamentProfile wins and prizeMoney update after event completion', () {
      // Create a base TournamentProfile with known stats
      final profile = TournamentProfile(
        horseId: 'horse-1',
        horseName: 'Хан хүлэг',
        totalRaces: 5,
        firstPlace: 2,
        secondPlace: 1,
        thirdPlace: 0,
        participationCount: 5,
        totalPrizeMoney: 1000000,
        recentResults: [
          TournamentResult(
            eventId: 'old-1',
            eventName: 'Өмнөх тэмцээн',
            date: DateTime(2026, 5, 1),
            place: 1,
            participants: 10,
            prize: 500000,
          ),
        ],
        bestAchievement: 'Өмнөх тэмцээн',
        lastRaceDate: DateTime(2026, 5, 1),
      );

      // Complete an event with result and prize
      final completedEvent = Event(
        id: 'new-race',
        horseId: 'horse-1',
        title: 'Хаврын цом',
        eventType: EventType.race,
        date: _pastDate,
        result: '1-р байр',
        prizeAmount: 2000000,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      // Trigger auto-achievement logic
      final service = const AutoAchievementService();
      final updated = service.processCompletedEvent(
        currentProfile: profile,
        completedEvent: completedEvent,
      );

      // Assertions
      // Wins count increments correctly based on result (1st place)
      expect(updated.totalRaces, 6, reason: 'totalRaces should increment by 1');
      expect(
        updated.firstPlace,
        3,
        reason: 'firstPlace should increment by 1 for 1st place result',
      );
      expect(
        updated.secondPlace,
        1,
        reason: 'secondPlace should remain unchanged',
      );
      expect(
        updated.thirdPlace,
        0,
        reason: 'thirdPlace should remain unchanged',
      );

      // Prize money is added to total
      expect(
        updated.totalPrizeMoney,
        3000000,
        reason: 'totalPrizeMoney should be 1,000,000 + 2,000,000 = 3,000,000',
      );

      // Recent results list includes the completed event at the top
      expect(updated.recentResults.length, 2);
      expect(
        updated.recentResults.first.eventId,
        'new-race',
        reason: 'newest result should be first',
      );
      expect(updated.recentResults.first.eventName, 'Хаврын цом');
      expect(updated.recentResults.first.place, 1);
      expect(updated.recentResults.first.prize, 2000000);
      expect(
        updated.recentResults.first.notes,
        '1-р байр',
        reason: 'notes should contain the result text',
      );
    });

    test('processEventCompletion fetches registrations for completed events', () async {
      final repo = MockEventRegistrationRepository();
      final event = Event(
        id: 'evt-1',
        horseId: 'h1',
        title: 'Completed',
        eventType: EventType.race,
        date: _pastDate,
        result: 'Түрүү',
        prizeAmount: 500000,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final reg = EventRegistration(
        id: 'reg-1',
        eventId: 'evt-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        registeredAt: _pastDate,
        status: RegistrationStatus.registered,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      when(() => repo.fetchRegistrations('evt-1'))
          .thenAnswer((_) async => Result.ok([reg]));

      final invalidatedHorses = <String>[];
      await processEventCompletion(
        event: event,
        registrationRepo: repo,
        invalidateProfile: (horseId) => invalidatedHorses.add(horseId),
      );

      verify(() => repo.fetchRegistrations('evt-1')).called(1);
      // Should have invalidated the horse's tournament profile
      expect(invalidatedHorses, contains('horse-1'));
    });

    test('processEventCompletion does nothing for non-completed event', () async {
      final repo = MockEventRegistrationRepository();
      final event = Event(
        id: 'evt-1',
        horseId: 'h1',
        title: 'Not completed',
        eventType: EventType.race,
        date: _futureDate, // future date = not completed
        result: 'Түрүү',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final invalidatedHorses = <String>[];
      await processEventCompletion(
        event: event,
        registrationRepo: repo,
        invalidateProfile: (horseId) => invalidatedHorses.add(horseId),
      );

      // Should NOT fetch registrations for non-completed event
      verifyNever(() => repo.fetchRegistrations(any()));
      expect(invalidatedHorses, isEmpty);
    });

    test('processEventCompletion with cancelled registrations skips them', () async {
      final repo = MockEventRegistrationRepository();
      final event = Event(
        id: 'evt-1',
        horseId: 'h1',
        title: 'Completed',
        eventType: EventType.race,
        date: _pastDate,
        result: '1-р байр',
        prizeAmount: 500000,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final regs = [
        EventRegistration(
          id: 'reg-1',
          eventId: 'evt-1',
          horseId: 'horse-1',
          ownerId: 'user-1',
          registeredAt: _pastDate,
          status: RegistrationStatus.cancelled, // cancelled
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
        EventRegistration(
          id: 'reg-2',
          eventId: 'evt-1',
          horseId: 'horse-2',
          ownerId: 'user-2',
          registeredAt: _pastDate,
          status: RegistrationStatus.registered, // active
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      ];

      when(() => repo.fetchRegistrations('evt-1'))
          .thenAnswer((_) async => Result.ok(regs));

      final invalidatedHorses = <String>[];
      await processEventCompletion(
        event: event,
        registrationRepo: repo,
        invalidateProfile: (horseId) => invalidatedHorses.add(horseId),
      );

      verify(() => repo.fetchRegistrations('evt-1')).called(1);
      // Should only invalidate the active registration's horse (horse-2)
      expect(invalidatedHorses, ['horse-2']);
      // Should NOT invalidate the cancelled horse
      expect(invalidatedHorses, isNot(contains('horse-1')));
    });
  });
}
