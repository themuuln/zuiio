import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:tamga/src/core/error/app_exception.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/features/health/application/health_providers.dart';
import 'package:tamga/src/features/health/data/health_repository.dart';
import 'package:tamga/src/features/shared/data/pagination/paginated_result.dart';

import '../../../helpers/test_helpers.dart';

class MockHealthRepository extends Mock implements HealthRepository {}

void main() {
  late MockHealthRepository mockRepository;

  setUp(() {
    mockRepository = MockHealthRepository();
  });

  ProviderContainer createContainer() {
    return ProviderContainer(
      overrides: [
        // The override create function MUST be synchronous: the provider body
        // reads `ref.read(healthRepositoryProvider).requireValue`, which throws
        // while the FutureProvider is still loading. An `async` closure keeps
        // it in the loading state until a later microtask.
        healthRepositoryProvider.overrideWith((ref) => mockRepository),
      ],
    );
  }

  group('paginatedHealthLogsProvider', () {
    test('loads first page on creation with page size 20', () async {
      final logs = List.generate(
        5,
        (i) => createMockHealthLog(id: 'log-$i', horseId: 'h1'),
      );

      when(
        () => mockRepository.fetchAllByHorsePaginated(
          horseId: any(named: 'horseId'),
          page: any(named: 'page'),
          limit: any(named: 'limit'),
        ),
      ).thenAnswer(
        (_) async => Result.ok(PaginatedResult(items: logs, totalCount: 5)),
      );

      final container = createContainer();
      addTearDown(container.dispose);

      final notifier = container.read(
        paginatedHealthLogsProvider('h1').notifier,
      );
      await Future<void>.delayed(Duration.zero);

      expect(notifier.state.isLoading, false);
      expect(notifier.state.items.length, 5);
      expect(notifier.state.items.first.id, 'log-0');

      verify(
        () => mockRepository.fetchAllByHorsePaginated(
          horseId: 'h1',
          page: 0,
          limit: 20,
        ),
      ).called(1);
    });

    test(
      'loadMore appends next page and flips hasMore on short page',
      () async {
        when(
          () => mockRepository.fetchAllByHorsePaginated(
            horseId: any(named: 'horseId'),
            page: any(named: 'page'),
            limit: any(named: 'limit'),
          ),
        ).thenAnswer((invocation) async {
          final page = invocation.namedArguments[#page] as int;
          if (page == 0) {
            final items = List.generate(
              20,
              (i) => createMockHealthLog(id: 'p0-$i', horseId: 'h1'),
            );
            return Result.ok(PaginatedResult(items: items, totalCount: 25));
          }
          final items = List.generate(
            5,
            (i) => createMockHealthLog(id: 'p1-$i', horseId: 'h1'),
          );
          return Result.ok(PaginatedResult(items: items, totalCount: 25));
        });

        final container = createContainer();
        addTearDown(container.dispose);

        final notifier = container.read(
          paginatedHealthLogsProvider('h1').notifier,
        );
        await Future<void>.delayed(Duration.zero);

        expect(notifier.state.hasMore, true);
        expect(notifier.state.items.length, 20);

        await notifier.loadMore();
        expect(notifier.state.hasMore, false);
        expect(notifier.state.items.length, 25);
        expect(notifier.state.items.last.id, 'p1-4');
      },
    );

    test('invalidating the provider recomputes from repository', () async {
      var fetchCount = 0;

      when(
        () => mockRepository.fetchAllByHorsePaginated(
          horseId: any(named: 'horseId'),
          page: any(named: 'page'),
          limit: any(named: 'limit'),
        ),
      ).thenAnswer((_) async {
        fetchCount++;
        return Result.ok(
          PaginatedResult(
            items: [createMockHealthLog(id: 'inv-$fetchCount', horseId: 'h1')],
            totalCount: 1,
          ),
        );
      });

      final container = createContainer();
      addTearDown(container.dispose);

      final first = container.read(paginatedHealthLogsProvider('h1').notifier);
      await Future<void>.delayed(Duration.zero);
      expect(fetchCount, 1);
      expect(first.state.items.single.id, 'inv-1');

      container.invalidate(paginatedHealthLogsProvider('h1'));
      final second = container.read(paginatedHealthLogsProvider('h1').notifier);
      await Future<void>.delayed(Duration.zero);
      expect(fetchCount, 2);
      expect(second.state.items.single.id, 'inv-2');
      expect(identical(first, second), false);
    });

    test('repository failure surfaces error state', () async {
      when(
        () => mockRepository.fetchAllByHorsePaginated(
          horseId: any(named: 'horseId'),
          page: any(named: 'page'),
          limit: any(named: 'limit'),
        ),
      ).thenAnswer(
        (_) async => Result.fail(
          const AppException(message: 'db error', code: 'DB_ERROR'),
        ),
      );

      final container = createContainer();
      addTearDown(container.dispose);

      final notifier = container.read(
        paginatedHealthLogsProvider('h1').notifier,
      );
      await Future<void>.delayed(Duration.zero);

      expect(notifier.state.hasError, true);
      expect(notifier.state.isLoading, false);
      expect(notifier.state.items, isEmpty);
    });
  });
}
