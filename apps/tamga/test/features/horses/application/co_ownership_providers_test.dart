import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:tamga/src/core/error/app_exception.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/features/horses/application/co_ownership_providers.dart';
import 'package:tamga/src/features/horses/data/co_ownership_repository.dart';
import 'package:tamga/src/features/horses/domain/co_ownership.dart';

class MockCoOwnershipRepository extends Mock implements CoOwnershipRepository {}

CoOwnershipRecord _record({String id = 'co-1', String horseId = 'horse-1'}) {
  return CoOwnershipRecord(
    id: id,
    horseId: horseId,
    coOwnerName: 'Хамтран эзэмшигч',
    phone: '99112233',
    role: 'Туслах уяач',
    permissions: const ['read'],
    createdAt: DateTime(2026, 1, 1),
    updatedAt: DateTime(2026, 1, 1),
  );
}

void main() {
  late MockCoOwnershipRepository mockRepository;

  setUp(() {
    mockRepository = MockCoOwnershipRepository();
  });

  ProviderContainer containerWith() {
    return ProviderContainer(
      overrides: [
        coOwnershipRepositoryProvider.overrideWithValue(mockRepository),
      ],
    );
  }

  group('coOwnershipRepositoryProvider', () {
    test('selects the local repository when Supabase is not configured', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final repo = container.read(coOwnershipRepositoryProvider);

      expect(repo, isA<LocalCoOwnershipRepository>());
      expect(repo, isA<CoOwnershipRepository>());
    });
  });

  group('coOwnersProvider', () {
    test('returns the co-owners for a horse', () async {
      when(
        () => mockRepository.fetchCoOwners('horse-1'),
      ).thenAnswer((_) async => Result.ok([_record()]));

      final container = containerWith();
      addTearDown(container.dispose);

      final result = await container.read(coOwnersProvider('horse-1').future);

      expect(result, hasLength(1));
      expect(result.single.id, 'co-1');
    });

    test('rethrows the repository failure via getOrThrow', () async {
      when(() => mockRepository.fetchCoOwners(any())).thenAnswer(
        (_) async => Result.fail(
          const AppException(code: 'FETCH_CO_OWNERS_ERROR', message: 'Алдаа'),
        ),
      );

      final container = containerWith();
      addTearDown(container.dispose);

      expect(
        () => container.read(coOwnersProvider('horse-1').future),
        throwsA(isA<AppException>()),
      );
    });

    test('is cached per horse and recomputes on invalidation', () async {
      final horseIds = <String>[];
      when(() => mockRepository.fetchCoOwners(any())).thenAnswer((inv) async {
        horseIds.add(inv.positionalArguments.first as String);
        return Result.ok(const <CoOwnershipRecord>[]);
      });

      final container = containerWith();
      addTearDown(container.dispose);

      await container.read(coOwnersProvider('h1').future);
      await container.read(coOwnersProvider('h2').future);
      // Different horses are fetched independently.
      expect(horseIds, ['h1', 'h2']);

      container.invalidate(coOwnersProvider('h1'));
      await container.read(coOwnersProvider('h1').future);
      // Only h1 is refetched after invalidation.
      expect(horseIds, ['h1', 'h2', 'h1']);
    });
  });

  group('coOwnersStreamProvider', () {
    test('wraps fetchCoOwners when the repo has no watch stream', () async {
      when(() => mockRepository.watchCoOwners('horse-1')).thenReturn(null);
      when(
        () => mockRepository.fetchCoOwners('horse-1'),
      ).thenAnswer((_) async => Result.ok([_record()]));

      final container = containerWith();
      addTearDown(container.dispose);

      final result = await container.read(
        coOwnersStreamProvider('horse-1').future,
      );

      expect(result, hasLength(1));
      expect(result.single.id, 'co-1');
    });

    test('uses the repository watch stream when available', () async {
      when(
        () => mockRepository.watchCoOwners('horse-1'),
      ).thenAnswer((_) => Stream.value([_record(id: 'streamed')]));

      final container = containerWith();
      addTearDown(container.dispose);

      final result = await container.read(
        coOwnersStreamProvider('horse-1').future,
      );

      expect(result.single.id, 'streamed');
      verifyNever(() => mockRepository.fetchCoOwners(any()));
    });
  });
}
