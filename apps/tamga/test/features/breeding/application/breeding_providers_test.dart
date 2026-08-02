import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:tamga/src/core/error/app_exception.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/features/breeding/application/breeding_notifications.dart';
import 'package:tamga/src/features/breeding/application/breeding_providers.dart';
import 'package:tamga/src/features/breeding/data/breeding_repository.dart';

import '../../../helpers/test_helpers.dart';

class MockBreedingRepository extends Mock implements BreedingRepository {}

void main() {
  late MockBreedingRepository mockRepository;

  setUpAll(() {
    TestWidgetsFlutterBinding.ensureInitialized();
  });

  setUp(() {
    mockRepository = MockBreedingRepository();
  });

  ProviderContainer containerWith() {
    return ProviderContainer(
      overrides: [
        breedingRepositoryProvider.overrideWith(
          (ref) => Future.value(mockRepository),
        ),
      ],
    );
  }

  group('breedingRecordsProvider', () {
    test('returns records from the repository', () async {
      final records = [
        createMockBreedingRecord(id: 'br-1'),
        createMockBreedingRecord(id: 'br-2'),
      ];
      when(
        () => mockRepository.fetchBreedingRecords(),
      ).thenAnswer((_) async => Result.ok(records));

      final container = containerWith();
      addTearDown(container.dispose);

      final result = await container.read(breedingRecordsProvider.future);

      expect(result, hasLength(2));
      expect(result.map((r) => r.id), ['br-1', 'br-2']);
    });

    test('rethrows repository failure via getOrThrow', () async {
      when(() => mockRepository.fetchBreedingRecords()).thenAnswer(
        (_) async => Result.fail(
          const AppException(code: 'FETCH_BREEDING_ERROR', message: 'Алдаа'),
        ),
      );

      final container = containerWith();
      addTearDown(container.dispose);

      expect(
        () => container.read(breedingRecordsProvider.future),
        throwsA(isA<AppException>()),
      );
    });

    test('re-reads the repository after invalidation', () async {
      var fetchCount = 0;
      when(() => mockRepository.fetchBreedingRecords()).thenAnswer((_) async {
        fetchCount++;
        return Result.ok([createMockBreedingRecord(id: 'br-$fetchCount')]);
      });

      final container = containerWith();
      addTearDown(container.dispose);

      await container.read(breedingRecordsProvider.future);
      expect(fetchCount, 1);

      container.invalidate(breedingRecordsProvider);
      final refreshed = await container.read(breedingRecordsProvider.future);

      expect(fetchCount, 2);
      expect(refreshed.single.id, 'br-2');
    });
  });

  group('breedingNotificationsProvider', () {
    test('resolves with the overridden repository', () async {
      // Inactive records → nothing is sent, even though the real
      // LocalNotificationService singleton is wired in internally.
      when(() => mockRepository.fetchBreedingRecords()).thenAnswer(
        (_) async => Result.ok([
          createMockBreedingRecord(id: 'br-foaled', status: 'Төллөсөн'),
        ]),
      );

      final container = containerWith();
      addTearDown(container.dispose);

      final notifications = await container.read(
        breedingNotificationsProvider.future,
      );
      final sent = await notifications.checkAllBreedingRecords();

      expect(sent, 0);
      verify(() => mockRepository.fetchBreedingRecords()).called(1);
    });
  });
}
