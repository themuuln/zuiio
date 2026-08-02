import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:tamga/src/core/error/app_exception.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/features/horses/application/horses_providers.dart';
import 'package:tamga/src/features/horses/data/horses_repository.dart';
import 'package:tamga/src/shared/domain/horse.dart';

class MockHorsesRepository extends Mock implements HorsesRepository {}

Horse _horse({required String id, bool isOwnedByHousehold = true}) {
  return Horse(
    id: id,
    name: 'Horse $id',
    relationLabel: '',
    coat: 'Хээр',
    birthYear: 2020,
    awardCount: 0,
    offspringCount: 0,
    isOwnedByHousehold: isOwnedByHousehold,
    notes: '',
    gender: HorseGender.gelding,
    createdAt: DateTime(2026, 1, 1),
    updatedAt: DateTime(2026, 1, 1),
  );
}

void main() {
  late MockHorsesRepository mockRepository;

  setUp(() {
    mockRepository = MockHorsesRepository();
  });

  ProviderContainer containerWith() {
    return ProviderContainer(
      overrides: [
        horsesRepositoryProvider.overrideWith((ref) async => mockRepository),
      ],
    );
  }

  group('horsesProvider', () {
    test('returns the repository list', () async {
      final horses = [_horse(id: 'h1'), _horse(id: 'h2')];
      when(
        () => mockRepository.fetchHorses(),
      ).thenAnswer((_) async => Result.ok(horses));

      final container = containerWith();
      addTearDown(container.dispose);

      final result = await container.read(horsesProvider.future);

      expect(result.map((h) => h.id), ['h1', 'h2']);
    });

    test('rethrows the repository failure via getOrThrow', () async {
      when(() => mockRepository.fetchHorses()).thenAnswer(
        (_) async => Result.fail(
          const AppException(code: 'FETCH_HORSES_ERROR', message: 'Алдаа'),
        ),
      );

      final container = containerWith();
      addTearDown(container.dispose);

      expect(
        () => container.read(horsesProvider.future),
        throwsA(isA<AppException>()),
      );
    });

    test('recomputes when invalidated (counter-based)', () async {
      var fetchCalls = 0;
      when(() => mockRepository.fetchHorses()).thenAnswer((_) async {
        fetchCalls++;
        return Result.ok(const <Horse>[]);
      });

      final container = containerWith();
      addTearDown(container.dispose);

      await container.read(horsesProvider.future);
      expect(fetchCalls, 1);

      container.invalidate(horsesProvider);
      await container.read(horsesProvider.future);
      expect(fetchCalls, 2);
    });
  });

  group('householdHorseCountProvider', () {
    test('counts only household horses', () async {
      when(() => mockRepository.fetchHorses()).thenAnswer(
        (_) async => Result.ok([
          _horse(id: 'hh1', isOwnedByHousehold: true),
          _horse(id: 'ext1', isOwnedByHousehold: false),
          _horse(id: 'hh2', isOwnedByHousehold: true),
        ]),
      );

      final container = containerWith();
      addTearDown(container.dispose);

      expect(await container.read(householdHorseCountProvider.future), 2);
    });
  });

  group('externalHorseCountProvider', () {
    test('counts only external horses', () async {
      when(() => mockRepository.fetchHorses()).thenAnswer(
        (_) async => Result.ok([
          _horse(id: 'hh1', isOwnedByHousehold: true),
          _horse(id: 'ext1', isOwnedByHousehold: false),
        ]),
      );

      final container = containerWith();
      addTearDown(container.dispose);

      expect(await container.read(externalHorseCountProvider.future), 1);
    });

    test(
      'recomputes when the horses list is invalidated (counter-based)',
      () async {
        var fetchCalls = 0;
        when(() => mockRepository.fetchHorses()).thenAnswer((_) async {
          fetchCalls++;
          return Result.ok([_horse(id: 'hh1', isOwnedByHousehold: true)]);
        });

        final container = containerWith();
        addTearDown(container.dispose);

        expect(await container.read(householdHorseCountProvider.future), 1);
        expect(fetchCalls, 1);

        container.invalidate(horsesProvider);
        expect(await container.read(householdHorseCountProvider.future), 1);
        expect(fetchCalls, 2);
      },
    );
  });

  group('horseOwnershipFilterProvider', () {
    test('defaults to all', () {
      final container = containerWith();
      addTearDown(container.dispose);

      expect(
        container.read(horseOwnershipFilterProvider),
        HorseOwnershipFilter.all,
      );
    });

    test('labels map to Mongolian UI strings', () {
      expect(HorseOwnershipFilter.all.label, 'Бүгд');
      expect(HorseOwnershipFilter.household.label, 'Өрхийн');
      expect(HorseOwnershipFilter.external.label, 'Гаднах');
    });
  });
}
