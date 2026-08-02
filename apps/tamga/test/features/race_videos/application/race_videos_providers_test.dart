import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:tamga/src/core/error/app_exception.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/features/race_videos/application/race_videos_providers.dart';
import 'package:tamga/src/features/race_videos/data/race_videos_repository.dart';
import 'package:tamga/src/features/race_videos/domain/race_video.dart';

// ── Mock repository ─────────────────────────────────────────────────────

class MockRaceVideosRepository extends Mock implements RaceVideosRepository {}

// ── Helpers ─────────────────────────────────────────────────────────────

RaceVideo createVideo({String id = 'vid-1', String title = 'Наадам 2024'}) {
  return RaceVideo(
    id: id,
    uploaderId: 'user-1',
    title: title,
    videoUrl: 'https://example.com/video.mp4',
    raceName: 'Эртний морьд',
    category: 'Монгол',
    price3day: 1000,
    price1year: 5000,
    priceLifetime: 10000,
    viewCount: 42,
    published: true,
    durationSeconds: 3600,
  );
}

void main() {
  late MockRaceVideosRepository mockRepository;

  setUp(() {
    mockRepository = MockRaceVideosRepository();
  });

  ProviderContainer containerWith() {
    return ProviderContainer(
      overrides: [
        raceVideosRepositoryProvider.overrideWithValue(mockRepository),
      ],
    );
  }

  group('raceVideosProvider', () {
    test('returns videos fetched from the repository', () async {
      final videos = [
        createVideo(id: 'v1'),
        createVideo(id: 'v2', title: 'Бүгд'),
      ];
      when(
        () => mockRepository.fetchPublished(category: any(named: 'category')),
      ).thenAnswer((_) async => Result.ok(videos));

      final container = containerWith();
      addTearDown(container.dispose);

      final result = await container.read(raceVideosProvider('Монгол').future);

      expect(result, hasLength(2));
      expect(result[0].id, 'v1');
      expect(result[1].id, 'v2');
    });

    test('passes the family argument through as the category', () async {
      when(
        () => mockRepository.fetchPublished(category: 'Монгол'),
      ).thenAnswer((_) async => Result.ok([createVideo(id: 'v1')]));
      when(
        () => mockRepository.fetchPublished(category: 'Бүгд'),
      ).thenAnswer((_) async => Result.ok([createVideo(id: 'v2')]));
      when(
        () => mockRepository.fetchPublished(category: null),
      ).thenAnswer((_) async => Result.ok([createVideo(id: 'v3')]));

      final container = containerWith();
      addTearDown(container.dispose);

      final mongol = await container.read(raceVideosProvider('Монгол').future);
      expect(mongol.single.id, 'v1');
      final bugeed = await container.read(raceVideosProvider('Бүгд').future);
      expect(bugeed.single.id, 'v2');
      final all = await container.read(raceVideosProvider(null).future);
      expect(all.single.id, 'v3');
    });

    test('rethrows repository failures via getOrThrow', () async {
      when(
        () => mockRepository.fetchPublished(category: any(named: 'category')),
      ).thenAnswer(
        (_) async => Result.fail(
          const AppException(code: 'FETCH_FAILED', message: 'Алдаа'),
        ),
      );

      final container = containerWith();
      addTearDown(container.dispose);

      await expectLater(
        container.read(raceVideosProvider('Монгол').future),
        throwsA(isA<AppException>()),
      );
    });

    test('caches the result across repeated reads', () async {
      var calls = 0;
      when(
        () => mockRepository.fetchPublished(category: any(named: 'category')),
      ).thenAnswer((_) async {
        calls++;
        return Result.ok([createVideo(id: 'v1')]);
      });

      final container = containerWith();
      addTearDown(container.dispose);

      await container.read(raceVideosProvider('Монгол').future);
      await container.read(raceVideosProvider('Монгол').future);

      expect(calls, 1);
    });

    test('re-fetches after invalidation', () async {
      var calls = 0;
      when(() => mockRepository.fetchPublished(category: 'Монгол')).thenAnswer((
        _,
      ) async {
        calls++;
        return Result.ok([createVideo(id: 'v$calls')]);
      });

      final container = containerWith();
      addTearDown(container.dispose);

      final first = await container.read(raceVideosProvider('Монгол').future);
      expect(first.single.id, 'v1');

      container.invalidate(raceVideosProvider('Монгол'));

      final second = await container.read(raceVideosProvider('Монгол').future);
      expect(second.single.id, 'v2');
      expect(calls, 2);
    });

    test('invalidation is scoped to the invalidated family instance', () async {
      var mongolCalls = 0;
      var bugeedCalls = 0;
      when(() => mockRepository.fetchPublished(category: 'Монгол')).thenAnswer((
        _,
      ) async {
        mongolCalls++;
        return Result.ok([createVideo(id: 'v1')]);
      });
      when(() => mockRepository.fetchPublished(category: 'Бүгд')).thenAnswer((
        _,
      ) async {
        bugeedCalls++;
        return Result.ok([createVideo(id: 'v2')]);
      });

      final container = containerWith();
      addTearDown(container.dispose);

      await container.read(raceVideosProvider('Монгол').future);
      await container.read(raceVideosProvider('Бүгд').future);

      container.invalidate(raceVideosProvider('Монгол'));

      await container.read(raceVideosProvider('Монгол').future);
      await container.read(raceVideosProvider('Бүгд').future);

      expect(mongolCalls, 2);
      expect(bugeedCalls, 1);
    });
  });
}
