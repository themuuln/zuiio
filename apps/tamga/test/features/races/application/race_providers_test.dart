import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:tamga/src/core/error/app_exception.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/features/races/application/race_providers.dart';
import 'package:tamga/src/features/races/data/race_repository.dart';
import 'package:tamga/src/features/races/domain/race.dart';
import '../../../helpers/test_helpers.dart';

// ── Mock Repository ─────────────────────────────────────────────────

class MockRaceRepository extends Mock implements RaceRepository {}

void main() {
  late MockRaceRepository mockRepository;

  setUp(() {
    mockRepository = MockRaceRepository();
  });

  group('race_providers', () {
    // ════════════════════════════════════════════════════════════
    // VAL-RACE-018: Race list providers exist
    // ════════════════════════════════════════════════════════════
    test('racesProvider returns all races from repository', () async {
      final races = <Race>[
        createMockRace(id: 'r1', name: 'Race 1', type: RaceType.naadam),
        createMockRace(id: 'r2', name: 'Race 2', type: RaceType.regional),
      ];

      when(
        () => mockRepository.fetchAll(),
      ).thenAnswer((_) async => Result.ok(races));

      final container = ProviderContainer(
        overrides: [raceRepositoryProvider.overrideWithValue(mockRepository)],
      );

      final result = await container.read(racesProvider.future);
      expect(result.length, 2);
      expect(result[0].id, 'r1');
      expect(result[1].id, 'r2');

      container.dispose();
    });

    test('upcomingRacesProvider returns only upcoming/ongoing races', () async {
      final now = DateTime.now();
      final races = <Race>[
        createMockRace(
          id: 'r1',
          name: 'Upcoming',
          status: RaceStatus.upcoming,
          date: now.add(const Duration(days: 7)),
        ),
        createMockRace(
          id: 'r2',
          name: 'Ongoing',
          status: RaceStatus.ongoing,
          date: now,
        ),
        createMockRace(
          id: 'r3',
          name: 'Completed',
          status: RaceStatus.completed,
          date: now.subtract(const Duration(days: 7)),
        ),
        createMockRace(
          id: 'r4',
          name: 'Cancelled',
          status: RaceStatus.cancelled,
          date: now.subtract(const Duration(days: 14)),
        ),
      ];

      when(
        () => mockRepository.fetchAll(),
      ).thenAnswer((_) async => Result.ok(races));

      final container = ProviderContainer(
        overrides: [raceRepositoryProvider.overrideWithValue(mockRepository)],
      );

      final result = await container.read(upcomingRacesProvider.future);
      expect(result.length, 2);
      expect(
        result.every(
          (r) =>
              r.status == RaceStatus.upcoming || r.status == RaceStatus.ongoing,
        ),
        true,
      );

      container.dispose();
    });

    test('pastRacesProvider returns only completed/cancelled races', () async {
      final now = DateTime.now();
      final races = <Race>[
        createMockRace(
          id: 'r1',
          name: 'Upcoming',
          status: RaceStatus.upcoming,
          date: now.add(const Duration(days: 7)),
        ),
        createMockRace(
          id: 'r2',
          name: 'Completed',
          status: RaceStatus.completed,
          date: now.subtract(const Duration(days: 7)),
        ),
        createMockRace(
          id: 'r3',
          name: 'Cancelled',
          status: RaceStatus.cancelled,
          date: now.subtract(const Duration(days: 14)),
        ),
      ];

      when(
        () => mockRepository.fetchAll(),
      ).thenAnswer((_) async => Result.ok(races));

      final container = ProviderContainer(
        overrides: [raceRepositoryProvider.overrideWithValue(mockRepository)],
      );

      final result = await container.read(pastRacesProvider.future);
      expect(result.length, 2);
      expect(
        result.every(
          (r) =>
              r.status == RaceStatus.completed ||
              r.status == RaceStatus.cancelled,
        ),
        true,
      );

      container.dispose();
    });

    test('racesByTypeProvider filters correctly by race type', () async {
      final races = <Race>[
        createMockRace(id: 'r1', name: 'Naadam', type: RaceType.naadam),
        createMockRace(id: 'r2', name: 'Regional', type: RaceType.regional),
        createMockRace(id: 'r3', name: 'Local', type: RaceType.local),
        createMockRace(id: 'r4', name: 'Naadam 2', type: RaceType.naadam),
      ];

      when(
        () => mockRepository.fetchAll(),
      ).thenAnswer((_) async => Result.ok(races));

      final container = ProviderContainer(
        overrides: [raceRepositoryProvider.overrideWithValue(mockRepository)],
      );

      final naadamRaces = await container.read(
        racesByTypeProvider(RaceType.naadam).future,
      );
      expect(naadamRaces.length, 2);
      expect(naadamRaces.every((r) => r.type == RaceType.naadam), true);

      final regionalRaces = await container.read(
        racesByTypeProvider(RaceType.regional).future,
      );
      expect(regionalRaces.length, 1);
      expect(regionalRaces.first.type, RaceType.regional);

      final localRaces = await container.read(
        racesByTypeProvider(RaceType.local).future,
      );
      expect(localRaces.length, 1);
      expect(localRaces.first.type, RaceType.local);

      container.dispose();
    });

    test('raceDetailProvider returns specific race by id', () async {
      when(() => mockRepository.fetchById('r1')).thenAnswer(
        (_) async => Result.ok(createMockRace(id: 'r1', name: 'Race One')),
      );

      when(() => mockRepository.fetchById('r2')).thenAnswer(
        (_) async => Result.ok(createMockRace(id: 'r2', name: 'Race Two')),
      );

      final container = ProviderContainer(
        overrides: [raceRepositoryProvider.overrideWithValue(mockRepository)],
      );

      final race1 = await container.read(raceDetailProvider('r1').future);
      expect(race1.id, 'r1');
      expect(race1.name, 'Race One');

      final race2 = await container.read(raceDetailProvider('r2').future);
      expect(race2.id, 'r2');
      expect(race2.name, 'Race Two');

      container.dispose();
    });

    test('raceDetailProvider throws when race not found', () async {
      when(() => mockRepository.fetchById('nonexistent')).thenAnswer(
        (_) async => Result.fail(
          AppException(message: 'Уралдаан олдсонгүй', code: 'RACE_NOT_FOUND'),
        ),
      );

      final container = ProviderContainer(
        overrides: [raceRepositoryProvider.overrideWithValue(mockRepository)],
      );

      expect(
        () => container.read(raceDetailProvider('nonexistent').future),
        throwsException,
      );

      container.dispose();
    });
  });
}
