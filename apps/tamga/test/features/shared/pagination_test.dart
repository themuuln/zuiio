import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/shared/data/pagination/pagination_state.dart';

void main() {
  // ── PaginationState (pure value tests) ─────────────────────────────
  group('PaginationState', () {
    test('initial state', () {
      const s = PaginationState<int>();
      expect(s.items, isEmpty);
      expect(s.isLoading, false);
      expect(s.hasMore, true);
      expect(s.error, isNull);
      expect(s.currentPage, 0);
      expect(s.isEmpty, true);
      expect(s.hasError, false);
    });

    test('copyWith preserves values', () {
      const o = PaginationState<String>(items: ['a', 'b'], currentPage: 1);
      final u = o.copyWith(isLoading: true);
      expect(u.items, ['a', 'b']);
      expect(u.isLoading, true);
      expect(u.hasMore, true);
      expect(u.currentPage, 1);
    });

    test('copyWith clearError', () {
      const o = PaginationState<int>(error: 'err');
      expect(o.copyWith(clearError: true).error, isNull);
    });

    test('copyWith sets error', () {
      expect(const PaginationState<int>().copyWith(error: 'e').error, 'e');
    });

    test('isEmpty when empty and not loading', () {
      expect(const PaginationState<int>().isEmpty, true);
    });

    test('isEmpty false when items present', () {
      expect(const PaginationState<int>(items: [1]).isEmpty, false);
    });

    test('isEmpty false when loading', () {
      expect(const PaginationState<int>(isLoading: true).isEmpty, false);
    });

    test('hasError true when error set', () {
      expect(const PaginationState<int>(error: 'x').hasError, true);
    });
  });

  // ── PaginationNotifier (async state tests) ─────────────────────────
  group('PaginationNotifier', () {
    // Helper: attach listener (required for StateNotifier propagation),
    // run action, await, then return fresh state.
    Future<PaginationState<T>> run<T>(
      PaginationNotifier<T> n,
      Future<void> Function(PaginationNotifier<T>) action,
    ) async {
      n.addListener((_) {}); // keeps notifier "alive"
      await action(n);
      return n.state;
    }

    test('loadInitial fetches first page', () async {
      final n = PaginationNotifier<int>(
        fetchPage: (page, _) async => page == 0 ? [1, 2, 3] : [],
        pageSize: 3,
      );
      final s = await run(n, (n) => n.loadInitial());
      expect(s.items, [1, 2, 3]);
      expect(s.currentPage, 0);
      expect(s.hasMore, true);
      expect(s.isLoading, false);
    });

    test('loadMore appends items', () async {
      final n = PaginationNotifier<int>(
        fetchPage: (page, _) async {
          if (page == 0) return [1, 2, 3];
          if (page == 1) return [4, 5, 6];
          return [];
        },
        pageSize: 3,
      );
      await run(n, (n) => n.loadInitial());
      final s = await run(n, (n) => n.loadMore());
      expect(s.items, [1, 2, 3, 4, 5, 6]);
      expect(s.currentPage, 1);
      expect(s.hasMore, true);
    });

    test('loadMore stops when fewer items returned', () async {
      final n = PaginationNotifier<int>(
        fetchPage: (page, _) async {
          if (page == 0) return [1, 2, 3];
          return [4]; // < pageSize
        },
        pageSize: 3,
      );
      await run(n, (n) => n.loadInitial());
      final s = await run(n, (n) => n.loadMore());
      expect(s.items, [1, 2, 3, 4]);
      expect(s.hasMore, false);
    });

    test('loadMore skips when hasMore is false', () async {
      int count = 0;
      final n = PaginationNotifier<int>(
        fetchPage: (page, _) async {
          count++;
          return [1, 2]; // < pageSize → hasMore = false
        },
        pageSize: 3,
      );
      await run(n, (n) => n.loadInitial());
      expect(n.state.hasMore, false);
      expect(count, 1);

      await run(n, (n) => n.loadMore());
      expect(count, 1); // no extra fetch
    });

    test('refresh resets to first page', () async {
      final n = PaginationNotifier<int>(
        fetchPage: (page, _) async {
          if (page == 0) return [1, 2, 3];
          return [4, 5, 6];
        },
        pageSize: 3,
      );
      await run(n, (n) => n.loadInitial());
      await run(n, (n) => n.loadMore());
      expect(n.state.items, [1, 2, 3, 4, 5, 6]);

      final s = await run(n, (n) => n.refresh());
      expect(s.items, [1, 2, 3]);
      expect(s.currentPage, 0);
    });

    test('error is captured in state', () async {
      final n = PaginationNotifier<int>(
        fetchPage: (_, _) async => throw Exception('network error'),
        pageSize: 3,
      );
      final s = await run(n, (n) => n.loadInitial());
      expect(s.hasError, true);
      expect(s.error.toString(), contains('network error'));
      expect(s.items, isEmpty);
    });

    test('loadInitial clears previous error', () async {
      final n = PaginationNotifier<int>(
        fetchPage: (_, _) async => throw Exception('fail'),
        pageSize: 3,
      );
      await run(n, (n) => n.loadInitial());
      expect(n.state.hasError, true);

      final n2 = PaginationNotifier<int>(
        fetchPage: (_, _) async => [1, 2, 3],
        pageSize: 3,
      );
      final s = await run(n2, (n) => n.loadInitial());
      expect(s.hasError, false);
      expect(s.items, [1, 2, 3]);
    });
  });
}
